import https from 'https';

let accessToken: string | null = null;
let instanceUrl: string | null = null;

async function getToken(): Promise<{ token: string; base: string }> {
  if (accessToken && instanceUrl) return { token: accessToken, base: instanceUrl };

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
  console.log('[Salesforce] Connected via Client Credentials:', instanceUrl);
  return { token: accessToken, base: instanceUrl };
}

export async function query(soql: string): Promise<Record<string, unknown>[]> {
  const { token, base } = await getToken();
  const path = `/services/data/v59.0/query?q=${encodeURIComponent(soql)}`;
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
    // 토큰 만료 시 재시도
    accessToken = null;
    instanceUrl = null;
    throw new Error(`${data['errorCode']}: ${data['message']}`);
  }

  return (data['records'] as Record<string, unknown>[]) || [];
}
