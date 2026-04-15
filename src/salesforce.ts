import https from 'https';

let accessToken: string | null = null;
let instanceUrl: string | null = null;
let tokenExpiry: number = 0; // 토큰 만료 시각 (ms)

async function getToken(): Promise<{ token: string; base: string }> {
  // 토큰이 있고 만료 5분 전까지는 재사용
  if (accessToken && instanceUrl && Date.now() < tokenExpiry - 300000) {
    return { token: accessToken, base: instanceUrl };
  }
  // 만료됐으면 초기화
  accessToken = null;
  instanceUrl = null;

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env['SF_CONSUMER_KEY']!,
    client_secret: process.env['SF_CONSUMER_SECRET']!,
  }).toString();

  const loginHost = new URL(process.env['SF_LOGIN_URL'] || 'https://login.salesforce.com').hostname;

  const data = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const req = https.request({
      hostname: loginHost,
      path: '/services/oauth2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch (e) { reject(e); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  if (!data['access_token']) {
    throw new Error(`Login failed: ${data['error_description'] || JSON.stringify(data)}`);
  }

  accessToken = data['access_token'] as string;
  instanceUrl = data['instance_url'] as string;
  // Salesforce Client Credentials 토큰은 7200초(2시간) 유효
  tokenExpiry = Date.now() + 7200 * 1000;
  console.log('[Salesforce] Connected:', instanceUrl, '(expires in 2h)');
  return { token: accessToken, base: instanceUrl };
}

export async function query(soql: string): Promise<Record<string, unknown>[] | number> {
  const { token, base } = await getToken();

  // LIMIT이 없는 SELECT 쿼리에 자동으로 LIMIT 100 추가 (COUNT 제외)
  const isCount = /SELECT\s+COUNT\s*\(\s*\)/i.test(soql);
  const hasLimit = /LIMIT\s+\d+/i.test(soql);
  const finalSoql = (!isCount && !hasLimit) ? `${soql} LIMIT 100` : soql;

  const path = `/services/data/v59.0/query?q=${encodeURIComponent(finalSoql)}`;
  const hostname = new URL(base).hostname;

  const data = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const req = https.request({
      hostname,
      path,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch (e) { reject(e); } });
    });
    req.on('error', reject);
    req.end();
  });

  if (data['errorCode']) {
    // 토큰 만료 시 재발급 후 재시도
    accessToken = null;
    instanceUrl = null;
    tokenExpiry = 0;
    console.log('[Salesforce] Token expired, refreshing...');
    const { token: newToken, base: newBase } = await getToken();
    const retryData = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const req = https.request({
        hostname: new URL(newBase).hostname,
        path,
        method: 'GET',
        headers: { Authorization: `Bearer ${newToken}` },
      }, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => { try { resolve(JSON.parse(raw)); } catch (e) { reject(e); } });
      });
      req.on('error', reject);
      req.end();
    });
    if (retryData['errorCode']) throw new Error(`${retryData['errorCode']}: ${retryData['message']}`);
    if (isCount) return retryData['totalSize'] as number;
    return (retryData['records'] as Record<string, unknown>[]) || [];
  }

  // COUNT() 쿼리는 totalSize 반환
  if (isCount) {
    return data['totalSize'] as number;
  }

  return (data['records'] as Record<string, unknown>[]) || [];
}
