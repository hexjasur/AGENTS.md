---
name: local-data-sqlite
description: Design and harden local SQLite storage for desktop and mobile apps, including Tauri with rusqlite, sqlx, or tauri-plugin-sql: schema design, migrations, WAL mode, transactions, parameterized queries, indexes, backups, export, and storing chat history or settings. Use when persisting app data locally, adding or changing tables, writing migrations, fixing database locked errors, or planning backup and data export.
license: MIT
metadata:
  author: hexjasur
  version: "1.0.0"
  last_reviewed: "2026-10-30"
---

# Local Data with SQLite

Treat the local database as the user's data: keep it in the app data directory, migrate it forward without loss, and never trust a query string. Small, boring schemas with tested migrations beat clever ones.

## Procedure

```text
- [ ] 1. List the entities, their relations, and what must survive upgrades
- [ ] 2. Choose the access layer and the database location
- [ ] 3. Write the schema with constraints and indexes
- [ ] 4. Add versioned, forward-only migrations
- [ ] 5. Use parameterized queries, transactions, and a single writer
- [ ] 6. Plan backup, export, deletion, and secrets handling
- [ ] 7. Test migrations on real old data and failure paths
```

1. Name the data (settings, conversations, messages, projects) and decide which is user content that must never be lost. Keep settings and content in separate tables.
2. Use one access layer. In Tauri, prefer database code in Rust (`rusqlite` or `sqlx`) behind commands, or `tauri-plugin-sql` with narrow capabilities. Store the file under the OS app data directory (Tauri `app_data_dir`), not the install folder or the project root.
3. Use `INTEGER PRIMARY KEY` ids or UUID text, `NOT NULL`, `CHECK`, `UNIQUE`, and `FOREIGN KEY ... ON DELETE` rules. Store time as UTC ISO text or integer epoch, and money as integer minor units. Index columns used in `WHERE`, `JOIN`, and `ORDER BY`; verify with `EXPLAIN QUERY PLAN`.
4. Track the schema version with `PRAGMA user_version` or a `schema_migrations` table. Each migration is a numbered file applied in one transaction, never edited after release. Back up the database file before migrating.
5. Bind every value with placeholders (`?1`, `:name`). Wrap multi-step writes in a transaction. Enable `PRAGMA foreign_keys = ON` on every connection (it is off by default), use `journal_mode = WAL` and a `busy_timeout`, and keep one writer connection or a small pool.
6. Offer a user-visible export (JSON or SQLite copy) and a delete-all option. Make backups with the SQLite backup API or `VACUUM INTO`, not by copying a live file. Keep API keys and tokens in the OS keychain, not in the database.
7. Test a migration from every released version using a fixture database, then run the app against the result. Test a crash mid-migration, a read-only disk, and a corrupted file (`PRAGMA integrity_check`).

## Guardrails

- Never build SQL by string concatenation or formatting with user, file, or model-generated data; use bound parameters. Identifiers (table or column names) must come from an allowlist.
- Never edit or reorder a migration that has shipped; add a new one.
- Never run destructive migrations (drop column, table rebuild) without a backup and a transaction.
- Never store API keys, passwords, or tokens in plain text in the database.
- Never open the database from the webview or expose a generic "run SQL" command to the frontend.
- Never copy the `.db` file while the app is writing; use the backup API.
- Do not store large blobs (images, files) in rows; store the file on disk and keep the path or hash.
- Do not ignore errors from `COMMIT`; handle `SQLITE_BUSY` and `SQLITE_FULL`.

## Gotchas

- Foreign keys are not enforced unless `PRAGMA foreign_keys = ON` is set per connection.
- `ALTER TABLE` in SQLite is limited. Changing a column type or constraint needs the create-new, copy, drop-old, rename sequence inside a transaction.
- SQLite types are flexible; add `CHECK (typeof(col) = 'integer')` or use `STRICT` tables where needed.
- "Database is locked" usually means two writers or a long open transaction. Keep transactions short, use WAL and `busy_timeout`, and never hold a transaction across `.await` or a network call.
- WAL creates `-wal` and `-shm` files; a backup that copies only the `.db` file can be incomplete.
- `LIKE` is case-insensitive only for ASCII and cannot use a normal index with a leading wildcard; use FTS5 for full-text search over messages.
- Autoincrement ids reused after deletion can confuse sync; use `AUTOINCREMENT` or UUIDs if ids must never repeat.
- Time zones: store UTC and format at display time.
- Deleting a conversation must delete its messages (`ON DELETE CASCADE`) and any files it referenced.
- An app downgrade cannot run old code on a newer schema; refuse to open a database with a higher `user_version` than the app knows.

## Report format

State the schema, access layer, file location, migration approach and current version, and the checks run (migration from old versions, integrity check, concurrency test). List findings by severity (data loss, injection, plaintext secret, locking, missing index, style), each with location and fix. Say what was not tested.

Read `references/sqlite-reference.md` for the schema, pragma, migration, backup, and Tauri snippets and sources.
