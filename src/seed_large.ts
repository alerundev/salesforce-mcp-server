import * as https from 'https';
import * as querystring from 'querystring';

const SF_LOGIN_URL = process.env.SF_LOGIN_URL || '';
const SF_CONSUMER_KEY = process.env.SF_CONSUMER_KEY || '';
const SF_CONSUMER_SECRET = process.env.SF_CONSUMER_SECRET || '';

const PRODUCTS = [
  'SKYGREEN', 'ECOZEN', 'CLARO', 'ECOTRIA', 'SKYPET', 'SKYPURA',
  'SKYPEL', 'SKYTRA', 'SKYDMT', 'SKYCHDM', 'SKYDMCD', 'SKYCHDA',
  'SKYBON', 'ECOTRION', 'CnR', '전자용케미칼'
];

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpsRequest(options: https.RequestOptions, body?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function authenticate(): Promise<{ accessToken: string; instanceUrl: string }> {
  const loginUrl = new URL(SF_LOGIN_URL);
  const body = querystring.stringify({
    grant_type: 'client_credentials',
    client_id: SF_CONSUMER_KEY,
    client_secret: SF_CONSUMER_SECRET,
  });

  const options: https.RequestOptions = {
    hostname: loginUrl.hostname,
    path: '/services/oauth2/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  const res = await httpsRequest(options, body);
  if (res.statusCode !== 200) {
    throw new Error(`Auth failed: ${JSON.stringify(res.body)}`);
  }
  return { accessToken: res.body.access_token, instanceUrl: res.body.instance_url };
}

async function createRecord(
  instanceUrl: string,
  accessToken: string,
  sobject: string,
  data: Record<string, any>
): Promise<string | null> {
  const url = new URL(instanceUrl);
  const body = JSON.stringify(data);
  const options: https.RequestOptions = {
    hostname: url.hostname,
    path: `/services/data/v59.0/sobjects/${sobject}`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  try {
    const res = await httpsRequest(options, body);
    if (res.statusCode === 201 && res.body.id) {
      return res.body.id;
    } else {
      console.error(`[WARN] ${sobject} create failed (${res.statusCode}): ${JSON.stringify(res.body)}`);
      return null;
    }
  } catch (err) {
    console.error(`[ERROR] ${sobject} request error: ${err}`);
    return null;
  }
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(startYear: number, endYear: number): string {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  const d = new Date(start + Math.random() * (end - start));
  return d.toISOString().split('T')[0];
}

function randomDateTime(startYear: number, endYear: number): string {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  const d = new Date(start + Math.random() * (end - start));
  return d.toISOString();
}

// Account 데이터 정의
const ACCOUNTS_DEF = [
  // 한국 10개
  { name: 'SK네트웍스', country: '대한민국', city: '서울', industry: 'Chemical', region: 'KR' },
  { name: 'LG화학', country: '대한민국', city: '서울', industry: 'Chemical', region: 'KR' },
  { name: '롯데케미칼', country: '대한민국', city: '서울', industry: 'Chemical', region: 'KR' },
  { name: '한화솔루션', country: '대한민국', city: '서울', industry: 'Chemical', region: 'KR' },
  { name: '효성화학', country: '대한민국', city: '서울', industry: 'Chemical', region: 'KR' },
  { name: '금호석유화학', country: '대한민국', city: '여수', industry: 'Chemical', region: 'KR' },
  { name: '태광산업', country: '대한민국', city: '울산', industry: 'Chemical', region: 'KR' },
  { name: '동성화학', country: '대한민국', city: '부산', industry: 'Chemical', region: 'KR' },
  { name: '코오롱인더스트리', country: '대한민국', city: '서울', industry: 'Apparel', region: 'KR' },
  { name: '삼양홀딩스', country: '대한민국', city: '서울', industry: 'Chemical', region: 'KR' },
  // 미국 8개
  { name: 'Eastman Chemical', country: 'United States', city: 'Kingsport', industry: 'Chemical', region: 'US' },
  { name: 'Dow Chemical', country: 'United States', city: 'Midland', industry: 'Chemical', region: 'US' },
  { name: 'BASF Corporation', country: 'United States', city: 'Florham Park', industry: 'Chemical', region: 'US' },
  { name: 'Celanese Corporation', country: 'United States', city: 'Irving', industry: 'Chemical', region: 'US' },
  { name: 'Indorama Ventures USA', country: 'United States', city: 'Charlotte', industry: 'Chemical', region: 'US' },
  { name: 'Berry Global', country: 'United States', city: 'Evansville', industry: 'Plastics', region: 'US' },
  { name: 'Amcor Flexibles', country: 'United States', city: 'Zurich', industry: 'Packaging', region: 'US' },
  { name: 'Sealed Air Corporation', country: 'United States', city: 'Elmwood Park', industry: 'Packaging', region: 'US' },
  // 유럽 10개
  { name: 'SABIC Europe', country: 'Netherlands', city: 'Sittard', industry: 'Chemical', region: 'EU' },
  { name: 'Covestro AG', country: 'Germany', city: 'Leverkusen', industry: 'Chemical', region: 'EU' },
  { name: 'Lanxess AG', country: 'Germany', city: 'Cologne', industry: 'Chemical', region: 'EU' },
  { name: 'Evonik Industries', country: 'Germany', city: 'Essen', industry: 'Chemical', region: 'EU' },
  { name: 'Clariant AG', country: 'Switzerland', city: 'Muttenz', industry: 'Chemical', region: 'EU' },
  { name: 'Solvay SA', country: 'Belgium', city: 'Brussels', industry: 'Chemical', region: 'EU' },
  { name: 'Arkema SA', country: 'France', city: 'Colombes', industry: 'Chemical', region: 'EU' },
  { name: 'Recticel NV', country: 'Belgium', city: 'Brussels', industry: 'Chemical', region: 'EU' },
  { name: 'M&G Chemicals', country: 'Italy', city: 'Rome', industry: 'Chemical', region: 'EU' },
  { name: 'Alpek Polyester', country: 'Spain', city: 'Barcelona', industry: 'Chemical', region: 'EU' },
  // 일본 6개
  { name: '三菱ケミカル', country: 'Japan', city: 'Tokyo', industry: 'Chemical', region: 'JP' },
  { name: '東レ株式会社', country: 'Japan', city: 'Tokyo', industry: 'Chemical', region: 'JP' },
  { name: '帝人株式会社', country: 'Japan', city: 'Osaka', industry: 'Chemical', region: 'JP' },
  { name: '旭化成株式会社', country: 'Japan', city: 'Tokyo', industry: 'Chemical', region: 'JP' },
  { name: 'クラレ株式会社', country: 'Japan', city: 'Tokyo', industry: 'Chemical', region: 'JP' },
  { name: '信越化学工業', country: 'Japan', city: 'Tokyo', industry: 'Chemical', region: 'JP' },
  // 중국 8개
  { name: '中国石化', country: 'China', city: 'Beijing', industry: 'Chemical', region: 'CN' },
  { name: '万华化学集团', country: 'China', city: 'Yantai', industry: 'Chemical', region: 'CN' },
  { name: '新凤鸣集团', country: 'China', city: 'Tongxiang', industry: 'Chemical', region: 'CN' },
  { name: '桐昆集团', country: 'China', city: 'Tongxiang', industry: 'Chemical', region: 'CN' },
  { name: '浙江恒逸集团', country: 'China', city: 'Hangzhou', industry: 'Chemical', region: 'CN' },
  { name: '荣盛石化', country: 'China', city: 'Shaoxing', industry: 'Chemical', region: 'CN' },
  { name: '三房巷集团', country: 'China', city: 'Jiangyin', industry: 'Chemical', region: 'CN' },
  { name: '苏州三元循环科技', country: 'China', city: 'Suzhou', industry: 'Chemical', region: 'CN' },
  // 동남아 4개
  { name: 'Indorama Ventures', country: 'Thailand', city: 'Bangkok', industry: 'Chemical', region: 'SEA' },
  { name: 'PTT Global Chemical', country: 'Thailand', city: 'Bangkok', industry: 'Chemical', region: 'SEA' },
  { name: 'Lotte Chemical Titan', country: 'Malaysia', city: 'Kuala Lumpur', industry: 'Chemical', region: 'SEA' },
  { name: 'Toray Plastics Malaysia', country: 'Malaysia', city: 'Shah Alam', industry: 'Plastics', region: 'SEA' },
  // 인도 2개
  { name: 'Reliance Industries', country: 'India', city: 'Mumbai', industry: 'Chemical', region: 'IN' },
  { name: 'Filatex India', country: 'India', city: 'New Delhi', industry: 'Chemical', region: 'IN' },
  // 중동 2개
  { name: 'SABIC Saudi Arabia', country: 'Saudi Arabia', city: 'Riyadh', industry: 'Chemical', region: 'ME' },
  { name: 'EQUATE Petrochemical', country: 'Kuwait', city: 'Kuwait City', industry: 'Chemical', region: 'ME' },
];

const FIRST_NAMES_KR = ['김민준', '이서윤', '박지훈', '최수아', '정도윤', '강하은', '윤준서', '임지아', '한재원', '오소연'];
const FIRST_NAMES_EN = ['James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia', 'Benjamin', 'Isabella'];
const LAST_NAMES_KR = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];
const LAST_NAMES_EN = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Moore'];
const TITLES = ['구매담당자', '연구원', '영업팀장', 'Procurement Manager', 'R&D Engineer', 'Business Manager', 'Technical Director', 'Sales Manager'];

const OPPORTUNITY_STAGES = ['Prospecting', 'Qualification', 'Needs Analysis', 'Value Proposition', 'Id. Decision Makers', 'Perception Analysis', 'Proposal/Price Quote', 'Negotiation/Review', 'Closed Won', 'Closed Lost'];
const LEAD_STATUSES = ['Open - Not Contacted', 'Working - Contacted', 'Closed - Converted', 'Closed - Not Converted'];
const LEAD_SOURCES = ['Web', 'Phone Inquiry', 'Partner Referral', 'Trade Show', 'Advertisement', 'Email', 'Other'];
const TASK_STATUSES = ['Not Started', 'In Progress', 'Completed', 'Waiting on someone else', 'Deferred'];
const TASK_PRIORITIES = ['High', 'Normal', 'Low'];

const ACTIVITY_TEMPLATES = [
  '기술 미팅',
  '제품 설명회',
  '샘플 요청 대응',
  '견적서 제출',
  '계약 협의',
  '품질 검토',
  '납기 조율',
  '정기 방문',
  '화상 회의',
  '현장 테스트',
  'Technical Meeting',
  'Product Presentation',
  'Sample Evaluation',
  'Quotation Follow-up',
  'Contract Negotiation',
  'Quality Review',
  'Delivery Coordination',
  'Regular Visit',
  'Video Conference',
  'Application Testing',
];

const COMPANY_TYPES = ['주식회사', 'Corp.', 'Ltd.', 'GmbH', 'S.A.', 'Co., Ltd.'];

async function main() {
  console.log('=== SK케미칼 대규모 샘플 데이터 시딩 시작 ===\n');

  // 인증
  console.log('🔐 Salesforce 인증 중...');
  let accessToken: string;
  let instanceUrl: string;
  try {
    ({ accessToken, instanceUrl } = await authenticate());
    console.log(`✅ 인증 성공: ${instanceUrl}\n`);
  } catch (err) {
    console.error('❌ 인증 실패:', err);
    process.exit(1);
  }

  const stats = { Account: 0, Contact: 0, Lead: 0, Opportunity: 0, Task: 0 };
  const accountIds: string[] = [];

  // =====================
  // 1. Account 생성 (50개)
  // =====================
  console.log('🏢 Account 생성 중 (목표: 50개)...');
  for (const acc of ACCOUNTS_DEF) {
    const data: Record<string, any> = {
      Name: acc.name,
      BillingCountry: acc.country,
      BillingCity: acc.city,
      Industry: acc.industry,
      Type: 'Customer',
      NumberOfEmployees: randomInt(100, 50000),
      AnnualRevenue: randomInt(10, 5000) * 1000000,
      Description: `SK케미칼 ${acc.region} 주요 고객사. ${PRODUCTS[randomInt(0, PRODUCTS.length - 1)]} 제품 관심`,
    };
    const id = await createRecord(instanceUrl, accessToken, 'Account', data);
    if (id) {
      accountIds.push(id);
      stats.Account++;
    }
    await sleep(50);
  }
  console.log(`  ✅ Account 생성 완료: ${stats.Account}개\n`);

  // =====================
  // 2. Contact 생성 (60개, Account당 1-2명)
  // =====================
  console.log('👤 Contact 생성 중 (목표: 60개)...');
  let contactCount = 0;
  for (let i = 0; i < accountIds.length && contactCount < 60; i++) {
    const accId = accountIds[i];
    const accDef = ACCOUNTS_DEF[i];
    const numContacts = contactCount + 2 <= 60 ? (i % 3 === 0 ? 2 : 1) : 1;

    for (let j = 0; j < numContacts && contactCount < 60; j++) {
      const isKorean = accDef.region === 'KR';
      const firstName = isKorean
        ? FIRST_NAMES_KR[randomInt(0, FIRST_NAMES_KR.length - 1)]
        : FIRST_NAMES_EN[randomInt(0, FIRST_NAMES_EN.length - 1)];
      const lastName = isKorean
        ? LAST_NAMES_KR[randomInt(0, LAST_NAMES_KR.length - 1)]
        : LAST_NAMES_EN[randomInt(0, LAST_NAMES_EN.length - 1)];
      const title = TITLES[randomInt(0, TITLES.length - 1)];
      const product = PRODUCTS[randomInt(0, PRODUCTS.length - 1)];

      const data: Record<string, any> = {
        AccountId: accId,
        FirstName: firstName,
        LastName: lastName,
        Title: title,
        Email: `contact${contactCount + 1}@${accDef.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        Phone: `+${randomInt(10, 99)}-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
        Department: isKorean ? '구매/기술팀' : 'Procurement/R&D',
        Description: `${product} 담당자`,
        MailingCountry: accDef.country,
        MailingCity: accDef.city,
      };

      const id = await createRecord(instanceUrl, accessToken, 'Contact', data);
      if (id) {
        stats.Contact++;
        contactCount++;
      }
      await sleep(50);
    }
  }
  console.log(`  ✅ Contact 생성 완료: ${stats.Contact}개\n`);

  // =====================
  // 3. Lead 생성 (100개, 제품별 분산)
  // =====================
  console.log('📋 Lead 생성 중 (목표: 100개)...');
  const LEAD_REGIONS = [
    { country: '대한민국', company: 'KR Tech Co.', city: '서울' },
    { country: 'United States', company: 'US Materials Inc.', city: 'New York' },
    { country: 'Germany', company: 'DE Chemicals GmbH', city: 'Frankfurt' },
    { country: 'Japan', company: 'JP Polymer KK', city: 'Tokyo' },
    { country: 'China', company: 'CN Plastics Co.', city: 'Shanghai' },
    { country: 'Thailand', company: 'TH Industry Ltd.', city: 'Bangkok' },
    { country: 'India', company: 'IN Chem Pvt Ltd.', city: 'Mumbai' },
    { country: 'Saudi Arabia', company: 'SA Petro Corp.', city: 'Riyadh' },
    { country: 'France', company: 'FR Synthetics SA', city: 'Paris' },
    { country: 'Brazil', company: 'BR Quimica Ltda.', city: 'São Paulo' },
  ];

  for (let i = 0; i < 100; i++) {
    const product = PRODUCTS[i % PRODUCTS.length];
    const region = LEAD_REGIONS[i % LEAD_REGIONS.length];
    const isKorean = region.country === '대한민국';
    const firstName = isKorean
      ? FIRST_NAMES_KR[randomInt(0, FIRST_NAMES_KR.length - 1)]
      : FIRST_NAMES_EN[randomInt(0, FIRST_NAMES_EN.length - 1)];
    const lastName = isKorean
      ? LAST_NAMES_KR[randomInt(0, LAST_NAMES_KR.length - 1)]
      : LAST_NAMES_EN[randomInt(0, LAST_NAMES_EN.length - 1)];

    const data: Record<string, any> = {
      FirstName: firstName,
      LastName: lastName,
      Company: `${region.company} (${i + 1})`,
      Email: `lead${i + 1}@${region.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      Phone: `+${randomInt(10, 99)}-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
      Country: region.country,
      City: region.city,
      Status: LEAD_STATUSES[randomInt(0, LEAD_STATUSES.length - 1)],
      LeadSource: LEAD_SOURCES[randomInt(0, LEAD_SOURCES.length - 1)],
      Industry: 'Chemical',
      Description: `${product} 제품 문의. 연간 수요량 ${randomInt(10, 500)}톤`,
      AnnualRevenue: randomInt(1, 500) * 1000000,
      NumberOfEmployees: randomInt(50, 10000),
    };

    const id = await createRecord(instanceUrl, accessToken, 'Lead', data);
    if (id) stats.Lead++;
    await sleep(50);

    if ((i + 1) % 20 === 0) {
      console.log(`  진행: ${i + 1}/100`);
    }
  }
  console.log(`  ✅ Lead 생성 완료: ${stats.Lead}개\n`);

  // =====================
  // 4. Opportunity 생성 (200개, 16개 제품별 12-13건)
  // =====================
  console.log('💰 Opportunity 생성 중 (목표: 200개)...');
  const oppPerProduct = Math.ceil(200 / PRODUCTS.length); // 13

  for (let p = 0; p < PRODUCTS.length; p++) {
    const product = PRODUCTS[p];
    const count = p < 200 % PRODUCTS.length ? oppPerProduct : Math.floor(200 / PRODUCTS.length);

    for (let i = 0; i < count; i++) {
      const accId = accountIds[randomInt(0, accountIds.length - 1)];
      const accDef = ACCOUNTS_DEF[randomInt(0, ACCOUNTS_DEF.length - 1)];
      const stage = OPPORTUNITY_STAGES[randomInt(0, OPPORTUNITY_STAGES.length - 1)];
      const closeDate = randomDate(2025, 2026);
      const oppName = `${product} ${accDef.name} 프로젝트`;
      const amount = randomInt(1, 100) * 10000000; // 1천만 ~ 10억

      const data: Record<string, any> = {
        Name: oppName,
        AccountId: accId,
        StageName: stage,
        CloseDate: closeDate,
        Amount: amount,
        Probability: randomInt(10, 90),
        LeadSource: LEAD_SOURCES[randomInt(0, LEAD_SOURCES.length - 1)],
        Description: `${product} 공급 프로젝트. 예상 연간 수요: ${randomInt(10, 500)}톤`,
        Type: randomFrom(['New Business', 'Existing Business', 'Renewal']),
      };

      const id = await createRecord(instanceUrl, accessToken, 'Opportunity', data);
      if (id) stats.Opportunity++;
      await sleep(50);
    }

    console.log(`  ${product}: ${Math.min(oppPerProduct, 200 - stats.Opportunity + (p < PRODUCTS.length - 1 ? 0 : 0))}건 완료 (누적: ${stats.Opportunity})`);
  }
  console.log(`  ✅ Opportunity 생성 완료: ${stats.Opportunity}개\n`);

  // =====================
  // 5. Task 생성 (700개, 16개 제품별 40-45건)
  // =====================
  console.log('📝 Task 생성 중 (목표: 700개)...');
  const taskPerProduct = Math.ceil(700 / PRODUCTS.length); // 44

  for (let p = 0; p < PRODUCTS.length; p++) {
    const product = PRODUCTS[p];
    const count = p < 700 % PRODUCTS.length ? taskPerProduct : Math.floor(700 / PRODUCTS.length);

    for (let i = 0; i < count; i++) {
      const accDef = ACCOUNTS_DEF[randomInt(0, ACCOUNTS_DEF.length - 1)];
      const activity = ACTIVITY_TEMPLATES[randomInt(0, ACTIVITY_TEMPLATES.length - 1)];
      const subject = `${product} ${accDef.name} ${activity}`;
      const actDate = randomDate(2025, 2026);

      const data: Record<string, any> = {
        Subject: subject,
        Status: TASK_STATUSES[randomInt(0, TASK_STATUSES.length - 1)],
        Priority: TASK_PRIORITIES[randomInt(0, TASK_PRIORITIES.length - 1)],
        ActivityDate: actDate,
        Description: `${product} 관련 ${activity}. 담당자: ${FIRST_NAMES_EN[randomInt(0, FIRST_NAMES_EN.length - 1)]} ${LAST_NAMES_EN[randomInt(0, LAST_NAMES_EN.length - 1)]}`,
      };

      const id = await createRecord(instanceUrl, accessToken, 'Task', data);
      if (id) stats.Task++;
      await sleep(50);
    }

    if ((p + 1) % 4 === 0) {
      console.log(`  진행: ${p + 1}/${PRODUCTS.length} 제품 처리 완료 (누적 Task: ${stats.Task})`);
    }
  }
  console.log(`  ✅ Task 생성 완료: ${stats.Task}개\n`);

  // =====================
  // 최종 결과 보고
  // =====================
  console.log('='.repeat(50));
  console.log('📊 SK케미칼 샘플 데이터 시딩 완료 - 결과 요약');
  console.log('='.repeat(50));
  console.log(`🏢 Account:     ${stats.Account.toString().padStart(4)}개 (목표: 50개)`);
  console.log(`👤 Contact:     ${stats.Contact.toString().padStart(4)}개 (목표: 60개)`);
  console.log(`📋 Lead:        ${stats.Lead.toString().padStart(4)}개 (목표: 100개)`);
  console.log(`💰 Opportunity: ${stats.Opportunity.toString().padStart(4)}개 (목표: 200개)`);
  console.log(`📝 Task:        ${stats.Task.toString().padStart(4)}개 (목표: 700개)`);
  console.log('='.repeat(50));
  const total = stats.Account + stats.Contact + stats.Lead + stats.Opportunity + stats.Task;
  console.log(`✅ 총 생성 레코드: ${total}개`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
