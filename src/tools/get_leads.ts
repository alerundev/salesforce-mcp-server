import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { query } from '../salesforce.js';

export const get_leads = {
  name: 'get_leads',
  description: '잠재 고객(Lead) 목록을 조회합니다. 이름, 회사명, 이메일, 상태, 유입 경로, 등급을 포함합니다.',
  args: {
    limit: z.number().optional().default(20).describe('가져올 최대 건수 (기본 20)'),
  },
  handle: async ({ limit = 20 }: { limit?: number }): Promise<CallToolResult> => {
    const records = await query(
      `SELECT Id, FirstName, LastName, Company, Email, Status, LeadSource, Rating FROM Lead ORDER BY CreatedDate DESC LIMIT ${limit}`
    );
    return {
      content: [{ type: 'text', text: JSON.stringify(records, null, 2) }],
    };
  },
};
