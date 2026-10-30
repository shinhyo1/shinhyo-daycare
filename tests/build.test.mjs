import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
test('offline build preserves assets and all internal page links resolve',()=>{
 const env={...process.env};for(const k of ['NOTION_TOKEN','NOTION_PROGRAMS_DATA_SOURCE_ID','NOTION_NEWS_DATA_SOURCE_ID'])delete env[k];
 execFileSync(process.execPath,['scripts/build.mjs'],{env});
 const walk=p=>readdirSync(p,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(join(p,x.name)):[join(p,x.name)]);
 const files=walk('dist');
 for(const f of files.filter(f=>f.endsWith('.html')&&!f.endsWith('404.html'))){
  const html=readFileSync(f,'utf8');
  for(const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)){
   const url=match[1];if(/^(https?:|tel:|mailto:|data:)/.test(url))continue;
   const path=url.split(/[?#]/)[0];if(!path)continue;
   const local=path.startsWith('/')?resolve('dist','.'+path):resolve(f,'..',path);
   assert.ok(existsSync(local),`${f}: ${url}`);
  }
 }
 const main=readFileSync('dist/index.html','utf8');assert.equal((main.match(/<!-- program-details -->/g)||[]).length,1);assert.equal((main.match(/<!-- center-news -->/g)||[]).length,1);
 for(const slug of ['cognition','movement','care']){const h=readFileSync(`dist/programs/${slug}/index.html`,'utf8');assert.ok(h.includes(`href="https://shinhyo-daycare.pages.dev/programs/${slug}/"`));assert.ok(h.includes('href="/"'));}
});
test('mock Notion build escapes public text and never emits token; unpublish removes news',()=>{
 const env={...process.env,NOTION_TOKEN:'test-only-secret-123',NOTION_PROGRAMS_DATA_SOURCE_ID:'a'.repeat(32),NOTION_NEWS_DATA_SOURCE_ID:'b'.repeat(32)};
 const fixture=`const rich=t=>[{plain_text:t}];globalThis.fetch=async url=>({ok:true,json:async()=>({has_more:false,results:url.includes('${'b'.repeat(32)}')?[{id:'${'c'.repeat(32)}',properties:{Published:{checkbox:true},Name:{title:rich('테스트 소식')},Summary:{rich_text:rich('테스트 요약')},Body:{rich_text:rich('<script>alert(1)</script>')},Date:{date:{start:'2026-10-30'}}}}]:[]})});await import('./scripts/build.mjs');`;
 try {
  execFileSync(process.execPath,['--input-type=module','-e',fixture],{env});
  const html=readFileSync(`dist/news/${'c'.repeat(32)}/index.html`,'utf8');
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));assert.ok(!html.includes(env.NOTION_TOKEN));
  assert.ok(readFileSync('dist/index.html','utf8').includes('테스트 소식'));
 } finally {
  for(const k of ['NOTION_TOKEN','NOTION_PROGRAMS_DATA_SOURCE_ID','NOTION_NEWS_DATA_SOURCE_ID'])delete env[k];
  execFileSync(process.execPath,['scripts/build.mjs'],{env});
 }
 assert.equal(existsSync(`dist/news/${'c'.repeat(32)}/index.html`),false);
});
