import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { query } from '../salesforce.js';

export const get_leads_by_status = {
  name: 'get_leads_by_status',
  description: '특정 상태의 잠재 고객(Lead)을 조회합니다. 상태: Open, Working, Closed - Converted, Closed - Not Converted',
  args: {
    status: z.string().describe('리드 상태 (예: Open, Working, Closed - Converted)'),
  },
  handle: async ({ status }: { status: string }): Promise<CallToolResult> => {
    const records = await query(
      `SELECT Id, FirstName, LastName, Company, Email, Status, LeadSource, Rating FROM Lead WHERE Status = '${status}' LIMIT 20`
    );
    return {
      content: [{ type: 'text', text: JSON.stringify(records, null, 2) }],
    };
  },
};
