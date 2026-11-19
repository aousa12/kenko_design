const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:512,height:512}});
await p.goto('file://'+process.cwd()+'/icon.html');await p.waitForTimeout(300);
const el=await p.$('#i');await el.screenshot({path:'icon-512.png'});
for(const s of [192,180]){const q=await b.newPage({viewport:{width:s,height:s}});await q.setContent('<body style="margin:0"><img src="file://'+process.cwd()+'/icon-512.png" style="width:'+s+'px;height:'+s+'px">');await q.goto('file://'+process.cwd()+'/icon-512.png');await q.screenshot({path:'icon-'+s+'.png',clip:{x:0,y:0,width:s,height:s}});}
await b.close();})();
