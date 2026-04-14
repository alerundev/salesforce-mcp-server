import pkg from 'jsforce';
const { Connection } = pkg;

type JsforceConnection = InstanceType<typeof Connection> & {
  accessToken?: string;
  instanceUrl?: string;
};

let conn: JsforceConnection | null = null;

async function getConnection(): Promise<JsforceConnection> {
  if (conn?.accessToken) return conn;

  const c = new Connection({
    loginUrl: process.env['SF_LOGIN_URL'] || 'https://login.salesforce.com',
    version: '59.0',
  }) as JsforceConnection;

  const userInfo = await c.login(
    process.env['SF_USERNAME']!,
    process.env['SF_PASSWORD']! + process.env['SF_SECURITY_TOKEN']!
  );

  console.log('[Salesforce] Login success, user:', (userInfo as any).id);
  console.log('[Salesforce] accessToken:', c.accessToken ? c.accessToken.substring(0, 20) + '...' : 'NONE');
  console.log('[Salesforce] instanceUrl:', c.instanceUrl);

  conn = c;
  return conn;
}

export async function query(soql: string): Promise<Record<string, unknown>[]> {
  const c = await getConnection();
  const result = await c.query(soql);
  return result.records as Record<string, unknown>[];
}
