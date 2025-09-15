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

# Add the project root to Python path (only if not already present)
project_root = Path(__file__).parent
project_root_str = str(project_root)
if sys.path[0] != project_root_str:
    sys.path.insert(0, project_root_str)

# Configure logging with minimal overhead
def get_logger():
    logger = logging.getLogger(__name__)
    if not logger.hasHandlers():
        logger.setLevel(logging.INFO)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        file_handler = logging.FileHandler('mcp_system.log')
        file_handler.setFormatter(formatter)
        stream_handler = logging.StreamHandler(sys.stdout)
        stream_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
        logger.addHandler(stream_handler)
    return logger

logger = get_logger()

def setup_environment():
    """Set up environment variables and configuration with minimal allocations"""
    env_vars = (
        ('OPENAI_API_KEY', 'your-openai-api-key-here'),  # Replace with actual key
        ('DSPY_CACHE_DIR', str(project_root / 'cache')),
        ('MCP_LOG_LEVEL', 'INFO'),
        ('MCP_HOST', '0.0.0.0'),
        ('MCP_PORT', '8000')
    )
    for key, default_value in env_vars:
        os.environ.setdefault(key, default_value)
    cache_dir = Path(os.environ['DSPY_CACHE_DIR'])
    if not cache_dir.exists():
        cache_dir.mkdir()
    logger.info("Environment setup completed")

def check_dependencies():
    """Check if all required dependencies are installed (O(n) in number of packages)"""
    required_packages = (
        'dspy',
        'fastapi',
        'uvicorn',
        'optuna',
        'numpy',
        'pandas'
    )
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    if missing_packages:
        logger.error("Missing required packages: %s", ', '.join(missing_packages))
        logger.error("Please install them using: pip install -r requirements.txt")
        return False
    logger.info("All dependencies are installed")
    return True

def main():
    """Main entry point"""
    print(" Starting Sahaay MCP System with DSPy Enhancement")
    print("=" * 60)
    try:
        setup_environment()
        if not check_dependencies():
            sys.exit(1)
        # Import and start the MCP system only when needed (lazy import)
        from mcp_dspy.main import main as start_mcp
        logger.info("Launching MCP System...")
        print("\n MCP System Dashboard will be available at: http://localhost:8000")
        print("📚 API Documentation: http://localhost:8000/docs")
        print(" System Status: http://localhost:8000/status")
        print("\n" + "=" * 60)
        start_mcp()
    except KeyboardInterrupt:
        print("\n\n🛑 MCP System shutdown requested by user")
        logger.info("MCP System shutdown completed")
    except Exception as e:
        logger.error("MCP System startup failed: %s", str(e))
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
