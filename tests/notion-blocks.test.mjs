import test from 'node:test';
import assert from 'node:assert/strict';
import {downloadImage,mediaURL,renderNotionPage,richText} from '../scripts/notion-blocks.mjs';
const id='a'.repeat(32),child='b'.repeat(32);
const rt=t=>[{type:'text',plain_text:t}];
test('rich text formatting escapes HTML and rejects executable links or mentions',()=>{
 assert.equal(richText([{plain_text:'<img>',annotations:{bold:true}}]),'<strong>&lt;img&gt;</strong>');
 assert.throws(()=>richText([{plain_text:'bad',href:'javascript:alert(1)'}]));
 assert.throws(()=>richText([{type:'mention',plain_text:'private page'}]));
});
test('image destinations restrict SSRF, protocols and credentials',()=>{
 for(const url of ['http://file.notion.so/a','https://127.0.0.1/a','https://file.notion.so.attacker.com/a','https://user:pass@file.notion.so/a'])assert.throws(()=>mediaURL(url));
 assert.equal(mediaURL('https://file.notion.so/image?a=secret').hostname,'file.notion.so');
});
test('temporary image is downloaded locally with no API token or signed URL in HTML path',async()=>{
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jYxkAAAAASUVORK5CYII=','base64');
 const assets=new Map();let calls=0;
 const fetcher=async(url,opts)=>{calls++;assert.equal(opts.headers,undefined);return new Response(png,{headers:{'content-type':'image/png'}});};
 const path=await downloadImage('https://file.notion.so/a?signature=temporary',assets,fetcher);
 assert.match(path,/^\/assets\/notion\/[a-f0-9]{64}\.png$/);assert.equal(assets.size,1);assert.ok(!path.includes('signature'));
 assert.equal(await downloadImage('https://file.notion.so/b',assets,fetcher),path);assert.equal(assets.size,1);assert.equal(calls,2);
 await assert.rejects(downloadImage('https://file.notion.so/x',new Map(),async()=>new Response('<svg/>',{headers:{'content-type':'image/svg+xml'}})));
 await assert.rejects(downloadImage('https://file.notion.so/x',new Map(),async()=>new Response('',{status:302,headers:{location:'http://127.0.0.1'}})));
});
test('block pagination, nested lists, headings and image ordering are preserved',async()=>{
 const assets=new Map();let top=0;
 const fetcher=async(url,opts)=>{
  if(url.startsWith('https://shinhyo-daycare.pages.dev/'))return new Response(Buffer.from([255,216,255,0]),{headers:{'content-type':'image/jpeg'}});
  assert.equal(opts.headers.Authorization,'Bearer secret');
  if(url.includes(child))return Response.json({results:[{type:'paragraph',paragraph:{rich_text:rt('nested')}}],has_more:false});
  top++;return Response.json(top===1?{results:[{type:'heading_1',heading_1:{rich_text:rt('Title')}},{id:child,type:'bulleted_list_item',has_children:true,bulleted_list_item:{rich_text:rt('List')}}],has_more:true,next_cursor:'next'}:{results:[{type:'image',image:{external:{url:'https://shinhyo-daycare.pages.dev/photo-class.jpg'},caption:rt('Photo <caption>')}}],has_more:false});
 };
 const html=await renderNotionPage(id,'secret',assets,fetcher);
 assert.ok(html.startsWith('<h2>Title</h2><ul><li>List<p>nested</p></li></ul><figure'));
 assert.ok(html.includes('Photo &lt;caption&gt;'));assert.equal(top,2);assert.equal(assets.size,1);assert.ok(!html.includes('Bearer'));
});
test('unsupported embed and API failure abort publishing',async()=>{
 await assert.rejects(renderNotionPage(id,'secret',new Map(),async()=>Response.json({results:[{type:'embed',embed:{url:'https://example.com'}}],has_more:false})),/Unsupported/);
 await assert.rejects(renderNotionPage(id,'secret',new Map(),async()=>new Response('',{status:401})),/401/);
});
