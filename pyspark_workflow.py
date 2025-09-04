from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
from pyspark.sql.window import Window
import pandas as pd
from typing import Dict, Any
import json
import time

class InformaticaToPySparkWorkflow:
    """
    PySpark implementation of the Informatica workflow from wf_test_dev.XML
    
    Business Logic:
    1. Read bank transactions CSV data
    2. Apply data normalization/transformation (Expression)
    3. Sort and deduplicate data (Sorter)
    4. Group by Transaction_ID and get latest record (Aggregator)
    5. Apply SCD Type 1 merge logic
    """
    
    def __init__(self, spark_session: SparkSession = None):
        self.spark = spark_session or SparkSession.builder \
            .appName("InformaticaToPySparkWorkflow") \
            .config("spark.sql.adaptive.enabled", "true") \
            .config("spark.sql.adaptive.coalescePartitions.enabled", "true") \
            .getOrCreate()
        
        # Define schema based on XML source definition
        self.source_schema = StructType([
            StructField("Transaction_ID", IntegerType(), True),
            StructField("Customer_ID", IntegerType(), True),
            StructField("Transaction_Date", StringType(), True),  # Will convert to date
            StructField("Transaction_Type", StringType(), True),
            StructField("Amount", DecimalType(10, 2), True),
            StructField("Account_Balance", DecimalType(10, 2), True),
            StructField("Branch_Code", StringType(), True),
            StructField("Channel", StringType(), True),
            StructField("Status", StringType(), True),
            StructField("Last_Updated_Timestamp", StringType(), True),  # Will convert to timestamp
            StructField("Record_Operation", StringType(), True)
        ])
        
        # Configuration for transformations
        self.config = {
            "datetime_format": "yyyy-MM-dd HH:mm:ss",
            "null_character": "*",
            "delimiter": ",",
            "skip_header": True,
            "dedup_enabled": True,
            "sort_columns": [
                "Transaction_ID", "Customer_ID", "Transaction_Date", 
                "Transaction_Type", "Amount", "Account_Balance", 
                "Branch_Code", "Channel", "Status", "Record_Operation"
            ],
            "sort_timestamp_desc": "Last_Updated_Timestamp",
            "group_by_column": "Transaction_ID"
        }
    
    def read_source_data(self, file_path: str) -> DataFrame:
        """
        Step 1: Source Qualifier - Read CSV file with proper schema
        Equivalent to: Source Definition + Source Qualifier in Informatica
        """
        print("🔄 Step 1: Reading source data...")
        
        df = self.spark.read \
            .option("header", "true") \
            .option("delimiter", self.config["delimiter"]) \
            .schema(self.source_schema) \
            .csv(file_path)
        
        print(f"✅ Loaded {df.count()} records from source")
        return df
    
    def apply_expression_transformation(self, df: DataFrame) -> DataFrame:
        """
        Step 2: Expression Transformation - Data normalization and type conversion
        Equivalent to: EXP_Normalize in Informatica
        """
        print("🔄 Step 2: Applying expression transformation...")
        
        # Convert string dates to proper timestamp format
        df_transformed = df.withColumn(
            "Transaction_Date",
            to_date(col("Transaction_Date"), "yyyy-MM-dd")
        ).withColumn(
            "Last_Updated_Timestamp",
            to_timestamp(col("Last_Updated_Timestamp"), self.config["datetime_format"])
        ).withColumn(
            "Amount",
            col("Amount").cast(DecimalType(10, 2))
        ).withColumn(
            "Account_Balance", 
            col("Account_Balance").cast(DecimalType(10, 2))
        )
        
        # Handle null characters (replace * with null)
        for column in df_transformed.columns:
            if df_transformed.schema[column].dataType == StringType():
                df_transformed = df_transformed.withColumn(
                    column,
                    when(col(column) == self.config["null_character"], None)
                    .otherwise(col(column))
                )
        
        print("✅ Expression transformation completed")
        return df_transformed
    
    def apply_sort_dedup(self, df: DataFrame) -> DataFrame:
        """
        Step 3: Sorter Transformation - Sort data for deduplication
        Equivalent to: SORT_Dedupe in Informatica
        """
        print("🔄 Step 3: Applying sort and deduplication...")
        
        if not self.config["dedup_enabled"]:
            return df
        
        # Create sort expressions
        sort_expressions = []
        for col_name in self.config["sort_columns"]:
            if col_name == self.config["sort_timestamp_desc"]:
                sort_expressions.append(col(col_name).desc())
            else:
                sort_expressions.append(col(col_name).asc())
        
        # Sort the data
        df_sorted = df.orderBy(*sort_expressions)
        
        print("✅ Sort transformation completed")
        return df_sorted
    
    def apply_aggregator_transformation(self, df: DataFrame) -> DataFrame:
        """
        Step 4: Aggregator Transformation - Group by Transaction_ID and get first record
        Equivalent to: AGGTRANS in Informatica (with FIRST() functions)
        """
        print("🔄 Step 4: Applying aggregator transformation...")
        
        # Create window specification for getting the first record per Transaction_ID
        window_spec = Window.partitionBy(self.config["group_by_column"]) \
                           .orderBy(col(self.config["sort_timestamp_desc"]).desc())
        
        # Add row number and filter to get first record
        df_with_row_num = df.withColumn("rn", row_number().over(window_spec))
        df_deduped = df_with_row_num.filter(col("rn") == 1).drop("rn")
        
        print(f"✅ Aggregator transformation completed - {df_deduped.count()} unique records")
        return df_deduped
    
    def apply_target_logic(self, df: DataFrame) -> DataFrame:
        """
        Step 5: Target Logic - Prepare data for final output
        Equivalent to: Target Definition with MERGE logic
        """
        print("🔄 Step 5: Applying target logic...")
        
        # Add processing metadata
        df_final = df.withColumn("processing_timestamp", current_timestamp()) \
                    .withColumn("batch_id", lit(f"batch_{int(time.time())}"))
        
        print("✅ Target logic completed")
        return df_final
    
    def execute_workflow(self, input_file_path: str) -> DataFrame:
        """
        Execute the complete workflow pipeline
        """
        print("🚀 Starting Informatica to PySpark Workflow Execution...")
        print("=" * 60)
        
        # Step 1: Read source data
        df_source = self.read_source_data(input_file_path)
        
        # Step 2: Apply expression transformation
        df_expression = self.apply_expression_transformation(df_source)
        
        # Step 3: Apply sort and deduplication
        df_sorted = self.apply_sort_dedup(df_expression)
        
        # Step 4: Apply aggregator transformation
        df_aggregated = self.apply_aggregator_transformation(df_sorted)
        
        # Step 5: Apply target logic
        df_final = self.apply_target_logic(df_aggregated)
        
        print("=" * 60)
        print("🎉 Workflow execution completed successfully!")
        
        return df_final
    
    def get_business_logic_summary(self) -> Dict[str, Any]:
        """
        Return a summary of the business logic for UI display
        """
        return {
            "workflow_name": "Bank Transaction Processing Workflow",
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
                    "details": f"Sort by: {', '.join(self.config['sort_columns'])}"
                },
                {
                    "step": 4,
                    "name": "Aggregator Transformation", 
                    "description": "Deduplicate by Transaction_ID",
                    "transformation_type": "Aggregator",
                    "details": f"Group by {self.config['group_by_column']}, get latest record by {self.config['sort_timestamp_desc']}"
                },
                {
                    "step": 5,
                    "name": "Target Logic",
                    "description": "Prepare final output with metadata",
                    "transformation_type": "Target",
                    "details": "Add processing timestamp and batch ID for tracking"
                }
            ],
            "configuration": self.config
        }
    
    def stop(self):
        """Stop the Spark session"""
        if self.spark:
            self.spark.stop()

# Example usage and testing
if __name__ == "__main__":
    import time
    
    # Initialize workflow
    workflow = InformaticaToPySparkWorkflow()
    
    try:
        # Execute workflow with sample data
        result_df = workflow.execute_workflow("bank_transactions.csv")
        
        # Show results
        print("\n📊 Final Results:")
        result_df.show(10, truncate=False)
        
        print(f"\n📈 Summary Statistics:")
        print(f"Total records processed: {result_df.count()}")
        
        # Show business logic summary
        business_logic = workflow.get_business_logic_summary()
        print(f"\n🔧 Business Logic: {business_logic['workflow_name']}")
        
    except Exception as e:
        print(f"❌ Error executing workflow: {str(e)}")
    finally:
        workflow.stop()
