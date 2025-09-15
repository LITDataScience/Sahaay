#!/usr/bin/env python3
# SPDX-Header-Start
# SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
# © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
# SPDX-Header-End

"""
Sahaay MCP System Runner
============================

Main entry point to start the DSPy-enhanced MCP system.
Handles environment setup, configuration, and system startup.
"""

import os
import sys
import logging
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('mcp_system.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)


def setup_environment():
    """Set up environment variables and configuration"""
    
    # Set default environment variables if not already set
    env_vars = {
        'OPENAI_API_KEY': 'your-openai-api-key-here',  # Replace with actual key
        'DSPY_CACHE_DIR': str(project_root / 'cache'),
        'MCP_LOG_LEVEL': 'INFO',
        'MCP_HOST': '0.0.0.0',
        'MCP_PORT': '8000'
    }
    
    for key, default_value in env_vars.items():
        if key not in os.environ:
            os.environ[key] = default_value
    
    # Create cache directory if it doesn't exist
    cache_dir = Path(os.environ['DSPY_CACHE_DIR'])
    cache_dir.mkdir(exist_ok=True)
    
    logger.info("Environment setup completed")


def check_dependencies():
    """Check if all required dependencies are installed"""
    
    required_packages = [
        'dspy',
        'fastapi',
        'uvicorn',
        'optuna',
        'numpy',
        'pandas'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        logger.error(f"Missing required packages: {', '.join(missing_packages)}")
        logger.error("Please install them using: pip install -r requirements.txt")
        return False
    
    logger.info("All dependencies are installed")
    return True


def main():
    """Main entry point"""
    
    print(" Starting Sahaay MCP System with DSPy Enhancement")
    print("=" * 60)
    
    try:
        # Setup environment
        setup_environment()
        
        # Check dependencies
        if not check_dependencies():
            sys.exit(1)
        
        # Import and start the MCP system
        from mcp_dspy.main import main as start_mcp
        
        logger.info("Launching MCP System...")
        print("\n MCP System Dashboard will be available at: http://localhost:8000")
        print("📚 API Documentation: http://localhost:8000/docs")
        print(" System Status: http://localhost:8000/status")
        print("\n" + "=" * 60)
        
        # Start the system
        start_mcp()
        
    except KeyboardInterrupt:
        print("\n\n🛑 MCP System shutdown requested by user")
        logger.info("MCP System shutdown completed")
        
    except Exception as e:
        logger.error(f"MCP System startup failed: {str(e)}")
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()




