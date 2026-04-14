import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  getAccounts,
  searchAccounts,
  getOpportunities,
  getOpportunitiesByStage,
  getOpportunitiesSummary,
  getContacts,
  searchContacts,
  getLeads,
  getLeadsByStatus,
  getRecentActivities,
  runSOQL,
} from './salesforce.js';

const server = new Server(
  { name: 'salesforce-mcp-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// ── Tool Definitions ──────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_accounts',
      description: '거래처(Account) 목록을 가져옵니다. 회사 이름, 업종, 매출 등 정보를 포함합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: '가져올 최대 건수 (기본 20)', default: 20 },
        },
      },
    },
    {
      name: 'search_accounts',
      description: '키워드로 거래처를 검색합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: '검색할 회사명 키워드' },
        },
        required: ['keyword'],
      },
    },
    {
      name: 'get_opportunities',
      description: '영업 기회(Opportunity) 목록을 가져옵니다. 딜 금액, 단계, 마감일 등 포함.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: '가져올 최대 건수 (기본 20)', default: 20 },
        },
      },
    },
    {
      name: 'get_opportunities_by_stage',
      description: '특정 영업 단계의 기회를 조회합니다. 예: Prospecting, Qualification, Proposal/Price Quote, Negotiation/Review, Closed Won, Closed Lost',
      inputSchema: {
        type: 'object',
        properties: {
          stage: { type: 'string', description: '영업 단계명 (예: Closed Won, Prospecting)' },
        },
        required: ['stage'],
      },
    },
    {
      name: 'get_opportunities_summary',
      description: '영업 기회를 단계별로 집계합니다. 각 단계별 건수와 총 금액을 보여줍니다.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_contacts',
      description: '담당자(Contact) 목록을 가져옵니다. 이름, 이메일, 직함, 소속 회사 포함.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: '가져올 최대 건수 (기본 20)', default: 20 },
        },
      },
    },
    {
      name: 'search_contacts',
      description: '이름으로 담당자를 검색합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: '검색할 담당자 이름 키워드' },
        },
        required: ['keyword'],
      },
    },
    {
      name: 'get_leads',
      description: '잠재 고객(Lead) 목록을 가져옵니다. 회사명, 상태, 유입 경로 포함.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: '가져올 최대 건수 (기본 20)', default: 20 },
        },
      },
    },
    {
      name: 'get_leads_by_status',
      description: '특정 상태의 잠재 고객을 조회합니다. 예: Open, Working, Closed - Converted',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', description: '리드 상태 (예: Open, Working)' },
        },
        required: ['status'],
      },
    },
    {
      name: 'get_recent_activities',
      description: '최근 활동(Task) 내역을 가져옵니다. 할 일, 통화, 이메일 등.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: '가져올 최대 건수 (기본 20)', default: 20 },
        },
      },
    },
    {
      name: 'run_soql',
      description: '직접 SOQL 쿼리를 실행합니다. 고급 사용자용.',
      inputSchema: {
        type: 'object',
        properties: {
          soql: { type: 'string', description: '실행할 SOQL 쿼리문' },
        },
        required: ['soql'],
      },
    },
  ],
}));

// ── Tool Handlers ─────────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      case 'get_accounts':
        result = await getAccounts((args?.limit as number) || 20);
        break;
      case 'search_accounts':
        result = await searchAccounts(args?.keyword as string);
        break;
      case 'get_opportunities':
        result = await getOpportunities((args?.limit as number) || 20);
        break;
      case 'get_opportunities_by_stage':
        result = await getOpportunitiesByStage(args?.stage as string);
        break;
      case 'get_opportunities_summary':
        result = await getOpportunitiesSummary();
        break;
      case 'get_contacts':
        result = await getContacts((args?.limit as number) || 20);
        break;
      case 'search_contacts':
        result = await searchContacts(args?.keyword as string);
        break;
      case 'get_leads':
        result = await getLeads((args?.limit as number) || 20);
        break;
      case 'get_leads_by_status':
        result = await getLeadsByStatus(args?.status as string);
        break;
      case 'get_recent_activities':
        result = await getRecentActivities((args?.limit as number) || 20);
        break;
      case 'run_soql':
        result = await runSOQL(args?.soql as string);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[MCP] Salesforce MCP Server running on stdio');
}

main().catch((err) => {
  console.error('[MCP] Fatal error:', err);
  process.exit(1);
});
