/**
 * Salesforce 샘플 데이터 시딩 스크립트
 * 실행: npm run seed
 */
import { getConnection } from './salesforce.js';

async function seed() {
  const conn = await getConnection();
  console.log('🌱 샘플 데이터 시딩 시작...\n');

  // ── 1. Accounts ──────────────────────────────────────────────────────────
  console.log('📦 거래처(Account) 생성 중...');
  const accounts = await (conn as any).sobject('Account').create([
    { Name: '삼성전자', Industry: 'Electronics', AnnualRevenue: 200000000, BillingCity: '수원', BillingCountry: '대한민국', NumberOfEmployees: 50000, Phone: '031-200-1234' },
    { Name: 'LG화학', Industry: 'Chemicals', AnnualRevenue: 150000000, BillingCity: '서울', BillingCountry: '대한민국', NumberOfEmployees: 30000, Phone: '02-3777-1114' },
    { Name: '현대자동차', Industry: 'Automotive', AnnualRevenue: 300000000, BillingCity: '서울', BillingCountry: '대한민국', NumberOfEmployees: 70000, Phone: '02-3464-1114' },
    { Name: 'SK텔레콤', Industry: 'Telecommunications', AnnualRevenue: 120000000, BillingCity: '서울', BillingCountry: '대한민국', NumberOfEmployees: 20000, Phone: '02-6100-2114' },
    { Name: '카카오', Industry: 'Technology', AnnualRevenue: 80000000, BillingCity: '성남', BillingCountry: '대한민국', NumberOfEmployees: 10000, Phone: '1577-3754' },
    { Name: '네이버', Industry: 'Technology', AnnualRevenue: 100000000, BillingCity: '성남', BillingCountry: '대한민국', NumberOfEmployees: 15000, Phone: '1588-3820' },
    { Name: '쿠팡', Industry: 'Retail', AnnualRevenue: 90000000, BillingCity: '서울', BillingCountry: '대한민국', NumberOfEmployees: 25000, Phone: '1577-7011' },
  ]);
  const accountIds = (accounts as any[]).map((a: any) => a.id);
  console.log(`  ✅ ${accountIds.length}개 거래처 생성 완료`);

  // ── 2. Contacts ──────────────────────────────────────────────────────────
  console.log('👤 담당자(Contact) 생성 중...');
  await (conn as any).sobject('Contact').create([
    { FirstName: '지수', LastName: '김', Email: 'jisoo.kim@samsung.com', Phone: '031-200-1001', Title: 'IT 구매팀장', AccountId: accountIds[0] },
    { FirstName: '민준', LastName: '이', Email: 'minjun.lee@samsung.com', Phone: '031-200-1002', Title: 'CTO', AccountId: accountIds[0] },
    { FirstName: '서연', LastName: '박', Email: 'seoyeon.park@lgchem.com', Phone: '02-3777-2001', Title: '구매 담당자', AccountId: accountIds[1] },
    { FirstName: '현우', LastName: '최', Email: 'hyunwoo.choi@hyundai.com', Phone: '02-3464-2001', Title: 'IT 인프라팀장', AccountId: accountIds[2] },
    { FirstName: '지민', LastName: '정', Email: 'jimin.jung@skt.com', Phone: '02-6100-3001', Title: 'DX 담당 이사', AccountId: accountIds[3] },
    { FirstName: '예진', LastName: '강', Email: 'yejin.kang@kakao.com', Phone: '031-8111-1001', Title: 'AI 플랫폼 팀장', AccountId: accountIds[4] },
    { FirstName: '태양', LastName: '윤', Email: 'taeyang.yoon@naver.com', Phone: '031-784-1001', Title: 'Cloud 아키텍트', AccountId: accountIds[5] },
  ]);
  console.log('  ✅ 담당자 생성 완료');

  // ── 3. Opportunities ─────────────────────────────────────────────────────
  console.log('💰 영업 기회(Opportunity) 생성 중...');
  await (conn as any).sobject('Opportunity').create([
    { Name: '삼성전자 AI플랫폼 도입', StageName: 'Proposal/Price Quote', Amount: 50000000, CloseDate: '2026-05-31', AccountId: accountIds[0], Probability: 60 },
    { Name: '삼성전자 파일럿 확장', StageName: 'Negotiation/Review', Amount: 30000000, CloseDate: '2026-04-30', AccountId: accountIds[0], Probability: 80 },
    { Name: 'LG화학 챗봇 솔루션', StageName: 'Closed Won', Amount: 25000000, CloseDate: '2026-03-15', AccountId: accountIds[1], Probability: 100 },
    { Name: '현대자동차 MCP 서버 구축', StageName: 'Qualification', Amount: 80000000, CloseDate: '2026-06-30', AccountId: accountIds[2], Probability: 30 },
    { Name: 'SK텔레콤 AI 에이전트', StageName: 'Prospecting', Amount: 120000000, CloseDate: '2026-07-31', AccountId: accountIds[3], Probability: 20 },
    { Name: '카카오 자연어 데이터 조회', StageName: 'Closed Won', Amount: 40000000, CloseDate: '2026-02-28', AccountId: accountIds[4], Probability: 100 },
    { Name: '네이버 LLM 플랫폼', StageName: 'Proposal/Price Quote', Amount: 60000000, CloseDate: '2026-05-15', AccountId: accountIds[5], Probability: 50 },
    { Name: '쿠팡 물류 AI 솔루션', StageName: 'Closed Lost', Amount: 35000000, CloseDate: '2026-01-31', AccountId: accountIds[6], Probability: 0 },
    { Name: '쿠팡 재영업 기회', StageName: 'Prospecting', Amount: 20000000, CloseDate: '2026-08-31', AccountId: accountIds[6], Probability: 15 },
  ]);
  console.log('  ✅ 영업 기회 생성 완료');

  // ── 4. Leads ─────────────────────────────────────────────────────────────
  console.log('🎯 잠재 고객(Lead) 생성 중...');
  await (conn as any).sobject('Lead').create([
    { FirstName: '수지', LastName: '한', Company: '롯데정보통신', Email: 'suji.han@lotte.com', Status: 'Open', LeadSource: 'Web', Rating: 'Hot', Phone: '02-1234-5678' },
    { FirstName: '도현', LastName: '임', Company: '포스코ICT', Email: 'dohyun.lim@poscoict.com', Status: 'Working', LeadSource: 'Conference', Rating: 'Warm', Phone: '02-2345-6789' },
    { FirstName: '하은', LastName: '오', Company: 'GS리테일', Email: 'haeun.oh@gsretail.com', Status: 'Open', LeadSource: 'Partner Referral', Rating: 'Hot', Phone: '02-3456-7890' },
    { FirstName: '준호', LastName: '신', Company: '한화시스템', Email: 'junho.shin@hanwha.com', Status: 'Working', LeadSource: 'Cold Call', Rating: 'Cold', Phone: '02-4567-8901' },
    { FirstName: '미래', LastName: '류', Company: 'KT', Email: 'mirae.ryu@kt.com', Status: 'Closed - Converted', LeadSource: 'Web', Rating: 'Warm', Phone: '02-5678-9012' },
    { FirstName: '성훈', LastName: '배', Company: '두산디지털이노베이션', Email: 'seonghun.bae@doosan.com', Status: 'Open', LeadSource: 'Email', Rating: 'Hot', Phone: '02-6789-0123' },
  ]);
  console.log('  ✅ 잠재 고객 생성 완료');

  // ── 5. Tasks ─────────────────────────────────────────────────────────────
  console.log('📋 활동(Task) 생성 중...');
  await (conn as any).sobject('Task').create([
    { Subject: '삼성전자 제안서 발송', Status: 'Completed', Priority: 'High', ActivityDate: '2026-04-10' },
    { Subject: '현대자동차 미팅 준비', Status: 'Not Started', Priority: 'High', ActivityDate: '2026-04-20' },
    { Subject: 'SK텔레콤 전화 상담', Status: 'In Progress', Priority: 'Normal', ActivityDate: '2026-04-15' },
    { Subject: '네이버 기술 데모 일정 조율', Status: 'Not Started', Priority: 'Normal', ActivityDate: '2026-04-25' },
    { Subject: '쿠팡 재영업 전략 수립', Status: 'Not Started', Priority: 'Low', ActivityDate: '2026-05-01' },
  ]);
  console.log('  ✅ 활동 생성 완료');

  console.log('\n🎉 샘플 데이터 시딩 완료!');
}

seed().catch((err) => {
  console.error('❌ 시딩 실패:', (err as Error).message);
  process.exit(1);
});
