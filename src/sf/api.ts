/**
 * Thin promise wrappers around the Salesforce Mobile SDK.
 *
 * The SDK stores the login token securely and adds it to every request, so
 * nothing here ever sees a password or token.
 */
import { net, oauth } from 'react-native-force';

/**
 * Namespace prefix of the ServiceBird managed package.
 * Set it to '' when testing against an org where the objects were deployed
 * without a namespace (for example a scratch org).
 */
export const NS = 'servicebird__';

/** Replaces every `sb:` token with the namespace: ns('sb:Visit__c') -> 'servicebird__Visit__c'. */
export const ns = (text: string): string => text.replace(/sb:/g, NS);

/** Removes the namespace from all keys, so screens can read `Status__c` instead of `servicebird__Status__c`. */
function stripNs(value: unknown): any {
  if (Array.isArray(value)) {
    return value.map(stripNs);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      out[NS && key.startsWith(NS) ? key.slice(NS.length) : key] = stripNs(v);
    }
    return out;
  }
  return value;
}

/** Adds the namespace to our custom fields (keys ending in __c) before a write. */
function withNs(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(fields)) {
    out[key.endsWith('__c') && !key.startsWith(NS) ? NS + key : key] = v;
  }
  return out;
}

/** Guards record ids before they are put into SOQL. */
export function soqlId(id: string): string {
  if (!/^[a-zA-Z0-9]{15,18}$/.test(id)) {
    throw new Error('Invalid record id: ' + id);
  }
  return `'${id}'`;
}

/** SOQL datetime literal, e.g. 2026-10-07T22:00:00Z */
export function soqlDateTime(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

interface QueryResult {
  records: unknown[];
  done: boolean;
  nextRecordsUrl?: string;
}

/** Runs a SOQL query (with `sb:` tokens) and returns all records, namespace removed. */
export async function query<T = any>(soql: string): Promise<T[]> {
  let page = await new Promise<QueryResult>((resolve, reject) =>
    net.query<QueryResult>(ns(soql), resolve, reject),
  );
  const records = [...page.records];
  while (!page.done && page.nextRecordsUrl) {
    const url = page.nextRecordsUrl;
    page = await new Promise<QueryResult>((resolve, reject) =>
      net.queryMore<QueryResult>(url, resolve, reject),
    );
    records.push(...page.records);
  }
  return stripNs(records);
}

/** Creates a record and returns its id. `objectName` may use `sb:`. */
export async function create(objectName: string, fields: Record<string, unknown>): Promise<string> {
  const res = await new Promise<{ id: string }>((resolve, reject) =>
    net.create<{ id: string }>(ns(objectName), withNs(fields), resolve, reject),
  );
  return res.id;
}

/** Updates a record. `objectName` may use `sb:`. */
export function update(objectName: string, id: string, fields: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) =>
    net.update(ns(objectName), id, withNs(fields), () => resolve(), reject),
  );
}

export interface Session {
  userId: string;
  orgId: string;
  instanceUrl: string;
}

const toSession = (acc: any): Session => ({ userId: acc.userId, orgId: acc.orgId, instanceUrl: acc.instanceUrl });

/** The saved login from a previous run, or null if the worker has not logged in yet. */
export function getExistingSession(): Promise<Session | null> {
  return new Promise(resolve => oauth.getAuthCredentials(acc => resolve(toSession(acc)), () => resolve(null)));
}

/** Opens the Salesforce login page and resolves once the worker has logged in. */
export function login(): Promise<Session> {
  return new Promise((resolve, reject) => oauth.authenticate(acc => resolve(toSession(acc)), reject));
}

export function logout(): Promise<void> {
  return new Promise((resolve, reject) => oauth.logout(() => resolve(), reject));
}

/** Turns an SDK or REST error into a sentence a worker can read. */
export function errorMessage(err: unknown): string {
  if (!err) {
    return 'Something went wrong.';
  }
  if (typeof err === 'string') {
    return err;
  }
  const anyErr = err as any;
  // REST errors come back as [{ message, errorCode }] inside the response body.
  const body = anyErr.response?.body ?? anyErr.body ?? anyErr;
  try {
    const parsed = typeof body === 'string' ? JSON.parse(body) : body;
    if (Array.isArray(parsed) && parsed[0]?.message) {
      return parsed[0].message;
    }
  } catch {
    // fall through
  }
  return anyErr.message ?? 'Something went wrong. Check your connection and try again.';
}
