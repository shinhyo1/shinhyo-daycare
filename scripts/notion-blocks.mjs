import {createHash} from 'node:crypto';
import {escapeHTML as e} from './content.mjs';

const mediaHosts=new Set(['shinhyo-daycare.pages.dev','file.notion.so','prod-files-secure.s3.us-west-2.amazonaws.com','s3.us-west-2.amazonaws.com','secure.notion-static.com']);
export function mediaURL(value){
 let u;try{u=new URL(value);}catch{throw Error('Invalid image URL');}
 if(u.protocol!=='https:'||u.username||u.password||u.port||!mediaHosts.has(u.hostname))throw Error('Upload images to Notion or use the official website image URL');
 return u;
}
export function richText(parts=[]){
 return parts.map(p=>{
  // Mentions can contain private page or person names. Require explicit public text instead.
  if(p.type && p.type!=='text')throw Error('Replace Notion mentions/equations with public plain text');
  let s=e(p.plain_text??p.text?.content??'');const a=p.annotations||{};
  if(a.code)s=`<code>${s}</code>`;if(a.bold)s=`<strong>${s}</strong>`;if(a.italic)s=`<em>${s}</em>`;if(a.strikethrough)s=`<s>${s}</s>`;if(a.underline)s=`<u>${s}</u>`;
  const href=p.href||p.text?.link?.url;
  if(href){let u;try{u=new URL(href);}catch{throw Error('Invalid text link');}if(!['https:','http:','tel:','mailto:'].includes(u.protocol)||u.username||u.password)throw Error('Unsafe text link');s=`<a href="${e(u.href)}" rel="noopener noreferrer">${s}</a>`;}
  return s;
 }).join('');
}
export async function downloadImage(value,assets,fetcher=fetch){
 let url=mediaURL(value),r;
 for(let i=0;i<5;i++){
  // Never send the Notion API Authorization header to media hosts.
  r=await fetcher(url.href,{redirect:'manual',signal:AbortSignal.timeout(30000)});
  if([301,302,303,307,308].includes(r.status)){const next=r.headers.get('location');if(!next)throw Error('Image redirect missing location');url=mediaURL(new URL(next,url).href);continue;}
  break;
 }
 if(!r?.ok)throw Error('Image download failed');
 const max=12*1024*1024;const length=Number(r.headers.get('content-length'));if(length>max)throw Error('Image exceeds 12 MB');
 const chunks=[];let total=0;
 if(!r.body)throw Error('Empty image response');
 for await(const chunk of r.body){total+=chunk.length;if(total>max)throw Error('Image exceeds 12 MB');chunks.push(Buffer.from(chunk));}
 const bytes=Buffer.concat(chunks);const type=(r.headers.get('content-type')||'').split(';')[0].toLowerCase();
 const formats=[['image/jpeg','jpg',b=>b[0]===255&&b[1]===216&&b[2]===255],['image/png','png',b=>b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))],['image/gif','gif',b=>['GIF87a','GIF89a'].includes(b.subarray(0,6).toString())],['image/webp','webp',b=>b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP']];
 const f=formats.find(([mime,,valid])=>mime===type&&valid(bytes));if(!f)throw Error('Only JPEG, PNG, GIF and WebP images are supported');
 const path=`assets/notion/${createHash('sha256').update(bytes).digest('hex')}.${f[1]}`;
 if(!assets.has(path)){if(assets.size>=100||[...assets.values()].reduce((s,b)=>s+b.length,0)+bytes.length>100*1024*1024)throw Error('Image build limit exceeded');assets.set(path,bytes);}
 return '/'+path;
}
export async function renderNotionPage(id,token,assets,fetcher=fetch){
 let count=0;
 async function children(parent,depth=0){
  if(depth>8)throw Error('Notion content is nested too deeply');
  if(!/^[a-f0-9-]{32,36}$/i.test(parent))throw Error('Invalid Notion block ID');
  const blocks=[];let cursor;
  for(let page=0;page<100;page++){
   const url=new URL(`https://api.notion.com/v1/blocks/${parent}/children`);url.searchParams.set('page_size','100');if(cursor)url.searchParams.set('start_cursor',cursor);
   let r;
   for(let attempt=0;attempt<4;attempt++){
    r=await fetcher(url.href,{headers:{Authorization:`Bearer ${token}`,'Notion-Version':'2025-09-03'},signal:AbortSignal.timeout(30000)});
    if(r.ok||(r.status!==429&&r.status<500))break;
    await new Promise(resolve=>setTimeout(resolve,1000*2**attempt));
   }
   if(!r.ok)throw Error(`Notion block request failed (${r.status})`);
   const data=await r.json();blocks.push(...data.results);count+=data.results.length;if(count>1000)throw Error('Notion page exceeds 1000 blocks');
   if(!data.has_more)break;if(!data.next_cursor||page===99)throw Error('Invalid Notion block pagination');cursor=data.next_cursor;
  }
  let html='',list='';
  const close=()=>{if(list){html+=`</${list}>`;list='';}};
  for(const b of blocks){
   if(b.archived||b.in_trash)continue;
   const t=b.type,v=b[t]||{};let content=richText(v.rich_text||[]);
   const isList=t==='bulleted_list_item'||t==='numbered_list_item';
   if(!isList)close();
   if(isList){const tag=t==='bulleted_list_item'?'ul':'ol';if(list!==tag){close();html+=`<${tag}>`;list=tag;}html+=`<li>${content}${b.has_children?await children(b.id,depth+1):''}</li>`;continue;}
   if(t==='image'){
    const src=await downloadImage(v.file?.url||v.external?.url,assets,fetcher);const caption=(v.caption||[]).map(x=>x.plain_text??x.text?.content??'').join('');
    html+=`<figure class="detail-photo"><img src="${src}" alt="${e(caption||'센터 활동 사진')}" loading="lazy" decoding="async">${caption?`<figcaption>${e(caption)}</figcaption>`:''}</figure>`;
   }else if(t==='divider')html+='<hr>';
   else if(['paragraph','heading_1','heading_2','heading_3','quote','callout','toggle','column_list','column'].includes(t)){
    const inner=b.has_children?await children(b.id,depth+1):'';
    if(t==='paragraph')html+=(content?`<p>${content}</p>`:'')+inner;
    else if(t.startsWith('heading_')){const n=Math.min(4,Number(t.at(-1))+1);html+=`<h${n}>${content}</h${n}>${inner}`;}
    else if(t==='quote'||t==='callout')html+=`<blockquote>${content}${inner}</blockquote>`;
    else if(t==='toggle')html+=`<details><summary>${content}</summary>${inner}</details>`;
    else html+=inner;
   }else throw Error(`Unsupported public Notion block: ${t}. Use text, headings, lists and images.`);
  }
  close();return html;
 }
 return children(id);
}
