# Informatica to PySpark Workflow Converter

A web-based application that converts Informatica PowerCenter workflows to PySpark code and provides a user-friendly interface to test and execute the converted logic.

## 🌟 Features

- **XML Workflow Analysis**: Automatically parses Informatica XML workflow files
- **PySpark Code Generation**: Converts Informatica transformations to equivalent PySpark operations
- **Interactive Web UI**: Modern, responsive interface for configuration and testing
- **File Upload & Testing**: Upload CSV test data and execute workflows
- **Business Logic Visualization**: Clear display of transformation steps and configuration
- **Results Download**: Export processed results as CSV files
- **Demo Mode**: Works without PySpark installation for demonstration purposes

## 🔧 Architecture

### Business Logic Extracted from XML:
1. **Source Qualifier**: Read bank transaction CSV data
2. **Expression Transformation**: Data normalization and type conversion
3. **Sorter Transformation**: Sort data for deduplication
4. **Aggregator Transformation**: Group by Transaction_ID and get latest records
5. **Target Logic**: Apply SCD Type 1 merge operations

### PySpark Implementation:
- **DataFrame Operations**: Efficient data processing using Spark DataFrames
- **Window Functions**: Advanced analytics for deduplication
- **Type Conversion**: Proper schema handling and data type casting
- **Error Handling**: Robust error management and logging

## 📋 Requirements

### Required Dependencies:
- Python 3.7+
- Flask 2.3.3
- pandas 2.0.3
- Werkzeug 2.3.7

### Optional Dependencies (for full functionality):
- PySpark 3.4.1
- findspark 2.0.1

## 🚀 Quick Start

1. **Clone or download the project files**

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application:**
   ```bash
   python run_app.py
   ```

4. **Access the web interface:**
   - Open your browser and go to: http://localhost:5000
   - The application will automatically detect if PySpark is available

## 📱 Usage Guide

### 1. View Business Logic Configuration
- The left panel displays the extracted business logic from the Informatica XML
- Shows transformation steps, configuration parameters, and workflow diagram

### 2. Upload Test Data
- Click "Choose File" or drag & drop a CSV file
- Supported format: CSV files with headers
- Maximum file size: 16MB
- The application will analyze and display file information

### 3. Execute Workflow
- Once a file is uploaded, the "Run Workflow" button becomes enabled
- Click to execute the PySpark workflow on your test data
- View real-time execution status and progress

### 4. View Results
- Processed results are displayed in a table format
- Shows summary statistics (total records, columns, etc.)
- First 100 rows are displayed in the UI

### 5. Download Results
- Click "Download CSV" to export the complete processed dataset
- Results include all transformations and metadata

## 🔍 Sample Data Format

The application expects CSV files with the following structure (based on the bank_transactions.csv):

```csv
Transaction_ID,Customer_ID,Transaction_Date,Transaction_Type,Amount,Account_Balance,Branch_Code,Channel,Status,Last_Updated_Timestamp,Record_Operation
1001,501,2023-09-01,DEPOSIT,15000.00,45000.00,BR001,ONLINE,SUCCESS,2025-09-01 10:15:00,INSERT
1002,502,2023-09-01,WITHDRAWAL,5000.00,20000.00,BR002,ATM,SUCCESS,2025-09-01 11:00:00,INSERT
```

## 🏗️ Project Structure

```
├── app.py                 # Flask web application
├── pyspark_workflow.py    # PySpark workflow implementation
├── run_app.py            # Application startup script
├── requirements.txt      # Python dependencies
├── wf_test_dev.XML      # Source Informatica workflow
├── bank_transactions.csv # Sample test data
├── templates/
│   └── index.html       # Main web interface
├── static/
│   ├── css/
│   │   └── style.css    # Custom styling
│   └── js/
│       └── app.js       # Frontend JavaScript
└── uploads/             # Uploaded files (auto-created)
```

## 🔄 Workflow Transformations

### Original Informatica Flow:
```
Source → Expression → Sorter → Aggregator → Target
```

### PySpark Implementation:
1. **read_source_data()**: Load CSV with proper schema
2. **apply_expression_transformation()**: Type conversion and null handling
3. **apply_sort_dedup()**: Sort data for deduplication preparation
4. **apply_aggregator_transformation()**: Window functions for deduplication
5. **apply_target_logic()**: Add processing metadata

## 🎯 Key Features Explained

### Deduplication Logic:
- Groups records by `Transaction_ID`
- Keeps the latest record based on `Last_Updated_Timestamp`
- Uses PySpark Window functions for efficient processing

### Data Type Handling:
- Converts string dates to proper date/timestamp types
- Handles decimal precision for financial amounts
- Manages null character replacement (`*` → `null`)

### Error Handling:
- Comprehensive error catching and user feedback
- Graceful degradation when PySpark is not available
- Input validation for file uploads

## 🔧 Configuration Options

The workflow supports various configuration parameters:

- **datetime_format**: Date/time parsing format
- **null_character**: Character to treat as null
- **delimiter**: CSV field separator
- **dedup_enabled**: Enable/disable deduplication
- **sort_columns**: Columns for sorting operations
- **group_by_column**: Primary key for grouping

## 🐛 Troubleshooting

### Common Issues:

1. **PySpark Not Available**:
   - The application will run in demo mode using pandas
   - Install PySpark for full functionality: `pip install pyspark`

2. **File Upload Fails**:
   - Check file size (max 16MB)
   - Ensure file has .csv extension
   - Verify CSV format with proper headers

3. **Execution Errors**:
   - Check that uploaded data matches expected schema
   - Review error messages in the UI alerts
   - Ensure sufficient system memory for large files

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve the application.

## 📄 License

This project is provided as-is for educational and demonstration purposes.

---

**🚀 Ready to convert your Informatica workflows to PySpark? Start the application and upload your test data!**
