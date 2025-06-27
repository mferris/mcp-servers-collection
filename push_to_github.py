#!/usr/bin/env python3
import subprocess
import os
import sys

def run_command(cmd, cwd):
    """Run a command and return the result."""
    try:
        result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, check=True)
        return result.stdout, result.stderr, True
    except subprocess.CalledProcessError as e:
        return e.stdout, e.stderr, False

def main():
    repo_path = "/Users/michaelferris/Desktop/Coding Projects/mcp-servers-collection"
    
    print("Updating GitHub repository with TypeScript to Python conversion...")
    print("=" * 70)
    
    # Check if we're in a git repository
    print("1. Checking git repository...")
    stdout, stderr, success = run_command(['git', 'status'], repo_path)
    if not success:
        print(f"❌ Error: Not a git repository or git not available: {stderr}")
        return 1
    
    print("✅ Git repository confirmed")
    
    # Check current status
    print("\n2. Checking for uncommitted changes...")
    stdout, stderr, success = run_command(['git', 'status', '--porcelain'], repo_path)
    if not success:
        print(f"❌ Error checking git status: {stderr}")
        return 1
    
    if stdout.strip():
        print("📝 Uncommitted changes found:")
        print(stdout)
        
        # Add all changes
        print("\n3. Staging all changes...")
        stdout, stderr, success = run_command(['git', 'add', '.'], repo_path)
        if not success:
            print(f"❌ Error adding files: {stderr}")
            return 1
        print("✅ All changes staged")
        
        # Commit changes
        print("\n4. Creating commit...")
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
        
        stdout, stderr, success = run_command(['git', 'commit', '-m', commit_message], repo_path)
        if not success:
            if "nothing to commit" in stderr:
                print("ℹ️  No new changes to commit")
            else:
                print(f"❌ Error creating commit: {stderr}")
                return 1
        else:
            print("✅ Commit created successfully")
            print(stdout)
    else:
        print("ℹ️  No uncommitted changes found")
    
    # Check if we're ahead of remote
    print("\n5. Checking remote status...")
    stdout, stderr, success = run_command(['git', 'status', '-uno'], repo_path)
    if success:
        print(stdout)
    
    # Push to GitHub
    print("\n6. Pushing to GitHub...")
    stdout, stderr, success = run_command(['git', 'push', 'origin', 'main'], repo_path)
    if not success:
        # Try 'master' branch if 'main' fails
        print("Trying 'master' branch...")
        stdout, stderr, success = run_command(['git', 'push', 'origin', 'master'], repo_path)
    
    if success:
        print("✅ Successfully pushed to GitHub!")
        print(stdout)
        print("\n🎉 Repository updated at: https://github.com/mferris/mcp-servers-collection")
    else:
        print(f"❌ Error pushing to GitHub: {stderr}")
        print("You may need to:")
        print("  - Check your GitHub authentication")
        print("  - Verify the remote repository exists")
        print("  - Push manually using: git push origin main")
        return 1
    
    # Show final status
    print("\n7. Final repository status:")
    stdout, stderr, success = run_command(['git', 'status'], repo_path)
    if success:
        print(stdout)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())