# Engineering MCP Server

A comprehensive Model Context Protocol (MCP) server that provides AI assistants with access to engineering organization data for large-scale engineering teams (8000+ engineers).

## Features

### 8 MCP Tools Available
- **search_engineers** - Search engineers by name, team, role, level, location, or skills
- **get_project_status** - Get project status with filtering by status, priority, team, or owner
- **repository_metrics** - Repository metrics including security, quality, test coverage, and tech debt
- **deployment_dashboard** - Deployment metrics and recent deployment history
- **incident_analysis** - Incident analysis with MTTR, severity breakdown, and filtering
- **code_review_metrics** - Code review metrics and current review queue status
- **oncall_schedule** - Current and upcoming oncall rotations across teams
- **team_health_metrics** - Comprehensive team health and productivity metrics

### 4 MCP Resources Available
- **engineering://org-overview** - High-level engineering metrics and KPIs
- **engineering://team-structure** - Engineering team organization and reporting structure
- **engineering://tech-stack** - Technologies, languages, and tools used across engineering
- **engineering://quarterly-metrics** - Key engineering performance indicators for current quarter

### Comprehensive Artificial Data
Simulates a large engineering organization with:

#### **Engineers & Teams**
- 9 engineers across 5 teams (representing 8000+ person org structure)
- Multiple engineering levels (L3-L10) and roles (SWE, SRE, Data, ML, Security, Managers, Directors, VP)
- Global locations (SF, NYC, Seattle, Austin, London, etc.)
- Diverse skill sets and technology stacks
- Realistic reporting structure and team organization

#### **Projects & Development**
- 5 active projects with realistic timelines, budgets, and dependencies
- Project statuses (Planning, Active, Blocked, Completed, Cancelled)
- Priorities (P0-P3) and progress tracking
- Risk assessment and dependency management
- Budget tracking and resource allocation

#### **Repositories & Code Quality**
- 5 repositories representing different types (Service, Library, Frontend, Mobile, Data, Infrastructure)
- Multiple programming languages (Python, Java, Go, Swift, JavaScript)
- Code quality metrics (test coverage, tech debt scores, lines of code)
- Security vulnerability tracking (Critical, High, Medium, Low)
- Deployment frequency and uptime monitoring
- Contributor counts and commit activity

#### **Deployments & Operations**
- Recent deployment history across environments (dev, staging, canary, production)
- Success/failure rates and rollback tracking
- Deployment duration metrics
- Environment-specific configurations
- Automated deployment pipeline data

#### **Incidents & Reliability**
- Incident tracking with severity levels (SEV0-SEV4)
- Mean Time To Recovery (MTTR) metrics
- Root cause analysis and post-mortem tracking
- Service impact assessment
- Incident assignment and escalation

#### **Code Reviews & Collaboration**
- Code review queue and metrics
- Review time tracking and approval workflows
- Lines changed and reviewer assignment
- Review status tracking (Open, Approved, Changes Requested, Merged)
- Author and reviewer productivity metrics

#### **Oncall & Operations**
- Oncall rotation schedules across teams and services
- Escalation paths and backup coverage
- Service ownership and responsibility mapping
- Team-specific oncall procedures

## Quick Start

### Installation
```bash
cd engineering-mcp-server
npm install
```

### Run the Server
```bash
# Development mode
npm run dev

# Production mode
npm run start
```

### Docker Deployment
```bash
# Build and run
docker build -t engineering-mcp-server .
docker run -it engineering-mcp-server
```

## Usage Examples

### Sample Queries for AI Assistants

#### **Team & People Management**
- "Show me all engineers in the Platform SRE team"
- "Who are the L7+ engineers with Kubernetes skills?"
- "Find engineers in San Francisco working on infrastructure"
- "Show me the team structure and reporting hierarchy"

#### **Project & Program Management**
- "What projects are currently blocked?"
- "Show me all P0 priority projects and their status"
- "Which projects are behind schedule?"
- "Give me the project portfolio overview"

#### **Code Quality & Security**
- "Which repositories have the highest tech debt?"
- "Show me repositories with critical security vulnerabilities"
- "What's our average test coverage across all repositories?"
- "Which services have the lowest uptime?"

#### **Deployments & Reliability**
- "Show me recent deployment failures and their causes"
- "What's our deployment success rate this week?"
- "Which environments had the most deployments?"
- "Show me rollback incidents and their reasons"

#### **Incident Management**
- "Show me all SEV0 and SEV1 incidents from the last 30 days"
- "What's our average MTTR across all services?"
- "Which services have the most incidents?"
- "Show me open incidents and their assignees"

#### **Developer Productivity**
- "What's our average code review time?"
- "Show me the code review queue and pending reviews"
- "Which engineers have the most reviews this week?"
- "What's the average size of code reviews?"

#### **Operations & Oncall**
- "Who's currently oncall for each service?"
- "Show me the oncall schedule for next week"
- "What's the escalation path for the search service?"
- "Which teams have oncall rotations?"

#### **Engineering Metrics**
- "Give me a team health overview"
- "What are our quarterly engineering metrics?"
- "Show me deployment frequency by team"
- "What's our current technology stack?"

## API Examples

### Search Engineers
```json
{
  "method": "tools/call",
  "params": {
    "name": "search_engineers",
    "arguments": {
      "role": "SRE",
      "level": "L7",
      "skill": "Kubernetes"
    }
  }
}
```

### Project Status
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_project_status",
    "arguments": {
      "status": "Blocked",
      "priority": "P0"
    }
  }
}
```

### Repository Security Analysis
```json
{
  "method": "tools/call",
  "params": {
    "name": "repository_metrics",
    "arguments": {
      "sortBy": "security"
    }
  }
}
```

### Incident Analysis
```json
{
  "method": "tools/call",
  "params": {
    "name": "incident_analysis",
    "arguments": {
      "severity": "SEV1",
      "timeframe": "30d"
    }
  }
}
```

## Data Models

### Engineer
- **Identity**: ID, name, email, hire date
- **Role Info**: Level (L3-L10), role (SWE/SRE/Manager/etc.), team
- **Location**: Office location, timezone
- **Skills**: Programming languages, technologies, tools
- **Management**: Manager relationship, direct reports

### Project  
- **Basics**: Name, description, owner, team
- **Timeline**: Start date, target date, actual completion
- **Status**: Planning/Active/Blocked/Completed/Cancelled
- **Metrics**: Priority (P0-P3), progress percentage, budget
- **Dependencies**: Project dependencies, risks, blockers

### Repository
- **Code Metrics**: Lines of code, contributors, languages
- **Quality**: Test coverage, tech debt score, last commit
- **Security**: Vulnerability counts by severity
- **Operations**: Deployment frequency, uptime percentage
- **Ownership**: Team ownership, service type

### Deployment
- **Release Info**: Repository, version, environment
- **Execution**: Deployer, timestamp, duration
- **Outcome**: Success/failure status, rollback reasons
- **Environments**: dev/staging/canary/production

### Incident
- **Classification**: Severity (SEV0-SEV4), service affected
- **Timeline**: Creation time, resolution time, MTTR
- **Ownership**: Assignee, reporter, escalation
- **Analysis**: Impact description, root cause
- **Status**: Open/Investigating/Mitigating/Resolved/Post-mortem

## Architecture Notes

### Scalability Simulation
While this demo contains sample data for ~10 entities in each category, the data models and queries are designed to represent the complexity and scale of an 8000+ person engineering organization:

- **Hierarchical team structure** with multiple levels of management
- **Cross-team dependencies** and project portfolios
- **Service mesh complexity** with multiple deployment environments
- **Incident management** at enterprise scale
- **Code review workflows** across large distributed teams
- **Oncall rotations** for 24/7 service reliability

### Enterprise Engineering Patterns
The data reflects real-world enterprise engineering practices:
- **Multi-tier architecture** with services, libraries, and infrastructure
- **DevOps practices** with automated deployments and monitoring
- **Site reliability engineering** with SLI/SLO tracking
- **Security-first development** with vulnerability management
- **Quality engineering** with comprehensive testing and coverage
- **Agile program management** with sprint and milestone tracking

## Development

### Scripts
- `npm run build` - Compile TypeScript
- `npm run start` - Run compiled server  
- `npm run dev` - Run with auto-reload

### Environment Variables
- `NODE_ENV` - Set to 'production' for production builds
- `LOG_LEVEL` - Logging verbosity (debug/info/warn/error)

## Security Notes

- Uses completely artificial data representing engineering organizational patterns
- No real employee information, project details, or security vulnerabilities
- Designed for demonstration and development of engineering productivity tools
- All metrics and KPIs are simulated but based on industry benchmarks

## License

MIT License - This is a demonstration tool with artificial data for educational and development purposes.