import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export const get_schema = {
  name: 'get_schema',
  description: 'Salesforce 데이터 구조(스키마)를 반환합니다. 어떤 오브젝트와 필드가 있는지 확인할 때 사용하세요. SOQL 작성 전에 반드시 이 툴로 스키마를 확인하세요.',
  args: {},
  handle: async (): Promise<CallToolResult> => {
    const schema = {
      available_objects: {
        Account: {
          description: '거래처(고객사) 정보',
          key_fields: ['Id', 'Name', 'Industry', 'AnnualRevenue', 'Phone', 'BillingCity', 'BillingCountry', 'NumberOfEmployees', 'Description'],
          example_soql: "SELECT Id, Name, BillingCountry, Industry FROM Account WHERE BillingCountry = 'South Korea' LIMIT 20"
        },
        Contact: {
          description: '담당자 정보',
          key_fields: ['Id', 'FirstName', 'LastName', 'Email', 'Phone', 'Title', 'AccountId', 'Account.Name'],
          example_soql: "SELECT FirstName, LastName, Title, Account.Name FROM Contact LIMIT 20"
        },
        Opportunity: {
          description: '영업기회 (딜). 제품명은 Name 필드에 [제품명] 형식으로 포함됨.',
          key_fields: ['Id', 'Name', 'StageName', 'Amount', 'CloseDate', 'AccountId', 'Account.Name', 'Account.BillingCountry', 'Probability', 'Description'],
          stage_values: ['Prospecting', 'Qualification', 'Needs Analysis', 'Value Proposition', 'Id. Decision Makers', 'Perception Analysis', 'Proposal/Price Quote', 'Negotiation/Review', 'Closed Won', 'Closed Lost'],
          products_in_name: ['SKYGREEN', 'ECOZEN', 'CLARO', 'ECOTRIA', 'SKYPET', 'SKYPURA', 'SKYPEL', 'SKYTRA', 'SKYDMT', 'SKYCHDM', 'SKYDMCD', 'SKYCHDA', 'SKYBON', 'ECOTRION', 'CnR', '전자용케미칼'],
          example_soql: "SELECT Name, Account.Name, Account.BillingCountry, StageName, Amount, CloseDate FROM Opportunity WHERE Name LIKE '%ECOZEN%' ORDER BY CloseDate DESC LIMIT 20"
        },
        Lead: {
          description: '잠재고객(리드) 정보',
          key_fields: ['Id', 'FirstName', 'LastName', 'Company', 'Email', 'Status', 'LeadSource', 'Rating', 'Country', 'Industry', 'Description'],
          status_values: ['Open - Not Contacted', 'Working - Contacted', 'Closed - Converted', 'Closed - Not Converted'],
          example_soql: "SELECT FirstName, LastName, Company, Country, Status, Description FROM Lead WHERE Rating = 'Hot' LIMIT 20"
        },
        Task: {
          description: '고객 컨택 활동 내역. Subject에 [제품명] 포함.',
          key_fields: ['Id', 'Subject', 'Status', 'Priority', 'ActivityDate', 'Description'],
          status_values: ['Completed', 'In Progress', 'Not Started'],
          example_soql: "SELECT Subject, Status, ActivityDate, Description FROM Task WHERE Subject LIKE '%ECOZEN%' ORDER BY ActivityDate DESC LIMIT 20"
        }
      },
      important_notes: [
        "커스텀 오브젝트(Activity__c, Contact__r 등)는 존재하지 않습니다. 반드시 표준 오브젝트만 사용하세요.",
        "제품 정보는 Opportunity.Name 또는 Task.Subject 필드에 [제품명] 형식으로 포함되어 있습니다.",
        "국가 정보는 Account.BillingCountry 또는 Lead.Country 필드에 있습니다.",
        "연도 필터는 CALENDAR_YEAR(CloseDate) = 2026 또는 CloseDate >= 2026-01-01 AND CloseDate <= 2026-12-31 형식을 사용하세요.",
        "제품별 컨택 빈도는 Opportunity를 Name LIKE '%제품명%' 로 필터 후 COUNT하세요."
      ],
      useful_soql_patterns: {
        "제품별 영업기회 건수": "SELECT COUNT(Id) cnt FROM Opportunity WHERE Name LIKE '%ECOZEN%'",
        "국가별 영업기회": "SELECT Account.BillingCountry, COUNT(Id) cnt, SUM(Amount) totalAmount FROM Opportunity GROUP BY Account.BillingCountry ORDER BY COUNT(Id) DESC LIMIT 20",
        "2026년 제품별 집계": "SELECT StageName, COUNT(Id) cnt FROM Opportunity WHERE Name LIKE '%SKYGREEN%' AND CALENDAR_YEAR(CloseDate) = 2026 GROUP BY StageName",
        "Hot 리드 국가별": "SELECT Country, COUNT(Id) cnt FROM Lead WHERE Rating = 'Hot' GROUP BY Country ORDER BY COUNT(Id) DESC"
      }
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(schema, null, 2) }]
    };
  },
};
