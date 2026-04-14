import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { query } from '../salesforce.js';

export const get_recent_activities = {
  name: 'get_recent_activities',
  description: '최근 활동(Task) 내역을 조회합니다. 할 일, 통화, 이메일 등 영업 활동 이력을 포함합니다.',
  args: {
    limit: z.number().optional().default(20).describe('가져올 최대 건수 (기본 20)'),
  },
  handle: async ({ limit = 20 }: { limit?: number }): Promise<CallToolResult> => {
    const records = await query(
      `SELECT Id, Subject, Status, Priority, ActivityDate FROM Task ORDER BY CreatedDate DESC LIMIT ${limit}`
    );
    return {
      content: [{ type: 'text', text: JSON.stringify(records, null, 2) }],
    };
  },
};
