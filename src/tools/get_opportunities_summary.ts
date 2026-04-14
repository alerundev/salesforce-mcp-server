import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { query } from '../salesforce.js';

export const get_opportunities_summary = {
  name: 'get_opportunities_summary',
  description: '영업 기회를 다양한 기준으로 집계합니다. 제품별, 단계별, 연도별 건수와 총 금액을 요약합니다.',
  args: {
    group_by: z.enum(['stage', 'product', 'year', 'country']).optional().default('stage').describe('집계 기준: stage(단계별), product(제품별), year(연도별), country(국가별)'),
    year: z.string().optional().describe('연도 필터 (예: 2025, 2026)'),
  },
  handle: async ({ group_by = 'stage', year }: { group_by?: string; year?: string }): Promise<CallToolResult> => {
    let records;
    const yearFilter = year ? `WHERE CloseDate >= ${year}-01-01 AND CloseDate <= ${year}-12-31` : '';

    if (group_by === 'product') {
      // Name의 [제품명] 패턴으로 제품별 집계
      const products = ['SKYGREEN', 'ECOZEN', 'CLARO', 'ECOTRIA', 'SKYPET', 'SKYPURA', 'SKYPEL', 'SKYTRA', 'SKYDMT', 'SKYCHDM', 'SKYDMCD', 'SKYCHDA', 'SKYBON', 'ECOTRION', 'CnR', '전자용케미칼'];
      const results = [];
      for (const product of products) {
        const whereClause = year
          ? `WHERE Name LIKE '%${product}%' AND CloseDate >= ${year}-01-01 AND CloseDate <= ${year}-12-31`
          : `WHERE Name LIKE '%${product}%'`;
        const count = await query(`SELECT COUNT() FROM Opportunity ${whereClause}`);
        const amountResult = await query(`SELECT SUM(Amount) totalAmount FROM Opportunity ${whereClause}`);
        const total = Array.isArray(amountResult) ? (amountResult[0] as any)?.totalAmount : 0;
        if (typeof count === 'number' && count > 0) {
          results.push({ product, count, totalAmount: total || 0 });
        }
      }
      return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
    } else if (group_by === 'year') {
      records = await query(`SELECT CALENDAR_YEAR(CloseDate) yr, COUNT(Id) cnt, SUM(Amount) totalAmount FROM Opportunity GROUP BY CALENDAR_YEAR(CloseDate) ORDER BY CALENDAR_YEAR(CloseDate)`);
    } else if (group_by === 'country') {
      records = await query(`SELECT Account.BillingCountry, COUNT(Id) cnt, SUM(Amount) totalAmount FROM Opportunity ${yearFilter} GROUP BY Account.BillingCountry ORDER BY COUNT(Id) DESC LIMIT 20`);
    } else {
      records = await query(`SELECT StageName, COUNT(Id) cnt, SUM(Amount) totalAmount FROM Opportunity ${yearFilter} GROUP BY StageName`);
    }
    return { content: [{ type: 'text', text: JSON.stringify(records, null, 2) }] };
  },
};
