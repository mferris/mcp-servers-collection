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
    
    print("Diagnosing and fixing GitHub push issue...")
    print("=" * 50)
    
    # Check current branch
    print("1. Checking current branch...")
    stdout, stderr, success = run_command(['git', 'branch', '--show-current'], repo_path)
    if success:
        current_branch = stdout.strip()
        print(f"✅ Current branch: {current_branch}")
    else:
        print(f"❌ Error getting current branch: {stderr}")
        return 1
    
    # Check all branches
    print("\n2. Checking all branches...")
    stdout, stderr, success = run_command(['git', 'branch', '-a'], repo_path)
    if success:
        print("Available branches:")
        print(stdout)
    
    # Check remote configuration
    print("\n3. Checking remote configuration...")
    stdout, stderr, success = run_command(['git', 'remote', '-v'], repo_path)
    if success:
        print("Remote configuration:")
        print(stdout)
    
    # Check if we have commits to push
    print("\n4. Checking if there are commits to push...")
    stdout, stderr, success = run_command(['git', 'log', '--oneline', '-5'], repo_path)
    if success:
        print("Recent commits:")
        print(stdout)
    
    # Try to get the default remote branch
    print("\n5. Checking default remote branch...")
    stdout, stderr, success = run_command(['git', 'symbolic-ref', 'refs/remotes/origin/HEAD'], repo_path)
    if success:
        default_remote = stdout.strip().replace('refs/remotes/origin/', '')
        print(f"✅ Default remote branch: {default_remote}")
    else:
        print("No default remote branch set, will try to determine...")
        
        # Check what branches exist on remote
        stdout, stderr, success = run_command(['git', 'ls-remote', '--heads', 'origin'], repo_path)
        if success:
            print("Remote branches:")
            remote_branches = []
            for line in stdout.strip().split('\n'):
                if line:
                    branch_name = line.split('refs/heads/')[-1]
                    remote_branches.append(branch_name)
                    print(f"  - {branch_name}")
            
            # Try to determine the main branch
            if 'main' in remote_branches:
                default_remote = 'main'
            elif 'master' in remote_branches:
                default_remote = 'master'
            else:
                default_remote = remote_branches[0] if remote_branches else current_branch
            
            print(f"Will use branch: {default_remote}")
        else:
            default_remote = current_branch
            print(f"Using current branch: {default_remote}")
    
    # Set upstream and push
    print(f"\n6. Setting upstream and pushing to {default_remote}...")
    
    # First, try to set the upstream branch
    stdout, stderr, success = run_command(['git', 'push', '--set-upstream', 'origin', current_branch], repo_path)
    
    if success:
        print("✅ Successfully pushed to GitHub!")
        print(stdout)
        print(f"\n🎉 Repository updated at: https://github.com/mferris/mcp-servers-collection")
        print(f"   Branch: {current_branch}")
    else:
        print(f"❌ Error pushing: {stderr}")
        
        # If that fails, try creating the branch on remote
        print(f"\n7. Trying to push as new branch...")
        stdout, stderr, success = run_command(['git', 'push', 'origin', f'{current_branch}:{current_branch}'], repo_path)
        
        if success:
            print("✅ Successfully pushed new branch to GitHub!")
            print(stdout)
            print(f"\n🎉 Repository updated at: https://github.com/mferris/mcp-servers-collection")
            print(f"   New branch: {current_branch}")
        else:
            print(f"❌ Still failed: {stderr}")
            print("\nTroubleshooting suggestions:")
            print("1. Check if you have push access to the repository")
            print("2. Verify your GitHub authentication (token/SSH key)")
            print("3. Try: git push origin HEAD")
            print("4. Check if the repository exists at: https://github.com/mferris/mcp-servers-collection")
            return 1
    
    # Show final status
    print("\n8. Final status:")
    stdout, stderr, success = run_command(['git', 'status'], repo_path)
    if success:
        print(stdout)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())