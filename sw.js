/* Atelier PC : page toujours à jour (réseau d'abord), utilisable sans réseau (copie locale) */
const C='atelier-pc-v2',T='atelier-pc-tiles',D='atelier-pc-data';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(['./','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./lib/pdf-lib.min.js']).catch(()=>{})))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>![C,T,D].includes(x)).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
let puts=0;
async function trim(){const c=await caches.open(T);const k=await c.keys();if(k.length>4000)for(const r of k.slice(0,k.length-3500))await c.delete(r)}
/* tuiles IGN : copie locale d'abord (les cartes changent peu), réseau sinon ; toujours demandées en CORS pour rester utilisables dans un canvas */
async function tile(r){const c=await caches.open(T);const m=await c.match(r.url);if(m)return m;
  try{const res=await fetch(r.url,{mode:'cors',credentials:'omit'});if(res.ok){c.put(r.url,res.clone());if(++puts%200===0)trim()}return res}catch(e){return fetch(r)}}
/* données (cadastre, adresse, altitudes, risques, PLU) : réseau d'abord, copie locale hors connexion */
async function data(r){const c=await caches.open(D);try{const res=await fetch(r);if(res.ok)c.put(r,res.clone());return res}catch(e){const m=await c.match(r);if(m)return m;throw e}}
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  if(u.origin===location.origin){e.respondWith(fetch(r,{cache:'no-store'}).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res}).catch(()=>caches.match(r).then(m=>m||caches.match('./'))));return}
  if(u.host==='data.geopf.fr'&&u.pathname.startsWith('/wmts')){e.respondWith(tile(r));return}
  if(/^(data\.geopf\.fr|apicarto\.ign\.fr|georisques\.gouv\.fr|www\.georisques\.gouv\.fr|wxs\.ign\.fr)$/.test(u.host)){e.respondWith(data(r));return}
  if(/cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net/.test(u.host)){e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));return res})))}
});
