# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a collection of Model Context Protocol (MCP) servers providing AI assistants with access to various business data sources using artificial data for demonstration. The repository contains three distinct MCP servers:

- **customer-mcp-server**: Customer relationship management data with search, analytics, and health monitoring tools
- **engineering-mcp-server**: Large-scale engineering organization data with project, team, and deployment metrics  
- **hrm-mcp-server**: Unified HRM and engineering data combining employee management with technical team insights

All servers use the `@modelcontextprotocol/sdk` and follow the MCP protocol for tool registration and execution.

## Development Commands

### Root Level Commands
```bash
# Install all server dependencies
npm run install-all

# Build all servers
npm run build-all

# Test individual servers
npm run test-customer    # Test customer server
npm run test-hrm        # Test HRM server

# Docker operations
npm run docker-build-all
```

### Individual Server Commands
Each server supports these commands:
```bash
cd {server-directory}
npm install              # Install dependencies
npm run build           # Compile TypeScript
npm run start           # Run server via tsx
npm run dev             # Run with file watching
npm run docker:build    # Build Docker image
npm run docker:run      # Run Docker container
```

## Architecture

### MCP Server Pattern
All servers follow the same architectural pattern:
- **Entry Point**: `src/server.ts` with shebang for direct execution
- **Transport**: StdioServerTransport for CLI integration
- **Data Layer**: In-memory mock databases with realistic artificial data
- **Tool Registration**: Each server registers multiple tools via `ListToolsRequestSchema`
- **Tool Execution**: Handlers for `CallToolRequestSchema` with structured responses

### Common Dependencies
- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `tsx`: TypeScript execution for development
- `typescript`: TypeScript compiler
- `@types/node`: Node.js type definitions

### Server-Specific Features

**Customer Server Tools:**
- `search_customers`: Filter by tier, status, revenue
- `get_customer_details`: Complete customer profile with orders/tickets
- `analyze_customer_health`: Churn risk analysis
- `revenue_analytics`: Financial metrics and trends

**Engineering Server Tools:**
- `search_engineers`: Find engineers by level, role, team, skills
- `get_project_status`: Project health, timeline, blockers
- `repository_metrics`: Code quality, security vulnerabilities
- `deployment_analytics`: Deployment frequency and success rates
- `incident_dashboard`: Recent incidents and resolution metrics

**HRM Server Tools:**
- `search_employees`: Employee search with department/position filters
- `get_employee_details`: Complete HR profile including emergency contacts
- `salary_analysis`: Compensation analysis across departments
- `time_off_summary`: PTO requests and balances
- `performance_dashboard`: Review cycles and ratings

## Docker Support

The engineering and HRM servers include Dockerfile and docker-compose.yml for containerized deployment. All servers can be built and run via Docker using the npm scripts or direct Docker commands.

## Claude Desktop Integration

Configure in `claude_desktop_config.json` using node with tsx execution:
```json
{
  "mcpServers": {
    "server-name": {
      "command": "/usr/local/bin/node",
      "args": [
        "/path/to/server/node_modules/.bin/tsx",
        "/path/to/server/src/server.ts"
      ]
    }
  }
}
```

## Data Characteristics

All servers use completely artificial data designed for demonstration:
- Customer server: 3 customers with realistic order/support history
- Engineering server: Large-scale organization (8000+ engineers) with realistic team structure
- HRM server: 6 employees across 5 departments with complete HR profiles

The data is hardcoded in each server.ts file and designed to showcase realistic business scenarios without any real information.