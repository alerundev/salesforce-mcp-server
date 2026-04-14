/**
 * SK케미칼 영업 샘플 데이터 시딩 스크립트
 * 제품: PETG(SKYGREEN), Ecozen, Ecotria
 * 실행: npm run seed
 */
import https from 'https';

interface TokenResponse {
  access_token: string;
  instance_url: string;
  error?: string;
  error_description?: string;
}

async function getToken(): Promise<{ token: string; base: string }> {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env['SF_CONSUMER_KEY']!,
    client_secret: process.env['SF_CONSUMER_SECRET']!,
  }).toString();

  const loginHost = new URL(process.env['SF_LOGIN_URL'] || 'https://login.salesforce.com').hostname;

  const data: TokenResponse = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: loginHost,
      path: '/services/oauth2/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch (e) { reject(e); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  if (!data.access_token) throw new Error(data.error_description || JSON.stringify(data));
  return { token: data.access_token, base: data.instance_url };
}

async function createRecord(token: string, base: string, sobject: string, record: Record<string, unknown>): Promise<string> {
  const body = JSON.stringify(record);
  const result = await new Promise<{ id: string; success: boolean; errors: unknown[] }>((resolve, reject) => {
    const req = https.request({
      hostname: new URL(base).hostname,
      path: `/services/data/v59.0/sobjects/${sobject}`,
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch (e) { reject(e); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
  if (!result.success) throw new Error(JSON.stringify(result.errors));
  return result.id;
}

async function seed() {
  console.log('🌱 SK케미칼 샘플 데이터 시딩 시작...\n');
  const { token, base } = await getToken();
  console.log('✅ Salesforce 연결 성공:', base);

  // ── 1. Accounts (전세계 고객사) ──────────────────────────────────────────
  console.log('\n📦 거래처(Account) 생성 중...');
  const accountData = [
    // 한국
    { Name: 'LG생활건강', Industry: 'Consumer Goods', AnnualRevenue: 800000000, BillingCity: '서울', BillingCountry: 'South Korea', NumberOfEmployees: 12000, Phone: '02-6924-6114', Description: '화장품 용기 및 생활용품 제조사' },
    { Name: '아모레퍼시픽', Industry: 'Consumer Goods', AnnualRevenue: 600000000, BillingCity: '서울', BillingCountry: 'South Korea', NumberOfEmployees: 8000, Phone: '02-709-5114', Description: '화장품 및 뷰티 제품 포장재 수요' },
    { Name: '삼성전자', Industry: 'Electronics', AnnualRevenue: 2000000000, BillingCity: '수원', BillingCountry: 'South Korea', NumberOfEmployees: 50000, Phone: '031-200-1114', Description: '가전제품 및 전자부품 소재 수요' },
    { Name: '현대엔지니어링플라스틱', Industry: 'Manufacturing', AnnualRevenue: 200000000, BillingCity: '울산', BillingCountry: 'South Korea', NumberOfEmployees: 3000, Phone: '052-280-1114', Description: '자동차 부품 및 산업용 소재' },
    // 미국
    { Name: 'Berry Global Inc.', Industry: 'Manufacturing', AnnualRevenue: 1500000000, BillingCity: 'Evansville', BillingCountry: 'USA', NumberOfEmployees: 48000, Phone: '+1-812-424-2904', Description: '플라스틱 포장재 전문 제조사' },
    { Name: 'Silgan Plastics', Industry: 'Manufacturing', AnnualRevenue: 900000000, BillingCity: 'Woodland Hills', BillingCountry: 'USA', NumberOfEmployees: 5000, Phone: '+1-818-704-8000', Description: '식품음료 용기 포장재 제조' },
    { Name: 'Printpack Inc.', Industry: 'Manufacturing', AnnualRevenue: 700000000, BillingCity: 'Atlanta', BillingCountry: 'USA', NumberOfEmployees: 4500, Phone: '+1-404-460-7000', Description: '유연포장 및 경질포장 전문' },
    // 유럽
    { Name: 'Greiner Packaging', Industry: 'Manufacturing', AnnualRevenue: 500000000, BillingCity: 'Kremsmünster', BillingCountry: 'Austria', NumberOfEmployees: 4200, Phone: '+43-7583-7271', Description: '유럽 식품 포장재 선도 기업' },
    { Name: 'RPC Group', Industry: 'Manufacturing', AnnualRevenue: 800000000, BillingCity: 'Rushden', BillingCountry: 'UK', NumberOfEmployees: 25000, Phone: '+44-1933-410410', Description: '유럽 최대 플라스틱 포장재 그룹' },
    { Name: 'Alpla Group', Industry: 'Manufacturing', AnnualRevenue: 450000000, BillingCity: 'Hard', BillingCountry: 'Austria', NumberOfEmployees: 21000, Phone: '+43-5574-602-0', Description: '글로벌 플라스틱 포장재 제조' },
    // 일본
    { Name: 'Toyo Seikan Group', Industry: 'Manufacturing', AnnualRevenue: 1200000000, BillingCity: 'Tokyo', BillingCountry: 'Japan', NumberOfEmployees: 15000, Phone: '+81-3-3508-2111', Description: '일본 최대 캔 및 용기 제조사' },
    { Name: 'Yoshida Industries', Industry: 'Consumer Goods', AnnualRevenue: 300000000, BillingCity: 'Osaka', BillingCountry: 'Japan', NumberOfEmployees: 2500, Phone: '+81-6-6271-7070', Description: '화장품 용기 및 패키징 전문' },
    // 중국
    { Name: 'Zhejiang Zhongcai Packaging', Industry: 'Manufacturing', AnnualRevenue: 250000000, BillingCity: 'Hangzhou', BillingCountry: 'China', NumberOfEmployees: 3000, Phone: '+86-571-8888-1234', Description: '중국 최대 PET 포장재 제조사 중 하나' },
    { Name: 'Huangshan Novel', Industry: 'Manufacturing', AnnualRevenue: 180000000, BillingCity: 'Huangshan', BillingCountry: 'China', NumberOfEmployees: 2000, Phone: '+86-559-2345-678', Description: '친환경 포장재 전문' },
  ];

  const accountIds: string[] = [];
  for (const acc of accountData) {
    const id = await createRecord(token, base, 'Account', acc);
    accountIds.push(id);
    console.log(`  ✅ ${acc.Name}`);
  }

  // ── 2. Contacts (담당자) ──────────────────────────────────────────────────
  console.log('\n👤 담당자(Contact) 생성 중...');
  const contacts = [
    { FirstName: '지수', LastName: '김', Email: 'jisoo.kim@lghhc.co.kr', Phone: '02-6924-1001', Title: '원료구매팀장', AccountId: accountIds[0] },
    { FirstName: '민준', LastName: '이', Email: 'minjun.lee@lghhc.co.kr', Phone: '02-6924-1002', Title: 'R&D 소재연구원', AccountId: accountIds[0] },
    { FirstName: '서연', LastName: '박', Email: 'seoyeon.park@apgroup.com', Phone: '02-709-2001', Title: '포장재 구매담당', AccountId: accountIds[1] },
    { FirstName: '현우', LastName: '최', Email: 'hyunwoo.choi@samsung.com', Phone: '031-200-2001', Title: '소재개발팀장', AccountId: accountIds[2] },
    { FirstName: '지민', LastName: '정', Email: 'jimin.jung@hyundaiep.com', Phone: '052-280-2001', Title: '기술영업 담당', AccountId: accountIds[3] },
    { FirstName: 'Sarah', LastName: 'Johnson', Email: 's.johnson@berryglobal.com', Phone: '+1-812-424-3001', Title: 'VP of Sourcing', AccountId: accountIds[4] },
    { FirstName: 'Michael', LastName: 'Chen', Email: 'm.chen@silganplastics.com', Phone: '+1-818-704-3001', Title: 'Materials Engineer', AccountId: accountIds[5] },
    { FirstName: 'David', LastName: 'Williams', Email: 'd.williams@printpack.com', Phone: '+1-404-460-3001', Title: 'Procurement Manager', AccountId: accountIds[6] },
    { FirstName: 'Klaus', LastName: 'Mueller', Email: 'k.mueller@greiner.com', Phone: '+43-7583-3001', Title: 'Head of R&D', AccountId: accountIds[7] },
    { FirstName: 'Emma', LastName: 'Thompson', Email: 'e.thompson@rpc-group.com', Phone: '+44-1933-3001', Title: 'Supply Chain Director', AccountId: accountIds[8] },
    { FirstName: '田中', LastName: '健一', Email: 'k.tanaka@toyoseikan.co.jp', Phone: '+81-3-3508-3001', Title: '調達部長', AccountId: accountIds[10] },
    { FirstName: '山田', LastName: '花子', Email: 'h.yamada@yoshida.co.jp', Phone: '+81-6-6271-3001', Title: '素材開発担当', AccountId: accountIds[11] },
    { FirstName: '王', LastName: '伟', Email: 'w.wang@zhongcai.com.cn', Phone: '+86-571-8888-3001', Title: '采购总监', AccountId: accountIds[12] },
  ];

  for (const contact of contacts) {
    await createRecord(token, base, 'Contact', contact);
    console.log(`  ✅ ${contact.FirstName} ${contact.LastName}`);
  }

  // ── 3. Leads (잠재고객) ───────────────────────────────────────────────────
  console.log('\n🎯 잠재고객(Lead) 생성 중...');
  const leads = [
    { FirstName: '준호', LastName: '신', Company: '롯데케미칼', Email: 'junho.shin@lottechem.com', Title: '소재개발팀장', Status: 'Open - Not Contacted', LeadSource: 'Conference', Rating: 'Hot', Phone: '02-3459-3001', Industry: 'Chemicals', Description: 'Ecozen 친환경 소재 관심' },
    { FirstName: '하은', LastName: '오', Company: 'CJ제일제당', Email: 'haeun.oh@cj.net', Title: '포장재 구매담당', Status: 'Working - Contacted', LeadSource: 'Web', Rating: 'Warm', Phone: '02-6740-3001', Industry: 'Food & Beverage', Description: 'Ecotria 재활용 소재 문의' },
    { FirstName: 'James', LastName: 'Park', Company: 'Amcor Plc', Email: 'j.park@amcor.com', Title: 'Innovation Director', Status: 'Working - Contacted', LeadSource: 'Trade Show', Rating: 'Hot', Phone: '+1-734-827-3001', Industry: 'Manufacturing', Description: 'PETG Ecotria CR 재활용 소재 관심' },
    { FirstName: 'Anna', LastName: 'Schmidt', Company: 'Schur Pack', Email: 'a.schmidt@schurpack.com', Title: 'Materials Manager', Status: 'Open - Not Contacted', LeadSource: 'Partner Referral', Rating: 'Warm', Phone: '+49-89-3001-4001', Industry: 'Manufacturing', Description: '유럽 규제 대응 친환경 소재 검토' },
    { FirstName: '李', LastName: '明', Company: 'COFCO Packaging', Email: 'l.ming@cofco.com', Title: '技术总监', Status: 'Open - Not Contacted', LeadSource: 'Cold Call', Rating: 'Cold', Phone: '+86-10-8888-3001', Industry: 'Manufacturing', Description: '중국 친환경 규제 대응 소재 검토' },
    { FirstName: 'Yuki', LastName: 'Sato', Company: 'Dai Nippon Printing', Email: 'y.sato@dnp.co.jp', Title: '素材調達部', Status: 'Working - Contacted', LeadSource: 'Web', Rating: 'Hot', Phone: '+81-3-6744-3001', Industry: 'Manufacturing', Description: 'Ecozen 고내열 소재 샘플 요청' },
    { FirstName: '성훈', LastName: '배', Company: '코오롱인더스트리', Email: 'sh.bae@kolon.com', Title: '연구개발팀', Status: 'Open - Not Contacted', LeadSource: 'Email', Rating: 'Warm', Phone: '02-3677-3001', Industry: 'Manufacturing', Description: 'PETG SKYGREEN 대체 소재 검토' },
    { FirstName: 'Maria', LastName: 'Garcia', Company: 'Plastipak Holdings', Email: 'm.garcia@plastipak.com', Title: 'R&D Manager', Status: 'Working - Contacted', LeadSource: 'Conference', Rating: 'Hot', Phone: '+1-248-391-3001', Industry: 'Manufacturing', Description: 'Ecotria 재활용 PET 대체재 관심' },
  ];

  for (const lead of leads) {
    await createRecord(token, base, 'Lead', lead);
    console.log(`  ✅ ${lead.FirstName} ${lead.LastName} (${lead.Company})`);
  }

  // ── 4. Opportunities (영업기회) ───────────────────────────────────────────
  console.log('\n💰 영업기회(Opportunity) 생성 중...');
  const opportunities = [
    // PETG / SKYGREEN
    { Name: '[SKYGREEN] LG생활건강 화장품 용기 소재 공급', StageName: 'Closed Won', Amount: 1200000000, CloseDate: '2026-01-31', AccountId: accountIds[0], Probability: 100, Description: 'PETG SKYGREEN K2012 화장품 용기 연간 공급 계약' },
    { Name: '[SKYGREEN] Berry Global 식품용기 프로젝트', StageName: 'Negotiation/Review', Amount: 2500000000, CloseDate: '2026-05-31', AccountId: accountIds[4], Probability: 80, Description: 'PETG SKYGREEN 대용량 식품용기 장기 공급 협의' },
    { Name: '[SKYGREEN] Toyo Seikan 음료용기 소재', StageName: 'Proposal/Price Quote', Amount: 1800000000, CloseDate: '2026-06-30', AccountId: accountIds[10], Probability: 60, Description: '일본 음료용기용 PETG 공급 제안 진행중' },
    { Name: '[SKYGREEN] 삼성전자 가전용 소재 공급', StageName: 'Qualification', Amount: 800000000, CloseDate: '2026-07-31', AccountId: accountIds[2], Probability: 30, Description: '가전제품 하우징용 PETG 소재 적용 검토' },
    { Name: '[SKYGREEN] Zhejiang Zhongcai 포장재', StageName: 'Prospecting', Amount: 600000000, CloseDate: '2026-09-30', AccountId: accountIds[12], Probability: 20, Description: '중국 포장재 시장 PETG 공급 초기 접촉' },
    // Ecozen
    { Name: '[Ecozen] 아모레퍼시픽 친환경 화장품 용기', StageName: 'Closed Won', Amount: 900000000, CloseDate: '2026-02-28', AccountId: accountIds[1], Probability: 100, Description: 'Ecozen 바이오 플라스틱 화장품 용기 공급 완료' },
    { Name: '[Ecozen] Yoshida Industries 뷰티 용기', StageName: 'Negotiation/Review', Amount: 750000000, CloseDate: '2026-04-30', AccountId: accountIds[11], Probability: 75, Description: '일본 화장품 브랜드용 Ecozen 고내열 용기' },
    { Name: '[Ecozen] Greiner Packaging 유럽 식품용기', StageName: 'Proposal/Price Quote', Amount: 1100000000, CloseDate: '2026-05-15', AccountId: accountIds[7], Probability: 55, Description: '유럽 식품안전 인증 대응 Ecozen 소재 제안' },
    { Name: '[Ecozen] Silgan Plastics 핫필 용기', StageName: 'Qualification', Amount: 650000000, CloseDate: '2026-08-31', AccountId: accountIds[5], Probability: 35, Description: '핫필 공정용 고내열 Ecozen 적용 검토' },
    // Ecotria
    { Name: '[Ecotria] RPC Group 재활용 포장재', StageName: 'Closed Won', Amount: 1500000000, CloseDate: '2026-03-15', AccountId: accountIds[8], Probability: 100, Description: 'Ecotria CR 화학적 재활용 소재 유럽 공급 계약' },
    { Name: '[Ecotria] Printpack 재활용 필름 소재', StageName: 'Negotiation/Review', Amount: 900000000, CloseDate: '2026-04-30', AccountId: accountIds[6], Probability: 80, Description: 'Ecotria 재활용 열수축 필름 소재 공급 협의' },
    { Name: '[Ecotria] Alpla Group 친환경 용기', StageName: 'Proposal/Price Quote', Amount: 1300000000, CloseDate: '2026-06-30', AccountId: accountIds[9], Probability: 60, Description: 'Ecotria PCR 소재 글로벌 공급 제안' },
    { Name: '[Ecotria] 현대엔지니어링플라스틱', StageName: 'Closed Lost', Amount: 400000000, CloseDate: '2026-01-15', AccountId: accountIds[3], Probability: 0, Description: '자동차 부품용 Ecotria 적용 검토 → 경쟁사 선택' },
    { Name: '[Ecotria] Huangshan Novel 친환경 포장', StageName: 'Prospecting', Amount: 500000000, CloseDate: '2026-10-31', AccountId: accountIds[13], Probability: 15, Description: '중국 친환경 포장재 규제 대응 Ecotria 초기 접촉' },
  ];

  for (const opp of opportunities) {
    await createRecord(token, base, 'Opportunity', opp);
    console.log(`  ✅ ${opp.Name}`);
  }

  // ── 5. Tasks (고객 컨택 활동) ─────────────────────────────────────────────
  console.log('\n📋 고객 컨택 활동(Task) 생성 중...');
  const tasks = [
    // 2026년 컨택 활동 - PETG/SKYGREEN
    { Subject: '[SKYGREEN] LG생활건강 연간 계약 갱신 미팅', Status: 'Completed', Priority: 'High', ActivityDate: '2026-01-10', Description: 'PETG SKYGREEN 2026년 공급 단가 협의 완료' },
    { Subject: '[SKYGREEN] Berry Global 기술 세미나', Status: 'Completed', Priority: 'High', ActivityDate: '2026-02-15', Description: 'PETG 신규 그레이드 기술 발표 및 샘플 제공' },
    { Subject: '[SKYGREEN] Toyo Seikan 현장 방문', Status: 'Completed', Priority: 'Normal', ActivityDate: '2026-02-20', Description: '일본 도쿄 공장 방문, 품질 테스트 협의' },
    { Subject: '[SKYGREEN] 삼성전자 소재 적용 검토 회의', Status: 'In Progress', Priority: 'High', ActivityDate: '2026-03-05', Description: '가전 하우징용 PETG 물성 데이터 제출' },
    { Subject: '[SKYGREEN] Berry Global 가격 협상', Status: 'Not Started', Priority: 'High', ActivityDate: '2026-04-20', Description: '대용량 장기 공급 계약 가격 협상 예정' },
    // 2026년 컨택 활동 - Ecozen
    { Subject: '[Ecozen] 아모레퍼시픽 신제품 용기 기획 미팅', Status: 'Completed', Priority: 'High', ActivityDate: '2026-01-20', Description: '2026 신제품 화장품 라인 Ecozen 적용 확정' },
    { Subject: '[Ecozen] Greiner Packaging 유럽 규제 대응 컨설팅', Status: 'Completed', Priority: 'Normal', ActivityDate: '2026-02-10', Description: 'EU 식품접촉물질 규제 Ecozen 대응 방안 제시' },
    { Subject: '[Ecozen] Yoshida Industries 샘플 테스트 결과 검토', Status: 'Completed', Priority: 'High', ActivityDate: '2026-03-01', Description: '화장품 용기 고내열 성능 테스트 통과 확인' },
    { Subject: '[Ecozen] Silgan Plastics 핫필 공정 기술 지원', Status: 'In Progress', Priority: 'Normal', ActivityDate: '2026-04-10', Description: '핫필 공정 적용 기술 문서 제공 및 원격 지원' },
    { Subject: '[Ecozen] 글로벌 바이오 플라스틱 전시회 참가', Status: 'Completed', Priority: 'Normal', ActivityDate: '2026-03-15', Description: 'K-Show 2026 참가, 신규 리드 8건 확보' },
    // 2026년 컨택 활동 - Ecotria
    { Subject: '[Ecotria] RPC Group 계약 서명식', Status: 'Completed', Priority: 'High', ActivityDate: '2026-03-15', Description: 'Ecotria CR 유럽 3개년 공급 계약 체결' },
    { Subject: '[Ecotria] Printpack 재활용 인증 지원', Status: 'Completed', Priority: 'High', ActivityDate: '2026-02-25', Description: 'Ecotria PCR 함량 인증서 발급 지원' },
    { Subject: '[Ecotria] Alpla Group 글로벌 공급망 미팅', Status: 'In Progress', Priority: 'High', ActivityDate: '2026-04-05', Description: '유럽/아시아 생산기지 공급 물량 협의 중' },
    { Subject: '[Ecotria] 롯데케미칼 기술 세미나', Status: 'Not Started', Priority: 'Normal', ActivityDate: '2026-04-25', Description: 'Ecotria 재활용 소재 기술 소개 및 샘플 제공 예정' },
    { Subject: '[Ecotria] 친환경 포장재 컨퍼런스 발표', Status: 'Completed', Priority: 'Normal', ActivityDate: '2026-03-20', Description: 'Ecotria CR 화학적 재활용 기술 발표, 신규 컨택 5건' },
  ];

  for (const task of tasks) {
    await createRecord(token, base, 'Task', task);
    console.log(`  ✅ ${task.Subject}`);
  }

  console.log('\n🎉 SK케미칼 샘플 데이터 시딩 완료!');
  console.log('\n📊 생성된 데이터 요약:');
  console.log(`  - 거래처: ${accountData.length}개 (한국 4, 미국 3, 유럽 3, 일본 2, 중국 2)`);
  console.log(`  - 담당자: ${contacts.length}명`);
  console.log(`  - 잠재고객: ${leads.length}명`);
  console.log(`  - 영업기회: ${opportunities.length}건 (PETG 5, Ecozen 4, Ecotria 5)`);
  console.log(`  - 고객 컨택: ${tasks.length}건`);
  console.log('\n💡 테스트 질문 예시:');
  console.log('  - "Ecozen item 관련 컨택 고객사 list 정리해줘"');
  console.log('  - "2026년도 고객 컨택 list중 item별 빈도수 정리해줘"');
}

seed().catch((err: Error) => {
  console.error('❌ 시딩 실패:', err.message);
  process.exit(1);
});
