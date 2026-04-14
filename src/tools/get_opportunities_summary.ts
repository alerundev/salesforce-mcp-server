import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { query } from '../salesforce.js';

export const get_opportunities_summary = {
  name: 'get_opportunities_summary',
  description: '영업 기회를 단계별로 집계합니다. 각 단계별 건수와 총 금액을 요약해서 보여줍니다.',
  args: {},
  handle: async (): Promise<CallToolResult> => {
    const records = await query(
      `SELECT StageName, COUNT(Id) cnt, SUM(Amount) totalAmount FROM Opportunity GROUP BY StageName`
    );
    return {
      content: [{ type: 'text', text: JSON.stringify(records, null, 2) }],
    };
  },
};
