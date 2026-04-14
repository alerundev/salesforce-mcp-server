import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { query } from '../salesforce.js';

export const run_soql = {
  name: 'run_soql',
  description: '직접 SOQL 쿼리를 실행합니다. 원하는 데이터를 자유롭게 조회할 수 있습니다.',
  args: {
    soql: z.string().describe('실행할 SOQL 쿼리문 (예: SELECT Id, Name FROM Account LIMIT 5)'),
  },
  handle: async ({ soql }: { soql: string }): Promise<CallToolResult> => {
    const records = await query(soql);
    return {
      content: [{ type: 'text', text: JSON.stringify(records, null, 2) }],
    };
  },
};
