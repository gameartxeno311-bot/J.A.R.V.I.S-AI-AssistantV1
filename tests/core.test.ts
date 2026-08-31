import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Store } from '../src/core/store.js';
import { ToolRegistry, registerBuiltIns } from '../src/core/tools.js';

describe('JARVIS core safety', () => {
  let dir:string; let store:Store; let tools:ToolRegistry;
  beforeEach(()=>{dir=mkdtempSync(path.join(tmpdir(),'jarvis-')); mkdirSync(path.join(dir,'workspace')); store=new Store(path.join(dir,'db.sqlite')); tools=new ToolRegistry(store,[path.join(dir,'workspace')]); registerBuiltIns(tools);});
  afterEach(()=>{store.close(); rmSync(dir,{recursive:true,force:true});});

  it('rejects filesystem traversal', async()=>{await expect(tools.execute('filesystem.list_files',{path:path.join(dir,'workspace','..')},{userId:'u',requestId:'r'})).rejects.toThrow(/outside/);});
  it('rejects symlink escapes from the workspace', async()=>{const outside=path.join(dir,'outside'); mkdirSync(outside); writeFileSync(path.join(outside,'secret.txt'),'secret'); symlinkSync(outside,path.join(dir,'workspace','link'),'dir'); await expect(tools.execute('filesystem.list_files',{path:path.join(dir,'workspace','link')},{userId:'u',requestId:'r'})).rejects.toThrow(/outside/);});
  it('requires confirmation for deletion', async()=>{await expect(tools.execute('filesystem.delete_file',{path:path.join(dir,'workspace','x')},{userId:'u',requestId:'r'})).rejects.toThrow(/Confirmation/);});
  it('stores and retrieves relevant memory',()=>{store.addMemory({id:'m',userId:'u',type:'project',scope:'project',content:'Ashfall Genesis project',importance:.9,confidence:1}); expect(store.searchMemories('u','Ashfall Genesis')).toHaveLength(1); expect(store.searchMemories('u','!!!')).toHaveLength(0);});
  it('isolates conversations by user',()=>{store.ensureConversation('c1','alice'); store.addMessage('m1','c1','user','private'); expect(store.getMessages('c1','bob')).toHaveLength(0); expect(()=>store.ensureConversation('c1','bob')).toThrow(/another user/); expect(store.getMessages('c1','alice')).toHaveLength(1);});
  it('allows nested file creation under an existing workspace', async()=>{const file=path.join(dir,'workspace','nested','note.txt'); await expect(tools.execute('filesystem.create_file',{path:file,content:'hello'},{userId:'u',requestId:'r'})).resolves.toMatchObject({created:true});});
});
