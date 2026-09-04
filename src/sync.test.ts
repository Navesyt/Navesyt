import {mergePronoteItems} from './domain';
import type {AcademicItem} from './domain';
const manual:AcademicItem={id:'m1',origin:'manual',kind:'assignment',title:'Mon devoir perso',startsAt:'2026-09-05T18:00:00Z',completed:false};
const pronote:AcademicItem={id:'p1',origin:'pronote',kind:'course',title:'Maths',externalId:'lesson-1',startsAt:'2026-09-05T08:00:00Z',completed:false};
const updated={...pronote,title:'Maths — Analyse'};
describe('mergePronoteItems',()=>{it('keeps manual entries',()=>{const r=mergePronoteItems([manual,pronote],[updated]);expect(r.find(x=>x.id==='m1')).toEqual(manual)});it('updates Pronote entries by externalId',()=>{const r=mergePronoteItems([pronote],[updated]);expect(r.find(x=>x.externalId==='lesson-1')?.title).toBe('Maths — Analyse')});it('ignores incoming manual records',()=>{const fake={...manual,id:'m2',title:'Injected'};const r=mergePronoteItems([manual],[fake]);expect(r.some(x=>x.id==='m2')).toBe(false)})});
