import https from 'https';

async function getToken(): Promise<{ token: string; base: string }> {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env['SF_CONSUMER_KEY']!,
    client_secret: process.env['SF_CONSUMER_SECRET']!,
  }).toString();

  const data = await new Promise<any>((resolve, reject) => {
    const req = https.request({
      hostname: new URL(process.env['SF_LOGIN_URL']!).hostname,
      path: '/services/oauth2/token', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    }, res => { let r = ''; res.on('data', c => r += c); res.on('end', () => resolve(JSON.parse(r))); });
    req.on('error', reject); req.write(body); req.end();
  });
  return { token: data.access_token, base: data.instance_url };
}

async function getIds(token: string, base: string, obj: string): Promise<string[]> {
  const data = await new Promise<any>((resolve, reject) => {
    const path = '/services/data/v59.0/query?q=' + encodeURIComponent(`SELECT Id FROM ${obj} LIMIT 200`);
    const req = https.request({
      hostname: new URL(base).hostname, path, method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }, res => { let r = ''; res.on('data', c => r += c); res.on('end', () => resolve(JSON.parse(r))); });
    req.on('error', reject); req.end();
  });
  return (data.records || []).map((r: any) => r.Id);
}

async function deleteRecord(token: string, base: string, obj: string, id: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const req = https.request({
      hostname: new URL(base).hostname,
      path: `/services/data/v59.0/sobjects/${obj}/${id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }, res => { res.resume(); res.on('end', resolve); });
    req.on('error', reject); req.end();
  });
}

async function deleteAll(token: string, base: string, obj: string) {
  let total = 0;
  while (true) {
    const ids = await getIds(token, base, obj);
    if (ids.length === 0) break;
    console.log(`  ${obj}: ${ids.length}개 삭제 중...`);
    for (const id of ids) {
      await deleteRecord(token, base, obj, id);
      total++;
    }
  }
  console.log(`  ✅ ${obj} 총 ${total}개 삭제 완료`);
}

async function main() {
  console.log('🗑️ Salesforce 데이터 전체 삭제 시작...');
  const { token, base } = await getToken();
  console.log('연결 성공:', base);

  await deleteAll(token, base, 'Task');
  await deleteAll(token, base, 'Opportunity');
  await deleteAll(token, base, 'Contact');
  await deleteAll(token, base, 'Lead');
  await deleteAll(token, base, 'Account');

  console.log('\n🎉 전체 삭제 완료! 이제 seed를 다시 실행하세요.');
}

main().catch(e => { console.error('❌ 실패:', e.message); process.exit(1); });
