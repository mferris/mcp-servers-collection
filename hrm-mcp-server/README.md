# HRM MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with access to Human Resource Management data through artificial employee data.

## Features

### Tools Available
- **search_employees** - Search employees by name, department, position, status, or location
- **get_employee_details** - Get detailed information about a specific employee
- **get_department_info** - Get department information including budget and headcount
- **salary_analysis** - Analyze salary data across departments, positions, or locations
- **time_off_summary** - Get time off requests and balances
- **performance_dashboard** - Get performance review data and upcoming reviews

### Resources Available
- **hrm://company-overview** - High-level company metrics and statistics
- **hrm://org-chart** - Company organizational structure
- **hrm://payroll-summary** - Current payroll statistics and trends

### Sample Data
The server includes artificial data for:
- 6 employees across 5 departments
- Employee details (contact info, salary, status, emergency contacts)
- Department information (budgets, headcount, managers)
- Payroll records with deductions and overtime
- Time off requests (vacation, sick, personal leave)
- Performance reviews with ratings and feedback

## Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm run dev
   ```

3. **Test with MCP Inspector:**
   ```bash
   npx @modelcontextprotocol/inspector npm run start
   ```

### Docker Deployment

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Or build and run manually:**
   ```bash
   # Build the image
   docker build -t hrm-mcp-server .
   
   # Run the container
   docker run -it hrm-mcp-server
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f hrm-mcp-server
   ```

## Usage Examples

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "hrm-data": {
      "command": "docker",
      "args": ["run", "-i", "hrm-mcp-server"],
      "cwd": "/path/to/hrm-mcp-server"
    }
  }
}
```

### Sample Queries

Ask Claude:
- "Show me all employees in the Engineering department"
- "What's the average salary by department?"
- "Who has pending time off requests?"
- "Give me the performance review summary for Q2 2024"
- "Show me employee details for John Smith"
- "What's our company headcount and total payroll?"

## API Examples

### Search Employees
```json
{
  "method": "tools/call",
  "params": {
    "name": "search_employees",
    "arguments": {
      "department": "Engineering",
      "status": "active"
    }
  }
}
```

### Get Department Info
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_department_info",
    "arguments": {
      "departmentName": "Engineering"
    }
  }
}
```

### Salary Analysis
```json
{
  "method": "tools/call",
  "params": {
    "name": "salary_analysis",
    "arguments": {
      "groupBy": "department"
    }
  }
}
```

## Data Structure

### Employee Record
```typescript
{
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  manager: string | null;
  hireDate: string;
  salary: number;
  status: 'active' | 'inactive' | 'on_leave';
  location: string;
  phone: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}
```

## Development

### Scripts
- `npm run build` - Compile TypeScript
- `npm run start` - Run compiled server
- `npm run dev` - Run with auto-reload
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run Docker container

### Environment Variables
- `NODE_ENV` - Set to 'production' for production builds
- `TZ` - Timezone (default: UTC)

## Security Notes

- Uses artificial data only - no real employee information
- Runs in sandboxed Docker container
- Non-root user execution
- Resource limits applied
- No external network access required

## License

MIT License - This is a demonstration/educational tool with artificial data.