const hook=process.env.CLOUDFLARE_DEPLOY_HOOK;
if(!hook)throw Error('CLOUDFLARE_DEPLOY_HOOK secret is required');
const url=new URL(hook);
if(url.origin!=='https://api.cloudflare.com'||!url.pathname.startsWith('/client/v4/pages/webhooks/deploy_hooks/'))throw Error('Unexpected deploy hook URL');
const r=await fetch(url,{method:'POST',signal:AbortSignal.timeout(30000),redirect:'error'});
if(!r.ok)throw Error(`Deploy trigger failed (${r.status})`);
const result=await r.json();
if(result.success!==true)throw Error('Cloudflare did not accept deployment');
console.log('Deploy request accepted; check Cloudflare deployment status.');
