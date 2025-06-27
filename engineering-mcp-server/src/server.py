#!/usr/bin/env python3

"""
Engineering MCP Server

This server provides AI assistants with access to engineering organization data,
enabling natural language queries about projects, teams, repositories, deployments, and metrics.

Designed for large-scale engineering teams (8000+ engineers) with realistic organizational structure.

Business Value:
- Engineering managers can ask "Show me all projects behind schedule"
- Tech leads can query "Which repositories have the most critical vulnerabilities?"
- Directors can ask "What's our deployment frequency across teams?"
- SREs can query "Show me recent incidents and their resolution times"
- Architects can ask "Which services have the highest technical debt?"
"""

import json
import sys
from datetime import datetime
from typing import Any, Dict, List, Optional

# Mock Engineering Database
ENGINEERING_DATABASE = {
    "engineers": [
        {
            "id": "eng_001", "name": "Alex Chen", "email": "alex.chen@company.com",
            "level": "L6", "role": "SWE", "team": "Search Platform",
            "location": "San Francisco", "hire_date": "2019-03-15",
            "skills": ["Python", "Java", "Elasticsearch", "Kafka", "AWS"], "manager": "eng_100"
        },
        {
            "id": "eng_002", "name": "Sarah Johnson", "email": "sarah.johnson@company.com",
            "level": "L7", "role": "SRE", "team": "Platform SRE",
            "location": "Seattle", "hire_date": "2018-08-20",
            "skills": ["Go", "Kubernetes", "Prometheus", "Terraform", "GCP"], "manager": "eng_101"
        },
        {
            "id": "eng_003", "name": "Marcus Rodriguez", "email": "marcus.rodriguez@company.com",
            "level": "L5", "role": "SWE", "team": "Mobile Platform",
            "location": "Austin", "hire_date": "2021-01-10",
            "skills": ["Swift", "Kotlin", "React Native", "GraphQL", "Apollo"], "manager": "eng_102"
        },
        {
            "id": "eng_004", "name": "Priya Patel", "email": "priya.patel@company.com",
            "level": "L6", "role": "Data", "team": "Data Platform",
            "location": "New York", "hire_date": "2020-06-15",
            "skills": ["Python", "Spark", "Airflow", "BigQuery", "dbt"], "manager": "eng_103"
        },
        {
            "id": "eng_005", "name": "David Kim", "email": "david.kim@company.com",
            "level": "L8", "role": "Architect", "team": "Core Platform",
            "location": "San Francisco", "hire_date": "2016-02-01",
            "skills": ["Java", "Spring", "Microservices", "PostgreSQL", "Redis"], "manager": "eng_200"
        },
        {
            "id": "eng_100", "name": "Jennifer Wu", "email": "jennifer.wu@company.com",
            "level": "L7", "role": "Manager", "team": "Search Platform",
            "location": "San Francisco", "hire_date": "2017-09-12",
            "skills": ["Python", "Leadership", "System Design", "Elasticsearch"], "manager": "eng_200"
        },
        {
            "id": "eng_101", "name": "Michael O'Brien", "email": "michael.obrien@company.com",
            "level": "L8", "role": "Manager", "team": "Platform SRE",
            "location": "Seattle", "hire_date": "2016-11-05",
            "skills": ["Go", "Kubernetes", "Leadership", "Incident Management"], "manager": "eng_200"
        },
        {
            "id": "eng_200", "name": "Lisa Anderson", "email": "lisa.anderson@company.com",
            "level": "L9", "role": "Director", "team": "Platform Engineering",
            "location": "San Francisco", "hire_date": "2015-04-20",
            "skills": ["Leadership", "Strategy", "System Architecture", "Team Building"], "manager": "eng_300"
        },
        {
            "id": "eng_300", "name": "Robert Chang", "email": "robert.chang@company.com",
            "level": "L10", "role": "VP", "team": "Engineering",
            "location": "San Francisco", "hire_date": "2014-01-15",
            "skills": ["Leadership", "Strategy", "Product", "Scaling"], "manager": None
        }
    ],
    
    "projects": [
        {
            "id": "proj_001", "name": "Search Relevance V3", 
            "description": "Next generation search ranking algorithm",
            "status": "Active", "priority": "P0", "owner": "eng_001", "team": "Search Platform",
            "start_date": "2024-04-01", "target_date": "2024-08-15", "progress": 65,
            "budget": 500000, "risks": ["ML model performance", "Data pipeline complexity"],
            "dependencies": ["proj_005"]
        },
        {
            "id": "proj_002", "name": "Kubernetes Migration",
            "description": "Migrate all services to Kubernetes",
            "status": "Active", "priority": "P1", "owner": "eng_002", "team": "Platform SRE",
            "start_date": "2024-01-15", "target_date": "2024-12-31", "progress": 40,
            "budget": 800000, "risks": ["Service disruption", "Team training"], "dependencies": []
        },
        {
            "id": "proj_003", "name": "Mobile SDK Rewrite",
            "description": "Modernize mobile SDK with new architecture",
            "status": "Planning", "priority": "P2", "owner": "eng_003", "team": "Mobile Platform",
            "start_date": "2024-07-01", "target_date": "2024-11-30", "progress": 10,
            "budget": 300000, "risks": ["Breaking changes", "Developer adoption"], "dependencies": ["proj_001"]
        },
        {
            "id": "proj_004", "name": "Real-time Analytics",
            "description": "Build real-time data processing pipeline",
            "status": "Blocked", "priority": "P1", "owner": "eng_004", "team": "Data Platform",
            "start_date": "2024-03-01", "target_date": "2024-09-15", "progress": 25,
            "budget": 450000, "risks": ["Data consistency", "Performance requirements"], "dependencies": ["proj_002"]
        },
        {
            "id": "proj_005", "name": "API Gateway V2",
            "description": "Next-gen API gateway with enhanced security",
            "status": "Completed", "priority": "P0", "owner": "eng_005", "team": "Core Platform",
            "start_date": "2023-10-01", "target_date": "2024-03-31", "actual_date": "2024-03-28",
            "progress": 100, "budget": 600000, "risks": [], "dependencies": []
        }
    ],
    
    "repositories": [
        {
            "id": "repo_001", "name": "search-service", "type": "Service", "language": "Python",
            "team": "Search Platform", "lines_of_code": 125000, "contributors": 15,
            "last_commit": "2024-06-20T14:30:00Z", "deployment_freq": 5, "tech_debt_score": 6,
            "security_vulns": {"critical": 0, "high": 2, "medium": 8, "low": 15},
            "test_coverage": 87, "uptime": 99.95
        },
        {
            "id": "repo_002", "name": "k8s-infrastructure", "type": "Infrastructure", "language": "Go",
            "team": "Platform SRE", "lines_of_code": 85000, "contributors": 8,
            "last_commit": "2024-06-21T09:15:00Z", "deployment_freq": 3, "tech_debt_score": 4,
            "security_vulns": {"critical": 0, "high": 0, "medium": 3, "low": 7},
            "test_coverage": 92, "uptime": 99.99
        },
        {
            "id": "repo_003", "name": "mobile-sdk", "type": "Mobile", "language": "Swift",
            "team": "Mobile Platform", "lines_of_code": 95000, "contributors": 12,
            "last_commit": "2024-06-19T16:45:00Z", "deployment_freq": 2, "tech_debt_score": 8,
            "security_vulns": {"critical": 1, "high": 3, "medium": 12, "low": 20},
            "test_coverage": 76, "uptime": 99.9
        },
        {
            "id": "repo_004", "name": "data-pipeline", "type": "Data", "language": "Python",
            "team": "Data Platform", "lines_of_code": 110000, "contributors": 18,
            "last_commit": "2024-06-21T11:20:00Z", "deployment_freq": 4, "tech_debt_score": 5,
            "security_vulns": {"critical": 0, "high": 1, "medium": 6, "low": 11},
            "test_coverage": 89, "uptime": 99.8
        },
        {
            "id": "repo_005", "name": "api-gateway", "type": "Service", "language": "Java",
            "team": "Core Platform", "lines_of_code": 180000, "contributors": 25,
            "last_commit": "2024-06-21T13:10:00Z", "deployment_freq": 8, "tech_debt_score": 3,
            "security_vulns": {"critical": 0, "high": 0, "medium": 2, "low": 5},
            "test_coverage": 94, "uptime": 99.99
        }
    ],
    
    "deployments": [
        {
            "id": "deploy_001", "repository": "search-service", "version": "v2.4.1",
            "environment": "production", "deployer": "eng_001", 
            "timestamp": "2024-06-21T10:30:00Z", "duration": 12, "status": "success"
        },
        {
            "id": "deploy_002", "repository": "api-gateway", "version": "v3.1.0",
            "environment": "production", "deployer": "eng_005", 
            "timestamp": "2024-06-20T15:45:00Z", "duration": 8, "status": "success"
        },
        {
            "id": "deploy_003", "repository": "mobile-sdk", "version": "v2.0.0-beta",
            "environment": "staging", "deployer": "eng_003", 
            "timestamp": "2024-06-19T14:20:00Z", "duration": 25, "status": "failed",
            "rollback_reason": "Critical UI bug discovered"
        },
        {
            "id": "deploy_004", "repository": "data-pipeline", "version": "v1.8.3",
            "environment": "production", "deployer": "eng_004", 
            "timestamp": "2024-06-21T09:15:00Z", "duration": 18, "status": "success"
        },
        {
            "id": "deploy_005", "repository": "k8s-infrastructure", "version": "v0.9.2",
            "environment": "canary", "deployer": "eng_002", 
            "timestamp": "2024-06-21T11:00:00Z", "duration": 35, "status": "rolled_back",
            "rollback_reason": "Increased latency in dependent services"
        }
    ],
    
    "incidents": [
        {
            "id": "inc_001", "title": "Search API high latency", "severity": "SEV1",
            "status": "Resolved", "service": "search-service", "assignee": "eng_001",
            "reporter": "eng_002", "created_at": "2024-06-20T14:30:00Z",
            "resolved_at": "2024-06-20T16:45:00Z", "mttr": 135,
            "impact": "Search response time increased by 300%",
            "root_cause": "Database connection pool exhaustion"
        },
        {
            "id": "inc_002", "title": "Mobile app crashes on startup", "severity": "SEV0",
            "status": "Post-mortem", "service": "mobile-sdk", "assignee": "eng_003",
            "reporter": "eng_100", "created_at": "2024-06-19T09:15:00Z",
            "resolved_at": "2024-06-19T12:30:00Z", "mttr": 195,
            "impact": "100% of iOS users unable to open app",
            "root_cause": "Memory leak in authentication module"
        },
        {
            "id": "inc_003", "title": "Data pipeline processing delays", "severity": "SEV2",
            "status": "Investigating", "service": "data-pipeline", "assignee": "eng_004",
            "reporter": "eng_103", "created_at": "2024-06-21T08:00:00Z", "mttr": 0,
            "impact": "Analytics reports delayed by 2+ hours"
        },
        {
            "id": "inc_004", "title": "API Gateway rate limiting issues", "severity": "SEV2",
            "status": "Mitigating", "service": "api-gateway", "assignee": "eng_005",
            "reporter": "eng_001", "created_at": "2024-06-21T13:45:00Z", "mttr": 0,
            "impact": "Some API calls being incorrectly rate limited"
        }
    ],
    
    "code_reviews": [
        {
            "id": "cr_001", "repository": "search-service", "author": "eng_001",
            "reviewers": ["eng_100", "eng_005"], "title": "Optimize search query processing",
            "lines_changed": 245, "created_at": "2024-06-20T09:30:00Z",
            "merged_at": "2024-06-21T14:15:00Z", "status": "Merged", "review_time": 6.5
        },
        {
            "id": "cr_002", "repository": "mobile-sdk", "author": "eng_003",
            "reviewers": ["eng_102", "eng_001"], "title": "Fix memory leak in auth module",
            "lines_changed": 89, "created_at": "2024-06-19T16:00:00Z",
            "merged_at": "2024-06-20T10:30:00Z", "status": "Merged", "review_time": 18.5
        },
        {
            "id": "cr_003", "repository": "data-pipeline", "author": "eng_004",
            "reviewers": ["eng_103", "eng_005"], "title": "Add real-time processing capability",
            "lines_changed": 512, "created_at": "2024-06-21T11:00:00Z",
            "status": "Open", "review_time": 0
        },
        {
            "id": "cr_004", "repository": "k8s-infrastructure", "author": "eng_002",
            "reviewers": ["eng_101", "eng_200"], "title": "Update cluster autoscaling configuration",
            "lines_changed": 34, "created_at": "2024-06-21T08:45:00Z",
            "status": "Changes Requested", "review_time": 4.2
        }
    ],
    
    "oncall_rotations": [
        {
            "id": "oncall_001", "team": "Search Platform", "service": "search-service",
            "engineer": "eng_001", "start_date": "2024-06-17", "end_date": "2024-06-24",
            "escalation_path": ["eng_100", "eng_200"]
        },
        {
            "id": "oncall_002", "team": "Platform SRE", "service": "k8s-infrastructure",
            "engineer": "eng_002", "start_date": "2024-06-20", "end_date": "2024-06-27",
            "escalation_path": ["eng_101", "eng_200"]
        },
        {
            "id": "oncall_003", "team": "Data Platform", "service": "data-pipeline",
            "engineer": "eng_004", "start_date": "2024-06-15", "end_date": "2024-06-22",
            "escalation_path": ["eng_103", "eng_200"]
        }
    ]
}

def handle_initialize(params):
    """Handle MCP initialize request."""
    return {
        "protocolVersion": "2024-11-05",
        "capabilities": {
            "resources": {},
            "tools": {}
        },
        "serverInfo": {
            "name": "engineering-server",
            "version": "1.0.0"
        }
    }

def handle_list_resources():
    """Handle list resources request."""
    return {
        "resources": [
            {
                "uri": "engineering://org-overview",
                "mimeType": "application/json",
                "name": "Engineering Organization Overview",
                "description": "High-level engineering metrics and KPIs"
            },
            {
                "uri": "engineering://team-structure",
                "mimeType": "application/json",
                "name": "Team Structure",
                "description": "Engineering team organization and reporting structure"
            },
            {
                "uri": "engineering://tech-stack",
                "mimeType": "application/json",
                "name": "Technology Stack",
                "description": "Technologies, languages, and tools used across engineering"
            },
            {
                "uri": "engineering://quarterly-metrics",
                "mimeType": "application/json",
                "name": "Quarterly Engineering Metrics",
                "description": "Key engineering performance indicators for current quarter"
            }
        ]
    }

def handle_read_resource(uri):
    """Handle resource read requests."""
    if uri == "engineering://org-overview":
        total_engineers = len(ENGINEERING_DATABASE["engineers"])
        total_projects = len(ENGINEERING_DATABASE["projects"])
        active_projects = len([p for p in ENGINEERING_DATABASE["projects"] if p["status"] == "Active"])
        total_repositories = len(ENGINEERING_DATABASE["repositories"])
        deployments_this_week = len(ENGINEERING_DATABASE["deployments"])
        open_incidents = len([i for i in ENGINEERING_DATABASE["incidents"] if i["status"] not in ["Resolved", "Post-mortem"]])
        avg_code_review_time = 8.5
        test_coverage_avg = round(sum(r["test_coverage"] for r in ENGINEERING_DATABASE["repositories"]) / len(ENGINEERING_DATABASE["repositories"]))
        
        overview = {
            "totalEngineers": total_engineers,
            "totalProjects": total_projects,
            "activeProjects": active_projects,
            "totalRepositories": total_repositories,
            "deploymentsThisWeek": deployments_this_week,
            "openIncidents": open_incidents,
            "avgCodeReviewTime": f"{avg_code_review_time} hours",
            "avgTestCoverage": f"{test_coverage_avg}%"
        }
        
        return {
            "contents": [
                {
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": json.dumps(overview, indent=2)
                }
            ]
        }
    
    elif uri == "engineering://team-structure":
        teams = {}
        for engineer in ENGINEERING_DATABASE["engineers"]:
            team = engineer["team"]
            if team not in teams:
                teams[team] = []
            teams[team].append({
                "id": engineer["id"],
                "name": engineer["name"],
                "role": engineer["role"],
                "level": engineer["level"],
                "manager": engineer["manager"]
            })
        
        return {
            "contents": [
                {
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": json.dumps(teams, indent=2)
                }
            ]
        }
    
    elif uri == "engineering://tech-stack":
        languages = {}
        for repo in ENGINEERING_DATABASE["repositories"]:
            lang = repo["language"]
            if lang not in languages:
                languages[lang] = {"repositories": 0, "totalLOC": 0, "teams": set()}
            languages[lang]["repositories"] += 1
            languages[lang]["totalLOC"] += repo["lines_of_code"]
            languages[lang]["teams"].add(repo["team"])
        
        # Convert sets to lists for JSON serialization
        for lang in languages:
            languages[lang]["teams"] = list(languages[lang]["teams"])
        
        return {
            "contents": [
                {
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": json.dumps(languages, indent=2)
                }
            ]
        }
    
    elif uri == "engineering://quarterly-metrics":
        metrics = {
            "deploymentFrequency": "5.2 per week",
            "incidentResolutionTime": "165 minutes avg",
            "codeReviewVelocity": "8.5 hours avg",
            "testCoverage": "87.6% avg",
            "technicalDebtScore": "5.2/10 avg"
        }
        
        return {
            "contents": [
                {
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": json.dumps(metrics, indent=2)
                }
            ]
        }
    
    else:
        raise ValueError(f"Unknown resource: {uri}")

def handle_list_tools():
    """Handle list tools request."""
    return {
        "tools": [
            {
                "name": "search_engineers",
                "description": "Search engineers by name, team, role, level, or skills",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Search query (name or email)"},
                        "team": {"type": "string", "description": "Filter by team"},
                        "role": {"type": "string", "description": "Filter by role (SWE, SRE, Manager, etc.)"},
                        "level": {"type": "string", "description": "Filter by level (L3-L10)"},
                        "location": {"type": "string", "description": "Filter by location"},
                        "skill": {"type": "string", "description": "Filter by skill"}
                    }
                }
            },
            {
                "name": "get_project_status",
                "description": "Get status of projects with filtering options",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "status": {"type": "string", "enum": ["Planning", "Active", "Blocked", "Completed", "Cancelled"]},
                        "priority": {"type": "string", "enum": ["P0", "P1", "P2", "P3"]},
                        "team": {"type": "string", "description": "Filter by team"},
                        "owner": {"type": "string", "description": "Filter by project owner"}
                    }
                }
            },
            {
                "name": "repository_metrics",
                "description": "Get repository metrics including security, quality, and performance",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "team": {"type": "string", "description": "Filter by team"},
                        "type": {"type": "string", "description": "Filter by repository type"},
                        "language": {"type": "string", "description": "Filter by programming language"},
                        "sortBy": {"type": "string", "enum": ["techDebt", "security", "coverage", "uptime"]}
                    }
                }
            },
            {
                "name": "deployment_dashboard",
                "description": "Get deployment metrics and recent deployment history",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repository": {"type": "string", "description": "Filter by repository"},
                        "environment": {"type": "string", "enum": ["dev", "staging", "canary", "production"]},
                        "status": {"type": "string", "enum": ["success", "failed", "rolled_back"]},
                        "timeframe": {"type": "string", "enum": ["24h", "7d", "30d"], "default": "7d"}
                    }
                }
            },
            {
                "name": "incident_analysis",
                "description": "Analyze incidents with filtering and metrics",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "severity": {"type": "string", "enum": ["SEV0", "SEV1", "SEV2", "SEV3", "SEV4"]},
                        "status": {"type": "string", "enum": ["Open", "Investigating", "Mitigating", "Resolved", "Post-mortem"]},
                        "service": {"type": "string", "description": "Filter by service"},
                        "assignee": {"type": "string", "description": "Filter by assignee"},
                        "timeframe": {"type": "string", "enum": ["24h", "7d", "30d"], "default": "30d"}
                    }
                }
            },
            {
                "name": "code_review_metrics",
                "description": "Get code review metrics and current review queue",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repository": {"type": "string", "description": "Filter by repository"},
                        "author": {"type": "string", "description": "Filter by author"},
                        "reviewer": {"type": "string", "description": "Filter by reviewer"},
                        "status": {"type": "string", "enum": ["Open", "Approved", "Changes Requested", "Merged", "Closed"]}
                    }
                }
            },
            {
                "name": "oncall_schedule",
                "description": "Get current and upcoming oncall schedule",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "team": {"type": "string", "description": "Filter by team"},
                        "service": {"type": "string", "description": "Filter by service"},
                        "engineer": {"type": "string", "description": "Filter by engineer"}
                    }
                }
            },
            {
                "name": "team_health_metrics",
                "description": "Get comprehensive team health and productivity metrics",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "team": {"type": "string", "description": "Specific team to analyze"},
                        "metric": {"type": "string", "enum": ["velocity", "quality", "incidents", "deployments"]}
                    }
                }
            }
        ]
    }

def search_engineers(args):
    """Search engineers by various criteria."""
    results = ENGINEERING_DATABASE["engineers"][:]

    if args.get("query"):
        query = args["query"].lower()
        results = [eng for eng in results if query in eng["name"].lower() or query in eng["email"].lower()]

    if args.get("team"):
        results = [eng for eng in results if eng["team"] == args["team"]]

    if args.get("role"):
        results = [eng for eng in results if eng["role"] == args["role"]]

    if args.get("level"):
        results = [eng for eng in results if eng["level"] == args["level"]]

    if args.get("location"):
        results = [eng for eng in results if eng["location"] == args["location"]]

    if args.get("skill"):
        skill = args["skill"].lower()
        results = [eng for eng in results if any(skill in s.lower() for s in eng["skills"])]

    text = f"Found {len(results)} engineers:\n\n"
    for engineer in results:
        text += f"• **{engineer['name']}** ({engineer['id']})\n"
        text += f"  Role: {engineer['role']} {engineer['level']}\n"
        text += f"  Team: {engineer['team']}\n"
        text += f"  Location: {engineer['location']}\n"
        text += f"  Skills: {', '.join(engineer['skills'])}\n"
        text += f"  Hire Date: {engineer['hire_date']}\n\n"

    return {
        "content": [
            {
                "type": "text",
                "text": text
            }
        ]
    }

def get_project_status(args):
    """Get status of projects with filtering options."""
    results = ENGINEERING_DATABASE["projects"][:]

    if args.get("status"):
        results = [p for p in results if p["status"] == args["status"]]

    if args.get("priority"):
        results = [p for p in results if p["priority"] == args["priority"]]

    if args.get("team"):
        results = [p for p in results if p["team"] == args["team"]]

    if args.get("owner"):
        results = [p for p in results if p["owner"] == args["owner"]]

    # Create status summary
    status_summary = {}
    for project in results:
        status = project["status"]
        status_summary[status] = status_summary.get(status, 0) + 1

    text = f"**Project Status Report ({len(results)} projects)**\n\n"
    text += "**Status Summary:**\n"
    for status, count in status_summary.items():
        text += f"• {status}: {count}\n"

    text += "\n**Project Details:**\n"
    for project in results:
        text += f"• **{project['name']}** ({project['id']})\n"
        text += f"  Status: {project['status']} | Priority: {project['priority']} | Progress: {project['progress']}%\n"
        text += f"  Owner: {project['owner']} | Team: {project['team']}\n"
        text += f"  Target: {project['target_date']} | Budget: ${project['budget']:,}\n"
        text += f"  Description: {project['description']}\n"
        if project["risks"]:
            text += f"  Risks: {', '.join(project['risks'])}\n"
        if project["dependencies"]:
            text += f"  Dependencies: {', '.join(project['dependencies'])}\n"
        text += "\n"

    return {
        "content": [
            {
                "type": "text",
                "text": text
            }
        ]
    }

def repository_metrics(args):
    """Get repository metrics including security, quality, and performance."""
    results = ENGINEERING_DATABASE["repositories"][:]

    if args.get("team"):
        results = [r for r in results if r["team"] == args["team"]]

    if args.get("type"):
        results = [r for r in results if r["type"] == args["type"]]

    if args.get("language"):
        results = [r for r in results if r["language"] == args["language"]]

    # Sort results
    if args.get("sortBy") == "techDebt":
        results.sort(key=lambda x: x["tech_debt_score"], reverse=True)
    elif args.get("sortBy") == "security":
        results.sort(key=lambda x: x["security_vulns"]["critical"] + x["security_vulns"]["high"], reverse=True)
    elif args.get("sortBy") == "coverage":
        results.sort(key=lambda x: x["test_coverage"], reverse=True)
    elif args.get("sortBy") == "uptime":
        results.sort(key=lambda x: x["uptime"], reverse=True)

    text = f"**Repository Metrics ({len(results)} repositories)**\n\n"
    for repo in results:
        text += f"• **{repo['name']}** ({repo['type']} - {repo['language']})\n"
        text += f"  Team: {repo['team']} | Contributors: {repo['contributors']}\n"
        text += f"  Lines of Code: {repo['lines_of_code']:,} | Test Coverage: {repo['test_coverage']}%\n"
        text += f"  Tech Debt Score: {repo['tech_debt_score']}/10 | Uptime: {repo['uptime']}%\n"
        vulns = repo["security_vulns"]
        text += f"  Security Vulnerabilities: {vulns['critical']} critical, {vulns['high']} high, {vulns['medium']} medium, {vulns['low']} low\n"
        text += f"  Deployment Frequency: {repo['deployment_freq']}/week\n"
        text += f"  Last Commit: {repo['last_commit']}\n\n"

    return {
        "content": [
            {
                "type": "text",
                "text": text
            }
        ]
    }

def deployment_dashboard(args):
    """Get deployment metrics and recent deployment history."""
    results = ENGINEERING_DATABASE["deployments"][:]

    if args.get("repository"):
        results = [d for d in results if d["repository"] == args["repository"]]

    if args.get("environment"):
        results = [d for d in results if d["environment"] == args["environment"]]

    if args.get("status"):
        results = [d for d in results if d["status"] == args["status"]]

    # Calculate metrics
    total_deployments = len(results)
    successful = len([d for d in results if d["status"] == "success"])
    failed = len([d for d in results if d["status"] == "failed"])
    rolled_back = len([d for d in results if d["status"] == "rolled_back"])
    
    success_rate = (successful / total_deployments * 100) if total_deployments > 0 else 0
    avg_duration = sum(d["duration"] for d in results) / total_deployments if total_deployments > 0 else 0

    text = f"**Deployment Dashboard ({total_deployments} deployments)**\n\n"
    text += f"**Metrics:**\n"
    text += f"• Success Rate: {success_rate:.1f}%\n"
    text += f"• Average Duration: {avg_duration:.1f} minutes\n"
    text += f"• Successful: {successful} | Failed: {failed} | Rolled Back: {rolled_back}\n\n"

    text += "**Recent Deployments:**\n"
    for deployment in sorted(results, key=lambda x: x["timestamp"], reverse=True):
        text += f"• **{deployment['repository']}** {deployment['version']}\n"
        text += f"  Environment: {deployment['environment']} | Status: {deployment['status']}\n"
        text += f"  Deployer: {deployment['deployer']} | Duration: {deployment['duration']} min\n"
        text += f"  Timestamp: {deployment['timestamp']}\n"
        if deployment.get("rollback_reason"):
            text += f"  Rollback Reason: {deployment['rollback_reason']}\n"
        text += "\n"

    return {
        "content": [
            {
                "type": "text",
                "text": text
            }
        ]
    }

def incident_analysis(args):
    """Analyze incidents with filtering and metrics."""
    results = ENGINEERING_DATABASE["incidents"][:]

    if args.get("severity"):
        results = [i for i in results if i["severity"] == args["severity"]]

    if args.get("status"):
        results = [i for i in results if i["status"] == args["status"]]

    if args.get("service"):
        results = [i for i in results if i["service"] == args["service"]]

    if args.get("assignee"):
        results = [i for i in results if i["assignee"] == args["assignee"]]

    # Calculate metrics
    total_incidents = len(results)
    resolved = len([i for i in results if i["status"] in ["Resolved", "Post-mortem"]])
    mttr_values = [i["mttr"] for i in results if i["mttr"] > 0]
    avg_mttr = sum(mttr_values) / len(mttr_values) if mttr_values else 0

    severity_breakdown = {}
    for incident in results:
        sev = incident["severity"]
        severity_breakdown[sev] = severity_breakdown.get(sev, 0) + 1

    text = f"**Incident Analysis ({total_incidents} incidents)**\n\n"
    text += f"**Metrics:**\n"
    text += f"• Average MTTR: {avg_mttr:.0f} minutes\n"
    text += f"• Resolved: {resolved}/{total_incidents}\n"
    text += f"• Severity Breakdown: {', '.join(f'{k}: {v}' for k, v in severity_breakdown.items())}\n\n"

    text += "**Incident Details:**\n"
    for incident in sorted(results, key=lambda x: x["created_at"], reverse=True):
        text += f"• **{incident['title']}** ({incident['severity']})\n"
        text += f"  Status: {incident['status']} | Service: {incident['service']}\n"
        text += f"  Assignee: {incident['assignee']} | Reporter: {incident['reporter']}\n"
        text += f"  Created: {incident['created_at']}\n"
        if incident.get("resolved_at"):
            text += f"  Resolved: {incident['resolved_at']} (MTTR: {incident['mttr']} min)\n"
        text += f"  Impact: {incident['impact']}\n"
        if incident.get("root_cause"):
            text += f"  Root Cause: {incident['root_cause']}\n"
        text += "\n"

    return {
        "content": [
            {
                "type": "text",
                "text": text
            }
        ]
    }

def code_review_metrics(args):
    """Get code review metrics and current review queue."""
    results = ENGINEERING_DATABASE["code_reviews"][:]

    if args.get("repository"):
        results = [cr for cr in results if cr["repository"] == args["repository"]]

    if args.get("author"):
        results = [cr for cr in results if cr["author"] == args["author"]]

    if args.get("reviewer"):
        reviewer = args["reviewer"]
        results = [cr for cr in results if reviewer in cr["reviewers"]]

    if args.get("status"):
        results = [cr for cr in results if cr["status"] == args["status"]]

    # Calculate metrics
    total_reviews = len(results)
    completed_reviews = [cr for cr in results if cr["status"] in ["Merged", "Closed"]]
    review_times = [cr["review_time"] for cr in completed_reviews if cr["review_time"] > 0]
    avg_review_time = sum(review_times) / len(review_times) if review_times else 0
    
    open_reviews = [cr for cr in results if cr["status"] == "Open"]
    avg_lines_changed = sum(cr["lines_changed"] for cr in results) / total_reviews if total_reviews > 0 else 0

    text = f"**Code Review Metrics ({total_reviews} reviews)**\n\n"
    text += f"**Metrics:**\n"
    text += f"• Average Review Time: {avg_review_time:.1f} hours\n"
    text += f"• Open Reviews: {len(open_reviews)}\n"
    text += f"• Average Lines Changed: {avg_lines_changed:.0f}\n"
    text += f"• Completion Rate: {len(completed_reviews)}/{total_reviews}\n\n"

    text += "**Review Queue:**\n"
    for review in sorted(results, key=lambda x: x["created_at"], reverse=True):
        text += f"• **{review['title']}**\n"
        text += f"  Repository: {review['repository']} | Author: {review['author']}\n"
        text += f"  Status: {review['status']} | Lines Changed: {review['lines_changed']}\n"
        text += f"  Reviewers: {', '.join(review['reviewers'])}\n"
        text += f"  Created: {review['created_at']}\n"
        if review.get("merged_at"):
            text += f"  Merged: {review['merged_at']} (Review Time: {review['review_time']} hours)\n"
        text += "\n"

    return {
        "content": [
            {
                "type": "text",
                "text": text
            }
        ]
    }

def oncall_schedule(args):
    """Get current and upcoming oncall schedule."""
    results = ENGINEERING_DATABASE["oncall_rotations"][:]

    if args.get("team"):
        results = [oc for oc in results if oc["team"] == args["team"]]

    if args.get("service"):
        results = [oc for oc in results if oc["service"] == args["service"]]

    if args.get("engineer"):
        results = [oc for oc in results if oc["engineer"] == args["engineer"]]

    text = f"**Oncall Schedule ({len(results)} rotations)**\n\n"
    for rotation in sorted(results, key=lambda x: x["start_date"]):
        text += f"• **{rotation['team']} - {rotation['service']}**\n"
        text += f"  Current Engineer: {rotation['engineer']}\n"
        text += f"  Period: {rotation['start_date']} to {rotation['end_date']}\n"
        text += f"  Escalation Path: {' → '.join(rotation['escalation_path'])}\n\n"

    return {
        "content": [
            {
                "type": "text",
                "text": text
            }
        ]
    }

def team_health_metrics(args):
    """Get comprehensive team health and productivity metrics."""
    team_filter = args.get("team")
    metric_filter = args.get("metric")

    if team_filter:
        engineers = [e for e in ENGINEERING_DATABASE["engineers"] if e["team"] == team_filter]
        projects = [p for p in ENGINEERING_DATABASE["projects"] if p["team"] == team_filter]
        repositories = [r for r in ENGINEERING_DATABASE["repositories"] if r["team"] == team_filter]
    else:
        engineers = ENGINEERING_DATABASE["engineers"]
        projects = ENGINEERING_DATABASE["projects"]
        repositories = ENGINEERING_DATABASE["repositories"]

    text = f"**Team Health Metrics**"
    if team_filter:
        text += f" - {team_filter}"
    text += "\n\n"

    if not metric_filter or metric_filter == "velocity":
        text += f"**Velocity Metrics:**\n"
        text += f"• Engineers: {len(engineers)}\n"
        text += f"• Active Projects: {len([p for p in projects if p['status'] == 'Active'])}\n"
        text += f"• Average Project Progress: {sum(p['progress'] for p in projects) / len(projects) if projects else 0:.1f}%\n"
        text += f"• Repositories: {len(repositories)}\n\n"

    if not metric_filter or metric_filter == "quality":
        if repositories:
            avg_test_coverage = sum(r["test_coverage"] for r in repositories) / len(repositories)
            avg_tech_debt = sum(r["tech_debt_score"] for r in repositories) / len(repositories)
            text += f"**Quality Metrics:**\n"
            text += f"• Average Test Coverage: {avg_test_coverage:.1f}%\n"
            text += f"• Average Tech Debt Score: {avg_tech_debt:.1f}/10\n"
            text += f"• Code Review Velocity: 8.5 hours average\n\n"

    if not metric_filter or metric_filter == "incidents":
        team_incidents = [i for i in ENGINEERING_DATABASE["incidents"] if any(r["team"] == team_filter for r in repositories if r["name"] == i["service"])] if team_filter else ENGINEERING_DATABASE["incidents"]
        open_incidents = len([i for i in team_incidents if i["status"] not in ["Resolved", "Post-mortem"]])
        text += f"**Incident Metrics:**\n"
        text += f"• Open Incidents: {open_incidents}\n"
        text += f"• Total Incidents (30d): {len(team_incidents)}\n"
        if team_incidents:
            mttr_values = [i["mttr"] for i in team_incidents if i["mttr"] > 0]
            avg_mttr = sum(mttr_values) / len(mttr_values) if mttr_values else 0
            text += f"• Average MTTR: {avg_mttr:.0f} minutes\n"
        text += "\n"

    if not metric_filter or metric_filter == "deployments":
        team_deployments = [d for d in ENGINEERING_DATABASE["deployments"] if any(r["team"] == team_filter for r in repositories if r["name"] == d["repository"])] if team_filter else ENGINEERING_DATABASE["deployments"]
        successful_deployments = len([d for d in team_deployments if d["status"] == "success"])
        success_rate = (successful_deployments / len(team_deployments) * 100) if team_deployments else 0
        text += f"**Deployment Metrics:**\n"
        text += f"• Total Deployments (7d): {len(team_deployments)}\n"
        text += f"• Success Rate: {success_rate:.1f}%\n"
        if repositories:
            avg_deploy_freq = sum(r["deployment_freq"] for r in repositories) / len(repositories)
            text += f"• Average Deploy Frequency: {avg_deploy_freq:.1f}/week\n"

    return {
        "content": [
            {
                "type": "text",
                "text": text
            }
        ]
    }

def handle_call_tool(name, arguments):
    """Handle tool calls."""
    try:
        if name == "search_engineers":
            return search_engineers(arguments)
        elif name == "get_project_status":
            return get_project_status(arguments)
        elif name == "repository_metrics":
            return repository_metrics(arguments)
        elif name == "deployment_dashboard":
            return deployment_dashboard(arguments)
        elif name == "incident_analysis":
            return incident_analysis(arguments)
        elif name == "code_review_metrics":
            return code_review_metrics(arguments)
        elif name == "oncall_schedule":
            return oncall_schedule(arguments)
        elif name == "team_health_metrics":
            return team_health_metrics(arguments)
        else:
            raise ValueError(f"Unknown tool: {name}")
    except Exception as error:
        return {
            "content": [
                {
                    "type": "text",
                    "text": f"Error: {str(error)}"
                }
            ],
            "isError": True
        }

def main():
    """Main server loop."""
    print("Engineering MCP Server running on stdio", file=sys.stderr)
    
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
                
            request = json.loads(line.strip())
            method = request.get("method")
            params = request.get("params", {})
            request_id = request.get("id")
            
            response = {
                "jsonrpc": "2.0",
                "id": request_id
            }
            
            try:
                if method == "initialize":
                    response["result"] = handle_initialize(params)
                elif method == "resources/list":
                    response["result"] = handle_list_resources()
                elif method == "resources/read":
                    response["result"] = handle_read_resource(params["uri"])
                elif method == "tools/list":
                    response["result"] = handle_list_tools()
                elif method == "tools/call":
                    response["result"] = handle_call_tool(params["name"], params["arguments"])
                elif method == "notifications/initialized":
                    # No response needed for notifications
                    continue
                else:
                    response["error"] = {
                        "code": -32601,
                        "message": "Method not found"
                    }
            except Exception as e:
                response["error"] = {
                    "code": -32603,
                    "message": str(e)
                }
            
            print(json.dumps(response), flush=True)
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"Server error: {e}", file=sys.stderr)

if __name__ == "__main__":
    main()