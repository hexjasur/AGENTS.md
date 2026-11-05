# SQLite reference

Load this after `SKILL.md` when implementing or reviewing local storage. Verify crate and plugin APIs against current documentation.

## Connection pragmas

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;   -- safe with WAL; use FULL if you cannot lose the last commit
PRAGMA busy_timeout = 5000;
```

- Run these when each connection opens. `journal_mode = WAL` persists in the file; the others do not.

## Example schema (chat app)

```sql
CREATE TABLE conversations (
  id          INTEGER PRIMARY KEY,
  title       TEXT NOT NULL,
  created_at  TEXT NOT NULL,           -- UTC ISO 8601
  updated_at  TEXT NOT NULL
) STRICT;

CREATE TABLE messages (
  id              INTEGER PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
  content         TEXT NOT NULL,
  created_at      TEXT NOT NULL
) STRICT;

CREATE INDEX idx_messages_conversation ON messages(conversation_id, id);

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
) STRICT;
```

- `STRICT` tables need SQLite 3.37 or later; check the version your driver bundles.
- Keep secrets out of `settings`.

## Migrations

```text
migrations/
  0001_init.sql
  0002_add_message_tokens.sql
  0003_add_fts.sql
```

```rust
// rusqlite sketch: apply pending migrations in order, each in a transaction
fn migrate(conn: &mut rusqlite::Connection, migrations: &[&str]) -> rusqlite::Result<()> {
    let current: usize = conn.query_row("PRAGMA user_version", [], |r| r.get(0))?;
    if current > migrations.len() {
        return Err(rusqlite::Error::InvalidQuery); // database is newer than this app
    }
    for (i, sql) in migrations.iter().enumerate().skip(current) {
        let tx = conn.transaction()?;
        tx.execute_batch(sql)?;
        tx.pragma_update(None, "user_version", i + 1)?;
        tx.commit()?;
    }
    Ok(())
}
```

- `sqlx` offers `sqlx::migrate!()` with checksums; `refinery` and `rusqlite_migration` are alternatives.
- Back up the file before applying migrations, and keep the last known-good copy until the app starts cleanly.
- Table rebuild pattern: `CREATE TABLE new...; INSERT INTO new SELECT ... FROM old; DROP TABLE old; ALTER TABLE new RENAME TO old;` inside one transaction, with foreign keys handled as the SQLite docs describe.

## Parameterized queries

```rust
conn.execute(
    "INSERT INTO messages (conversation_id, role, content, created_at) VALUES (?1, ?2, ?3, ?4)",
    rusqlite::params![conversation_id, role, content, now_utc],
)?;
```

- Never format values into the SQL string. For dynamic sort columns, map a user choice to a fixed allowlisted identifier.
- Wrap "insert conversation and first message" in one transaction.

## Full-text search

```sql
CREATE VIRTUAL TABLE messages_fts USING fts5(content, content='messages', content_rowid='id');
-- keep in sync with triggers on insert, update, and delete
SELECT rowid FROM messages_fts WHERE messages_fts MATCH ?1 ORDER BY rank LIMIT 20;
```

- Sanitize the user's search text into FTS query syntax, or quote it as a phrase.

## Backup and export

```sql
VACUUM INTO '/path/to/backup.db';
```

- `VACUUM INTO` writes a consistent copy; the rusqlite `backup` module copies incrementally while the app runs.
- Export for users as JSON (conversations with messages) with a version field so it can be re-imported later.
- On "delete all data", close connections, delete the `.db`, `-wal`, and `-shm` files, and clear related files and keychain entries.

## Tauri placement

- Resolve the path with the app handle (`app_data_dir`) and create the folder on first run.
- Keep the connection in managed state (`app.manage(...)`) behind a mutex or a pool; do not open a connection per call.
- Expose narrow commands (`list_conversations`, `add_message`), not raw SQL, and grant `tauri-plugin-sql` permissions only if you use it from the frontend.
- Run blocking database work with `spawn_blocking` when using a synchronous driver inside async commands. See `rust-best-practices` and `tauri-best-practices`.

## Testing

- Use an in-memory database (`:memory:`) or a temp file per test.
- Fixture databases for each released schema version; assert row counts and key values after migrating.
- Test `ON DELETE CASCADE`, unique constraints, and rollback on a failing step.
- Run `PRAGMA integrity_check;` and `PRAGMA foreign_key_check;` after migrations in tests.

## Sources

- SQLite documentation: https://www.sqlite.org/docs.html
- SQLite WAL mode: https://www.sqlite.org/wal.html
- SQLite ALTER TABLE and the rebuild procedure: https://www.sqlite.org/lang_altertable.html
- SQLite FTS5: https://www.sqlite.org/fts5.html
- rusqlite: https://docs.rs/rusqlite/
- sqlx: https://docs.rs/sqlx/
- Tauri SQL plugin: https://v2.tauri.app/plugin/sql/
