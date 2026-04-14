import pkg from 'jsforce';
import https from 'https';
const { Connection } = pkg;

type JsforceConnection = InstanceType<typeof Connection>;

let conn: JsforceConnection | null = null;

async function getConnection(): Promise<JsforceConnection> {
  if (conn) return conn;

  conn = new Connection({
    loginUrl: process.env['SF_LOGIN_URL'] || 'https://login.salesforce.com',
    version: '59.0',
  });

  // SOAP 로그인으로 accessToken + instanceUrl 획득
  await conn.login(
    process.env['SF_USERNAME']!,
    process.env['SF_PASSWORD']! + process.env['SF_SECURITY_TOKEN']!
  );

  console.log('[Salesforce] SOAP login success');
  return conn;
}

export async function query(soql: string): Promise<Record<string, unknown>[]> {
  const c = await getConnection();

  // jsforce 내부 accessToken + instanceUrl 꺼내서 REST API 직접 호출
  const token = (c as any).accessToken as string;
  const base = (c as any).instanceUrl as string;

  if (!token || !base) throw new Error('Salesforce connection not established');

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
    // 토큰 만료 시 재연결
    conn = null;
    throw new Error(`${data['errorCode']}: ${data['message']}`);
  }

  return (data['records'] as Record<string, unknown>[]) || [];
}
