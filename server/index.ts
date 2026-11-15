import Fastify from 'fastify';
import statics from '@fastify/static';
import { mkdir, readdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scenarioSchema, demoScenario, type Run } from '../shared/schema.js';
import { execute, newRun } from './runner.js';
import { validateTarget } from './security.js';
import { htmlReport } from './report.js';
// Demo is copied into the production output by TypeScript.
import { demoPage } from '../demo/page.js';
const production=process.argv[1].replaceAll('\\','/').includes('/dist/');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot=production?path.dirname(root):root;
const data=path.resolve(process.env.LINKSUNDER_DATA||path.join(projectRoot,'data'));
await mkdir(data,{recursive:true});
const app=Fastify({logger:false,bodyLimit:150000});
const port=Number(process.env.PORT||4317);const origin=`http://127.0.0.1:${port}`;
const runs=new Map<string,Run>();let active: AbortController|undefined;
for(const file of (await readdir(data)).filter(x=>/^[a-f0-9-]+\.json$/.test(x))) { try {const r=JSON.parse(await readFile(path.join(data,file),'utf8')) as Run;if(r.status==='running'){r.status='error';r.error='Interrupted by server shutdown.';}runs.set(r.id,r);} catch { /* Ignore damaged historical files. */ } }
app.addHook('onRequest',async(req,reply)=>{
  if(req.headers.host!==new URL(origin).host) return reply.code(403).send({error:'Invalid host.'});
  if(req.headers.origin && req.headers.origin!==origin) return reply.code(403).send({error:'Cross-origin requests are blocked.'});
  reply.header('X-Content-Type-Options','nosniff');reply.header('Referrer-Policy','no-referrer');
  if(req.url.startsWith('/api/')) { reply.header('Cache-Control','no-store'); if(!['GET','HEAD'].includes(req.method)&&req.headers['x-linksunder']!=='local') return reply.code(403).send({error:'Use the local dashboard.'}); }
});
async function persist(run: Run) {const dest=path.join(data,run.id+'.json');await writeFile(dest+'.tmp',JSON.stringify(run));await rename(dest+'.tmp',dest);await writeFile(path.join(data,run.id+'.html'),htmlReport(run));}
async function start(raw: unknown) {
  if(active) throw Object.assign(new Error('Another run is active. Cancel it or wait.'),{statusCode:409});
  const parsed=scenarioSchema.safeParse(raw);if(!parsed.success) throw Object.assign(new Error('Invalid scenario: '+parsed.error.issues.map(i=>i.path.join('.')+' '+i.message).join('; ')),{statusCode:400});
  await validateTarget(parsed.data.url,parsed.data.externalConsent);
  const run=newRun(parsed.data);runs.set(run.id,run);const controller=new AbortController();active=controller;
  void execute(parsed.data,run,controller.signal).catch(()=>{run.status=controller.signal.aborted?'cancelled':'error';run.error='Chromium could not start. Run npm run setup.';}).finally(async()=>{try{await persist(run);}catch{run.status='error';run.error='Report could not be saved. Check disk permissions.';}finally{active=undefined;}});
  return run;
}
app.get('/api/runs',async()=>[...runs.values()].reverse().map(r=>({...r,screenshots:[]})));
app.get<{Params:{id:string}}>('/api/runs/:id',async(req,reply)=>runs.get(req.params.id)||reply.code(404).send({error:'Run not found.'}));
app.post('/api/runs',async(req,reply)=>{try{return await start(req.body);}catch(e){return reply.code((e as {statusCode?:number}).statusCode||400).send({error:(e as Error).message});}});
app.post('/api/cancel',async()=>{active?.abort();return {ok:true};});
app.post('/api/demo',async(_req,reply)=>{
  if(active)return reply.code(409).send({error:'Another run is active.'});
  const first=await start(demoScenario(origin,'broken'));return {id:first.id,next:demoScenario(origin,'fixed')};
});
app.get<{Params:{id:string;format:string}}>('/api/reports/:id/:format',async(req,reply)=>{
  const run=runs.get(req.params.id);if(!run)return reply.code(404).send({error:'Run not found.'});
  if(!['json','html'].includes(req.params.format))return reply.code(400).send({error:'Choose json or html.'});
  reply.header('Content-Disposition',`attachment; filename="linksunder-${run.id}.${req.params.format}"`);
  return req.params.format==='html'?reply.type('text/html').send(htmlReport(run)):reply.type('application/json').send(JSON.stringify(run,null,2));
});
app.get<{Params:{mode:string}}>('/demo/:mode',async(req,reply)=>reply.type('text/html').send(demoPage(req.params.mode==='broken'?'broken':'fixed')));
app.post('/demo/api/messages',async()=>({saved:true}));
if(production) {await app.register(statics,{root:path.join(root,'client')});}
else {
  const {createServer}=await import('vite');
  const vite=await createServer({configFile:path.join(root,'vite.config.ts'),server:{middlewareMode:true},appType:'spa'});
  app.setNotFoundHandler(async(req,reply)=>{
    const pathname=req.url.split('?')[0];
    if(pathname!=='/' && !pathname.includes('.') && !pathname.startsWith('/@')) return reply.code(404).send({error:'Route not found.'});
    reply.hijack();vite.middlewares(req.raw,reply.raw,()=>{reply.raw.statusCode=404;reply.raw.end();});
  });
  app.addHook('onClose',async()=>{await vite.close();});
}
app.addHook('onClose',async()=>{active?.abort();});
for(const sig of ['SIGINT','SIGTERM'] as const)process.on(sig,()=>{void app.close().then(()=>process.exit(0));});
await app.listen({host:'127.0.0.1',port});console.log(`LinkSunder ready: ${origin}`);
