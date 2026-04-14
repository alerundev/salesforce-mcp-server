import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { query } from '../salesforce.js';

export const get_contacts = {
  name: 'get_contacts',
  description: '담당자(Contact) 목록을 조회합니다. 이름, 이메일, 전화번호, 직함, 소속 회사를 포함합니다.',
  args: {
    limit: z.number().optional().default(20).describe('가져올 최대 건수 (기본 20)'),
  },
  handle: async ({ limit = 20 }: { limit?: number }): Promise<CallToolResult> => {
    const records = await query(
      `SELECT Id, FirstName, LastName, Email, Phone, Title, Account.Name
       FROM Contact ORDER BY CreatedDate DESC LIMIT ${limit}`
    );
    return {
      content: [{ type: 'text', text: JSON.stringify(records, null, 2) }],
    };
  },
};
