#!/usr/bin/env node

/**
 * Engineering MCP Server
 * 
 * This server provides AI assistants with access to engineering organization data,
 * enabling natural language queries about projects, teams, repositories, deployments, and metrics.
 * 
 * Designed for large-scale engineering teams (8000+ engineers) with realistic organizational structure.
 * 
 * Business Value:
 * - Engineering managers can ask "Show me all projects behind schedule"
 * - Tech leads can query "Which repositories have the most critical vulnerabilities?"
 * - Directors can ask "What's our deployment frequency across teams?"
 * - SREs can query "Show me recent incidents and their resolution times"
 * - Architects can ask "Which services have the highest technical debt?"
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Engineering Data Types
interface Engineer {
  id: string;
  name: string;
  email: string;
  level: 'L3' | 'L4' | 'L5' | 'L6' | 'L7' | 'L8' | 'L9' | 'L10';
  role: 'SWE' | 'SRE' | 'Data' | 'ML' | 'Security' | 'DevRel' | 'QA' | 'Manager' | 'Director' | 'VP' | 'Architect';
  team: string;
  location: string;
  hireDate: string;
  skills: string[];
  manager: string | null;
}

interface Team {
  id: string;
  name: string;
  type: 'Product' | 'Platform' | 'Infrastructure' | 'Security' | 'Data' | 'ML' | 'DevExp';
  manager: string;
  engineers: string[];
  budget: number;
  focus: string;
  location: string;
}

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

interface OncallRotation {
  id: string;
  team: string;
  service: string;
  engineer: string;
  startDate: string;
  endDate: string;
  escalationPath: string[];
}

// Mock Engineering Database
const engineeringDatabase = {
  engineers: generateEngineers(),
  teams: generateTeams(),
  projects: generateProjects(),
  repositories: generateRepositories(),
  deployments: generateDeployments(),
  incidents: generateIncidents(),
  codeReviews: generateCodeReviews(),
  oncallRotations: generateOncallRotations()
};

// Data Generation Functions
function generateEngineers(): Engineer[] {
  const engineers: Engineer[] = [];
  const levels = ['L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10'] as const;
  const roles = ['SWE', 'SRE', 'Data', 'ML', 'Security', 'DevRel', 'QA', 'Manager', 'Director', 'VP', 'Architect'] as const;
  const locations = ['San Francisco', 'New York', 'Seattle', 'Austin', 'Chicago', 'Boston', 'London', 'Dublin', 'Amsterdam', 'Toronto', 'Sydney', 'Tokyo', 'Singapore', 'Bangalore', 'Tel Aviv'];
  const skills = ['Python', 'Java', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'C++', 'Kotlin', 'Swift', 'React', 'Vue', 'Angular', 'Node.js', 'Spring', 'Django', 'Flask', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Kafka', 'RabbitMQ', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Terraform', 'Ansible', 'Jenkins', 'GitLab CI', 'GitHub Actions', 'Prometheus', 'Grafana', 'ELK Stack', 'DataDog', 'Splunk'];

  // Generate sample engineers
  const sampleEngineers = [
    {
      id: "eng_001", name: "Alex Chen", email: "alex.chen@company.com", level: "L6" as const, role: "SWE" as const,
      team: "Search Platform", location: "San Francisco", hireDate: "2019-03-15",
      skills: ["Python", "Java", "Elasticsearch", "Kafka", "AWS"], manager: "eng_100"
    },
    {
      id: "eng_002", name: "Sarah Johnson", email: "sarah.johnson@company.com", level: "L7" as const, role: "SRE" as const,
      team: "Platform SRE", location: "Seattle", hireDate: "2018-08-20",
      skills: ["Go", "Kubernetes", "Prometheus", "Terraform", "GCP"], manager: "eng_101"
    },
    {
      id: "eng_003", name: "Marcus Rodriguez", email: "marcus.rodriguez@company.com", level: "L5" as const, role: "SWE" as const,
      team: "Mobile Platform", location: "Austin", hireDate: "2021-01-10",
      skills: ["Swift", "Kotlin", "React Native", "GraphQL", "Apollo"], manager: "eng_102"
    },
    {
      id: "eng_004", name: "Priya Patel", email: "priya.patel@company.com", level: "L6" as const, role: "Data" as const,
      team: "Data Platform", location: "New York", hireDate: "2020-06-15",
      skills: ["Python", "Spark", "Airflow", "BigQuery", "dbt"], manager: "eng_103"
    },
    {
      id: "eng_005", name: "David Kim", email: "david.kim@company.com", level: "L8" as const, role: "Architect" as const,
      team: "Core Platform", location: "San Francisco", hireDate: "2016-02-01",
      skills: ["Java", "Spring", "Microservices", "PostgreSQL", "Redis"], manager: null
    },
    // Managers
    {
      id: "eng_100", name: "Jennifer Wu", email: "jennifer.wu@company.com", level: "L7" as const, role: "Manager" as const,
      team: "Search Platform", location: "San Francisco", hireDate: "2017-09-12",
      skills: ["Python", "Leadership", "System Design", "Elasticsearch"], manager: "eng_200"
    },
    {
      id: "eng_101", name: "Michael O'Brien", email: "michael.obrien@company.com", level: "L8" as const, role: "Manager" as const,
      team: "Platform SRE", location: "Seattle", hireDate: "2016-11-05",
      skills: ["Go", "Kubernetes", "Leadership", "Incident Management"], manager: "eng_200"
    },
    // Directors
    {
      id: "eng_200", name: "Lisa Anderson", email: "lisa.anderson@company.com", level: "L9" as const, role: "Director" as const,
      team: "Platform Engineering", location: "San Francisco", hireDate: "2015-04-20",
      skills: ["Leadership", "Strategy", "System Architecture", "Team Building"], manager: "eng_300"
    },
    // VP
    {
      id: "eng_300", name: "Robert Chang", email: "robert.chang@company.com", level: "L10" as const, role: "VP" as const,
      team: "Engineering", location: "San Francisco", hireDate: "2014-01-15",
      skills: ["Leadership", "Strategy", "Product", "Scaling"], manager: null
    }
  ];

  return sampleEngineers;
}

function generateTeams(): Team[] {
  return [
    {
      id: "team_001", name: "Search Platform", type: "Platform", manager: "eng_100",
      engineers: ["eng_001"], budget: 2500000, focus: "Search infrastructure and relevance",
      location: "San Francisco"
    },
    {
      id: "team_002", name: "Platform SRE", type: "Infrastructure", manager: "eng_101",
      engineers: ["eng_002"], budget: 3000000, focus: "Site reliability and infrastructure",
      location: "Seattle"
    },
    {
      id: "team_003", name: "Mobile Platform", type: "Platform", manager: "eng_102",
      engineers: ["eng_003"], budget: 2000000, focus: "Mobile app infrastructure and tooling",
      location: "Austin"
    },
    {
      id: "team_004", name: "Data Platform", type: "Data", manager: "eng_103",
      engineers: ["eng_004"], budget: 2800000, focus: "Data infrastructure and analytics",
      location: "New York"
    },
    {
      id: "team_005", name: "Core Platform", type: "Platform", manager: "eng_005",
      engineers: ["eng_005"], budget: 4000000, focus: "Core backend services and APIs",
      location: "San Francisco"
    }
  ];
}

function generateProjects(): Project[] {
  return [
    {
      id: "proj_001", name: "Search Relevance V3", description: "Next generation search ranking algorithm",
      status: "Active", priority: "P0", owner: "eng_001", team: "Search Platform",
      startDate: "2024-01-15", targetDate: "2024-08-15", progress: 65,
      budget: 500000, risks: ["ML model performance", "Data pipeline complexity"],
      dependencies: ["proj_005"]
    },
    {
      id: "proj_002", name: "Kubernetes Migration", description: "Migrate all services to Kubernetes",
      status: "Active", priority: "P1", owner: "eng_002", team: "Platform SRE",
      startDate: "2024-02-01", targetDate: "2024-12-31", progress: 40,
      budget: 800000, risks: ["Service disruption", "Team training"], dependencies: []
    },
    {
      id: "proj_003", name: "Mobile SDK 2.0", description: "Complete rewrite of mobile SDK",
      status: "Blocked", priority: "P1", owner: "eng_003", team: "Mobile Platform",
      startDate: "2024-03-01", targetDate: "2024-09-30", progress: 25,
      budget: 400000, risks: ["Breaking changes", "Adoption timeline"],
      dependencies: ["proj_007"]
    },
    {
      id: "proj_004", name: "Real-time Analytics", description: "Real-time data processing pipeline",
      status: "Planning", priority: "P2", owner: "eng_004", team: "Data Platform",
      startDate: "2024-07-01", targetDate: "2024-11-30", progress: 5,
      budget: 600000, risks: ["Scale requirements", "Latency constraints"], dependencies: []
    },
    {
      id: "proj_005", name: "API Gateway V2", description: "Next generation API gateway with advanced routing",
      status: "Completed", priority: "P0", owner: "eng_005", team: "Core Platform",
      startDate: "2023-09-01", targetDate: "2024-03-31", actualDate: "2024-03-15", progress: 100,
      budget: 750000, risks: [], dependencies: []
    }
  ];
}

function generateRepositories(): Repository[] {
  return [
    {
      id: "repo_001", name: "search-service", type: "Service", language: "Python",
      team: "Search Platform", linesOfCode: 125000, contributors: 15,
      lastCommit: "2024-06-20T14:30:00Z", deploymentFreq: 5, techDebtScore: 6,
      securityVulns: { critical: 0, high: 2, medium: 8, low: 15 },
      testCoverage: 87, uptime: 99.95
    },
    {
      id: "repo_002", name: "k8s-infrastructure", type: "Infrastructure", language: "Go",
      team: "Platform SRE", linesOfCode: 85000, contributors: 8,
      lastCommit: "2024-06-21T09:15:00Z", deploymentFreq: 3, techDebtScore: 4,
      securityVulns: { critical: 0, high: 0, medium: 3, low: 7 },
      testCoverage: 92, uptime: 99.99
    },
    {
      id: "repo_003", name: "mobile-sdk", type: "Mobile", language: "Swift",
      team: "Mobile Platform", linesOfCode: 95000, contributors: 12,
      lastCommit: "2024-06-19T16:45:00Z", deploymentFreq: 2, techDebtScore: 8,
      securityVulns: { critical: 1, high: 3, medium: 12, low: 20 },
      testCoverage: 76, uptime: 99.9
    },
    {
      id: "repo_004", name: "data-pipeline", type: "Data", language: "Python",
      team: "Data Platform", linesOfCode: 110000, contributors: 18,
      lastCommit: "2024-06-21T11:20:00Z", deploymentFreq: 4, techDebtScore: 5,
      securityVulns: { critical: 0, high: 1, medium: 6, low: 11 },
      testCoverage: 89, uptime: 99.8
    },
    {
      id: "repo_005", name: "api-gateway", type: "Service", language: "Java",
      team: "Core Platform", linesOfCode: 180000, contributors: 25,
      lastCommit: "2024-06-21T13:10:00Z", deploymentFreq: 8, techDebtScore: 3,
      securityVulns: { critical: 0, high: 0, medium: 2, low: 5 },
      testCoverage: 94, uptime: 99.99
    }
  ];
}

function generateDeployments(): Deployment[] {
  return [
    {
      id: "deploy_001", repository: "search-service", version: "v2.4.1",
      environment: "production", deployer: "eng_001", timestamp: "2024-06-21T10:30:00Z",
      duration: 12, status: "success"
    },
    {
      id: "deploy_002", repository: "api-gateway", version: "v3.1.0",
      environment: "production", deployer: "eng_005", timestamp: "2024-06-20T15:45:00Z",
      duration: 8, status: "success"
    },
    {
      id: "deploy_003", repository: "mobile-sdk", version: "v2.0.0-beta",
      environment: "staging", deployer: "eng_003", timestamp: "2024-06-19T14:20:00Z",
      duration: 25, status: "failed", rollbackReason: "Critical UI bug discovered"
    },
    {
      id: "deploy_004", repository: "data-pipeline", version: "v1.8.3",
      environment: "production", deployer: "eng_004", timestamp: "2024-06-21T09:15:00Z",
      duration: 18, status: "success"
    },
    {
      id: "deploy_005", repository: "k8s-infrastructure", version: "v0.9.2",
      environment: "canary", deployer: "eng_002", timestamp: "2024-06-21T11:00:00Z",
      duration: 35, status: "rolled_back", rollbackReason: "Increased latency in dependent services"
    }
  ];
}

function generateIncidents(): Incident[] {
  return [
    {
      id: "inc_001", title: "Search API high latency", severity: "SEV1",
      status: "Resolved", service: "search-service", assignee: "eng_001",
      reporter: "eng_002", createdAt: "2024-06-20T14:30:00Z",
      resolvedAt: "2024-06-20T16:45:00Z", mttr: 135,
      impact: "Search response time increased by 300%",
      rootCause: "Database connection pool exhaustion"
    },
    {
      id: "inc_002", title: "Mobile app crashes on startup", severity: "SEV0",
      status: "Post-mortem", service: "mobile-sdk", assignee: "eng_003",
      reporter: "eng_100", createdAt: "2024-06-19T09:15:00Z",
      resolvedAt: "2024-06-19T12:30:00Z", mttr: 195,
      impact: "100% of iOS users unable to open app",
      rootCause: "Memory leak in authentication module"
    },
    {
      id: "inc_003", title: "Data pipeline processing delays", severity: "SEV2",
      status: "Investigating", service: "data-pipeline", assignee: "eng_004",
      reporter: "eng_103", createdAt: "2024-06-21T08:00:00Z", mttr: 0,
      impact: "Analytics reports delayed by 2+ hours"
    },
    {
      id: "inc_004", title: "API Gateway rate limiting issues", severity: "SEV2",
      status: "Mitigating", service: "api-gateway", assignee: "eng_005",
      reporter: "eng_001", createdAt: "2024-06-21T13:45:00Z", mttr: 0,
      impact: "Some API calls being incorrectly rate limited"
    }
  ];
}

function generateCodeReviews(): CodeReview[] {
  return [
    {
      id: "cr_001", repository: "search-service", author: "eng_001",
      reviewers: ["eng_100", "eng_005"], title: "Optimize search query processing",
      linesChanged: 245, createdAt: "2024-06-20T09:30:00Z",
      mergedAt: "2024-06-21T14:15:00Z", status: "Merged", reviewTime: 6.5
    },
    {
      id: "cr_002", repository: "mobile-sdk", author: "eng_003",
      reviewers: ["eng_102", "eng_001"], title: "Fix memory leak in auth module",
      linesChanged: 89, createdAt: "2024-06-19T16:00:00Z",
      mergedAt: "2024-06-20T10:30:00Z", status: "Merged", reviewTime: 18.5
    },
    {
      id: "cr_003", repository: "data-pipeline", author: "eng_004",
      reviewers: ["eng_103", "eng_005"], title: "Add real-time processing capability",
      linesChanged: 512, createdAt: "2024-06-21T11:00:00Z",
      status: "Open", reviewTime: 0
    },
    {
      id: "cr_004", repository: "k8s-infrastructure", author: "eng_002",
      reviewers: ["eng_101", "eng_200"], title: "Update cluster autoscaling configuration",
      linesChanged: 34, createdAt: "2024-06-21T08:45:00Z",
      status: "Changes Requested", reviewTime: 4.2
    }
  ];
}

function generateOncallRotations(): OncallRotation[] {
  return [
    {
      id: "oncall_001", team: "Search Platform", service: "search-service",
      engineer: "eng_001", startDate: "2024-06-17", endDate: "2024-06-24",
      escalationPath: ["eng_100", "eng_200"]
    },
    {
      id: "oncall_002", team: "Platform SRE", service: "k8s-infrastructure",
      engineer: "eng_002", startDate: "2024-06-20", endDate: "2024-06-27",
      escalationPath: ["eng_101", "eng_200"]
    },
    {
      id: "oncall_003", team: "Data Platform", service: "data-pipeline",
      engineer: "eng_004", startDate: "2024-06-15", endDate: "2024-06-22",
      escalationPath: ["eng_103", "eng_200"]
    }
  ];
}

class EngineeringServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'engineering-server',
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
            name: 'search_engineers',
            description: 'Search engineers by name, team, role, level, or skills',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query (name or email)' },
                team: { type: 'string', description: 'Filter by team' },
                role: { type: 'string', description: 'Filter by role (SWE, SRE, Manager, etc.)' },
                level: { type: 'string', description: 'Filter by level (L3-L10)' },
                location: { type: 'string', description: 'Filter by location' },
                skill: { type: 'string', description: 'Filter by skill' }
              },
            },
          },
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
                assignee: { type: 'string', description: 'Filter by assignee' },
                timeframe: { type: 'string', enum: ['24h', '7d', '30d'], default: '30d' }
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
          },
          {
            name: 'oncall_schedule',
            description: 'Get current and upcoming oncall schedule',
            inputSchema: {
              type: 'object',
              properties: {
                team: { type: 'string', description: 'Filter by team' },
                service: { type: 'string', description: 'Filter by service' },
                engineer: { type: 'string', description: 'Filter by engineer' }
              },
            },
          },
          {
            name: 'team_health_metrics',
            description: 'Get comprehensive team health and productivity metrics',
            inputSchema: {
              type: 'object',
              properties: {
                team: { type: 'string', description: 'Specific team to analyze' },
                metric: { type: 'string', enum: ['velocity', 'quality', 'incidents', 'deployments'] }
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
          case 'search_engineers':
            return await this.searchEngineers(args);
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
          case 'oncall_schedule':
            return await this.getOncallSchedule(args);
          case 'team_health_metrics':
            return await this.getTeamHealthMetrics(args);
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
            uri: 'engineering://org-overview',
            mimeType: 'application/json',
            name: 'Engineering Organization Overview',
            description: 'High-level engineering metrics and KPIs',
          },
          {
            uri: 'engineering://team-structure',
            mimeType: 'application/json',
            name: 'Team Structure',
            description: 'Engineering team organization and reporting structure',
          },
          {
            uri: 'engineering://tech-stack',
            mimeType: 'application/json',
            name: 'Technology Stack',
            description: 'Technologies, languages, and tools used across engineering',
          },
          {
            uri: 'engineering://quarterly-metrics',
            mimeType: 'application/json',
            name: 'Quarterly Engineering Metrics',
            description: 'Key engineering performance indicators for current quarter',
          }
        ],
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case 'engineering://org-overview':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  totalEngineers: engineeringDatabase.engineers.length,
                  totalTeams: engineeringDatabase.teams.length,
                  activeProjects: engineeringDatabase.projects.filter(p => p.status === 'Active').length,
                  totalRepositories: engineeringDatabase.repositories.length,
                  deploymentsThisWeek: engineeringDatabase.deployments.length,
                  openIncidents: engineeringDatabase.incidents.filter(i => i.status !== 'Resolved' && i.status !== 'Post-mortem').length,
                  avgCodeReviewTime: 8.5, // hours
                  testCoverageAvg: Math.round(engineeringDatabase.repositories.reduce((sum, r) => sum + r.testCoverage, 0) / engineeringDatabase.repositories.length),
                  techDebtAvg: Math.round(engineeringDatabase.repositories.reduce((sum, r) => sum + r.techDebtScore, 0) / engineeringDatabase.repositories.length),
                  uptimeAvg: (engineeringDatabase.repositories.reduce((sum, r) => sum + r.uptime, 0) / engineeringDatabase.repositories.length).toFixed(2)
                }, null, 2),
              },
            ],
          };

        case 'engineering://team-structure':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  teams: engineeringDatabase.teams.map(team => ({
                    ...team,
                    engineerDetails: team.engineers.map(engId => {
                      const engineer = engineeringDatabase.engineers.find(e => e.id === engId);
                      return engineer ? { id: engineer.id, name: engineer.name, role: engineer.role, level: engineer.level } : null;
                    }).filter(Boolean),
                    manager: engineeringDatabase.engineers.find(e => e.id === team.manager)?.name || 'Unknown'
                  })),
                  totalBudget: engineeringDatabase.teams.reduce((sum, t) => sum + t.budget, 0)
                }, null, 2),
              },
            ],
          };

        case 'engineering://tech-stack':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  languages: ['Python', 'Java', 'JavaScript', 'TypeScript', 'Go', 'Swift', 'Kotlin'],
                  frameworks: ['React', 'Spring Boot', 'Django', 'Node.js', 'FastAPI'],
                  databases: ['PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch'],
                  cloud: ['AWS', 'GCP', 'Azure'],
                  infrastructure: ['Kubernetes', 'Docker', 'Terraform', 'Ansible'],
                  monitoring: ['Prometheus', 'Grafana', 'DataDog', 'Splunk'],
                  repositoryBreakdown: engineeringDatabase.repositories.reduce((acc, repo) => {
                    acc[repo.language] = (acc[repo.language] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                }, null, 2),
              },
            ],
          };

        case 'engineering://quarterly-metrics':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  quarter: 'Q2 2024',
                  deploymentFrequency: 4.2, // average per week
                  leadTime: 3.2, // days
                  mttr: 145, // minutes
                  changeFailureRate: 0.08, // 8%
                  projectsCompleted: 12,
                  projectsOnTrack: engineeringDatabase.projects.filter(p => p.progress >= 75).length,
                  criticalIncidents: 3,
                  securityVulnsFixed: 47,
                  testCoverageImprovement: 2.3, // percentage points
                  teamGrowth: 15 // net new engineers
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
  private async searchEngineers(args: any) {
    let results = [...engineeringDatabase.engineers];

    if (args.query) {
      const query = args.query.toLowerCase();
      results = results.filter(eng => 
        eng.name.toLowerCase().includes(query) ||
        eng.email.toLowerCase().includes(query) ||
        eng.id.toLowerCase().includes(query)
      );
    }

    if (args.team) {
      results = results.filter(eng => eng.team.toLowerCase().includes(args.team.toLowerCase()));
    }

    if (args.role) {
      results = results.filter(eng => eng.role.toLowerCase() === args.role.toLowerCase());
    }

    if (args.level) {
      results = results.filter(eng => eng.level === args.level);
    }

    if (args.location) {
      results = results.filter(eng => eng.location.toLowerCase().includes(args.location.toLowerCase()));
    }

    if (args.skill) {
      results = results.filter(eng => 
        eng.skills.some(skill => skill.toLowerCase().includes(args.skill.toLowerCase()))
      );
    }

    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} engineers:\n\n` + 
                results.map(eng => 
                  `• ${eng.name} (${eng.id})\n` +
                  `  Role: ${eng.role} ${eng.level}\n` +
                  `  Team: ${eng.team}\n` +
                  `  Location: ${eng.location}\n` +
                  `  Skills: ${eng.skills.join(', ')}\n` +
                  `  Hire Date: ${eng.hireDate}\n`
                ).join('\n'),
        },
      ],
    };
  }

  private async getProjectStatus(args: any) {
    let projects = [...engineeringDatabase.projects];

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
    let repos = [...engineeringDatabase.repositories];

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
    let deployments = [...engineeringDatabase.deployments];

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
    let incidents = [...engineeringDatabase.incidents];

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
    let reviews = [...engineeringDatabase.codeReviews];

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

  private async getOncallSchedule(args: any) {
    let rotations = [...engineeringDatabase.oncallRotations];

    if (args.team) {
      rotations = rotations.filter(r => r.team.toLowerCase().includes(args.team.toLowerCase()));
    }

    if (args.service) {
      rotations = rotations.filter(r => r.service.toLowerCase().includes(args.service.toLowerCase()));
    }

    if (args.engineer) {
      rotations = rotations.filter(r => r.engineer === args.engineer);
    }

    return {
      content: [
        {
          type: 'text',
          text: `**Oncall Schedule (${rotations.length} rotations)**\n\n` +
                rotations.map(rotation => {
                  const engineer = engineeringDatabase.engineers.find(e => e.id === rotation.engineer);
                  return `• **${rotation.service}** (${rotation.team})\n` +
                         `  Engineer: ${engineer?.name || rotation.engineer}\n` +
                         `  Period: ${rotation.startDate} to ${rotation.endDate}\n` +
                         `  Escalation: ${rotation.escalationPath.map(id => {
                           const eng = engineeringDatabase.engineers.find(e => e.id === id);
                           return eng?.name || id;
                         }).join(' → ')}\n`;
                }).join('\n'),
        },
      ],
    };
  }

  private async getTeamHealthMetrics(args: any) {
    let teams = [...engineeringDatabase.teams];

    if (args.team) {
      teams = teams.filter(t => t.name.toLowerCase().includes(args.team.toLowerCase()));
    }

    return {
      content: [
        {
          type: 'text',
          text: `**Team Health Metrics**\n\n` +
                teams.map(team => {
                  const teamRepos = engineeringDatabase.repositories.filter(r => r.team === team.name);
                  const teamProjects = engineeringDatabase.projects.filter(p => p.team === team.name);
                  const teamIncidents = engineeringDatabase.incidents.filter(i => 
                    teamRepos.some(repo => repo.name === i.service)
                  );
                  
                  return `• **${team.name}** (${team.type})\n` +
                         `  Manager: ${engineeringDatabase.engineers.find(e => e.id === team.manager)?.name || 'Unknown'}\n` +
                         `  Engineers: ${team.engineers.length} | Budget: $${team.budget.toLocaleString()}\n` +
                         `  Active Projects: ${teamProjects.filter(p => p.status === 'Active').length}/${teamProjects.length}\n` +
                         `  Repositories: ${teamRepos.length}\n` +
                         `  Avg Test Coverage: ${teamRepos.length > 0 ? Math.round(teamRepos.reduce((sum, r) => sum + r.testCoverage, 0) / teamRepos.length) : 0}%\n` +
                         `  Avg Tech Debt: ${teamRepos.length > 0 ? (teamRepos.reduce((sum, r) => sum + r.techDebtScore, 0) / teamRepos.length).toFixed(1) : 0}/10\n` +
                         `  Open Incidents: ${teamIncidents.filter(i => i.status !== 'Resolved' && i.status !== 'Post-mortem').length}\n` +
                         `  Focus: ${team.focus}\n`;
                }).join('\n'),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Engineering MCP Server running on stdio');
  }
}

const server = new EngineeringServer();
server.run().catch(console.error);