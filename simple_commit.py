import subprocess
import os

# Change to the repository directory
os.chdir("/Users/michaelferris/Desktop/Coding Projects/mcp-servers-collection")

# Run git commands
print("=== Git Status ===")
result = subprocess.run(['git', 'status'], capture_output=True, text=True)
print(result.stdout)

print("\n=== Git Add All ===")
result = subprocess.run(['git', 'add', '.'], capture_output=True, text=True)
if result.stderr:
    print(f"Warnings: {result.stderr}")

print("\n=== Git Status (staged) ===")
result = subprocess.run(['git', 'status'], capture_output=True, text=True)
print(result.stdout)

print("\n=== Creating Commit ===")
commit_msg = """Convert all MCP servers from TypeScript to Python

- Convert customer-mcp-server from TypeScript to Python with simple JSON-RPC
- Convert engineering-mcp-server from TypeScript to Python with simple JSON-RPC  
- Convert unified hrm-mcp-server from TypeScript to Python with simple JSON-RPC
- Remove MCP SDK dependencies to fix Python 3.9 compatibility issues
- All servers now use only standard Python libraries (json, sys, datetime, typing)
- Update requirements.txt files for Python dependencies
- Maintain full MCP protocol compatibility with manual JSON-RPC implementation

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"""

result = subprocess.run(['git', 'commit', '-m', commit_msg], capture_output=True, text=True)
print(result.stdout)
if result.stderr:
    print(f"Errors: {result.stderr}")

print("\n=== Final Status ===")
result = subprocess.run(['git', 'status'], capture_output=True, text=True)
print(result.stdout)

print("Done!")