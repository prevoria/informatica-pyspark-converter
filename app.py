from flask import Flask, render_template, request, jsonify, send_file
import os
import pandas as pd
import json
from datetime import datetime
import tempfile
import traceback
from werkzeug.utils import secure_filename
import uuid

# Import our PySpark workflow
try:
    from pyspark_workflow import InformaticaToPySparkWorkflow
    PYSPARK_AVAILABLE = True
except ImportError:
    print("⚠️  PySpark not available. Running in demo mode.")
    PYSPARK_AVAILABLE = False

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Global variables to store workflow state
workflow_instance = None
current_results = None
uploaded_file_info = None

def get_demo_business_logic():
    """Return demo business logic when PySpark is not available"""
    return {
        "workflow_name": "Bank Transaction Processing Workflow (Demo Mode)",
        "description": "Process bank transaction data with deduplication and SCD Type 1 logic",
        "steps": [
            {
                "step": 1,
                "name": "Source Qualifier",
                "description": "Read bank transaction CSV file",
                "transformation_type": "Source",
                "details": "Load CSV with 11 columns including Transaction_ID, Customer_ID, Amount, etc."
            },
            {
                "step": 2,
                "name": "Expression Transformation",
                "description": "Data normalization and type conversion",
                "transformation_type": "Expression",
                "details": "Convert date strings to date types, handle null characters (*)"
            },
            {
                "step": 3,
                "name": "Sorter Transformation",
                "description": "Sort data for deduplication",
                "transformation_type": "Sorter",
                "details": "Sort by: Transaction_ID, Customer_ID, Transaction_Date, etc."
            },
            {
                "step": 4,
                "name": "Aggregator Transformation", 
                "description": "Deduplicate by Transaction_ID",
                "transformation_type": "Aggregator",
                "details": "Group by Transaction_ID, get latest record by Last_Updated_Timestamp"
            },
            {
                "step": 5,
                "name": "Target Logic",
                "description": "Prepare final output with metadata",
                "transformation_type": "Target",
                "details": "Add processing timestamp and batch ID for tracking"
            }
        ],
        "configuration": {
            "datetime_format": "yyyy-MM-dd HH:mm:ss",
            "null_character": "*",
            "delimiter": ",",
            "skip_header": True,
            "dedup_enabled": True,
            "group_by_column": "Transaction_ID"
        }
    }

def process_with_pandas(file_path):
    """Process data using pandas when PySpark is not available"""
    try:
        # Read CSV
        df = pd.read_csv(file_path)
        
        # Basic transformations
        df['Transaction_Date'] = pd.to_datetime(df['Transaction_Date'], errors='coerce')
        df['Last_Updated_Timestamp'] = pd.to_datetime(df['Last_Updated_Timestamp'], errors='coerce')
        
        # Sort by Last_Updated_Timestamp descending for each Transaction_ID
        df_sorted = df.sort_values(['Transaction_ID', 'Last_Updated_Timestamp'], 
                                 ascending=[True, False])
        
        # Keep only the latest record for each Transaction_ID (deduplication)
        df_deduped = df_sorted.drop_duplicates(subset=['Transaction_ID'], keep='first')
        
        # Add processing metadata
        df_deduped = df_deduped.copy()  # Fix pandas warning
        df_deduped['processing_timestamp'] = datetime.now()
        df_deduped['batch_id'] = f"batch_{int(datetime.now().timestamp())}"
        
        return df_deduped
        
    except Exception as e:
        raise Exception(f"Error processing file with pandas: {str(e)}")

@app.route('/')
def index():
    """Main application page"""
    return render_template('index.html')

@app.route('/api/business-logic')
def get_business_logic():
    """API endpoint to get business logic configuration"""
    global workflow_instance
    
    try:
        if PYSPARK_AVAILABLE:
            if workflow_instance is None:
                workflow_instance = InformaticaToPySparkWorkflow()
            business_logic = workflow_instance.get_business_logic_summary()
        else:
            business_logic = get_demo_business_logic()
        
        return jsonify({
            'success': True,
            'data': business_logic,
            'pyspark_available': PYSPARK_AVAILABLE
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """API endpoint to handle file uploads"""
    global uploaded_file_info
    
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if not file.filename.lower().endswith('.csv'):
            return jsonify({'success': False, 'error': 'Only CSV files are supported'}), 400
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        
        # Analyze file structure
        try:
            df_sample = pd.read_csv(file_path, nrows=5)
            file_info = {
                'filename': filename,
                'file_path': file_path,
                'columns': df_sample.columns.tolist(),
                'sample_data': df_sample.to_dict('records'),
                'total_rows': len(pd.read_csv(file_path)),
                'file_size': os.path.getsize(file_path)
            }
            uploaded_file_info = file_info
            
            return jsonify({
                'success': True,
                'message': f'File "{filename}" uploaded successfully',
                'file_info': file_info
            })
            
        except Exception as e:
            os.remove(file_path)  # Clean up on error
            return jsonify({
                'success': False,
                'error': f'Error analyzing uploaded file: {str(e)}'
            }), 400
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/api/execute', methods=['POST'])
def execute_workflow():
    """API endpoint to execute the workflow on uploaded data"""
    global workflow_instance, current_results, uploaded_file_info
    
    try:
        if uploaded_file_info is None:
            return jsonify({
                'success': False,
                'error': 'No file uploaded. Please upload a test data file first.'
            }), 400
        
        file_path = uploaded_file_info['file_path']
        
        if PYSPARK_AVAILABLE:
            # Execute with PySpark
            if workflow_instance is None:
                workflow_instance = InformaticaToPySparkWorkflow()
            
            result_df = workflow_instance.execute_workflow(file_path)
            
            # Convert to pandas for JSON serialization
            result_pandas = result_df.toPandas()
            
            # Convert timestamps to strings for JSON serialization
            for col in result_pandas.columns:
                if result_pandas[col].dtype == 'datetime64[ns]':
                    result_pandas[col] = result_pandas[col].astype(str)
            
            results = {
                'total_records': len(result_pandas),
                'columns': result_pandas.columns.tolist(),
                'data': result_pandas.to_dict('records')[:100],  # Limit to first 100 rows for UI
                'execution_method': 'PySpark'
            }
        
        else:
            # Execute with pandas (demo mode)
            result_pandas = process_with_pandas(file_path)
            
            # Convert timestamps to strings for JSON serialization
            for col in result_pandas.columns:
                if result_pandas[col].dtype == 'datetime64[ns]':
                    result_pandas[col] = result_pandas[col].astype(str)
            
            results = {
                'total_records': len(result_pandas),
                'columns': result_pandas.columns.tolist(),
                'data': result_pandas.to_dict('records')[:100],  # Limit to first 100 rows for UI
                'execution_method': 'Pandas (Demo Mode)'
            }
        
        current_results = results
        
        return jsonify({
            'success': True,
            'message': 'Workflow executed successfully',
            'results': results
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/api/download-results')
def download_results():
    """API endpoint to download execution results as CSV"""
    global current_results
    
    try:
        if current_results is None:
            return jsonify({
                'success': False,
                'error': 'No results available. Please execute the workflow first.'
            }), 400
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False)
        
        # Convert results to DataFrame and save as CSV
        df = pd.DataFrame(current_results['data'])
        df.to_csv(temp_file.name, index=False)
        temp_file.close()
        
        return send_file(
            temp_file.name,
            as_attachment=True,
            download_name=f'workflow_results_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv',
            mimetype='text/csv'
        )
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/reset')
def reset_workflow():
    """API endpoint to reset workflow state"""
    global workflow_instance, current_results, uploaded_file_info
    
    try:
        # Clean up uploaded files
        if uploaded_file_info and os.path.exists(uploaded_file_info['file_path']):
            os.remove(uploaded_file_info['file_path'])
        
        # Reset global state
        uploaded_file_info = None
        current_results = None
        
        # Stop PySpark session if running
        if PYSPARK_AVAILABLE and workflow_instance:
            workflow_instance.stop()
            workflow_instance = None
        
        return jsonify({
            'success': True,
            'message': 'Workflow state reset successfully'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/dashboard')
def dashboard():
    """Dashboard page route"""
    return render_template('dashboard.html')

@app.route('/api/dashboard-data')
def get_dashboard_data():
    """API endpoint to get dashboard analysis data"""
    global uploaded_file_info, current_results
    
    try:
        if not uploaded_file_info or not current_results:
            return jsonify({
                'success': False,
                'error': 'No data available. Please execute workflow first.'
            }), 400
        
        # Read original data for before analysis
        original_df = pd.read_csv(uploaded_file_info['file_path'])
        
        # Convert processed results to DataFrame
        processed_df = pd.DataFrame(current_results['data'])
        
        # Analyze both datasets
        dashboard_data = analyze_before_after_data(original_df, processed_df)
        
        return jsonify({
            'success': True,
            'data': dashboard_data
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

def analyze_before_after_data(before_df, after_df):
    """Analyze before and after data for dashboard"""
    
    # Convert date columns for proper analysis
    before_df['Transaction_Date'] = pd.to_datetime(before_df['Transaction_Date'], errors='coerce')
    before_df['Last_Updated_Timestamp'] = pd.to_datetime(before_df['Last_Updated_Timestamp'], errors='coerce')
    
    # Handle after_df date conversion (might be strings from JSON)
    if 'Transaction_Date' in after_df.columns:
        after_df['Transaction_Date'] = pd.to_datetime(after_df['Transaction_Date'], errors='coerce')
    if 'Last_Updated_Timestamp' in after_df.columns:
        after_df['Last_Updated_Timestamp'] = pd.to_datetime(after_df['Last_Updated_Timestamp'], errors='coerce')
    
    # Convert amount columns to numeric
    before_df['Amount'] = pd.to_numeric(before_df['Amount'], errors='coerce')
    if 'Amount' in after_df.columns:
        after_df['Amount'] = pd.to_numeric(after_df['Amount'], errors='coerce')
    
    analysis = {
        'summary': {
            'before': {
                'total_records': len(before_df),
                'total_amount': float(before_df['Amount'].sum()) if 'Amount' in before_df.columns else 0,
                'avg_amount': float(before_df['Amount'].mean()) if 'Amount' in before_df.columns else 0,
                'unique_transactions': len(before_df['Transaction_ID'].unique()) if 'Transaction_ID' in before_df.columns else 0,
                'date_range': {
                    'start': before_df['Transaction_Date'].min().strftime('%Y-%m-%d') if before_df['Transaction_Date'].notna().any() else None,
                    'end': before_df['Transaction_Date'].max().strftime('%Y-%m-%d') if before_df['Transaction_Date'].notna().any() else None
                }
            },
            'after': {
                'total_records': len(after_df),
                'total_amount': float(after_df['Amount'].sum()) if 'Amount' in after_df.columns else 0,
                'avg_amount': float(after_df['Amount'].mean()) if 'Amount' in after_df.columns else 0,
                'unique_transactions': len(after_df['Transaction_ID'].unique()) if 'Transaction_ID' in after_df.columns else 0,
                'date_range': {
                    'start': after_df['Transaction_Date'].min().strftime('%Y-%m-%d') if 'Transaction_Date' in after_df.columns and after_df['Transaction_Date'].notna().any() else None,
                    'end': after_df['Transaction_Date'].max().strftime('%Y-%m-%d') if 'Transaction_Date' in after_df.columns and after_df['Transaction_Date'].notna().any() else None
                }
            }
        },
        
        'distributions': {
            'transaction_type': {
                'before': before_df['Transaction_Type'].value_counts().to_dict() if 'Transaction_Type' in before_df.columns else {},
                'after': after_df['Transaction_Type'].value_counts().to_dict() if 'Transaction_Type' in after_df.columns else {}
            },
            'status': {
                'before': before_df['Status'].value_counts().to_dict() if 'Status' in before_df.columns else {},
                'after': after_df['Status'].value_counts().to_dict() if 'Status' in after_df.columns else {}
            },
            'channel': {
                'before': before_df['Channel'].value_counts().to_dict() if 'Channel' in before_df.columns else {},
                'after': after_df['Channel'].value_counts().to_dict() if 'Channel' in after_df.columns else {}
            },
            'branch': {
                'before': before_df['Branch_Code'].value_counts().to_dict() if 'Branch_Code' in before_df.columns else {},
                'after': after_df['Branch_Code'].value_counts().to_dict() if 'Branch_Code' in after_df.columns else {}
            }
        },
        
        'amount_analysis': {
            'before': {
                'histogram': create_amount_histogram(before_df['Amount']) if 'Amount' in before_df.columns else [],
                'stats': {
                    'min': float(before_df['Amount'].min()) if 'Amount' in before_df.columns else 0,
                    'max': float(before_df['Amount'].max()) if 'Amount' in before_df.columns else 0,
                    'median': float(before_df['Amount'].median()) if 'Amount' in before_df.columns else 0,
                    'std': float(before_df['Amount'].std()) if 'Amount' in before_df.columns else 0
                }
            },
            'after': {
                'histogram': create_amount_histogram(after_df['Amount']) if 'Amount' in after_df.columns else [],
                'stats': {
                    'min': float(after_df['Amount'].min()) if 'Amount' in after_df.columns else 0,
                    'max': float(after_df['Amount'].max()) if 'Amount' in after_df.columns else 0,
                    'median': float(after_df['Amount'].median()) if 'Amount' in after_df.columns else 0,
                    'std': float(after_df['Amount'].std()) if 'Amount' in after_df.columns else 0
                }
            }
        },
        
        'time_series': {
            'before': create_time_series_data(before_df),
            'after': create_time_series_data(after_df)
        },
        
        'impact_metrics': {
            'duplicate_reduction': {
                'original_count': len(before_df),
                'final_count': len(after_df),
                'duplicates_removed': len(before_df) - len(after_df),
                'reduction_percentage': round(((len(before_df) - len(after_df)) / len(before_df)) * 100, 2) if len(before_df) > 0 else 0
            },
            'data_quality': {
                'completeness_before': calculate_completeness(before_df),
                'completeness_after': calculate_completeness(after_df),
                'accuracy_improvement': 'Enhanced through deduplication'
            }
        },
        
        'filter_options': {
            'transaction_types': list(before_df['Transaction_Type'].unique()) if 'Transaction_Type' in before_df.columns else [],
            'statuses': list(before_df['Status'].unique()) if 'Status' in before_df.columns else [],
            'channels': list(before_df['Channel'].unique()) if 'Channel' in before_df.columns else [],
            'branches': list(before_df['Branch_Code'].unique()) if 'Branch_Code' in before_df.columns else [],
            'amount_range': {
                'min': float(before_df['Amount'].min()) if 'Amount' in before_df.columns else 0,
                'max': float(before_df['Amount'].max()) if 'Amount' in before_df.columns else 0
            }
        }
    }
    
    return analysis

def create_amount_histogram(amounts, bins=10):
    """Create histogram data for amount analysis"""
    try:
        amounts_clean = amounts.dropna()
        if len(amounts_clean) == 0:
            return []
        
        hist, bin_edges = pd.cut(amounts_clean, bins=bins, retbins=True)
        histogram_data = []
        
        for i in range(len(bin_edges) - 1):
            count = len(amounts_clean[(amounts_clean >= bin_edges[i]) & (amounts_clean < bin_edges[i + 1])])
            histogram_data.append({
                'range': f"${bin_edges[i]:.0f}-${bin_edges[i + 1]:.0f}",
                'count': count,
                'min_value': float(bin_edges[i]),
                'max_value': float(bin_edges[i + 1])
            })
        
        return histogram_data
    except Exception:
        return []

def create_time_series_data(df):
    """Create time series data for transaction volume analysis"""
    try:
        if 'Transaction_Date' not in df.columns:
            return []
        
        df_clean = df.dropna(subset=['Transaction_Date'])
        if len(df_clean) == 0:
            return []
        
        # Group by date and count transactions
        daily_counts = df_clean.groupby(df_clean['Transaction_Date'].dt.date).size()
        
        time_series = []
        for date, count in daily_counts.items():
            time_series.append({
                'date': date.strftime('%Y-%m-%d'),
                'count': int(count)
            })
        
        return sorted(time_series, key=lambda x: x['date'])
    except Exception:
        return []

def calculate_completeness(df):
    """Calculate data completeness percentage"""
    try:
        total_cells = df.size
        non_null_cells = df.count().sum()
        completeness = (non_null_cells / total_cells) * 100 if total_cells > 0 else 0
        return round(completeness, 2)
    except Exception:
        return 0

if __name__ == '__main__':
    print("🚀 Starting Informatica to PySpark Workflow UI...")
    print(f"📊 PySpark Available: {PYSPARK_AVAILABLE}")
    print("🌐 Access the application at: http://localhost:5000")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
