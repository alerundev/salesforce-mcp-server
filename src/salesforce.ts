import https from 'https';

interface TokenResponse {
  access_token: string;
  instance_url: string;
}

let accessToken: string | null = null;
let instanceUrl: string | null = null;

async function getToken(): Promise<{ accessToken: string; instanceUrl: string }> {
  if (accessToken && instanceUrl) return { accessToken, instanceUrl };

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env['SF_CONSUMER_KEY']!,
    client_secret: process.env['SF_CONSUMER_SECRET']!,
  });

  const loginUrl = process.env['SF_LOGIN_URL'] || 'https://login.salesforce.com';

  const data: TokenResponse = await new Promise((resolve, reject) => {
    const body = params.toString();
    const url = new URL('/services/oauth2/token', loginUrl);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  if (!data.access_token) throw new Error(JSON.stringify(data));

  accessToken = data.access_token;
  instanceUrl = data.instance_url;
  console.log('[Salesforce] Connected:', instanceUrl);
  return { accessToken, instanceUrl };
}

export async function query(soql: string): Promise<Record<string, unknown>[]> {
  const { accessToken: token, instanceUrl: base } = await getToken();

  const url = `${base}/services/data/v59.0/query?q=${encodeURIComponent(soql)}`;

  const data = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(raw) as Record<string, unknown>); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });

  if (data['errorCode']) throw new Error(`${data['errorCode']}: ${data['message']}`);
  return (data['records'] as Record<string, unknown>[]) || [];
}
