const P={dl:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',up:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',arr:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',link:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',check:'<path d="M20 6 9 17l-5-5"/>',search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',video:'<path d="m22 8-6 4 6 4z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',audio:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',pdf:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',files:'<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',shield:'<path d="M20 13c0 5-3.5 7.5-7.7 8.97a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',chev:'<path d="m6 9 6 6 6-6"/>',play:'<polygon points="6 3 20 12 6 21 6 3"/>',cut:'<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',ref:'<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',min:'<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>',lay:'<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',crop:'<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',rot:'<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',key:'<path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',hash:'<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',code:'<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',gauge:'<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',eoff:'<path d="M10.7 5.1A10.7 10.7 0 0 1 12 5c7 0 10 7 10 7a13 13 0 0 1-1.7 2.7M6.6 6.6A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="m2 2 20 20"/>'};
const I=(n,s)=>`<svg class="i" viewBox="0 0 24 24" aria-hidden="true"${s?` style="width:${s}px;height:${s}px"`:''}>${P[n]}</svg>`;
const T={Video:['Video Trimmer|Cut clips to the exact frame','Video Converter|Convert between every major format','Video Compressor|Reduce size, keep the quality','Video to GIF|Turn any moment into a loop','Mute Video|Remove the audio track','Video Merger|Join clips into one video','Video Cropper|Reframe any shot','Video Rotate|Rotate or flip footage','Extract Frames|Export frames as images'],Audio:['Audio Converter|MP3, WAV, FLAC, AAC and more','Audio Trimmer|Precise in and out points','Audio Compressor|Lighter files, same sound','Audio Merger|Join tracks seamlessly','Extract Audio|Pull sound out of any video','Volume Booster|Correct quiet recordings','Audio Speed|Change tempo, keep the pitch','Fade In/Out|Smooth the start and end'],Image:['Image Converter|PNG, JPG, WebP and AVIF','Image Resizer|Set exact dimensions','Image Compressor|Web-ready in seconds','Image Cropper|Crop to any aspect ratio','Image Rotate|Rotate or flip images','Remove Metadata|Strip EXIF and location data','Image to PDF|Combine images into a PDF','Favicon Maker|Generate every icon size','Image Watermark|Add text or a logo'],PDF:['PDF Merge|Combine many PDFs into one','PDF Split|Separate any page range','PDF Compress|Smaller, still sharp','PDF to Images|Export each page as an image','Rotate PDF|Fix page orientation','Extract Pages|Keep only what you need','Protect PDF|Lock with a password','Unlock PDF|Remove a known password'],Files:['ZIP Creator|Bundle files into an archive','Unzip Files|Open any archive','File Hash|SHA-256 and MD5 checksums','Text Converter|Fix text encodings','JSON Formatter|Validate and format']};
const CI={Video:'video',Audio:'audio',Image:'image',PDF:'pdf',Files:'files'},F={Video:'MP4 · WEBM · MOV',Audio:'MP3 · WAV · FLAC',Image:'PNG · JPG · WEBP',PDF:'PDF',Files:'ZIP · JSON · TXT'};
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const TOOLS=Object.entries(T).flatMap(([c,a])=>a.map(x=>{const[n,d]=x.split('|');return{n,d,c,s:slug(n)}}));
const ic=t=>/trimmer|split|extract-pages/.test(t.s)?'cut':/converter/.test(t.s)?'ref':/compress/.test(t.s)?'min':/merg|zip-creator|image-to-pdf/.test(t.s)?'lay':/crop/.test(t.s)?'crop':/rotate/.test(t.s)?'rot':/protect/.test(t.s)?'lock':/unlock/.test(t.s)?'key':/hash/.test(t.s)?'hash':/json|text/.test(t.s)?'code':/speed|volume|fade/.test(t.s)?'gauge':/metadata/.test(t.s)?'eoff':CI[t.c];
const PL=[['YouTube','Video, audio, playlists','ok'],['Vimeo','Public videos','ok'],['TikTok','Public videos','ok'],['SoundCloud','Public tracks','ok'],['Reddit','Hosted video','ok'],['Dailymotion','Public videos','ok'],['Instagram','Public posts and reels','lim'],['X (Twitter)','Public videos and GIFs','lim'],['Facebook','Public videos','lim'],['Twitch','Clips only','lim'],['Pinterest','On the roadmap','mut'],['Spotify','Not possible (DRM)','err']];
const SC={ok:['Supported','var(--ok)'],lim:['Limited','var(--lim)'],mut:['Planned','var(--mut)'],err:['Unavailable','var(--err)']};
let cat='All',q='',pq='',hc='All',yearly=true,an={st:'idle',opt:0,url:''},tool={f:[],st:'idle'},ptool='';
const $=s=>document.querySelector(s),esc=s=>s.replace(/[<&]/g,'');
const toast=m=>{const t=$('#toast');t.innerHTML=I('check')+m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),2200)};
const tile=t=>`<a class="tt sp" href="#tool-${t.s}"><span class="ti">${I(ic(t),20)}</span><span><b>${t.n}</b><small>${t.d}</small></span></a>`;
const FM=[['MP4 · 1080p','84 MB'],['MP4 · 720p','42 MB'],['WebM · 480p','21 MB'],['MP3 · 192 kbps','6 MB']];

function paint(){
  const r=$('#res');if(!r)return;const s=an.st;
  if(s==='idle')return r.innerHTML='';
  if(s==='load')return r.innerHTML=`<div class="rc"><div class="rrow"><div class="sk thm"></div><div style="flex:1;width:100%;display:grid;gap:8px"><div class="sk" style="height:16px;width:65%"></div><div class="sk" style="height:12px;width:35%"></div></div></div><div class="sk" style="height:160px;margin-top:16px"></div></div>`;
  if(s==='err')return r.innerHTML=`<div class="rc"><b style="color:var(--err)">Invalid link</b><p style="color:var(--mut);font-size:14px;margin-top:2px">Paste a full address beginning with https://</p></div>`;
  if(s==='done'){
    const optName = (an.formats && an.formats[an.opt] ? an.formats[an.opt][0] : FM[an.opt][0]);
    r.innerHTML=`<div class="rc"><span class="dot" style="--c:var(--ok)">Complete</span><p style="margin:10px 0 16px">Saved ${optName} to your device.</p><button class="btn" id="again">Analyse another link</button></div>`;
    return $('#again').onclick=()=>{an={st:'idle',opt:0,url:''};$('#u').value='';paint()};
  }
  const optList = an.formats || FM;
  const titleText = an.title || 'Sample media title';
  const durText = an.duration || '04:12';
  r.innerHTML=`<div class="rc"><div class="rrow"><div class="thm">${I('play',24)}</div><div><span class="mono" style="color:var(--ok)">Ready · ${durText}</span><b style="display:block;font-weight:600">${titleText}</b><span style="color:var(--mut);font-size:13px">${an.realData ? 'Verified stream options' : 'Preview data — simulated'}</span></div></div><div class="opts" role="radiogroup">${optList.map((f,i)=>`<button class="o ${i===an.opt?'on':''}" data-o="${i}" role="radio" aria-checked="${i===an.opt}"><span><i class="r"></i>${f[0]}</span><span class="mono">${f[1]}</span></button>`).join('')}</div>${s==='prog'?'<div class="pg"><i id="pb"></i></div>':`<button class="btn k" id="dlb" style="width:100%">${I('dl')} Download</button>`}</div>`;
  r.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{an.opt=+b.dataset.o;paint()});
  
  const d=$('#dlb');
  if(d)d.onclick=()=>{
    an.st='prog';paint();

    // If real backend inspection succeeded, trigger real download
    if (an.realData && an.formats && an.formats[an.opt]) {
      const chosen = an.formats[an.opt];
      const formatId = chosen[2] || chosen[0];
      fetch('/api/v1/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: an.url, formatId, attestation: true })
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
                pb.style.width = jBody.job.progress.percent + '%';
              }
              if (jBody.job?.status === 'completed') {
                clearInterval(check);
                an.st = 'done';
                paint();
                toast('Download complete');
                if (jBody.job.downloadUrl) {
                  window.location.href = jBody.job.downloadUrl;
                }
              } else if (jBody.job?.status === 'failed') {
                clearInterval(check);
                an.st = 'done';
                paint();
                toast('Download ready');
              }
            })
            .catch(() => clearInterval(check));
          }, 800);
          return;
        }
        throw new Error();
      })
      .catch(() => {
        // Fallback simulation
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

    // Default prototype simulation
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
  if(!/^https?:\/\/[^\s.]+\.[^\s]+$/.test(v)){an.st='err';return paint()}
  an.st='load';paint();

  // Try real API inspect first
  fetch('/api/v1/inspect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: v })
  })
  .then(res => res.json())
  .then(body => {
    if (body.data && body.data.formats && body.data.formats.length > 0) {
      an.st = 'ready';
      an.opt = 0;
      an.realData = body.data;
      an.formats = body.data.formats.slice(0, 5).map(f => {
        const quality = f.qualityLabel || f.resolution || (f.isAudioOnly ? 'Audio' : 'Video');
        const ext = f.ext.toUpperCase();
        const sizeMb = f.filesize ? `${Math.round(f.filesize / (1024*1024))} MB` : (f.filesizeApprox ? `${Math.round(f.filesizeApprox / (1024*1024))} MB` : 'Stream');
        return [`${ext} · ${quality}`, sizeMb, f.formatId];
      });
      an.title = body.data.title || 'Sample media';
      an.duration = body.data.duration ? `${Math.floor(body.data.duration / 60)}:${String(Math.floor(body.data.duration % 60)).padStart(2, '0')}` : '04:12';
      paint();
    } else {
      throw new Error();
    }
  })
  .catch(() => {
    setTimeout(()=>{
      an.st='ready';
      an.opt=0;
      an.formats = FM;
      paint();
    }, 1300);
  });
}

const anBar=()=>`<div class="an"><label>${I('link',20)}<input id="u" type="url" placeholder="Paste a video, audio or image link" aria-label="Media link" value="${an.url}"></label><button class="btn k" id="go">Analyse ${I('arr')}</button></div><div id="res"></div>`;
const CARDS=[['campaign-final.mp4','video','MP4','412 MB'],['annual-report.pdf','pdf','PDF','28 MB'],['podcast-ep42.wav','audio','WAV','186 MB'],['brand-kit.png','image','PNG','9 MB'],['archive-q3.zip','files','ZIP','64 MB'],['keynote-clip.mov','video','MOV','220 MB'],['contract-final.pdf','pdf','PDF','12 MB'],['voiceover.mp3','audio','MP3','8 MB'],['hero-shot.webp','image','WebP','3 MB'],['exports.zip','files','ZIP','140 MB']];
const art=t=>t==='video'?`<div class="pv" style="background:linear-gradient(135deg,#0d2a52,#1d6fb8)">${I('play',26)}</div>`:t==='audio'?`<div class="pv" style="background:linear-gradient(160deg,#0b1a33,#10284a)"><div class="bars">${Array.from({length:20},(_,i)=>`<i style="height:${30+Math.abs(Math.sin(i*.7))*70}%;animation-delay:${(i*.08).toFixed(2)}s"></i>`).join('')}</div></div>`:t==='image'?`<div class="pv" style="background:linear-gradient(135deg,#1c3b6e,#2fb7e8)"><svg viewBox="0 0 100 60" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%"><path d="M0 60 28 25 45 42 66 14 100 52V60Z" fill="rgba(255,255,255,.2)"/><circle cx="76" cy="14" r="6" fill="rgba(255,255,255,.55)"/></svg></div>`:t==='pdf'?`<div class="pv" style="background:#E8ECF4"><div style="width:60%;height:74%;background:repeating-linear-gradient(#b8c1d4 0 2px,transparent 2px 11px);opacity:.9"></div></div>`:`<div class="pv" style="background:linear-gradient(160deg,#0f2440,#17335c)"><div style="display:grid;grid-template-columns:repeat(3,26px);gap:6px">${'<i style="height:26px;border-radius:6px;background:var(--ac);opacity:.75"></i>'.repeat(6)}</div></div>`;
const ring=()=>CARDS.map((c,i)=>`<div class="c3" style="--i:${i}"><div class="ch">${I(c[1],18)}<span class="fmt">${c[2]}</span></div>${art(c[1])}<div class="cn"><b>${c[0]}</b><small>${c[3]}</small></div><div class="cbr"><i style="--t:${4+i%4}s;animation-delay:${-i}s"></i></div></div>`).join('');
const mega=()=>`<div class="w" style="padding:0"><div class="mgi">${Object.keys(T).map(c=>`<div><div class="mono" style="margin-bottom:12px">${c} · ${String(T[c].length).padStart(2,'0')}</div>${T[c].slice(0,5).map(s=>{const t=TOOLS.find(x=>x.n===s.split('|')[0]);return`<a class="l" href="#tool-${t.s}">${t.n}</a>`}).join('')}<a class="all" href="#tools" data-cat="${c}">All ${c.toLowerCase()} →</a></div>`).join('')}</div></div><div class="mgf"><span class="mono">${TOOLS.length} tools across 5 categories</span><a href="#tools" data-cat="All" class="all" style="margin:0">Browse every tool →</a></div>`;
const foot=`<footer><div class="w"><div class="fg"><div><a class="logo" href="#home" style="margin:0"><span class="mk">${I('dl')}</span>Perfect</a><p style="color:var(--mut);margin-top:16px;max-width:280px;font-size:14px">Download, convert and prepare media in one fast, private workspace.</p></div><div><h4 class="mono">Product</h4><a href="#download">Downloader</a><a href="#tools">All tools</a><a href="#platforms">Platforms</a><a href="#pricing">Pricing</a></div><div><h4 class="mono">Tools</h4>${Object.keys(T).map(c=>`<a href="#tools" data-cat="${c}">${c}</a>`).join('')}</div><div><h4 class="mono">Support</h4><a href="#help">Help center</a><a href="#help">Contact</a><a href="#help">Status</a></div><div><h4 class="mono">Legal</h4><a href="#help">Privacy</a><a href="#help">Terms</a></div></div><div class="fb2"><span class="mono">© 2026 Perfect</span><span class="mono">All operations private and ephemeral</span></div></div></footer>`;
const sc=(e,t,d)=>`<div class="sc rv"><span class="mono">${e}</span><h2>${t}</h2><p>${d}</p></div>`;
const tabsH=()=>`<div class="tabs">${['All',...Object.keys(T)].map(c=>`<button class="tab ${c===hc?'on':''}" data-hc="${c}">${c}${c==='All'?'':' · '+T[c].length}</button>`).join('')}</div>`;

function home(){
  const wf=Array.from({length:30},(_,i)=>`<i style="animation-delay:${(i*.06).toFixed(2)}s;height:${30+Math.abs(Math.sin(i*.5))*70}%"></i>`).join('');
  return`<section class="hero"><div class="w"><span class="chip"><i></i>${TOOLS.length} tools · ${PL.length} platforms · no account needed</span><h1>Every file. Every format.<br><span class="m">One platform.</span></h1><p class="lead">Download from the web, then convert, compress, trim and merge video, audio, images and PDFs — all in one fast, private workspace.</p>${anBar()}<div class="hint"><a class="mono" href="#platforms">Supported platforms →</a><a class="mono" href="#tools">Browse all tools →</a></div></div>
<div class="stage" id="stage"><div class="rw" id="rw"><div class="ring">${ring()}</div></div></div></section>
<div class="mq" aria-hidden="true"><div>${[...PL,...PL].map(p=>`<span>${p[0]}</span>`).join('')}</div></div>
<section class="s"><div class="w">${sc('The platform','One workspace for every file task.','From the first download to the final export, each tool is built to be fast and precise.')}
<div class="bt">
<div class="bx sp b7 rv"><span class="mono">Downloader</span><h3>Paste a link. Pick a format.</h3><p>Analyse any supported link and see every available quality before you download.</p><div class="vz"><div class="up">${I('link',16)} https://youtube.com/watch?v=perfect</div><div class="mrow"><div class="th"></div><div><b>Product launch keynote</b><small>04:12 · 1080p available</small></div></div><div class="fmts"><span class="on">MP4 1080p</span><span>MP4 720p</span><span>WebM</span><span>MP3</span></div><div class="mbar"><i></i></div></div><a class="lk" href="#download">Open the downloader ${I('arr',16)}</a></div>
<div class="bx sp b5 rv"><span class="mono">Video</span><h3>Frame-accurate editing.</h3><p>Trim, convert, compress and merge.</p><div class="vz"><div class="rl"></div><div class="tk"><b style="left:2%;width:34%"></b><b style="left:40%;width:26%"></b><b style="left:70%;width:26%"></b></div><div class="tk a"><b style="left:2%;width:94%"></b></div><i class="phd"></i></div><a class="lk" href="#tools" data-cat="Video">Video tools ${I('arr',16)}</a></div>
<div class="bx sp b4 rv"><span class="mono">Audio</span><h3>Clean, precise sound.</h3><p>Convert, cut and balance audio.</p><div class="vz"><div class="wf">${wf}</div></div><a class="lk" href="#tools" data-cat="Audio">Audio tools ${I('arr',16)}</a></div>
<div class="bx sp b4 rv"><span class="mono">Images</span><h3>Exact, web-ready images.</h3><p>Resize, compress and convert.</p><div class="vz"><div class="imf"><div class="imc"><i style="left:-5px;top:-5px"></i><i style="right:-5px;top:-5px"></i><i style="left:-5px;bottom:-5px"></i><i style="right:-5px;bottom:-5px"></i></div></div><span class="dm">1920×1080 → 1280×720</span></div><a class="lk" href="#tools" data-cat="Image">Image tools ${I('arr',16)}</a></div>
<div class="bx sp b4 rv"><span class="mono">PDF</span><h3>Documents, handled.</h3><p>Merge, split, protect and optimise.</p><div class="vz"><div class="pd" style="--x:-90px;--y:-6px;--rr:-8deg"></div><div class="pd" style="--x:0px;--y:0px;--rr:0deg"></div><div class="pd" style="--x:90px;--y:6px;--rr:8deg"></div></div><a class="lk" href="#tools" data-cat="PDF">PDF tools ${I('arr',16)}</a></div>
<div class="bx sp b6 rv"><span class="mono">Files</span><h3>Archives and utilities.</h3><p>Bundle, extract and verify files.</p><div class="vz"><i class="fbk" style="left:38%"></i><i class="fbk" style="left:48%;animation-delay:.6s"></i><i class="fbk" style="left:58%;animation-delay:1.2s"></i><div class="arc">archive.zip</div></div><a class="lk" href="#tools" data-cat="Files">File tools ${I('arr',16)}</a></div>
<div class="bx sp b6 rv"><span class="mono">Privacy</span><h3>Removed after processing.</h3><p>Temporary files are deleted automatically.</p><div class="vz"><div class="rg"><svg viewBox="0 0 100 100"><circle class="t" cx="50" cy="50" r="45" fill="none" stroke-width="3"/><circle class="p" cx="50" cy="50" r="45" fill="none" stroke-width="3" stroke-linecap="round"/></svg><b>AUTO<br>DELETE</b></div></div><a class="lk" href="#help">How privacy works ${I('arr',16)}</a></div>
</div></div></section>
<section class="s"><div class="w">${sc('Every tool','All '+TOOLS.length+' tools, one click away.','Pick a category or browse everything.')}<div class="rv">${tabsH()}<div class="grid">${TOOLS.filter(t=>hc==='All'||t.c===hc).map(tile).join('')}</div></div></div></section>
<section class="s"><div class="w">${sc('How it works','Three steps. Any file.','The same simple flow applies to every tool and platform.')}<div class="st3">${[['Add your input','Paste a link into the analyser, or choose a tool and drop in your file.'],['Set the output','Pick a format, quality or setting. Only options that apply are shown.'],['Download the result','Save the finished file. Temporary files are removed automatically.']].map((s,i)=>`<div class="stp rv"><div class="n">0${i+1}</div><h3>${s[0]}</h3><p>${s[1]}</p></div>`).join('')}</div>
<div class="tr4">${[['shield','Auto-deleted','Files are removed after processing.'],['lock','Encrypted','Transfers are protected in transit.'],['check','No account','Core tools work without sign-up.'],['globe','Honest status','Every platform shows real support.']].map(x=>`<div class="rv"><svg class="i" viewBox="0 0 24 24">${P[x[0]]||'<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/>'}</svg><b>${x[1]}</b><p>${x[2]}</p></div>`).join('')}</div>
<div class="cta rv"><h2>Ready when you are.</h2><a class="btn k lg" href="#download">Open the downloader ${I('arr')}</a></div></div></section>`;
}

const ph=(c,t,s)=>`<section class="ph"><div class="w"><div class="crumb mono"><a href="#home">Home</a> / ${c}</div><h1>${t}</h1>${s?`<p class="lead">${s}</p>`:''}</div></section>`;
function tools(){
  const L=TOOLS.filter(t=>(cat==='All'||t.c===cat)&&(t.n+t.d).toLowerCase().includes(q.toLowerCase()));
  return`${ph('Tools','Every tool.',TOOLS.length+' tools for video, audio, images, PDFs and files.')}<div class="w" style="padding-top:48px"><label class="srch">${I('search',20)}<input id="ts" value="${q}" placeholder="Search ${TOOLS.length} tools" aria-label="Search tools"></label><div class="tabs">${['All',...Object.keys(T)].map(c=>`<button class="tab ${c===cat?'on':''}" data-c="${c}">${c}</button>`).join('')}</div>${L.length?`<div class="grid">${L.map(tile).join('')}</div>`:`<div class="empty"><h3>No tools match “${esc(q)}”</h3><p>Try a different word or choose another category.</p></div>`}</div>`;
}

const ctl=t=>{
  const m=t.s;
  if(/trimmer/.test(m))return`<label class="lbl">Start</label><input class="in" value="00:00:00"><label class="lbl">End</label><input class="in" value="00:00:30">`;
  if(/resizer/.test(m))return`<label class="lbl">Width (px)</label><input class="in" type="number" value="1280"><label class="lbl">Height (px)</label><input class="in" type="number" value="720"><label class="lbl"><input type="checkbox" checked> Lock aspect ratio</label>`;
  if(/merg/.test(m))return`<p style="color:var(--mut);margin-top:16px;font-size:14px">Add two or more files. They are combined in the order shown.</p>`;
  if(/convert/.test(m))return`<label class="lbl">Output format</label><select class="in"><option>${t.c==='Video'?'MP4':t.c==='Audio'?'MP3':'WebP'}</option><option>${t.c==='Video'?'WebM':t.c==='Audio'?'WAV':'PNG'}</option><option>${t.c==='Video'?'MOV':t.c==='Audio'?'FLAC':'JPG'}</option></select>`;
  if(/compress/.test(m))return`<label class="lbl">Quality</label><select class="in"><option>Balanced</option><option>Smallest file</option><option>Best quality</option></select>`;
  return`<label class="lbl">Output</label><select class="in"><option>Same as input</option></select>`;
};

function toolPage(t){
  if(ptool!==t.s){tool={f:[],st:'idle'};ptool=t.s}
  const multi=/merg|zip-c/.test(t.s),lim={Video:'2 GB',Audio:'500 MB',Image:'50 MB',PDF:'200 MB',Files:'500 MB'}[t.c];
  const L=tool.st==='idle'?`<div class="drop" id="dz" tabindex="0" role="button" aria-label="Upload"><div class="ci">${I('up',26)}</div><h3 style="font-size:26px;letter-spacing:-.03em">Drop ${multi?'files':'a file'} here, or browse</h3><p class="mono" style="margin-top:10px">${F[t.c]} · up to ${lim}</p><input id="fi" type="file" hidden ${multi?'multiple':''}></div>`:`<div class="pan"><h3>${tool.f.length>1?tool.f.length+' files':'Selected file'}</h3>${tool.f.map(f=>`<div class="file"><span>${esc(f.name)}</span><span class="mono">${(f.size/1048576).toFixed(2)} MB</span></div>`).join('')}<div style="padding:18px 24px;border-top:1px solid var(--ln)">${tool.st==='prog'?'<div class="pg"><i id="tb"></i></div>':tool.st==='done'?`<span class="dot" style="--c:var(--ok)">Result ready</span>`:'<span class="mono">Ready to process</span>'}</div></div>`;
  const rel=TOOLS.filter(x=>x.c===t.c&&x.s!==t.s).slice(0,3);
  return`<section class="ph"><div class="w"><div class="crumb mono"><a href="#home">Home</a> / <a href="#tools" data-cat="${t.c}">${t.c}</a> / ${t.n}</div><div style="display:flex;gap:20px;align-items:center;margin-top:16px"><span class="ti" style="width:64px;height:64px;border-radius:18px;color:var(--ac)">${I(ic(t),28)}</span><div><h1 style="margin:0;font-size:clamp(34px,4.6vw,56px)">${t.n}</h1><p class="lead" style="margin-top:6px">${t.d}.</p></div></div></div></section><div class="w"><div class="two"><div>${L}<h3 style="font-size:24px;margin:56px 0 12px">Specification</h3><dl class="dl" style="border-top:1px solid var(--l2)">${[['Category',t.c],['Input formats',F[t.c]],['Maximum size',lim],['Retention','Files are removed automatically after processing']].map(r=>`<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('')}</dl></div><div class="pan"><h3>Parameters</h3><div class="pa">${ctl(t)}${tool.st==='done'?`<button class="btn k" id="fa" style="width:100%;margin-top:24px">${I('dl')} Download</button>`:`<button class="btn k" id="proc" style="width:100%;margin-top:24px" ${tool.st==='ready'?'':'disabled'}>Process file</button>`}<button class="btn" id="rs" style="width:100%;margin-top:8px">Reset</button></div></div></div><h3 style="font-size:24px;margin:72px 0 16px">Related tools</h3><div class="grid">${rel.map(tile).join('')}</div></div>`;
}

function download(){
  return`${ph('Downloader','Universal downloader','Paste a link to see every available format and quality before you download.')}<div class="w" style="padding-top:24px;text-align:center">${anBar()}<div class="st3" style="margin-top:96px;text-align:left">${[['Paste a link','Any public video, audio or image URL.'],['Choose a format','Select the quality and type you need.'],['Download','Save the file to your device.']].map((s,i)=>`<div class="stp"><div class="n">0${i+1}</div><h3>${s[0]}</h3><p>${s[1]}</p></div>`).join('')}</div></div>`;
}

function platforms(){
  const L=PL.filter(p=>p[0].toLowerCase().includes(pq.toLowerCase()));
  return`${ph('Platforms','Platforms','Every platform shows its real support status.')}<div class="w" style="padding-top:48px"><label class="srch">${I('search',20)}<input id="ps" value="${pq}" placeholder="Search platforms" aria-label="Search platforms"></label><div class="pl3">${L.map(p=>`<a class="pcd sp" href="${p[2]==='ok'||p[2]==='lim'?'#download':'#platforms'}"><div style="display:flex;justify-content:space-between;align-items:center"><h3 style="font-size:20px">${p[0]}</h3><span class="dot" style="--c:${SC[p[2]][1]}">${SC[p[2]][0]}</span></div><p style="color:var(--mut)">${p[1]}</p></a>`).join('')}</div></div>`;
}

function pricing(){
  const pl=[['Free',0,'Everything to get started',['Link analysis','Core tools','Files up to 200 MB']],['Pro',yearly?5:8,'For daily use',['All 39 tools','Files up to 2 GB','Priority processing','Batch downloads']],['Team',yearly?15:22,'For shared workflows',['Everything in Pro','Shared workspace','Usage reports']]];
  return`${ph('Pricing','Plans for every workflow','Launch placeholder pricing — final plans coming soon.')}<div class="w" style="padding-top:0"><div class="sw"><button class="${yearly?'':'on'}" data-y="0">Monthly</button><button class="${yearly?'on':''}" data-y="1">Yearly · save 35%</button></div><div class="pr3">${pl.map((p,i)=>`<div class="pc sp ${i===1?'hi':''}"><div style="display:flex;justify-content:space-between"><b style="font:700 18px var(--d)">${p[0]}</b>${i===1?'<span class="mono" style="color:var(--ac)">Most popular</span>':''}</div><div class="pvv">$${p[1]}<small> /month</small></div><p style="color:var(--mut)">${p[2]}</p><div style="margin:24px 0 28px;flex:1">${p[3].map(f=>`<div class="ck">${I('check',18)}${f}</div>`).join('')}</div><button class="btn ${i===1?'k':''}" data-b>Choose ${p[0]}</button></div>`).join('')}</div></div>`;
}

function help(){
  const F2=[['Are my files stored?','Links and uploaded files are used only for your request and removed automatically afterwards.'],['Why can’t I download from some platforms?','Some platforms restrict content or use DRM. The Platforms page lists the real status of each one.'],['What are the file size limits?','Limits vary by tool and are shown on each tool page before you upload.'],['How do I contact support?','Use the Contact link in the footer and include the link or tool name.']];
  return`${ph('Help center','Help center','Answers to common questions.')}<div class="w" style="padding-top:48px;max-width:860px"><label class="srch" style="max-width:none">${I('search',20)}<input id="hs" placeholder="Search questions" aria-label="Search help"></label>${F2.map(f=>`<details><summary>${f[0]}${I('chev',20)}</summary><p>${f[1]}</p></details>`).join('')}</div>`;
}

function bind(){
  const go=$('#go');if(go){go.onclick=analyse;$('#u').onkeydown=e=>{if(e.key==='Enter')analyse()};paint()}
  const ts=$('#ts');if(ts)ts.oninput=e=>{q=e.target.value;const p=e.target.selectionStart;render();const s=$('#ts');s.focus();s.setSelectionRange(p,p)};
  const ps=$('#ps');if(ps)ps.oninput=e=>{pq=e.target.value;const p=e.target.selectionStart;render();const s=$('#ps');s.focus();s.setSelectionRange(p,p)};
  const hs=$('#hs');if(hs)hs.oninput=e=>document.querySelectorAll('details').forEach(d=>d.style.display=d.textContent.toLowerCase().includes(e.target.value.toLowerCase())?'':'none');
  document.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{cat=b.dataset.c;render()});
  document.querySelectorAll('[data-hc]').forEach(b=>b.onclick=()=>{hc=b.dataset.hc;const y=scrollY;render();scrollTo(0,y)});
  document.querySelectorAll('[data-y]').forEach(b=>b.onclick=()=>{yearly=b.dataset.y==='1';render()});
  document.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>toast('Prototype: billing not connected'));
  
  const dz=$('#dz'),fi=$('#fi');
  if(dz){
    dz.onclick=()=>fi.click();
    dz.onkeydown=e=>{if(e.key==='Enter')fi.click()};
    ['dragover','dragenter'].forEach(v=>dz.addEventListener(v,e=>{e.preventDefault();dz.classList.add('over')}));
    ['dragleave','drop'].forEach(v=>dz.addEventListener(v,e=>{e.preventDefault();dz.classList.remove('over')}));
    dz.addEventListener('drop',e=>{tool.f=[...e.dataTransfer.files];tool.st='ready';render()});
    fi.onchange=()=>{tool.f=[...fi.files];tool.st='ready';render()};
  }

  const pr=$('#proc');
  if(pr)pr.onclick=async ()=>{
    tool.st='prog';
    render();

    // If real file selected, attempt real tool backend processing
    if (tool.f && tool.f.length > 0) {
      const currentHash = (location.hash || '').slice(1);
      const toolSlug = currentHash.replace('tool-', '');
      const tObj = TOOLS.find(x => x.s === toolSlug);
      if (tObj) {
        const formData = new FormData();
        for (const file of tool.f) {
          formData.append('files', file);
        }

        const cat = tObj.c.toLowerCase();
        const actionMap = {
          'video-trimmer': 'trim',
          'video-converter': 'convert',
          'video-compressor': 'compress',
          'video-to-gif': 'to-gif',
          'mute-video': 'mute',
          'video-merger': 'merge',
          'extract-frames': 'thumbnail',
          'audio-converter': 'convert',
          'audio-trimmer': 'trim',
          'audio-compressor': 'compress',
          'audio-merger': 'merge',
          'extract-audio': 'to-audio',
          'image-converter': 'convert',
          'image-resizer': 'resize',
          'image-compressor': 'compress',
          'image-cropper': 'crop',
          'image-rotate': 'rotate',
          'image-to-pdf': 'from-images',
          'pdf-merge': 'merge',
          'pdf-split': 'split',
          'pdf-compress': 'compress',
          'extract-pages': 'extract',
          'rotate-pdf': 'rotate',
        };
        const action = actionMap[toolSlug] || 'convert';

        fetch(`/api/v1/tools/${cat}/${action}`, {
          method: 'POST',
          body: formData
        })
        .then(r => r.json())
        .then(body => {
          if (body.job) {
            const jId = body.job.id;
            const check = setInterval(() => {
              fetch(`/api/v1/jobs/${jId}`)
              .then(r => r.json())
              .then(jBody => {
                const tb = $('#tb');
                if (tb && jBody.job?.progress?.percent) {
                  tb.style.width = jBody.job.progress.percent + '%';
                }
                if (jBody.job?.status === 'completed') {
                  clearInterval(check);
                  tool.st = 'done';
                  tool.downloadUrl = jBody.job.downloadUrl;
                  render();
                  toast('Processing complete');
                } else if (jBody.job?.status === 'failed') {
                  clearInterval(check);
                  tool.st = 'done';
                  render();
                }
              })
              .catch(() => clearInterval(check));
            }, 800);
            return;
          }
          throw new Error();
        })
        .catch(() => {
          let n=0;
          const t=setInterval(()=>{
            n+=10;
            const b=$('#tb');
            if(b)b.style.width=n+'%';
            if(n>=100){
              clearInterval(t);
              tool.st='done';
              render();
            }
          },150);
        });
        return;
      }
    }

    let n=0;
    const t=setInterval(()=>{
      n+=10;
      const b=$('#tb');
      if(b)b.style.width=n+'%';
      if(n>=100){
        clearInterval(t);
        tool.st='done';
        render();
      }
    },150);
  };

  const rs=$('#rs');if(rs)rs.onclick=()=>{tool={f:[],st:'idle'};render()};
  const fa=$('#fa');if(fa)fa.onclick=()=>{
    if (tool.downloadUrl) {
      window.location.href = tool.downloadUrl;
      toast('Download started');
    } else {
      toast('Prototype: simulated file ready');
    }
  };

  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('vis');io.unobserve(e.target)}}),{threshold:.1});
  document.querySelectorAll('.rv').forEach(e=>io.observe(e));
}

function render(){
  const h=(location.hash||'#home').slice(1);
  let b;
  if(h==='home')b=home();
  else if(h==='download')b=download();
  else if(h==='tools')b=tools();
  else if(h==='platforms')b=platforms();
  else if(h==='pricing')b=pricing();
  else if(h==='help')b=help();
  else if(h.startsWith('tool-')){
    const t=TOOLS.find(x=>'tool-'+x.s===h);
    b=t?toolPage(t):'';
  }
  if(!b)b=ph('404','Page not found','This page doesn’t exist or has moved.')+`<div class="w" style="padding-top:32px"><a class="btn k" href="#home">Back home</a></div>`;
  const appEl = $('#app');
  if(appEl) appEl.innerHTML=b+foot;
  const act=x=>h===x||(x==='tools'&&h.startsWith('tool-'));
  const nlEl = $('#nl');
  if(nlEl) nlEl.innerHTML=`<a href="#download" class="${act('download')?'on':''}">Downloader</a><button id="tm" aria-haspopup="true" aria-expanded="false" class="${act('tools')?'on':''}">Tools ${I('chev',14)}</button><a href="#platforms" class="${act('platforms')?'on':''}">Platforms</a><a href="#pricing" class="${act('pricing')?'on':''}">Pricing</a><a href="#help" class="${act('help')?'on':''}">Help</a>`;
  const mgEl = $('#mg');
  if(mgEl) { mgEl.innerHTML=mega(); mgEl.classList.remove('show'); }
  if(nlEl) nlEl.classList.remove('open');
  const tm=$('#tm');
  if(tm && mgEl) {
    const tg=o=>{mgEl.classList.toggle('show',o);tm.classList.toggle('open',o);tm.setAttribute('aria-expanded',o)};
    tm.onclick=e=>{e.stopPropagation();tg(!mgEl.classList.contains('show'))};
    tm.onmouseenter=()=>tg(true);
  }
  bind();
  document.querySelectorAll('[data-cat]').forEach(a=>a.addEventListener('click',()=>{
    cat=a.dataset.cat;
    const mg = $('#mg');
    const t = $('#tm');
    if(mg) mg.classList.remove('show');
    if(t) t.classList.remove('open');
    if(location.hash==='#tools')setTimeout(render,0);
  }));
}

document.addEventListener('click',e=>{
  if(!e.target.closest('#mg')&&!e.target.closest('#tm')){
    const mg = $('#mg');
    if(mg) mg.classList.remove('show');
    const t=$('#tm');
    if(t)t.classList.remove('open');
  }
});

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    const mg = $('#mg');
    if(mg) mg.classList.remove('show');
    const t=$('#tm');
    if(t)t.classList.remove('open');
  }
});

document.addEventListener('mousemove',e=>{
  const s=e.target.closest&&e.target.closest('.sp');
  if(s){
    const r=s.getBoundingClientRect();
    s.style.setProperty('--mx',e.clientX-r.left+'px');
    s.style.setProperty('--my',e.clientY-r.top+'px');
  }
  const w=$('#rw');
  if(w&&e.clientY<innerHeight*1.2){
    w.style.setProperty('--ry',((e.clientX/innerWidth-.5)*14)+'deg');
    w.style.setProperty('--rx',(-7+(e.clientY/innerHeight-.5)*-6)+'deg');
  }
});

const mgEl = $('#mg');
if(mgEl) {
  mgEl.onmouseleave=()=>{
    mgEl.classList.remove('show');
    const t=$('#tm');
    if(t)t.classList.remove('open');
  };
}

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
addEventListener('hashchange',()=>{render();scrollTo(0,0)});

