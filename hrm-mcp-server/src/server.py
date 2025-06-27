#!/usr/bin/env python3

"""
Unified HRM & Engineering MCP Server

This server provides AI assistants with access to Human Resource Management 
and Engineering organization data, enabling comprehensive queries about 
employees, projects, teams, performance, and engineering metrics.

Business Value:
- HR managers can ask "Show me all employees with upcoming performance reviews"
- Engineering managers can query "Which engineers are working on blocked projects?"
- Executives can ask "What's our engineering team productivity and costs?"
- Directors can query "Show me team health metrics and incident response times"
- Managers can ask "Which employees have the most vacation days remaining?"
- Tech leads can query "What's our code review velocity and deployment frequency?"
"""

import json
import sys
from datetime import datetime
from typing import Any, Dict, List, Optional

# Unified HRM & Engineering Database
HRM_ENGINEERING_DATABASE = {
    "employees": [
        {
            "id": "emp_001", "firstName": "John", "lastName": "Smith", "email": "john.smith@company.com",
            "department": "Engineering", "position": "Senior Software Engineer", "manager": "emp_010",
            "hireDate": "2022-03-15", "salary": 140000, "status": "active", "location": "San Francisco",
            "phone": "+1-555-0101", "emergencyContact": {"name": "Jane Smith", "phone": "+1-555-0102", "relationship": "spouse"},
            "engineeringLevel": "L6", "role": "SWE", "skills": ["Python", "Java", "Kubernetes", "AWS"],
            "currentProjects": ["proj_001"], "isOncall": False
        },
        {
            "id": "emp_002", "firstName": "Emily", "lastName": "Johnson", "email": "emily.johnson@company.com",
            "department": "Marketing", "position": "Marketing Manager", "manager": "emp_011",
            "hireDate": "2021-08-20", "salary": 95000, "status": "active", "location": "New York",
            "phone": "+1-555-0201", "emergencyContact": {"name": "Michael Johnson", "phone": "+1-555-0202", "relationship": "brother"},
            "engineeringLevel": None, "role": None, "skills": ["Digital Marketing", "Analytics", "Content Strategy"],
            "currentProjects": ["proj_002"], "isOncall": False
        },
        {
            "id": "emp_003", "firstName": "Michael", "lastName": "Brown", "email": "michael.brown@company.com",
            "department": "Sales", "position": "Sales Representative", "manager": "emp_012",
            "hireDate": "2023-01-10", "salary": 75000, "status": "active", "location": "Chicago",
            "phone": "+1-555-0301", "emergencyContact": {"name": "Sarah Brown", "phone": "+1-555-0302", "relationship": "wife"},
            "engineeringLevel": None, "role": None, "skills": ["Sales Strategy", "CRM", "Negotiation"],
            "currentProjects": [], "isOncall": False
        },
        {
            "id": "emp_004", "firstName": "Sarah", "lastName": "Davis", "email": "sarah.davis@company.com",
            "department": "HR", "position": "HR Business Partner", "manager": "emp_013",
            "hireDate": "2020-06-15", "salary": 85000, "status": "active", "location": "Austin",
            "phone": "+1-555-0401", "emergencyContact": {"name": "David Davis", "phone": "+1-555-0402", "relationship": "husband"},
            "engineeringLevel": None, "role": None, "skills": ["HR Strategy", "Employee Relations", "Recruiting"],
            "currentProjects": ["proj_003"], "isOncall": False
        },
        {
            "id": "emp_005", "firstName": "David", "lastName": "Wilson", "email": "david.wilson@company.com",
            "department": "Finance", "position": "Senior Financial Analyst", "manager": "emp_014",
            "hireDate": "2022-11-01", "salary": 105000, "status": "active", "location": "Seattle",
            "phone": "+1-555-0501", "emergencyContact": {"name": "Lisa Wilson", "phone": "+1-555-0502", "relationship": "mother"},
            "engineeringLevel": None, "role": None, "skills": ["Financial Modeling", "Excel", "SQL"],
            "currentProjects": [], "isOncall": False
        },
        {
            "id": "emp_006", "firstName": "Lisa", "lastName": "Garcia", "email": "lisa.garcia@company.com",
            "department": "Engineering", "position": "DevOps Engineer", "manager": "emp_010",
            "hireDate": "2021-04-12", "salary": 125000, "status": "active", "location": "San Francisco",
            "phone": "+1-555-0601", "emergencyContact": {"name": "Carlos Garcia", "phone": "+1-555-0602", "relationship": "brother"},
            "engineeringLevel": "L5", "role": "SRE", "skills": ["Kubernetes", "Terraform", "Monitoring", "Go"],
            "currentProjects": ["proj_001", "proj_004"], "isOncall": True
        },
        {
            "id": "emp_007", "firstName": "Robert", "lastName": "Martinez", "email": "robert.martinez@company.com",
            "department": "Engineering", "position": "Data Engineer", "manager": "emp_010",
            "hireDate": "2022-09-05", "salary": 130000, "status": "active", "location": "Austin",
            "phone": "+1-555-0701", "emergencyContact": {"name": "Maria Martinez", "phone": "+1-555-0702", "relationship": "wife"},
            "engineeringLevel": "L5", "role": "Data", "skills": ["Python", "Spark", "Airflow", "BigQuery"],
            "currentProjects": ["proj_003"], "isOncall": False
        },
        {
            "id": "emp_010", "firstName": "Jennifer", "lastName": "Lee", "email": "jennifer.lee@company.com",
            "department": "Engineering", "position": "Engineering Manager", "manager": "emp_015",
            "hireDate": "2019-02-20", "salary": 180000, "status": "active", "location": "San Francisco",
            "phone": "+1-555-1001", "emergencyContact": {"name": "Kevin Lee", "phone": "+1-555-1002", "relationship": "husband"},
            "engineeringLevel": "L7", "role": "Manager", "skills": ["Leadership", "System Design", "Python", "Team Management"],
            "currentProjects": ["proj_001"], "isOncall": False
        },
        {
            "id": "emp_011", "firstName": "Mark", "lastName": "Thompson", "email": "mark.thompson@company.com",
            "department": "Marketing", "position": "Marketing Director", "manager": "emp_015",
            "hireDate": "2018-07-15", "salary": 160000, "status": "active", "location": "New York",
            "phone": "+1-555-1101", "emergencyContact": {"name": "Anna Thompson", "phone": "+1-555-1102", "relationship": "wife"},
            "engineeringLevel": None, "role": None, "skills": ["Marketing Strategy", "Brand Management", "Leadership"],
            "currentProjects": ["proj_002"], "isOncall": False
        },
        {
            "id": "emp_015", "firstName": "Amanda", "lastName": "White", "email": "amanda.white@company.com",
            "department": "Executive", "position": "VP Engineering", "manager": None,
            "hireDate": "2017-01-10", "salary": 250000, "status": "active", "location": "San Francisco",
            "phone": "+1-555-1501", "emergencyContact": {"name": "James White", "phone": "+1-555-1502", "relationship": "spouse"},
            "engineeringLevel": "L9", "role": "VP", "skills": ["Leadership", "Strategy", "Scaling", "Technical Vision"],
            "currentProjects": [], "isOncall": False
        }
    ],

    "departments": [
        {"id": "dept_001", "name": "Engineering", "manager": "emp_015", "budget": 5000000, "headcount": 4, "location": "San Francisco"},
        {"id": "dept_002", "name": "Marketing", "manager": "emp_011", "budget": 2000000, "headcount": 2, "location": "New York"},
        {"id": "dept_003", "name": "Sales", "manager": "emp_012", "budget": 1500000, "headcount": 1, "location": "Chicago"},
        {"id": "dept_004", "name": "HR", "manager": "emp_013", "budget": 800000, "headcount": 1, "location": "Austin"},
        {"id": "dept_005", "name": "Finance", "manager": "emp_014", "budget": 1000000, "headcount": 1, "location": "Seattle"}
    ],

    "payrollRecords": [
        {
            "id": "pay_001", "employeeId": "emp_001", "payPeriod": "2024-06-01",
            "grossPay": 5384.62, "netPay": 3845.72,
            "deductions": {"tax": 1076.92, "health": 250.00, "retirement": 211.98},
            "overtime": 0
        },
        {
            "id": "pay_002", "employeeId": "emp_002", "payPeriod": "2024-06-01",
            "grossPay": 3653.85, "netPay": 2745.15,
            "deductions": {"tax": 730.77, "health": 178.00, "retirement": 0},
            "overtime": 0
        }
    ],

    "timeOffRequests": [
        {
            "id": "to_001", "employeeId": "emp_001", "type": "vacation",
            "startDate": "2024-07-15", "endDate": "2024-07-19", "days": 5,
            "status": "approved", "reason": "Family vacation"
        },
        {
            "id": "to_002", "employeeId": "emp_002", "type": "sick",
            "startDate": "2024-06-20", "endDate": "2024-06-21", "days": 2,
            "status": "approved", "reason": "Flu symptoms"
        },
        {
            "id": "to_003", "employeeId": "emp_003", "type": "personal",
            "startDate": "2024-07-01", "endDate": "2024-07-01", "days": 1,
            "status": "pending", "reason": "Personal appointment"
        }
    ],

    "performanceReviews": [
        {
            "id": "pr_001", "employeeId": "emp_001", "reviewerId": "emp_010",
            "period": "2024-Q2", "overallRating": 4.5,
            "goals": ["Complete microservices migration", "Mentor junior developers"],
            "feedback": "Excellent technical leadership and delivery",
            "nextReviewDate": "2024-09-15", "status": "completed"
        },
        {
            "id": "pr_002", "employeeId": "emp_002", "reviewerId": "emp_011",
            "period": "2024-Q2", "overallRating": 4.0,
            "goals": ["Launch new product campaign", "Improve conversion rates"],
            "feedback": "Strong campaign execution, room for analytics improvement",
            "nextReviewDate": "2024-09-20", "status": "completed"
        },
        {
            "id": "pr_003", "employeeId": "emp_003", "reviewerId": "emp_012",
            "period": "2024-Q2", "overallRating": 3.8,
            "goals": ["Exceed sales quota", "Improve client relationships"],
            "feedback": "Good performance, focus on relationship building",
            "nextReviewDate": "2024-09-25", "status": "scheduled"
        }
    ],

    # Engineering Data
    "projects": [
        {
            "id": "proj_001", "name": "Search Relevance V3",
            "description": "Next generation search ranking algorithm",
            "status": "Active", "priority": "P0", "owner": "emp_001", "team": "Engineering",
            "startDate": "2024-01-15", "targetDate": "2024-08-15", "progress": 65,
            "budget": 500000, "risks": ["ML model performance", "Data pipeline complexity"],
            "dependencies": []
        },
        {
            "id": "proj_002", "name": "Mobile App Redesign",
            "description": "Complete mobile app UI/UX overhaul",
            "status": "Planning", "priority": "P1", "owner": "emp_002", "team": "Marketing",
            "startDate": "2024-07-01", "targetDate": "2024-12-31", "progress": 10,
            "budget": 300000, "risks": ["User adoption", "Development timeline"],
            "dependencies": ["proj_001"]
        },
        {
            "id": "proj_003", "name": "Customer Analytics Platform",
            "description": "Real-time customer behavior analytics",
            "status": "Blocked", "priority": "P2", "owner": "emp_004", "team": "HR",
            "startDate": "2024-03-01", "targetDate": "2024-10-15", "progress": 35,
            "budget": 450000, "risks": ["Data privacy compliance", "Integration complexity"],
            "dependencies": []
        },
        {
            "id": "proj_004", "name": "Infrastructure Modernization",
            "description": "Migrate legacy systems to cloud-native architecture",
            "status": "Active", "priority": "P1", "owner": "emp_006", "team": "Engineering",
            "startDate": "2024-02-01", "targetDate": "2024-09-30", "progress": 45,
            "budget": 750000, "risks": ["Migration complexity", "Downtime risk"],
            "dependencies": []
        }
    ],

    "repositories": [
        {
            "id": "repo_001", "name": "search-service", "type": "Service", "language": "Python",
            "team": "Engineering", "linesOfCode": 125000, "contributors": 8,
            "lastCommit": "2024-06-20T14:30:00Z", "deploymentFreq": 5, "techDebtScore": 6,
            "securityVulns": {"critical": 0, "high": 2, "medium": 8, "low": 15},
            "testCoverage": 87, "uptime": 99.95
        },
        {
            "id": "repo_002", "name": "mobile-app", "type": "Mobile", "language": "React Native",
            "team": "Marketing", "linesOfCode": 95000, "contributors": 6,
            "lastCommit": "2024-06-19T16:45:00Z", "deploymentFreq": 2, "techDebtScore": 8,
            "securityVulns": {"critical": 1, "high": 3, "medium": 12, "low": 20},
            "testCoverage": 76, "uptime": 99.9
        },
        {
            "id": "repo_003", "name": "analytics-platform", "type": "Data", "language": "Python",
            "team": "HR", "linesOfCode": 85000, "contributors": 4,
            "lastCommit": "2024-06-18T11:20:00Z", "deploymentFreq": 3, "techDebtScore": 5,
            "securityVulns": {"critical": 0, "high": 1, "medium": 6, "low": 11},
            "testCoverage": 82, "uptime": 99.8
        }
    ],

    "deployments": [
        {
            "id": "deploy_001", "repository": "search-service", "version": "v2.4.1",
            "environment": "production", "deployer": "emp_001", "timestamp": "2024-06-21T10:30:00Z",
            "duration": 12, "status": "success"
        },
        {
            "id": "deploy_002", "repository": "mobile-app", "version": "v1.8.0",
            "environment": "staging", "deployer": "emp_002", "timestamp": "2024-06-20T15:45:00Z",
            "duration": 18, "status": "success"
        },
        {
            "id": "deploy_003", "repository": "analytics-platform", "version": "v1.2.3",
            "environment": "production", "deployer": "emp_004", "timestamp": "2024-06-19T14:20:00Z",
            "duration": 25, "status": "failed", "rollbackReason": "Database migration issues"
        }
    ],

    "incidents": [
        {
            "id": "inc_001", "title": "Search API high latency", "severity": "SEV1",
            "status": "Resolved", "service": "search-service", "assignee": "emp_001",
            "reporter": "emp_002", "createdAt": "2024-06-20T14:30:00Z",
            "resolvedAt": "2024-06-20T16:45:00Z", "mttr": 135,
            "impact": "Search response time increased by 300%",
            "rootCause": "Database connection pool exhaustion"
        },
        {
            "id": "inc_002", "title": "Mobile app login failures", "severity": "SEV2",
            "status": "Investigating", "service": "mobile-app", "assignee": "emp_002",
            "reporter": "emp_001", "createdAt": "2024-06-21T09:15:00Z",
            "resolvedAt": None, "mttr": 0,
            "impact": "15% of users unable to login", "rootCause": None
        }
    ],

    "codeReviews": [
        {
            "id": "cr_001", "repository": "search-service", "author": "emp_001",
            "reviewers": ["emp_002"], "title": "Optimize search query processing",
            "linesChanged": 245, "createdAt": "2024-06-20T09:30:00Z",
            "mergedAt": "2024-06-21T14:15:00Z", "status": "Merged", "reviewTime": 6.5
        },
        {
            "id": "cr_002", "repository": "mobile-app", "author": "emp_002",
            "reviewers": ["emp_001", "emp_004"], "title": "Add biometric authentication",
            "linesChanged": 312, "createdAt": "2024-06-19T16:00:00Z",
            "mergedAt": None, "status": "Open", "reviewTime": 0
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
            "name": "unified-hrm-engineering-server",
            "version": "1.0.0"
        }
    }

def handle_list_resources():
    """Handle list resources request."""
    return {
        "resources": [
            {
                "uri": "hrm://company-overview",
                "name": "Company Overview",
                "description": "High-level company metrics and statistics",
                "mimeType": "application/json"
            },
            {
                "uri": "hrm://org-chart",
                "name": "Organization Chart",
                "description": "Company organizational structure",
                "mimeType": "application/json"
            },
            {
                "uri": "hrm://payroll-summary",
                "name": "Payroll Summary",
                "description": "Current payroll statistics and trends",
                "mimeType": "application/json"
            },
            {
                "uri": "engineering://team-structure",
                "name": "Engineering Team Structure",
                "description": "Engineering organization and team breakdown",
                "mimeType": "application/json"
            },
            {
                "uri": "engineering://tech-stack",
                "name": "Technology Stack",
                "description": "Technologies and tools used across engineering",
                "mimeType": "application/json"
            }
        ]
    }

def handle_read_resource(uri):
    """Handle read resource request."""
    if uri == "hrm://company-overview":
        employees = HRM_ENGINEERING_DATABASE["employees"]
        active_employees = [e for e in employees if e["status"] == "active"]
        
        summary = {
            "totalEmployees": len(employees),
            "activeEmployees": len(active_employees),
            "departmentBreakdown": {},
            "averageSalary": sum(e["salary"] for e in employees) / len(employees),
            "totalPayroll": sum(e["salary"] for e in employees)
        }
        
        for emp in employees:
            dept = emp["department"]
            summary["departmentBreakdown"][dept] = summary["departmentBreakdown"].get(dept, 0) + 1
        
        return {
            "contents": [
                {
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": json.dumps(summary, indent=2)
                }
            ]
        }
    
    elif uri == "hrm://org-chart":
        org_structure = {}
        employees = HRM_ENGINEERING_DATABASE["employees"]
        
        for emp in employees:
            dept = emp["department"]
            if dept not in org_structure:
                org_structure[dept] = []
            org_structure[dept].append({
                "id": emp["id"],
                "name": f"{emp['firstName']} {emp['lastName']}",
                "position": emp["position"],
                "manager": emp["manager"]
            })
        
        return {
            "contents": [
                {
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": json.dumps(org_structure, indent=2)
                }
            ]
        }
    
    elif uri == "hrm://payroll-summary":
        employees = HRM_ENGINEERING_DATABASE["employees"]
        payroll_data = {
            "totalEmployees": len(employees),
            "totalAnnualPayroll": sum(e["salary"] for e in employees),
            "averageSalary": sum(e["salary"] for e in employees) / len(employees),
            "salaryByDepartment": {}
        }
        
        for emp in employees:
            dept = emp["department"]
            if dept not in payroll_data["salaryByDepartment"]:
                payroll_data["salaryByDepartment"][dept] = {"employees": 0, "totalSalary": 0}
            payroll_data["salaryByDepartment"][dept]["employees"] += 1
            payroll_data["salaryByDepartment"][dept]["totalSalary"] += emp["salary"]
        
        return {
            "contents": [
                {
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": json.dumps(payroll_data, indent=2)
                }
            ]
        }
    
    elif uri == "engineering://team-structure":
        engineers = [e for e in HRM_ENGINEERING_DATABASE["employees"] if e.get("engineeringLevel")]
        team_data = {
            "totalEngineers": len(engineers),
            "levelBreakdown": {},
            "roleBreakdown": {},
            "oncallEngineers": len([e for e in engineers if e.get("isOncall")])
        }
        
        for eng in engineers:
            level = eng.get("engineeringLevel", "Unknown")
            role = eng.get("role", "Unknown")
            team_data["levelBreakdown"][level] = team_data["levelBreakdown"].get(level, 0) + 1
            team_data["roleBreakdown"][role] = team_data["roleBreakdown"].get(role, 0) + 1
        
        return {
            "contents": [
                {
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": json.dumps(team_data, indent=2)
                }
            ]
        }
    
    elif uri == "engineering://tech-stack":
        engineers = [e for e in HRM_ENGINEERING_DATABASE["employees"] if e.get("skills")]
        all_skills = {}
        
        for eng in engineers:
            for skill in eng.get("skills", []):
                all_skills[skill] = all_skills.get(skill, 0) + 1
        
        tech_stack = {
            "totalSkills": len(all_skills),
            "skillFrequency": dict(sorted(all_skills.items(), key=lambda x: x[1], reverse=True)),
            "repositories": len(HRM_ENGINEERING_DATABASE["repositories"]),
            "languages": list(set(r["language"] for r in HRM_ENGINEERING_DATABASE["repositories"]))
        }
        
        return {
            "contents": [
                {
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": json.dumps(tech_stack, indent=2)
                }
            ]
        }
    
    else:
        raise ValueError(f"Unknown resource: {uri}")

def handle_list_tools():
    """Handle list tools request."""
    return {
        "tools": [
            # HR Tools
            {
                "name": "search_employees",
                "description": "Search employees by various criteria (name, department, position, status)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Search query (employee name, email, or ID)"
                        },
                        "department": {
                            "type": "string",
                            "description": "Filter by department"
                        },
                        "position": {
                            "type": "string",
                            "description": "Filter by position"
                        },
                        "status": {
                            "type": "string",
                            "enum": ["active", "inactive", "on_leave"],
                            "description": "Filter by employment status"
                        }
                    }
                }
            },
            {
                "name": "get_employee_details",
                "description": "Get detailed information about a specific employee",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "employeeId": {
                            "type": "string",
                            "description": "Employee ID"
                        }
                    },
                    "required": ["employeeId"]
                }
            },
            {
                "name": "get_salary_analysis",
                "description": "Analyze salary data across different dimensions",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "groupBy": {
                            "type": "string",
                            "enum": ["department", "position", "location"],
                            "description": "Group salary analysis by dimension",
                            "default": "department"
                        }
                    }
                }
            },
            {
                "name": "get_time_off_summary",
                "description": "Get time off requests and vacation balance summary",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "employeeId": {
                            "type": "string",
                            "description": "Filter by specific employee ID"
                        },
                        "status": {
                            "type": "string",
                            "enum": ["pending", "approved", "denied"],
                            "description": "Filter by request status"
                        },
                        "type": {
                            "type": "string",
                            "enum": ["vacation", "sick", "personal", "maternity", "paternity"],
                            "description": "Filter by time off type"
                        }
                    }
                }
            },
            {
                "name": "get_performance_reviews",
                "description": "Get performance review data and ratings",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "employeeId": {
                            "type": "string",
                            "description": "Filter by specific employee ID"
                        },
                        "period": {
                            "type": "string",
                            "description": "Filter by review period (e.g., '2024-Q2')"
                        },
                        "status": {
                            "type": "string",
                            "enum": ["scheduled", "completed", "overdue"],
                            "description": "Filter by review status"
                        }
                    }
                }
            },
            # Engineering Tools
            {
                "name": "search_engineers",
                "description": "Search engineering team members by skills, level, projects, or oncall status",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "skill": {
                            "type": "string",
                            "description": "Filter by specific skill or technology"
                        },
                        "level": {
                            "type": "string",
                            "description": "Filter by engineering level (L3-L10)"
                        },
                        "role": {
                            "type": "string",
                            "enum": ["SWE", "SRE", "Data", "ML", "Security", "Manager", "Director", "VP"],
                            "description": "Filter by engineering role"
                        },
                        "isOncall": {
                            "type": "boolean",
                            "description": "Filter by oncall status"
                        }
                    }
                }
            },
            {
                "name": "get_project_status",
                "description": "Get status of engineering projects including progress and blockers",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "status": {
                            "type": "string",
                            "enum": ["Active", "Planning", "Blocked", "Completed"],
                            "description": "Filter by project status"
                        },
                        "priority": {
                            "type": "string",
                            "enum": ["P0", "P1", "P2", "P3"],
                            "description": "Filter by priority level"
                        },
                        "owner": {
                            "type": "string",
                            "description": "Filter by project owner ID"
                        }
                    }
                }
            },
            {
                "name": "repository_metrics",
                "description": "Get repository health metrics including security, test coverage, and tech debt",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "team": {
                            "type": "string",
                            "description": "Filter by team name"
                        },
                        "language": {
                            "type": "string",
                            "description": "Filter by programming language"
                        },
                        "showVulnerabilities": {
                            "type": "boolean",
                            "description": "Include security vulnerability details",
                            "default": False
                        }
                    }
                }
            },
            {
                "name": "deployment_dashboard",
                "description": "Get deployment frequency and success rates across services",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "environment": {
                            "type": "string",
                            "enum": ["production", "staging", "development"],
                            "description": "Filter by deployment environment"
                        },
                        "repository": {
                            "type": "string",
                            "description": "Filter by specific repository"
                        },
                        "days": {
                            "type": "number",
                            "description": "Look back period in days",
                            "default": 30
                        }
                    }
                }
            },
            {
                "name": "incident_analysis",
                "description": "Analyze incidents, MTTR, and service reliability metrics",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "severity": {
                            "type": "string",
                            "enum": ["SEV1", "SEV2", "SEV3", "SEV4"],
                            "description": "Filter by incident severity"
                        },
                        "service": {
                            "type": "string",
                            "description": "Filter by affected service"
                        },
                        "status": {
                            "type": "string",
                            "enum": ["Open", "Investigating", "Resolved"],
                            "description": "Filter by incident status"
                        }
                    }
                }
            },
            {
                "name": "code_review_metrics",
                "description": "Get code review velocity and quality metrics",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repository": {
                            "type": "string",
                            "description": "Filter by repository name"
                        },
                        "author": {
                            "type": "string",
                            "description": "Filter by PR author"
                        },
                        "status": {
                            "type": "string",
                            "enum": ["Open", "Merged", "Closed"],
                            "description": "Filter by review status"
                        }
                    }
                }
            }
        ]
    }

# Tool implementations
def search_employees(args):
    """Search employees by various criteria."""
    results = HRM_ENGINEERING_DATABASE["employees"][:]
    
    if args.get("query"):
        query = args["query"].lower()
        results = [
            emp for emp in results
            if query in emp["firstName"].lower() or
               query in emp["lastName"].lower() or
               query in emp["email"].lower() or
               query in emp["id"].lower()
        ]
    
    if args.get("department"):
        results = [emp for emp in results if emp["department"] == args["department"]]
    
    if args.get("position"):
        results = [emp for emp in results if emp["position"] == args["position"]]
    
    if args.get("status"):
        results = [emp for emp in results if emp["status"] == args["status"]]
    
    text = f"Found {len(results)} employees:\n\n"
    text += "\n".join([
        f"• {emp['firstName']} {emp['lastName']} - {emp['position']} ({emp['department']}) - ${emp['salary']:,}"
        for emp in results
    ])
    
    return {
        "content": [
            {
                "type": "text",
                "text": text
            }
        ]
    }

def get_employee_details(args):
    """Get detailed information about a specific employee."""
    employee_id = args["employeeId"]
    employee = next((e for e in HRM_ENGINEERING_DATABASE["employees"] if e["id"] == employee_id), None)
    
    if not employee:
        raise ValueError(f"Employee not found: {employee_id}")
    
    text = f"**Employee Details: {employee['firstName']} {employee['lastName']}**\n\n"
    text += f"• Employee ID: {employee['id']}\n"
    text += f"• Email: {employee['email']}\n"
    text += f"• Department: {employee['department']}\n"
    text += f"• Position: {employee['position']}\n"
    text += f"• Salary: ${employee['salary']:,}\n"
    text += f"• Hire Date: {employee['hireDate']}\n"
    text += f"• Status: {employee['status']}\n"
    text += f"• Location: {employee['location']}\n"
    text += f"• Manager: {employee['manager'] or 'None'}\n"
    
    if employee.get("engineeringLevel"):
        text += f"\n**Engineering Details:**\n"
        text += f"• Level: {employee['engineeringLevel']}\n"
        text += f"• Role: {employee['role']}\n"
        text += f"• Skills: {', '.join(employee.get('skills', []))}\n"
        text += f"• Current Projects: {', '.join(employee.get('currentProjects', []))}\n"
        text += f"• On-call: {'Yes' if employee.get('isOncall') else 'No'}\n"
    
    return {
        "content": [
            {
                "type": "text",
                "text": text
            }
        ]
    }

def get_salary_analysis(args):
    """Analyze salary data."""
    group_by = args.get("groupBy", "department")
    employees = HRM_ENGINEERING_DATABASE["employees"]
    grouped_data = {}
    
    for emp in employees:
        if group_by == "department":
            key = emp["department"]
        elif group_by == "position":
            key = emp["position"]
        elif group_by == "location":
            key = emp["location"]
        else:
            key = emp["department"]
        
        if key not in grouped_data:
            grouped_data[key] = []
        grouped_data[key].append(emp)
    
    analysis = []
    for key, emps in grouped_data.items():
        salaries = [e["salary"] for e in emps]
        avg = sum(salaries) / len(salaries)
        analysis.append({
            "group": key,
            "count": len(emps),
            "averageSalary": round(avg),
            "minSalary": min(salaries),
            "maxSalary": max(salaries),
            "totalPayroll": sum(salaries)
        })
    
    analysis.sort(key=lambda x: x["averageSalary"], reverse=True)
    
    text = f"**Salary Analysis by {group_by.capitalize()}**\n\n"
    for item in analysis:
        text += (f"**{item['group']}:**\n"
                f"• Employees: {item['count']}\n"
                f"• Average Salary: ${item['averageSalary']:,}\n"
                f"• Salary Range: ${item['minSalary']:,} - ${item['maxSalary']:,}\n"
                f"• Total Payroll: ${item['totalPayroll']:,}\n\n")
    
    total_employees = len(employees)
    company_avg = round(sum(e["salary"] for e in employees) / total_employees)
    total_payroll = sum(e["salary"] for e in employees)
    
    text += (f"**Overall Statistics:**\n"
            f"• Total Employees: {total_employees}\n"
            f"• Company Average: ${company_avg:,}\n"
            f"• Total Company Payroll: ${total_payroll:,}")
    
    return {
        "content": [
            {
                "type": "text",
                "text": text
            }
        ]
    }

def get_time_off_summary(args):
    """Get time off requests summary."""
    requests = HRM_ENGINEERING_DATABASE["timeOffRequests"][:]
    
    if args.get("employeeId"):
        requests = [r for r in requests if r["employeeId"] == args["employeeId"]]
    
    if args.get("status"):
        requests = [r for r in requests if r["status"] == args["status"]]
    
    if args.get("type"):
        requests = [r for r in requests if r["type"] == args["type"]]
    
    summary = {}
    for req in requests:
        req_type = req["type"]
        if req_type not in summary:
            summary[req_type] = {"count": 0, "days": 0}
        summary[req_type]["count"] += 1
        summary[req_type]["days"] += req["days"]
    
    text = f"**Time Off Summary**\n\n**Requests ({len(requests)} total):**\n"
    
    for req in requests:
        text += f"• {req['type'].title()}: {req['startDate']} to {req['endDate']} ({req['days']} days) - {req['status']}\n"
    
    text += "\n**Summary by Type:**\n"
    for req_type, data in summary.items():
        text += f"• {req_type.title()}: {data['count']} requests, {data['days']} total days\n"
    
    return {
        "content": [
            {
                "type": "text",
                "text": text
            }
        ]
    }

def get_performance_reviews(args):
    """Get performance review data."""
    reviews = HRM_ENGINEERING_DATABASE["performanceReviews"][:]
    
    if args.get("employeeId"):
        reviews = [r for r in reviews if r["employeeId"] == args["employeeId"]]
    
    if args.get("period"):
        reviews = [r for r in reviews if r["period"] == args["period"]]
    
    if args.get("status"):
        reviews = [r for r in reviews if r["status"] == args["status"]]
    
    text = f"**Performance Reviews ({len(reviews)} total)**\n\n"
    
    for review in reviews:
        employee = next((e for e in HRM_ENGINEERING_DATABASE["employees"] if e["id"] == review["employeeId"]), None)
        emp_name = f"{employee['firstName']} {employee['lastName']}" if employee else "Unknown"
        
        text += f"**{emp_name} - {review['period']}**\n"
        text += f"• Overall Rating: {review['overallRating']}/5.0\n"
        text += f"• Status: {review['status']}\n"
        text += f"• Goals: {', '.join(review['goals'])}\n"
        text += f"• Feedback: {review['feedback']}\n"
        text += f"• Next Review: {review['nextReviewDate']}\n\n"
    
    if reviews:
        avg_rating = sum(r["overallRating"] for r in reviews) / len(reviews)
        text += f"**Summary:**\n• Average Rating: {avg_rating:.1f}/5.0\n"
    
    return {
        "content": [
            {
                "type": "text",
                "text": text
            }
        ]
    }

def search_engineers(args):
    """Search engineering team members."""
    engineers = [e for e in HRM_ENGINEERING_DATABASE["employees"] if e.get("engineeringLevel")]
    
    if args.get("skill"):
        skill = args["skill"].lower()
        engineers = [e for e in engineers if any(skill in s.lower() for s in e.get("skills", []))]
    
    if args.get("level"):
        engineers = [e for e in engineers if e.get("engineeringLevel") == args["level"]]
    
    if args.get("role"):
        engineers = [e for e in engineers if e.get("role") == args["role"]]
    
    if args.get("isOncall") is not None:
        engineers = [e for e in engineers if e.get("isOncall") == args["isOncall"]]
    
    text = f"Found {len(engineers)} engineers:\n\n"
    text += "\n".join([
        f"• {eng['firstName']} {eng['lastName']} - {eng.get('engineeringLevel')} {eng.get('role')} - {', '.join(eng.get('skills', []))}"
        for eng in engineers
    ])
    
    return {
        "content": [
            {
                "type": "text",
                "text": text
            }
        ]
    }

def get_project_status(args):
    """Get project status and details."""
    projects = HRM_ENGINEERING_DATABASE["projects"][:]
    
    if args.get("status"):
        projects = [p for p in projects if p["status"] == args["status"]]
    
    if args.get("priority"):
        projects = [p for p in projects if p["priority"] == args["priority"]]
    
    if args.get("owner"):
        projects = [p for p in projects if p["owner"] == args["owner"]]
    
    text = f"**Project Status ({len(projects)} projects)**\n\n"
    
    for project in projects:
        owner = next((e for e in HRM_ENGINEERING_DATABASE["employees"] if e["id"] == project["owner"]), None)
        owner_name = f"{owner['firstName']} {owner['lastName']}" if owner else "Unknown"
        
        text += f"**{project['name']} ({project['priority']})**\n"
        text += f"• Status: {project['status']}\n"
        text += f"• Progress: {project['progress']}%\n"
        text += f"• Owner: {owner_name}\n"
        text += f"• Team: {project['team']}\n"
        text += f"• Target Date: {project['targetDate']}\n"
        text += f"• Budget: ${project['budget']:,}\n"
        if project.get("risks"):
            text += f"• Risks: {', '.join(project['risks'])}\n"
        text += f"• Description: {project['description']}\n\n"
    
    return {
        "content": [
            {
                "type": "text",
                "text": text
            }
        ]
    }

def repository_metrics(args):
    """Get repository health metrics."""
    repos = HRM_ENGINEERING_DATABASE["repositories"][:]
    
    if args.get("team"):
        repos = [r for r in repos if r["team"] == args["team"]]
    
    if args.get("language"):
        repos = [r for r in repos if r["language"] == args["language"]]
    
    text = f"**Repository Metrics ({len(repos)} repositories)**\n\n"
    
    for repo in repos:
        text += f"**{repo['name']} ({repo['language']})**\n"
        text += f"• Team: {repo['team']}\n"
        text += f"• Lines of Code: {repo['linesOfCode']:,}\n"
        text += f"• Contributors: {repo['contributors']}\n"
        text += f"• Test Coverage: {repo['testCoverage']}%\n"
        text += f"• Tech Debt Score: {repo['techDebtScore']}/10\n"
        text += f"• Deployment Frequency: {repo['deploymentFreq']}/week\n"
        text += f"• Uptime: {repo['uptime']}%\n"
        
        if args.get("showVulnerabilities"):
            vulns = repo["securityVulns"]
            text += f"• Security Vulnerabilities: {vulns['critical']} critical, {vulns['high']} high, {vulns['medium']} medium, {vulns['low']} low\n"
        
        text += "\n"
    
    return {
        "content": [
            {
                "type": "text",
                "text": text
            }
        ]
    }

def deployment_dashboard(args):
    """Get deployment metrics."""
    deployments = HRM_ENGINEERING_DATABASE["deployments"][:]
    
    if args.get("environment"):
        deployments = [d for d in deployments if d["environment"] == args["environment"]]
    
    if args.get("repository"):
        deployments = [d for d in deployments if d["repository"] == args["repository"]]
    
    text = f"**Deployment Dashboard ({len(deployments)} deployments)**\n\n"
    
    success_count = len([d for d in deployments if d["status"] == "success"])
    success_rate = (success_count / len(deployments) * 100) if deployments else 0
    avg_duration = sum(d["duration"] for d in deployments) / len(deployments) if deployments else 0
    
    text += f"**Overall Metrics:**\n"
    text += f"• Success Rate: {success_rate:.1f}%\n"
    text += f"• Average Duration: {avg_duration:.1f} minutes\n"
    text += f"• Total Deployments: {len(deployments)}\n\n"
    
    text += "**Recent Deployments:**\n"
    for deployment in deployments:
        deployer = next((e for e in HRM_ENGINEERING_DATABASE["employees"] if e["id"] == deployment["deployer"]), None)
        deployer_name = f"{deployer['firstName']} {deployer['lastName']}" if deployer else "Unknown"
        
        text += f"• {deployment['repository']} {deployment['version']} to {deployment['environment']}\n"
        text += f"  Status: {deployment['status']} | Duration: {deployment['duration']}min | Deployer: {deployer_name}\n"
        if deployment.get("rollbackReason"):
            text += f"  Rollback Reason: {deployment['rollbackReason']}\n"
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
    """Analyze incidents and MTTR."""
    incidents = HRM_ENGINEERING_DATABASE["incidents"][:]
    
    if args.get("severity"):
        incidents = [i for i in incidents if i["severity"] == args["severity"]]
    
    if args.get("service"):
        incidents = [i for i in incidents if i["service"] == args["service"]]
    
    if args.get("status"):
        incidents = [i for i in incidents if i["status"] == args["status"]]
    
    text = f"**Incident Analysis ({len(incidents)} incidents)**\n\n"
    
    resolved_incidents = [i for i in incidents if i["status"] == "Resolved"]
    avg_mttr = sum(i["mttr"] for i in resolved_incidents) / len(resolved_incidents) if resolved_incidents else 0
    
    text += f"**Summary:**\n"
    text += f"• Total Incidents: {len(incidents)}\n"
    text += f"• Resolved: {len(resolved_incidents)}\n"
    text += f"• Average MTTR: {avg_mttr:.0f} minutes\n\n"
    
    text += "**Incident Details:**\n"
    for incident in incidents:
        assignee = next((e for e in HRM_ENGINEERING_DATABASE["employees"] if e["id"] == incident["assignee"]), None)
        assignee_name = f"{assignee['firstName']} {assignee['lastName']}" if assignee else "Unknown"
        
        text += f"**{incident['title']} ({incident['severity']})**\n"
        text += f"• Service: {incident['service']}\n"
        text += f"• Status: {incident['status']}\n"
        text += f"• Assignee: {assignee_name}\n"
        text += f"• Impact: {incident['impact']}\n"
        if incident.get("rootCause"):
            text += f"• Root Cause: {incident['rootCause']}\n"
        if incident["status"] == "Resolved":
            text += f"• MTTR: {incident['mttr']} minutes\n"
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
    """Get code review metrics."""
    reviews = HRM_ENGINEERING_DATABASE["codeReviews"][:]
    
    if args.get("repository"):
        reviews = [r for r in reviews if r["repository"] == args["repository"]]
    
    if args.get("author"):
        reviews = [r for r in reviews if r["author"] == args["author"]]
    
    if args.get("status"):
        reviews = [r for r in reviews if r["status"] == args["status"]]
    
    text = f"**Code Review Metrics ({len(reviews)} reviews)**\n\n"
    
    merged_reviews = [r for r in reviews if r["status"] == "Merged"]
    avg_review_time = sum(r["reviewTime"] for r in merged_reviews) / len(merged_reviews) if merged_reviews else 0
    avg_lines_changed = sum(r["linesChanged"] for r in reviews) / len(reviews) if reviews else 0
    
    text += f"**Summary:**\n"
    text += f"• Total Reviews: {len(reviews)}\n"
    text += f"• Merged: {len(merged_reviews)}\n"
    text += f"• Average Review Time: {avg_review_time:.1f} hours\n"
    text += f"• Average Lines Changed: {avg_lines_changed:.0f}\n\n"
    
    text += "**Review Details:**\n"
    for review in reviews:
        author = next((e for e in HRM_ENGINEERING_DATABASE["employees"] if e["id"] == review["author"]), None)
        author_name = f"{author['firstName']} {author['lastName']}" if author else "Unknown"
        
        text += f"**{review['title']}**\n"
        text += f"• Repository: {review['repository']}\n"
        text += f"• Author: {author_name}\n"
        text += f"• Status: {review['status']}\n"
        text += f"• Lines Changed: {review['linesChanged']}\n"
        if review["status"] == "Merged":
            text += f"• Review Time: {review['reviewTime']} hours\n"
        text += "\n"
    
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
        if name == "search_employees":
            return search_employees(arguments)
        elif name == "get_employee_details":
            return get_employee_details(arguments)
        elif name == "get_salary_analysis":
            return get_salary_analysis(arguments)
        elif name == "get_time_off_summary":
            return get_time_off_summary(arguments)
        elif name == "get_performance_reviews":
            return get_performance_reviews(arguments)
        elif name == "search_engineers":
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
    print("Unified HRM & Engineering MCP Server running on stdio", file=sys.stderr)
    
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