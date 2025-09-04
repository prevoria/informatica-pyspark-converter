#!/usr/bin/env python3
"""
Demo script to showcase the PySpark workflow without the web interface
"""

import pandas as pd
from datetime import datetime

def demo_pandas_workflow():
    """
    Demonstrate the workflow using pandas (for when PySpark is not available)
    """
    print("🚀 Running Informatica to PySpark Workflow Demo")
    print("=" * 60)
    
    # Step 1: Read source data
    print("📊 Step 1: Reading bank_transactions.csv...")
    try:
        df = pd.read_csv('bank_transactions.csv')
        print(f"✅ Loaded {len(df)} records")
        print(f"📋 Columns: {list(df.columns)}")
    except FileNotFoundError:
        print("❌ bank_transactions.csv not found!")
        return
    
    # Step 2: Display original data sample
    print("\n🔍 Original Data Sample:")
    print(df.head())
    
    # Step 3: Apply transformations
    print("\n🔄 Step 2: Applying transformations...")
    
    # Convert date columns
    df['Transaction_Date'] = pd.to_datetime(df['Transaction_Date'], errors='coerce')
    df['Last_Updated_Timestamp'] = pd.to_datetime(df['Last_Updated_Timestamp'], errors='coerce')
    
    # Handle null characters
    df = df.replace('*', None)
    
    print("✅ Date conversions and null handling completed")
    
    # Step 4: Sort and deduplicate
    print("\n🔄 Step 3: Sorting and deduplicating...")
    
    # Sort by Transaction_ID and Last_Updated_Timestamp (descending)
    df_sorted = df.sort_values(['Transaction_ID', 'Last_Updated_Timestamp'], 
                              ascending=[True, False])
    
    # Keep only the latest record for each Transaction_ID
    df_deduped = df_sorted.drop_duplicates(subset=['Transaction_ID'], keep='first')
    
    print(f"✅ Deduplication completed: {len(df)} → {len(df_deduped)} records")
    
    # Step 5: Add processing metadata
    print("\n🔄 Step 4: Adding processing metadata...")
    
    df_final = df_deduped.copy()
    df_final['processing_timestamp'] = datetime.now()
    df_final['batch_id'] = f"batch_{int(datetime.now().timestamp())}"
    
    print("✅ Processing metadata added")
    
    # Step 6: Display results
    print("\n📊 Final Results:")
    print("=" * 60)
    print(f"Total records processed: {len(df_final)}")
    print(f"Columns: {len(df_final.columns)}")
    
    print("\n🔍 Sample of processed data:")
    print(df_final[['Transaction_ID', 'Customer_ID', 'Transaction_Type', 
                   'Amount', 'Status', 'processing_timestamp']].head())
    
    # Step 7: Show business logic summary
    print("\n📋 Business Logic Applied:")
    print("1. ✅ Source Qualifier: Read CSV data with proper schema")
    print("2. ✅ Expression Transformation: Date conversion and null handling")
    print("3. ✅ Sorter Transformation: Sort by Transaction_ID and timestamp")
    print("4. ✅ Aggregator Transformation: Deduplicate by Transaction_ID")
    print("5. ✅ Target Logic: Add processing metadata")
    
    # Step 8: Statistics
    print(f"\n📈 Processing Statistics:")
    print(f"Original records: {len(df)}")
    print(f"Final records: {len(df_final)}")
    print(f"Duplicates removed: {len(df) - len(df_final)}")
    
    # Show transaction types distribution
    print(f"\n📊 Transaction Types Distribution:")
    type_counts = df_final['Transaction_Type'].value_counts()
    for trans_type, count in type_counts.items():
        print(f"  {trans_type}: {count}")
    
    # Show status distribution
    print(f"\n📊 Status Distribution:")
    status_counts = df_final['Status'].value_counts()
    for status, count in status_counts.items():
        print(f"  {status}: {count}")
    
    print("\n🎉 Demo completed successfully!")
    print("🌐 To use the web interface, run: python run_app.py")
    
    return df_final

def test_pyspark_workflow():
    """
    Test the actual PySpark workflow if available
    """
    try:
        from pyspark_workflow import InformaticaToPySparkWorkflow
        
        print("\n🔥 Testing PySpark Workflow...")
        print("=" * 40)
        
        # Initialize workflow
        workflow = InformaticaToPySparkWorkflow()
        
        # Execute workflow
        result_df = workflow.execute_workflow("bank_transactions.csv")
        
        # Show results
        print("\n📊 PySpark Results:")
        result_df.show(5, truncate=False)
        
        print(f"\nTotal records: {result_df.count()}")
        
        # Clean up
        workflow.stop()
        
        print("✅ PySpark workflow completed successfully!")
        
    except ImportError:
        print("\n⚠️  PySpark not available - skipping PySpark test")
    except Exception as e:
        print(f"\n❌ PySpark workflow error: {e}")

if __name__ == "__main__":
    # Run pandas demo
    result_df = demo_pandas_workflow()
    
    # Try PySpark workflow
    test_pyspark_workflow()
    
    print("\n" + "=" * 60)
    print("🚀 Ready to use the web application!")
    print("Run: python run_app.py")
    print("Then open: http://localhost:5000")
    print("=" * 60)
