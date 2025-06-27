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
    
    print("Syncing with remote and pushing changes...")
    print("=" * 50)
    
    # Check current status
    print("1. Checking current git status...")
    stdout, stderr, success = run_command(['git', 'status', '--porcelain'], repo_path)
    if success:
        if stdout.strip():
            print("⚠️  Uncommitted changes detected:")
            print(stdout)
            print("These will be preserved during the sync process.")
        else:
            print("✅ Working directory is clean")
    
    # Fetch latest changes from remote
    print("\n2. Fetching latest changes from remote...")
    stdout, stderr, success = run_command(['git', 'fetch', 'origin'], repo_path)
    if success:
        print("✅ Fetched latest changes")
        if stdout.strip():
            print(stdout)
    else:
        print(f"❌ Error fetching: {stderr}")
        return 1
    
    # Check if there are differences between local and remote
    print("\n3. Checking differences with remote...")
    stdout, stderr, success = run_command(['git', 'log', '--oneline', 'HEAD..origin/main'], repo_path)
    if success:
        if stdout.strip():
            print("📥 Remote changes that need to be pulled:")
            print(stdout)
        else:
            print("✅ No remote changes to pull")
    
    # Check if there are local changes to push
    stdout, stderr, success = run_command(['git', 'log', '--oneline', 'origin/main..HEAD'], repo_path)
    if success:
        if stdout.strip():
            print("\n📤 Local changes that will be pushed:")
            print(stdout)
        else:
            print("\n⚠️  No local changes to push")
    
    # Stash any uncommitted changes temporarily
    print("\n4. Stashing uncommitted changes (if any)...")
    stdout, stderr, success = run_command(['git', 'stash', 'push', '-m', 'Temporary stash before sync'], repo_path)
    stash_created = False
    if success and "No local changes to save" not in stdout:
        print("✅ Uncommitted changes stashed")
        stash_created = True
    else:
        print("ℹ️  No changes to stash")
    
    # Pull remote changes
    print("\n5. Pulling remote changes...")
    stdout, stderr, success = run_command(['git', 'pull', 'origin', 'main'], repo_path)
    if success:
        print("✅ Successfully pulled remote changes")
        if stdout.strip():
            print(stdout)
    else:
        print(f"❌ Error pulling: {stderr}")
        
        # If pull failed, try rebase strategy
        print("\n   Trying with rebase strategy...")
        stdout, stderr, success = run_command(['git', 'pull', '--rebase', 'origin', 'main'], repo_path)
        if success:
            print("✅ Successfully pulled with rebase")
        else:
            print(f"❌ Rebase also failed: {stderr}")
            print("Manual intervention may be required")
            return 1
    
    # Restore stashed changes
    if stash_created:
        print("\n6. Restoring stashed changes...")
        stdout, stderr, success = run_command(['git', 'stash', 'pop'], repo_path)
        if success:
            print("✅ Stashed changes restored")
        else:
            print(f"⚠️  Issue restoring stash: {stderr}")
            print("You may need to resolve this manually with: git stash pop")
    
    # Check if we still have changes to commit
    print("\n7. Checking for changes to commit...")
    stdout, stderr, success = run_command(['git', 'status', '--porcelain'], repo_path)
    if success and stdout.strip():
        print("📝 Changes detected, adding and committing...")
        
        # Add all changes
        stdout, stderr, success = run_command(['git', 'add', '.'], repo_path)
        if not success:
            print(f"❌ Error adding files: {stderr}")
            return 1
        
        # Commit changes
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
        if success:
            print("✅ Changes committed successfully")
        else:
            print(f"❌ Error committing: {stderr}")
            return 1
    else:
        print("ℹ️  No new changes to commit")
    
    # Now push to remote
    print("\n8. Pushing to GitHub...")
    stdout, stderr, success = run_command(['git', 'push', 'origin', 'main'], repo_path)
    if success:
        print("✅ Successfully pushed to GitHub!")
        print(stdout)
        print(f"\n🎉 Repository updated at: https://github.com/mferris/mcp-servers-collection")
    else:
        print(f"❌ Error pushing: {stderr}")
        return 1
    
    # Final status
    print("\n9. Final repository status:")
    stdout, stderr, success = run_command(['git', 'status'], repo_path)
    if success:
        print(stdout)
    
    print("\n✅ Sync and push completed successfully!")
    return 0

if __name__ == "__main__":
    sys.exit(main())