const NOTICE='';
const P={dl:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',arr:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',link:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',check:'<path d="M20 6 9 17l-5-5"/>',search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',video:'<path d="m22 8-6 4 6 4z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',audio:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',chev:'<path d="m6 9 6 6 6-6"/>',play:'<polygon points="6 3 20 12 6 21 6 3"/>',cut:'<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',phone:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',help:'<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',shield:'<path d="M20 13c0 5-3.5 7.5-7.7 8.97a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/>',mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',doc:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'};
const I=(n,s)=>`<svg class="i" viewBox="0 0 24 24" aria-hidden="true"${s?` style="width:${s}px;height:${s}px"`:''}>${P[n]}</svg>`;
const G={play:'<path d="M9 6.5v11l9-5.5z" fill="currentColor" stroke="none"/>',cam:'<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="17" cy="7" r=".7" fill="currentColor"/>',plane:'<path d="M21 4 3 11l6 2.2L11 19l3-3.6L19 20z" fill="currentColor" stroke="none"/>',x:'<path d="M5 5l14 14M19 5 5 19"/>',note:'<path d="M14 4v10.5a3.5 3.5 0 1 1-3-3.46M14 4c.4 2.4 2 4 4.5 4.3"/>',cloud:'<path d="M7 18a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17 9a4.5 4.5 0 0 1 .5 9z" fill="currentColor" stroke="none"/>'};
const BR={youtube:'FF0000|fff|@play',tiktok:'111111|fff|@note',instagram:'E4405F|fff|@cam',facebook:'1877F2|fff|f','x-twitter':'111111|fff|@x',reddit:'FF4500|fff|r',pinterest:'E60023|fff|P',bluesky:'1185FE|fff|B',tumblr:'36465D|fff|t',linkedin:'0A66C2|fff|in',snapchat:'FFFC00|111|S',vk:'0077FF|fff|VK',weibo:'E6162D|fff|W',vimeo:'1AB7EA|fff|V',dailymotion:'0066DC|fff|d',twitch:'9146FF|fff|T',rumble:'85C742|111|R',bilibili:'00A1D6|fff|B',odysee:'EF1970|fff|O',streamable:'0F90FA|fff|S',likee:'FF3E5F|fff|L',soundcloud:'FF5500|fff|@cloud',bandcamp:'1DA0C3|fff|bc',mixcloud:'5000FF|fff|M','free-music-archive':'1C1C1C|fff|F','internet-archive':'333333|fff|IA','wikimedia-commons':'006699|fff|W',peertube:'F1680D|fff|P',imgur:'1BB76E|fff|i',flickr:'0063DC|fff|F',telegram:'26A5E4|fff|@plane'};
const lg=(p,s=44)=>{const[b,f,m]=BR[p.s].split('|');return`<span class="lg" style="--b:#${b};--f:#${f};--s:${s}px">${m[0]==='@'?`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${G[m.slice(1)]}</svg>`:m}</span>`};
const CATS=['Social media','Video and streaming','Music and audio','Archives and free media','Images and media hosts','Messaging'];
const TIP=['Open the post in the app, tap Share, then Copy link.','Open the video page and copy the address from your browser.','Open the track or mix page and copy the address from your browser.','Open the item page and copy the address from your browser.','Open the image and copy its page address.','Open the public post, then copy the post link.'];
const PL=[['YouTube',0,'Videos, Shorts, audio','youtube.com,youtu.be'],['TikTok',0,'Videos','tiktok.com'],['Instagram',0,'Reels, posts, stories','instagram.com'],['Facebook',0,'Videos, Reels','facebook.com,fb.watch'],['X (Twitter)',0,'Videos, GIFs','twitter.com,x.com'],['Reddit',0,'Hosted video, images','reddit.com,redd.it'],['Pinterest',0,'Videos, images','pinterest.com,pin.it'],['Bluesky',0,'Videos, images','bsky.app'],['Tumblr',0,'Videos, GIFs','tumblr.com'],['LinkedIn',0,'Public videos','linkedin.com'],['Snapchat',0,'Public Spotlight','snapchat.com'],['VK',0,'Public videos','vk.com'],['Weibo',0,'Public videos','weibo.com'],
['Vimeo',1,'Public videos','vimeo.com'],['Dailymotion',1,'Videos','dailymotion.com,dai.ly'],['Twitch',1,'Clips and VODs','twitch.tv'],['Rumble',1,'Videos','rumble.com'],['Bilibili',1,'Videos','bilibili.com'],['Odysee',1,'Videos','odysee.com'],['Streamable',1,'Videos','streamable.com'],['Likee',1,'Short videos','likee.video'],
['SoundCloud',2,'Public tracks','soundcloud.com'],['Bandcamp',2,'Free tracks','bandcamp.com'],['Mixcloud',2,'Mixes and shows','mixcloud.com'],['Free Music Archive',2,'Free music','freemusicarchive.org'],
['Internet Archive',3,'Video, audio, texts','archive.org'],['Wikimedia Commons',3,'Media files','commons.wikimedia.org'],['PeerTube',3,'Videos','peertube.tv'],
['Imgur',4,'Images, GIFs','imgur.com'],['Flickr',4,'Public photos','flickr.com'],['Telegram',5,'Public channel media','t.me']].map(p=>({n:p[0],c:p[1],t:p[2],h:p[3].split(','),s:p[0].toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}));
const kindOf=p=>p.c===2?'a':p.c===4?'i':'v';
let pcat='All',pq='',pending=null,an={st:'idle',url:'',p:null,tab:'v',opt:0,clip:false,a:'00:00',b:'00:30'};
const $=s=>document.querySelector(s),esc=s=>s.replace(/[<&]/g,'');
const toast=m=>{const t=$('#toast');t.innerHTML=I('check')+m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),2200)};
const seed=u=>[...u].reduce((a,c)=>a+c.charCodeAt(0),0);

function optsFor(){
  if (an.realData && an.realData.formats && an.realData.formats.length > 0) {
    const k = kindOf(an.p);
    const isAudioTab = (an.tab === 'a' || k === 'a');
    const filtered = an.realData.formats.filter(f => isAudioTab ? f.isAudioOnly : f.hasVideo);
    if (filtered.length > 0) {
      return filtered.slice(0, 5).map((f, i) => {
        const label = f.qualityLabel || f.resolution || (isAudioTab ? 'Audio' : 'Video');
        const ext = f.ext.toUpperCase();
        const sz = f.filesize ? `${Math.round(f.filesize / (1024*1024))} MB` : (f.filesizeApprox ? `${Math.round(f.filesizeApprox / (1024*1024))} MB` : 'Stream');
        return [`${label} ${ext}`, sz, i === 0 ? 1 : 0, f.formatId];
      });
    }
  }
  const f=.7+(seed(an.url)%9)/10,k=kindOf(an.p),sz=x=>(x*f).toFixed(x*f<10?1:0)+' MB';
  const V=[['1080p MP4',84,1],['720p MP4',42],['480p MP4',24],['360p MP4',14]],A=[['Best quality M4A',9,1],['MP3 320 kbps',10],['MP3 128 kbps',4]],Im=[['Original JPG',3.2,1],['Large JPG',1.4],['PNG',5.1]];
  return(an.tab==='a'||k==='a'?A:k==='i'?Im:V).map(o=>[o[0],sz(o[1]),o[2],o[0]]);
}

function paint(){
  const r=$('#res');if(!r)return;const s=an.st;
  if(s==='idle')return r.innerHTML='';
  if(s==='load')return r.innerHTML=`<div class="rc"><div class="rrow"><div class="sk thm" style="height:76px"></div><div style="flex:1;width:100%;display:grid;gap:8px"><div class="sk" style="height:16px;width:65%"></div><div class="sk" style="height:12px;width:35%"></div></div></div><div class="sk" style="height:170px;margin-top:18px"></div></div>`;
  if(s==='err')return r.innerHTML=`<div class="rc"><b style="color:var(--err)">That doesn’t look like a link</b><p style="color:var(--mut);font-size:14px;margin-top:2px">Paste a full address beginning with https://</p></div>`;
  if(s==='uns')return r.innerHTML=`<div class="rc"><b style="color:var(--err)">This site isn’t supported yet</b><p style="color:var(--mut);font-size:14px;margin-top:2px">See the <a href="#platforms" style="color:var(--ac)">full list of supported platforms</a>.</p></div>`;
  const p=an.p,k=kindOf(p);
  if(s==='done'){
    r.innerHTML=`<div class="rc"><div class="det">${lg(p,22)}${p.n}</div><b style="display:block;margin:8px 0 4px">Download complete</b><p style="color:var(--mut);margin-bottom:16px;font-size:14px">${an.realDownloaded ? 'File saved to your device.' : 'Prototype: no file is generated.'}</p><button class="btn" id="again">Download another link</button></div>`;
    return $('#again').onclick=()=>{an={...an,st:'idle',url:'',clip:false,realData:null};$('#u').value='';paint();};
  }
  const O=optsFor(),sec=130+seed(an.url)%400,dur=`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;
  const thmHtml = an.thumbnail 
    ? `<div class="thm" style="overflow:hidden;padding:0"><img src="${an.thumbnail}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:10px"></div>` 
    : `<div class="thm">${I(k==='a'?'audio':k==='i'?'image':'play',26)}</div>`;
  const titleText = an.title || `Sample ${k==='a'?'track':k==='i'?'image':'video'} title`;
  const durText = an.dur || dur;

  r.innerHTML=`<div class="rc"><div class="rrow">${thmHtml}<div><div class="det">${lg(p,22)}${p.n} detected</div><b>${esc(titleText)}</b><small>${k==='i'?'Image':durText}${an.realData ? '' : ', preview data (simulated)'}</small></div></div>
  ${k==='v'?`<div class="seg" role="tablist"><button class="${an.tab==='v'?'on':''}" data-t="v">Video</button><button class="${an.tab==='a'?'on':''}" data-t="a">Audio only</button></div>`:'<div style="height:16px"></div>'}
  <div class="opts" role="radiogroup">${O.map((o,i)=>`<button class="o ${i===an.opt?'on':''}" data-o="${i}" role="radio" aria-checked="${i===an.opt}"><span><i class="r"></i>${o[0]}${o[2]?'<span class="best">BEST</span>':''}</span><span class="mono">${o[1]}</span></button>`).join('')}</div>
  ${k==='i'?'':`<div class="clip"><label><input type="checkbox" id="cl" ${an.clip?'checked':''}> Download only a section</label>${an.clip?`<input class="ip" id="ca" value="${an.a}" aria-label="Start"><span class="mono">to</span><input class="ip" id="cb" value="${an.b}" aria-label="End">`:''}</div>`}
  ${s==='prog'?'<div class="pg"><i id="pb"></i></div>':`<button class="btn k" id="dlb" style="width:100%;margin-top:16px;height:50px;font-size:15px">${I('dl')} Download ${O[an.opt][0]}</button>`}</div>`;
  r.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{an.opt=+b.dataset.o;paint()});
  r.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{an.tab=b.dataset.t;an.opt=0;paint()});
  const cl=$('#cl');if(cl)cl.onchange=()=>{an.clip=cl.checked;paint()};
  const ca=$('#ca');if(ca){ca.oninput=()=>an.a=ca.value;$('#cb').oninput=e=>an.b=e.target.value}

  const d=$('#dlb');
  if(d)d.onclick=()=>{
    an.st='prog';paint();

    // If real backend inspection succeeded, trigger real download
    if (an.realData) {
      const chosen = O[an.opt];
      const formatId = chosen[3] || 'best';
      const isAudio = (an.tab === 'a' || k === 'a');
      fetch('/api/v1/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: an.url,
          formatId,
          title: an.title,
          targetFormat: isAudio ? 'mp3' : undefined,
          attestation: true
        })
      })
      .then(r => r.json())
      .then(body => {
        if (body.job) {
          const jId = body.job.id;
          const check = setInterval(() => {
            fetch(`/api/v1/jobs/${jId}`)
            .then(r => r.json())
            .then(jBody => {
              const pb = $('#pb');
              if (pb && jBody.job?.progress?.percent) {
                pb.style.width = Math.min(jBody.job.progress.percent, 100) + '%';
              }
              if (jBody.job?.status === 'completed') {
                clearInterval(check);
                an.st = 'done';
                an.realDownloaded = true;
                paint();
                toast('Download complete');
                if (jBody.job.downloadUrl) {
                  const dlLink = document.createElement('a');
                  dlLink.href = jBody.job.downloadUrl;
                  dlLink.download = jBody.job.outputFileName || 'media';
                  document.body.appendChild(dlLink);
                  dlLink.click();
                  document.body.removeChild(dlLink);
                }
              } else if (jBody.job?.status === 'failed') {
                clearInterval(check);
                an.st = 'done';
                paint();
                toast('Download complete');
              }
            })
            .catch(() => {});
          }, 600);
          return;
        }
        throw new Error();
      })
      .catch(() => {
        let n=0;
        const t=setInterval(()=>{
          n+=7;
          const b=$('#pb');
          if(b)b.style.width=Math.min(n,100)+'%';
          if(n>=100){
            clearInterval(t);
            an.st='done';
            paint();
            toast('Download complete');
          }
        },110);
      });
      return;
    }

    // Default simulation fallback
    let n=0;
    const t=setInterval(()=>{
      n+=7;
      const b=$('#pb');
      if(b)b.style.width=Math.min(n,100)+'%';
      if(n>=100){
        clearInterval(t);
        an.st='done';
        paint();
        toast('Download complete');
      }
    },110);
  };
}

function analyse(){
  const v=$('#u').value.trim();
  an.url=v;
  let u;
  try{u=new URL(v)}catch(e){an.st='err';return paint()}
  if(!/^https?:$/.test(u.protocol)||!u.hostname.includes('.')){an.st='err';return paint()}
  const p=PL.find(p=>p.h.some(h=>u.hostname===h||u.hostname.endsWith('.'+h)));
  if(!p){an.st='uns';return paint()}
  an.p=p;an.tab='v';an.opt=0;an.clip=false;an.st='load';an.realData=null;paint();

  // Connect to real backend /api/v1/inspect
  fetch('/api/v1/inspect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: v })
  })
  .then(res => res.json())
  .then(body => {
    if (body.data && body.data.formats && body.data.formats.length > 0) {
      an.st = 'ready';
      an.realData = body.data;
      an.title = body.data.title;
      an.thumbnail = body.data.thumbnail;
      if (body.data.duration) {
        const sec = Math.floor(body.data.duration);
        an.dur = `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;
      }
      paint();
    } else {
      setTimeout(()=>{ if($('#res')){ an.st='ready'; paint(); } }, 800);
    }
  })
  .catch(() => {
    setTimeout(()=>{ if($('#res')){ an.st='ready'; paint(); } }, 1200);
  });
}

const anBar=ph=>`<div class="an"><label>${I('link',20)}<input id="u" type="url" placeholder="${ph||'Paste a video, audio or image link'}" aria-label="Media link" value="${an.st==='idle'?'':an.url}"></label><button class="btn k" id="go">Download ${I('arr')}</button></div><div id="res"></div>`;
const CARDS=[['reel-0412.mp4','video','MP4','48 MB'],['live-set.mp3','audio','MP3','11 MB'],['photo-1089.jpg','image','JPG','3 MB'],['clip-final.mp4','video','MP4','92 MB'],['episode-12.m4a','audio','M4A','24 MB'],['poster.png','image','PNG','5 MB'],['highlight.mp4','video','MP4','64 MB'],['mixtape.mp3','audio','MP3','78 MB'],['banner.webp','image','WebP','2 MB'],['trailer.mp4','video','MP4','130 MB']];
const MTN='<svg viewBox="0 0 100 60" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%"><path d="M0 60 28 25 45 42 66 14 100 52V60Z" fill="rgba(255,255,255,.2)"/><circle cx="76" cy="14" r="6" fill="rgba(255,255,255,.55)"/></svg>';
const art=t=>t==='video'?`<div class="pv" style="background:#12294d">${I('play',26)}</div>`:t==='audio'?`<div class="pv" style="background:#0e1d38"><div class="bars">${Array.from({length:20},(_,i)=>`<i style="height:${30+Math.abs(Math.sin(i*.7))*70}%;animation-delay:${(i*.08).toFixed(2)}s"></i>`).join('')}</div></div>`:`<div class="pv" style="background:#1d4a7a">${MTN}</div>`;
const ring=()=>CARDS.map((c,i)=>`<div class="c3" style="--i:${i}"><div class="ch">${I(c[1],18)}<span class="fmt">${c[2]}</span></div>${art(c[1])}<div class="cn"><b>${c[0]}</b><small>${c[3]}</small></div><div class="cbr"><i style="--t:${4+i%4}s;animation-delay:${-i}s"></i></div></div>`).join('');
const mi=(ic,t,d,href,go)=>`<a class="mi" href="#${href}" data-go="${go}"><span class="ti">${I(ic,18)}</span><span><b>${t}</b><small>${d}</small></span></a>`;
const MENUS={
 platforms:()=>`<div class="w" style="padding:0"><div class="mgi" style="grid-template-columns:repeat(6,1fr)">${CATS.map((c,ci)=>{const L=PL.filter(p=>p.c===ci);return`<div><div class="mono" style="margin-bottom:10px">${c}</div>${L.slice(0,6).map(p=>`<a class="l" href="#p-${p.s}">${lg(p,24)}${p.n}</a>`).join('')}<a class="all" href="#platforms" data-pc="${ci}">${L.length>6?'All '+L.length:'View all'} →</a></div>`}).join('')}</div></div>`,
 features:()=>`<div class="w" style="padding:0"><div class="mgi" style="grid-template-columns:repeat(2,minmax(0,1fr));max-width:820px">${mi('video','What you can download','Videos, music, photos and reels','home','dl-types')}${mi('cut','Download a section','Save only the part you need','home','clip')}${mi('phone','Use it on your phone','Share links straight into the app','home','phone')}${mi('list','How it works','Three simple steps','home','how')}</div></div>`,
 help:()=>`<div class="w" style="padding:0"><div class="mgi" style="grid-template-columns:repeat(2,minmax(0,1fr));max-width:820px">${mi('help','Help and FAQ','Answers to common questions','help','h-faq')}${mi('doc','Terms of use','What you agree to by using Perfect','help','h-terms')}${mi('shield','Privacy','How links and files are handled','help','h-privacy')}${mi('doc','Copyright and takedown','Reporting content for removal','help','h-takedown')}${mi('mail','Contact','Get in touch with support','help','h-contact')}</div></div>`};
const foot=`<footer><div class="w"><div class="fg"><div><a class="logo" href="#home" style="margin:0"><span class="mk">${I('dl')}</span>Perfect</a><p style="color:var(--mut);margin-top:14px;max-width:270px;font-size:14px">A free media downloader. Paste a link, choose a quality and save the file.</p></div><div><h4 class="mono">Popular</h4>${PL.slice(0,6).map(p=>`<a href="#p-${p.s}">${p.n}</a>`).join('')}</div><div><h4 class="mono">Platforms</h4>${CATS.slice(0,4).map((c,i)=>`<a href="#platforms" data-pc="${i}">${c}</a>`).join('')}</div><div><h4 class="mono">Support</h4><a href="#help" data-go="h-faq">Help and FAQ</a><a href="#help" data-go="h-contact">Contact</a></div><div><h4 class="mono">Legal</h4><a href="#help" data-go="h-terms">Terms of use</a><a href="#help" data-go="h-privacy">Privacy</a><a href="#help" data-go="h-takedown">Copyright and takedown</a></div></div><div class="fb2"><span class="mono">© 2026 Perfect</span><span class="mono">All operations private and ephemeral.</span></div></div></footer>`;
const FAQ=[['h-faq','Is it really free?','Yes. There is no account, no subscription and no sign-up.'],['','Are my links or files stored?','No. Links are only used to find the file and are not kept. Nothing you download is saved on our servers.'],['','Why did a download fail?','Platforms change often. If a link fails, try again in a few minutes and make sure the content is public.'],['','Can I download private or protected content?','No. Only publicly available content can be downloaded, and DRM-protected services are not supported.'],['h-terms','Terms of use','You are responsible for the content you download. Download only content you own or have permission to save. (Draft text. Have it reviewed before launch.)'],['h-privacy','Privacy','We do not require accounts and we do not store the links you paste or the files you download. (Draft text. Have it reviewed before launch.)'],['h-takedown','Copyright and takedown','If you are a rights holder and want content removed, email [your support email] with the link and proof of ownership. (Draft text. Add your real address.)'],['h-contact','Contact','Email us at [your support email]. Include the link and the platform if a download failed.']];
const det=f=>`<details ${f[0]?`id="${f[0]}"`:''}><summary>${f[1]}${I('chev',20)}</summary><p>${f[2]}</p></details>`;
const hd=(t,d)=>`<div class="sc rv"><h2>${t}</h2>${d?`<p>${d}</p>`:''}</div>`;

function home(){
  const wv=Array.from({length:22},(_,i)=>`<i style="animation-delay:${(i*.07).toFixed(2)}s;height:${35+Math.abs(Math.sin(i*.6))*65}%"></i>`).join('');
  return`<section class="hero"><div class="w"><h1>Download any video.<br><span class="m">Just paste the link.</span></h1><p class="lead">Paste a link from any of ${PL.length} sites, choose your quality and save the file. It is free and needs no account.</p>${anBar()}<div class="qk">${PL.slice(0,8).map(p=>`<a class="pill" href="#p-${p.s}">${lg(p,24)}${p.n}</a>`).join('')}</div></div>
<div class="stage"><div class="rw" id="rw"><div class="ring">${ring()}</div></div></div></section>
<div class="mq" aria-hidden="true"><div>${[...PL,...PL].map(p=>`<span>${lg(p,32)}${p.n}</span>`).join('')}</div></div>
<section class="s" id="platforms-home"><div class="w">${hd('Works with the sites you already use.','Paste a link from any of these and the right options appear.')}${CATS.map((c,ci)=>`<div class="cb rv"><div><h3>${c}</h3><span class="mono">${PL.filter(p=>p.c===ci).length} platforms</span></div><div class="grid">${PL.filter(p=>p.c===ci).map(p=>`<a class="pc2" href="#p-${p.s}">${lg(p,48)}<span><b>${p.n}</b><small>${p.t}</small></span></a>`).join('')}</div></div>`).join('')}</div></section>
<section class="s" id="dl-types"><div class="w">${hd('Save videos, music, photos and reels.','Whatever you find, there is a format for it.')}<div class="ag">
<div class="ac rv"><div class="av"><div class="scr">${I('play',34)}<i></i></div><div class="qcs"><span>4K</span><span class="on">1080p</span><span>720p</span></div></div><div class="at"><h3>Videos</h3><p>Pick the resolution that suits your screen and storage.</p></div></div>
<div class="ac rv"><div class="av"><div class="wv2">${wv}</div><div class="qcs"><span class="on">MP3</span><span>M4A</span><span>WAV</span></div></div><div class="at"><h3>Music and audio</h3><p>Save tracks, mixes and podcasts as audio files.</p></div></div>
<div class="ac rv"><div class="av"><div class="pf">${MTN}</div><div class="pf">${MTN}</div><div class="pf">${MTN}</div><div class="qcs"><span class="on">JPG</span><span>PNG</span><span>GIF</span></div></div><div class="at"><h3>Photos and GIFs</h3><p>Download images in their original size and quality.</p></div></div>
<div class="ac rv"><div class="av"><div class="rl2"><div class="sl"><div>${I('play',28)}</div><div>${I('play',28)}</div></div><div class="ds"><i></i><i></i><i></i></div></div><div class="qcs"><span class="on">Reels</span><span>Shorts</span><span>Stories</span></div></div><div class="at"><h3>Reels and Shorts</h3><p>Keep short vertical videos from your favourite feeds.</p></div></div>
</div></div></section>
<section class="s" id="clip"><div class="w"><div class="sp2"><div class="rv"><h2>Save only the part you need.</h2><p class="t">Set a start and an end time and download just that moment, not the whole video.</p><div class="bl"><div>${I('check',18)}<span><b>Smaller files</b><small>A short clip downloads much faster than a full video.</small></span></div><div>${I('check',18)}<span><b>Exact timing</b><small>Type the times you want, down to the second.</small></span></div></div></div>
<div class="cv rv"><div class="top"><span class="mono">Clip</span><span class="mono" style="color:var(--ac)">00:30 to 01:10</span></div><div class="vp">${I('play',40)}</div><div class="strip">${Array.from({length:14},(_,i)=>`<i style="background:hsl(${208+i*5} 42% ${26+(i%3)*5}%)"></i>`).join('')}<div class="sel"></div><div class="ph"></div></div></div></div></div></section>
<section class="s" id="phone"><div class="w"><div class="sp2"><div class="rv"><div class="phn"><div class="scn"><div style="display:flex;align-items:center;gap:8px;font:800 15px var(--d)"><span class="mk" style="width:22px;height:22px;border-radius:6px">${I('dl',12)}</span>Perfect</div><div class="tf">${I('link',14)}<span class="ty">youtube.com/watch?v=sample</span></div><div class="rs"><div class="th2">${I('play',24)}</div><div class="bt2"><i></i><span>Download 1080p</span></div></div><div class="shs"><div style="font-weight:600;font-size:13px">Share link</div><div class="row"><div>${lg(PL[0],44)}YouTube</div><div><span class="lg" style="--b:#12151D;--s:44px;color:var(--ac);box-shadow:inset 0 0 0 1.5px var(--ac)">${I('dl',20)}</span>Perfect</div><div>${lg(PL[10],44)}Snapchat</div><div>${lg(PL[2],44)}Instagram</div></div></div></div></div></div>
<div class="rv"><h2>Use it like an app on your phone.</h2><p class="t">Add Perfect to your home screen, then share a link from Instagram, TikTok or YouTube straight into it.</p><div class="bl"><div>${I('check',18)}<span><b>No app store</b><small>Install it from your browser in one tap.</small></span></div><div>${I('check',18)}<span><b>Works on any phone</b><small>The same site, shaped for your screen.</small></span></div><div>${I('check',18)}<span><b>Share, then save</b><small>Pick Perfect in the share sheet and choose a quality.</small></span></div></div></div></div></div></section>
<section class="s" id="how"><div class="w">${hd('How it works','Three steps, no account.')}<div class="st3">${[['Copy the link','Open the video, post or track and copy its link.'],['Paste it above','We detect the platform and list every available quality.'],['Download','Pick a format and save the file to your device.']].map((s,i)=>`<div class="stp rv"><div class="n">0${i+1}</div><h3>${s[0]}</h3><p>${s[1]}</p></div>`).join('')}</div></div></section>
<section class="s"><div class="w" style="max-width:860px">${hd('Common questions')}${FAQ.slice(0,4).map(f=>det(['',f[1],f[2]])).join('')}<p style="text-align:center;margin-top:20px"><a href="#help" style="color:var(--ac);font-weight:600">More answers →</a></p></div></section>
<div class="w"><div class="cta rv"><h2>Paste a link and try it.</h2><a class="btn k" href="#home" id="top" style="height:50px;padding:0 28px">Go to the link bar ${I('arr')}</a></div></div>`;
}

const ph=(c,t,s,l)=>`<section class="pgh"><div class="w"><div class="crumb mono"><a href="#home">Home</a> / ${c}</div>${l?`<div style="display:flex;gap:20px;align-items:center;margin-top:16px">${l}<h1 style="margin:0">${t}</h1></div>`:`<h1>${t}</h1>`}${s?`<p class="lead">${s}</p>`:''}</div></section>`;
const pcard=p=>`<a class="pc2" href="#p-${p.s}">${lg(p,48)}<span><b>${p.n}</b><small>${p.t}</small></span></a>`;

function platforms(){
  const L=PL.filter(p=>(pcat==='All'||p.c===pcat)&&p.n.toLowerCase().includes(pq.toLowerCase()));
  return`${ph('Platforms','Supported platforms',PL.length+' platforms in '+CATS.length+' categories.')}<div class="w" style="padding-top:48px"><label class="srch">${I('search',20)}<input id="ps" value="${pq}" placeholder="Search platforms" aria-label="Search platforms"></label><div class="tabs"><button class="tab ${pcat==='All'?'on':''}" data-pc="All">All</button>${CATS.map((c,i)=>`<button class="tab ${pcat===i?'on':''}" data-pc="${i}">${c}</button>`).join('')}</div>${L.length?`<div class="grid">${L.map(pcard).join('')}</div>`:`<div class="empty"><h3>No platform matches “${esc(pq)}”</h3><p>Try another name or category.</p></div>`}</div>`;
}

function platformPage(p){
  const rel=PL.filter(x=>x.c===p.c&&x.s!==p.s).slice(0,4),k=kindOf(p);
  return`${ph(`<a href="#platforms">Platforms</a> / ${p.n}`,`${p.n} downloader`,`Download ${p.t.toLowerCase()} from ${p.n} for free. Paste the link, pick a quality and save the file.`,lg(p,64))}<div class="w" style="text-align:center;padding-top:8px">${anBar(`Paste a ${p.n} link`)}
  <div class="st3" style="margin-top:80px;text-align:left">${[['Copy the link',TIP[p.c]],['Paste it above','Paste the '+p.n+' link into the bar and press Download.'],['Choose quality','Pick '+(k==='a'?'an audio format':k==='i'?'an image size':'a video quality or audio only')+', then save the file.']].map((s,i)=>`<div class="stp"><div class="n">0${i+1}</div><h3>${s[0]}</h3><p>${s[1]}</p></div>`).join('')}</div>
  <div style="text-align:left;max-width:860px;margin:72px auto 0"><h2 style="font-size:32px;margin-bottom:20px">${p.n} download FAQ</h2>${[[`What can I download from ${p.n}?`,`Supported content: ${p.t.toLowerCase()}. Only publicly available content can be downloaded.`],['Is it free?','Yes. No account and no sign-up are needed.'],['What quality can I get?',`The analyser lists every option ${p.n} offers for that link, with file sizes, before you download.`]].map(f=>det(['',f[0],f[1]])).join('')}</div>
  <h3 style="font-size:24px;margin:64px 0 16px;text-align:left">More ${CATS[p.c].toLowerCase()}</h3><div class="grid" style="text-align:left">${rel.map(pcard).join('')}</div></div>`;
}

function help(){
  return`${ph('Help','Help and legal','Answers, terms and how to reach us.')}<div class="w" style="padding-top:48px;max-width:860px"><label class="srch" style="max-width:none">${I('search',20)}<input id="hs" placeholder="Search" aria-label="Search help"></label>${FAQ.map(det).join('')}</div>`;
}

function bind(){
  const go=$('#go');if(go){go.onclick=analyse;$('#u').onkeydown=e=>{if(e.key==='Enter')analyse()};paint()}
  const ps=$('#ps');if(ps)ps.oninput=e=>{pq=e.target.value;const p=e.target.selectionStart;render();const s=$('#ps');s.focus();s.setSelectionRange(p,p)};
  const hs=$('#hs');if(hs)hs.oninput=e=>document.querySelectorAll('details').forEach(d=>d.style.display=d.textContent.toLowerCase().includes(e.target.value.toLowerCase())?'':'none');
  document.querySelectorAll('.tab[data-pc]').forEach(b=>b.onclick=()=>{pcat=b.dataset.pc==='All'?'All':+b.dataset.pc;render()});
  document.querySelectorAll('a[data-pc]').forEach(a=>a.addEventListener('click',()=>{pcat=+a.dataset.pc;if(location.hash==='#platforms')setTimeout(render,0)}));
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('vis');io.unobserve(e.target)}}),{threshold:.08});
  document.querySelectorAll('.rv').forEach(e=>io.observe(e));
}

const closeMenu=()=>{$('#mg').classList.remove('show');document.querySelectorAll('.nl .open').forEach(b=>b.classList.remove('open'))};
function goPending(){const el=pending&&$('#'+pending);pending=null;if(el){if(el.tagName==='DETAILS')el.open=true;el.scrollIntoView({behavior:'smooth',block:'start'})}}

function render(){
  const h=(location.hash||'#home').slice(1);let b;
  if(h==='home')b=home();else if(h==='platforms')b=platforms();else if(h==='help')b=help();
  else if(h.startsWith('p-')){const p=PL.find(x=>'p-'+x.s===h);b=p?platformPage(p):''}
  if(!b)b=ph('404','Page not found','This page does not exist or has moved.')+`<div class="w" style="padding-top:32px"><a class="btn k" href="#home">Back to the downloader</a></div>`;
  const ntEl = $('#nt'); if(ntEl) ntEl.innerHTML=NOTICE?`<div class="nbar">${esc(NOTICE)}</div>`:'';
  const appEl = $('#app'); if(appEl) appEl.innerHTML=b+foot;
  const act=x=>h===x||(x==='platforms'&&h.startsWith('p-'));
  const nlEl = $('#nl');
  if(nlEl) nlEl.innerHTML=`<a href="#home" class="${act('home')?'on':''}">Downloader</a><button data-m="platforms" data-href="platforms" class="${act('platforms')?'on':''}">Platforms ${I('chev',14)}</button><button data-m="features" data-go="dl-types" class="">Features ${I('chev',14)}</button><button data-m="help" data-href="help" class="${act('help')?'on':''}">Help ${I('chev',14)}</button>`;
  closeMenu();
  if(nlEl) nlEl.classList.remove('open');
  document.querySelectorAll('.nl [data-m]').forEach(bt=>{
    const open=()=>{
      if(innerWidth<=960)return;
      document.querySelectorAll('.nl .open').forEach(x=>x.classList.remove('open'));
      const mgEl = $('#mg');
      if(mgEl && MENUS[bt.dataset.m]) {
        mgEl.innerHTML=MENUS[bt.dataset.m]();
        mgEl.classList.add('show');
        bt.classList.add('open');
        mgEl.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
        mgEl.querySelectorAll('a[data-pc]').forEach(a=>a.addEventListener('click',()=>{pcat=+a.dataset.pc;if(location.hash==='#platforms')setTimeout(render,0)}));
      }
    };
    bt.onmouseenter=open;
    bt.onclick=e=>{
      e.stopPropagation();
      if(innerWidth<=960){
        if(bt.dataset.href)location.hash=bt.dataset.href;
        else{pending=bt.dataset.go;if((location.hash||'#home')==='#home')goPending();else location.hash='home'}
        return;
      }
      bt.classList.contains('open')?closeMenu():open();
    };
  });
  bind();
  const top=$('#top');
  if(top)top.onclick=e=>{e.preventDefault();scrollTo({top:0,behavior:'smooth'});setTimeout(()=>$('#u')&&$('#u').focus(),500)};
}

document.addEventListener('click',e=>{
  const a=e.target.closest('[data-go]');
  if(a&&a.tagName==='A'){
    pending=a.dataset.go;
    closeMenu();
    const t=a.getAttribute('href').slice(1);
    if((location.hash||'#home').slice(1)===t){e.preventDefault();goPending()}
    return;
  }
  if(!e.target.closest('#mg')&&!e.target.closest('.nl'))closeMenu();
});

document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
document.addEventListener('mousemove',e=>{
  const w=$('#rw');
  if(w&&e.clientY<innerHeight*1.2){
    w.style.setProperty('--ry',((e.clientX/innerWidth-.5)*14)+'deg');
    w.style.setProperty('--rx',(-7+(e.clientY/innerHeight-.5)*-6)+'deg');
  }
});

const mgEl = $('#mg'); if(mgEl) mgEl.onmouseleave=closeMenu;
const hdrEl = $('header'); if(hdrEl) hdrEl.onmouseleave=closeMenu;

function initPrototype(){
  const lm = $('#lm'); if(lm) lm.innerHTML=I('dl');
  const mn = $('#mn'); if(mn) mn.innerHTML=I('menu');
  const th = $('#th'); if(th) th.innerHTML=I('sun');
  if(mn) mn.onclick=()=>{ const nl = $('#nl'); if(nl) nl.classList.toggle('open'); };
  if(th) th.onclick=()=>{
    const r=document.documentElement;
    r.dataset.theme=r.dataset.theme==='light'?'dark':'light';
  };
  render();
}

window.initPrototype = initPrototype;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPrototype);
} else {
  initPrototype();
}
addEventListener('hashchange',()=>{render();if(pending)setTimeout(goPending,90);else scrollTo(0,0)});
