import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { query } from '../salesforce.js';

export const search_accounts = {
  name: 'search_accounts',
  description: '키워드로 거래처(Account)를 검색합니다.',
  args: {
    keyword: z.string().describe('검색할 회사명 키워드'),
  },
  handle: async ({ keyword }: { keyword: string }): Promise<CallToolResult> => {
    const records = await query(
      `SELECT Id, Name, Industry, AnnualRevenue, Phone, BillingCity FROM Account WHERE Name LIKE '%${keyword}%' LIMIT 20`
    );
    return {
      content: [{ type: 'text', text: JSON.stringify(records, null, 2) }],
    };
  },
};
