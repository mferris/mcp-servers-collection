# MCP Servers Collection

A collection of Model Context Protocol (MCP) servers for AI assistants, providing access to various business data sources with artificial data for demonstration and development.

## Servers Included

### 1. Customer Data MCP Server
**Location:** `./customer-mcp-server/`

Provides AI assistants with access to customer relationship management data.

**Features:**
- Customer search and filtering
- Customer details with orders and support tickets
- Customer health analysis (churn risk)
- Revenue analytics and trends

**Tools:** `search_customers`, `get_customer_details`, `analyze_customer_health`, `revenue_analytics`

### 2. HRM Data MCP Server
**Location:** `./hrm-mcp-server/`

Provides AI assistants with access to Human Resource Management data.

**Features:**
- Employee search and management
- Department information and budgets
- Salary analysis across departments/positions
- Time off requests and balances
- Performance review dashboard

**Tools:** `search_employees`, `get_employee_details`, `get_department_info`, `salary_analysis`, `time_off_summary`, `performance_dashboard`

### 3. Engineering MCP Server
**Location:** `./engineering-mcp-server/`

Provides AI assistants with access to large-scale engineering organization data (8000+ engineers).

**Features:**
- Engineer search by team, role, level, and skills
- Project status and health tracking
- Repository metrics (security, quality, performance)
- Deployment analytics and history
- Incident analysis and response tracking
- Code review metrics and queue management
- Oncall schedule management
- Team health and productivity metrics

**Tools:** `search_engineers`, `get_project_status`, `repository_metrics`, `deployment_dashboard`, `incident_analysis`, `code_review_metrics`, `oncall_schedule`, `team_health_metrics`

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Claude Desktop (for testing)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd mcp-servers-collection
   ```

2. **Install dependencies for all servers:**
   ```bash
   # Customer MCP Server
   cd customer-mcp-server
   npm install
   cd ..
   
   # HRM MCP Server
   cd hrm-mcp-server
   npm install
   cd ..
   
   # Engineering MCP Server
   cd engineering-mcp-server
   npm install
   cd ..
   ```

3. **Test the servers:**
   ```bash
   # Test Customer server
   cd customer-mcp-server
   npm run start
   # Should see: "Customer Data MCP Server running on stdio"
   
   # Test HRM server
   cd ../hrm-mcp-server
   npm run start
   # Should see: "Unified HRM & Engineering MCP Server running on stdio"
   
   # Test Engineering server
   cd ../engineering-mcp-server
   npm run start
   # Should see: "Engineering MCP Server running on stdio"
   ```

## Claude Desktop Configuration

Add all three servers to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "customer-data": {
      "command": "node",
      "args": [
        "/path/to/mcp-servers-collection/customer-mcp-server/node_modules/.bin/tsx",
        "/path/to/mcp-servers-collection/customer-mcp-server/src/server.ts"
      ]
    },
    "hrm-data": {
      "command": "node",
      "args": [
        "/path/to/mcp-servers-collection/hrm-mcp-server/node_modules/.bin/tsx",
        "/path/to/mcp-servers-collection/hrm-mcp-server/src/server.ts"
      ]
    },
    "engineering-data": {
      "command": "node",
      "args": [
        "/path/to/mcp-servers-collection/engineering-mcp-server/node_modules/.bin/tsx",
        "/path/to/mcp-servers-collection/engineering-mcp-server/src/server.ts"
      ]
    }
  }
}
```

Replace `/path/to/mcp-servers-collection` with your actual path.

## Docker Support

Both servers include Docker support for containerized deployment:

```bash
# Customer server
cd customer-mcp-server
docker build -t customer-mcp-server .
docker run -it customer-mcp-server

# HRM server
cd hrm-mcp-server
docker build -t hrm-mcp-server .
docker run -it hrm-mcp-server
```

Or use docker-compose:
```bash
cd hrm-mcp-server
docker-compose up -d
```

## Usage Examples

### Customer Data Queries
- "Show me all enterprise customers"
- "Which customers are at risk of churning?"
- "What's our total revenue by customer tier?"
- "Show me customer details for Acme Corporation"

### HRM Data Queries
- "Show me all employees in the Engineering department"
- "What's our average salary by department?"
- "Who has pending time off requests?"
- "Give me the performance review dashboard"
- "Show me employee details for John Smith"

## Sample Data

### Customer Server
- 3 sample customers (Acme Corporation, TechStart Inc, Global Solutions Ltd)
- Customer tiers: enterprise, growth, starter
- Order history and support tickets
- Revenue analytics and health metrics

### HRM Server
- 6 employees across 5 departments
- Complete HR profiles (salary, contact info, emergency contacts)
- Department budgets and organizational structure
- Time off requests and performance reviews
- Payroll records with deductions

## Development

### Project Structure
```
mcp-servers-collection/
├── customer-mcp-server/
│   ├── src/server.ts          # Customer MCP server implementation
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── README.md
├── hrm-mcp-server/
│   ├── src/server.ts          # HRM MCP server implementation
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── README.md
└── README.md                  # This file
```

### Adding New Servers
1. Create a new directory for your server
2. Follow the MCP SDK patterns from existing servers
3. Include proper TypeScript configuration
4. Add Docker support for containerization
5. Update this README with usage examples

## Security Notes

- **Artificial Data Only**: All servers use completely artificial data
- **No Real Information**: No actual customer or employee data is included
- **Sandboxed**: Docker containers run with security restrictions
- **Educational Purpose**: Designed for demonstration and development

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your MCP server in a new directory
4. Include proper documentation and examples
5. Submit a pull request

## License

MIT License - These are demonstration tools with artificial data for educational and development purposes.

## Support

For issues or questions:
1. Check the individual server README files
2. Review MCP SDK documentation
3. Test servers independently before integration
4. Verify Claude Desktop configuration