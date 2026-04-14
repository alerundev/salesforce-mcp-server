import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { query } from '../salesforce.js';

export const get_opportunities_by_stage = {
  name: 'get_opportunities_by_stage',
  description: '특정 영업 단계의 기회를 조회합니다. 단계: Prospecting, Qualification, Proposal/Price Quote, Negotiation/Review, Closed Won, Closed Lost',
  args: {
    stage: z.string().describe('영업 단계명 (예: Closed Won, Prospecting, Negotiation/Review)'),
  },
  handle: async ({ stage }: { stage: string }): Promise<CallToolResult> => {
    const records = await query(
      `SELECT Id, Name, StageName, Amount, CloseDate, Account.Name, Probability FROM Opportunity WHERE StageName = '${stage}' ORDER BY Amount DESC LIMIT 20`
    );
    return {
      content: [{ type: 'text', text: JSON.stringify(records, null, 2) }],
    };
  },
};
