import {repo} from './db';import {mockPronote} from './pronote';import type {AcademicItem} from './domain';import type {PronoteApi} from './api';
export type SyncResult={upserted:number;removed:number;fetched:number};
export async function syncPronote(client:PronoteApi|typeof mockPronote=mockPronote):Promise<SyncResult>{
 const from=new Date().toISOString(),to=new Date(Date.now()+14*86400000).toISOString();
 const [schedule,assignments]=await Promise.all([client.fetchSchedule(from,to),client.fetchAssignments(from,to)]);
 const incoming=[...schedule,...assignments].filter(x=>x.origin==='pronote'&&!!x.externalId);
 for(const item of incoming)repo.academic.upsertPronote(item);
 const ids=incoming.map(x=>x.externalId!);
 // Deletion is restricted to the Pronote partition by the repository itself.
 repo.academic.deletePronoteMissing(ids);
 return{upserted:incoming.length,removed:0,fetched:incoming.length};
}
export function normalizePronotePayload(raw:unknown):AcademicItem[]{if(!Array.isArray(raw))throw Error('Invalid Pronote payload');return raw.map((x:any)=>({...x,origin:'pronote'}));}
