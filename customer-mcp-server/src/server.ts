#!/usr/bin/env node

/**
 * Customer Data MCP Server
 * 
 * This server provides AI assistants with secure access to customer data,
 * enabling natural language queries about customers, orders, and support tickets.
 * 
 * Business Value:
 * - Customer support agents can ask "Show me all high-value customers with recent issues"
 * - Sales teams can query "Which customers haven't ordered in 90 days?"
 * - Executives can ask "What's our customer churn rate this quarter?"
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Mock customer database (in production, this would connect to your CRM/database)
const customerDatabase = {
  customers: [
    {
      id: "cust_001",
      name: "Acme Corporation",
      email: "contact@acme.com",
      tier: "enterprise",
      totalRevenue: 250000,
      lastOrderDate: "2024-05-15",
      supportTickets: 3,
      status: "active"
    },
    {
      id: "cust_002", 
      name: "TechStart Inc",
      email: "hello@techstart.com",
      tier: "growth",
      totalRevenue: 45000,
      lastOrderDate: "2024-06-01",
      supportTickets: 1,
      status: "active"
    },
    {
      id: "cust_003",
      name: "Global Solutions Ltd",
      email: "info@globalsolutions.com", 
      tier: "enterprise",
      totalRevenue: 180000,
      lastOrderDate: "2024-03-20",
      supportTickets: 7,
      status: "at_risk"
    }
  ],
  
  orders: [
    { id: "ord_001", customerId: "cust_001", amount: 25000, date: "2024-05-15", status: "completed" },
    { id: "ord_002", customerId: "cust_002", amount: 8500, date: "2024-06-01", status: "completed" },
    { id: "ord_003", customerId: "cust_001", amount: 15000, date: "2024-04-10", status: "completed" }
  ],

  supportTickets: [
    { id: "tick_001", customerId: "cust_001", subject: "API Integration Issue", priority: "high", status: "open", createdDate: "2024-06-10" },
    { id: "tick_002", customerId: "cust_003", subject: "Billing Question", priority: "medium", status: "resolved", createdDate: "2024-06-05" },
    { id: "tick_003", customerId: "cust_003", subject: "Feature Request", priority: "low", status: "open", createdDate: "2024-06-12" }
  ]
};

class CustomerDataServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'customer-data-server',
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
            name: 'search_customers',
            description: 'Search customers by various criteria (name, tier, status, revenue)',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query (customer name, email, or ID)',
                },
                tier: {
                  type: 'string',
                  enum: ['enterprise', 'growth', 'starter'],
                  description: 'Filter by customer tier',
                },
                status: {
                  type: 'string',
                  enum: ['active', 'at_risk', 'churned'],
                  description: 'Filter by customer status',
                },
                minRevenue: {
                  type: 'number',
                  description: 'Minimum total revenue',
                }
              },
            },
          },
          {
            name: 'get_customer_details',
            description: 'Get detailed information about a specific customer including orders and support tickets',
            inputSchema: {
              type: 'object',
              properties: {
                customerId: {
                  type: 'string',
                  description: 'Customer ID',
                },
              },
              required: ['customerId'],
            },
          },
          {
            name: 'analyze_customer_health',
            description: 'Analyze customer health metrics and identify at-risk customers',
            inputSchema: {
              type: 'object',
              properties: {
                daysThreshold: {
                  type: 'number',
                  description: 'Days since last order to consider a customer at risk (default: 90)',
                  default: 90
                }
              }
            },
          },
          {
            name: 'revenue_analytics',
            description: 'Get revenue analytics and trends',
            inputSchema: {
              type: 'object',
              properties: {
                period: {
                  type: 'string',
                  enum: ['month', 'quarter', 'year'],
                  description: 'Time period for analysis',
                  default: 'quarter'
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
          case 'search_customers':
            return await this.searchCustomers(args);
          case 'get_customer_details':
            return await this.getCustomerDetails(args);
          case 'analyze_customer_health':
            return await this.analyzeCustomerHealth(args);
          case 'revenue_analytics':
            return await this.getRevenueAnalytics(args);
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
            uri: 'customers://summary',
            mimeType: 'application/json',
            name: 'Customer Summary',
            description: 'High-level customer metrics and KPIs',
          },
          {
            uri: 'customers://database-schema',
            mimeType: 'application/json', 
            name: 'Database Schema',
            description: 'Customer database schema and field descriptions',
          }
        ],
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case 'customers://summary':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  totalCustomers: customerDatabase.customers.length,
                  enterpriseCustomers: customerDatabase.customers.filter(c => c.tier === 'enterprise').length,
                  totalRevenue: customerDatabase.customers.reduce((sum, c) => sum + c.totalRevenue, 0),
                  atRiskCustomers: customerDatabase.customers.filter(c => c.status === 'at_risk').length,
                  avgSupportTicketsPerCustomer: customerDatabase.supportTickets.length / customerDatabase.customers.length
                }, null, 2),
              },
            ],
          };

        case 'customers://database-schema':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  customers: {
                    id: "Unique customer identifier",
                    name: "Company name",
                    email: "Primary contact email", 
                    tier: "Customer tier: enterprise, growth, or starter",
                    totalRevenue: "Total lifetime revenue from this customer",
                    lastOrderDate: "Date of most recent order (YYYY-MM-DD)",
                    supportTickets: "Number of open support tickets",
                    status: "Customer status: active, at_risk, or churned"
                  },
                  orders: {
                    id: "Order identifier",
                    customerId: "References customer.id",
                    amount: "Order value in USD",
                    date: "Order date (YYYY-MM-DD)",
                    status: "Order status: completed, pending, cancelled"
                  },
                  supportTickets: {
                    id: "Ticket identifier", 
                    customerId: "References customer.id",
                    subject: "Ticket subject/title",
                    priority: "Priority level: high, medium, low",
                    status: "Ticket status: open, resolved, closed",
                    createdDate: "Ticket creation date (YYYY-MM-DD)"
                  }
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
  private async searchCustomers(args: any) {
    let results = [...customerDatabase.customers];

    // Apply filters
    if (args.query) {
      const query = args.query.toLowerCase();
      results = results.filter(customer => 
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.id.toLowerCase().includes(query)
      );
    }

    if (args.tier) {
      results = results.filter(customer => customer.tier === args.tier);
    }

    if (args.status) {
      results = results.filter(customer => customer.status === args.status);
    }

    if (args.minRevenue) {
      results = results.filter(customer => customer.totalRevenue >= args.minRevenue);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} customers:\n\n` + 
                results.map(customer => 
                  `• ${customer.name} (${customer.tier}) - $${customer.totalRevenue.toLocaleString()} revenue - ${customer.status}`
                ).join('\n'),
        },
      ],
    };
  }

  private async getCustomerDetails(args: any) {
    const customer = customerDatabase.customers.find(c => c.id === args.customerId);
    if (!customer) {
      throw new Error(`Customer not found: ${args.customerId}`);
    }

    const orders = customerDatabase.orders.filter(o => o.customerId === args.customerId);
    const tickets = customerDatabase.supportTickets.filter(t => t.customerId === args.customerId);

    return {
      content: [
        {
          type: 'text',
          text: `**Customer Details: ${customer.name}**\n\n` +
                `• Email: ${customer.email}\n` +
                `• Tier: ${customer.tier}\n` +
                `• Status: ${customer.status}\n` +
                `• Total Revenue: $${customer.totalRevenue.toLocaleString()}\n` +
                `• Last Order: ${customer.lastOrderDate}\n\n` +
                `**Recent Orders (${orders.length}):**\n` +
                orders.map(order => `• ${order.date}: $${order.amount.toLocaleString()} (${order.status})`).join('\n') +
                `\n\n**Support Tickets (${tickets.length}):**\n` +
                tickets.map(ticket => `• ${ticket.subject} - ${ticket.priority} priority (${ticket.status})`).join('\n'),
        },
      ],
    };
  }

  private async analyzeCustomerHealth(args: any) {
    const daysThreshold = args.daysThreshold || 90;
    const today = new Date();
    const thresholdDate = new Date(today.getTime() - (daysThreshold * 24 * 60 * 60 * 1000));

    const analysis = customerDatabase.customers.map(customer => {
      const lastOrder = new Date(customer.lastOrderDate);
      const daysSinceLastOrder = Math.floor((today.getTime() - lastOrder.getTime()) / (24 * 60 * 60 * 1000));
      const isAtRisk = daysSinceLastOrder > daysThreshold || customer.supportTickets > 5;

      return {
        ...customer,
        daysSinceLastOrder,
        isAtRisk,
        riskFactors: [
          ...(daysSinceLastOrder > daysThreshold ? [`${daysSinceLastOrder} days since last order`] : []),
          ...(customer.supportTickets > 5 ? [`${customer.supportTickets} open support tickets`] : []),
          ...(customer.status === 'at_risk' ? ['Manually marked as at-risk'] : [])
        ]
      };
    });

    const atRiskCustomers = analysis.filter(c => c.isAtRisk);
    const healthyCustomers = analysis.filter(c => !c.isAtRisk);

    return {
      content: [
        {
          type: 'text',
          text: `**Customer Health Analysis**\n\n` +
                `• Healthy Customers: ${healthyCustomers.length}\n` +
                `• At-Risk Customers: ${atRiskCustomers.length}\n` +
                `• Risk Threshold: ${daysThreshold} days since last order\n\n` +
                `**At-Risk Customers:**\n` +
                atRiskCustomers.map(customer => 
                  `• ${customer.name} ($${customer.totalRevenue.toLocaleString()}) - ${customer.riskFactors.join(', ')}`
                ).join('\n'),
        },
      ],
    };
  }

  private async getRevenueAnalytics(args: any) {
    const totalRevenue = customerDatabase.customers.reduce((sum, c) => sum + c.totalRevenue, 0);
    const avgRevenuePerCustomer = totalRevenue / customerDatabase.customers.length;
    
    const tierBreakdown = customerDatabase.customers.reduce((acc, customer) => {
      acc[customer.tier] = (acc[customer.tier] || 0) + customer.totalRevenue;
      return acc;
    }, {} as Record<string, number>);

    const enterpriseCustomers = customerDatabase.customers.filter(c => c.tier === 'enterprise');
    const enterpriseRevenue = enterpriseCustomers.reduce((sum, c) => sum + c.totalRevenue, 0);

    return {
      content: [
        {
          type: 'text',
          text: `**Revenue Analytics**\n\n` +
                `• Total Revenue: $${totalRevenue.toLocaleString()}\n` +
                `• Average Revenue per Customer: $${Math.round(avgRevenuePerCustomer).toLocaleString()}\n` +
                `• Enterprise Revenue: $${enterpriseRevenue.toLocaleString()} (${Math.round(enterpriseRevenue/totalRevenue*100)}%)\n\n` +
                `**Revenue by Tier:**\n` +
                Object.entries(tierBreakdown)
                  .map(([tier, revenue]) => `• ${tier}: $${revenue.toLocaleString()}`)
                  .join('\n'),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Customer Data MCP Server running on stdio');
  }
}

const server = new CustomerDataServer();
server.run().catch(console.error);
