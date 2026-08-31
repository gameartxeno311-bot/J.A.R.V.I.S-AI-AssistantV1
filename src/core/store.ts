import Database from 'better-sqlite3';
import type { MemoryScope, MemoryType } from './types.js';

export class Store {
  private db: Database.Database;
  constructor(path: string) {
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS memories (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL, scope TEXT NOT NULL, content TEXT NOT NULL, importance REAL NOT NULL, confidence REAL NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, metadata TEXT);
      CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL, status TEXT NOT NULL, due_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS automations (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, description TEXT NOT NULL, trigger_json TEXT NOT NULL, action_json TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, request_id TEXT, user_id TEXT, action TEXT NOT NULL, risk_level TEXT, success INTEGER NOT NULL, details TEXT, created_at TEXT NOT NULL);
    `);
  }
  ensureConversation(conversationId: string, userId: string) {
    const existing = this.db.prepare('SELECT user_id FROM conversations WHERE id = ?').get(conversationId) as {user_id:string} | undefined;
    if (existing && existing.user_id !== userId) throw new Error('Conversation belongs to another user');
    if (!existing) {
      const now = new Date().toISOString();
      this.db.prepare('INSERT INTO conversations (id,user_id,created_at,updated_at) VALUES (?,?,?,?,?)').run(conversationId,userId,now,now);
    }
  }
  addMessage(id: string, conversationId: string, role: string, content: string) {
    const now = new Date().toISOString();
    this.db.prepare('INSERT INTO messages VALUES (?, ?, ?, ?, ?)').run(id, conversationId, role, content, now);
    this.db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, conversationId);
  }
  getMessages(conversationId: string, userId: string, limit = 20) {
    return this.db.prepare('SELECT m.role, m.content, m.created_at FROM messages m JOIN conversations c ON c.id = m.conversation_id WHERE m.conversation_id = ? AND c.user_id = ? ORDER BY m.created_at DESC LIMIT ?').all(conversationId, userId, limit).reverse() as Array<{role:string;content:string;created_at:string}>;
  }
  addMemory(m: {id:string; userId:string; type:MemoryType; scope:MemoryScope; content:string; importance:number; confidence:number; metadata?:Record<string,unknown>}) {
    const now = new Date().toISOString();
    this.db.prepare('INSERT INTO memories VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(m.id,m.userId,m.type,m.scope,m.content,m.importance,m.confidence,now,now,JSON.stringify(m.metadata ?? {}));
  }
  searchMemories(userId: string, query: string, limit = 8) {
    const tokens = query.toLowerCase().split(/\W+/).filter(Boolean).slice(0, 8);
    if (!tokens.length) return [];
    const rows = this.db.prepare('SELECT * FROM memories WHERE user_id = ? ORDER BY importance DESC, updated_at DESC LIMIT 100').all(userId) as Array<any>;
    return rows.filter(r => tokens.some(t => String(r.content).toLowerCase().includes(t))).slice(0, limit);
  }
  audit(entry: {id:string;requestId:string;userId:string;action:string;riskLevel:string;success:boolean;details?:unknown}) {
    this.db.prepare('INSERT INTO audit_logs VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(entry.id,entry.requestId,entry.userId,entry.action,entry.riskLevel,entry.success?1:0,JSON.stringify(entry.details ?? {}),new Date().toISOString());
  }
  close() { this.db.close(); }
}
