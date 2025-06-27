#!/usr/bin/env python3

import subprocess
import os
import sys

def run_git_command(cmd, cwd):
    """Run a git command and return the result."""
    try:
        result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, check=True)
        return result.stdout, result.stderr
    except subprocess.CalledProcessError as e:
        return None, e.stderr

def main():
    repo_path = "/Users/michaelferris/Desktop/Coding Projects/mcp-servers-collection"
    
    print("Committing TypeScript to Python conversion changes...")
    print("=" * 60)
    
    # Check git status
    print("Checking git status...")
    stdout, stderr = run_git_command(['git', 'status', '--porcelain'], repo_path)
    if stdout is None:
        print(f"Error checking git status: {stderr}")
        return 1
        
    if not stdout.strip():
        print("No changes to commit.")
        return 0
        
    print(f"Changes detected:\n{stdout}")
    
    # Check git diff to understand changes
    print("\nChecking changes...")
    stdout, stderr = run_git_command(['git', 'diff', '--name-only'], repo_path)
    if stdout:
        print(f"Modified files:\n{stdout}")
    
    # Add all changes
    print("Adding all changes...")
    stdout, stderr = run_git_command(['git', 'add', '.'], repo_path)
    if stderr:
        print(f"Warning during git add: {stderr}")
    
    # Check what will be committed
    print("Files to be committed:")
    stdout, stderr = run_git_command(['git', 'status', '--cached', '--porcelain'], repo_path)
    if stdout:
        print(stdout)
    
    # Create commit message
    commit_message = """Convert all MCP servers from TypeScript to Python

- Convert customer-mcp-server from TypeScript to Python with simple JSON-RPC
- Convert engineering-mcp-server from TypeScript to Python with simple JSON-RPC  
- Convert unified hrm-mcp-server from TypeScript to Python with simple JSON-RPC
- Remove MCP SDK dependencies to fix Python 3.9 compatibility issues
- All servers now use only standard Python libraries (json, sys, datetime, typing)
- Update requirements.txt files for Python dependencies
- Maintain full MCP protocol compatibility with manual JSON-RPC implementation

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"""

    # Commit changes
    print("Creating commit...")
    stdout, stderr = run_git_command(['git', 'commit', '-m', commit_message], repo_path)
    if stdout is None:
        print(f"Error creating commit: {stderr}")
        return 1
        
    print("Commit created successfully!")
    print(stdout)
    
    # Show final status
    print("\nFinal git status:")
    stdout, stderr = run_git_command(['git', 'status'], repo_path)
    if stdout:
        print(stdout)
        
    return 0

if __name__ == "__main__":
    sys.exit(main())