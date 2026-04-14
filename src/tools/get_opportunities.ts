import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { query } from '../salesforce.js';

export const get_opportunities = {
  name: 'get_opportunities',
  description: '영업 기회(Opportunity) 목록을 조회합니다. 딜명, 단계, 금액, 마감일, 거래처명, 성공 확률을 포함합니다.',
  args: {
    limit: z.number().optional().default(20).describe('가져올 최대 건수 (기본 20, 최대 100)'),
    stage: z.string().optional().describe('영업 단계 필터 (예: Closed Won, Prospecting)'),
    product: z.string().optional().describe('제품명 필터 (예: ECOZEN, SKYGREEN, ECOTRIA)'),
    year: z.string().optional().describe('연도 필터 (예: 2025, 2026)'),
  },
  handle: async ({ limit = 20, stage, product, year }: { limit?: number; stage?: string; product?: string; year?: string }): Promise<CallToolResult> => {
    let where = '';
    const conditions: string[] = [];
    if (stage) conditions.push(`StageName = '${stage}'`);
    if (product) conditions.push(`Name LIKE '%${product}%'`);
    if (year) conditions.push(`CloseDate >= ${year}-01-01 AND CloseDate <= ${year}-12-31`);
    if (conditions.length > 0) where = `WHERE ${conditions.join(' AND ')}`;

    const records = await query(`SELECT Name, StageName, Amount, CloseDate, Account.Name, Probability FROM Opportunity ${where} ORDER BY CloseDate ASC LIMIT ${Math.min(limit, 100)}`);
    return { content: [{ type: 'text', text: JSON.stringify(records, null, 2) }] };
  },
};
