import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { query } from '../salesforce.js';

export const run_soql = {
  name: 'run_soql',
  description: `직접 SOQL 쿼리를 실행합니다.
⚠️ 중요: 반드시 get_schema 툴로 스키마를 먼저 확인하세요.
사용 가능한 표준 오브젝트: Account, Contact, Opportunity, Lead, Task
❌ 절대 사용 금지: Activity__c, Contact__r 등 커스텀 오브젝트
✅ 제품 조회: Opportunity.Name LIKE '%ECOZEN%' 형식 사용
✅ 국가 조회: Account.BillingCountry 또는 Lead.Country 사용`,
  args: {
    soql: z.string().describe('실행할 SOQL 쿼리. 표준 오브젝트(Account/Contact/Opportunity/Lead/Task)만 사용 가능.'),
  },
  handle: async ({ soql }: { soql: string }): Promise<CallToolResult> => {
    // 커스텀 오브젝트 사용 감지
    if (/__c\b/i.test(soql) && !/Account|Contact|Opportunity|Lead|Task/i.test(soql.replace(/__c/gi, ''))) {
      return {
        content: [{
          type: 'text',
          text: '❌ 오류: 커스텀 오브젝트(__c)는 사용할 수 없습니다. get_schema 툴로 사용 가능한 오브젝트를 확인하세요.'
        }],
        isError: true
      };
    }

    const records = await query(soql);
    return {
      content: [{ type: 'text', text: JSON.stringify(records, null, 2) }],
    };
  },
};
