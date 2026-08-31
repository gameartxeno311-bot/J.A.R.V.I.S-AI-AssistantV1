import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Store } from '../src/core/store.js';
import { ToolRegistry, registerBuiltIns } from '../src/core/tools.js';

describe('JARVIS core safety', () => {
  let dir:string; let store:Store; let tools:ToolRegistry;
  beforeEach(()=>{dir=mkdtempSync(path.join(tmpdir(),'jarvis-')); mkdirSync(path.join(dir,'workspace')); store=new Store(path.join(dir,'db.sqlite')); tools=new ToolRegistry(store,[path.join(dir,'workspace')]); registerBuiltIns(tools);});
  afterEach(()=>{store.close(); rmSync(dir,{recursive:true,force:true});});
  it('rejects filesystem traversal', async()=>{await expect(tools.execute('filesystem.list_files',{path:path.join(dir,'workspace','..')},{userId:'u',requestId:'r'})).rejects.toThrow(/outside/);});
  it('requires confirmation for deletion', async()=>{await expect(tools.execute('filesystem.delete_file',{path:path.join(dir,'workspace','x')},{userId:'u',requestId:'r'})).rejects.toThrow(/Confirmation/);});
  it('stores and retrieves relevant memory',()=>{store.addMemory({id:'m',userId:'u',type:'project',scope:'project',content:'Ashfall Genesis project',importance:.9,confidence:1}); expect(store.searchMemories('u','Ashfall Genesis')).toHaveLength(1);});
});
