(function(){
'use strict';
var VERSION='v7';
var APP_NAME='__APP_NAME__';
try{document.title=APP_NAME;}catch(e){}
var ICONS=__ICONS__;
var VIEW=/[#?&]view\b/.test((location.hash||'')+(location.search||''));
var TOTAL=8;
var CATS={
  exercise:{label:'運動',color:'#DF5844'},
  meal:{label:'食事',color:'#488D64'},
  sleep:{label:'睡眠',color:'#0D8FC3'},
  other:{label:'その他',color:'#9B4EAA'}
};
var CAT_KEYS=['exercise','meal','sleep','other'];
var DT={free:'余裕がある日',tight:'余裕がない日'};
var HINTS=[
 {k:'minimum',t:'最低ライン',d:'これだけならできる、というものはある？',done:'これだけならできる、というところまで減らした'},
 {k:'time',t:'時間帯',d:'いつだったらできそう？',done:'やる時間を変えた'},
 {k:'cut',t:'削るもの',d:'何かを減らしたら、楽になる？',done:'何かを減らして、楽にした'},
 {k:'rule',t:'ルール化',d:'〇〇する時に△△する、と決める',done:'〇〇する時に△△する、と決めてやった'},
 {k:'refresh',t:'気分転換',d:'新しいことに挑戦する',done:'新しいことに挑戦した'}
];
var FHINTS=[
 {k:'stretch',t:'伸ばすもの',d:'量や時間を増やしてみる？'},
 {k:'newmove',t:'新しい一手',d:'もう一つ新しいことを足すとしたら？'},
 {k:'curve',t:'変化球',d:'いつもと違う場所や、やり方でやってみる？'},
 {k:'together',t:'誰かと一緒に',d:'誰かと一緒にやってみる？'},
 {k:'otherday',t:'違う日に広げる',d:'__OTHERDAY__'}
];
var REASONS=[
 {k:'load',t:'負荷',d:'やることの大変さ'},
 {k:'condition',t:'体調',d:'その日の自分の体調が良くなかった'},
 {k:'mood',t:'気分',d:'やる気や楽しさ'},
 {k:'time',t:'時間',d:'時間が足りなかった'}
];
var HINT_CARDS=[
 {c:'exercise',t:'最近、人から聞いて気になった、健康に関することで試してみたいことは？'},
 {c:'meal',t:'AIに、自分がやった方が良い健康行動を聞いてみる？'},
 {c:'sleep',t:'最近の健康の悩みは？'},
 {c:'other',t:'インターネットで調べてみる？'}
];
var TUT=[
 {c:'exercise',y:237,t:'これは、今日行いたい健康行動を<br>考えて、選んで、実践する<br><em>健康デザインツールです</em>。'},
 {c:'meal',y:226,t:'毎日、今日取り組みたい<br><em>健康行動を選びます</em>。'},
 {c:'other',y:235,t:'カードを<em>新しく追加</em>したり、<br><em>書き換え</em>たりすることもできます。'},
 {c:'sleep',y:243,t:'その日のおわりに、<br>今日取り組んだカードについて<br><em>記録をとります</em>。'},
 {c:'exercise',y:226,t:'今日の様子を踏まえて、明日以降に<br>取り組む、<em>また新しいカード</em>を<br>作成することもできます。'},
 {c:'meal',y:226,t:'まずは、カードを作ってみましょう。'}
];
var DEMO=[
 {title:'夕方に10分歩く',category:'exercise',dayType:'tight',source:'友人のすすめ'},
 {title:'朝にヨーグルトを食べる',category:'meal',dayType:'tight',source:''},
 {title:'23時に布団に入る',category:'sleep',dayType:'free',source:''},
 {title:'水をコップ1杯飲む',category:'other',dayType:'tight',source:''},
 {title:'ジムで30分運動する',category:'exercise',dayType:'free',source:''}
];

/* ---------- storage ---------- */
var KEY='kenko.v1.data';
function blank(){return {user:null,cards:[],logs:[],todays:{},events:[],dayOffset:0,flags:{}};}
function load(){
  if(VIEW)return blank();
  try{var r=localStorage.getItem(KEY);if(r){var o=JSON.parse(r);var b=blank();for(var k in b){if(o[k]!==undefined)b[k]=o[k];}
    if(o.today&&o.today.dayNo&&!b.todays[o.today.dayNo])b.todays[o.today.dayNo]=o.today;return b;}}catch(e){}
  return blank();
}
var S=load();
var storageOk=true;
(function(){try{localStorage.setItem('kenko.v1.t','1');if(localStorage.getItem('kenko.v1.t')!=='1')storageOk=false;localStorage.removeItem('kenko.v1.t');}catch(e){storageOk=false;}})();
function save(){if(VIEW)return;try{if(S.user){S.flags=S.flags||{};S.flags.lastDay=realNo();}localStorage.setItem(KEY,JSON.stringify(S));}catch(e){storageOk=false;}}
function makeCode(){
  var j=JSON.stringify({v:2,d:S});
  return 'K2:'+btoa(unescape(encodeURIComponent(j))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function parseCode(t){
  t=String(t||'');
  try{t=t.normalize('NFKC');}catch(e){}
  t=t.replace(/\s+/g,'');
  var m=t.match(/k2:/i);
  if(!m)throw new Error('prefix');
  t=t.slice(m.index+3).replace(/-/g,'+').replace(/_/g,'/');
  while(t.length%4)t+='=';
  var j=decodeURIComponent(escape(atob(t)));
  var o=JSON.parse(j);if(!o||!o.d||!Array.isArray(o.d.cards))throw new Error('data');
  var b=blank();for(var q in b){if(o.d[q]!==undefined)b[q]=o.d[q];}
  return b;
}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
function p2(n){return (n<10?'0':'')+n;}
function dateKey(d){d=d||new Date();var t=new Date(d.getTime()-4*3600e3);return t.getFullYear()+'-'+p2(t.getMonth()+1)+'-'+p2(t.getDate());}

/* ---------- days ---------- */
var screen='welcome',stack=[],ui={},dir='fwd',draft=blankDraft();
function startDate(){return (S.user&&S.user.startDate)||dateKey();}
function realNo(){
  if(VIEW)return ui.vreal||1;
  if(!S.user)return 1;
  var a=Date.parse(startDate()+'T00:00:00Z'),b=Date.parse(dateKey()+'T00:00:00Z');
  var n=Math.round((b-a)/864e5)+1+(S.dayOffset||0);
  return Math.min(TOTAL,Math.max(1,n));
}
function viewNo(){
  if(VIEW)return ui.vday||1;
  return Math.min(TOTAL,Math.max(1,realNo()+(ui.off||0)));
}
function dayDate(dn){
  var t=Date.parse(startDate()+'T00:00:00Z')+(dn-1)*864e5,d=new Date(t);
  return {key:d.getUTCFullYear()+'-'+p2(d.getUTCMonth()+1)+'-'+p2(d.getUTCDate()),md:(d.getUTCMonth()+1)+'/'+d.getUTCDate(),w:'日月火水木金土'.charAt(d.getUTCDay())};
}
function mdw(dn){var x=dayDate(dn);return x.md+'('+x.w+')';}
function fmtKey(k){var p=k.split('-');var d=new Date(Date.UTC(+p[0],+p[1]-1,+p[2]));return (+p[1])+'/'+(+p[2])+'('+'日月火水木金土'.charAt(d.getUTCDay())+')';}
function peek(dn){return (S.todays&&S.todays[dn])||{dayNo:dn,dayType:null,selected:[],logged:[],rested:false};}
function ent(dn){
  S.todays=S.todays||{};
  if(!S.todays[dn]){S.todays[dn]={date:dayDate(dn).key,dayNo:dn,dayType:null,selected:[],logged:[],rested:false};save();}
  return S.todays[dn];
}
function ev(type,payload,cardId){
  var e={ts:new Date().toISOString(),dayNo:realNo(),type:type};
  if(cardId)e.cardId=cardId;
  if(payload!==undefined)e.payload=payload;
  S.events.push(e);if(S.events.length>400)S.events.splice(0,S.events.length-400);save();
}
function cardById(id){for(var i=0;i<S.cards.length;i++)if(S.cards[i].id===id)return S.cards[i];return null;}
function liveCards(){return S.cards.filter(function(c){return !c.trashed;});}
function trashedCards(){return S.cards.filter(function(c){return c.trashed;}).sort(function(a,b){return (b.trashedAt||0)-(a.trashedAt||0);});}
function lastLog(id){var m=null;S.logs.forEach(function(l){if(l.cardId===id&&(!m||l.savedAt>m.savedAt))m=l;});return m;}
function logFor(id,dn){var m=null;S.logs.forEach(function(l){if(l.cardId===id&&l.dayNo===dn&&(!m||l.savedAt>m.savedAt))m=l;});return m;}
function isFit(id){var l=lastLog(id);return !!(l&&l.fit==='yes');}
function sortedCards(want){
  var used=[],unused=[];
  liveCards().forEach(function(c){var l=lastLog(c.id);(l?used:unused).push({c:c,u:l?l.savedAt:0});});
  used.sort(function(a,b){return b.u-a.u;});
  unused.sort(function(a,b){return b.c.createdAt-a.c.createdAt;});
  var all=used.concat(unused).map(function(x){return x.c;});
  if(!want)return all;
  var a1=[],b1=[];all.forEach(function(c){(c.dayType===want?a1:b1).push(c);});
  return a1.concat(b1);
}
function allLogged(e){return e.selected.length>0&&e.selected.every(function(id){return e.logged.indexOf(id)>=0;});}

/* ---------- helpers ---------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function img(key,scale,alt){var i=ICONS[key];if(!i)return '';scale=scale||1;return '<img src="'+i.s+'" width="'+(i.w*scale).toFixed(1)+'" height="'+(i.h*scale).toFixed(1)+'" alt="'+(alt||'')+'" draggable="false">';}
var CHEV='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5B5870" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4 L7 12 L15 20"/></svg>';
var CHEVR='<svg width="20" height="26" viewBox="0 0 20 26" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3 L16 13 L5 23"/></svg>';
var TICKW='<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 8.5 L6.5 12.5 L13.5 4"/></svg>';
var CHK='<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5 L6.5 12 L13 4"/></svg>';
var PLUS='<svg width="22" height="22" viewBox="0 0 22 22" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M11 3 V19 M3 11 H19"/></svg>';
var PLUSO='<svg width="20" height="20" viewBox="0 0 22 22" stroke="#E55C00" stroke-width="2.6" stroke-linecap="round"><path d="M11 3 V19 M3 11 H19"/></svg>';
var ARROW='<svg width="20" height="16" viewBox="0 0 20 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8 H17 M11 2 L17 8 L11 14"/></svg>';
var BULB='<svg width="22" height="24" viewBox="0 0 22 24" fill="none" stroke="#5B5870" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 C7 14 3 13 3 9 A8 8 0 0 1 19 9 C19 13 15 14 15 17 Z M8.5 20.5 H13.5"/></svg>';
var MOON='<svg width="40" height="40" viewBox="0 0 40 40" style="flex:none"><path d="M27 7a14 14 0 1 0 8 22A12 12 0 0 1 27 7Z" fill="#FFD65F"/><path d="M12 8l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#1040B0"/></svg>';
function spark(w,fill){return '<svg width="'+w+'" height="'+w+'" viewBox="-100 -100 200 200" aria-hidden="true"><path d="M0 -100 C12 -46 46 -12 100 0 C46 12 12 46 0 100 C-12 46 -46 12 -100 0 C-46 -12 -12 -46 0 -100Z" fill="'+(fill||'#FBE34D')+'"/></svg>';}
var SPK=[[34,'top:-22px','right:-17px',2.6,0],[23,'top:88px','left:-17px',3.0,.9],[19,'bottom:30px','right:-12px',2.4,1.6],[14,'top:-11px','left:20px',2.8,.5],[13,'bottom:-10px','left:36px',3.2,1.3],[12,'top:124px','right:-10px',2.2,2.0]];
function sparks(i){return SPK.map(function(s){var pos=s[1]+';'+s[2];if(i%2){pos=pos.replace('left','@').replace('right','left').replace('@','right');}
  return '<span class="sp" style="'+pos+';animation-duration:'+s[3]+'s;animation-delay:'+(s[4]+i*0.37).toFixed(2)+'s">'+spark(s[0])+'</span>';}).join('');}
function nav(right){return '<div class="nav"><button class="back" data-a="back" aria-label="もどる">'+CHEV+'</button><span class="navr">'+(right||'')+'</span></div>';}
function btn(label,a,opts){opts=opts||{};return '<button class="btn'+(opts.off?' off':'')+(opts.cls?' '+opts.cls:'')+'" data-a="'+a+'"'+(opts.id?' id="'+opts.id+'"':'')+(opts.v?' data-v="'+esc(opts.v)+'"':'')+'>'+label+'</button>';}
function cardHTML(c,o){
  o=o||{};
  var fit=isFit(c.id);
  var sel=o.sel?(' sel r'+(o.idx%2)):'';
  return '<div class="cardwrap'+(o.sel?' sel':'')+'" style="--d:'+(((o.n||0)*0.7)%2.4).toFixed(1)+'s"><button class="card cat-'+c.category+sel+(fit?' isfit':'')+'" data-a="'+(o.a||'open-card')+'" data-id="'+c.id+'">'+
    '<div class="hd">'+CATS[c.category].label+'</div>'+(fit?'<span class="mark">'+spark(20)+'</span>':'')+
    '<div class="bd"><div class="ico">'+img('category_'+c.category)+'</div><div class="ttl">'+esc(c.title)+'</div><div class="tg"><span class="tag">'+DT[c.dayType]+'</span></div></div>'+
    '<span class="shine"></span></button>'+(fit?sparks(o.n||0):'')+'<span class="chk">'+TICKW.replace('width="16" height="16"','width="17" height="17"')+'</span></div>';
}
function toast(msg){
  var l=document.getElementById('layer');var t=document.createElement('div');t.className='toast';t.textContent=msg;l.appendChild(t);
  setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},2300);
}
function reduced(){try{return window.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}}
function blankDraft(extra){var d={title:'',cat:null,dayType:null,source:'',note:null,parentId:null,hint:null,reasonText:''};if(extra)for(var k in extra)d[k]=extra[k];return d;}
function go(name){stack.push(screen);screen=name;dir='fwd';render(true);}
function back(){var p=stack.pop()||'home';screen=p;dir='bk';render(true);}
function reset(name){stack=[];screen=name;dir='fwd';render(true);}
function popTo(name){var i=stack.lastIndexOf(name);if(i<0)return false;stack.length=i+1;back();return true;}
function wordOf(dn){var rn=realNo();return dn===rn?'今日':dn===rn+1?'明日':dn===rn-1?'昨日':dn+'日目';}

/* ---------- screens ---------- */
var V={};

V.welcome=function(){
  var xs=[8,22,38,52,66,80,14,30,46,60,74,88,5,70];
  var n=xs.length,rain='';
  for(var i=0;i<n;i++){
    var k=CAT_KEYS[i%4],dur=9+((i*7)%6),delay=-((i*1.9)%dur);
    rain+='<span style="display:contents"><img src="'+ICONS['category_'+k].s+'" width="'+ICONS['category_'+k].w+'" height="'+ICONS['category_'+k].h+'" alt="" style="left:'+xs[i]+'%;--r0:'+((i*37)%50-25)+'deg;--r1:'+((i*53)%90-45)+'deg;--y:'+((i*61)%700+40)+'px;animation-duration:'+dur+'s;animation-delay:'+delay+'s"></span>';
  }
  return '<div class="rain'+(reduced()?' static-rain':'')+'" aria-hidden="true">'+rain+'</div>'+
  '<div class="welcome-in"><h1 data-a="dbg-tap">こんにちは</h1><p class="sub">ニックネームを入力してください</p>'+
  '<div style="height:36px"></div><label class="lbl" for="f-nick" style="margin-bottom:6px">ニックネーム</label>'+
  '<input id="f-nick" class="field" data-bind="nick" maxlength="20" placeholder="例:あおい" value="'+esc(ui.nick||'')+'" autocomplete="off">'+
  '<p class="note">本名でなくてかまいません。</p><button class="link" style="margin:26px 0 0;text-align:left;font-size:13px;padding-left:4px" data-a="restore-open">前の記録のコードで、続きから始める</button></div>'+
  '<div class="foot">'+btn('はじめる','welcome-start',{id:'primary',off:!(ui.nick||'').trim()})+'</div>';
};
V.tutorial=function(){
  var i=ui.tut||0,t=TUT[i],last=i===TUT.length-1,tilt=(i%2?3.5:-3.5),col=CATS[t.c].color;
  var R=34,C=2*Math.PI*R,off=0;
  var ring='<svg class="ring" width="84" height="84" viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="'+R+'" fill="none" stroke="#E7E1DA" stroke-width="4"/><circle cx="42" cy="42" r="'+R+'" fill="none" stroke="#E55C00" stroke-width="4" stroke-linecap="round" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'" transform="rotate(-90 42 42)"/></svg>';
  var bot=last?'<div class="tlast">'+btn(ui.tutReplay?'とじる':'カードをつくる','tut-done')+'</div>'
    :'<div class="tbot"><button class="tnext" data-a="tut-next" aria-label="次へ">'+ring+'<span class="dot">'+ARROW+'</span></button><p class="thint">タップして次へ</p></div>';
  return '<div class="tut" data-a="tut-next"><div class="ttop"><button class="back" data-a="tut-prev" aria-label="もどる">'+CHEV+'</button><span class="tcnt">'+(i+1)+' / '+TUT.length+'</span><button class="skip" data-a="tut-done">'+(ui.tutReplay?'とじる':'スキップ')+'</button></div>'+
   '<h1 class="ttl">'+t.t+'</h1>'+
   '<div class="tvis"><div class="tbk" style="top:'+(t.y+12)+'px;background:'+col+';transform:rotate('+(-tilt*1.7).toFixed(1)+'deg)"></div><div class="tc" style="top:'+t.y+'px;transform:rotate('+tilt+'deg)"><img src="tutorial/'+(i+1)+'.webp" alt="" draggable="false"><span class="fade"></span></div></div>'+bot+'</div>';
};
V.welcome.valid=function(){return !!(ui.nick||'').trim();};

function formPanel(){
  var cats=CAT_KEYS.map(function(k){return '<button class="chip '+k+(draft.cat===k?' on':'')+'" data-a="cat" data-v="'+k+'">'+CATS[k].label+'</button>';}).join('');
  var dts=['free','tight'].map(function(k){return '<button class="chip'+(draft.dayType===k?' on':'')+'" data-a="dt" data-v="'+k+'">'+DT[k]+'</button>';}).join('');
  return '<div class="panel">'+
   '<label class="lbl" for="f-title">やること</label><input id="f-title" class="field" data-bind="title" maxlength="40" placeholder="例:寝る前にストレッチをする" value="'+esc(draft.title)+'" autocomplete="off">'+
   '<div class="lbl">カテゴリ</div><div class="chips4">'+cats+'</div>'+
   '<div class="lbl">どんな日に向いている？</div><div class="opts2">'+dts+'</div>'+
   '<label class="lbl" for="f-src">どこで知った？ <span class="badge">任意</span></label><input id="f-src" class="field" style="border-color:var(--bd2)" data-bind="source" maxlength="60" placeholder="空のままでもOK" value="'+esc(draft.source)+'" autocomplete="off">'+
  '</div>';
}
function formValid(){return !!(draft.title.trim()&&draft.cat&&draft.dayType);}
var HINTLINK='<button class="link" style="margin-top:18px;display:flex;gap:8px;align-items:center;justify-content:center" data-a="hint-open">'+BULB+'思いつかない時は、ヒントを見る</button>';

V.setup=function(){
  var live=liveCards(),n=live.length,slots='';
  for(var i=0;i<5;i++){var c=live[i];slots+=c?'<button class="slot f cat-'+c.category+(ui.slot===i?' on':'')+'" data-a="slot" data-v="'+i+'" style="--c1:'+CATS[c.category].color+'" aria-label="作ったカード'+(i+1)+'"></button>':'<span class="slot"></span>';}
  var info='';
  if(ui.slot!=null&&live[ui.slot]){var cc=live[ui.slot];info='<div class="slotinfo"><b>'+esc(cc.title)+'</b><br>'+CATS[cc.category].label+' ・ '+DT[cc.dayType]+(cc.source?' ・ '+esc(cc.source):'')+'</div>';}
  var tk=dateKey(),sd=startDate();
  var sdText=(sd===tk?'今日 ':'')+fmtKey(sd)+' が 1日目';
  var bar='<div class="foot"><div class="stack">'+(n>=5?btn('はじめる','setup-finish',{cls:'sec'}):'')+btn('このカードを追加','add-card',{id:'primary',off:!formValid()})+'</div></div>';
  return nav('初日のじゅんび')+'<h1 class="h22">試してみたいことを、<br>まずはカードにしましょう</h1>'+
   '<div class="sdate"><span><b>'+sdText+'</b><br><span style="color:var(--muted);font-size:12px">1日目は、カードをつくる日です</span></span><label>変える<input type="date" data-bind="start" min="'+tk+'" value="'+sd+'" aria-label="1日目の日付"></label></div>'+
   '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:18px;font-size:13px;font-weight:700"><span>5枚以上つくると、はじめられます</span><span>'+Math.min(n,99)+' / 5</span></div>'+
   '<div class="slots">'+slots+'</div>'+info+'<p class="sub" style="margin:10px 0 18px;line-height:21px;font-size:12px">余裕がある日用と、ない日用。<br>どちらもつくれると安心です。</p>'+
   formPanel()+HINTLINK+bar;
};
V.setup.valid=formValid;

V.create=function(){
  var title=draft.parentId?'形を変えて、<br>新しいカードにしましょう':'試してみたいことを、<br>カードにしてみましょう';
  var note=draft.note?'<p class="sub" style="margin:10px 0 0;font-size:13px;color:var(--ink2)">'+esc(draft.note)+'</p>':'';
  return nav('')+'<h1 class="h22">'+title+'</h1>'+note+'<div style="height:18px"></div>'+formPanel()+HINTLINK+
   '<div class="foot">'+btn('このカードを追加','add-card',{id:'primary',off:!formValid()})+'</div>';
};
V.create.valid=formValid;

V.hint=function(){
  var rows=HINT_CARDS.map(function(h){return '<div class="hintrow">'+img('bulb_'+h.c)+'<span>'+esc(h.t)+'</span></div>';}).join('');
  return nav('')+'<h1 class="h26">思いつかない時の<br>ヒント</h1><p class="sub">考えるきっかけにしてください。</p><div style="height:36px"></div>'+rows+
   '<div class="foot">'+btn('カードをつくりにもどる','back')+'</div>';
};

function tabbar(active){
  var rn=realNo(),e=peek(rn),n=e.selected.length,k=e.selected.filter(function(id){return e.logged.indexOf(id)>=0;}).length;
  var ic=function(key,on){return img(key+(on?'_on':'_off'));};
  return '<nav class="tabbar" aria-label="タブ"><button class="tab'+(active==='home'?' on':'')+'" data-a="tab" data-v="home">'+ic('tab_cards',active==='home')+'カード一覧</button>'+
   '<button class="tab'+(active==='today'?' on':'')+'" data-a="tab" data-v="today">'+ic('tab_cal',active==='today')+'今日やること'+(n?'<span class="bdg">'+k+'/'+n+'</span>':'')+'</button></nav>';
}
function vbar(){
  if(!VIEW)return '';
  return '<div class="vbar"><span>見る専用:'+esc(S.user?S.user.nickname:'')+'さん</span><span style="display:flex;gap:6px"><button data-a="v-csv">CSV</button><button data-a="v-reset">入れ直す</button></span></div>';
}

function bandHTML(tmr){
  return '<button class="band'+(tmr?' tmr':'')+'" data-a="'+(tmr?'ask-tmr':'ask-today')+'"><div class="t">'+(tmr?'明日はどんな日になりそうですか？':'今日はどんな日ですか？')+'</div><div class="s">余裕がある日・ない日を選ぶと、<br>合うカードが先に並びます</div><span class="ch">'+CHEVR+'</span></button>';
}
V.home=function(){
  var rn=realNo(),t=peek(rn),tm=rn<TOTAL?peek(rn+1):null,f=ui.filter||'all';
  var all=sortedCards(t.dayType),list=all.filter(function(c){return f==='all'||c.category===f;});
  var chips='<button class="chip all'+(f==='all'?' on':'')+'" data-a="filter" data-v="all">すべて</button>'+CAT_KEYS.map(function(k){return '<button class="chip '+k+(f===k?' on':'')+'" data-a="filter" data-v="'+k+'">'+CATS[k].label+'</button>';}).join('');
  var band='';
  var started=dateKey()>=startDate()||VIEW;
  var doneToday=t.rested||allLogged(t);
  if(!VIEW){
    if(rn>=2&&!t.dayType&&!t.rested)band=bandHTML(false);
    else if(rn<TOTAL&&started&&(rn===1||doneToday)&&!tm.dayType&&!tm.rested)band=bandHTML(true);
  }
  var warn=(storageOk||VIEW)?'':'<p class="msg" style="background:#FFF0EA;border-radius:16px;padding:12px 14px;color:var(--ink)">この画面では、記録が端末に残らない可能性があります。「ホーム画面に追加」してから使い、記録のバックアップを忘れずに取ってください。</p>';
  var tn=trashedCards().length;
  var grid=list.length?list.map(function(c,i){return cardHTML(c,{n:i});}).join(''):'<div class="empty">'+(all.length?'このカテゴリのカードはまだありません。':'カードがありません。')+'</div>';
  return vbar()+'<div style="height:30px"></div><div class="hello" data-a="dbg-tap">Home</div>'+warn+(band||'<div style="height:6px"></div>')+
   '<div class="shead"><div class="l">手札<span>'+all.length+'枚</span></div><div class="r">'+(t.dayType?DT[t.dayType]+'に合う順':'最近使った順')+'</div></div>'+
   '<div class="chips" style="margin-bottom:14px">'+chips+'</div>'+
   '<div class="legend"><span class="k">'+img('sparkle',0.9)+'光る＝合っていたカード</span><button class="binic" data-a="trash-open" aria-label="ゴミ箱(中に'+tn+'枚)">'+img('trash')+(tn?'<span class="bdg2">'+tn+'</span>':'')+'</button></div>'+
   '<div class="cards">'+grid+'</div>'+
   (VIEW?'':'<button class="fab" data-a="new-card">'+PLUS+'カードを追加</button>')+tabbar('home');
};

V.today=function(){
  var rn=realNo(),vd=viewNo(),e=peek(vd),isToday=vd===rn,isPast=vd<rn,isFut=vd>rn;
  var tomorrow=rn<TOTAL?peek(rn+1):null;
  var head='<div style="height:30px"></div><div class="hello" data-a="dbg-tap">Today</div>'+
   '<div class="dayrow"><button class="dbtn" data-a="day-prev" aria-label="前の日"'+(vd<=1?' disabled':'')+'>'+CHEV+'</button><h1 class="h26" style="margin:0;line-height:34px">'+vd+'日目</h1><button class="dbtn r" data-a="day-next" aria-label="次の日"'+(vd>=TOTAL?' disabled':'')+'>'+CHEV+'</button><span class="dayof dt">'+mdw(vd)+'</span></div>';
  var h='';
  if(!isToday)h+='<div class="notday"><span>'+(VIEW?'この人が最後に開いたのは、'+rn+'日目です。':'今日ではありません。'+(isPast?'これまでの':'これからの')+'様子です。')+'</span>'+(VIEW?'<button data-a="day-today">'+rn+'日目へ</button>':'<button data-a="day-today">今日にもどる</button>')+'</div>';
  var canEdit=isToday&&!VIEW;
  // 昨日の分(睡眠カード)
  if(isToday&&rn>=2){
    var y=peek(rn-1);
    var yl=y.selected.filter(function(id){var c=cardById(id);return c&&c.category==='sleep'&&y.logged.indexOf(id)<0;});
    if(yl.length){
      h+='<div class="sub2">昨日の分(睡眠のカードは、朝に記録できます)</div>'+yl.map(function(id){return trowHTML(cardById(id),y,rn-1,false,true);}).join('');
    }
  }
  // 1日目
  if(vd===1){
    h+='<div class="infobox"><b>1日目は、カードをつくる日です。</b><br>取り組むのは、2日目からです。'+(isToday&&!VIEW?'<br>カードは、ここから足せます。':'')+'</div>';
    if(canEdit)h+='<button class="addrow" style="margin-top:14px" data-a="new-card">'+PLUSO+'カードをつくる</button>';
  }else{
    var n=e.selected.length,k=e.selected.filter(function(id){return e.logged.indexOf(id)>=0;}).length;
    var progH='',ansH='',bodyH='';
    if(n&&!e.rested){
      progH='<div class="prog"><div class="t"><b><em>'+k+'</em>/'+n+' 記録ずみ</b><span>'+(k===n?'この日の分は、終わりです':isFut?'予定です':'寝る前に記録しましょう')+'</span></div><div class="bar">'+e.selected.map(function(id){return '<i class="'+(e.logged.indexOf(id)>=0?'on':'')+'"></i>';}).join('')+'</div></div>';
    }
    // 今日の日(答え)
    if(e.dayType){
      ansH='<div class="sub2">'+(isToday?'今日':vd+'日目')+'の日</div>'+
        '<div class="dayans">'+img('daytype_'+e.dayType)+'<div style="flex:1"><div class="t">'+DT[e.dayType]+'</div><div class="s">'+(isToday?'ホームで選んだ答えです':'選んだ答えです')+'</div></div>'+(canEdit?'<button class="chg" data-a="ask-today">変える</button>':'')+'</div>';
    }else if(canEdit){
      ansH='<button class="dayans ask" style="margin-top:16px" data-a="ask-today"><span><div class="t">今日はどんな日ですか？</div><div class="s">選ぶと、合うカードが先に並びます</div></span>'+CHEVR+'</button>';
    }else{
      ansH='<div class="infobox">この日の「どんな日か」は、まだ選ばれていません。</div>';
    }
    if(e.rested){
      bodyH='<div class="infobox warn" style="margin-top:14px"><b>'+(isToday?'今日':vd+'日目')+'はお休みにしました。</b>'+(canEdit?'<br><button data-a="ask-today">やっぱりカードを選ぶ</button>':'')+'</div>';
    }else if(n){
      bodyH='<div class="sub2">'+(isToday?'今日やること':vd+'日目に選んだカード')+'</div>'+e.selected.map(function(id){return trowHTML(cardById(id),e,vd,isFut,false);}).join('');
    }else if(e.dayType&&canEdit){
      bodyH='<div class="infobox" style="margin-top:14px">まだカードを選んでいません。</div><button class="btn" style="margin-top:14px" data-a="ask-pick">カードを選ぶ</button>';
    }
    h+=progH+ansH+bodyH;
    if(canEdit&&e.dayType&&!e.rested&&n)h+='<button class="addrow" data-a="ask-pick">'+PLUSO+'今日のカードを足す</button>';
  }
  // 明日の分
  if(isToday&&rn<TOTAL&&!VIEW&&dateKey()>=startDate()){
    if(tomorrow.dayType||tomorrow.rested){
      var tsel=tomorrow.selected.map(function(id){var c=cardById(id);return c?'<span>'+img('category_'+c.category)+'</span>':'';}).join('');
      h+='<button class="tmrcard done" data-a="ask-tmr">'+MOON+'<div style="flex:1"><div class="t">'+(tomorrow.rested?'明日はお休みにします':'明日の分:'+tomorrow.selected.length+'枚 選びました')+'</div><div class="s">'+(tomorrow.dayType?'明日は'+DT[tomorrow.dayType]:'')+'</div>'+(tsel?'<div class="mini">'+tsel+'</div>':'')+'</div><span class="chg2">変える</span></button>';
    }else{
      h+='<button class="tmrcard" data-a="ask-tmr">'+MOON+'<div><div class="t">明日の分を選ぶ</div><div class="s">夜のうちに明日のカードを<br>選んでおくこともできます</div></div></button>';
    }
  }
  if(VIEW&&vd>=2){/* 閲覧時は、明日の分の状況も見せる */
    var nx=vd<TOTAL?peek(vd+1):null;
    if(nx&&(nx.dayType||nx.rested)&&!isFut){
      h+='<div class="sub2">この日の夜に選んだ「明日の分」</div><div class="infobox">'+(nx.rested?'明日はお休み':'明日は'+DT[nx.dayType]+' / '+nx.selected.length+'枚')+'</div>';
    }
  }
  if(!VIEW&&isToday){
    if(rn>=4&&!(S.flags&&S.flags.b4)&&rn<TOTAL)h+='<div class="infobox warn"><b>ここまでの記録を、バックアップしましょう。</b><br>万が一の時に備えて、一度だけお願いします。<br><button data-a="backup-open">バックアップをとる</button></div>';
    if(rn===TOTAL)h+='<div class="infobox warn"><b>最終日です。おつかれさまです。</b><br>最後に、記録のバックアップを送ってください。<br><button data-a="finish-open">おわりの画面へ</button></div>';
    h+='<div style="display:flex;gap:22px;justify-content:center;margin-top:26px"><button class="link" style="margin:0;font-size:13px;font-weight:400" data-a="backup-open">記録をバックアップする</button><button class="link" style="margin:0;font-size:13px;font-weight:400" data-a="tut-open">使い方を見る</button></div>';
  }
  return vbar()+head+h+tabbar('today');
};
function trowHTML(c,e,dn,isFut,yest){
  if(!c)return '';
  var logged=e.logged.indexOf(c.id)>=0,lg=logged?logFor(c.id,dn):null,st;
  if(logged&&lg){
    var t='<span class="stt done'+(lg.fit==='no'?' no':'')+'">'+CHK+(lg.fit==='yes'?'合っていた':'合わなかった')+'</span>';
    st=VIEW?t:'<button class="stt done'+(lg.fit==='no'?' no':'')+'" data-a="rec-open" data-id="'+c.id+'" data-d="'+dn+'">'+CHK+(lg.fit==='yes'?'合っていた':'合わなかった')+'</button>';
  }else if(isFut){st='<span class="stt plan">予定</span>';}
  else if(VIEW){st='<span class="stt plan">未記録</span>';}
  else st='<button class="stt todo" data-a="rec-open" data-id="'+c.id+'" data-d="'+dn+'">記録する</button>';
  var tapId='<button class="tx" data-a="open-card" data-id="'+c.id+'" style="text-align:left"><div class="k">'+CATS[c.category].label+'</div><div class="tt">'+esc(c.title)+'</div></button>';
  return '<div class="trow cat-'+c.category+(logged?' isdone':'')+'"><div class="ic">'+img('category_'+c.category)+'</div>'+tapId+st+'</div>';
}

/* day type / pick / adjust */
function isTmr(){return (ui.tgt||realNo())>realNo();}
V.daytype=function(){
  var tmr=isTmr(),tg=ui.tgt||realNo();
  return nav(tmr?'明日('+dayDate(tg).md+')':realNo()+'日目')+'<h1 class="'+(tmr?'h26':'h28')+'">'+(tmr?'明日は<br>どんな日になりそうですか？':'今日は<br>どんな日ですか？')+'</h1><p class="sub" style="margin-top:8px;line-height:24px">'+(tmr?'明日':'今日')+'の余裕に合わせて、<br>取り組むカードを並べます。</p>'+
   '<button class="dtcard" data-a="daytype" data-v="tight"><span class="face">'+img('daytype_tight')+'</span><span><div class="t">余裕がない日</div><div class="d">短い時間や、<br>小さな形でできるものから出します</div></span></button>'+
   '<button class="dtcard" data-a="daytype" data-v="free"><span class="face">'+img('daytype_free')+'</span><span><div class="t">余裕がある日</div><div class="d">じっくり試せるものから出します</div></span></button>';
};
V.pick=function(){
  var tg=ui.tgt||realNo(),e=peek(tg),tmr=isTmr(),sel=e.selected,w=tmr?'明日':'今日';
  var grid=sortedCards(e.dayType).map(function(c,i){var j=sel.indexOf(c.id);return cardHTML(c,{a:'pick-toggle',sel:j>=0,idx:j,n:i});}).join('');
  return nav('<span class="pill-day">'+(DT[e.dayType]||'')+'</span>')+'<h1 class="h24">'+w+'のカードを選ぶ</h1><p class="sub">気になるカードをタップ。いくつでもOKです</p>'+
   '<div class="cards tight">'+grid+'</div><button class="link" style="margin-top:38px" data-a="no-card">'+w+'は取り組めそうなカードがない</button>'+
   '<div class="foot bar"><div class="barrow"><div class="cnt"><div class="a">選んだカード</div><div class="b">'+sel.length+'枚</div></div>'+btn(w+'はこれにする','pick-confirm',{id:'primary',off:!sel.length})+'</div></div>';
};
V.pick.valid=function(){return peek(ui.tgt||realNo()).selected.length>0;};

V.adjust=function(){
  var fit=ui.adjMode==='fit',from=ui.adjFrom||{},list=fit?FHINTS:HINTS,oc=from.cardId?cardById(from.cardId):null;
  var rows=list.map(function(h){
    var on=ui.adj===h.k,d=h.d==='__OTHERDAY__'?((oc&&oc.dayType==='free')?'余裕がない日':'余裕がある日')+'にも、できる形は？':h.d;
    return '<button class="arow opt'+(on?' on':'')+'" data-a="adj-sel" data-v="'+h.k+'"><span class="ic">'+img((fit?'fh_':'hint_')+h.k)+'</span><span><div class="tt">'+h.t+'</div><div class="dd">'+esc(d)+'</div></span></button>';}).join('');
  var sub=fit?'形を変えると、挑戦や発見ができるかもしれません。':'形を変えると、できることがあるかもしれません。';
  var w=isTmr()?'明日':'今日';
  var second=from.type==='pick'?btn(w+'はお休みにする','adj-rest',{cls:'sec'}):btn('今回はつくらない','back',{cls:'sec'});
  return nav('')+'<h1 class="h28" style="margin-top:6px">やり方を変えてみましょう</h1><p class="sub" style="line-height:23px;margin-top:30px">'+sub+'<br>ヒントを選んで、新しいカードを作ってみましょう。</p><div style="height:12px"></div>'+rows+
   '<div class="stack" style="display:flex;flex-direction:column;gap:10px;margin-top:40px">'+btn('この形で新しいカードをつくる','adj-make',{id:'primary',off:!ui.adj})+second+'</div>';
};
V.adjust.valid=function(){return !!ui.adj;};

/* record */
function recDraft(id,rdn){
  ui.rec=ui.rec||{};var key=rdn+':'+id;
  if(!ui.rec[key]){
    var c=cardById(id),old=logFor(id,rdn);
    ui.rec[key]=old?{fit:old.fit,reasons:(old.reasons||[]).slice(),note:old.note||'',actual:old.actualText||'',changed:(old.changedHow||[]).slice(),logId:old.id,planned:old.plannedTitle||(c?c.title:'')}
      :{fit:null,reasons:[],note:'',actual:'',changed:[],logId:null,planned:c?c.title:''};
  }
  return ui.rec[key];
}
function curRec(){var e=peek(ui.rdn),id=e.selected[ui.ridx||0];return {e:e,id:id,c:cardById(id),d:id?recDraft(id,ui.rdn):null};}
function targetCard(c,label){return '<div class="tcard" style="--c1:'+CATS[c.category].color+'"><span class="ico">'+img('category_'+c.category,0.8)+'</span><span><div class="a">'+label+' ・ '+CATS[c.category].label+'</div><div class="b">'+esc(c.title)+'</div></span></div>';}
V.record=function(){
  var r=curRec(),c=r.c,d=r.d,n=r.e.selected.length;if(!c)return nav('')+'<p class="nolog">カードが見つかりません。</p>';
  var w=wordOf(ui.rdn),i=ui.ridx||0;
  var otherLeft=r.e.selected.some(function(id,j){return j!==i&&r.e.logged.indexOf(id)<0;});
  var fitCards=[['yes','合っている','fit_yes'],['no','合っていない','fit_no']].map(function(x){var on=d.fit===x[0];
    return '<button class="fit opt'+(on?' on':'')+'" data-a="fit" data-v="'+x[0]+'"><span class="tick">'+TICKW+'</span><span class="fi">'+img(x[2],0.8)+'</span>'+x[1]+'</button>';}).join('');
  var fix=d.fit?'<div class="fixbox"><div class="p">'+(d.fit==='yes'?'新しい形も考えてみませんか？':'合っていない時は、形を変えてみませんか？')+'</div><button class="btn sm" data-a="rec-hints">手がかりを見る'+ARROW+'</button></div>':'';
  var reasons='';
  if(d.fit==='no'){
    reasons='<div class="h2">なんでそう感じましたか？ <span class="badge">任意</span></div><div class="h2s">近いものを、いくつでも選べます</div><div class="rgrid">'+
     REASONS.map(function(x){var on=d.reasons.indexOf(x.k)>=0;return '<button class="ropt'+(on?' on':'')+'" data-a="reason" data-v="'+x.k+'"><div class="tt">'+x.t+'</div><div class="dd">'+esc(x.d)+'</div></button>';}).join('')+'</div>';
  }
  return nav((i+1)+' / '+n+'枚目')+'<h1 class="h24">'+w+'の記録</h1>'+targetCard(c,'カード'+(i+1))+
   '<div class="qrow"><h2>このやり方は、<br>自分に合っていましたか？</h2><span class="badge req">必須</span></div><div class="fitgrid">'+fitCards+'</div>'+fix+reasons+
   '<div class="h2" style="margin-top:22px">ひとこと <span class="badge">任意</span></div><input class="field" data-bind="rnote" style="border-color:var(--bd2)" maxlength="140" placeholder="気づいたことがあれば、書いてみてください" value="'+esc(d.note)+'" autocomplete="off">'+
   '<button class="link" style="margin-top:20px;text-align:left;font-size:13px;padding-left:0" data-a="rec-plan-actual">'+w+'だけ、やり方が予定と違いましたか？(任意)</button>'+
   '<div class="foot bar">'+btn(otherLeft?'次のカードの記録へ'+ARROW:'記録を終える','rec-next',{id:'primary',off:!d.fit})+'</div>';
};
V.record.valid=function(){var r=curRec();return !!(r.d&&r.d.fit);};

V.paction=function(){
  var r=curRec(),c=r.c,d=r.d,n=r.e.selected.length,w=wordOf(ui.rdn),i=ui.ridx||0;if(!c)return '';
  var rows=HINTS.map(function(h){var on=d.changed.indexOf(h.k)>=0;return '<button class="arow plain opt'+(on?' on':'')+'" data-a="pa-hint" data-v="'+h.k+'" style="margin-bottom:12px"><div class="tt">'+h.t+'</div><div class="dd">'+esc(h.done)+'</div></button>';}).join('');
  return nav((i+1)+' / '+n+'枚目')+'<h1 class="h24" style="margin-top:6px">'+w+'のやり方を<br>書き残す</h1><p class="sub">予定と違った日も、大切な記録です。</p>'+targetCard(c,'カード'+(i+1))+
   '<div class="h2" style="margin-top:22px">予定していたこと</div><div style="background:var(--chip);border-radius:24px;padding:13px 20px;font-size:15px;line-height:22px">'+esc(c.title)+'</div>'+
   '<div class="h2" style="margin-top:22px">実際にやったこと</div><input class="field" data-bind="actual" style="border-color:var(--bd)" maxlength="140" placeholder="例:家の中で5分ストレッチした" value="'+esc(d.actual)+'" autocomplete="off">'+
   '<div class="h2" style="margin-top:22px">どう変えましたか？ <span class="badge">任意</span></div><div class="h2s">近いものを、いくつでも選べます</div>'+rows+
   '<p class="sub" style="font-size:12px;line-height:21px;margin-top:6px">'+w+'だけの変更は、この記録に残ります。<br>これからもこの形でやりたい時は、新しいカードにできます。</p>'+
   '<div class="foot bar">'+btn('保存して、記録にもどる','pa-save')+'</div>';
};

/* card detail */
function hintLabel(k){var a=HINTS.concat(FHINTS).filter(function(x){return x.k===k;})[0];return a?a.t:'―';}
V.card=function(){
  var c=cardById(ui.cardId);if(!c)return nav('')+'<p class="nolog">カードが見つかりません。</p>';
  var logs=S.logs.filter(function(l){return l.cardId===c.id;}).sort(function(a,b){return a.savedAt-b.savedAt;});
  var front='<div class="face-side"><div class="hd">'+CATS[c.category].label+'</div><div class="bd"><div class="bigico">'+img('category_'+c.category,1.7)+'</div><div class="bigttl">'+esc(c.title)+'</div><div class="dash"></div><div class="meta"><div class="k">どんな日に向いている？</div><div class="v"><span class="tag">'+DT[c.dayType]+'</span></div>'+(c.source?'<div class="k" style="margin-top:14px">どこで知った？</div><div class="v">'+esc(c.source)+'</div>':'')+'</div></div></div>';
  var rows=logs.map(function(l){
    var rs=(l.fit==='no'?(l.reasons||[]):[]).map(function(k){var r=REASONS.filter(function(x){return x.k===k;})[0];return r?r.t:'';}).filter(Boolean).join('・');
    var txt=[];if(l.note)txt.push(esc(l.note));if(l.actualText)txt.push('実際:'+esc(l.actualText));
    return '<div class="logrow"><div class="l1"><span>'+l.dayNo+'日目</span><span class="pl" style="background:'+(l.fit==='yes'?'var(--ok)':'var(--ng)')+'">'+(l.fit==='yes'?'合っている':'合っていない')+'</span>'+(rs?'<span>'+rs+'</span>':'')+'</div>'+(txt.length?'<div class="l2">'+txt.join('<br>')+'</div>':'')+'</div>';}).join('');
  var origin='';
  if(c.parentId){var p=cardById(c.parentId);
    origin='<div class="origin"><div class="a">元のカード</div><div class="b">「'+esc(p?p.title:'(元のカード)')+'」から変えました</div><div class="c">変えたところ:'+hintLabel((c.changeTypes||[])[0])+(c.changeReason?' / 理由:'+esc(c.changeReason):'')+'</div></div>';}
  var back='<div class="face-side rear"><div class="hd">記録</div><div class="bd"><div class="logs"><div class="bt">'+esc(c.title)+'</div>'+(rows||'<div class="nolog">まだ記録がありません。</div>')+origin+'</div></div></div>';
  return vbar()+nav('')+'<h1 class="h24">カードの記録</h1><p class="sub">カードをタップすると、裏返って記録が見られます</p>'+
   '<div class="flipwrap cat-'+c.category+'"><div class="flipper'+(ui.flip?' on':'')+'" id="flipper" data-a="flip" role="button" tabindex="0">'+front+back+'</div></div>'+
   '<button class="flipbtn" data-a="flip">'+(ui.flip?'おもてを見る':'記録を見る')+'</button>';
};

/* trash */
V.trash=function(){
  var tl=trashedCards(),sub=ui.tsub||'pick',sel=ui.tsel||{};
  var head=vbar()+'<div class="thead"><button class="tb" data-a="back" aria-label="もどる">'+CHEV+'</button><h1>ゴミ箱</h1></div>'+
   '<div class="seg"><button class="'+(sub==='pick'?'on':'')+'" data-a="trash-seg" data-v="pick">捨てるカードを選ぶ</button><button class="'+(sub==='in'?'on':'')+'" data-a="trash-seg" data-v="in">ゴミ箱の中<span class="n">'+tl.length+'</span></button></div>';
  if(sub==='pick'){
    var live=liveCards(),k=live.filter(function(c){return sel[c.id];}).length;
    var rows=live.map(function(c){return '<button class="trow cat-'+c.category+(sel[c.id]?' sel':'')+'" data-a="trash-toggle" data-id="'+c.id+'"><div class="ic">'+img('category_'+c.category)+'</div><div class="tx"><div class="k">'+CATS[c.category].label+'</div><div class="tt">'+esc(c.title)+'</div></div><span class="ck">'+(sel[c.id]?CHK:'')+'</span></button>';}).join('');
    return head+'<p class="note2">捨てたいカードを選んでください。<br>捨てても、記録は残ります。ゴミ箱から、いつでも戻せます。</p>'+(rows||'<div class="empty2">捨てられるカードがありません。</div>')+
     (VIEW?'':'<div class="actbar"><button data-a="trash-do" '+(k?'':'disabled')+'>'+(k?img('trash',0.9)+k+'枚をゴミ箱に入れる':'カードを選んでください')+'</button></div>');
  }
  var rows2=tl.map(function(c){var d=new Date(c.trashedAt||0);return '<div class="trow cat-'+c.category+'"><div class="ic">'+img('category_'+c.category)+'</div><div class="tx"><div class="k">'+CATS[c.category].label+'</div><div class="tt">'+esc(c.title)+'</div><div class="dt2">'+(d.getMonth()+1)+'/'+d.getDate()+'に捨てました</div></div>'+(VIEW?'':'<button class="stt back2" data-a="trash-restore" data-id="'+c.id+'">もどす</button>')+'</div>';}).join('');
  return head+'<p class="note2">捨てたカードの中身です。'+(VIEW?'':'「もどす」を押すと、手札に戻ります。')+'</p>'+(tl.length?rows2:'<div class="empty2">ゴミ箱は、空です。</div>');
};

/* backup / finish / restore / viewer */
function bkTexts(){
  var rn=realNo();
  if(ui.bmode==='mid')return {h:'ここまでの記録を、<br>バックアップしましょう',s:rn+'日目まで、おつかれさまです。万が一、アプリの記録が消えた時のために、いまの記録を送ってください。'};
  return {h:'記録のバックアップ',s:'いまの記録を、文字(コード)とファイルにしました。ファイルで送るか、コードをコピーして、送ってください。'};
}
function bkBody(){
  return '<textarea id="codebox" class="codebox short" readonly>'+esc(makeCode())+'</textarea>'+
   '<div class="small-actions">'+btn('ファイルで送る','file-share',{cls:'sec'})+btn('コードをコピーする','code-copy',{cls:'sec'})+'</div>'+
   '<p class="note" style="margin-left:0;margin-top:14px;line-height:19px">送り方は、石川さんからの案内にしたがってください。記録が増えたら、その都度とり直してください。</p>';
}
V.backup=function(){
  var t=bkTexts();
  return nav('')+'<h1 class="h24">'+t.h+'</h1><p class="sub" style="line-height:22px">'+t.s+'</p><div style="height:14px"></div>'+bkBody()+
   '<div class="foot">'+btn('とじる','back')+'</div>';
};
V.finish=function(){
  return nav('')+'<h1 class="h24">8日間、<br>おつかれさまでした</h1><p class="sub" style="line-height:22px">取り組んでくれて、ありがとうございます。最後に、バックアップを送ってください。このあと、インタビューにご協力をお願いします(日程は、あらためてご連絡します)。</p><div style="height:14px"></div>'+bkBody()+
   '<div class="foot">'+btn('ホームにもどる','finish-home')+'</div>';
};
V.restore=function(){
  return nav('')+'<h1 class="h24">前の記録で続きから</h1><p class="sub" style="line-height:22px">バックアップしたコードを、下の欄に貼り付けてください。</p>'+
  '<textarea id="rcode" class="codebox" data-bind="rcode" placeholder="K2:..." autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false">'+esc(ui.rcode||'')+'</textarea>'+
  '<div class="foot">'+btn('この記録で続きから始める','restore-go',{id:'primary',off:!(ui.rcode||'').trim()})+'</div>';
};
V.restore.valid=function(){return !!(ui.rcode||'').trim();};
V.vstart=function(){
  return '<div style="height:44px"></div><h1 class="h24">見る専用の画面</h1><p class="sub" style="line-height:22px">参加者のバックアップコードを貼り付けると、その人の画面を見られます。見るだけで、保存も送信もされません(このページを閉じると消えます)。</p>'+
  '<textarea id="rcode" class="codebox" data-bind="rcode" placeholder="K2:..." autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false">'+esc(ui.rcode||'')+'</textarea>'+
  '<div class="foot">'+btn('この記録を見る','v-load',{id:'primary',off:!(ui.rcode||'').trim()})+'</div>';
};
V.vstart.valid=function(){return !!(ui.rcode||'').trim();};
V.vcsv=function(){
  return vbar()+nav('')+'<h1 class="h24">記録をCSVで見る</h1><p class="sub">コピーして、表計算ソフトに貼れます。</p><textarea id="codebox" class="codebox" readonly>'+esc(logsCSV())+'</textarea><div class="foot">'+btn('コピーする','code-copy')+'</div>';
};
function logsCSV(){
  var rows=[['日目','日付','カード','カテゴリ','向いている日','合っていたか','理由','ひとこと','予定していたこと','実際にやったこと','変えたところ']];
  S.logs.slice().sort(function(a,b){return a.dayNo-b.dayNo||a.savedAt-b.savedAt;}).forEach(function(l){
    var c=cardById(l.cardId)||{};
    rows.push([l.dayNo,l.date||'',c.title||'',c.category?CATS[c.category].label:'',c.dayType?DT[c.dayType]:'',l.fit==='yes'?'合っている':'合っていない',(l.fit==='no'?(l.reasons||[]):[]).map(function(k){var r=REASONS.filter(function(x){return x.k===k;})[0];return r?r.t:k;}).join('/'),l.note||'',l.plannedTitle||'',l.actualText||'',(l.changedHow||[]).map(function(k){return hintLabel(k);}).join('/')]);
  });
  return rows.map(function(r){return r.map(function(c){c=String(c);return /[",\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c;}).join(',');}).join('\n');
}

/* ---------- render ---------- */
var TABSCREENS={home:1,today:1};
function render(newScreen){
  var app=document.getElementById('app');
  var y=window.scrollY;
  var html=V[screen]?V[screen]():'';
  var blue=({daytype:1,pick:1,adjust:1})[screen]&&isTmr();
  app.innerHTML='<div class="screen'+(newScreen?(dir==='fwd'?' fwd':' bk'):'')+(TABSCREENS[screen]?' hastab':'')+(blue?' blue':'')+'" data-screen="'+screen+'">'+html+'</div>';
  if(newScreen){window.scrollTo(0,0);}else{window.scrollTo(0,y);}
}
function refreshPrimary(){
  var p=document.getElementById('primary');if(!p)return;
  var ok=V[screen]&&V[screen].valid?V[screen].valid():true;
  p.classList.toggle('off',!ok);
}

/* ---------- actions ---------- */
function addCard(){
  if(!formValid())return;
  var c={id:uid(),title:draft.title.trim(),category:draft.cat,dayType:draft.dayType,source:draft.source.trim(),createdAt:Date.now(),createdDayNo:realNo(),parentId:draft.parentId||null,changeTypes:draft.hint?[draft.hint]:[],changeReason:draft.reasonText||'',trashed:false};
  S.cards.push(c);save();
  ev(draft.parentId?'card_create_derived':'card_create',{title:c.title,category:c.category,dayType:c.dayType,parentId:c.parentId,changeTypes:c.changeTypes},c.id);
  return c;
}
function saveRecord(id,rdn){
  var d=recDraft(id,rdn),e=ent(rdn);if(!d.fit)return false;
  var rec={id:d.logId||uid(),cardId:id,date:dayDate(rdn).key,dayNo:rdn,todayDayType:e.dayType,fit:d.fit,reasons:d.fit==='no'?d.reasons.slice():[],note:d.note.trim(),plannedTitle:d.planned,actualText:d.actual.trim(),changedHow:d.changed.slice(),savedAt:Date.now()};
  var found=false;for(var i=0;i<S.logs.length;i++){if(S.logs[i].id===rec.id){S.logs[i]=rec;found=true;}}
  if(!found)S.logs.push(rec);
  d.logId=rec.id;
  if(e.logged.indexOf(id)<0)e.logged.push(id);
  save();ev('log_save',{day:rdn,fit:rec.fit,reasons:rec.reasons,note:rec.note,actual:rec.actualText,changed:rec.changedHow},id);
  return true;
}
function toggle(arr,v){var i=arr.indexOf(v);if(i>=0)arr.splice(i,1);else arr.push(v);}
function goTab(name){stack=[];screen=name;dir='fwd';render(true);}
function afterRecords(rdn){
  var rn=realNo();
  stack=[];screen='today';dir='bk';render(true);
  S.flags=S.flags||{};
  if(rdn===rn&&rn===TOTAL){toast('今日の記録を保存しました');go('finish');return;}
  if(rdn===rn&&rn===4&&!S.flags.b4){S.flags.b4=1;save();ui.bmode='mid';go('backup');return;}
  toast('記録を保存しました');
}
function markBackup(){S.flags=S.flags||{};S.flags.lastBackup=Date.now();S.flags.lastBackupDay=realNo();if(realNo()>=4)S.flags.b4=1;save();ev('backup',{});}
function startAsk(tg){ui.tgt=tg;ui.slot=null;go('daytype');}

var A={
  'back':function(){back();},
  'tab':function(el){ui.off=0;goTab(el.dataset.v);},
  'welcome-start':function(){
    var nick=(ui.nick||'').trim();if(!nick)return;
    S.user={nickname:nick,startDate:dateKey()};save();ev('start',{nickname:nick});
    draft=blankDraft();
    if(!(S.flags&&S.flags.tutDone)){ui.tut=0;ui.tutReplay=false;go('tutorial');}else reset('setup');
  },
  'tut-next':function(){if((ui.tut||0)>=TUT.length-1)return;ui.tut=(ui.tut||0)+1;dir='fwd';render(true);},
  'tut-prev':function(){if((ui.tut||0)>0){ui.tut--;dir='bk';render(true);}else if(stack.length)back();},
  'tut-open':function(){ui.tut=0;ui.tutReplay=true;go('tutorial');},
  'tut-done':function(){
    S.flags=S.flags||{};S.flags.tutDone=1;save();
    if(ui.tutReplay){ui.tutReplay=false;back();return;}
    draft=blankDraft();reset('setup');
  },
  'cat':function(el){draft.cat=el.dataset.v;render();},
  'dt':function(el){draft.dayType=el.dataset.v;render();},
  'slot':function(el){var i=+el.dataset.v;ui.slot=ui.slot===i?null:i;render();},
  'add-card':function(){
    if(!formValid())return;
    var c=addCard(),from=ui.createFrom;
    draft=blankDraft();toast('カードを追加しました');
    if(screen==='setup'){ui.slot=null;render();return;}
    ui.createFrom=null;
    if(from&&from.type==='pick'){
      var e=ent(from.tgt);if(e.selected.indexOf(c.id)<0)e.selected.push(c.id);save();
      ui.tgt=from.tgt;if(popTo('pick'))return;
    }
    if(from&&from.type==='record'){ui.rdn=from.rdn;ui.ridx=from.idx;if(popTo('record'))return;}
    goTab(ui.homeTab||'home');
  },
  'setup-finish':function(){S.flags=S.flags||{};S.flags.setupDone=1;save();ev('setup_done',{count:liveCards().length});goTab('home');},
  'hint-open':function(){ev('hint_view',{});go('hint');},
  'filter':function(el){ui.filter=el.dataset.v;render();},
  'open-card':function(el){ui.cardId=el.dataset.id;ui.flip=false;go('card');},
  'new-card':function(){draft=blankDraft();ui.createFrom=null;ui.homeTab=screen==='today'?'today':'home';go('create');},
  'ask-today':function(){startAsk(realNo());},
  'ask-tmr':function(){if(realNo()>=TOTAL)return;startAsk(realNo()+1);},
  'ask-pick':function(){ui.tgt=realNo();go('pick');},
  'daytype':function(el){var e=ent(ui.tgt);e.dayType=el.dataset.v;e.rested=false;save();ev('daytype_select',{day:ui.tgt,dayType:e.dayType});go('pick');},
  'pick-toggle':function(el){
    var e=ent(ui.tgt),id=el.dataset.id;
    if(e.logged.indexOf(id)>=0&&e.selected.indexOf(id)>=0){toast('記録ずみのカードは、外せません');return;}
    toggle(e.selected,id);save();render();
  },
  'pick-confirm':function(){
    var e=ent(ui.tgt);if(!e.selected.length)return;
    e.rested=false;save();ev('cards_select',{day:ui.tgt,ids:e.selected.slice()});
    var tmr=isTmr();ui.off=0;goTab('today');toast(tmr?'明日の分を選びました':'今日のカードを選びました');
  },
  'no-card':function(){ui.adj=null;ui.adjMode='nofit';ui.adjFrom={type:'pick',tgt:ui.tgt};ev('adjust_open',{from:'pick'});go('adjust');},
  'adj-sel':function(el){ui.adj=el.dataset.v;render();},
  'adj-make':function(){
    if(!ui.adj)return;
    var fit=ui.adjMode==='fit',h=(fit?FHINTS:HINTS).filter(function(x){return x.k===ui.adj;})[0];
    var from=ui.adjFrom||{},orig=from.cardId?cardById(from.cardId):null;
    var rt='';if(from.cardId){var dd=recDraft(from.cardId,from.rdn);if(dd.fit==='no')rt=dd.reasons.map(function(k){return REASONS.filter(function(r){return r.k===k;})[0].d;}).join('、');}
    draft=blankDraft({title:orig?orig.title:'',cat:orig?orig.category:null,dayType:orig?orig.dayType:null,parentId:orig?orig.id:null,hint:ui.adj,reasonText:rt,note:'「'+h.t+'」で形を変えます。'});
    ui.createFrom=from;go('create');
  },
  'adj-rest':function(){var tg=(ui.adjFrom||{}).tgt||realNo();var e=ent(tg);e.rested=true;e.selected=e.selected.filter(function(id){return e.logged.indexOf(id)>=0;});save();ev('rest',{day:tg});var tm=tg>realNo();ui.off=0;goTab('today');toast(tm?'明日はお休みにしました':'今日はお休みにしました');},
  'rec-open':function(el){
    var dn=+el.dataset.d,e=peek(dn);ui.rdn=dn;ui.ridx=Math.max(0,e.selected.indexOf(el.dataset.id));go('record');
  },
  'fit':function(el){var r=curRec();r.d.fit=el.dataset.v;render();},
  'reason':function(el){var r=curRec();toggle(r.d.reasons,el.dataset.v);render();},
  'rec-hints':function(){var r=curRec();ui.adj=null;ui.adjMode=r.d.fit==='yes'?'fit':'nofit';ui.adjFrom={type:'record',cardId:r.id,idx:ui.ridx||0,rdn:ui.rdn};ev('adjust_open',{from:'record',mode:ui.adjMode},r.id);go('adjust');},
  'rec-plan-actual':function(){go('paction');},
  'rec-next':function(){
    var r=curRec();if(!r.d||!saveRecord(r.id,ui.rdn))return;
    var e=ent(ui.rdn),n=e.selected.length,i=ui.ridx||0,nx=-1;
    for(var s=1;s<=n;s++){var j=(i+s)%n;if(e.logged.indexOf(e.selected[j])<0){nx=j;break;}}
    if(nx<0){afterRecords(ui.rdn);return;}
    ui.ridx=nx;dir='fwd';render(true);
  },
  'pa-hint':function(el){var r=curRec();toggle(r.d.changed,el.dataset.v);render();},
  'pa-save':function(){var r=curRec();ev('plan_actual_save',{actual:r.d.actual,changed:r.d.changed},r.id);back();},
  'flip':function(){ui.flip=!ui.flip;var f=document.getElementById('flipper');if(f)f.classList.toggle('on',ui.flip);var b=document.querySelector('.flipbtn');if(b)b.textContent=ui.flip?'おもてを見る':'記録を見る';},
  'day-prev':function(){if(viewNo()<=1)return;if(VIEW)ui.vday=viewNo()-1;else ui.off=(ui.off||0)-1;render();},
  'day-next':function(){if(viewNo()>=TOTAL)return;if(VIEW)ui.vday=viewNo()+1;else ui.off=(ui.off||0)+1;render();},
  'day-today':function(){ui.off=0;if(VIEW)ui.vday=ui.vreal;render();},
  'trash-open':function(){ui.tsub=VIEW?'in':'pick';ui.tsel={};go('trash');},
  'trash-seg':function(el){ui.tsub=el.dataset.v;render();},
  'trash-toggle':function(el){ui.tsel=ui.tsel||{};var id=el.dataset.id;if(ui.tsel[id])delete ui.tsel[id];else ui.tsel[id]=1;render();},
  'trash-do':function(){
    var ids=Object.keys(ui.tsel||{});if(!ids.length)return;
    ids.forEach(function(id){var c=cardById(id);if(!c)return;c.trashed=true;c.trashedAt=Date.now();
      Object.keys(S.todays).forEach(function(k){var e=S.todays[k];if(e.logged.indexOf(id)<0)e.selected=e.selected.filter(function(x){return x!==id;});});});
    save();ev('trash',{ids:ids});ui.tsel={};ui.tsub='in';render();toast(ids.length+'枚をゴミ箱に入れました');
  },
  'trash-restore':function(el){var c=cardById(el.dataset.id);if(!c)return;c.trashed=false;delete c.trashedAt;save();ev('trash_restore',{},c.id);render();toast('手札に戻しました');},
  'backup-open':function(){ui.bmode='';go('backup');},
  'finish-open':function(){go('finish');},
  'finish-home':function(){goTab('home');},
  'restore-open':function(){ui.rcode='';go('restore');},
  'code-copy':function(){
    var box=document.getElementById('codebox');if(!box)return;box.focus();box.select();try{box.setSelectionRange(0,box.value.length);}catch(e){}
    var ok=false;try{ok=document.execCommand('copy');}catch(e){}
    if(!VIEW&&screen!=='vcsv')markBackup();
    if(ok){toast('コピーしました');return;}
    try{navigator.clipboard.writeText(box.value).then(function(){toast('コピーしました');},function(){toast('選択しました。長押しでコピーしてください');});}catch(e){toast('選択しました。長押しでコピーしてください');}
  },
  'file-share':function(){
    var code=makeCode(),nick=(S.user&&S.user.nickname)||'user';
    var name='kenko_backup_'+nick.replace(/[^\w぀-ヿ一-鿿-]/g,'')+'_'+dateKey()+'.txt';
    markBackup();
    try{
      var f=new File([code],name,{type:'text/plain'});
      if(navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:APP_NAME+'のバックアップ'}).catch(function(){});return;}
    }catch(e){}
    try{var b=new Blob([code],{type:'text/plain'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){a.remove();URL.revokeObjectURL(u);},500);toast('ファイルを保存しました');}
    catch(e){toast('「コードをコピーする」を使ってください');}
  },
  'restore-go':function(){
    var b;try{b=parseCode(ui.rcode);}catch(e){toast(e&&e.message==='prefix'?'コードの先頭「K2:」から貼り付けてください':'コードが途中で切れているようです。もう一度コピーしてください');return;}
    S=b;save();ev('restore',{cards:S.cards.length,logs:S.logs.length});
    stack=[];screen=S.user?'home':'welcome';dir='fwd';render(true);toast('記録を復元しました');
  },
  'v-load':function(){
    var b;try{b=parseCode(ui.rcode);}catch(e){toast(e&&e.message==='prefix'?'コードの先頭「K2:」から貼り付けてください':'コードが途中で切れているようです');return;}
    S=b;var m=1;Object.keys(S.todays||{}).forEach(function(k){var e=S.todays[k];if(e.selected&&e.selected.length||e.dayType)m=Math.max(m,+k);});S.logs.forEach(function(l){m=Math.max(m,l.dayNo||1);});
    if(S.flags&&S.flags.lastDay)m=Math.max(1,S.flags.lastDay);
    ui.vreal=Math.min(TOTAL,m);ui.vday=ui.vreal;stack=[];screen='home';dir='fwd';render(true);
  },
  'v-reset':function(){S=blank();ui={};stack=[];screen='vstart';dir='fwd';render(true);},
  'v-csv':function(){go('vcsv');},
  'dbg-tap':function(){
    if(VIEW)return;
    var now=Date.now();ui.taps=(ui.taps||[]).filter(function(x){return now-x<3000;});ui.taps.push(now);
    if(ui.taps.length>=5){ui.taps=[];openDebug();}
  }
};
var VOK={'day-today':1,back:1,tab:1,filter:1,'open-card':1,flip:1,'day-prev':1,'day-next':1,'trash-open':1,'trash-seg':1,'v-load':1,'v-reset':1,'v-csv':1,'code-copy':1};

/* ---------- events ---------- */
document.addEventListener('click',function(e){
  var el=e.target.closest('[data-a]');if(!el)return;
  var a=el.getAttribute('data-a');
  if(VIEW&&!VOK[a])return;
  if(A[a]){e.preventDefault();A[a](el);}
});
document.addEventListener('input',function(e){
  var el=e.target;var b=el.getAttribute&&el.getAttribute('data-bind');if(!b)return;
  if(b==='nick')ui.nick=el.value;
  else if(b==='rcode')ui.rcode=el.value;
  else if(b==='title'||b==='source')draft[b]=el.value;
  else if(b==='rnote'){curRec().d.note=el.value;}
  else if(b==='actual'){curRec().d.actual=el.value;}
  else if(b==='start'){
    var v=el.value;if(/^\d{4}-\d{2}-\d{2}$/.test(v)&&v>=dateKey()){S.user=S.user||{nickname:'',startDate:v};S.user.startDate=v;save();render();}
  }
  refreshPrimary();
});
document.addEventListener('keydown',function(e){
  if(e.key==='Enter'&&e.target.id==='f-nick'){var el=document.getElementById('primary');if(el&&!el.classList.contains('off'))el.click();}
  if((e.key==='Enter'||e.key===' ')&&e.target.id==='flipper'){e.preventDefault();A.flip();}
});

/* ---------- debug panel(研究者用:タイトルを5回タップ) ---------- */
function openDebug(){
  var l=document.getElementById('layer');
  var box=document.createElement('div');box.className='dbg';box.id='dbg';
  function paint(){
    box.innerHTML='<div class="box"><h3>裏のパネル(研究者用) '+VERSION+'</h3><div>ニックネーム:'+esc(S.user?S.user.nickname:'―')+' / 手札 '+S.cards.length+'枚 / 記録 '+S.logs.length+'件 / 開始日 '+esc(startDate())+'</div>'+
     '<div class="row"><span>日数のずれ</span><button class="b" data-d="dec">−</button><span class="num">'+(S.dayOffset||0)+'</span><button class="b" data-d="inc">+</button><span>→ '+realNo()+'日目</span></div>'+
     '<div class="row"><button class="b" data-d="demo">見本の5枚を入れる</button><button class="b" data-d="json">全データをJSONで表示</button><button class="b" data-d="csv">記録をCSVで表示</button></div>'+
     '<textarea id="dbg-out" readonly placeholder="ここに出ます"></textarea>'+
     '<div class="row"><button class="b" data-d="copy">コピー</button><button class="b dg" data-d="wipe">データを全部消す</button><button class="b" data-d="close">閉じる</button></div><div id="dbg-msg"></div></div>';
  }
  paint();l.appendChild(box);
  box.addEventListener('click',function(e){
    var el=e.target.closest('[data-d]');
    if(e.target===box){box.remove();render();return;}
    if(!el)return;var d=el.getAttribute('data-d');
    if(d==='close'){box.remove();render();return;}
    if(d==='inc'||d==='dec'){S.dayOffset=(S.dayOffset||0)+(d==='inc'?1:-1);save();paint();return;}
    if(d==='demo'){DEMO.forEach(function(x,i){S.cards.push({id:uid(),title:x.title,category:x.category,dayType:x.dayType,source:x.source,createdAt:Date.now()+i,createdDayNo:realNo(),parentId:null,changeTypes:[],changeReason:'',trashed:false});});save();paint();return;}
    if(d==='csv'||d==='json'){var o=box.querySelector('#dbg-out');o.value=d==='csv'?logsCSV():JSON.stringify(S,null,1);o.focus();o.select();return;}
    if(d==='copy'){var o2=box.querySelector('#dbg-out');o2.select();var m=box.querySelector('#dbg-msg');
      try{navigator.clipboard.writeText(o2.value).then(function(){m.textContent='コピーしました。';},function(){m.textContent='選択しました。長押しでコピーしてください。';});}catch(er){m.textContent='選択しました。長押しでコピーしてください。';}return;}
    if(d==='wipe'){
      if(!el.dataset.sure){el.dataset.sure='1';el.textContent='もう一度押すと全部消えます';return;}
      S=blank();try{localStorage.removeItem(KEY);}catch(er){}box.remove();ui={};draft=blankDraft();reset('welcome');return;
    }
  });
}

/* ---------- start ---------- */
(function init(){
  if(VIEW)screen='vstart';
  else if(!S.user)screen='welcome';
  else if(!(S.flags&&S.flags.tutDone)&&liveCards().length===0){screen='tutorial';ui.tut=0;}
  else if(liveCards().length<5&&realNo()===1&&!(S.flags&&S.flags.setupDone))screen='setup';
  else screen='home';
  dir='fwd';render(true);
})();
window.__kenko={S:function(){return S;},go:go,reset:reset,ui:function(){return ui;}};
})();
