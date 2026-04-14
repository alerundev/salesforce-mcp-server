import pkg from 'jsforce';
const { Connection } = pkg;

type JsforceConnection = InstanceType<typeof Connection>;

let conn: JsforceConnection | null = null;

export async function getConnection(): Promise<JsforceConnection> {
  if (conn) return conn;

  const loginUrl = process.env['SF_LOGIN_URL'] || 'https://login.salesforce.com';
  const username = process.env['SF_USERNAME']!;
  const password = process.env['SF_PASSWORD']!;
  const securityToken = process.env['SF_SECURITY_TOKEN'] || '';
  const consumerKey = process.env['SF_CONSUMER_KEY'];
  const consumerSecret = process.env['SF_CONSUMER_SECRET'];

  if (consumerKey && consumerSecret) {
    // OAuth2 Username-Password Flow
    conn = new Connection({
      oauth2: {
        loginUrl,
        clientId: consumerKey,
        clientSecret: consumerSecret,
      },
    });
  } else {
    conn = new Connection({ loginUrl });
  }

  await conn.login(username, password + securityToken);
  console.log('[Salesforce] Connected successfully');
  return conn;
}

export async function query(soql: string): Promise<Record<string, unknown>[]> {
  const c = await getConnection();
  const result = await c.query(soql);
  return result.records as Record<string, unknown>[];
}
