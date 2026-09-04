import type { AcademicItem } from './domain';

export type PronoteApiConfig = { baseUrl: string; timeoutMs?: number; headers?: Record<string,string> };
export interface PronoteApi { fetchSchedule(from:string,to:string):Promise<AcademicItem[]>; fetchAssignments(from:string,to:string):Promise<AcademicItem[]>; }

async function request<T>(config:PronoteApiConfig,path:string):Promise<T>{
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),config.timeoutMs??10000);
  try{const r=await fetch(`${config.baseUrl.replace(/\/$/,'')}${path}`,{signal:controller.signal,headers:{Accept:'application/json',...(config.headers??{})}});if(!r.ok)throw new Error(`Pronote API HTTP ${r.status}`);return await r.json() as T}finally{clearTimeout(timer)}
}

/** Contract expected from a future local/direct Pronote bridge. Credentials are deliberately not part of this object. */
export function createPronoteApi(config:PronoteApiConfig):PronoteApi{return{
 fetchSchedule:(from,to)=>request<AcademicItem[]>(config,`/schedule?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
 fetchAssignments:(from,to)=>request<AcademicItem[]>(config,`/assignments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
}}
