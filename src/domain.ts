export type Origin = 'pronote' | 'manual';
export type AcademicKind = 'course' | 'assignment' | 'khôlle' | 'DS' | 'other';

export type Subject = {
  id: string;
  name: string;
  color: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  lowStockThreshold: number;
};

export type AcademicItem = {
  id: string;
  origin: Origin;
  kind: AcademicKind;
  title: string;
  subjectId?: string;
  startsAt: string;
  endsAt?: string;
  completed: boolean;
  notes?: string;
  externalId?: string;
};

export type Grade = {
  id: string;
  subjectId: string;
  type: 'khôlle' | 'DS' | 'other';
  score20: number;
  coefficient?: number;
  date: string;
  comment?: string;
};

/**
 * IMPORTANT: Pronote synchronization may only create/update/delete records
 * whose origin is `pronote`. Manual records are never touched by sync.
 */
export function mergePronoteItems(
  existing: AcademicItem[],
  incoming: AcademicItem[],
): AcademicItem[] {
  const manual = existing.filter((item) => item.origin === 'manual');
  const pronote = new Map(
    existing
      .filter((item) => item.origin === 'pronote')
      .map((item) => [item.externalId ?? item.id, item]),
  );

  for (const item of incoming) {
    if (item.origin !== 'pronote') continue;
    pronote.set(item.externalId ?? item.id, item);
  }

  return [...manual, ...pronote.values()];
}
