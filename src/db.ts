import * as SQLite from 'expo-sqlite';
import type { AcademicItem, Grade, InventoryItem, Subject } from './domain';

const db = SQLite.openDatabaseSync('student_planner.db');

export function initDb() {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS academic_items (
      id TEXT PRIMARY KEY NOT NULL,
      origin TEXT NOT NULL CHECK(origin IN ('pronote','manual')),
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      subject_id TEXT,
      starts_at TEXT NOT NULL,
      ends_at TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      external_id TEXT UNIQUE
    );
    CREATE INDEX IF NOT EXISTS idx_academic_start ON academic_items(starts_at);
    CREATE INDEX IF NOT EXISTS idx_academic_origin ON academic_items(origin);
    CREATE TABLE IF NOT EXISTS grades (
      id TEXT PRIMARY KEY NOT NULL,
      subject_id TEXT NOT NULL,
      type TEXT NOT NULL,
      score20 REAL NOT NULL CHECK(score20 >= 0 AND score20 <= 20),
      coefficient REAL,
      date TEXT NOT NULL,
      comment TEXT
    );
  `);
}

export function seedSubjects() {
  const defaults: Subject[] = [
    { id: 'maths', name: 'Maths', color: '#4F46E5' },
    { id: 'physics', name: 'Physique', color: '#0891B2' },
    { id: 'cs', name: 'Info', color: '#059669' },
    { id: 'philo', name: 'Philo', color: '#D97706' },
  ];
  const stmt = db.prepareSync('INSERT OR IGNORE INTO subjects (id,name,color) VALUES (?,?,?)');
  try {
    for (const s of defaults) stmt.executeSync(s.id, s.name, s.color);
  } finally {
    stmt.finalizeSync();
  }
}

export function listInventory(): InventoryItem[] {
  return db.getAllSync<InventoryItem>('SELECT * FROM inventory_items ORDER BY category, name');
}

export function adjustInventory(id: string, delta: number) {
  db.runSync('UPDATE inventory_items SET quantity = MAX(0, quantity + ?) WHERE id = ?', delta, id);
}

export function listSubjects(): Subject[] {
  return db.getAllSync<Subject>('SELECT * FROM subjects ORDER BY name');
}

export function listAcademicItems(from: string, to: string): AcademicItem[] {
  return db.getAllSync<AcademicItem>(
    `SELECT id, origin, kind, title, subject_id as subjectId, starts_at as startsAt,
            ends_at as endsAt, completed, notes, external_id as externalId
     FROM academic_items WHERE starts_at >= ? AND starts_at < ? ORDER BY starts_at`,
    from, to,
  );
}

export function upsertPronoteItems(items: AcademicItem[]) {
  db.withTransactionSync(() => {
    const stmt = db.prepareSync(`
      INSERT INTO academic_items
        (id, origin, kind, title, subject_id, starts_at, ends_at, completed, notes, external_id)
      VALUES (?, 'pronote', ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(external_id) DO UPDATE SET
        kind=excluded.kind, title=excluded.title, subject_id=excluded.subject_id,
        starts_at=excluded.starts_at, ends_at=excluded.ends_at,
        completed=excluded.completed, notes=excluded.notes
    `);
    try {
      for (const item of items) {
        if (item.origin !== 'pronote' || !item.externalId) continue;
        stmt.executeSync(
          item.id, item.kind, item.title, item.subjectId ?? null, item.startsAt,
          item.endsAt ?? null, item.completed ? 1 : 0, item.notes ?? null, item.externalId,
        );
      }
    } finally {
      stmt.finalizeSync();
    }
  });
}

export function addManualItem(item: AcademicItem) {
  if (item.origin !== 'manual') throw new Error('Manual repository only accepts origin=manual');
  db.runSync(
    `INSERT INTO academic_items
      (id,origin,kind,title,subject_id,starts_at,ends_at,completed,notes,external_id)
     VALUES (?,?,?,?,?,?,?,?,?,NULL)`,
    item.id, item.origin, item.kind, item.title, item.subjectId ?? null,
    item.startsAt, item.endsAt ?? null, item.completed ? 1 : 0, item.notes ?? null,
  );
}

export function addGrade(grade: Grade) {
  db.runSync(
    `INSERT INTO grades (id,subject_id,type,score20,coefficient,date,comment)
     VALUES (?,?,?,?,?,?,?)`,
    grade.id, grade.subjectId, grade.type, grade.score20,
    grade.coefficient ?? null, grade.date, grade.comment ?? null,
  );
}
