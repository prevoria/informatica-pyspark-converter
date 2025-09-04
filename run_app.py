#!/usr/bin/env python3
"""
Informatica to PySpark Workflow Converter
Startup script for the Flask web application
"""

import os
import sys
from pathlib import Path

def setup_environment():
    """Setup the application environment"""
    print("🔧 Setting up environment...")
    
    # Add current directory to Python path
    current_dir = Path(__file__).parent.absolute()
    sys.path.insert(0, str(current_dir))
    
    # Create required directories
    directories = ['uploads', 'templates', 'static/css', 'static/js']
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"✅ Created directory: {directory}")

def check_dependencies():
    """Check if required dependencies are installed"""
    print("📦 Checking dependencies...")
    
    required_packages = {
        'flask': 'Flask',
        'pandas': 'pandas',
        'werkzeug': 'Werkzeug'
    }
    
    optional_packages = {
        'pyspark': 'PySpark',
        'findspark': 'findspark'
    }
    
    missing_required = []
    missing_optional = []
    
    for package, display_name in required_packages.items():
        try:
            __import__(package)
            print(f"✅ {display_name} is installed")
        except ImportError:
            missing_required.append(display_name)
            print(f"❌ {display_name} is NOT installed")
    
    for package, display_name in optional_packages.items():
        try:
            __import__(package)
            print(f"✅ {display_name} is installed")
        except ImportError:
            missing_optional.append(display_name)
            print(f"⚠️  {display_name} is NOT installed (optional - will run in demo mode)")
    
    if missing_required:
        print(f"\n❌ Missing required packages: {', '.join(missing_required)}")
        print("Please install them using:")
        print("pip install -r requirements.txt")
        return False
    
    if missing_optional:
        print(f"\n⚠️  Missing optional packages: {', '.join(missing_optional)}")
        print("The application will run in demo mode without PySpark functionality.")
        print("To enable full functionality, install PySpark:")
        print("pip install pyspark findspark")
    
    return True

def main():
    """Main startup function"""
    print("🚀 Starting Informatica to PySpark Workflow Converter")
    print("=" * 60)
    
    # Setup environment
    setup_environment()
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("🌟 Starting Flask application...")
    
    try:
        # Import and run the Flask app
        from app import app
        print("🌐 Application will be available at: http://localhost:5000")
        print("📱 Access from network: http://<your-ip>:5000")
        print("⏹️  Press Ctrl+C to stop the application")
        print("=" * 60)
        
        app.run(debug=True, host='0.0.0.0', port=5000)
        
    except KeyboardInterrupt:
        print("\n👋 Application stopped by user")
    except Exception as e:
        print(f"\n❌ Error starting application: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
