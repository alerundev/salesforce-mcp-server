import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { query } from '../salesforce.js';

export const get_opportunities = {
  name: 'get_opportunities',
  description: '영업 기회(Opportunity) 목록을 조회합니다. 딜명, 단계, 금액, 마감일, 거래처명, 성공 확률을 포함합니다.',
  args: {
    limit: z.number().optional().default(20).describe('가져올 최대 건수 (기본 20)'),
  },
  handle: async ({ limit = 20 }: { limit?: number }): Promise<CallToolResult> => {
    const records = await query(
      `SELECT Id, Name, StageName, Amount, CloseDate, Account.Name, Probability
       FROM Opportunity ORDER BY CloseDate ASC LIMIT ${limit}`
    );
    return {
      content: [{ type: 'text', text: JSON.stringify(records, null, 2) }],
    };
  },
};
