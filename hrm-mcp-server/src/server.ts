#!/usr/bin/env node

/**
 * Unified HRM & Engineering MCP Server
 * 
 * This server provides AI assistants with access to Human Resource Management 
 * and Engineering organization data, enabling comprehensive queries about 
 * employees, projects, teams, performance, and engineering metrics.
 * 
 * Business Value:
 * - HR managers can ask "Show me all employees with upcoming performance reviews"
 * - Engineering managers can query "Which engineers are working on blocked projects?"
 * - Executives can ask "What's our engineering team productivity and costs?"
 * - Directors can query "Show me team health metrics and incident response times"
 * - Managers can ask "Which employees have the most vacation days remaining?"
 * - Tech leads can query "What's our code review velocity and deployment frequency?"
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Unified HRM & Engineering Data Types
interface Employee {
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
  // Engineering-specific fields
  engineeringLevel?: 'L3' | 'L4' | 'L5' | 'L6' | 'L7' | 'L8' | 'L9' | 'L10';
  role?: 'SWE' | 'SRE' | 'Data' | 'ML' | 'Security' | 'DevRel' | 'QA' | 'Manager' | 'Director' | 'VP' | 'Architect';
  skills?: string[];
  currentProjects?: string[];
  isOncall?: boolean;
}

interface Department {
  id: string;
  name: string;
  manager: string;
  budget: number;
  headcount: number;
  location: string;
}

interface PayrollRecord {
  id: string;
  employeeId: string;
  payPeriod: string;
  grossPay: number;
  netPay: number;
  deductions: {
    tax: number;
    health: number;
    retirement: number;
  };
  overtime: number;
}

interface TimeOffRequest {
  id: string;
  employeeId: string;
  type: 'vacation' | 'sick' | 'personal' | 'maternity' | 'paternity';
  startDate: string;
  endDate: string;
  days: number;
  status: 'pending' | 'approved' | 'denied';
  reason?: string;
}

interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewerId: string;
  period: string;
  overallRating: number; // 1-5 scale
  goals: string[];
  feedback: string;
  nextReviewDate: string;
  status: 'scheduled' | 'in_progress' | 'completed';
}

// Engineering Data Types
interface Project {
  id: string;
  name: string;
  description: string;
  status: 'Planning' | 'Active' | 'Blocked' | 'Completed' | 'Cancelled';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  owner: string;
  team: string;
  startDate: string;
  targetDate: string;
  actualDate?: string;
  progress: number; // 0-100
  budget: number;
  risks: string[];
  dependencies: string[];
}

interface Repository {
  id: string;
  name: string;
  type: 'Service' | 'Library' | 'Tool' | 'Frontend' | 'Mobile' | 'Data' | 'ML' | 'Infrastructure';
  language: string;
  team: string;
  linesOfCode: number;
  contributors: number;
  lastCommit: string;
  deploymentFreq: number; // per week
  techDebtScore: number; // 1-10
  securityVulns: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  testCoverage: number; // percentage
  uptime: number; // percentage
}

interface Deployment {
  id: string;
  repository: string;
  version: string;
  environment: 'dev' | 'staging' | 'canary' | 'production';
  deployer: string;
  timestamp: string;
  duration: number; // minutes
  status: 'success' | 'failed' | 'rolled_back';
  rollbackReason?: string;
}

interface Incident {
  id: string;
  title: string;
  severity: 'SEV0' | 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';
  status: 'Open' | 'Investigating' | 'Mitigating' | 'Resolved' | 'Post-mortem';
  service: string;
  assignee: string;
  reporter: string;
  createdAt: string;
  resolvedAt?: string;
  mttr: number; // minutes
  impact: string;
  rootCause?: string;
}

interface CodeReview {
  id: string;
  repository: string;
  author: string;
  reviewers: string[];
  title: string;
  linesChanged: number;
  createdAt: string;
  mergedAt?: string;
  status: 'Open' | 'Approved' | 'Changes Requested' | 'Merged' | 'Closed';
  reviewTime: number; // hours
}

// Mock Unified HRM & Engineering Database
const hrmDatabase = {
  employees: [
    {
      id: "emp_001",
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@company.com",
      department: "Engineering",
      position: "Senior Software Engineer",
      manager: "emp_010",
      hireDate: "2020-03-15",
      salary: 120000,
      status: "active" as const,
      location: "San Francisco, CA",
      phone: "555-0101",
      emergencyContact: {
        name: "Jane Smith",
        phone: "555-0102",
        relationship: "Spouse"
      },
      // Engineering fields
      engineeringLevel: "L6" as const,
      role: "SWE" as const,
      skills: ["Python", "Java", "Elasticsearch", "Kafka", "AWS"],
      currentProjects: ["proj_001"],
      isOncall: false
    },
    {
      id: "emp_002",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@company.com",
      department: "Marketing",
      position: "Marketing Manager",
      manager: "emp_011",
      hireDate: "2019-08-20",
      salary: 85000,
      status: "active" as const,
      location: "New York, NY",
      phone: "555-0201",
      emergencyContact: {
        name: "Mike Johnson",
        phone: "555-0202",
        relationship: "Spouse"
      }
    },
    {
      id: "emp_003",
      firstName: "Michael",
      lastName: "Brown",
      email: "michael.brown@company.com",
      department: "Sales",
      position: "Account Executive",
      manager: "emp_012",
      hireDate: "2021-01-10",
      salary: 75000,
      status: "active" as const,
      location: "Chicago, IL",
      phone: "555-0301",
      emergencyContact: {
        name: "Lisa Brown",
        phone: "555-0302",
        relationship: "Sister"
      }
    },
    {
      id: "emp_004",
      firstName: "Emily",
      lastName: "Davis",
      email: "emily.davis@company.com",
      department: "HR",
      position: "HR Specialist",
      manager: "emp_013",
      hireDate: "2018-11-05",
      salary: 65000,
      status: "on_leave" as const,
      location: "Austin, TX",
      phone: "555-0401",
      emergencyContact: {
        name: "Robert Davis",
        phone: "555-0402",
        relationship: "Father"
      }
    },
    {
      id: "emp_005",
      firstName: "David",
      lastName: "Wilson",
      email: "david.wilson@company.com",
      department: "Finance",
      position: "Financial Analyst",
      manager: "emp_014",
      hireDate: "2022-06-01",
      salary: 70000,
      status: "active" as const,
      location: "Seattle, WA",
      phone: "555-0501",
      emergencyContact: {
        name: "Mary Wilson",
        phone: "555-0502",
        relationship: "Mother"
      }
    },
    {
      id: "emp_010",
      firstName: "Alice",
      lastName: "Chen",
      email: "alice.chen@company.com",
      department: "Engineering",
      position: "Engineering Manager",
      manager: null,
      hireDate: "2017-02-14",
      salary: 150000,
      status: "active" as const,
      location: "San Francisco, CA",
      phone: "555-1001",
      emergencyContact: {
        name: "Tom Chen",
        phone: "555-1002",
        relationship: "Spouse"
      }
    }
  ] as Employee[],

  departments: [
    {
      id: "dept_001",
      name: "Engineering",
      manager: "emp_010",
      budget: 2500000,
      headcount: 25,
      location: "San Francisco, CA"
    },
    {
      id: "dept_002",
      name: "Marketing",
      manager: "emp_011",
      budget: 800000,
      headcount: 8,
      location: "New York, NY"
    },
    {
      id: "dept_003",
      name: "Sales",
      manager: "emp_012",
      budget: 1200000,
      headcount: 15,
      location: "Chicago, IL"
    },
    {
      id: "dept_004",
      name: "HR",
      manager: "emp_013",
      budget: 400000,
      headcount: 5,
      location: "Austin, TX"
    },
    {
      id: "dept_005",
      name: "Finance",
      manager: "emp_014",
      budget: 600000,
      headcount: 7,
      location: "Seattle, WA"
    }
  ] as Department[],

  payrollRecords: [
    {
      id: "pay_001",
      employeeId: "emp_001",
      payPeriod: "2024-06-01",
      grossPay: 4615.38,
      netPay: 3200.50,
      deductions: { tax: 1200.00, health: 150.00, retirement: 264.88 },
      overtime: 0
    },
    {
      id: "pay_002",
      employeeId: "emp_002",
      payPeriod: "2024-06-01",
      grossPay: 3269.23,
      netPay: 2400.75,
      deductions: { tax: 750.00, health: 118.48, retirement: 0 },
      overtime: 0
    }
  ] as PayrollRecord[],

  timeOffRequests: [
    {
      id: "to_001",
      employeeId: "emp_001",
      type: "vacation" as const,
      startDate: "2024-07-15",
      endDate: "2024-07-19",
      days: 5,
      status: "approved" as const,
      reason: "Family vacation"
    },
    {
      id: "to_002",
      employeeId: "emp_002",
      type: "sick" as const,
      startDate: "2024-06-20",
      endDate: "2024-06-21",
      days: 2,
      status: "approved" as const
    },
    {
      id: "to_003",
      employeeId: "emp_003",
      type: "personal" as const,
      startDate: "2024-07-01",
      endDate: "2024-07-01",
      days: 1,
      status: "pending" as const,
      reason: "Personal appointment"
    }
  ] as TimeOffRequest[],

  performanceReviews: [
    {
      id: "pr_001",
      employeeId: "emp_001",
      reviewerId: "emp_010",
      period: "2024-Q2",
      overallRating: 4.5,
      goals: ["Complete microservices migration", "Mentor junior developers"],
      feedback: "Excellent technical leadership and delivery",
      nextReviewDate: "2024-09-15",
      status: "completed" as const
    },
    {
      id: "pr_002",
      employeeId: "emp_002",
      reviewerId: "emp_011",
      period: "2024-Q2",
      overallRating: 4.0,
      goals: ["Launch new product campaign", "Improve conversion rates"],
      feedback: "Strong campaign execution, room for analytics improvement",
      nextReviewDate: "2024-09-20",
      status: "completed" as const
    },
    {
      id: "pr_003",
      employeeId: "emp_003",
      reviewerId: "emp_012",
      period: "2024-Q2",
      overallRating: 3.8,
      goals: ["Exceed sales quota", "Improve client relationships"],
      feedback: "Good performance, focus on relationship building",
      nextReviewDate: "2024-09-25",
      status: "scheduled" as const
    }
  ] as PerformanceReview[],

  // Engineering Data
  projects: [
    {
      id: "proj_001", name: "Search Relevance V3", description: "Next generation search ranking algorithm",
      status: "Active", priority: "P0", owner: "emp_001", team: "Engineering",
      startDate: "2024-01-15", targetDate: "2024-08-15", progress: 65,
      budget: 500000, risks: ["ML model performance", "Data pipeline complexity"], dependencies: []
    },
    {
      id: "proj_002", name: "Mobile App Redesign", description: "Complete mobile app UI/UX overhaul",
      status: "Planning", priority: "P1", owner: "emp_002", team: "Marketing",
      startDate: "2024-07-01", targetDate: "2024-12-31", progress: 10,
      budget: 300000, risks: ["User adoption", "Development timeline"], dependencies: ["proj_001"]
    },
    {
      id: "proj_003", name: "Customer Analytics Platform", description: "Real-time customer behavior analytics",
      status: "Blocked", priority: "P2", owner: "emp_004", team: "HR",
      startDate: "2024-03-01", targetDate: "2024-10-15", progress: 35,
      budget: 450000, risks: ["Data privacy compliance", "Integration complexity"], dependencies: []
    }
  ] as Project[],

  repositories: [
    {
      id: "repo_001", name: "search-service", type: "Service", language: "Python",
      team: "Engineering", linesOfCode: 125000, contributors: 8,
      lastCommit: "2024-06-20T14:30:00Z", deploymentFreq: 5, techDebtScore: 6,
      securityVulns: { critical: 0, high: 2, medium: 8, low: 15 },
      testCoverage: 87, uptime: 99.95
    },
    {
      id: "repo_002", name: "mobile-app", type: "Mobile", language: "React Native",
      team: "Marketing", linesOfCode: 95000, contributors: 6,
      lastCommit: "2024-06-19T16:45:00Z", deploymentFreq: 2, techDebtScore: 8,
      securityVulns: { critical: 1, high: 3, medium: 12, low: 20 },
      testCoverage: 76, uptime: 99.9
    },
    {
      id: "repo_003", name: "analytics-platform", type: "Data", language: "Python",
      team: "HR", linesOfCode: 85000, contributors: 4,
      lastCommit: "2024-06-18T11:20:00Z", deploymentFreq: 3, techDebtScore: 5,
      securityVulns: { critical: 0, high: 1, medium: 6, low: 11 },
      testCoverage: 82, uptime: 99.8
    }
  ] as Repository[],

  deployments: [
    {
      id: "deploy_001", repository: "search-service", version: "v2.4.1",
      environment: "production", deployer: "emp_001", timestamp: "2024-06-21T10:30:00Z",
      duration: 12, status: "success"
    },
    {
      id: "deploy_002", repository: "mobile-app", version: "v1.8.0",
      environment: "staging", deployer: "emp_002", timestamp: "2024-06-20T15:45:00Z",
      duration: 18, status: "success"
    },
    {
      id: "deploy_003", repository: "analytics-platform", version: "v1.2.3",
      environment: "production", deployer: "emp_004", timestamp: "2024-06-19T14:20:00Z",
      duration: 25, status: "failed", rollbackReason: "Database migration issues"
    }
  ] as Deployment[],

  incidents: [
    {
      id: "inc_001", title: "Search API high latency", severity: "SEV1",
      status: "Resolved", service: "search-service", assignee: "emp_001",
      reporter: "emp_002", createdAt: "2024-06-20T14:30:00Z",
      resolvedAt: "2024-06-20T16:45:00Z", mttr: 135,
      impact: "Search response time increased by 300%",
      rootCause: "Database connection pool exhaustion"
    },
    {
      id: "inc_002", title: "Mobile app login failures", severity: "SEV2",
      status: "Investigating", service: "mobile-app", assignee: "emp_002",
      reporter: "emp_001", createdAt: "2024-06-21T09:15:00Z", mttr: 0,
      impact: "15% of users unable to login"
    }
  ] as Incident[],

  codeReviews: [
    {
      id: "cr_001", repository: "search-service", author: "emp_001",
      reviewers: ["emp_002"], title: "Optimize search query processing",
      linesChanged: 245, createdAt: "2024-06-20T09:30:00Z",
      mergedAt: "2024-06-21T14:15:00Z", status: "Merged", reviewTime: 6.5
    },
    {
      id: "cr_002", repository: "mobile-app", author: "emp_002",
      reviewers: ["emp_001", "emp_004"], title: "Add biometric authentication",
      linesChanged: 312, createdAt: "2024-06-19T16:00:00Z",
      status: "Open", reviewTime: 0
    }
  ] as CodeReview[]
};

class HRMServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'hrm-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_employees',
            description: 'Search employees by various criteria (name, department, position, status)',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query (name, email, or employee ID)',
                },
                department: {
                  type: 'string',
                  description: 'Filter by department',
                },
                position: {
                  type: 'string',
                  description: 'Filter by position',
                },
                status: {
                  type: 'string',
                  enum: ['active', 'inactive', 'on_leave'],
                  description: 'Filter by employment status',
                },
                location: {
                  type: 'string',
                  description: 'Filter by office location',
                }
              },
            },
          },
          {
            name: 'get_employee_details',
            description: 'Get detailed information about a specific employee',
            inputSchema: {
              type: 'object',
              properties: {
                employeeId: {
                  type: 'string',
                  description: 'Employee ID',
                },
              },
              required: ['employeeId'],
            },
          },
          {
            name: 'get_department_info',
            description: 'Get department information including budget and headcount',
            inputSchema: {
              type: 'object',
              properties: {
                departmentName: {
                  type: 'string',
                  description: 'Department name',
                },
              },
              required: ['departmentName'],
            },
          },
          {
            name: 'salary_analysis',
            description: 'Analyze salary data across departments or positions',
            inputSchema: {
              type: 'object',
              properties: {
                groupBy: {
                  type: 'string',
                  enum: ['department', 'position', 'location'],
                  description: 'How to group the salary analysis',
                  default: 'department'
                }
              }
            },
          },
          {
            name: 'time_off_summary',
            description: 'Get time off requests and balances',
            inputSchema: {
              type: 'object',
              properties: {
                employeeId: {
                  type: 'string',
                  description: 'Specific employee ID (optional)',
                },
                status: {
                  type: 'string',
                  enum: ['pending', 'approved', 'denied'],
                  description: 'Filter by request status',
                },
                type: {
                  type: 'string',
                  enum: ['vacation', 'sick', 'personal', 'maternity', 'paternity'],
                  description: 'Filter by time off type',
                }
              }
            },
          },
          {
            name: 'performance_dashboard',
            description: 'Get performance review data and upcoming reviews',
            inputSchema: {
              type: 'object',
              properties: {
                period: {
                  type: 'string',
                  description: 'Review period (e.g., "2024-Q2")',
                },
                status: {
                  type: 'string',
                  enum: ['scheduled', 'in_progress', 'completed'],
                  description: 'Filter by review status',
                }
              }
            },
          },
          // Engineering Tools
          {
            name: 'get_project_status',
            description: 'Get status of projects with filtering options',
            inputSchema: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['Planning', 'Active', 'Blocked', 'Completed', 'Cancelled'] },
                priority: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] },
                team: { type: 'string', description: 'Filter by team' },
                owner: { type: 'string', description: 'Filter by project owner' }
              },
            },
          },
          {
            name: 'repository_metrics',
            description: 'Get repository metrics including security, quality, and performance',
            inputSchema: {
              type: 'object',
              properties: {
                team: { type: 'string', description: 'Filter by team' },
                type: { type: 'string', description: 'Filter by repository type' },
                language: { type: 'string', description: 'Filter by programming language' },
                sortBy: { type: 'string', enum: ['techDebt', 'security', 'coverage', 'uptime'] }
              },
            },
          },
          {
            name: 'deployment_dashboard',
            description: 'Get deployment metrics and recent deployment history',
            inputSchema: {
              type: 'object',
              properties: {
                repository: { type: 'string', description: 'Filter by repository' },
                environment: { type: 'string', enum: ['dev', 'staging', 'canary', 'production'] },
                status: { type: 'string', enum: ['success', 'failed', 'rolled_back'] },
                timeframe: { type: 'string', enum: ['24h', '7d', '30d'], default: '7d' }
              },
            },
          },
          {
            name: 'incident_analysis',
            description: 'Analyze incidents with filtering and metrics',
            inputSchema: {
              type: 'object',
              properties: {
                severity: { type: 'string', enum: ['SEV0', 'SEV1', 'SEV2', 'SEV3', 'SEV4'] },
                status: { type: 'string', enum: ['Open', 'Investigating', 'Mitigating', 'Resolved', 'Post-mortem'] },
                service: { type: 'string', description: 'Filter by service' },
                assignee: { type: 'string', description: 'Filter by assignee' }
              },
            },
          },
          {
            name: 'code_review_metrics',
            description: 'Get code review metrics and current review queue',
            inputSchema: {
              type: 'object',
              properties: {
                repository: { type: 'string', description: 'Filter by repository' },
                author: { type: 'string', description: 'Filter by author' },
                reviewer: { type: 'string', description: 'Filter by reviewer' },
                status: { type: 'string', enum: ['Open', 'Approved', 'Changes Requested', 'Merged', 'Closed'] }
              },
            },
          }
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'search_employees':
            return await this.searchEmployees(args);
          case 'get_employee_details':
            return await this.getEmployeeDetails(args);
          case 'get_department_info':
            return await this.getDepartmentInfo(args);
          case 'salary_analysis':
            return await this.getSalaryAnalysis(args);
          case 'time_off_summary':
            return await this.getTimeOffSummary(args);
          case 'performance_dashboard':
            return await this.getPerformanceDashboard(args);
          // Engineering tools
          case 'get_project_status':
            return await this.getProjectStatus(args);
          case 'repository_metrics':
            return await this.getRepositoryMetrics(args);
          case 'deployment_dashboard':
            return await this.getDeploymentDashboard(args);
          case 'incident_analysis':
            return await this.getIncidentAnalysis(args);
          case 'code_review_metrics':
            return await this.getCodeReviewMetrics(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private setupResourceHandlers() {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'hrm://company-overview',
            mimeType: 'application/json',
            name: 'Company Overview',
            description: 'High-level company metrics and statistics',
          },
          {
            uri: 'hrm://org-chart',
            mimeType: 'application/json',
            name: 'Organization Chart',
            description: 'Company organizational structure',
          },
          {
            uri: 'hrm://payroll-summary',
            mimeType: 'application/json',
            name: 'Payroll Summary',
            description: 'Current payroll statistics and trends',
          }
        ],
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case 'hrm://company-overview':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  totalEmployees: hrmDatabase.employees.length,
                  activeEmployees: hrmDatabase.employees.filter(e => e.status === 'active').length,
                  onLeaveEmployees: hrmDatabase.employees.filter(e => e.status === 'on_leave').length,
                  totalDepartments: hrmDatabase.departments.length,
                  averageSalary: Math.round(hrmDatabase.employees.reduce((sum, e) => sum + e.salary, 0) / hrmDatabase.employees.length),
                  totalPayrollBudget: hrmDatabase.employees.reduce((sum, e) => sum + e.salary, 0),
                  pendingTimeOffRequests: hrmDatabase.timeOffRequests.filter(r => r.status === 'pending').length,
                  upcomingPerformanceReviews: hrmDatabase.performanceReviews.filter(r => r.status === 'scheduled').length
                }, null, 2),
              },
            ],
          };

        case 'hrm://org-chart':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  departments: hrmDatabase.departments.map(dept => ({
                    ...dept,
                    employees: hrmDatabase.employees.filter(emp => emp.department === dept.name)
                      .map(emp => ({
                        id: emp.id,
                        name: `${emp.firstName} ${emp.lastName}`,
                        position: emp.position,
                        manager: emp.manager
                      }))
                  }))
                }, null, 2),
              },
            ],
          };

        case 'hrm://payroll-summary':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  totalGrossPay: hrmDatabase.payrollRecords.reduce((sum, p) => sum + p.grossPay, 0),
                  totalNetPay: hrmDatabase.payrollRecords.reduce((sum, p) => sum + p.netPay, 0),
                  totalDeductions: hrmDatabase.payrollRecords.reduce((sum, p) => 
                    sum + p.deductions.tax + p.deductions.health + p.deductions.retirement, 0),
                  payrollRecordsCount: hrmDatabase.payrollRecords.length,
                  lastPayPeriod: "2024-06-01"
                }, null, 2),
              },
            ],
          };

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
  }

  // Tool implementation methods
  private async searchEmployees(args: any) {
    let results = [...hrmDatabase.employees];

    // Apply filters
    if (args.query) {
      const query = args.query.toLowerCase();
      results = results.filter(emp => 
        emp.firstName.toLowerCase().includes(query) ||
        emp.lastName.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.id.toLowerCase().includes(query)
      );
    }

    if (args.department) {
      results = results.filter(emp => 
        emp.department.toLowerCase() === args.department.toLowerCase()
      );
    }

    if (args.position) {
      results = results.filter(emp => 
        emp.position.toLowerCase().includes(args.position.toLowerCase())
      );
    }

    if (args.status) {
      results = results.filter(emp => emp.status === args.status);
    }

    if (args.location) {
      results = results.filter(emp => 
        emp.location.toLowerCase().includes(args.location.toLowerCase())
      );
    }

    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} employees:\n\n` + 
                results.map(emp => 
                  `• ${emp.firstName} ${emp.lastName} (${emp.id})\n` +
                  `  Position: ${emp.position}\n` +
                  `  Department: ${emp.department}\n` +
                  `  Status: ${emp.status}\n` +
                  `  Location: ${emp.location}\n` +
                  `  Salary: $${emp.salary.toLocaleString()}\n`
                ).join('\n'),
        },
      ],
    };
  }

  private async getEmployeeDetails(args: any) {
    const employee = hrmDatabase.employees.find(e => e.id === args.employeeId);
    if (!employee) {
      throw new Error(`Employee not found: ${args.employeeId}`);
    }

    const timeOffRequests = hrmDatabase.timeOffRequests.filter(r => r.employeeId === args.employeeId);
    const performanceReviews = hrmDatabase.performanceReviews.filter(r => r.employeeId === args.employeeId);
    const payrollRecords = hrmDatabase.payrollRecords.filter(r => r.employeeId === args.employeeId);

    return {
      content: [
        {
          type: 'text',
          text: `**Employee Details: ${employee.firstName} ${employee.lastName}**\n\n` +
                `• ID: ${employee.id}\n` +
                `• Email: ${employee.email}\n` +
                `• Phone: ${employee.phone}\n` +
                `• Department: ${employee.department}\n` +
                `• Position: ${employee.position}\n` +
                `• Manager: ${employee.manager || 'None'}\n` +
                `• Hire Date: ${employee.hireDate}\n` +
                `• Salary: $${employee.salary.toLocaleString()}\n` +
                `• Status: ${employee.status}\n` +
                `• Location: ${employee.location}\n\n` +
                `**Emergency Contact:**\n` +
                `• Name: ${employee.emergencyContact.name}\n` +
                `• Phone: ${employee.emergencyContact.phone}\n` +
                `• Relationship: ${employee.emergencyContact.relationship}\n\n` +
                `**Time Off Requests (${timeOffRequests.length}):**\n` +
                timeOffRequests.map(req => 
                  `• ${req.type} - ${req.startDate} to ${req.endDate} (${req.days} days) - ${req.status}`
                ).join('\n') +
                `\n\n**Performance Reviews (${performanceReviews.length}):**\n` +
                performanceReviews.map(review => 
                  `• ${review.period} - Rating: ${review.overallRating}/5 - ${review.status}`
                ).join('\n') +
                `\n\n**Recent Payroll (${payrollRecords.length} records):**\n` +
                payrollRecords.map(pay => 
                  `• ${pay.payPeriod} - Gross: $${pay.grossPay.toFixed(2)}, Net: $${pay.netPay.toFixed(2)}`
                ).join('\n'),
        },
      ],
    };
  }

  private async getDepartmentInfo(args: any) {
    const department = hrmDatabase.departments.find(d => 
      d.name.toLowerCase() === args.departmentName.toLowerCase()
    );
    
    if (!department) {
      throw new Error(`Department not found: ${args.departmentName}`);
    }

    const employees = hrmDatabase.employees.filter(e => e.department === department.name);
    const avgSalary = employees.reduce((sum, e) => sum + e.salary, 0) / employees.length;
    const manager = hrmDatabase.employees.find(e => e.id === department.manager);

    return {
      content: [
        {
          type: 'text',
          text: `**Department: ${department.name}**\n\n` +
                `• Manager: ${manager ? `${manager.firstName} ${manager.lastName}` : 'Not assigned'}\n` +
                `• Budget: $${department.budget.toLocaleString()}\n` +
                `• Headcount: ${employees.length}/${department.headcount}\n` +
                `• Location: ${department.location}\n` +
                `• Average Salary: $${Math.round(avgSalary).toLocaleString()}\n` +
                `• Total Payroll: $${employees.reduce((sum, e) => sum + e.salary, 0).toLocaleString()}\n\n` +
                `**Employees:**\n` +
                employees.map(emp => 
                  `• ${emp.firstName} ${emp.lastName} - ${emp.position} - $${emp.salary.toLocaleString()}`
                ).join('\n'),
        },
      ],
    };
  }

  private async getSalaryAnalysis(args: any) {
    const groupBy = args.groupBy || 'department';
    const groupedData: { [key: string]: Employee[] } = {};

    hrmDatabase.employees.forEach(emp => {
      let key: string;
      switch (groupBy) {
        case 'department':
          key = emp.department;
          break;
        case 'position':
          key = emp.position;
          break;
        case 'location':
          key = emp.location;
          break;
        default:
          key = emp.department;
      }

      if (!groupedData[key]) {
        groupedData[key] = [];
      }
      groupedData[key].push(emp);
    });

    const analysis = Object.entries(groupedData).map(([key, employees]) => {
      const salaries = employees.map(e => e.salary);
      const avg = salaries.reduce((sum, s) => sum + s, 0) / salaries.length;
      const min = Math.min(...salaries);
      const max = Math.max(...salaries);
      const total = salaries.reduce((sum, s) => sum + s, 0);

      return {
        group: key,
        count: employees.length,
        averageSalary: Math.round(avg),
        minSalary: min,
        maxSalary: max,
        totalPayroll: total
      };
    }).sort((a, b) => b.averageSalary - a.averageSalary);

    return {
      content: [
        {
          type: 'text',
          text: `**Salary Analysis by ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}**\n\n` +
                analysis.map(item => 
                  `**${item.group}:**\n` +
                  `• Employees: ${item.count}\n` +
                  `• Average Salary: $${item.averageSalary.toLocaleString()}\n` +
                  `• Salary Range: $${item.minSalary.toLocaleString()} - $${item.maxSalary.toLocaleString()}\n` +
                  `• Total Payroll: $${item.totalPayroll.toLocaleString()}\n`
                ).join('\n') +
                `\n**Overall Statistics:**\n` +
                `• Total Employees: ${hrmDatabase.employees.length}\n` +
                `• Company Average: $${Math.round(hrmDatabase.employees.reduce((sum, e) => sum + e.salary, 0) / hrmDatabase.employees.length).toLocaleString()}\n` +
                `• Total Company Payroll: $${hrmDatabase.employees.reduce((sum, e) => sum + e.salary, 0).toLocaleString()}`,
        },
      ],
    };
  }

  private async getTimeOffSummary(args: any) {
    let requests = [...hrmDatabase.timeOffRequests];

    if (args.employeeId) {
      requests = requests.filter(r => r.employeeId === args.employeeId);
    }

    if (args.status) {
      requests = requests.filter(r => r.status === args.status);
    }

    if (args.type) {
      requests = requests.filter(r => r.type === args.type);
    }

    const summary = requests.reduce((acc, req) => {
      acc[req.type] = acc[req.type] || { count: 0, days: 0 };
      acc[req.type].count++;
      acc[req.type].days += req.days;
      return acc;
    }, {} as { [key: string]: { count: number, days: number } });

    return {
      content: [
        {
          type: 'text',
          text: `**Time Off Summary**\n\n` +
                `**Requests (${requests.length} total):**\n` +
                requests.map(req => {
                  const employee = hrmDatabase.employees.find(e => e.id === req.employeeId);
                  return `• ${employee?.firstName} ${employee?.lastName} - ${req.type}\n` +
                         `  ${req.startDate} to ${req.endDate} (${req.days} days) - ${req.status}\n` +
                         (req.reason ? `  Reason: ${req.reason}\n` : '');
                }).join('\n') +
                `\n**Summary by Type:**\n` +
                Object.entries(summary).map(([type, data]) => 
                  `• ${type}: ${data.count} requests, ${data.days} total days`
                ).join('\n') +
                `\n\n**Status Breakdown:**\n` +
                `• Pending: ${requests.filter(r => r.status === 'pending').length}\n` +
                `• Approved: ${requests.filter(r => r.status === 'approved').length}\n` +
                `• Denied: ${requests.filter(r => r.status === 'denied').length}`,
        },
      ],
    };
  }

  private async getPerformanceDashboard(args: any) {
    let reviews = [...hrmDatabase.performanceReviews];

    if (args.period) {
      reviews = reviews.filter(r => r.period === args.period);
    }

    if (args.status) {
      reviews = reviews.filter(r => r.status === args.status);
    }

    const avgRating = reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length;
    const ratingDistribution = reviews.reduce((acc, r) => {
      const rating = Math.floor(r.overallRating);
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {} as { [key: number]: number });

    return {
      content: [
        {
          type: 'text',
          text: `**Performance Dashboard**\n\n` +
                `**Reviews (${reviews.length} total):**\n` +
                reviews.map(review => {
                  const employee = hrmDatabase.employees.find(e => e.id === review.employeeId);
                  const reviewer = hrmDatabase.employees.find(e => e.id === review.reviewerId);
                  return `• ${employee?.firstName} ${employee?.lastName}\n` +
                         `  Period: ${review.period} | Rating: ${review.overallRating}/5\n` +
                         `  Reviewer: ${reviewer?.firstName} ${reviewer?.lastName}\n` +
                         `  Status: ${review.status}\n` +
                         `  Next Review: ${review.nextReviewDate}\n` +
                         `  Feedback: ${review.feedback}\n`;
                }).join('\n') +
                `\n**Statistics:**\n` +
                `• Average Rating: ${avgRating.toFixed(1)}/5\n` +
                `• Rating Distribution:\n` +
                Object.entries(ratingDistribution).map(([rating, count]) => 
                  `  - ${rating} stars: ${count} employees`
                ).join('\n') +
                `\n\n**Status Breakdown:**\n` +
                `• Completed: ${reviews.filter(r => r.status === 'completed').length}\n` +
                `• Scheduled: ${reviews.filter(r => r.status === 'scheduled').length}\n` +
                `• In Progress: ${reviews.filter(r => r.status === 'in_progress').length}`,
        },
      ],
    };
  }

  // Engineering tool implementation methods
  private async getProjectStatus(args: any) {
    let projects = [...hrmDatabase.projects];

    if (args.status) {
      projects = projects.filter(p => p.status === args.status);
    }

    if (args.priority) {
      projects = projects.filter(p => p.priority === args.priority);
    }

    if (args.team) {
      projects = projects.filter(p => p.team.toLowerCase().includes(args.team.toLowerCase()));
    }

    if (args.owner) {
      projects = projects.filter(p => p.owner === args.owner);
    }

    const summary = projects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      content: [
        {
          type: 'text',
          text: `**Project Status Report (${projects.length} projects)**\n\n` +
                `**Status Summary:**\n` +
                Object.entries(summary).map(([status, count]) => `• ${status}: ${count}`).join('\n') +
                `\n\n**Project Details:**\n` +
                projects.map(proj => 
                  `• **${proj.name}** (${proj.id})\n` +
                  `  Status: ${proj.status} | Priority: ${proj.priority} | Progress: ${proj.progress}%\n` +
                  `  Owner: ${proj.owner} | Team: ${proj.team}\n` +
                  `  Target: ${proj.targetDate} | Budget: $${proj.budget.toLocaleString()}\n` +
                  `  Description: ${proj.description}\n` +
                  (proj.risks.length > 0 ? `  Risks: ${proj.risks.join(', ')}\n` : '') +
                  (proj.dependencies.length > 0 ? `  Dependencies: ${proj.dependencies.join(', ')}\n` : '')
                ).join('\n'),
        },
      ],
    };
  }

  private async getRepositoryMetrics(args: any) {
    let repos = [...hrmDatabase.repositories];

    if (args.team) {
      repos = repos.filter(r => r.team.toLowerCase().includes(args.team.toLowerCase()));
    }

    if (args.type) {
      repos = repos.filter(r => r.type.toLowerCase() === args.type.toLowerCase());
    }

    if (args.language) {
      repos = repos.filter(r => r.language.toLowerCase() === args.language.toLowerCase());
    }

    if (args.sortBy) {
      switch (args.sortBy) {
        case 'techDebt':
          repos.sort((a, b) => b.techDebtScore - a.techDebtScore);
          break;
        case 'security':
          repos.sort((a, b) => (b.securityVulns.critical + b.securityVulns.high) - (a.securityVulns.critical + a.securityVulns.high));
          break;
        case 'coverage':
          repos.sort((a, b) => a.testCoverage - b.testCoverage);
          break;
        case 'uptime':
          repos.sort((a, b) => a.uptime - b.uptime);
          break;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `**Repository Metrics (${repos.length} repositories)**\n\n` +
                repos.map(repo => 
                  `• **${repo.name}** (${repo.type})\n` +
                  `  Language: ${repo.language} | Team: ${repo.team}\n` +
                  `  Lines of Code: ${repo.linesOfCode.toLocaleString()} | Contributors: ${repo.contributors}\n` +
                  `  Test Coverage: ${repo.testCoverage}% | Tech Debt: ${repo.techDebtScore}/10\n` +
                  `  Uptime: ${repo.uptime}% | Deploy Freq: ${repo.deploymentFreq}/week\n` +
                  `  Security Vulns: ${repo.securityVulns.critical}C/${repo.securityVulns.high}H/${repo.securityVulns.medium}M/${repo.securityVulns.low}L\n` +
                  `  Last Commit: ${new Date(repo.lastCommit).toLocaleDateString()}\n`
                ).join('\n') +
                `\n**Aggregated Metrics:**\n` +
                `• Total LOC: ${repos.reduce((sum, r) => sum + r.linesOfCode, 0).toLocaleString()}\n` +
                `• Avg Test Coverage: ${Math.round(repos.reduce((sum, r) => sum + r.testCoverage, 0) / repos.length)}%\n` +
                `• Avg Tech Debt: ${(repos.reduce((sum, r) => sum + r.techDebtScore, 0) / repos.length).toFixed(1)}/10\n` +
                `• Total Critical Vulns: ${repos.reduce((sum, r) => sum + r.securityVulns.critical, 0)}\n` +
                `• Avg Uptime: ${(repos.reduce((sum, r) => sum + r.uptime, 0) / repos.length).toFixed(2)}%`,
        },
      ],
    };
  }

  private async getDeploymentDashboard(args: any) {
    let deployments = [...hrmDatabase.deployments];

    if (args.repository) {
      deployments = deployments.filter(d => d.repository.toLowerCase().includes(args.repository.toLowerCase()));
    }

    if (args.environment) {
      deployments = deployments.filter(d => d.environment === args.environment);
    }

    if (args.status) {
      deployments = deployments.filter(d => d.status === args.status);
    }

    const successRate = (deployments.filter(d => d.status === 'success').length / deployments.length * 100).toFixed(1);
    const avgDuration = Math.round(deployments.reduce((sum, d) => sum + d.duration, 0) / deployments.length);

    const statusBreakdown = deployments.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      content: [
        {
          type: 'text',
          text: `**Deployment Dashboard (${deployments.length} deployments)**\n\n` +
                `**Metrics:**\n` +
                `• Success Rate: ${successRate}%\n` +
                `• Average Duration: ${avgDuration} minutes\n` +
                `• Status Breakdown: ${Object.entries(statusBreakdown).map(([s, c]) => `${s}: ${c}`).join(', ')}\n\n` +
                `**Recent Deployments:**\n` +
                deployments.slice(0, 10).map(deploy => 
                  `• ${deploy.repository} v${deploy.version} → ${deploy.environment}\n` +
                  `  Deployer: ${deploy.deployer} | Status: ${deploy.status}\n` +
                  `  Duration: ${deploy.duration}min | Time: ${new Date(deploy.timestamp).toLocaleString()}\n` +
                  (deploy.rollbackReason ? `  Rollback Reason: ${deploy.rollbackReason}\n` : '')
                ).join('\n'),
        },
      ],
    };
  }

  private async getIncidentAnalysis(args: any) {
    let incidents = [...hrmDatabase.incidents];

    if (args.severity) {
      incidents = incidents.filter(i => i.severity === args.severity);
    }

    if (args.status) {
      incidents = incidents.filter(i => i.status === args.status);
    }

    if (args.service) {
      incidents = incidents.filter(i => i.service.toLowerCase().includes(args.service.toLowerCase()));
    }

    if (args.assignee) {
      incidents = incidents.filter(i => i.assignee === args.assignee);
    }

    const avgMttr = Math.round(incidents.filter(i => i.mttr > 0).reduce((sum, i) => sum + i.mttr, 0) / incidents.filter(i => i.mttr > 0).length);
    
    const severityBreakdown = incidents.reduce((acc, i) => {
      acc[i.severity] = (acc[i.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      content: [
        {
          type: 'text',
          text: `**Incident Analysis (${incidents.length} incidents)**\n\n` +
                `**Metrics:**\n` +
                `• Average MTTR: ${avgMttr} minutes\n` +
                `• Severity Breakdown: ${Object.entries(severityBreakdown).map(([s, c]) => `${s}: ${c}`).join(', ')}\n\n` +
                `**Incident Details:**\n` +
                incidents.map(inc => 
                  `• **${inc.title}** (${inc.id})\n` +
                  `  Severity: ${inc.severity} | Status: ${inc.status}\n` +
                  `  Service: ${inc.service} | Assignee: ${inc.assignee}\n` +
                  `  Created: ${new Date(inc.createdAt).toLocaleString()}\n` +
                  (inc.resolvedAt ? `  Resolved: ${new Date(inc.resolvedAt).toLocaleString()} (MTTR: ${inc.mttr}min)\n` : '') +
                  `  Impact: ${inc.impact}\n` +
                  (inc.rootCause ? `  Root Cause: ${inc.rootCause}\n` : '')
                ).join('\n'),
        },
      ],
    };
  }

  private async getCodeReviewMetrics(args: any) {
    let reviews = [...hrmDatabase.codeReviews];

    if (args.repository) {
      reviews = reviews.filter(r => r.repository.toLowerCase().includes(args.repository.toLowerCase()));
    }

    if (args.author) {
      reviews = reviews.filter(r => r.author === args.author);
    }

    if (args.reviewer) {
      reviews = reviews.filter(r => r.reviewers.includes(args.reviewer));
    }

    if (args.status) {
      reviews = reviews.filter(r => r.status === args.status);
    }

    const avgReviewTime = reviews.filter(r => r.reviewTime > 0).reduce((sum, r) => sum + r.reviewTime, 0) / reviews.filter(r => r.reviewTime > 0).length;
    const avgLinesChanged = Math.round(reviews.reduce((sum, r) => sum + r.linesChanged, 0) / reviews.length);

    const statusBreakdown = reviews.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      content: [
        {
          type: 'text',
          text: `**Code Review Metrics (${reviews.length} reviews)**\n\n` +
                `**Metrics:**\n` +
                `• Average Review Time: ${avgReviewTime.toFixed(1)} hours\n` +
                `• Average Lines Changed: ${avgLinesChanged}\n` +
                `• Status Breakdown: ${Object.entries(statusBreakdown).map(([s, c]) => `${s}: ${c}`).join(', ')}\n\n` +
                `**Review Details:**\n` +
                reviews.map(review => 
                  `• **${review.title}** (${review.id})\n` +
                  `  Repository: ${review.repository} | Author: ${review.author}\n` +
                  `  Reviewers: ${review.reviewers.join(', ')}\n` +
                  `  Lines Changed: ${review.linesChanged} | Status: ${review.status}\n` +
                  `  Created: ${new Date(review.createdAt).toLocaleString()}\n` +
                  (review.mergedAt ? `  Merged: ${new Date(review.mergedAt).toLocaleString()}\n` : '') +
                  (review.reviewTime > 0 ? `  Review Time: ${review.reviewTime} hours\n` : '')
                ).join('\n'),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Unified HRM & Engineering MCP Server running on stdio');
  }
}

const server = new HRMServer();
server.run().catch(console.error);