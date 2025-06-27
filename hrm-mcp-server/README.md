# HRM MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with access to Human Resource Management and Engineering data through artificial employee data. This server is implemented in Python using the MCP Python SDK.

## Features

### Tools Available

**HRM Tools:**
- **search_employees** - Search employees by name, department, position, status, or location
- **get_employee_details** - Get detailed information about a specific employee
- **get_department_info** - Get department information including budget and headcount
- **salary_analysis** - Analyze salary data across departments, positions, or locations
- **time_off_summary** - Get time off requests and balances
- **performance_dashboard** - Get performance review data and upcoming reviews

**Engineering Tools:**
- **get_project_status** - Get status of projects with filtering options
- **repository_metrics** - Get repository metrics including security, quality, and performance
- **deployment_dashboard** - Get deployment metrics and recent deployment history
- **incident_analysis** - Analyze incidents with filtering and metrics
- **code_review_metrics** - Get code review metrics and current review queue

### Resources Available
- **hrm://company-overview** - High-level company metrics and statistics
- **hrm://org-chart** - Company organizational structure
- **hrm://payroll-summary** - Current payroll statistics and trends

### Sample Data
The server includes artificial data for:

**HRM Data:**
- 6 employees across 5 departments
- Employee details (contact info, salary, status, emergency contacts)
- Department information (budgets, headcount, managers)
- Payroll records with deductions and overtime
- Time off requests (vacation, sick, personal leave)
- Performance reviews with ratings and feedback

**Engineering Data:**
- Project information (status, priority, progress, budgets)
- Repository metrics (code quality, security, test coverage)
- Deployment history and success rates
- Incident tracking and resolution times
- Code review metrics and velocity

## Quick Start

### Local Development

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the server:**
   ```bash
   python src/server.py
   ```

3. **Test with MCP Inspector:**
   ```bash
   npx @modelcontextprotocol/inspector python src/server.py
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
      "command": "python",
      "args": ["src/server.py"],
      "cwd": "/path/to/hrm-mcp-server"
    }
  }
}
```

Or using Docker:

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

**HRM Queries:**
- "Show me all employees in the Engineering department"
- "What's the average salary by department?"
- "Who has pending time off requests?"
- "Give me the performance review summary for Q2 2024"
- "Show me employee details for John Smith"
- "What's our company headcount and total payroll?"

**Engineering Queries:**
- "Show me all blocked projects and their risks"
- "What's our deployment success rate this week?"
- "Which repositories have the highest security vulnerabilities?"
- "Show me current incidents and their response times"
- "What's our code review velocity and backlog?"
- "Give me engineering team productivity metrics"

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
```python
@dataclass
class Employee:
    id: str
    firstName: str
    lastName: str
    email: str
    department: str
    position: str
    manager: Optional[str]
    hireDate: str
    salary: int
    status: str  # 'active' | 'inactive' | 'on_leave'
    location: str
    phone: str
    emergencyContact: EmergencyContact
    # Engineering-specific fields
    engineeringLevel: Optional[str] = None  # 'L3' to 'L10'
    role: Optional[str] = None  # 'SWE' | 'SRE' | etc.
    skills: Optional[List[str]] = None
    currentProjects: Optional[List[str]] = None
    isOncall: Optional[bool] = None
```

## Development

### Scripts
- `python src/server.py` - Run the server
- `pip install -r requirements.txt` - Install dependencies
- `docker build -t hrm-mcp-server .` - Build Docker image
- `docker run -it hrm-mcp-server` - Run Docker container

### Environment Variables
- `PYTHONPATH` - Python path configuration
- `TZ` - Timezone (default: UTC)

## Security Notes

- Uses artificial data only - no real employee information
- Runs in sandboxed Docker container
- Non-root user execution
- Resource limits applied
- No external network access required

## License

MIT License - This is a demonstration/educational tool with artificial data.