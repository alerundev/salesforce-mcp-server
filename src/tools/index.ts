import { get_accounts } from './get_accounts.js';
import { search_accounts } from './search_accounts.js';
import { get_opportunities } from './get_opportunities.js';
import { get_opportunities_by_stage } from './get_opportunities_by_stage.js';
import { get_opportunities_summary } from './get_opportunities_summary.js';
import { get_contacts } from './get_contacts.js';
import { search_contacts } from './search_contacts.js';
import { get_leads } from './get_leads.js';
import { get_leads_by_status } from './get_leads_by_status.js';
import { get_recent_activities } from './get_recent_activities.js';
import { run_soql } from './run_soql.js';

export const tools = [
  get_accounts,
  search_accounts,
  get_opportunities,
  get_opportunities_by_stage,
  get_opportunities_summary,
  get_contacts,
  search_contacts,
  get_leads,
  get_leads_by_status,
  get_recent_activities,
  run_soql,
];
