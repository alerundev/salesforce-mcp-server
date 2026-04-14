import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { query } from '../salesforce.js';

export const search_contacts = {
  name: 'search_contacts',
  description: '이름으로 담당자(Contact)를 검색합니다.',
  args: {
    keyword: z.string().describe('검색할 담당자 이름 키워드'),
  },
  handle: async ({ keyword }: { keyword: string }): Promise<CallToolResult> => {
    const records = await query(
      `SELECT Id, FirstName, LastName, Email, Phone, Title, Account.Name FROM Contact WHERE LastName LIKE '%${keyword}%' OR FirstName LIKE '%${keyword}%' LIMIT 20`
    );
    return {
      content: [{ type: 'text', text: JSON.stringify(records, null, 2) }],
    };
  },
};
