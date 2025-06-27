#!/bin/bash

# Engineering MCP Server - Python Runner
# This script runs the Engineering MCP Server

echo "Starting Engineering MCP Server (Python)..."

# Check if running in virtual environment
if [[ -z "$VIRTUAL_ENV" ]]; then
    echo "Warning: Not running in a virtual environment"
    echo "Consider running: python -m venv venv && source venv/bin/activate"
fi

# Check if mcp is installed
if ! python3 -c "import mcp" 2>/dev/null; then
    echo "MCP not found. Installing requirements..."
    pip install -r requirements.txt
fi

# Run the server
exec python3 src/server.py