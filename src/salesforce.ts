import https from 'https';

let accessToken: string | null = null;
let instanceUrl: string | null = null;

async function httpPost(hostname: string, path: string, body: string, headers: Record<string, string>): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, method: 'POST', headers }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch (e) { reject(e); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function httpGet(hostname: string, path: string, token: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, method: 'GET', headers: { Authorization: `Bearer ${token}` } }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch (e) { reject(e); } });
    });
    req.on('error', reject);
    req.end();
  });
}

async function getToken(): Promise<{ token: string; base: string }> {
  if (accessToken && instanceUrl) return { token: accessToken, base: instanceUrl };

  const loginUrl = process.env['SF_LOGIN_URL'] || 'https://login.salesforce.com';
  const username = encodeURIComponent(process.env['SF_USERNAME']!);
  const password = encodeURIComponent(process.env['SF_PASSWORD']! + process.env['SF_SECURITY_TOKEN']!);
  const clientId = encodeURIComponent(process.env['SF_CONSUMER_KEY']!);
  const clientSecret = encodeURIComponent(process.env['SF_CONSUMER_SECRET']!);

  const body = `grant_type=password&client_id=${clientId}&client_secret=${clientSecret}&username=${username}&password=${password}`;

  const hostname = new URL(loginUrl).hostname;
  const data = await httpPost(hostname, '/services/oauth2/token', body, {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': String(Buffer.byteLength(body)),
  });

  if (!data['access_token']) {
    throw new Error(`Login failed: ${data['error_description'] || JSON.stringify(data)}`);
  }

  accessToken = data['access_token'] as string;
  instanceUrl = data['instance_url'] as string;
  console.log('[Salesforce] Connected:', instanceUrl);
  return { token: accessToken, base: instanceUrl };
}

export async function query(soql: string): Promise<Record<string, unknown>[]> {
  const { token, base } = await getToken();
  const hostname = new URL(base).hostname;
  const path = `/services/data/v59.0/query?q=${encodeURIComponent(soql)}`;

  const data = await httpGet(hostname, path, token);

  if (data['errorCode']) {
    // 토큰 만료 시 재시도
    accessToken = null;
    instanceUrl = null;
    const { token: newToken, base: newBase } = await getToken();
    const newData = await httpGet(new URL(newBase).hostname, path, newToken);
    if (newData['errorCode']) throw new Error(`${newData['errorCode']}: ${newData['message']}`);
    return (newData['records'] as Record<string, unknown>[]) || [];
  }

  return (data['records'] as Record<string, unknown>[]) || [];
}
