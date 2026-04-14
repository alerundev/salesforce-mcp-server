import jsforce from 'jsforce';
import dotenv from 'dotenv';

dotenv.config();

let conn: jsforce.Connection | null = null;

export async function getConnection(): Promise<jsforce.Connection> {
  if (conn) return conn;

  conn = new jsforce.Connection({
    loginUrl: process.env.SF_LOGIN_URL || 'https://login.salesforce.com',
  });

  await conn.login(
    process.env.SF_USERNAME!,
    process.env.SF_PASSWORD! + process.env.SF_SECURITY_TOKEN!
  );

  console.error('[Salesforce] Connected successfully');
  return conn;
}

// ── Account ──────────────────────────────────────────────────────────────────

export async function getAccounts(limit = 20) {
  const c = await getConnection();
  const result = await c.query(
    `SELECT Id, Name, Industry, AnnualRevenue, Phone, BillingCity, BillingCountry, NumberOfEmployees
     FROM Account ORDER BY CreatedDate DESC LIMIT ${limit}`
  );
  return result.records;
}

export async function searchAccounts(keyword: string) {
  const c = await getConnection();
  const result = await c.query(
    `SELECT Id, Name, Industry, AnnualRevenue, Phone, BillingCity
     FROM Account WHERE Name LIKE '%${keyword}%' LIMIT 20`
  );
  return result.records;
}

// ── Opportunity ───────────────────────────────────────────────────────────────

export async function getOpportunities(limit = 20) {
  const c = await getConnection();
  const result = await c.query(
    `SELECT Id, Name, StageName, Amount, CloseDate, AccountId, Account.Name, Probability
     FROM Opportunity ORDER BY CloseDate ASC LIMIT ${limit}`
  );
  return result.records;
}

export async function getOpportunitiesByStage(stage: string) {
  const c = await getConnection();
  const result = await c.query(
    `SELECT Id, Name, StageName, Amount, CloseDate, Account.Name, Probability
     FROM Opportunity WHERE StageName = '${stage}' ORDER BY Amount DESC LIMIT 20`
  );
  return result.records;
}

export async function getOpportunitiesSummary() {
  const c = await getConnection();
  const result = await c.query(
    `SELECT StageName, COUNT(Id) cnt, SUM(Amount) totalAmount
     FROM Opportunity GROUP BY StageName`
  );
  return result.records;
}

// ── Contact ───────────────────────────────────────────────────────────────────

export async function getContacts(limit = 20) {
  const c = await getConnection();
  const result = await c.query(
    `SELECT Id, FirstName, LastName, Email, Phone, Title, Account.Name
     FROM Contact ORDER BY CreatedDate DESC LIMIT ${limit}`
  );
  return result.records;
}

export async function searchContacts(keyword: string) {
  const c = await getConnection();
  const result = await c.query(
    `SELECT Id, FirstName, LastName, Email, Phone, Title, Account.Name
     FROM Contact WHERE LastName LIKE '%${keyword}%' OR FirstName LIKE '%${keyword}%' LIMIT 20`
  );
  return result.records;
}

// ── Lead ──────────────────────────────────────────────────────────────────────

export async function getLeads(limit = 20) {
  const c = await getConnection();
  const result = await c.query(
    `SELECT Id, FirstName, LastName, Company, Email, Status, LeadSource, Rating
     FROM Lead ORDER BY CreatedDate DESC LIMIT ${limit}`
  );
  return result.records;
}

export async function getLeadsByStatus(status: string) {
  const c = await getConnection();
  const result = await c.query(
    `SELECT Id, FirstName, LastName, Company, Email, Status, LeadSource
     FROM Lead WHERE Status = '${status}' LIMIT 20`
  );
  return result.records;
}

// ── Task / Activity ───────────────────────────────────────────────────────────

export async function getRecentActivities(limit = 20) {
  const c = await getConnection();
  const result = await c.query(
    `SELECT Id, Subject, Status, Priority, ActivityDate, Who.Name, What.Name
     FROM Task ORDER BY CreatedDate DESC LIMIT ${limit}`
  );
  return result.records;
}

// ── Custom SOQL ───────────────────────────────────────────────────────────────

export async function runSOQL(soql: string) {
  const c = await getConnection();
  const result = await c.query(soql);
  return result.records;
}
