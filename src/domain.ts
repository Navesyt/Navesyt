export type Origin = 'pronote' | 'manual';
export type AcademicKind = 'course' | 'assignment' | 'khôlle' | 'DS' | 'other';
export type GradeType = 'khôlle' | 'DS' | 'exam' | 'other';
export type Subject = { id: string; name: string; color: string };
export type InventoryItem = { id: string; name: string; category: string; quantity: number; lowStockThreshold: number; unit?: string; note?: string };
export type AcademicItem = { id: string; origin: Origin; kind: AcademicKind; title: string; subjectId?: string; startsAt: string; endsAt?: string; completed: boolean; notes?: string; externalId?: string; room?: string; teacher?: string };
export type Grade = { id: string; subjectId: string; type: GradeType; score20: number; coefficient?: number; date: string; comment?: string };
export function assertValidGrade(score20: number) { if (!Number.isFinite(score20) || score20 < 0 || score20 > 20) throw new Error('Une note doit être comprise entre 0 et 20.'); }
export function mergePronoteItems(existing: AcademicItem[], incoming: AcademicItem[]) {
  const manual = existing.filter(x => x.origin === 'manual');
  const pronote = new Map(existing.filter(x => x.origin === 'pronote').map(x => [x.externalId ?? x.id, x]));
  for (const item of incoming) if (item.origin === 'pronote') pronote.set(item.externalId ?? item.id, item);
  return [...manual, ...pronote.values()].sort((a,b) => a.startsAt.localeCompare(b.startsAt));
}
