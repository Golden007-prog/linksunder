import { spawnSync } from 'node:child_process';
import process from 'node:process';
import console from 'node:console';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';
const local=process.env.LINKSUNDER_BROWSER || (process.platform==='win32'&&['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync));
if(local && existsSync(local)) {const b=await chromium.launch({executablePath:local,headless:true});await b.close();console.log('Ready: verified local Chromium-compatible browser.');}
else {const r=spawnSync(process.execPath,['node_modules/playwright/cli.js','install','chromium'],{stdio:'inherit'});process.exitCode=r.status||0;}
