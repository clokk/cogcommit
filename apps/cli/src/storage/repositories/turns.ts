/**
 * Turns Repository
 */

import type Database from "better-sqlite3";
import type { Turn } from "../../models/types";
import type { TurnRow, RepositoryContext, SearchResult } from "./types";

export class TurnsRepository {
  private db: Database.Database;

  constructor(context: RepositoryContext) {
    this.db = context.db;
  }

  /**
   * Insert a turn
   */
  insert(turn: Turn, sessionId: string): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO turns
      (id, session_id, role, content, timestamp, tool_calls, triggers_visual, model)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      turn.id,
      sessionId,
      turn.role,
      turn.content,
      turn.timestamp,
      turn.toolCalls ? JSON.stringify(turn.toolCalls) : null,
      turn.triggersVisualUpdate ? 1 : 0,
      turn.model || null
    );
  }

  /**
   * Get turns for a session
   */
  getForSession(sessionId: string): Turn[] {
    const rows = this.db
      .prepare("SELECT * FROM turns WHERE session_id = ? ORDER BY timestamp")
      .all(sessionId) as TurnRow[];

    return rows.map((row) => this.rowToTurn(row));
  }

  /**
   * Upsert a turn (for pull sync)
   */
  upsert(
    sessionId: string,
    turn: {
      id: string;
      role: string;
      content: string | null;
      timestamp: string;
      toolCalls?: unknown;
      triggersVisual?: boolean;
      model?: string | null;
    }
  ): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO turns
      (id, session_id, role, content, timestamp, tool_calls, triggers_visual, model)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      turn.id,
      sessionId,
      turn.role,
      turn.content,
      turn.timestamp,
      turn.toolCalls ? JSON.stringify(turn.toolCalls) : null,
      turn.triggersVisual ? 1 : 0,
      turn.model || null
    );
  }

  /**
   * Search turns by content
   */
  search(
    query: string,
    options: { project?: string; limit?: number } = {}
  ): SearchResult[] {
    const limit = options.limit || 20;

    let sql = `
      SELECT
        t.id, t.role, t.content, t.timestamp,
        s.id as session_id,
        c.id as commit_id, c.project_name
      FROM turns t
      JOIN sessions s ON t.session_id = s.id
      JOIN cognitive_commits c ON s.commit_id = c.id
      WHERE t.content LIKE ?
    `;

    const params: (string | number)[] = [`%${query}%`];

    if (options.project) {
      sql += " AND c.project_name = ?";
      params.push(options.project);
    }

    sql += " ORDER BY t.timestamp DESC LIMIT ?";
    params.push(limit);

    return this.db.prepare(sql).all(...params) as SearchResult[];
  }

  private rowToTurn(row: TurnRow): Turn {
    return {
      id: row.id,
      role: row.role as "user" | "assistant",
      content: row.content || "",
      timestamp: row.timestamp,
      model: row.model || undefined,
      toolCalls: row.tool_calls ? JSON.parse(row.tool_calls) : undefined,
      triggersVisualUpdate: row.triggers_visual === 1 ? true : undefined,
    };
  }
}
