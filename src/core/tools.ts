import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { ToolContext, ToolDefinition } from './types.js';
import { Store } from './store.js';

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition<any, any>>();
  constructor(private readonly store: Store, private readonly roots: string[]) {}
  register<T, R>(tool: ToolDefinition<T, R>) { this.tools.set(tool.name, tool); }
  get(name: string) { return this.tools.get(name); }
  list() { return [...this.tools.values()].map(t => ({name:t.name,description:t.description,riskLevel:t.riskLevel,requiresConfirmation:t.requiresConfirmation})); }
  async execute(name: string, input: unknown, context: ToolContext, confirmed = false) {
    const tool = this.tools.get(name);
    if (!tool) { this.auditFailure(context, name, 'UNKNOWN_TOOL', input, 'CRITICAL'); throw new Error(`Unknown tool: ${name}`); }
    if (tool.requiresConfirmation && !confirmed) { this.auditFailure(context, name, 'CONFIRMATION_REQUIRED', input, tool.riskLevel); throw new Error(`Confirmation required for ${name}`); }
    let parsed: any;
    try { parsed = tool.validate(input); } catch (err) { this.auditFailure(context, name, 'VALIDATION_FAILED', input, tool.riskLevel); throw err; }
    try {
      const result = await Promise.race([tool.execute(parsed, context), new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Tool timeout')), tool.timeoutMs))]);
      this.store.audit({id:randomUUID(),requestId:context.requestId,userId:context.userId,action:name,riskLevel:tool.riskLevel,success:true,details:{input:parsed}});
      return result;
    } catch (err) {
      this.auditFailure(context, name, err instanceof Error ? err.message : 'TOOL_FAILED', parsed, tool.riskLevel);
      throw err;
    }
  }
  private auditFailure(context: ToolContext, action: string, reason: string, input: unknown, riskLevel: string) {
    try { this.store.audit({id:randomUUID(),requestId:context.requestId,userId:context.userId,action,riskLevel,success:false,details:{reason,input}}); } catch { /* preserve original error */ }
  }
  allowedPath(candidate: string) {
    const resolved = path.resolve(candidate);
    return this.roots.some(root => { const r=path.resolve(root); return resolved === r || resolved.startsWith(r + path.sep); });
  }
  async assertAllowedRealPath(candidate: string, allowMissing = false) {
    const resolved = path.resolve(candidate);
    if (!this.allowedPath(resolved)) throw new Error('Path is outside the allowed filesystem roots');
    const roots = await Promise.all(this.roots.map(root => fs.realpath(root).catch(() => path.resolve(root))));
    let target: string;
    try {
      target = await fs.realpath(resolved);
    } catch (err) {
      if (!allowMissing || (err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      let current = path.dirname(resolved);
      while (current !== path.dirname(current)) {
        try { target = await fs.realpath(current); break; }
        catch (parentErr) {
          if ((parentErr as NodeJS.ErrnoException).code !== 'ENOENT') throw parentErr;
          current = path.dirname(current);
        }
      }
      if (!target!) target = await fs.realpath(current);
    }
    if (!roots.some(root => target === root || target.startsWith(root + path.sep))) throw new Error('Path is outside the allowed filesystem roots');
  }
}

export function registerBuiltIns(registry: ToolRegistry) {
  registry.register({ name:'system.health', description:'Return basic assistant service health.', riskLevel:'LOW', requiresConfirmation:false, timeoutMs:2000, validate:z.object({}).parse, execute:async()=>({ok:true,timestamp:new Date().toISOString()}) });
  registry.register({ name:'filesystem.list_files', description:'List files in an explicitly allowlisted workspace directory.', riskLevel:'LOW', requiresConfirmation:false, timeoutMs:5000, validate:z.object({path:z.string().min(1)}).parse, execute:async(input)=>{await registry.assertAllowedRealPath(input.path);return fs.readdir(input.path,{withFileTypes:true}).then(es=>es.map(e=>({name:e.name,type:e.isDirectory()?'directory':'file'})));} });
  registry.register({ name:'filesystem.create_file', description:'Create a text file inside an allowlisted workspace.', riskLevel:'MEDIUM', requiresConfirmation:false, timeoutMs:5000, validate:z.object({path:z.string().min(1),content:z.string()}).parse, execute:async(input)=>{await registry.assertAllowedRealPath(input.path,true);await fs.mkdir(path.dirname(input.path),{recursive:true});await fs.writeFile(input.path,input.content,{encoding:'utf8',flag:'wx'});return {created:true,path:path.resolve(input.path)};} });
  registry.register({ name:'filesystem.delete_file', description:'Permanently delete a file. Confirmation is always required.', riskLevel:'HIGH', requiresConfirmation:true, timeoutMs:5000, validate:z.object({path:z.string().min(1)}).parse, execute:async(input)=>{await registry.assertAllowedRealPath(input.path);await fs.unlink(input.path);return {deleted:true,path:path.resolve(input.path)};} });
}
