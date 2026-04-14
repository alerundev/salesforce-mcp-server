import pkg from 'jsforce';
const { Connection } = pkg;

type JsforceConnection = InstanceType<typeof Connection>;

let conn: JsforceConnection | null = null;

export async function getConnection(): Promise<JsforceConnection> {
  if (conn) return conn;

  // SOAP API 방식 (Username-Password Flow 불필요)
  conn = new Connection({
    loginUrl: process.env['SF_LOGIN_URL'] || 'https://login.salesforce.com',
  });

  await conn.login(
    process.env['SF_USERNAME']!,
    process.env['SF_PASSWORD']! + process.env['SF_SECURITY_TOKEN']!
  );

  console.log('[Salesforce] Connected successfully');
  return conn;
}

export async function query(soql: string): Promise<Record<string, unknown>[]> {
  const c = await getConnection();
  const result = await c.query(soql);
  return result.records as Record<string, unknown>[];
}
