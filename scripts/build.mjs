import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import {programs,escapeHTML as e,queryNotion,normalize} from './content.mjs';
import {renderNotionPage} from './notion-blocks.mjs';
const root=new URL('../',import.meta.url),out=new URL('dist/',root);
let source=await readFile(new URL('site/index.html',root),'utf8');
const base='https://shinhyo-daycare.pages.dev';
const config=['NOTION_TOKEN','NOTION_PROGRAMS_DATA_SOURCE_ID','NOTION_NEWS_DATA_SOURCE_ID'].map(k=>process.env[k]);
let updates=[],news=[];const assets=new Map();
if(config.some(Boolean)) {
 if(!config.every(Boolean))throw Error('All three Notion variables are required');
 updates=(await queryNotion(config[1],config[0])).map(x=>normalize(x,'programs')).filter(Boolean);
 news=(await queryNotion(config[2],config[0])).map(x=>normalize(x,'news')).filter(Boolean);
 if(new Set(updates.map(x=>x.slug)).size!==updates.length)throw Error('Duplicate program Slug');
 for(const item of [...updates,...news]){
  item.html=await renderNotionPage(item.id,config[0],assets);
  if(!item.html&&!item.body)throw Error('Published page needs page content or legacy Body');
 }
 news.sort((a,b)=>b.date.localeCompare(a.date)||a.slug.localeCompare(b.slug));
}
// Read and validate everything before replacing local build output. Failed builds never deploy.
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});await cp(new URL('site/',root),out,{recursive:true});
for(const [path,bytes] of assets){const target=new URL(path,out);await mkdir(new URL('.',target),{recursive:true});await writeFile(target,bytes);}
const head=source.slice(0,source.indexOf('</head>')).replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g,'').replace(/<script defer src="kakao-map.js"><\/script>/,'');
const header=source.slice(source.indexOf('<a class="skip"'),source.indexOf('<main id="main">')).replaceAll('href="#','href="/#').replace('href="./"','href="/"').replace('href="/#main"','href="#main"');
const footer=source.slice(source.indexOf('<footer'),source.indexOf('</body>'));
const paragraphs=t=>t.split(/\n+/).filter(Boolean).map(t=>`<p>${e(t)}</p>`).join('');
const urls=['/','/news/'];
async function page(path,title,summary,body) {
 let h=head.replace(/<title>.*?<\/title>/,`<title>${e(title)} | 신효데이케어센터</title>`).replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${e(summary)}">`).replace(/<link rel="canonical"[^>]*>/,`<link rel="canonical" href="${base}${path}">`).replace(/<meta property="og:title"[^>]*>/,`<meta property="og:title" content="${e(title)}">`).replace(/<meta property="og:description"[^>]*>/,`<meta property="og:description" content="${e(summary)}">`).replace(/<meta property="og:url"[^>]*>/,`<meta property="og:url" content="${base}${path}">`);
 h=h.replace(/<meta name="twitter:title"[^>]*>/,`<meta name="twitter:title" content="${e(title)}">`).replace(/<meta name="twitter:description"[^>]*>/,`<meta name="twitter:description" content="${e(summary)}">`);
 // Root-relative assets allow directory pages to share the original branding.
 h=h.replace(/(src|href)="(styles.css|script.js|logo.png)"/g,'$1="/$2"');
 const schema=JSON.stringify({'@context':'https://schema.org','@type':'WebPage',name:title,description:summary,url:base+path,isPartOf:{'@type':'WebSite',url:base}}).replaceAll('<','\\u003c');
 const html=`${h}<script type="application/ld+json">${schema}</script></head><body>${header.replace('src="logo.png"','src="/logo.png"')}<main id="main" class="wrap section detail"><p><a href="/">홈</a> / ${e(title)}</p><p class="eyebrow">신효데이케어센터</p><h1>${e(title)}</h1><p class="lead">${e(summary)}</p>${body}<div class="actions"><a class="button" href="tel:024864578">전화 상담 02-486-4578</a><a class="text-link" href="/#contact">이용·방문 상담 안내 →</a></div></main>${footer}</body></html>`;
 const dir=new URL('.'+path,out);await mkdir(dir,{recursive:true});await writeFile(new URL('index.html',dir),html);
}
for(const p of programs) {
 const u=updates.find(x=>x.slug===p.slug);const path=`/programs/${p.slug}/`;urls.push(path);
 const body=(u?.html||(`<figure class="detail-photo"><img src="/${p.image}" alt="${e(p.alt)}" width="1448" height="1086"><figcaption>기존 홈페이지에 게시된 센터 사진</figcaption></figure>`+(u?paragraphs(u.body):p.sections.map(([title,text])=>`<section><h2>${e(title)}</h2><p>${e(text)}</p></section>`).join(''))))+'<p class="caption">구체적인 일정·횟수·개별 지원 범위는 센터 상담에서 확인해 주세요.</p><p><a href="/programs/cognition/">인지 프로그램</a> · <a href="/programs/movement/">신체·운동 프로그램</a> · <a href="/programs/care/">맞춤형 돌봄</a></p>';
 await page(path,u?.title||p.title,u?.summary||p.summary,body);
}
const list=news.map(n=>`<article><p>${e(n.date)}</p><h2><a href="/news/${n.slug}/">${e(n.title)}</a></h2><p>${e(n.summary)}</p></article>`).join('');
await page('/news/','센터 소식','신효데이케어센터의 공지와 활동 소식을 확인하세요.',list||'<p>등록된 센터 소식이 없습니다. 활동 사진은 <a href="/#programs">프로그램 소개</a>에서 확인해 주세요.</p>');
for(const n of news){const path=`/news/${n.slug}/`;urls.push(path);await page(path,n.title,n.summary,`<p><time datetime="${e(n.date)}">${e(n.date)}</time></p>${n.html||paragraphs(n.body)}<p><a href="/news/">센터 소식 목록 →</a></p>`);}
const links=`<div class="detail-links">${programs.map(p=>`<a class="button secondary" href="/programs/${p.slug}/">${p.title} 자세히 보기 →</a>`).join('')}</div>`;
if(!source.includes('<!-- program-details -->'))source=source.replace('<div class="program-photo-grid">',`<!-- program-details -->${links}\n<div class="program-photo-grid">`);
const newsBlock=`<!-- center-news -->${news.length ? `<section id="news" class="wrap section"><p class="eyebrow">센터 소식</p><h2>센터의 새 소식</h2>${list}<a class="text-link" href="/news/">센터 소식 전체 보기 →</a></section>` : ''}<!-- /center-news -->`;
source=source.includes('<!-- center-news -->')?source.replace(/<!-- center-news -->[\s\S]*?<!-- \/center-news -->/,newsBlock):source.replace('<section id="faq"',newsBlock+'\n<section id="faq"');
await writeFile(new URL('index.html',out),source);
await writeFile(new URL('sitemap.xml',out),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(p=>`<url><loc>${base}${p}</loc></url>`).join('')}</urlset>`);
console.log(`Built ${urls.length} pages; ${config.every(Boolean)?'Notion enabled':'local content only'}`);
