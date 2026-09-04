export type Origin = 'pronote' | 'manual';
export type AcademicKind = 'lesson' | 'assignment' | 'kholle' | 'ds' | 'event';

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
  minQuantity: number;
  unit?: string;
  note?: string;
};

export type AcademicItem = {
  id: string;
  externalId?: string;
  origin: Origin;
  kind: AcademicKind;
  title: string;
  subjectId?: string;
  startAt: string;
  endAt?: string;
  room?: string;
  teacher?: string;
  description?: string;
  completed?: boolean;
};

export type Grade = {
  id: string;
  subjectId: string;
  type: 'kholle' | 'ds' | 'exam' | 'other';
  value: number;
  coefficient?: number;
  date: string;
  note?: string;
};

export type PronoteCredentials = {
  url: string;
  username: string;
  password: string;
};
