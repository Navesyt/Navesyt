# My Room Planner

Local-first mobile app for university / preparatory-school students. The MVP combines an inventory manager ("Ma chambre") and a synchronized academic planner.

## Product decisions

- **Stack:** React Native + Expo + TypeScript.
- **Persistence:** SQLite on-device via `expo-sqlite`.
- **Authentication:** none. No account, no remote identity service.
- **Sync:** Pronote is an adapter boundary. MVP uses realistic mocked Pronote data; a future local Pronote client can replace `src/pronote.ts` without changing the domain or UI.
- **Notifications:** local scheduled notifications only via `expo-notifications`; no remote push service.
- **Language:** French primary; English fallback should be added through an i18n layer before production.
- **Widgets:** excluded from MVP; native iOS/Android widgets can be added in a development/EAS build later.

## Architecture

```text
UI (React Native)
  ├── Dashboard
  ├── Inventory / filters / +/- controls
  ├── Planner / calendar / assignments
  └── Academic tracking / grades
          │
          ▼
Application services
  ├── Inventory service
  ├── Planner service
  ├── Pronote sync service
  └── Notification scheduler
          │
          ├───────────────┐
          ▼               ▼
     Domain models     SQLite repositories
          │               │
          │               ▼
          │        student_planner.db
          │
          └── PronoteClient interface
                    │
                    ├── Mock adapter (MVP)
                    └── Local/direct adapter (future)
```

### Data ownership rule

Every academic event/task has an immutable semantic origin:

- `origin = manual`: created by the student; **Pronote sync must never modify or delete it**.
- `origin = pronote`: owned by the Pronote adapter; sync may insert/update/delete it.

Pronote records should have a stable `externalId`. Synchronization is an upsert keyed by that external ID and is restricted to the Pronote partition. This prevents a future API integration from accidentally overwriting student-created tasks.

## SQLite schema

### `subjects`
`id`, `name`, `color`

Subject colors are shared by timetable, planner, assignments, Khôlles and DS.

### `inventory_items`
`id`, `name`, `category`, `quantity`, `low_stock_threshold`

Required UX: inline `+` and `−` buttons, category filters, and a "Stock faible" toggle.

### `academic_items`
`id`, `origin`, `kind`, `title`, `subject_id`, `starts_at`, `ends_at`, `completed`, `notes`, `external_id`

`origin` is constrained at the database level to `pronote | manual`.

### `grades`
`id`, `subject_id`, `type`, `score20`, `coefficient`, `date`, `comment`

Scores are validated on a `/20` scale. Coefficients are optional and support Khôlles and DS.

## Pronote sync contract

```ts
interface PronoteClient {
  fetchSchedule(from: string, to: string): Promise<AcademicItem[]>;
  fetchAssignments(from: string, to: string): Promise<AcademicItem[]>;
}
```

The adapter should normalize Pronote data into the app's domain model. It must never return `origin = manual`.

Recommended production sync algorithm:

1. Fetch a bounded date window.
2. Normalize all remote records with stable `externalId` values.
3. Start a SQLite transaction.
4. Upsert only records where `origin = pronote`.
5. Reconcile stale Pronote IDs from the same synchronization window by deleting only `origin = pronote` rows.
6. Commit atomically.
7. Rebuild the planner view from SQLite.

Never perform a global `DELETE FROM academic_items` during synchronization.

## Notifications

The MVP schedules a daily local reminder at 19:00. Production logic should compute tomorrow's packing checklist from the next day's academic items and include only required inventory items. Reschedule after a timetable sync and whenever notification preferences change.

## Screens

1. **Accueil** — next classes, assignments, low-stock count, next reminder, academic snapshot.
2. **Ma chambre** — searchable/filterable inventory, category chips, low-stock filter, inline quantity controls, add/edit item.
3. **Planning** — day/week calendar, subject color tags, Pronote/manual origin indicators, assignment completion.
4. **Notes** — subject list, Khôlles/DS entries, `/20` score and optional coefficient, weighted averages.
5. **Réglages** — notification time, Pronote adapter settings, export/import, language.

## Future privacy/export layer

All user data remains local in the MVP. A future backup layer should be an explicit adapter, e.g.:

```ts
interface BackupProvider {
  export(payload: Uint8Array): Promise<void>;
  import(): Promise<Uint8Array>;
}
```

Potential providers: manual JSON file, Google Drive, iCloud, or WebDAV. No provider should become a mandatory backend for normal app operation.

## Security requirements for future Pronote integration

- Do not send credentials to an application-owned multi-tenant backend.
- Prefer direct/local communication where technically possible.
- Store credentials only in OS secure storage (Keychain/Keystore), never SQLite/plain text.
- Do not log usernames, passwords, session cookies, student IDs, assignments, or schedule payloads.
- Keep cached Pronote data in the local database and provide a "clear Pronote cache" action.
- Treat authentication/session handling as a separate adapter from the academic domain.

## MVP acceptance criteria

- App works with airplane mode after initial installation.
- Inventory changes persist after restart.
- `+` and `−` never allow negative stock.
- Category and low-stock filters work together.
- Manual tasks survive every Pronote synchronization unchanged.
- Pronote tasks are upserted by stable external ID.
- Grades accept only 0–20 and optional coefficients.
- Subject colors are reused across planner surfaces.
- A daily local notification can be scheduled without a remote service.
- No user account or cloud database is required.

## Local development

```bash
npm install
npx expo start
```

For local notifications and native functionality, use a development build rather than relying on Expo Go where the installed native module is unavailable.

## Current starter files

- `App.tsx` — functional starter UI for dashboard, inventory and planner.
- `src/db.ts` — SQLite initialization and repository functions.
- `src/domain.ts` — domain types and protected Pronote merge logic.
- `src/pronote.ts` — mock Pronote adapter.
- `src/notifications.ts` — local daily notification scheduler.
- `app.json` — Expo/native notification configuration.
