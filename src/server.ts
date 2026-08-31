import 'dotenv/config';
import express from 'express';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { Store } from './core/store.js';
import { ToolRegistry, registerBuiltIns } from './core/tools.js';
import { Agent, StubLLM } from './core/agent.js';
import { EventBus } from './core/events.js';

const port = Number(process.env.PORT ?? 8787);
const dbPath = process.env.DATABASE_PATH ?? './data/jarvis.sqlite';
mkdirSync(dbPath.substring(0, Math.max(0, dbPath.lastIndexOf('/'))) || '.', {recursive:true});
const store = new Store(dbPath);
const roots = (process.env.ALLOWED_FILESYSTEM_ROOTS ?? './workspace').split(',').map(s=>s.trim()).filter(Boolean);
const tools = new ToolRegistry(store, roots);
registerBuiltIns(tools);
const agent = new Agent(store, tools, new StubLLM(), {
  assistantName: process.env.ASSISTANT_NAME ?? 'Aegis', personalityMode:'professional-aide', verbosity:'balanced', humorLevel:.15, proactivityLevel:.4,
  confirmationPolicy:'confirm-high-risk', timezone:process.env.TZ ?? 'UTC', privacyMode:false
});
const bus = new EventBus();
const app = express();
app.use(express.json({limit:'2mb'}));

app.get('/api/assistant/status', async (_req,res)=>res.json({status:'ONLINE',services:{database:true,llm:await new StubLLM().healthCheck(),tools:tools.list().length}}));
app.get('/api/tools', (_req,res)=>res.json({tools:tools.list()}));
app.post('/api/assistant/message', async (req,res,next)=>{
  try {
    const body=z.object({userId:z.string().min(1),conversationId:z.string().min(1),message:z.string().min(1).max(20000)}).parse(req.body);
    const result=await agent.handle(body.userId,body.conversationId,body.message);
    await bus.emit({type:'USER_MESSAGE_RECEIVED',source:'api',timestamp:new Date().toISOString(),content:{conversationId:body.conversationId}});
    res.json(result);
  } catch(err) { next(err); }
});
app.post('/api/tools/execute', async (req,res,next)=>{
  try {
    const body=z.object({userId:z.string().min(1),tool:z.string().min(1),input:z.unknown(),confirmed:z.boolean().default(false),conversationId:z.string().optional()}).parse(req.body);
    const result=await tools.execute(body.tool,body.input,{userId:body.userId,conversationId:body.conversationId,requestId:randomUUID()},body.confirmed);
    res.json({ok:true,result});
  } catch(err) { next(err); }
});
app.get('/api/memory', (req,res)=>{ const userId=String(req.query.userId??''); const q=String(req.query.q??''); if(!userId||!q)return res.status(400).json({error:'userId and q are required'}); res.json({memories:store.searchMemories(userId,q)}); });
app.post('/api/memory', (req,res,next)=>{try { const b=z.object({userId:z.string(),type:z.enum(['profile','fact','episodic','task','preference','project','procedural']),scope:z.enum(['global','user','project','conversation','temporary']),content:z.string().min(1),importance:z.number().min(0).max(1).default(.5),confidence:z.number().min(0).max(1).default(1),metadata:z.record(z.string(),z.unknown()).optional()}).parse(req.body); store.addMemory({id:randomUUID(),...b}); res.status(201).json({ok:true}); } catch(e){next(e);}});
app.use((err:any,_req:any,res:any,_next:any)=>res.status(400).json({error:err?.message??'Request failed'}));

const server=app.listen(port,()=>console.log(`JARVIS assistant API listening on :${port}`));
process.on('SIGINT',()=>{server.close();store.close();process.exit(0)});
process.on('SIGTERM',()=>{server.close();store.close();process.exit(0)});
