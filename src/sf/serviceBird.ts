/**
 * Everything the app reads from and writes to the customer's Salesforce org.
 * Object and field names follow the ServiceBird MVP data model (Miro board).
 */
import { create, query, soqlDateTime, soqlId, update } from './api';

export type VisitStatus = 'Scheduled' | 'On Site' | 'Done';
export type ChargeType = 'Labour' | 'Material' | 'Travel' | 'Other';
export type PhotoKind = 'Before' | 'After' | 'Other';

export interface Visit {
  id: string;
  jobId: string;
  jobNumber: string;
  jobType: string;
  title: string;
  officeNotes: string;
  workSummary: string;
  status: VisitStatus;
  start: Date;
  end: Date;
  account: string;
  contactName: string;
  phone: string;
  address: string;
}

export interface JobItem {
  id: string;
  name: string;
  quantity: number;
}

export interface Charge {
  id: string;
  type: ChargeType;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

export interface VisitDetail extends Visit {
  items: JobItem[];
  charges: Charge[];
  photoKinds: PhotoKind[];
}

/** Charge.Unit__c picklist value used for each charge type. */
export const UNIT_FOR_TYPE: Record<ChargeType, string> = {
  Labour: 'Hour',
  Material: 'Each',
  Travel: 'Km',
  Other: 'Fixed',
};

const VISIT_FIELDS = `
  Id, sb:Status__c, sb:Scheduled_Start__c, sb:Scheduled_End__c, sb:Job__c,
  sb:Job__r.Name, sb:Job__r.sb:Description__c, sb:Job__r.sb:Work_Summary__c,
  sb:Job__r.sb:Job_Type__r.Name,
  sb:Job__r.sb:Account__r.Name, sb:Job__r.sb:Account__r.ShippingStreet,
  sb:Job__r.sb:Account__r.ShippingCity, sb:Job__r.sb:Account__r.ShippingPostalCode,
  sb:Job__r.sb:Contact__r.Name, sb:Job__r.sb:Contact__r.Phone, sb:Job__r.sb:Contact__r.MobilePhone`;

function toVisit(r: any): Visit {
  const job = r.Job__r ?? {};
  const account = job.Account__r ?? {};
  const contact = job.Contact__r ?? {};
  // The Job has no separate title field: the first line of its description is
  // the title, the rest is the note from the office.
  const [firstLine, ...rest] = String(job.Description__c ?? '').split('\n');
  const jobType = job.Job_Type__r?.Name ?? '';
  return {
    id: r.Id,
    jobId: r.Job__c,
    jobNumber: job.Name ?? '',
    jobType,
    title: firstLine.trim() || jobType || 'Job',
    officeNotes: rest.join('\n').trim(),
    workSummary: job.Work_Summary__c ?? '',
    status: r.Status__c,
    start: new Date(r.Scheduled_Start__c),
    end: new Date(r.Scheduled_End__c),
    account: account.Name ?? '',
    contactName: contact.Name ?? '',
    phone: contact.MobilePhone || contact.Phone || '',
    address: [account.ShippingStreet, account.ShippingPostalCode, account.ShippingCity]
      .filter(Boolean)
      .join(', '),
  };
}

/** The logged-in worker's visits that start on the given local day. */
export async function getMyVisits(userId: string, day: Date): Promise<Visit[]> {
  const from = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1);
  const rows = await query(`
    SELECT ${VISIT_FIELDS}
    FROM sb:Visit__c
    WHERE sb:Field_Worker__r.sb:User__c = ${soqlId(userId)}
      AND sb:Scheduled_Start__c >= ${soqlDateTime(from)}
      AND sb:Scheduled_Start__c < ${soqlDateTime(to)}
    ORDER BY sb:Scheduled_Start__c`);
  return rows.map(toVisit);
}

export async function getVisitDetail(visitId: string): Promise<VisitDetail> {
  const rows = await query(`SELECT ${VISIT_FIELDS} FROM sb:Visit__c WHERE Id = ${soqlId(visitId)}`);
  if (rows.length === 0) {
    throw new Error('This visit no longer exists or you do not have access to it.');
  }
  const visit = toVisit(rows[0]);
  const jobId = soqlId(visit.jobId);

  const [items, charges, photos] = await Promise.all([
    query(`
      SELECT Id, sb:Description__c, sb:Planned_Quantity__c, sb:Product__r.Name
      FROM sb:Job_Item__c WHERE sb:Job__c = ${jobId} ORDER BY CreatedDate`),
    query(`
      SELECT Id, sb:Type__c, sb:Description__c, sb:Quantity__c, sb:Unit__c, sb:Unit_Price__c, sb:Amount__c
      FROM sb:Charge__c WHERE sb:Visit__c = ${soqlId(visitId)} ORDER BY CreatedDate`),
    query(`
      SELECT Id, Title FROM ContentVersion
      WHERE FirstPublishLocationId = ${jobId} AND IsLatest = true AND sb:File_Kind__c = 'Photo'
      ORDER BY CreatedDate`),
  ]);

  return {
    ...visit,
    items: items.map((r: any) => ({
      id: r.Id,
      name: r.Description__c || r.Product__r?.Name || 'Item',
      quantity: r.Planned_Quantity__c ?? 1,
    })),
    charges: charges.map((r: any) => ({
      id: r.Id,
      type: r.Type__c,
      description: r.Description__c ?? '',
      quantity: r.Quantity__c ?? 0,
      unit: r.Unit__c ?? '',
      unitPrice: r.Unit_Price__c ?? 0,
      amount: r.Amount__c ?? 0,
    })),
    photoKinds: photos.map((r: any) => photoKindFromTitle(r.Title)),
  };
}

export function setVisitStatus(visitId: string, status: VisitStatus): Promise<void> {
  return update('sb:Visit__c', visitId, { Status__c: status });
}

export interface Rates {
  labour: number | null;
  travel: number | null;
}

/**
 * Default rates from the org-wide ServiceBird Settings.
 * ASSUMPTION: field names Labour_Rate__c and Travel_Rate__c. Change them here
 * once the Settings custom setting is built.
 */
export async function getRates(orgId: string): Promise<Rates> {
  try {
    const rows = await query(`
      SELECT sb:Labour_Rate__c, sb:Travel_Rate__c FROM sb:Settings__c
      WHERE SetupOwnerId = ${soqlId(orgId)} LIMIT 1`);
    return { labour: rows[0]?.Labour_Rate__c ?? null, travel: rows[0]?.Travel_Rate__c ?? null };
  } catch {
    // Rates only pre-fill the form, so a missing setting is not an error.
    return { labour: null, travel: null };
  }
}

export interface NewCharge {
  jobId: string;
  visitId: string;
  type: ChargeType;
  description: string;
  quantity: number;
  unitPrice: number;
}

export function addCharge(c: NewCharge): Promise<string> {
  return create('sb:Charge__c', {
    Job__c: c.jobId,
    Visit__c: c.visitId,
    Type__c: c.type,
    Description__c: c.description,
    Quantity__c: c.quantity,
    Unit__c: UNIT_FOR_TYPE[c.type],
    Unit_Price__c: c.unitPrice,
  });
}

// File_Kind__c only says Photo / Signature / Report, so the Before / After tag
// travels in the file title, e.g. "Before - JOB-00141 - 10:42".
function photoKindFromTitle(title: string): PhotoKind {
  if (title?.startsWith('Before')) {
    return 'Before';
  }
  if (title?.startsWith('After')) {
    return 'After';
  }
  return 'Other';
}

/** Uploads a photo (base64 JPEG) to the Job's Files. */
export function uploadPhoto(jobId: string, jobNumber: string, kind: PhotoKind, base64Jpeg: string): Promise<string> {
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const title = `${kind} - ${jobNumber} - ${stamp}`;
  return create('ContentVersion', {
    Title: title,
    PathOnClient: title.replace(/[^a-zA-Z0-9-]+/g, '_') + '.jpg',
    VersionData: base64Jpeg,
    FirstPublishLocationId: jobId,
    File_Kind__c: 'Photo',
  });
}

export interface Completion {
  visit: Visit;
  note: string;
  signedBy: string;
  /** PNG of the signature, base64. Null when the customer could not sign. */
  signaturePng: string | null;
}

/** Saves the signature and note on the Job, then marks the Visit as Done. */
export async function completeVisit({ visit, note, signedBy, signaturePng }: Completion): Promise<void> {
  const now = new Date();
  const jobFields: Record<string, unknown> = {};

  if (signaturePng) {
    await create('ContentVersion', {
      Title: `Signature - ${visit.jobNumber} - ${signedBy}`,
      PathOnClient: 'signature.png',
      VersionData: signaturePng,
      FirstPublishLocationId: visit.jobId,
      File_Kind__c: 'Signature',
    });
    jobFields.Signed_By__c = signedBy;
    jobFields.Signed_At__c = now.toISOString();
  }
  if (note.trim()) {
    const line = `${now.toLocaleDateString()} ${visit.jobNumber}: ${note.trim()}`;
    jobFields.Work_Summary__c = visit.workSummary ? `${visit.workSummary}\n${line}` : line;
  }
  if (Object.keys(jobFields).length > 0) {
    await update('sb:Job__c', visit.jobId, jobFields);
  }
  await setVisitStatus(visit.id, 'Done');
}

export async function getUserName(userId: string): Promise<string> {
  const rows = await query(`SELECT Name FROM User WHERE Id = ${soqlId(userId)}`);
  return rows[0]?.Name ?? '';
}
