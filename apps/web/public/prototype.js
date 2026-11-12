const NOTICE='';
const P={dl:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',arr:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',link:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',check:'<path d="M20 6 9 17l-5-5"/>',search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',video:'<path d="m22 8-6 4 6 4z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',audio:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',chev:'<path d="m6 9 6 6 6-6"/>',play:'<polygon points="6 3 20 12 6 21 6 3"/>',cut:'<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',phone:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',help:'<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',shield:'<path d="M20 13c0 5-3.5 7.5-7.7 8.97a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/>',mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',doc:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'};
const I=(n,s)=>`<svg class="i" viewBox="0 0 24 24" aria-hidden="true"${s?` style="width:${s}px;height:${s}px"`:''}>${P[n]}</svg>`;
const ICONS = {
  youtube: '<path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/>',
  tiktok: '<path d="M19.6 6.7a4.8 4.8 0 0 1-3.8-4.2V2h-3.4v13.7a2.9 2.9 0 0 1-5.2 1.7 2.9 2.9 0 0 1 3.1-4.5c.4.1.7.3 1 .4V9.8c-.4 0-.7-.1-1.1-.1A6.3 6.3 0 0 0 3.9 16a6.3 6.3 0 0 0 6.3 6.3 6.3 6.3 0 0 0 6.3-6.3V9.1a8.2 8.2 0 0 0 5 1.7V7.3c-.7 0-1.4-.2-1.9-.6z"/>',
  instagram: '<path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.2.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.9c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.9.1s-3.6 0-4.9-.1c-3.2-.1-4.8-1.7-4.9-4.9-.1-1.3-.1-1.6-.1-4.9s0-3.6.1-4.9c.1-3.2 1.7-4.8 4.9-4.9 1.3-.1 1.6-.1 4.9-.1zM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.2 4.4 2.6 6.8 7 7 1.2.1 1.6.1 4.9.1s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.2-4.4-2.6-6.8-7-7C15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.3 6.2 6.2 0 0 0 0-12.3zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z"/>',
  facebook: '<path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1v-3.5h3v-2.7c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9v2.3h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12z"/>',
  'x-twitter': '<path d="M18.2 2.2h3.3l-7.2 8.3 8.5 11.2h-6.6l-5.2-6.8-5.9 6.8H1.7l7.7-8.8L1.3 2.2h6.8l4.7 6.2zm-1.2 17.5h1.8L7.1 4.1H5.1z"/>',
  reddit: '<path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5 4.7c.7 0 1.3.6 1.3 1.3a1.3 1.3 0 0 1-2.5 0l-2.6-.5-.8 3.7c1.8.1 3.5.6 4.7 1.5.3-.3.7-.5 1.2-.5 1 0 1.8.8 1.8 1.8 0 .7-.4 1.3-1 1.6.1.2.1.4.1.5 0 2.7-3.1 4.9-7 4.9s-7-2.2-7-4.9c0-.2 0-.4 0-.5a1.7 1.7 0 0 1-1-1.6c0-1 .8-1.8 1.8-1.8.5 0 .9.2 1.2.5 1.2-.9 2.9-1.4 4.7-1.5l.9-4.2a.3.3 0 0 1 .4-.2l2.9.6c.3-.4.7-.7 1.1-.7zm-7.8 7.3c-.7 0-1.2.6-1.2 1.3s.5 1.2 1.2 1.2 1.3-.5 1.3-1.2c0-.7-.6-1.3-1.3-1.3zm5.6 0c-.7 0-1.3.6-1.3 1.3s.6 1.2 1.3 1.2 1.2-.5 1.2-1.2c0-.7-.5-1.3-1.2-1.3zm-5.5 4a.3.3 0 0 0-.2.5c.6 1 1.7 1.5 3 1.5s2.4-.5 3-1.5a.3.3 0 0 0-.6-.3c-.4.7-1.3 1.2-2.4 1.2s-2-.5-2.4-1.2a.3.3 0 0 0-.4-.2z"/>',
  pinterest: '<path d="M12 0a12 12 0 0 0-4.4 23.2c-.1-1-.2-2.4 0-3.4l1.4-6s-.4-.7-.4-1.8c0-1.7 1-2.9 2.2-2.9 1 0 1.5.8 1.5 1.7 0 1-.7 2.6-1 4-.3 1.2.6 2.2 1.8 2.2 2.1 0 3.8-2.2 3.8-5.5 0-2.9-2.1-4.9-5-4.9-3.4 0-5.4 2.6-5.4 5.2 0 1 .4 2.1.9 2.7a.4.4 0 0 1 .1.4l-.3 1.3c-.1.2-.2.3-.4.2-1.5-.7-2.4-2.9-2.4-4.6 0-3.8 2.8-7.3 8-7.3 4.1 0 7.3 3 7.3 6.9 0 4.1-2.6 7.5-6.2 7.5-1.2 0-2.4-.6-2.8-1.4l-.7 2.9c-.3 1-1 2.3-1.5 3.1A12 12 0 1 0 12 0z"/>',
  bluesky: '<path d="M12 10.8c-1.1-2.1-4-6-6.8-8C2.6.9 1.6 1.3.9 1.9.1 2.6 0 4 0 5.5c.2 5 2.5 9.9 5.5 11.2-3.7-.6-6 1.6-5.2 4.5.7 2.6 4.3 2.9 7.6 1.2 3.6-1.8 4.1-5.1 4.1-5.1s.5 3.3 4.1 5.1c3.3 1.7 7 1.4 7.6-1.2.8-3-1.5-5.1-5.2-4.5 3-1.3 5.3-6.2 5.5-11.2 0-1.5-.1-2.9-.9-3.6-.7-.6-1.7-.9-4.3 1-2.8 2-5.7 5.9-6.8 8.1z"/>',
  tumblr: '<path d="M14.6 24c-5.1 0-7-2.8-7-6.4v-7H4.7V6.7c3.5-.9 4.9-3.7 5.1-6.7h4v6.1h4.9v4.5h-4.9v6.5c0 2 1 2.5 2.6 2.5h2.4V24z"/>',
  linkedin: '<path d="M19 0H5a5 5 0 0 0-5 5v14a5 5 0 0 0 5 5h14a5 5 0 0 0 5-5V5a5 5 0 0 0-5-5zM8 19H5V8h3v11zM6.5 6.7a1.8 1.8 0 1 1 0-3.5 1.8 1.8 0 0 1 0 3.5zM20 19h-3v-5.6c0-3.4-4-3.1-4 0V19h-3V8h3v1.8c1.4-2.6 7-2.8 7 2.5V19z"/>',
  snapchat: '<path d="M12 0C5.4 0 0 5.4 0 12c0 2.2.6 4.3 1.7 6.1-.2.5-.6 2-1.6 3 0 0 2 .2 3.8-.8A12 12 0 1 0 12 0zm.1 18.3c-.6 0-1.4-.4-2.2-.4-.8 0-1.5.4-2.2.4-.1 0-.2 0-.3 0-.1-.2-.1-.4 0-.7.2-.9.7-1.4 1.1-1.8.3-.3.5-.5.6-.8 0-.2 0-.4-.1-.6a1.1 1.1 0 0 0-.6-.5c-.4-.1-.8-.3-1.2-.4-.5-.2-.8-.5-1-.8-.3-.4-.4-.9-.2-1.4.1-.7.6-1.1 1.4-1.4.2 0 .3-.1.5-.1.2 0 .3-.1.4-.2.1 0 .2-.1.2-.2 0-.9.4-2.7 1.8-3.7 1.1-.9 2.7-.9 3.8 0 1.3 1 1.8 2.8 1.8 3.7 0 .1 0 .2.1.3.2 0 .3 0 .5.1.2 0 .3.1.5.2.7.2 1.2.7 1.4 1.3.1.5 0 1-.2 1.4-.3.4-.6.6-1 .8-.4.2-.8.3-1.2.4a1.1 1.1 0 0 0-.6.5c0 .2 0 .4 0 .6.2.3.4.5.6.8.4.4.9.9 1.1 1.8 0 .3 0 .5 0 .7-.1 0-.2 0-.3 0-.7 0-1.4-.4-2.2-.4-.7 0-1.5.4-2.2.4z"/>',
  vk: '<path d="M12.7 15.7c-.7 0-1-.5-1.8-1.4-.7-.8-1-.9-1.2-.9-.3 0-.3.1-.3.5v1.2c0 .4-.1.6-1.1.6-1.6 0-3.3-1.1-4.5-2.8C2.1 10.6 1.5 8.4 1.5 8c0-.2.1-.4.5-.4h1.7c.4 0 .5.2.7.6 1 3 2.2 4.5 2.8 4.5.2 0 .3-.1.3-.7V9.5c0-1.2-.7-1.3-.7-1.7 0-.2.2-.4.4-.4h2.6c.4 0 .5.2.5.6v3.6c0 .4.2.5.3.5.2 0 .4-.1.8-.5 1.3-1.5 2.2-3.7 2.2-3.7.1-.3.3-.5.7-.5h1.7c.5 0 .6.3.5.6-.3 1-2.2 3.8-2.3 4-.2.3-.3.4 0 .8.2.3.9.9 1.3 1.4.9 1 1.5 1.8 1.7 2.3.2.5-.1.8-.7.8h-1.6c-.5 0-.8-.2-1.1-.5-.3-.3-.6-.8-1-1.2-.3-.4-.6-.5-.8-.5z"/>',
  weibo: '<path d="M10.1 17.6c-3.7.4-6.9-1.3-7.2-3.7-.4-2.4 2.3-4.7 6-5.1 3.7-.4 6.9 1.3 7.3 3.7.3 2.4-2.4 4.7-6.1 5.1zm8.8-6.4c-.4-.1-.6-.3-.6-.6 0-1.2-.7-2.3-1.9-2.7-1.3-.5-2.8-.1-3.7.9-.3.2-.5.3-.7.2-.3-.1-.4-.3-.3-.5.1-.7.6-1.3 1.3-1.7 1.5-.7 3.3-.6 4.7.4 1.3.9 2 2.4 1.8 3.8 0 .3-.2.4-.6.2zm1.9-2c-.4-.1-.7-.4-.7-.7.1-2.1-1.2-4.2-3.4-5-2.3-.8-5-.1-6.7 1.6-.3.3-.5.4-.8.3-.2-.1-.4-.3-.3-.6.1-.8.6-1.4 1.4-1.8 2-1 4.6-.9 6.5.5 1.9 1.3 2.8 3.3 2.5 5.3 0 .4-.3.5-.5.4zM12 0a12 12 0 1 0 12 12A12 12 0 0 0 12 0z"/>',
  vimeo: '<path d="M22.8 6.6c-.1 2.4-1.7 5.6-4.9 9.7-3.3 4.3-6 6.4-8.3 6.4-1.4 0-2.6-1.3-3.6-3.9L3.9 9.5C3.3 7 2.5 5.8 1.6 5.8c-.2 0-1 .4-2.3 1.3L0 5.7c1.3-1.2 2.6-2.4 3.9-3.6 1.9-1.6 3.2-2.5 4-2.6 1.8-.2 3 1 3.5 3.6.6 3.5 1.1 5.9 1.7 7.2.6 1.7 1.4 2.6 2.3 2.6.6 0 1.5-.8 2.6-2.3 1.1-1.5 1.7-2.7 1.8-3.6.2-1.5-.4-2.3-2-2.3-.7 0-1.5.2-2.3.5 1.6-5 4.4-7.4 8.5-7.2 3.1.2 4.5 2.1 4.3 5.5z"/>',
  dailymotion: '<path d="M12.6 15.7c-1.3 0-2.4-1.1-2.4-2.4 0-1.3 1.1-2.4 2.4-2.4s2.4 1.1 2.4 2.4c0 1.3-1.1 2.4-2.4 2.4zm5.7-9.2v11c0 3.6-3 6.5-6.6 6.5-2 0-3.8-.9-5-2.3l2.8-2.7c.6.6 1.4 1 2.3 1 1.8 0 3.3-1.5 3.3-3.3v-.9c-.9 1-2.2 1.6-3.6 1.6-2.7 0-4.9-2.2-4.9-4.8 0-2.7 2.2-4.9 4.9-4.9 1.4 0 2.7.7 3.6 1.6V6.5h3.2z"/>',
  twitch: '<path d="M2.1 0L.5 4.1v16.8h5.1V24h3.3l3-3.1h4.2L22.5 14.5V0H2.1zm18.3 13.4l-3.6 3.6h-4.7l-2.7 2.7V17H5.5V2.2h14.9v11.2zm-8.3-7h2.2v6.5h-2.2V6.4zm5 0h2.2v6.5h-2.2V6.4z"/>',
  rumble: '<path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm1.8 16.5H10v-9h4.8c2.4 0 3.8 1.4 3.8 3.4 0 1.4-.8 2.6-2.1 3l2.6 2.6h-2.5l-2.2-2.5H13.8v2.5zm-.1-4.2c1.2 0 2-.6 2-1.6 0-1-.8-1.6-2-1.6H12v3.2h1.7z"/>',
  bilibili: '<path d="M17.8 4.7h.9c1.5 0 2.7 1.2 2.7 2.7v10c0 1.5-1.2 2.7-2.7 2.7H5.4c-1.5 0-2.7-1.2-2.7-2.7v-10c0-1.5 1.2-2.7 2.7-2.7h.9l-1.9-1.9a.8.8 0 0 1 1-1l2.5 2.4h9.1l2.4-2.4a.8.8 0 1 1 1.1 1l-1.9 1.9zm-9.3 5.5a1.3 1.3 0 1 0 0 2.5 1.3 1.3 0 0 0 0-2.5zm7 0a1.3 1.3 0 1 0 0 2.5 1.3 1.3 0 0 0 0-2.5z"/>',
  odysee: '<path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 4.2a7.8 7.8 0 1 1 0 15.6 7.8 7.8 0 0 1 0-15.6zm0 3.3a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z"/>',
  streamable: '<path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm-2.5 16.5v-9l7 4.5-7 4.5z"/>',
  likee: '<path d="M12 21.4l-1.5-1.3C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.6 11.5L12 21.4z"/>',
  soundcloud: '<path d="M1.2 12.2c-.1 0-.2.1-.2.2v3.3c0 .1.1.2.2.2s.2-.1.2-.2v-3.3c0-.1-.1-.2-.2-.2zm1.2-.9c-.1 0-.2.1-.2.2v5c0 .2.1.3.2.3s.2-.1.2-.2v-5c0-.2-.1-.3-.2-.3zm1.1-.6c-.1 0-.3.1-.3.3v6.2c0 .1.1.3.3.3s.2-.1.2-.3V11c0-.2-.1-.3-.2-.3zm1.2-.5c-.2 0-.3.2-.3.3v7.1c0 .2.1.3.3.3.2 0 .3-.1.3-.3v-7.1c0-.1-.1-.3-.3-.3zm1.2-.3c-.2 0-.4.2-.4.4v7.7c0 .2.2.4.4.4.2 0 .3-.2.3-.4V10c0-.2-.1-.4-.3-.4zm1.1-.2c-.2 0-.4.2-.4.4v8.1c0 .2.2.4.4.4.2 0 .4-.2.4-.4v-8.1c0-.2-.2-.4-.4-.4zm1.2-.1c-.2 0-.4.2-.4.4v8.3c0 .3.2.5.4.5.3 0 .5-.2.5-.5V9.4c0-.2-.2-.4-.5-.4zm1.2 0c-.3 0-.5.2-.5.5v8.3c0 .3.2.5.5.5s.5-.2.5-.5V9.4c0-.3-.2-.5-.5-.5zm6.7 1a4.8 4.8 0 0 0-1.8.4c-.2-.7-.6-1.4-1.3-1.8a3.9 3.9 0 0 0-4.7.5v8.1h7.8a3.9 3.9 0 0 0 0-7.2z"/>',
  bandcamp: '<path d="M0 18.8l7.4-13.5H24l-7.4 13.5H0z"/>',
  mixcloud: '<path d="M12 4.5a7.5 7.5 0 0 0-7.3 5.7A5.3 5.3 0 0 0 5.3 20.5h13.4a5.3 5.3 0 0 0 1.3-10.4A7.5 7.5 0 0 0 12 4.5zm-3 6.8l3 3.7 3-3.7 2.3 2.2-5.3 5.3-5.2-5.3L9 11.3z"/>',
  'free-music-archive': '<path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm1 17.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm4-6.5l-5 1.5V6.5l5-1.5v6z"/>',
  'internet-archive': '<path d="M12 1.5L1.5 7.5v2.3h21V7.5L12 1.5zm-8.3 9.8v8.2h2.3v-8.2H3.7zm5.3 0v8.2h2.2v-8.2H9zm5.2 0v8.2h2.3v-8.2h-2.3zm5.3 0v8.2h2.2v-8.2h-2.2zM1.5 21v2.3h21V21H1.5z"/>',
  'wikimedia-commons': '<path d="M12 0a12 12 0 0 0-8.5 20.5L7 17a7.5 7.5 0 1 1 10 0l3.5 3.5A12 12 0 0 0 12 0zm0 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z"/>',
  peertube: '<path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm-4 6.5l7 4-7 4V6.5zm5 4l5 3-5 3v-6z"/>',
  imgur: '<path d="M12 0a12 12 0 1 0 12 12A12 12 0 0 0 12 0zm0 4.8a2.1 2.1 0 1 1-2.1 2.1A2.1 2.1 0 0 1 12 4.8zm2.4 13.8H9.6v-7.2h4.8z"/>',
  flickr: '<circle cx="7.5" cy="12" r="4.5" fill="#fff"/><circle cx="16.5" cy="12" r="4.5" fill="#FF0084"/>',
  telegram: '<path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.9 8.2l-2 9.3c-.1.7-.5.8-1.1.5l-3-2.2-1.4 1.4c-.2.2-.3.3-.6.3l.2-3 5.6-5c.2-.2 0-.3-.4-.1l-6.8 4.3-3-.9c-.6-.2-.7-.6.2-1l11.5-4.4c.5-.2 1 .1.8.9z"/>'
};
const BR={youtube:'FF0000|fff',tiktok:'010101|fff',instagram:'E4405F|fff',facebook:'1877F2|fff','x-twitter':'000000|fff',reddit:'FF4500|fff',pinterest:'BD081C|fff',bluesky:'0285FF|fff',tumblr:'35465C|fff',linkedin:'0A66C2|fff',snapchat:'FFFC00|111',vk:'0077FF|fff',weibo:'E6162D|fff',vimeo:'1AB7EA|fff',dailymotion:'0066DC|fff',twitch:'9146FF|fff',rumble:'85C742|111',bilibili:'00A1D6|fff',odysee:'EF1970|fff',streamable:'0F90FA|fff',likee:'FF3E5F|fff',soundcloud:'FF5500|fff',bandcamp:'1DA0C3|fff',mixcloud:'5000FF|fff','free-music-archive':'1C1C1C|fff','internet-archive':'333333|fff','wikimedia-commons':'006699|fff',peertube:'F1680D|fff',imgur:'1BB76E|fff',flickr:'0063DC|fff',telegram:'26A5E4|fff'};
const lg=(p,s=44)=>{
  const brand=BR[p.s]||'4F46E5|fff';
  const [b,f]=brand.split('|');
  const svg=ICONS[p.s]||'<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-2 14.5v-9l7 4.5z"/>';
  return `<span class="lg" style="--b:#${b};--f:#${f};--s:${s}px"><svg viewBox="0 0 24 24" width="60%" height="60%" fill="currentColor">${svg}</svg></span>`;
};
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
    if (isAudioTab) {
      const dur = an.realData.duration || 180;
      const sz320 = Math.max(1, Math.round(dur * 320 / (8 * 1024)));
      const sz192 = Math.max(1, Math.round(dur * 192 / (8 * 1024)));
      const sz128 = Math.max(1, Math.round(dur * 128 / (8 * 1024)));
      return [
        ['MP3 320 kbps', `${sz320} MB`, 1, 'bestaudio/best', 'mp3'],
        ['MP3 192 kbps', `${sz192} MB`, 0, 'bestaudio/best', 'mp3'],
        ['Original M4A', `${sz128} MB`, 0, 'bestaudio/best', 'm4a']
      ];
    } else {
      // Video options
      const videoFormats = an.realData.formats.filter(f => f.hasVideo && f.height);
      const heights = [...new Set(videoFormats.map(f => f.height))].sort((a,b) => b - a);
      const targets = [
        { label: '1080p MP4', h: 1080 },
        { label: '720p MP4', h: 720 },
        { label: '480p MP4', h: 480 },
        { label: '360p MP4', h: 360 }
      ];
      const available = targets.filter(t => heights.length === 0 || heights.some(h => h >= t.h - 40));
      const list = available.length > 0 ? available : targets.slice(-2);
      return list.map((t, idx) => {
        const matchingFmt = videoFormats.find(f => Math.abs(f.height - t.h) <= 40) || videoFormats[0];
        let szStr = 'Stream';
        if (matchingFmt && (matchingFmt.filesize || matchingFmt.filesizeApprox)) {
          const szBytes = matchingFmt.filesize || matchingFmt.filesizeApprox;
          szStr = `${Math.round(szBytes / (1024 * 1024))} MB`;
        } else if (an.realData.duration) {
          const bitrates = { 1080: 4500, 720: 2500, 480: 1200, 360: 700 };
          const br = bitrates[t.h] || 2000;
          const est = Math.round((an.realData.duration * br) / (8 * 1024));
          szStr = `${Math.max(1, est)} MB`;
        }
        const fmtId = `bestvideo[height<=${t.h}]+bestaudio/best[height<=${t.h}]/best`;
        return [t.label, szStr, idx === 0 ? 1 : 0, fmtId, 'mp4'];
      });
    }
  }

  const f=.7+(seed(an.url)%9)/10,k=kindOf(an.p),sz=x=>(x*f).toFixed(x*f<10?1:0)+' MB';
  const V=[['1080p MP4',84,1,'bestvideo[height<=1080]+bestaudio/best','mp4'],['720p MP4',42,0,'bestvideo[height<=720]+bestaudio/best','mp4'],['480p MP4',24,0,'bestvideo[height<=480]+bestaudio/best','mp4'],['360p MP4',14,0,'bestvideo[height<=360]+bestaudio/best','mp4']],A=[['MP3 320 kbps',10,1,'bestaudio/best','mp3'],['MP3 192 kbps',7,0,'bestaudio/best','mp3'],['MP3 128 kbps',4,0,'bestaudio/best','mp3']],Im=[['Original JPG',3.2,1,'best','jpg'],['Large JPG',1.4,0,'best','jpg'],['PNG',5.1,0,'best','png']];
  return(an.tab==='a'||k==='a'?A:k==='i'?Im:V).map(o=>[o[0],sz(o[1]),o[2],o[3]||'best',o[4]]);
}

function paint(){
  const r=$('#res');if(!r)return;const s=an.st;
  if(s==='idle')return r.innerHTML='';
  if(s==='load')return r.innerHTML=`<div class="rc"><div class="rrow"><div class="sk thm" style="height:76px"></div><div style="flex:1;width:100%;display:grid;gap:8px"><div class="sk" style="height:16px;width:65%"></div><div class="sk" style="height:12px;width:35%"></div></div></div><div class="sk" style="height:170px;margin-top:18px"></div></div>`;
  if(s==='err')return r.innerHTML=`<div class="rc"><b style="color:var(--err)">${esc(an.errMsg||'That doesn’t look like a link')}</b><p style="color:var(--mut);font-size:14px;margin-top:2px">${esc(an.errDetail||'Paste a full address beginning with https://')}</p><button class="btn" id="again-err" style="margin-top:14px">Try another link</button></div>`;
  if(s==='uns')return r.innerHTML=`<div class="rc"><b style="color:var(--err)">This site isn’t supported yet</b><p style="color:var(--mut);font-size:14px;margin-top:2px">See the <a href="#platforms" style="color:var(--ac)">full list of supported platforms</a>.</p></div>`;
  const p=an.p,k=kindOf(p);
  if(s==='done'){
    const fn = an.outputFileName || 'media-download';
    const dlLink = an.downloadUrl || '#';
    r.innerHTML=`<div class="rc"><div class="det">${lg(p,22)}${p.n}</div><b style="display:block;margin:8px 0 4px">Download complete</b><p style="color:var(--mut);margin-bottom:16px;font-size:14px">Your file is ready: <span class="mono" style="color:var(--tx)">${esc(fn)}</span></p><a class="btn k" id="dl-file-btn" href="${dlLink}" download="${esc(fn)}" style="width:100%;margin-bottom:10px;height:48px;display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none">${I('dl')} Save ${esc(fn)}</a><button class="btn" id="again" style="width:100%">Download another link</button></div>`;
    const ag=$('#again');if(ag)ag.onclick=()=>{an={...an,st:'idle',url:'',clip:false,realData:null,downloadUrl:null};const uInput=$('#u');if(uInput)uInput.value='';paint();};
    return;
  }
  const O=optsFor(),sec=130+seed(an.url)%400,dur=`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;
  const thmHtml = an.thumbnail 
    ? `<div class="thm" style="overflow:hidden;padding:0"><img src="${an.thumbnail}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:10px"></div>` 
    : `<div class="thm">${I(k==='a'?'audio':k==='i'?'image':'play',26)}</div>`;
  const titleText = an.title || `Sample ${k==='a'?'track':k==='i'?'image':'video'} title`;
  const durText = an.dur || dur;

  r.innerHTML=`<div class="rc"><div class="rrow">${thmHtml}<div><div class="det">${lg(p,22)}${p.n} detected</div><b>${esc(titleText)}</b><small>${k==='i'?'Image':durText}${an.uploader ? ' • ' + esc(an.uploader) : ''}</small></div></div>
  ${k==='v'?`<div class="seg" role="tablist"><button class="${an.tab==='v'?'on':''}" data-t="v">Video</button><button class="${an.tab==='a'?'on':''}" data-t="a">Audio only</button></div>`:'<div style="height:16px"></div>'}
  <div class="opts" role="radiogroup">${O.map((o,i)=>`<button class="o ${i===an.opt?'on':''}" data-o="${i}" role="radio" aria-checked="${i===an.opt}"><span><i class="r"></i>${o[0]}${o[2]?'<span class="best">BEST</span>':''}</span><span class="mono">${o[1]}</span></button>`).join('')}</div>
  ${k==='i'?'':`<div class="clip"><label><input type="checkbox" id="cl" ${an.clip?'checked':''}> Download only a section</label>${an.clip?`<input class="ip" id="ca" value="${an.a}" aria-label="Start"><span class="mono">to</span><input class="ip" id="cb" value="${an.b}" aria-label="End">`:''}</div>`}
  ${s==='prog'?`<div style="margin-top:16px"><div style="display:flex;justify-content:space-between;font-size:13px;color:var(--mut);margin-bottom:6px"><span id="pst">${esc(an.stage||'Downloading media...')}</span><span class="mono" id="ppc">${an.pct?an.pct+'%':''}</span></div><div class="pg"><i id="pb" style="width:${Math.max(an.pct||0, 4)}%"></i></div></div>`:`<button class="btn k" id="dlb" style="width:100%;margin-top:16px;height:50px;font-size:15px">${I('dl')} Download ${O[an.opt] ? O[an.opt][0] : 'Media'}</button>`}</div>`;
  r.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{an.opt=+b.dataset.o;paint()});
  r.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{an.tab=b.dataset.t;an.opt=0;paint()});
  const cl=$('#cl');if(cl)cl.onchange=()=>{an.clip=cl.checked;paint()};
  const ca=$('#ca');if(ca){ca.oninput=()=>an.a=ca.value;const cb=$('#cb');if(cb)cb.oninput=e=>an.b=e.target.value;}
  const againErr=$('#again-err');if(againErr)againErr.onclick=()=>{an={...an,st:'idle',url:'',errMsg:'',errDetail:''};const uInput=$('#u');if(uInput)uInput.value='';paint();};

  const d=$('#dlb');
  if(d)d.onclick=()=>{
    an.st='prog';
    an.pct=0;
    an.stage='Connecting to downloader...';
    paint();

    const chosen = O[an.opt] || O[0];
    const formatId = chosen[3] || 'best';
    const isAudio = (an.tab === 'a' || k === 'a');
    const targetFormat = chosen[4] || (isAudio ? 'mp3' : undefined);

    fetch('/api/v1/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: an.url,
        formatId,
        title: an.title || 'media',
        targetFormat,
        clipStart: an.clip ? an.a : undefined,
        clipEnd: an.clip ? an.b : undefined,
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
            const pst = $('#pst');
            const ppc = $('#ppc');
            if (jBody.job?.progress?.percent !== undefined) {
              an.pct = Math.min(Math.round(jBody.job.progress.percent), 100);
              if (pb) pb.style.width = Math.max(an.pct, 4) + '%';
              if (ppc) ppc.textContent = an.pct + '%';
            }
            if (jBody.job?.progress?.stage) {
              an.stage = jBody.job.progress.stage;
              if (pst) pst.textContent = an.stage;
            }
            if (jBody.job?.status === 'completed') {
              clearInterval(check);
              an.st = 'done';
              an.realDownloaded = true;
              an.downloadUrl = jBody.job.downloadUrl;
              an.outputFileName = jBody.job.outputFileName || 'media';
              paint();
              toast('Download complete');
              if (jBody.job.downloadUrl) {
                const dlLink = document.createElement('a');
                dlLink.href = jBody.job.downloadUrl;
                dlLink.download = jBody.job.outputFileName || 'media';
                document.body.appendChild(dlLink);
                dlLink.click();
                setTimeout(() => { try { document.body.removeChild(dlLink); } catch(e){} }, 1500);
              }
            } else if (jBody.job?.status === 'failed') {
              clearInterval(check);
              an.st = 'err';
              an.errMsg = 'Download failed';
              an.errDetail = jBody.job.error?.message || 'Download could not be completed';
              paint();
              toast('Download failed');
            }
          })
          .catch(() => {});
        }, 600);
        return;
      }
      throw new Error(body.message || 'No job created');
    })
    .catch((err) => {
      an.st = 'err';
      an.errMsg = 'Unable to start download';
      an.errDetail = err.message || 'Check connection to backend server';
      paint();
      toast('Download failed');
    });
  };
}

function analyse(){
  let v=$('#u').value.trim();
  if(!v)return;
  if(!/^https?:\/\//i.test(v)){v='https://'+v;}
  an.url=v;
  let u;
  try{u=new URL(v)}catch(e){an.st='err';an.errMsg='That doesn’t look like a link';an.errDetail='Paste a valid web URL';return paint()}
  if(!u.hostname.includes('.')){an.st='err';an.errMsg='Invalid domain name';an.errDetail='Include full domain like youtube.com';return paint()}
  
  let p=PL.find(p=>p.h.some(h=>u.hostname===h||u.hostname.endsWith('.'+h)));
  if(!p){
    // Fallback platform object for any supported web URL
    p = { n: u.hostname.replace(/^www\./i, ''), c: 1, t: 'Media', h: [u.hostname], s: 'media' };
  }
  an.p=p;an.tab='v';an.opt=0;an.clip=false;an.st='load';an.realData=null;an.errMsg='';an.errDetail='';paint();

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
      an.uploader = body.data.uploader;
      if (body.data.duration) {
        const sec = Math.floor(body.data.duration);
        an.dur = `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;
      }
      paint();
    } else {
      an.st = 'err';
      an.errMsg = body.message || 'Media not found';
      an.errDetail = body.error || 'Could not extract stream. Please verify the URL is public and available.';
      paint();
    }
  })
  .catch(err => {
    an.st = 'err';
    an.errMsg = 'Network request failed';
    an.errDetail = err.message || 'Could not reach backend inspector';
    paint();
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
