import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { query } from '../salesforce.js';

export const get_accounts = {
  name: 'get_accounts',
  description: '거래처(Account) 목록을 조회합니다. 회사명, 업종, 연매출, 전화번호, 도시 정보를 포함합니다.',
  args: {
    limit: z.number().optional().default(20).describe('가져올 최대 건수 (기본 20)'),
  },
  handle: async ({ limit = 20 }: { limit?: number }): Promise<CallToolResult> => {
    const records = await query(
      `SELECT Id, Name, Industry, AnnualRevenue, Phone, BillingCity, BillingCountry, NumberOfEmployees FROM Account ORDER BY CreatedDate DESC LIMIT ${limit}`
    );
    return {
      content: [{ type: 'text', text: JSON.stringify(records, null, 2) }],
    };
  },
};
