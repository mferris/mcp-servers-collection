#!/usr/bin/env node

/**
 * HRM MCP Server
 * 
 * This server provides AI assistants with access to Human Resource Management data,
 * enabling natural language queries about employees, departments, payroll, and performance.
 * 
 * Business Value:
 * - HR managers can ask "Show me all employees with upcoming performance reviews"
 * - Executives can query "What's our average salary by department?"
 * - Managers can ask "Which employees have the most vacation days remaining?"
 * - Compliance teams can query "List all employees with expired certifications"
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// HRM Data Types
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

// Mock HRM database
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
      }
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
  ] as PerformanceReview[]
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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('HRM MCP Server running on stdio');
  }
}

const server = new HRMServer();
server.run().catch(console.error);