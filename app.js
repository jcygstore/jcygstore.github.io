import { firebaseConfig, adminUid } from './firebase-config.js';
import { cloudinaryWorkerUrl } from './cloudinary-config.js';

// JCYG STORE — catálogo público y administración protegida por Firebase.
const $ = (id) => document.getElementById(id);
const feed = $('feed'), modal = $('modal'), sheet = $('sheet'), toast = $('toast');
const adminOverlay = $('admin-overlay'), adminContent = $('admin-content');
const logoPath = 'assets/jcyg-store-logo-3d.png';
const blankPhoto = 'assets/imagen-no-disponible.svg';
const PALETTE = [
  ['Negro','#111827'],['Blanco','#f8fafc'],['Gris','#9ca3af'],['Plata','#cbd5e1'],
  ['Rojo','#ef4444'],['Vino','#9f1239'],['Rosado','#f472b6'],['Fucsia','#ec4899'],
  ['Morado','#8b5cf6'],['Lila','#c4b5fd'],['Azul','#2563eb'],['Celeste','#38bdf8'],
  ['Turquesa','#14b8a6'],['Verde','#22c55e'],['Amarillo','#facc15'],['Naranja','#fb923c'],
  ['Beige','#d6bc9a'],['Marrón','#92400e'],['Dorado','#d4af37']
];
const SAMPLE_PRODUCTS = [
  {id:'sample-1',name:'Camioneta eléctrica infantil',price:850,oldPrice:900,desc:'Luces LED · MP3 · USB · Control remoto',stock:6,published:true,
   colors:[{name:'Negro',hex:'#111827'},{name:'Gris',hex:'#9ca3af'}],
   photos:[{url:'assets/producto-ejemplo-1.webp',path:'',color:'Negro'}],
   specs:[{label:'Dimensiones',value:'120 × 74 × 80 cm'},{label:'Material',value:'ABS de alta calidad'},{label:'Motor',value:'4 × 380 W'},{label:'Velocidad máxima',value:'5 km/h'},{label:'Batería',value:'2 × 6V 4.5Ah'},{label:'Tiempo de uso',value:'2–3 horas aprox.'},{label:'Incluye',value:'LED, MP3, USB y control remoto'}]},
  {id:'sample-2',name:'Vehículo eléctrico deportivo',price:750,oldPrice:800,desc:'Luces LED · MP3 · Control remoto',stock:6,published:true,
   colors:[{name:'Rojo',hex:'#ef4444'},{name:'Fucsia',hex:'#ec4899'}],
   photos:[{url:'assets/producto-ejemplo-2.webp',path:'',color:'Rojo'}],
   specs:[{label:'Dimensiones',value:'112 × 65 × 45 cm'},{label:'Material',value:'ABS de alta calidad'},{label:'Motor',value:'2 × 380 W'},{label:'Velocidad máxima',value:'3 km/h'},{label:'Batería',value:'2 × 6V 4.5Ah'},{label:'Tiempo de uso',value:'2–3 horas aprox.'},{label:'Incluye',value:'LED, MP3 y control remoto'}]},
  {id:'sample-3',name:'Moto eléctrica infantil',price:420,oldPrice:450,desc:'Luces LED · MP3 · USB',stock:6,published:true,
   colors:[{name:'Rosado',hex:'#f472b6'}],photos:[{url:'assets/producto-ejemplo-3.webp',path:'',color:'Rosado'}],
   specs:[{label:'Dimensiones',value:'92 × 46 × 66 cm'},{label:'Material',value:'ABS de alta calidad'},{label:'Motor',value:'380 W'},{label:'Velocidad máxima',value:'5 km/h'},{label:'Batería',value:'6V 4 Ah'},{label:'Tiempo de uso',value:'1–3 horas aprox.'},{label:'Incluye',value:'LED, MP3 y USB'}]}
];
const firebaseReady = Boolean(firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('REEMPLAZAR') && firebaseConfig.projectId && !firebaseConfig.projectId.startsWith('REEMPLAZAR') && adminUid && !adminUid.startsWith('REEMPLAZAR'));
let products = firebaseReady ? [] : structuredClone(SAMPLE_PRODUCTS);
let adminProducts = [], settings = {whatsapp:'',whatsappUsername:'',whatsappMode:'number'};
let likes = new Set(); try { likes = new Set(JSON.parse(localStorage.getItem('jcyg_likes_v2') || '[]')); }catch{}
let chosenColors = new Map(), currentId = null, photoIndex = 0;
let likeCounts = new Map(), cart = []; try { cart = JSON.parse(localStorage.getItem('jcyg_cart_v2') || '[]'); if(!Array.isArray(cart))cart=[]; }catch{cart=[];}
let unsubscribeLikes = null;
const heartSvg = `<svg width="29" height="29" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.4 5.4 0 0 0-7.7 0L12 5.7l-1.1-1.1a5.4 5.4 0 0 0-7.7 7.7l1.1 1.1L12 21l7.7-7.6 1.1-1.1a5.4 5.4 0 0 0 0-7.7Z"/></svg>`;
const waSvg = `<svg width="29" height="29" viewBox="0 0 32 32" aria-hidden="true" fill="currentColor"><path d="M16 .8A15.2 15.2 0 0 0 2.8 23.5L.9 31l7.7-2a15.2 15.2 0 1 0 7.4-28.2Zm0 27.5c-2.2 0-4.3-.6-6.2-1.7l-.5-.3-4.5 1.2L6 23l-.3-.5a12.3 12.3 0 1 1 10.3 5.8Zm6.8-9.2c-.4-.2-2.3-1.1-2.7-1.3-.4-.1-.6-.2-.9.2s-1 1.3-1.2 1.5c-.2.2-.4.3-.8.1-.4-.2-1.6-.6-3.1-1.9-1.1-1-1.8-2.2-2-2.6-.2-.4 0-.6.1-.8l.6-.7c.2-.2.3-.4.4-.7.1-.2.1-.5 0-.7-.1-.2-.9-2.2-1.2-3-.3-.7-.6-.6-.9-.6h-.8c-.3 0-.7.1-1 .5-.4.4-1.4 1.4-1.4 3.4s1.4 3.9 1.6 4.2c.2.3 2.8 4.3 6.8 6 .9.4 1.7.6 2.2.8.9.3 1.7.2 2.4.1.7-.1 2.3-.9 2.6-1.8.3-.9.3-1.7.2-1.8-.1-.2-.4-.3-.8-.5Z"/></svg>`;
// Carrito general sin signo +; Añadir al carrito usa el icono con signo +.
const cartSvg = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h2l2.5 12.5a2 2 0 0 0 2 1.5h10a2 2 0 0 0 2-1.5L22 7H5"/></svg>`;
// Icono minimalista para Detalles: tres puntos horizontales.
const detailsSvg = `<svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><circle cx="5" cy="12" r="2.05"/><circle cx="12" cy="12" r="2.05"/><circle cx="19" cy="12" r="2.05"/></svg>`;
const cartPlusSvg = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h2l2.5 12.5a2 2 0 0 0 2 1.5h10a2 2 0 0 0 2-1.5L22 7H5"/><path d="M16 2v6m-3-3h6" stroke-width="2.3"/></svg>`;
let sdk = null, db = null, auth = null, activeUser = null;
let unsubscribePublic = null, unsubscribeAdmin = null, unsubscribeSettings = null, unsubscribeSales = null;
let sales = [], saleProductId = null, savingSale = false, editingSaleNoteId = null, salesLoadError = false;
let adminTab = 'products', editId = null, editorColors = [], editorPhotos = [], saving = false;
let editorColorStockMode = false, editorOpeningStock = null;
let toastTimer = null;
let lastKnownProductNumber = 0;
let editorAutoCode = null;
const CODE_PATTERN = /^JS-(\d{4})$/;
function numberFromCode(code){const m=CODE_PATTERN.exec(String(code||'').toUpperCase());return m?Number(m[1]):0;}
function nextCodeNumber(){return Math.max(lastKnownProductNumber, ...adminProducts.map(p=>numberFromCode(p.code)), 0)+1;}
function formattedCode(number){if(number<1||number>9999)throw Error('Se llegó al límite de 9 999 códigos JS-0000.');return `JS-${String(number).padStart(4,'0')}`;}

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = (num) => 'S/ ' + Number(num || 0).toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2});
const safeImage = (url) => {
  const s = String(url || '');
  return (/^https:\/\//i.test(s) || /^assets\/[\w.-]+\.(webp|png|jpg|jpeg|svg)$/i.test(s) || /^blob:/i.test(s)) ? s : blankPhoto;
};
const safeVideo = url => /^https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/[^\s]+\.mp4(?:\?[^\s]*)?$/i.test(String(url||'')) ? String(url) : '';
const isVideo = item => item?.type === 'video';
const mainImage = p => p.photos.find(item=>!isVideo(item))?.url || blankPhoto;
const pausedVideosExcept = except => {
  document.querySelectorAll('video.jcyg-product-video').forEach(v=>{if(v!==except&&!v.paused)v.pause();});
};
function mediaSlideHTML(item, name, i, total, eager=false, priority=false){
  if(isVideo(item))return `<video class="jcyg-product-video" controls playsinline preload="none" aria-label="${esc(name)} · video ${i+1} de ${total}" src="${esc(safeVideo(item.url))}"></video>`;
  return `<img src="${esc(displayPhoto(item.url))}" data-image-fallback="allowed" alt="${esc(name)} · foto ${i+1} de ${total}" loading="${eager?'eager':'lazy'}" decoding="async" ${priority?'fetchpriority="high"':''}>`;
}
function detailMediaHTML(item,name){
  if(isVideo(item))return `<video id="detail-photo" class="gallery-main detail-video jcyg-product-video" controls playsinline preload="none" src="${esc(safeVideo(item.url))}" aria-label="Video de ${esc(name)}"></video>`;
  return `<img class="gallery-main" id="detail-photo" data-image-fallback="allowed" src="${esc(displayPhoto(item.url))}" alt="${esc(name)}">`;
}
function mediaThumbHTML(item,name){
  return isVideo(item) ? `<span class="video-thumb-placeholder" aria-hidden="true">▶ Video</span>` : `<img data-image-fallback="allowed" src="${esc(displayPhoto(item.url))}" alt="${esc(name)}">`;
}
const validColor = (s) => /^#[a-fA-F0-9]{6}$/.test(String(s || '')) ? s : '#cbd5e1';
// Presentación: recorta visualmente márgenes transparentes de PNG existentes
// almacenados en Cloudinary, sin cambiar el enlace original en Firestore.
// e_trim es una transformación estándar de Cloudinary, no eliminación de fondo.
function displayPhoto(url) {
  const original = safeImage(url);
  if (/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//i.test(original)
      && !/\/e_trim(?:\/|,)/i.test(original)) {
    return original.replace('/image/upload/', '/image/upload/e_trim/');
  }
  return original;
}
// Si la transformación está restringida, volver a la foto original.
document.addEventListener('error', event => {
  const element = event.target;
  if (element?.tagName !== 'IMG' || element.dataset.imageFallback !== 'allowed') return;
  const url = element.currentSrc || element.src;
  if (!url.includes('/image/upload/e_trim/')) return;
  element.dataset.imageFallback = 'used';
  element.src = url.replace('/image/upload/e_trim/', '/image/upload/');
}, true);

const notify = (message) => { toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3400); };
const isAdmin = () => !!activeUser && activeUser.uid === adminUid;
const normalize = (doc) => ({
  ...doc, id:String(doc.id), name:String(doc.name || 'Producto sin nombre'), desc:String(doc.desc || ''),
  stock:Math.max(0,Math.floor(Number(doc.stock) || 0)), price:Number(doc.price) || 0,
  oldPrice:Number(doc.oldPrice) || 0, published:doc.published !== false, outOfStock:Boolean(doc.outOfStock) || Number(doc.stock)===0, code:String(doc.code||'Sin asignar'),
  stockByColor:doc.stockByColor === true,
  colors:Array.isArray(doc.colors) ? doc.colors.map(c => ({name:String(c.name || '').slice(0,35),hex:validColor(c.hex),qty:Math.max(0,Math.floor(Number(c.qty)||0))})) : [],
  photos:Array.isArray(doc.photos) ? doc.photos.slice(0,10).map(p => ({type:p.type==='video'?'video':'image',url:p.type==='video'?safeVideo(p.url):safeImage(p.url),path:String(p.path || ''),color:String(p.color || '')})).filter(p=>p.url) : [],
  specs:Array.isArray(doc.specs) ? doc.specs.map(s => ({label:String(s.label || 'Detalle'),value:String(s.value || '')})) : []
});
const getProduct = id => products.find(p => p.id === id);
const selection = p => {
  const selected=chosenColors.get(p.id) || '';
  if(p.stockByColor && p.colors.length){
    const match=p.colors.find(c=>c.name===selected && c.qty>0);
    return match ? match.name : (p.colors.find(c=>c.qty>0)?.name||'');
  }
  return selected;
};
const colorAvailability = (p,color) => p.stockByColor && p.colors.length
  ? Math.max(0,Number(p.colors.find(c=>c.name===color)?.qty)||0)
  : Math.max(0,Number(p.stock)||0);
const colorSoldOut = (p,c) => p.stockByColor && c.qty<=0;
function photoForColor(p, color) { return p.photos.find(ph => !isVideo(ph) && ph.color === color && color)?.url || mainImage(p); }
const unavailable = p => p.outOfStock || p.stock<=0;
const discount = p => p.oldPrice > p.price && p.price > 0 ? Math.round((1-p.price/p.oldPrice)*100) : 0;
function header() {
  return `<div class="top"><div class="logo"><img class="brand-logo" src="${logoPath}" alt="JCYG STORE"></div><button type="button" class="tag admin-entry" data-action="admin" title="Ingresar a administración">Catálogo 2026</button></div>`;
}
function renderFeed() {
  let floating=document.getElementById('cart-floating');if(!floating){floating=document.createElement('button');floating.id='cart-floating';floating.type='button';floating.innerHTML=`${cartSvg}<span class="cart-count">0</span>`;floating.setAttribute('aria-label','Abrir carrito');floating.addEventListener('click',cartPanel);document.body.appendChild(floating);}updateCartBadges();
  if(!products.length) {
    feed.innerHTML = `<section class="no-products"><div class="empty-center"><img src="${logoPath}" alt="JCYG STORE"><h2>Pronto tendremos novedades</h2><p>Estamos preparando nuestro catálogo de productos.</p><button class="tag admin-entry" data-action="admin" type="button">Catálogo 2026 · Administrador</button></div></section>`;
    return;
  }
  feed.innerHTML = products.map((p, index) => {
    const selected = selection(p), off = discount(p);
    const photos = p.photos.length ? p.photos : [{url:blankPhoto,color:''}];
    const initialPhoto = Math.max(0, selected ? photos.findIndex(ph=>ph.color===selected) : 0);
    return `<article class="card" data-id="${esc(p.id)}">
      <div class="product-stage">
        <div class="product-gallery" tabindex="0" role="region" aria-roledescription="carrusel" aria-label="Fotos y videos de ${esc(p.name)}. Desliza a la izquierda o derecha" data-current-photo="${initialPhoto}" data-start-photo="${initialPhoto}">
          ${photos.map((ph,i)=>`<div class="product-slide">${mediaSlideHTML(ph,p.name,i,photos.length,index < 2 && (i===initialPhoto || i===Math.min(photos.length-1,initialPhoto+1)),index===0&&i===initialPhoto)}</div>`).join('')}
        </div>
        ${photos.length > 1 ? `<div class="product-gallery-dots" role="group" aria-label="Cambiar imagen o video">${photos.map((ph,i)=>`<button type="button" class="photo-dot ${i===initialPhoto?'selected':''}" data-action="photo-dot" data-photo-index="${i}" aria-pressed="${i===initialPhoto}" aria-label="Ver ${isVideo(ph)?'video':'foto'} ${i+1} de ${photos.length}"><span></span></button>`).join('')}</div>` : ''}
      </div>
      <div class="shade"></div>${header()}
      ${firebaseReady ? '' : '<div class="sample-banner">Catálogo de ejemplo · Firebase pendiente</div>'}
      <div class="info"><div class="eyebrow">JCYG STORE</div><p class="image-disclaimer">Las imágenes son de carácter ilustrativo y referencial.</p><div class="name">${esc(p.name)}</div><div class="product-code">Código: ${esc(p.code)}</div><div class="desc">${esc(p.desc)}</div>
        <div class="availability"><span class="stock-mini ${p.stock===0?'out':''}">${p.stock ? `${p.stock} disponibles` : 'Agotado'}</span>
          ${p.colors.length ? `<span class="available-colors"><span class="available-colors-label">Colores:</span>${p.colors.map((c,i) => `<button type="button" class="mini-color-btn ${selected===c.name?'selected':''}" style="--c:${validColor(c.hex)}" title="${esc(c.name)}${colorSoldOut(p,c)?' (agotado)':(p.stockByColor?' · '+c.qty+' disponibles':'')}" aria-label="Ver color ${esc(c.name)}" data-action="color" data-color-index="${i}" ${colorSoldOut(p,c)?'disabled':''}></button>`).join('')}</span>` : ''}
        </div><div class="price"><span class="currency">Precio</span><strong>${money(p.price)}</strong>${off ? `<del>${money(p.oldPrice)}</del><span class="discount">-${off}%</span>` : ''}</div>
      </div><div class="actions">
        <button class="act ${likes.has(p.id)?'liked':''}" type="button" data-action="like" aria-label="Me gusta" aria-pressed="${likes.has(p.id)}"><span class="ico heart-ico">${heartSvg}</span><small class="likes-text">${likeCounts.get(p.id)||0}</small></button>
        <button class="act" type="button" data-action="details" aria-label="Ver características"><span class="ico">${detailsSvg}</span><small>Detalles</small></button>
        <button class="act consult-side" type="button" data-action="consult" aria-label="Consultar por WhatsApp"><span class="ico">${waSvg}</span><small>Consultar</small></button>
        <button class="act cart-side" type="button" data-action="cart-add" aria-label="Añadir al carrito" ${unavailable(p)?'disabled title="Producto agotado"':''}><span class="ico">${cartPlusSvg}</span><small>Añadir</small></button>
      </div></article>`;
  }).join('');
  const cards = [...feed.querySelectorAll('.card')];
  if ('IntersectionObserver' in window) {
    const watcher = new IntersectionObserver((entries) => entries.forEach(e => {e.target.classList.toggle('active',e.isIntersecting && e.intersectionRatio > .4); if(!e.isIntersecting || e.intersectionRatio<.3)e.target.querySelectorAll('video').forEach(v=>v.pause());}),{root:feed,threshold:[.3,.4,.7]});
    cards.forEach(c => watcher.observe(c));
  }
  if(cards[0]) cards[0].classList.add('active');
  // Restaurar la foto correspondiente al color escogido cuando se redibuja el catálogo.
  for(const card of cards){
    const gallery=card.querySelector('.product-gallery');
    const initial=Number(gallery?.dataset.startPhoto||0);
    if(initial>0) gallery.scrollLeft=initial*gallery.clientWidth;
  }
}
function updateGalleryDots(card,index){
  const gallery=card?.querySelector('.product-gallery');if(!gallery)return;
  const length=gallery.querySelectorAll('.product-slide').length;
  const safeIndex=Math.max(0,Math.min(length-1,index));
  if(Number(gallery.dataset.currentPhoto)===safeIndex)return;
  gallery.dataset.currentPhoto=String(safeIndex);
  gallery.querySelectorAll('.product-slide video').forEach((video,i)=>{if(i!==safeIndex&&!video.paused)video.pause();});
  card.querySelectorAll('.photo-dot').forEach((dot,i)=>{
    const current=i===safeIndex;
    dot.classList.toggle('selected',current);
    dot.setAttribute('aria-pressed',String(current));
  });
}
function showCardPhoto(card,index,animated=false){
  const gallery=card?.querySelector('.product-gallery');if(!gallery)return;
  const length=gallery.querySelectorAll('.product-slide').length;
  const safeIndex=Math.max(0,Math.min(length-1,index));
  gallery.scrollTo({left:safeIndex*gallery.clientWidth,behavior:animated?'smooth':'instant'});
  updateGalleryDots(card,safeIndex);
}
// El carrusel usa desplazamiento nativo; el scroll vertical sigue perteneciendo al catálogo.
feed.addEventListener('scroll',event=>{
  const gallery=event.target;
  if(!gallery.classList?.contains('product-gallery')||!gallery.clientWidth)return;
  updateGalleryDots(gallery.closest('.card'),Math.round(gallery.scrollLeft/gallery.clientWidth));
},true);
function chooseColor(id, color) {
  const p = getProduct(id); if(!p || !p.colors.some(c => c.name===color && !colorSoldOut(p,c))) return;
  chosenColors.set(id,color);
  const card = [...feed.querySelectorAll('.card')].find(c => c.dataset.id === id);
  if(card) {
    const matchIndex=p.photos.findIndex(ph=>ph.color===color);
    if(matchIndex>=0) showCardPhoto(card,matchIndex);
    card.querySelectorAll('[data-color-index]').forEach(btn => btn.classList.toggle('selected',p.colors[Number(btn.dataset.colorIndex)]?.name===color));
  }
  if(currentId === id && modal.classList.contains('show')) { photoIndex = Math.max(0,p.photos.findIndex(ph => ph.color===color)); renderDetails(p); }
}
function renderDetails(p) {
  const selected = selection(p);
  const photos = p.photos.length ? p.photos : [{url:blankPhoto,color:''}];
  photoIndex = Math.max(0, Math.min(photoIndex,photos.length-1));
  const specs = p.specs.map(s=>`<div class="spec"><b>${esc(s.label)}</b><span>${esc(s.value)}</span></div>`).join('');
  sheet.innerHTML = `<div class="detail-wrap"><button class="close" type="button" data-detail-action="close" aria-label="Cerrar">✕</button>
    ${detailMediaHTML(photos[photoIndex],p.name)}
    <div class="gallery-strip">${photos.map((ph,i)=>`<button type="button" class="thumb ${i===photoIndex?'selected':''}" data-detail-action="photo" data-photo-index="${i}" aria-label="${isVideo(ph)?'Video':'Foto'} ${i+1}">${mediaThumbHTML(ph,p.name)}</button>`).join('')}</div>
    <div class="detail-kicker">JCYG STORE · PRODUCTO</div><h2>${esc(p.name)}</h2><div class="product-code">Código: ${esc(p.code)}</div>
    <div class="detail-price"><span class="p">${money(p.price)}</span>${discount(p) ? `<del>${money(p.oldPrice)}</del><span class="discount">-${discount(p)}%</span>` : ''}</div>
    <div class="stock-line"><span class="stock-badge ${p.stock===0?'out':''}">${p.stock ? `${p.stock} disponibles` : 'Agotado'}</span></div>
    <p class="detail-desc">${esc(p.desc)}</p>
    ${p.colors.length ? `<div class="detail-subtitle">Selecciona un color${selected ? `: ${esc(selected)}` : ''}</div><div class="color-list">${p.colors.map((c,i)=>`<button class="color-choice ${selected===c.name?'selected':''}" type="button" data-detail-action="color" data-color-index="${i}" ${colorSoldOut(p,c)?'disabled title="Color agotado"':''}><i class="color-dot" style="background:${validColor(c.hex)}"></i>${esc(c.name)}</button>`).join('')}</div>` : ''}
    <h3 class="spec-title">Características completas</h3>${specs ? `<div class="detail-specs">${specs}</div>` : '<p class="muted">Consulta las características por WhatsApp.</p>'}
    <button type="button" class="primary whatsapp" data-detail-action="consult">${waSvg} Consultar por WhatsApp</button>
    ${!unavailable(p)?`<button type="button" class="primary cart-detail-btn" data-detail-action="cart-add">${cartPlusSvg} Añadir al carrito</button>`:''}
    <div class="notice">Confirma disponibilidad, precio y entrega con la tienda.</div></div>`;
}
function openProduct(id) {
  const p = getProduct(id); if(!p) return;
  pausedVideosExcept(null);
  currentId = id; photoIndex = Math.max(0,p.photos.findIndex(ph=>ph.color===selection(p))); 
  renderDetails(p); modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
}
function closeProduct() {pausedVideosExcept(null);modal.classList.remove('show');modal.setAttribute('aria-hidden','true');currentId=null;}
// El usuario debe estar ACTIVO en WhatsApp; un usuario solamente reservado no abre chats.
function normalizeWhatsAppUsername(value){return String(value||'').trim().replace(/^@+/, '');}
function validWhatsAppUsername(value){return /^[a-zA-Z0-9._]{3,40}$/.test(value);}
function waLink(message){
  const phone=String(settings.whatsapp||'').replace(/\D/g,'');
  const username=normalizeWhatsAppUsername(settings.whatsappUsername);
  const useUsername=settings.whatsappMode==='username';
  const target=useUsername && validWhatsAppUsername(username)
    ? username
    : (/^\d{8,15}$/.test(phone) ? phone : '');
  if(!target){notify('Configura el usuario o número de WhatsApp en Administración.');return;}
  // WhatsApp documenta wa.me/Usuario; comprobar en el dispositivo si el texto se precarga.
  window.open(`https://wa.me/${encodeURIComponent(target)}?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer');
}
function productLabel(p){
  const color=selection(p);
  return `${p.name} (Código: ${p.code})${color?', color '+color:''}`;
}
function consultProduct(id){
  const p=getProduct(id);if(!p)return;
  const label=productLabel(p);
  waLink(unavailable(p)
    ? `Hola, me interesa ${label}, pero está agotado. ¿Podrían avisarme cuando esté disponible?`
    : `Hola, quisiera consultar por ${label}. ¿Me brindan más información?`);
}
function cartTotal(){return cart.reduce((n,item)=>n+item.qty,0);}
function saveCart(){localStorage.setItem('jcyg_cart_v2',JSON.stringify(cart));updateCartBadges();}
function updateCartBadges(){document.querySelectorAll('.cart-count').forEach(el=>el.textContent=cartTotal());}
function addToCart(id){
  const p=getProduct(id);if(!p)return;if(unavailable(p)){notify('Producto agotado. Usa WhatsApp para pedir un aviso.');return;}
  const color=selection(p), item=cart.find(i=>i.id===id&&i.color===color);
  if(p.stockByColor && !color){notify('Selecciona un color disponible.');return;}
  const selectedQty=cart.filter(i=>i.id===id).reduce((a,i)=>a+i.qty,0);
  const selectedColorQty=cart.filter(i=>i.id===id&&i.color===color).reduce((a,i)=>a+i.qty,0);
  if(selectedQty>=p.stock || selectedColorQty>=colorAvailability(p,color)){
    notify('No hay más unidades disponibles de ese color.');return;
  }
  if(item)item.qty++;else cart.push({id,color,qty:1});
  saveCart();notify('Producto agregado al carrito.');
}
function cartPanel(){
  // El carrito solo guarda IDs, colores y unidades; siempre relee los datos actuales del catálogo.
  cart=cart.filter(i=>getProduct(i.id));saveCart();
  const rows=cart.map((item,i)=>{const p=getProduct(item.id);return `<div class="cart-row"><img src="${esc(safeImage(photoForColor(p,item.color)))}" alt=""><div class="cart-row-main"><b>${esc(p.name)}</b><small>${esc(p.code)}${item.color?' · '+esc(item.color):''}</small><span>${money(p.price)} × ${item.qty}</span>${unavailable(p)||item.qty>colorAvailability(p,item.color)?'<em>Stock insuficiente: revisa la cantidad antes de enviar el pedido</em>':''}</div><div class="cart-controls"><button type="button" data-cart="minus" data-index="${i}" aria-label="Disminuir">−</button><b>${item.qty}</b><button type="button" data-cart="plus" data-index="${i}" aria-label="Aumentar">+</button><button type="button" data-cart="remove" data-index="${i}" aria-label="Quitar">✕</button></div></div>`}).join('');
  const total=cart.reduce((n,i)=>{const p=getProduct(i.id);return n+(!unavailable(p)&&i.qty<=colorAvailability(p,i.color)?p.price*i.qty:0)},0);
  sheet.innerHTML=`<div class="detail-wrap cart-panel"><button class="close" type="button" data-cart="close">✕</button><h2>Tu carrito</h2><p class="muted">${cartTotal()} unidades agregadas</p>${rows||'<p class="muted">Todavía no agregaste productos.</p>'}<div class="cart-total"><b>Total estimado</b><b>${money(total)}</b></div><button type="button" class="primary whatsapp" data-cart="checkout" ${!cart.some(i=>{const p=getProduct(i.id);return p&&!unavailable(p)&&i.qty<=colorAvailability(p,i.color);})?'disabled':''}>${waSvg} Enviar pedido por WhatsApp</button><p class="notice">El pedido se enviará por WhatsApp. No se cobra ni se reserva stock automáticamente.</p></div>`;
  modal.classList.add('show');modal.setAttribute('aria-hidden','false');currentId=null;
}
function checkoutCart(){
  const items=cart.map(i=>({...i,product:getProduct(i.id)})).filter(i=>i.product&&!unavailable(i.product)&&i.qty<=colorAvailability(i.product,i.color));
  if(!items.length){notify('No hay productos disponibles en tu carrito.');return;}
  const total=items.reduce((n,i)=>n+i.product.price*i.qty,0);
  const lines=items.map((i,k)=>`${k+1}. ${i.product.name} | Código: ${i.product.code}${i.color?' | Color: '+i.color:''} | Cantidad: ${i.qty} | Subtotal: ${money(i.product.price*i.qty)}`);
  waLink(`Hola, quiero consultar este pedido de JCYG STORE:\n\n${lines.join('\n')}\n\nTOTAL ESTIMADO: ${money(total)}\n¿Pueden confirmar disponibilidad y entrega?`);
}
async function toggleLike(id){
  if(!db||!sdk){notify('Espera a que conecte Firebase.');return;}
  if(!getProduct(id))return;
  const had=likes.has(id),next=!had;
  // Bloqueo local mientras se completa la transacción.
  if(likePending.has(id))return;likePending.add(id);
  try{
    const ref=sdk.doc(db,'productLikes',id);
    await sdk.runTransaction(db,async tx=>{
      const snap=await tx.get(ref);const old=Math.max(0,Number(snap.data()?.count)||0);
      const count=Math.max(0,old+(next?1:-1));
      tx.set(ref,{count});
    });
    if(next)likes.add(id);else likes.delete(id);
    localStorage.setItem('jcyg_likes_v2',JSON.stringify([...likes]));
    updateLikeButtons();
  }catch(e){console.error('Me gusta:',e);notify('No se pudo actualizar el contador. Revisa las reglas de Firestore.');}
  finally{likePending.delete(id);}
}
const likePending=new Set();
function updateLikeButtons(){
  for(const card of feed.querySelectorAll('.card')){
    const id=card.dataset.id,btn=card.querySelector('[data-action="like"]');if(!btn)continue;
    btn.classList.toggle('liked',likes.has(id));btn.setAttribute('aria-pressed',String(likes.has(id)));
    const label=btn.querySelector('.likes-text');if(label)label.textContent=String(likeCounts.get(id)||0);
  }
}
document.addEventListener('play',e=>{if(e.target.matches?.('video.jcyg-product-video'))pausedVideosExcept(e.target);},true);
feed.addEventListener('click',(e) => {
  const btn = e.target.closest('[data-action]'); if(!btn) return;
  if(btn.dataset.action === 'admin') {openAdmin();return;}
  const card = btn.closest('.card'); if(!card) return;
  const id = card.dataset.id, action = btn.dataset.action;
  if(action==='like') toggleLike(id);
  if(action==='photo-dot'){showCardPhoto(card,Number(btn.dataset.photoIndex),true);return;}
  if(action==='details') openProduct(id);
  if(action==='consult') consultProduct(id);
  if(action==='cart-add') addToCart(id);
  if(action==='color') {const p=getProduct(id);const c=p?.colors[Number(btn.dataset.colorIndex)];if(c)chooseColor(id,c.name);}
});
modal.addEventListener('click',e => {
  if(e.target===modal) {closeProduct();return;}
  const cb=e.target.closest('[data-cart]');
  if(cb){
    const action=cb.dataset.cart,index=Number(cb.dataset.index),item=cart[index];
    if(action==='close')closeProduct();
    if(action==='checkout')checkoutCart();
    if(item){if(action==='remove')cart.splice(index,1);if(action==='minus'){item.qty--;if(item.qty<=0)cart.splice(index,1);}
      if(action==='plus'){const p=getProduct(item.id),sum=cart.filter(i=>i.id===item.id).reduce((n,i)=>n+i.qty,0);if(!unavailable(p)&&sum<p.stock && item.qty<colorAvailability(p,item.color))item.qty++;else notify('Stock máximo alcanzado para ese color.');}
      saveCart();cartPanel();}return;
  }
  const b=e.target.closest('[data-detail-action]'); if(!b) return;
  const p=getProduct(currentId);if(!p)return;
  if(b.dataset.detailAction==='close') closeProduct();
  if(b.dataset.detailAction==='consult') consultProduct(p.id);
  if(b.dataset.detailAction==='cart-add'){addToCart(p.id);}
  if(b.dataset.detailAction==='color') {const c=p.colors[Number(b.dataset.colorIndex)];if(c)chooseColor(p.id,c.name);}
  if(b.dataset.detailAction==='photo') {
    const priorScroll=sheet.scrollTop;photoIndex=Number(b.dataset.photoIndex);renderDetails(p);sheet.scrollTop=priorScroll;
  }
});
function openAdmin(){adminOverlay.classList.add('show');adminOverlay.setAttribute('aria-hidden','false');renderAdmin();}
function closeAdmin(){if(saving||savingSale)return;adminOverlay.classList.remove('show');adminOverlay.setAttribute('aria-hidden','true');}
$('admin-close').addEventListener('click',closeAdmin);
adminOverlay.addEventListener('click', e => {if(e.target===adminOverlay)closeAdmin();});
document.addEventListener('keydown',e => {if(e.key==='Escape'){if(adminOverlay.classList.contains('show'))closeAdmin();else closeProduct();}});
function adminTabs(){return `<div class="admin-tabs">
  <button type="button" data-admin-action="tab-products" class="${adminTab==='products'?'active':''}">Productos</button>
  <button type="button" data-admin-action="tab-sales" class="${adminTab==='sales'?'active':''}">Ventas</button>
  <button type="button" data-admin-action="tab-settings" class="${adminTab==='settings'?'active':''}">WhatsApp de la tienda</button>
  <button type="button" data-admin-action="logout">Salir de administración</button>
</div>`;}
function renderAdmin() {
  if(!firebaseReady) {
    adminContent.innerHTML = `<div class="login-wrap"><h2>Activar administración</h2><p>El catálogo de ejemplo ya está listo. Para iniciar sesión con una contraseña segura, primero conecta este proyecto a Firebase.</p><div class="admin-note">Consulta <strong>README.md</strong> y completa <strong>firebase-config.js</strong>. Habilita Email/Contraseña y Firestore, y publica las reglas de Firestore. Para fotos desde este panel configura Cloudinary y el Worker gratuito; no necesitas Firebase Storage.</div><button class="admin-secondary" data-admin-action="close">Volver a la tienda</button></div>`;return;
  }
  if(!sdk) {adminContent.innerHTML = '<div class="login-wrap"><h2>Conectando con Firebase…</h2><p>Comprueba tu conexión a internet.</p></div>';return;}
  if(!activeUser) {
    adminContent.innerHTML=`<div class="login-wrap"><h2>Acceso de administrador</h2>
      <form id="login-form"><label class="admin-field">Correo administrador<input required autocomplete="username" type="email" name="email"></label>
      <label class="admin-field" style="margin-top:14px">Contraseña<input required autocomplete="current-password" type="password" name="password" minlength="6"></label>
      <button class="admin-primary" type="submit" style="margin-top:19px;width:100%">Ingresar al panel</button><div id="login-status" aria-live="polite"></div></form></div>`;return;
  }
  if(!isAdmin()) {
    adminContent.innerHTML=`<div class="login-wrap"><h2>Cuenta sin permisos</h2><p>El usuario que ingresó no coincide con el UID autorizado en este proyecto.</p><button class="admin-secondary" data-admin-action="logout">Cerrar sesión</button></div>`;return;
  }
  if(adminTab==='editor') {renderEditor();return;}
  if(adminTab==='sale-editor') {renderSaleEditor();return;}
  if(adminTab==='sales') {renderSales();return;}
  if(adminTab==='settings') {renderSettings();return;}
  adminContent.innerHTML=`<div class="admin-topline"><div><h2>Productos publicados</h2><p class="muted">Administra el inventario y el catálogo desde aquí.</p></div><button class="admin-primary" data-admin-action="new">＋ Agregar producto</button></div>
    ${adminTabs()}
    <div class="admin-product-list">${adminProducts.length ? adminProducts.map(p=>`<div class="admin-item">
      <img src="${esc(safeImage(mainImage(p)))}" alt="${esc(p.name)}"><div><div class="admin-item-title">${esc(p.name)}</div><div class="admin-item-sub">${esc(p.code)} · ${money(p.price)} · ${unavailable(p)?'AGOTADO':p.stock+' disponibles'} · ${p.photos.length}/10 archivos</div><div class="admin-item-status ${!p.published?'draft':''}">${p.published?'● Publicado':'● Borrador (no visible)'}</div></div>
      <div class="admin-actions"><button type="button" class="admin-secondary" data-admin-action="edit" data-id="${esc(p.id)}">Editar</button><button type="button" class="admin-danger" data-admin-action="delete" data-id="${esc(p.id)}">Eliminar</button><button type="button" class="admin-primary admin-sale-button" data-admin-action="new-sale" data-id="${esc(p.id)}" ${p.stock<=0?'disabled title="Sin unidades disponibles"':''}>＋ Venta</button></div>
    </div>`).join('') : '<div class="admin-note">Todavía no hay productos publicados. Usa «Agregar producto» para comenzar.</div>'}</div>`;
}
// Las ventas se guardan como documentos independientes en settings (sale_*):
// la colección ya permite escritura solo al administrador con las reglas existentes.
// Cada registro se crea en la misma transacción que descuenta el stock del producto.
function saleDate(value){
  const date=value?.toDate?.();
  return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toLocaleString('es-PE',{dateStyle:'medium',timeStyle:'short'}) : 'Registrando…';
}
function openSaleEditor(id){
  if(savingSale)return;
  const p=adminProducts.find(item=>item.id===id);
  if(!p||p.stock<1){notify('No hay stock disponible para registrar la venta.');return;}
  saleProductId=id;
  adminTab='sale-editor';
  renderAdmin();
}
function renderSaleEditor(){
  const p=adminProducts.find(item=>item.id===saleProductId);
  if(!p){adminTab='products';renderAdmin();return;}
  adminContent.innerHTML=`<div class="admin-topline"><h2>Registrar venta</h2><button type="button" class="admin-secondary" data-admin-action="tab-products">← Regresar</button></div>
    <div class="sale-product-summary"><img src="${esc(safeImage(mainImage(p)))}" alt="${esc(p.name)}"><div><strong>${esc(p.name)}</strong><div class="muted">Código: ${esc(p.code)}</div><div class="muted">${p.stock} unidades disponibles · ${money(p.price)} c/u</div></div></div>
    <form id="sale-form" class="admin-panel">
      <div class="editor-grid">
        <label class="admin-field">Cantidad vendida<input type="number" name="quantity" min="1" max="${p.stock}" step="1" value="1" required></label>
        <label class="admin-field">Color
          <select name="color" ${p.colors.length?'required':''}>
            ${p.colors.length ? `<option value="">Seleccionar color</option>${p.colors.map(c=>`<option value="${esc(c.name)}" ${colorSoldOut(p,c)?'disabled':''}>${esc(c.name)}${p.stockByColor?' · '+c.qty+' disponibles':''}</option>`).join('')}` : '<option value="">Sin color especificado</option>'}
          </select>
        </label>
        <label class="admin-field span-all">Observación (opcional)
          <textarea name="note" maxlength="900" rows="4"></textarea>
        </label>
      </div>
      <div class="sale-preview">Total de la venta: <strong id="sale-total">${money(p.price)}</strong><span id="sale-stock-preview" class="muted">Quedarán ${p.stock-1} disponibles</span></div>
      <div id="sale-status" class="admin-working" role="status" aria-live="polite"></div>
      <div class="form-footer"><button class="admin-secondary" type="button" data-admin-action="tab-products">Cancelar</button><button class="admin-primary" id="confirm-sale" type="submit">Registrar venta y descontar stock</button></div>
    </form>`;
}
function updateSalePreview(){
  const form=adminContent.querySelector('#sale-form');
  const p=adminProducts.find(item=>item.id===saleProductId);
  if(!form||!p)return;
  const qty=Number(form.elements.quantity.value);
  const color=form.elements.color.value;
  const available=colorAvailability(p,color);
  const valid=Number.isInteger(qty)&&qty>=1&&qty<=p.stock&&(!p.stockByColor||qty<=available);
  const total=adminContent.querySelector('#sale-total');
  const remaining=adminContent.querySelector('#sale-stock-preview');
  if(total)total.textContent=valid?money(p.price*qty):'—';
  if(remaining)remaining.textContent=valid?`Quedarán ${p.stock-qty} disponibles${p.stockByColor?' · '+(available-qty)+' del color '+color:''}`:`Selecciona un color con stock suficiente (máx. ${p.stock})`;
}
async function registerSale(form){
  if(savingSale||!isAdmin()||!db||!sdk)return;
  const p=adminProducts.find(item=>item.id===saleProductId);
  const status=adminContent.querySelector('#sale-status');
  if(!p){if(status)status.textContent='El producto ya no está disponible.';return;}
  const quantity=Number(form.elements.quantity.value);
  const color=String(form.elements.color.value||'');
  const note=String(form.elements.note.value||'').trim().slice(0,900);
  if(!Number.isInteger(quantity)||quantity<1||quantity>p.stock){status.textContent='Ingresa una cantidad válida según el stock.';return;}
  if(p.colors.length && !p.colors.some(c=>c.name===color)){status.textContent='Selecciona un color del producto.';return;}
  if(p.stockByColor && quantity>colorAvailability(p,color)){status.textContent='No hay suficientes unidades de ese color.';return;}
  savingSale=true;
  const btn=adminContent.querySelector('#confirm-sale');if(btn)btn.disabled=true;
  status.textContent='Registrando venta…';
  try{
    const productRef=sdk.doc(db,'products',p.id);
    // Cada venta es un documento independiente de settings, accesible solo al administrador.
    const saleRef=sdk.doc(sdk.collection(db,'settings'));
    await sdk.runTransaction(db,async tx=>{
      const snap=await tx.get(productRef);
      if(!snap.exists())throw Error('El producto fue eliminado.');
      const data=snap.data();
      const currentStock=Number(data.stock);
      if(!Number.isInteger(currentStock)||currentStock<quantity)throw Error('El stock cambió. Actualiza el inventario y vuelve a intentar.');
      if(Array.isArray(data.colors)&&data.colors.length && !data.colors.some(c=>c.name===color))throw Error('El color ya no está disponible.');
      let colorsAfter=null;
      if(data.stockByColor===true){
        const chosen=(data.colors||[]).find(c=>c.name===color);
        if(!chosen || !Number.isInteger(Number(chosen.qty)) || Number(chosen.qty)<quantity)
          throw Error('El stock de ese color cambió. Actualiza e inténtalo nuevamente.');
        colorsAfter=data.colors.map(c=>c.name===color?{...c,qty:Number(c.qty)-quantity}:c);
      }
      const remaining=currentStock-quantity;
      const unitPrice=Number(data.price)||0;
      if(unitPrice<=0)throw Error('El precio del producto no es válido.');
      tx.update(productRef,{stock:remaining,...(colorsAfter?{colors:colorsAfter}:{}),outOfStock:remaining===0||data.outOfStock===true,updatedAt:sdk.serverTimestamp()});
      tx.set(saleRef,{
        recordType:'sale',productId:p.id,productCode:String(data.code||p.code||''),
        productName:String(data.name||p.name||''),color,quantity,
        unitPrice,total:Number((unitPrice*quantity).toFixed(2)),note,
        stockBefore:currentStock,stockAfter:remaining,
        createdAt:sdk.serverTimestamp(),createdBy:activeUser.uid
      });
    });
    saleProductId=null;adminTab='sales';notify('Venta registrada. Stock actualizado.');renderAdmin();
  }catch(err){
    console.error('Venta JCYG STORE:',err);
    status.textContent=err.code==='permission-denied'?'No tienes permisos para registrar ventas en Firestore.':(err.message||'No se pudo registrar la venta.');
    if(btn)btn.disabled=false;
  }finally{savingSale=false;}
}
function renderSales(){
  const history=sales.slice().sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0));
  const quantity=history.reduce((sum,item)=>sum+(Number(item.quantity)||0),0);
  const total=history.reduce((sum,item)=>sum+(Number(item.total)||0),0);
  adminContent.innerHTML=`<div class="admin-topline"><h2>Ventas realizadas</h2></div>${adminTabs()}
    <div class="sales-metrics"><div><span>Ventas</span><strong>${history.length}</strong></div><div><span>Unidades vendidas</span><strong>${quantity}</strong></div><div><span>Total registrado</span><strong>${money(total)}</strong></div></div>
    ${salesLoadError?'<p class="admin-error">No se pudo cargar el historial de ventas. Revisa los permisos de Firestore.</p>':''}
    <div class="sales-history">${history.length?history.map(item=>`
      <article class="sale-record"><div class="sale-record-heading"><strong>${esc(item.productName||'Producto eliminado')}</strong><span>${saleDate(item.createdAt)}</span></div>
        <div class="sale-record-details">${esc(item.productCode)} · ${esc(item.color||'Sin color')} · ${Number(item.quantity)||0} unidad(es) · ${money(item.unitPrice)} c/u</div>
        <div class="sale-record-amount">Total: <strong>${money(item.total)}</strong></div>
        ${editingSaleNoteId===item.id?`<form class="sale-note-form" data-sale-id="${esc(item.id)}"><label class="admin-field">Observación<textarea name="note" rows="3" maxlength="900">${esc(item.note||'')}</textarea></label><div class="form-footer"><button type="button" class="admin-secondary" data-admin-action="cancel-note">Cancelar</button><button type="submit" class="admin-primary">Guardar observación</button></div><div class="admin-working" data-note-status></div></form>`:
        `<p class="sale-note"><b>Observación:</b> ${item.note?esc(item.note):'Sin observación'}</p><button type="button" class="admin-secondary sale-note-edit" data-admin-action="edit-note" data-id="${esc(item.id)}">Editar observación</button>`}
      </article>`).join(''):'<div class="admin-panel"><p class="muted">Todavía no has registrado ventas. Usa el botón «＋ Venta» junto a un producto.</p></div>'}</div>`;
}
async function saveSaleNote(form){
  if(!isAdmin()||!sdk||!db)return;
  const id=form.dataset.saleId;
  if(!sales.some(s=>s.id===id))return;
  const status=form.querySelector('[data-note-status]');
  const button=form.querySelector('[type=submit]');
  const note=String(form.elements.note.value||'').trim().slice(0,900);
  button.disabled=true;
  try{
    await sdk.updateDoc(sdk.doc(db,'settings',id),{note,updatedAt:sdk.serverTimestamp()});
    editingSaleNoteId=null;
    notify('Observación actualizada.');
    renderAdmin();
  }catch(err){console.error('Observación venta:',err);status.textContent='No se pudo guardar la observación.';button.disabled=false;}
}
function renderSettings(){
  const mode=settings.whatsappMode==='username'?'username':'number';
  const current=mode==='username'
    ? (settings.whatsappUsername ? '@'+normalizeWhatsAppUsername(settings.whatsappUsername) : '')
    : String(settings.whatsapp||'');
  adminContent.innerHTML=`<div class="admin-topline"><h2>WhatsApp de la tienda</h2></div>${adminTabs()}
    <div class="admin-panel"><form id="settings-form">
      <label class="admin-field">Tipo de contacto
        <select name="whatsappMode">
          <option value="username" ${mode==='username'?'selected':''}>Por nombre de usuario</option>
          <option value="number" ${mode==='number'?'selected':''}>Por número de celular</option>
        </select>
      </label>
      <label class="admin-field" style="margin-top:14px"><span id="whatsapp-contact-label">${mode==='username'?'Usuario de WhatsApp':'Número de celular'}</span>
        <input name="whatsappContact" type="text" inputmode="${mode==='username'?'text':'tel'}" maxlength="50" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(current)}" required>
      </label>
      <button class="admin-primary" type="submit" style="margin-top:17px">Guardar</button>
      <div id="settings-status" aria-live="polite"></div>
    </form></div>`;
  // Guarda temporalmente lo escrito cuando se cambia de modo, sin alterar Firebase.
  const select=adminContent.querySelector('[name="whatsappMode"]');
  const field=adminContent.querySelector('[name="whatsappContact"]');
  const label=adminContent.querySelector('#whatsapp-contact-label');
  const drafts={username:settings.whatsappUsername?'@'+normalizeWhatsAppUsername(settings.whatsappUsername):'',number:String(settings.whatsapp||'')};
  let currentMode=mode;
  select.addEventListener('change',()=>{
    drafts[currentMode]=field.value;
    currentMode=select.value==='username'?'username':'number';
    field.value=drafts[currentMode];
    field.inputMode=currentMode==='username'?'text':'tel';
    label.textContent=currentMode==='username'?'Usuario de WhatsApp':'Número de celular';
  });
}
function clearPhotoPreviews(){editorPhotos.forEach(p=>{if(p.preview?.startsWith('blob:'))URL.revokeObjectURL(p.preview);});}
function openEditor(id=null){
  clearPhotoPreviews();editId=id;adminTab='editor';const existing=adminProducts.find(p=>p.id===id);
  editorColorStockMode=existing ? existing.stockByColor : true;
  editorOpeningStock=existing ? existing.stock : null;
  editorColors=existing ? existing.colors.map(c=>({...c})) : [];
  editorPhotos=existing ? existing.photos.map((p,i)=>({...p,id:`saved-${i}`,file:null,preview:p.url})) : [];
  editorAutoCode=null;
  if(!existing){try{editorAutoCode=formattedCode(nextCodeNumber());}catch(e){notify(e.message);editorAutoCode='';}}
  renderAdmin();
}
function makeCode(){return formattedCode(nextCodeNumber());}
function renderEditor(){
  const p=adminProducts.find(x=>x.id===editId);
  adminContent.innerHTML=`<div class="admin-topline"><h2>${p?'Editar producto':'Agregar producto'}</h2><button type="button" class="admin-secondary" data-admin-action="cancel-editor">← Regresar</button></div>
  <form id="editor-form"><div class="admin-panel"><h3>Información principal</h3>
    <div class="editor-grid">
      <label class="admin-field span-all">Nombre del producto<input name="name" required maxlength="130" value="${esc(p?.name||'')}"></label>
      <label class="admin-field">Código del producto (automático, editable)<input name="code" maxlength="7" minlength="7" pattern="[Jj][Ss]-[0-9]{4}" value="${esc(p?.code&&CODE_PATTERN.test(p.code)?p.code:(editorAutoCode||''))}" autocapitalize="characters"></label>
      <label class="admin-field span-all">Descripción breve<textarea name="desc" maxlength="500" rows="3">${esc(p?.desc||'')}</textarea></label>
      <label class="admin-field">Precio actual (S/)<input type="number" name="price" required min="0.01" step="0.01" value="${p?.price||''}"></label>
      <label class="admin-field">Precio anterior (opcional)<input type="number" name="oldPrice" min="0" step="0.01" value="${p?.oldPrice||''}"></label>
      <label class="admin-field">Cantidad disponible
        <input type="number" name="stock" required min="0" step="1" value="${editorColorStockMode?editorColors.reduce((n,c)=>n+Math.max(0,Number(c.qty)||0),0):(p?.stock ?? '')}" ${editorColorStockMode?'readonly':''}>
      </label>
      <label class="admin-field">Disponibilidad<select name="outOfStock"><option value="false" ${!p?.outOfStock?'selected':''}>Disponible según stock</option><option value="true" ${p?.outOfStock?'selected':''}>Agotado (stock 0 y permitir aviso por WhatsApp)</option></select></label>
      <label class="admin-field">Estado<select name="published"><option value="true" ${p?.published!==false?'selected':''}>Publicado (visible)</option><option value="false" ${p?.published===false?'selected':''}>Borrador (oculto)</option></select></label>
    </div></div>
    <div class="admin-panel"><h3>Colores del producto</h3>
      ${!editorColorStockMode?'<button type="button" class="admin-secondary color-track-toggle" data-admin-action="enable-color-stock">Distribuir stock por colores</button>':''}
      ${editorColorStockMode?'<p class="color-stock-help">Cada toque en un color agrega 1 unidad. Usa − para descontar y ＋ para aumentar.</p>':''}
      <div id="selected-colors" class="selected-colors"></div><div id="color-palette" class="color-palette"></div>
      <div class="custom-color-row"><label class="admin-field">Color personalizado<input name="customColorName" maxlength="35"></label>
        <label class="admin-field">Tono<input name="customColorHex" type="color" value="#2563eb"></label>
        <button class="admin-secondary" type="button" data-admin-action="custom-color">Añadir</button></div></div>
    <div class="admin-panel"><h3>Fotos y videos del producto · Cloudinary</h3>
      
      <div class="editor-media-uploads">
        <label class="admin-field">Agregar fotografías PNG<input id="product-photos" type="file" accept="image/png,.png" multiple></label>
        <label class="admin-field">Agregar videos MP4<input id="product-videos" type="file" accept="video/mp4,.mp4" multiple></label>
      </div>
      <div class="editor-media-hint">Hasta 10 archivos entre fotos y videos. Videos MP4 de máximo 50 MB y 60 segundos.</div>
      <div id="editor-photos" class="photo-list"></div></div>
    <div class="admin-panel"><h3>Características completas</h3><label class="admin-field">Una característica por línea, con formato Nombre: Detalle
      <textarea name="specs" rows="9">${esc((p?.specs||[]).map(s=>`${s.label}: ${s.value}`).join('\n'))}</textarea>
      </label></div>
    <div id="save-status" class="admin-working" aria-live="polite"></div>
    <div class="form-footer"><button type="button" id="cancel-product-editor" class="admin-secondary" data-admin-action="cancel-editor">Cancelar</button><button type="submit" class="admin-primary" id="save-product">Guardar producto</button></div></form>`;
  renderSelectedColors();renderEditorPhotos();
  // Captura el clic de cancelar de forma explícita, incluso si los demás campos son inválidos.
  adminContent.querySelectorAll('[data-admin-action="cancel-editor"]').forEach(button=>{
    button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();cancelEditor();});
  });
}
function renderSelectedColors(){
  const selected=$('selected-colors'),palette=$('color-palette');if(!selected||!palette)return;
  selected.innerHTML=editorColors.length ? editorColors.map((c,i)=>`<span class="selected-color"><i class="color-dot" style="background:${validColor(c.hex)}"></i>${esc(c.name)}
    ${editorColorStockMode?`<button type="button" class="color-qty-step" data-admin-action="decrease-color" data-index="${i}" aria-label="Restar una unidad de ${esc(c.name)}">−</button><b class="color-qty">${c.qty||0}</b><button type="button" class="color-qty-step" data-admin-action="increase-color" data-index="${i}" aria-label="Añadir una unidad de ${esc(c.name)}">＋</button>`:''}
    <button type="button" data-admin-action="remove-color" data-index="${i}" aria-label="Eliminar color ${esc(c.name)}">✕</button></span>`).join('') : '';
  palette.innerHTML=PALETTE.map(([name,hex])=>`<button type="button" class="palette-choice" data-admin-action="add-color" data-color-name="${esc(name)}" ${!editorColorStockMode&&editorColors.some(c=>c.name.toLowerCase()===name.toLowerCase())?'disabled':''}><span class="color-dot" style="background:${hex}"></span>${esc(name)}</button>`).join('');
  syncEditorStock();
}
function renderEditorPhotos(){
  const wrap=$('editor-photos');if(!wrap)return;
  wrap.innerHTML=editorPhotos.length ? editorPhotos.map((ph,i)=>`<div class="photo-tile">
    ${isVideo(ph)?`<video class="admin-media-preview" src="${esc(ph.preview||ph.url)}" playsinline controls preload="none"></video>`:`<img src="${esc(safeImage(ph.preview||ph.url))}" alt="Foto ${i+1}">`}
    <label for="photo-color-${i}">${isVideo(ph)?'Video':'Foto'} ${i+1} · Asociar al color</label><select id="photo-color-${i}" data-photo-color="${esc(ph.id)}"><option value="">Sin color específico</option>
    ${editorColors.map(c=>`<option value="${esc(c.name)}" ${ph.color===c.name?'selected':''}>${esc(c.name)}</option>`).join('')}</select>
    <button type="button" data-admin-action="remove-photo" data-photo-id="${esc(ph.id)}">✕ Quitar ${isVideo(ph)?'video':'foto'}</button></div>`).join('') : '';
}
function syncEditorStock(){
  const field=adminContent.querySelector('#editor-form [name="stock"]');
  if(field && editorColorStockMode){
    const count=editorColors.reduce((n,c)=>n+Math.max(0,Number(c.qty)||0),0);
    field.value=String(count);
    const availability=adminContent.querySelector('#editor-form [name="outOfStock"]');
    if(count>0 && availability?.value==='true')availability.value='false';
  }
}
function addColor(name,hex){
  name=String(name||'').trim().slice(0,35);if(!name)return notify('Escribe el nombre del color.');
  const existing=editorColors.find(c=>c.name.toLowerCase()===name.toLowerCase());
  if(existing){
    if(!editorColorStockMode)return notify('Ese color ya está agregado.');
    existing.qty=Math.min(99999,(existing.qty||0)+1);
  }else editorColors.push({name,hex:validColor(hex),qty:editorColorStockMode?1:0});
  renderSelectedColors();renderEditorPhotos();
}
function returnToProducts(){
  if(saving||savingSale){notify('Espera a que termine de guardarse el registro.');return;}
  clearPhotoPreviews();editorPhotos=[];editorColors=[];editorColorStockMode=false;editorOpeningStock=null;editId=null;editorAutoCode=null;adminTab='products';renderAdmin();
}
function cancelEditor(){
  // Cancelar descarta únicamente los cambios locales; no borra fotos ya publicadas.
  returnToProducts();
}
async function handleLogin(form){
  const status=$('login-status');status.textContent='Verificando credenciales…';
  const b=form.querySelector('[type=submit]');b.disabled=true;
  try{await sdk.signInWithEmailAndPassword(auth,form.elements.email.value.trim(),form.elements.password.value);}catch(e){
    status.innerHTML='<p class="admin-error">No se pudo ingresar. Revisa el correo, contraseña y la configuración de Authentication.</p>';
    b.disabled=false;
  }
}
async function saveSettings(form){
  const status=$('settings-status');
  const mode=form.elements.whatsappMode.value==='username'?'username':'number';
  const contact=form.elements.whatsappContact.value.trim();
  let phone=String(settings.whatsapp||'').replace(/\D/g,'');
  let username=normalizeWhatsAppUsername(settings.whatsappUsername);
  if(mode==='number'){
    phone=contact.replace(/\D/g,'');
    if(!/^\d{8,15}$/.test(phone)){
      status.innerHTML='<p class="admin-error">Ingresa un número válido con código de país.</p>';return;
    }
  }else{
    username=normalizeWhatsAppUsername(contact);
    if(!validWhatsAppUsername(username)){
      status.innerHTML='<p class="admin-error">Ingresa un usuario válido de WhatsApp.</p>';return;
    }
  }
  try{
    const next={whatsapp:phone,whatsappUsername:username,whatsappMode:mode};
    await sdk.setDoc(sdk.doc(db,'settings','storefront'),{...next,updatedAt:sdk.serverTimestamp()},{merge:true});
    settings={...settings,...next};notify('WhatsApp guardado.');renderSettings();
  }catch(e){
    status.innerHTML='<p class="admin-error">No se pudo guardar. Intenta nuevamente.</p>';
    console.error('Error al guardar WhatsApp:',e);
  }
}
function parseSpecs(value){return String(value).split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map(line=>{
  const pos=line.indexOf(':');return pos<0?{label:'Detalle',value:line.slice(0,550)}:{label:line.slice(0,pos).trim().slice(0,90)||'Detalle',value:line.slice(pos+1).trim().slice(0,550)};
}).slice(0,60);}
// ===== Cloudinary: fotos PNG transparentes; el API Secret permanece EN EL WORKER. =====
const CLOUDINARY_PREFIX = 'jcyg-store/products/';
const isCloudinaryPublicId = v => typeof v === 'string' && v.startsWith(CLOUDINARY_PREFIX) && /^[a-z0-9_\-/]+$/i.test(v);
function workerReady(){
  return /^https:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(cloudinaryWorkerUrl) && !cloudinaryWorkerUrl.includes('REEMPLAZAR');
}
// Evita que el formulario permanezca indefinidamente esperando un archivo o token.
async function waitLimit(promise, milliseconds, detail) {
  let handle;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => { handle = setTimeout(() => reject(new Error(detail)), milliseconds); })
    ]);
  } finally { clearTimeout(handle); }
}
async function makePNG(file) {
  if (file.type !== 'image/png' || !/\.png$/i.test(file.name)) throw Error('Solo se aceptan archivos PNG.');
  if (file.size > 10 * 1024 * 1024) throw Error('El PNG supera 10 MB. Elige uno más ligero.');
  const local = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = local;
    await waitLimit(img.decode(), 15000, 'La imagen no pudo abrirse. Comprueba que sea un PNG válido.');
    if (img.naturalWidth > 6000 || img.naturalHeight > 6000) throw Error('Imagen demasiado grande. Reduce su tamaño.');
    // Procesar en un lienzo de máximo 1600 px para no sobrecargar los móviles.
    const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d', {willReadFrequently: true});
    if (!ctx) throw Error('El navegador no permite procesar imágenes.');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const w = canvas.width, h = canvas.height;
    const data = ctx.getImageData(0, 0, w, h).data;
    let hasTransparency = false;
    let left = w, top = h, right = -1, bottom = -1;
    // 10/255 conserva contornos antialias y sombras sin contar píxeles casi invisibles.
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const alpha = data[(y * w + x) * 4 + 3];
        if (alpha < 245) hasTransparency = true;
        if (alpha >= 10) {
          if (x < left) left = x;
          if (x > right) right = x;
          if (y < top) top = y;
          if (y > bottom) bottom = y;
        }
      }
    }
    if (!hasTransparency) throw Error('Esta imagen no tiene transparencia. Sube un PNG sin fondo.');
    if (right < left || bottom < top) throw Error('El PNG está vacío. Añade una foto del producto.');
    // Mantener un margen visible cercano al 4% alrededor del objeto.
    const objW = right - left + 1, objH = bottom - top + 1;
    const padding = Math.max(5, Math.round(Math.max(objW, objH) * 0.045));
    left = Math.max(0, left - padding);
    right = Math.min(w - 1, right + padding);
    top = Math.max(0, top - padding);
    bottom = Math.min(h - 1, bottom + padding);
    const trimmed = document.createElement('canvas');
    trimmed.width = right - left + 1;
    trimmed.height = bottom - top + 1;
    trimmed.getContext('2d').drawImage(canvas, left, top, trimmed.width, trimmed.height,
      0, 0, trimmed.width, trimmed.height);
    return await new Promise((resolve, reject) => trimmed.toBlob(
      blob => blob ? resolve(blob) : reject(Error('No se pudo preparar la fotografía.')),
      'image/png'
    ));
  } finally { URL.revokeObjectURL(local); }
}
async function checkVideoMP4(file){
  if(!/\.mp4$/i.test(file.name) || !['video/mp4','application/octet-stream',''].includes(file.type))throw Error('Selecciona un video MP4.');
  if(file.size>50*1024*1024)throw Error('El video supera 50 MB. Usa un archivo más pequeño.');
  const local=URL.createObjectURL(file);
  try{
    const video=document.createElement('video');video.preload='metadata';video.src=local;
    await waitLimit(new Promise((resolve,reject)=>{
      video.onloadedmetadata=()=>resolve(); video.onerror=()=>reject(Error('No se pudo leer el video MP4.'));
    }),14000,'No se pudo leer la duración del video.');
    if(!Number.isFinite(video.duration)||video.duration<=0||video.duration>60)throw Error('El video debe durar como máximo 60 segundos.');
  }finally{URL.revokeObjectURL(local);}
}
async function authorizeCloudinary(endpoint,body){
  if(!workerReady()) throw Error('Falta configurar cloudinary-config.js con la URL del Worker.');
  if(!isAdmin()) throw Error('Debes iniciar sesión como administrador.');
  const token=await waitLimit(activeUser.getIdToken(), 15000, 'Firebase no respondió al solicitar la sesión. Cierra sesión, vuelve a ingresar al administrador e inténtalo.');
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),18000);
  try {
    const response=await fetch(cloudinaryWorkerUrl.replace(/\/$/,'')+endpoint,{
      method:'POST',headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify(body||{}),signal:controller.signal
    });
    let data={};try{data=await response.json();}catch{}
    if(!response.ok) throw Error(data.error||`Servidor de subidas: HTTP ${response.status}`);
    return data;
  }catch(e){if(e.name==='AbortError')throw Error('El servidor de subidas tardó demasiado. Revisa el Worker.');throw e;}
  finally{clearTimeout(timeout);}
}
function cloudinaryUploadPNG(blob,signed,onProgress){
  return new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();
    xhr.open('POST',`https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloud_name)}/image/upload`);
    xhr.timeout=90000;
    xhr.upload.onprogress = event=> {if(event.lengthComputable)onProgress(Math.round(100*event.loaded/event.total));};
    xhr.onerror=()=>reject(Error('No se pudo conectar a Cloudinary. Comprueba la conexión.'));
    xhr.ontimeout=()=>reject(Error('Cloudinary tardó demasiado. Intenta otra vez.'));
    xhr.onload=()=>{
      let result={};try{result=JSON.parse(xhr.responseText);}catch{}
      if(xhr.status>=200 && xhr.status<300 && result.secure_url && isCloudinaryPublicId(result.public_id) && result.format==='png') resolve(result);
      else reject(Error(result?.error?.message||'Cloudinary rechazó el PNG. Revisa la configuración.'));
    };
    const form=new FormData();form.append('file',blob,'producto.png');
    for(const [key,value] of Object.entries(signed.params))form.append(key,String(value));
    form.append('api_key',signed.api_key);form.append('signature',signed.signature);
    xhr.send(form);
  });
}
function cloudinaryUploadMP4(file,signed,onProgress){
  return new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();
    xhr.open('POST',`https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloud_name)}/video/upload`);
    xhr.timeout=300000;
    xhr.upload.onprogress=event=>{if(event.lengthComputable)onProgress(Math.round(100*event.loaded/event.total));};
    xhr.onerror=()=>reject(Error('No se pudo conectar a Cloudinary para subir el video.'));
    xhr.ontimeout=()=>reject(Error('Se agotó el tiempo para subir el video. Revisa la conexión.'));
    xhr.onload=()=>{
      let result={};try{result=JSON.parse(xhr.responseText);}catch{}
      if(xhr.status>=200&&xhr.status<300&&result.resource_type==='video'&&result.format==='mp4'&&safeVideo(result.secure_url)&&isCloudinaryPublicId(result.public_id))resolve(result);
      else reject(Error(result?.error?.message||'Cloudinary rechazó el MP4. Comprueba el formato o la cuota.'));
    };
    const form=new FormData();form.append('file',file,file.name);
    for(const [key,value] of Object.entries(signed.params))form.append(key,String(value));
    form.append('api_key',signed.api_key);form.append('signature',signed.signature);
    xhr.send(form);
  });
}
async function removeCloudinaryPhoto(path,type='image'){
  if(!isCloudinaryPublicId(path)||!workerReady())return;
  try{await authorizeCloudinary('/delete',{public_id:path,resource_type:type==='video'?'video':'image'});}catch(e){console.warn('Archivo retirado del catálogo; borrado remoto pendiente:',e.message);}
}
async function saveProduct(form){
  if(saving)return;
  const status=$('save-status');const current=adminProducts.find(x=>x.id===editId);
  const name=form.elements.name.value.trim(),desc=form.elements.desc.value.trim();
  const price=Number(form.elements.price.value),oldPrice=Number(form.elements.oldPrice.value||0),outOfStock=form.elements.outOfStock.value==='true',
    stock=outOfStock?0:(editorColorStockMode?editorColors.reduce((n,c)=>n+Math.max(0,Math.floor(Number(c.qty)||0)),0):Number(form.elements.stock.value)),code=form.elements.code.value.trim().toUpperCase();
  if(!name || !Number.isFinite(price) || price<=0 || !Number.isInteger(stock) || stock<0){status.textContent='Revisa nombre, precio y cantidad disponible.';return;}
  if((code || current) && (!CODE_PATTERN.test(code) || numberFromCode(code)===0)){status.textContent='El código debe comenzar con JS- seguido de cuatro números.';return;}
  if(adminProducts.some(p=>p.id!==editId&&p.code.toUpperCase()===code) && (current || code!==editorAutoCode)){status.textContent='Ya existe un producto con ese código.';return;}
  if(oldPrice<0 || !Number.isFinite(oldPrice)){status.textContent='El precio anterior no es válido.';return;}
  if(oldPrice>0 && oldPrice<=price){status.textContent='El precio anterior debe ser superior al actual para indicar descuento, o déjalo en blanco.';return;}
  if(editorPhotos.length>10){status.textContent='Puedes agregar como máximo 10 archivos por producto.';return;}
  // Los archivos elegidos aún no tienen URL: se suben a Cloudinary antes de guardar.
  // Se conservan las URL de fotografías existentes; las nuevas se suben como archivos.
  if(editorPhotos.some(pic => !pic.file && !(isVideo(pic)?safeVideo(pic.url):( /^https:\/\//i.test(pic.url) || /^assets\/[\w.-]+\.(?:jpg|jpeg|png|webp|svg)$/i.test(pic.url))))) {
    status.textContent='Hay un archivo guardado con una ruta no válida.';
    return;
  }
  if(editorPhotos.some(pic=>pic.file) && !workerReady()){
    status.textContent='Debes configurar la URL del Worker en cloudinary-config.js para subir archivos.';return;
  }
  saving=true;const button=$('save-product');button.disabled=true;
  const uploadedPaths=[];
  try{
    const productRef=editId ? sdk.doc(db,'products',editId) : sdk.doc(sdk.collection(db,'products'));
    const photos=[];
    for(let i=0;i<editorPhotos.length;i++){
      const pic=editorPhotos[i];
      if(pic.file){
        const video=isVideo(pic);
        if(video)await checkVideoMP4(pic.file);
        else status.textContent=`Preparando foto ${i+1} de ${editorPhotos.length}…`;
        const file=video?pic.file:await waitLimit(makePNG(pic.file), 25000, 'Se agotó el tiempo preparando el PNG. Intenta con una fotografía más pequeña.');
        status.textContent=`Autorizando ${video?'video':'foto'} ${i+1} de ${editorPhotos.length}…`;
        const signed=await waitLimit(authorizeCloudinary(video?'/sign-video':'/sign'), 26000, video?'Cloudflare no autorizó el video. Actualiza primero el Worker.':'Cloudflare no respondió a tiempo.');
        if(!signed?.cloud_name || !signed?.api_key || !signed?.signature || !signed?.params)throw Error('Cloudflare devolvió una autorización incompleta.');
        status.textContent=`Subiendo ${video?'video':'foto'} ${i+1}/${editorPhotos.length} · 0%`;
        const uploaded=await (video?cloudinaryUploadMP4(file,signed,pct=>{status.textContent=`Subiendo video ${i+1}/${editorPhotos.length} · ${pct}%`;}):cloudinaryUploadPNG(file,signed,pct=>{status.textContent=`Subiendo foto ${i+1}/${editorPhotos.length} · ${pct}%`;}));
        uploadedPaths.push({path:uploaded.public_id,type:video?'video':'image'});
        photos.push({type:video?'video':'image',url:uploaded.secure_url,path:uploaded.public_id,color:pic.color||''});
      } else photos.push({type:isVideo(pic)?'video':'image',url:pic.url,path:pic.path||'',color:pic.color||''});
    }
    status.textContent='Guardando producto en Firebase Firestore…';
    const payload={name,code,desc,price,oldPrice,stock,outOfStock,stockByColor:editorColorStockMode,published:form.elements.published.value==='true',
      colors:editorColors.map(c=>({name:c.name,hex:c.hex,qty:editorColorStockMode?(outOfStock?0:Math.max(0,Math.floor(Number(c.qty)||0))):0})),photos,specs:parseSpecs(form.elements.specs.value),updatedAt:sdk.serverTimestamp()};
    // La secuencia se guarda en Firestore para no reutilizar códigos tras eliminar productos.
    const seqRef=sdk.doc(db,'settings','productCodes');
    await sdk.runTransaction(db,async transaction=>{
      const seqSnap=await transaction.get(seqRef);
      if(current){
        const serverProduct=await transaction.get(productRef);
        if(!serverProduct.exists())throw Error('Este producto ya no existe.');
        if(Number(serverProduct.data().stock)!==editorOpeningStock)
          throw Error('El stock cambió mientras editabas. Vuelve a abrir el producto para evitar perder una venta.');
      }
      const last=seqSnap.exists()?Number(seqSnap.data().lastNumber)||0:0;
      const currentMax=Math.max(last,lastKnownProductNumber,...adminProducts.map(p=>numberFromCode(p.code)),0);
      let number=numberFromCode(code);
      if(!current && (!code || code===editorAutoCode)){number=currentMax+1;payload.code=formattedCode(number);}
      const newMax=Math.max(currentMax,number);
      transaction.set(seqRef,{lastNumber:newMax},{merge:true});
      transaction.set(productRef,payload,{merge:true});
      lastKnownProductNumber=newMax;
    });
    const removed=(current?.photos||[]).filter(p=>isCloudinaryPublicId(p.path)&&!photos.some(pic=>pic.path===p.path&&pic.type===p.type));
    notify(current?'Producto actualizado.':'Producto agregado.');returnToProductsAfterSave();
    for(const item of removed)await removeCloudinaryPhoto(item.path,item.type);
  }catch(e){
    console.error('JCYG STORE: no se pudo guardar producto:',e);
    status.textContent=`No se pudo guardar: ${e.message||e.code}. Revisa la configuración y vuelve a intentar.`;
    notify('No se pudo guardar el producto. Revisa el mensaje del formulario.');
    // Si Firestore falla tras subir fotos, las fotos recién subidas se retiran para no gastar espacio.
    for(const item of uploadedPaths)await removeCloudinaryPhoto(item.path,item.type);
  }finally{saving=false;const btn=$('save-product');if(btn)btn.disabled=false;}
}
function returnToProductsAfterSave(){clearPhotoPreviews();editorPhotos=[];editorColors=[];editorColorStockMode=false;editorOpeningStock=null;editId=null;editorAutoCode=null;adminTab='products';renderAdmin();}
async function deleteProduct(id){
  const p=adminProducts.find(x=>x.id===id);if(!p)return;
  if(!confirm(`¿Eliminar definitivamente «${p.name}» del catálogo?`))return;
  try {const batch=sdk.writeBatch(db);batch.delete(sdk.doc(db,'products',id));batch.delete(sdk.doc(db,'productLikes',id));await batch.commit();cart=cart.filter(item=>item.id!==id);saveCart();likes.delete(id);localStorage.setItem('jcyg_likes_v2',JSON.stringify([...likes]));notify('Producto eliminado.');for(const ph of p.photos) await removeCloudinaryPhoto(ph.path,ph.type);}
  catch(e){notify(`Error al eliminar: ${e.code||e.message}`);}
}
adminContent.addEventListener('submit', async e=>{
  e.preventDefault();if(e.target.id==='login-form')await handleLogin(e.target);
  if(e.target.id==='settings-form')await saveSettings(e.target);
  if(e.target.id==='editor-form')await saveProduct(e.target);
  if(e.target.id==='sale-form')await registerSale(e.target);
  if(e.target.classList.contains('sale-note-form'))await saveSaleNote(e.target);
});
adminContent.addEventListener('input',e=>{if(e.target.matches('#sale-form [name="quantity"]'))updateSalePreview();});
adminContent.addEventListener('change',e=>{
  if(e.target.matches('#sale-form [name="color"]'))updateSalePreview();
  if(e.target.id==='product-photos'){
    const input=e.target;const files=[...input.files];input.value='';
    if(files.length+editorPhotos.length>10){notify('Máximo 10 fotos y videos por producto.');return;}
    if(files.some(file=>file.type!=='image/png'||!/\.png$/i.test(file.name)||file.size>10*1024*1024)){
      notify('Selecciona únicamente archivos .png de máximo 10 MB.');return;
    }
    files.forEach(file=>editorPhotos.push({type:'image',id:crypto.randomUUID(),url:'',path:'',color:'',file,preview:URL.createObjectURL(file)}));
    renderEditorPhotos();
  }
  if(e.target.id==='product-videos'){
    const input=e.target;const files=[...input.files];input.value='';
    if(files.length+editorPhotos.length>10){notify('Máximo 10 fotos y videos por producto.');return;}
    if(files.some(file=>!/\.mp4$/i.test(file.name)||!['video/mp4','application/octet-stream',''].includes(file.type)||file.size>50*1024*1024)){
      notify('Selecciona videos MP4 de máximo 50 MB.');return;
    }
    files.forEach(file=>editorPhotos.push({type:'video',id:crypto.randomUUID(),url:'',path:'',color:'',file,preview:URL.createObjectURL(file)}));
    renderEditorPhotos();
  }
  if(e.target.matches('[data-photo-color]')){
    const ph=editorPhotos.find(p=>p.id===e.target.dataset.photoColor);if(ph)ph.color=e.target.value;
  }
});
adminContent.addEventListener('click', async e=>{
  const b=e.target.closest('[data-admin-action]');if(!b)return;
  const act=b.dataset.adminAction;
  if(act==='close')return closeAdmin();
  if(act==='logout'){await sdk.signOut(auth);adminTab='products';return;}
  if(act==='tab-products')return returnToProducts();
  if(act==='tab-sales'){if(saving||savingSale)return;editingSaleNoteId=null;adminTab='sales';renderAdmin();return;}
  if(act==='new-sale')return openSaleEditor(b.dataset.id);
  if(act==='edit-note'){editingSaleNoteId=b.dataset.id;renderAdmin();return;}
  if(act==='cancel-note'){editingSaleNoteId=null;renderAdmin();return;}
  if(act==='tab-settings'){if(saving)return;adminTab='settings';renderAdmin();return;}
  if(act==='new')return openEditor();
  if(act==='edit')return openEditor(b.dataset.id);
  if(act==='cancel-editor')return cancelEditor();
  if(act==='delete')return deleteProduct(b.dataset.id);
  if(act==='enable-color-stock'){
    if(!confirm('¿Distribuir el stock de este producto por colores? La cantidad disponible se calculará según las unidades que agregues a cada color.'))return;
    // Conserva en el formulario los demás campos ya editados.
    const form=$('editor-form');const saved={};
    if(form){for(const element of form.querySelectorAll('input[name],textarea[name],select[name]')){if(element.name!=='stock')saved[element.name]=element.value;}}
    editorColorStockMode=true;
    editorColors=editorColors.map(c=>({...c,qty:0}));
    renderEditor();
    const refreshed=$('editor-form');if(refreshed){for(const [name,value] of Object.entries(saved)){const field=refreshed.elements[name];if(field)field.value=value;}}
    return;
  }
  if(act==='increase-color'||act==='decrease-color'){
    const c=editorColors[Number(b.dataset.index)];if(!c||!editorColorStockMode)return;
    c.qty=Math.max(0,Math.min(99999,(c.qty||0)+(act==='increase-color'?1:-1)));
    if(c.qty===0){editorColors.splice(Number(b.dataset.index),1);editorPhotos.forEach(ph=>{if(ph.color===c.name)ph.color='';});}
    renderSelectedColors();renderEditorPhotos();return;
  }
  if(act==='add-color'){
    const found=PALETTE.find(([name])=>name===b.dataset.colorName);if(found)addColor(...found);return;
  }
  if(act==='custom-color'){
    const form=$('editor-form');addColor(form.elements.customColorName.value,form.elements.customColorHex.value);
    form.elements.customColorName.value='';return;
  }
  if(act==='remove-color'){
    const c=editorColors.splice(Number(b.dataset.index),1)[0];if(c)editorPhotos.forEach(ph=>{if(ph.color===c.name)ph.color='';});
    renderSelectedColors();renderEditorPhotos();return;
  }
  if(act==='remove-photo'){
    const index=editorPhotos.findIndex(ph=>ph.id===b.dataset.photoId);if(index>=0){
      const [ph]=editorPhotos.splice(index,1);if(ph.preview?.startsWith('blob:'))URL.revokeObjectURL(ph.preview);renderEditorPhotos();
    }
  }
});

async function initFirebase(){
  if(!firebaseReady)return;
  try{
    const [app,firestore,authMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js'),
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js')
    ]);
    sdk={...firestore,...authMod};
    const firebaseApp=app.initializeApp(firebaseConfig);
    db=firestore.getFirestore(firebaseApp);auth=authMod.getAuth(firebaseApp);
    unsubscribePublic=firestore.onSnapshot(firestore.query(firestore.collection(db,'products'),firestore.where('published','==',true)),
      snap=>{products=snap.docs.map(d=>normalize({id:d.id,...d.data()})).sort((a,b)=>a.name.localeCompare(b.name,'es'));cart=cart.filter(i=>products.some(p=>p.id===i.id));saveCart();renderFeed();},
      err=>{console.error('Firestore productos:',err);notify('No se pudo cargar el catálogo. Revisa Firestore y sus reglas.');});
    unsubscribeLikes=firestore.onSnapshot(firestore.collection(db,'productLikes'), snap=>{likeCounts=new Map(snap.docs.map(d=>[d.id,Math.max(0,Number(d.data().count)||0)]));updateLikeButtons();},err=>console.warn('Contadores:',err));
    unsubscribeSettings=firestore.onSnapshot(firestore.doc(db,'settings','storefront'),snap=>{const data=snap.exists()?snap.data():{};settings={whatsapp:String(data.whatsapp||''),whatsappUsername:String(data.whatsappUsername||''),whatsappMode:data.whatsappMode==='username'?'username':'number'};},
      err=>console.error('Firestore WhatsApp:',err));
    authMod.onAuthStateChanged(auth,user=>{
      activeUser=user;if(unsubscribeAdmin){unsubscribeAdmin();unsubscribeAdmin=null;}
      if(unsubscribeSales){unsubscribeSales();unsubscribeSales=null;}
      sales=[];salesLoadError=false;editingSaleNoteId=null;
      if(isAdmin()){
        firestore.getDoc(firestore.doc(db,'settings','productCodes')).then(snap=>{
          lastKnownProductNumber=Math.max(lastKnownProductNumber,Number(snap.data()?.lastNumber)||0);
          if(adminTab==='editor' && !editId && editorAutoCode){
            const input=adminContent.querySelector('#editor-form [name="code"]');
            const expected=formattedCode(nextCodeNumber());
            if(input && input.value===editorAutoCode){input.value=expected;editorAutoCode=expected;}
          }
        }).catch(err=>console.warn('Secuencia de productos:',err));
        unsubscribeSales=firestore.onSnapshot(
          firestore.query(firestore.collection(db,'settings'),firestore.where('recordType','==','sale')),
          snap=>{sales=snap.docs.map(doc=>({id:doc.id,...doc.data()}));salesLoadError=false;if(adminOverlay.classList.contains('show')&&adminTab==='sales'&&!editingSaleNoteId)renderAdmin();},
          err=>{console.error('Historial de ventas:',err);salesLoadError=true;if(adminTab==='sales')renderAdmin();}
        );
        unsubscribeAdmin=firestore.onSnapshot(firestore.collection(db,'products'),
          snap=>{adminProducts=snap.docs.map(d=>normalize({id:d.id,...d.data()})).sort((a,b)=>a.name.localeCompare(b.name,'es'));if(adminOverlay.classList.contains('show')&&adminTab==='products')renderAdmin();},
          err=>{console.error('Firestore admin:',err);notify('No puedes leer productos. Revisa el UID y las reglas.');});
      }else adminProducts=[];
      if(adminOverlay.classList.contains('show'))renderAdmin();
    });
  }catch(e){console.error('Error al conectar Firebase:',e);notify('Error al iniciar Firebase. Comprueba firebase-config.js.');
    adminContent.innerHTML='<div class="login-wrap"><h2>Firebase no disponible</h2><p>Revisa la configuración, las reglas y tu conexión a internet.</p></div>';
  }
}
renderFeed();initFirebase();
