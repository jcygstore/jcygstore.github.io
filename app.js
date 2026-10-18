import { firebaseConfig, adminUid } from './firebase-config.js';

// JCYG STORE — catálogo público y administración protegida por Firebase.
const $ = (id) => document.getElementById(id);
const feed = $('feed'), modal = $('modal'), sheet = $('sheet'), toast = $('toast');
const adminOverlay = $('admin-overlay'), adminContent = $('admin-content');
const logoPath = 'assets/jcyg-store-logo.png';
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
let adminProducts = [], settings = {whatsapp:''};
let likes = new Set(), chosenColors = new Map(), currentId = null, photoIndex = 0;
let sdk = null, db = null, auth = null, storage = null, activeUser = null;
let unsubscribePublic = null, unsubscribeAdmin = null, unsubscribeSettings = null;
let adminTab = 'products', editId = null, editorColors = [], editorPhotos = [], saving = false;
let toastTimer = null;

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = (num) => 'S/ ' + Number(num || 0).toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2});
const safeImage = (url) => {
  const s = String(url || '');
  return (/^https:\/\//i.test(s) || /^assets\/[\w.-]+\.(webp|png|jpg|jpeg|svg)$/i.test(s) || /^blob:/i.test(s)) ? s : blankPhoto;
};
const validColor = (s) => /^#[a-fA-F0-9]{6}$/.test(String(s || '')) ? s : '#cbd5e1';
const notify = (message) => { toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3400); };
const isAdmin = () => !!activeUser && activeUser.uid === adminUid;
const normalize = (doc) => ({
  ...doc, id:String(doc.id), name:String(doc.name || 'Producto sin nombre'), desc:String(doc.desc || ''),
  stock:Math.max(0,Math.floor(Number(doc.stock) || 0)), price:Number(doc.price) || 0,
  oldPrice:Number(doc.oldPrice) || 0, published:doc.published !== false,
  colors:Array.isArray(doc.colors) ? doc.colors.map(c => ({name:String(c.name || '').slice(0,35),hex:validColor(c.hex)})) : [],
  photos:Array.isArray(doc.photos) ? doc.photos.slice(0,10).map(p => ({url:safeImage(p.url),path:String(p.path || ''),color:String(p.color || '')})) : [],
  specs:Array.isArray(doc.specs) ? doc.specs.map(s => ({label:String(s.label || 'Detalle'),value:String(s.value || '')})) : []
});
const getProduct = id => products.find(p => p.id === id);
const selection = p => chosenColors.get(p.id) || '';
function photoForColor(p, color) { return p.photos.find(ph => ph.color === color && color)?.url || p.photos[0]?.url || blankPhoto; }
const discount = p => p.oldPrice > p.price && p.price > 0 ? Math.round((1-p.price/p.oldPrice)*100) : 0;
function header() {
  return `<div class="top"><div class="logo"><img class="brand-logo" src="${logoPath}" alt="JCYG STORE"></div><button type="button" class="tag" data-action="admin" title="Ingresar a administración">Catálogo 2026</button></div>`;
}
function renderFeed() {
  if(!products.length) {
    feed.innerHTML = `<section class="no-products"><div class="empty-center"><img src="${logoPath}" alt="JCYG STORE"><h2>Pronto tendremos novedades</h2><p>Estamos preparando nuestro catálogo de productos.</p><button class="tag" data-action="admin" type="button">Catálogo 2026 · Administrador</button></div></section>`;
    return;
  }
  feed.innerHTML = products.map(p => {
    const selected = selection(p), off = discount(p);
    return `<article class="card" data-id="${esc(p.id)}">
      <div class="product-stage"><img src="${esc(safeImage(photoForColor(p,selected)))}" alt="${esc(p.name)}" loading="${p === products[0] ? 'eager' : 'lazy'}"></div>
      <div class="shade"></div>${header()}
      ${firebaseReady ? '' : '<div class="sample-banner">Catálogo de ejemplo · Firebase pendiente</div>'}
      <div class="info"><div class="eyebrow">JCYG STORE</div><div class="name">${esc(p.name)}</div><div class="desc">${esc(p.desc)}</div>
        <div class="availability"><span class="stock-mini ${p.stock===0?'out':''}">${p.stock ? `${p.stock} disponibles` : 'Agotado'}</span>
          ${p.colors.length ? `<span class="available-colors"><span class="available-colors-label">Colores:</span>${p.colors.map((c,i) => `<button type="button" class="mini-color-btn ${selected===c.name?'selected':''}" style="--c:${validColor(c.hex)}" title="${esc(c.name)}" aria-label="Ver color ${esc(c.name)}" data-action="color" data-color-index="${i}"></button>`).join('')}</span>` : ''}
        </div><div class="price"><span class="currency">Precio</span><strong>${money(p.price)}</strong>${off ? `<del>${money(p.oldPrice)}</del><span class="discount">-${off}%</span>` : ''}</div>
      </div><div class="actions">
        <button class="act ${likes.has(p.id)?'liked':''}" type="button" data-action="like" aria-label="Me gusta"><span class="ico">♡</span><small>Me gusta</small></button>
        <button class="act" type="button" data-action="details" aria-label="Ver características"><span class="ico">＋</span><small>Detalles</small></button>
        <button class="act buy-side" type="button" data-action="buy" aria-label="Comprar por WhatsApp"><span class="ico">☏</span><small>Comprar</small></button>
      </div></article>`;
  }).join('');
  const cards = [...feed.querySelectorAll('.card')];
  if ('IntersectionObserver' in window) {
    const watcher = new IntersectionObserver((entries) => entries.forEach(e => e.target.classList.toggle('active',e.isIntersecting && e.intersectionRatio > .4)),{root:feed,threshold:[.4,.7]});
    cards.forEach(c => watcher.observe(c));
  }
  if(cards[0]) cards[0].classList.add('active');
}
function chooseColor(id, color) {
  const p = getProduct(id); if(!p || !p.colors.some(c => c.name===color)) return;
  chosenColors.set(id,color);
  const card = [...feed.querySelectorAll('.card')].find(c => c.dataset.id === id);
  if(card) {
    const img = card.querySelector('.product-stage img'); if(img) img.src = safeImage(photoForColor(p,color));
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
    <img class="gallery-main" id="detail-photo" src="${esc(safeImage(photos[photoIndex].url))}" alt="${esc(p.name)}">
    <div class="gallery-strip">${photos.map((ph,i)=>`<button type="button" class="thumb ${i===photoIndex?'selected':''}" data-detail-action="photo" data-photo-index="${i}" aria-label="Foto ${i+1}"><img src="${esc(safeImage(ph.url))}" alt="Foto ${i+1}"></button>`).join('')}</div>
    <div class="detail-kicker">JCYG STORE · PRODUCTO</div><h2>${esc(p.name)}</h2>
    <div class="detail-price"><span class="p">${money(p.price)}</span>${discount(p) ? `<del>${money(p.oldPrice)}</del><span class="discount">-${discount(p)}%</span>` : ''}</div>
    <div class="stock-line"><span class="stock-badge ${p.stock===0?'out':''}">${p.stock ? `${p.stock} disponibles` : 'Agotado'}</span></div>
    <p class="detail-desc">${esc(p.desc)}</p>
    ${p.colors.length ? `<div class="detail-subtitle">Selecciona un color${selected ? `: ${esc(selected)}` : ''}</div><div class="color-list">${p.colors.map((c,i)=>`<button class="color-choice ${selected===c.name?'selected':''}" type="button" data-detail-action="color" data-color-index="${i}"><i class="color-dot" style="background:${validColor(c.hex)}"></i>${esc(c.name)}</button>`).join('')}</div>` : ''}
    <h3 class="spec-title">Características completas</h3>${specs ? `<div class="detail-specs">${specs}</div>` : '<p class="muted">Consulta las características por WhatsApp.</p>'}
    <button type="button" class="primary whatsapp" data-detail-action="buy">WhatsApp · Consultar producto</button>
    <div class="notice">Confirma disponibilidad, precio y entrega con la tienda.</div></div>`;
}
function openProduct(id) {
  const p = getProduct(id); if(!p) return;
  currentId = id; photoIndex = Math.max(0,p.photos.findIndex(ph=>ph.color===selection(p)));
  renderDetails(p); modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
}
function closeProduct() {modal.classList.remove('show');modal.setAttribute('aria-hidden','true');currentId=null;}
function buyProduct(id) {
  const p = getProduct(id); if(!p) return;
  if(p.stock <= 0) {notify('Este producto está agotado.');return;}
  const phone = String(settings.whatsapp||'').replace(/\D/g,'');
  if(!/^\d{8,15}$/.test(phone)) {notify('El WhatsApp de la tienda aún no está configurado.');return;}
  const selected = selection(p);
  const text = `Hola, quiero consultar por ${p.name}${selected ? `, color ${selected}`:''}. Precio: ${money(p.price)}. ¿Está disponible y cómo sería la entrega?`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`,'_blank','noopener,noreferrer');
}
feed.addEventListener('click',(e) => {
  const btn = e.target.closest('[data-action]'); if(!btn) return;
  if(btn.dataset.action === 'admin') {openAdmin();return;}
  const card = btn.closest('.card'); if(!card) return;
  const id = card.dataset.id, action = btn.dataset.action;
  if(action==='like') { likes.has(id)?likes.delete(id):likes.add(id);btn.classList.toggle('liked',likes.has(id)); }
  if(action==='details') openProduct(id);
  if(action==='buy') buyProduct(id);
  if(action==='color') {const p=getProduct(id);const c=p?.colors[Number(btn.dataset.colorIndex)];if(c)chooseColor(id,c.name);}
});
modal.addEventListener('click',e => {
  if(e.target===modal) {closeProduct();return;}
  const b=e.target.closest('[data-detail-action]'); if(!b) return;
  const p=getProduct(currentId);if(!p)return;
  if(b.dataset.detailAction==='close') closeProduct();
  if(b.dataset.detailAction==='buy') buyProduct(p.id);
  if(b.dataset.detailAction==='color') {const c=p.colors[Number(b.dataset.colorIndex)];if(c)chooseColor(p.id,c.name);}
  if(b.dataset.detailAction==='photo') {
    photoIndex=Number(b.dataset.photoIndex);const src=p.photos[photoIndex]?.url || blankPhoto;
    $('detail-photo').src=safeImage(src);sheet.querySelectorAll('.thumb').forEach(el=>el.classList.toggle('selected',Number(el.dataset.photoIndex)===photoIndex));
  }
});
function openAdmin(){adminOverlay.classList.add('show');adminOverlay.setAttribute('aria-hidden','false');renderAdmin();}
function closeAdmin(){if(saving)return;adminOverlay.classList.remove('show');adminOverlay.setAttribute('aria-hidden','true');}
$('admin-close').addEventListener('click',closeAdmin);
adminOverlay.addEventListener('click', e => {if(e.target===adminOverlay)closeAdmin();});
document.addEventListener('keydown',e => {if(e.key==='Escape'){if(adminOverlay.classList.contains('show'))closeAdmin();else closeProduct();}});
function adminTabs(){return `<div class="admin-tabs">
  <button type="button" data-admin-action="tab-products" class="${adminTab==='products'?'active':''}">Productos</button>
  <button type="button" data-admin-action="tab-settings" class="${adminTab==='settings'?'active':''}">WhatsApp de la tienda</button>
  <button type="button" data-admin-action="logout">Salir de administración</button>
</div>`;}
function renderAdmin() {
  if(!firebaseReady) {
    adminContent.innerHTML = `<div class="login-wrap"><h2>Activar administración</h2><p>El catálogo de ejemplo ya está listo. Para iniciar sesión con una contraseña segura, primero conecta este proyecto a Firebase.</p><div class="admin-note">Consulta <strong>README.md</strong> y completa <strong>firebase-config.js</strong>. Habilita Email/Contraseña, Firestore y Storage, y publica las reglas suministradas.</div><button class="admin-secondary" data-admin-action="close">Volver a la tienda</button></div>`;return;
  }
  if(!sdk) {adminContent.innerHTML = '<div class="login-wrap"><h2>Conectando con Firebase…</h2><p>Comprueba tu conexión a internet.</p></div>';return;}
  if(!activeUser) {
    adminContent.innerHTML=`<div class="login-wrap"><h2>Acceso de administrador</h2><p>Introduce el correo y la contraseña del usuario creado en Firebase Authentication.</p>
      <form id="login-form"><label class="admin-field">Correo administrador<input required autocomplete="username" type="email" name="email" placeholder="admin@tuempresa.com"></label>
      <label class="admin-field" style="margin-top:14px">Contraseña<input required autocomplete="current-password" type="password" name="password" minlength="6" placeholder="Contraseña de Firebase"></label>
      <button class="admin-primary" type="submit" style="margin-top:19px;width:100%">Ingresar al panel</button><div id="login-status" aria-live="polite"></div></form></div>`;return;
  }
  if(!isAdmin()) {
    adminContent.innerHTML=`<div class="login-wrap"><h2>Cuenta sin permisos</h2><p>El usuario que ingresó no coincide con el UID autorizado en este proyecto.</p><button class="admin-secondary" data-admin-action="logout">Cerrar sesión</button></div>`;return;
  }
  if(adminTab==='editor') {renderEditor();return;}
  if(adminTab==='settings') {renderSettings();return;}
  adminContent.innerHTML=`<div class="admin-topline"><div><h2>Productos publicados</h2><p class="muted">Administra el inventario y el catálogo desde aquí.</p></div><button class="admin-primary" data-admin-action="new">＋ Agregar producto</button></div>
    ${adminTabs()}
    <div class="admin-product-list">${adminProducts.length ? adminProducts.map(p=>`<div class="admin-item">
      <img src="${esc(safeImage(p.photos[0]?.url))}" alt="${esc(p.name)}"><div><div class="admin-item-title">${esc(p.name)}</div><div class="admin-item-sub">${money(p.price)} · ${p.stock} disponibles · ${p.photos.length}/10 fotos</div><div class="admin-item-status ${!p.published?'draft':''}">${p.published?'● Publicado':'● Borrador (no visible)'}</div></div>
      <div class="admin-actions"><button type="button" class="admin-secondary" data-admin-action="edit" data-id="${esc(p.id)}">Editar</button><button type="button" class="admin-danger" data-admin-action="delete" data-id="${esc(p.id)}">Eliminar</button></div>
    </div>`).join('') : '<div class="admin-note">No hay productos guardados en Firebase todavía. Puedes agregarlos o importar los tres productos de ejemplo.</div>'}</div>
    <div class="admin-actions" style="margin-top:15px"><button type="button" class="admin-secondary" data-admin-action="import">Importar los 3 productos de ejemplo</button></div>`;
}
function renderSettings(){
  adminContent.innerHTML=`<div class="admin-topline"><h2>WhatsApp de la tienda</h2></div>${adminTabs()}
    <div class="admin-panel"><h3>Número que recibirá los pedidos</h3><form id="settings-form"><label class="admin-field">WhatsApp (incluye código del país)
      <input type="tel" name="whatsapp" required inputmode="tel" placeholder="Ejemplo: 51987654321" value="${esc(settings.whatsapp)}">
      <small>Perú: 51 + 9 dígitos del celular, sin +, espacios ni guiones. Ejemplo ilustrativo, no un número configurado.</small></label>
      <p class="admin-note">Los botones «Comprar» enviarán al WhatsApp guardado aquí. El mensaje incluye el producto, precio y color seleccionado.</p>
      <button class="admin-primary" type="submit">Guardar WhatsApp</button><div id="settings-status" aria-live="polite"></div></form></div>`;
}
function clearPhotoPreviews(){editorPhotos.forEach(p=>{if(p.preview?.startsWith('blob:'))URL.revokeObjectURL(p.preview);});}
function openEditor(id=null){
  clearPhotoPreviews();editId=id;adminTab='editor';const existing=adminProducts.find(p=>p.id===id);
  editorColors=existing ? existing.colors.map(c=>({...c})) : [];
  editorPhotos=existing ? existing.photos.map((p,i)=>({...p,id:`saved-${i}`,file:null,preview:p.url})) : [];
  renderAdmin();
}
function renderEditor(){
  const p=adminProducts.find(x=>x.id===editId);
  adminContent.innerHTML=`<div class="admin-topline"><h2>${p?'Editar producto':'Agregar producto'}</h2><button type="button" class="admin-secondary" data-admin-action="cancel-editor">← Regresar</button></div>
  <form id="editor-form"><div class="admin-panel"><h3>Información principal</h3>
    <div class="editor-grid">
      <label class="admin-field span-all">Nombre del producto<input name="name" required maxlength="130" placeholder="Camioneta eléctrica infantil" value="${esc(p?.name||'')}"></label>
      <label class="admin-field span-all">Descripción breve<textarea name="desc" maxlength="500" rows="3" placeholder="Luces LED · MP3 · USB · Control remoto">${esc(p?.desc||'')}</textarea></label>
      <label class="admin-field">Precio actual (S/)<input type="number" name="price" required min="0.01" step="0.01" value="${p?.price||''}" placeholder="850.00"></label>
      <label class="admin-field">Precio anterior (opcional)<input type="number" name="oldPrice" min="0" step="0.01" value="${p?.oldPrice||''}" placeholder="900.00"><small>Si es mayor al precio actual se mostrará el porcentaje de descuento.</small></label>
      <label class="admin-field">Cantidad disponible<input type="number" name="stock" required min="0" step="1" value="${p?.stock ?? 0}"></label>
      <label class="admin-field">Estado<select name="published"><option value="true" ${p?.published!==false?'selected':''}>Publicado (visible)</option><option value="false" ${p?.published===false?'selected':''}>Borrador (oculto)</option></select></label>
    </div></div>
    <div class="admin-panel"><h3>Colores del producto</h3><p class="muted">Selecciona los colores que pueden elegir los compradores. Después, vincula cada foto a uno de ellos.</p>
      <div id="selected-colors" class="selected-colors"></div><div id="color-palette" class="color-palette"></div>
      <div class="custom-color-row"><label class="admin-field">Color personalizado<input name="customColorName" maxlength="35" placeholder="Ej. Azul marino"></label>
        <label class="admin-field">Tono<input name="customColorHex" type="color" value="#2563eb"></label>
        <button class="admin-secondary" type="button" data-admin-action="custom-color">Añadir</button></div></div>
    <div class="admin-panel"><h3>Fotografías del producto</h3><label class="admin-field">Seleccionar imágenes (máximo 10 en total)
      <input id="product-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple><small>Puedes subir varias fotografías y asignarles un color. Las imágenes se optimizan antes de subir a Firebase Storage.</small></label>
      <div id="editor-photos" class="photo-list"></div></div>
    <div class="admin-panel"><h3>Características completas</h3><label class="admin-field">Una característica por línea, con formato Nombre: Detalle
      <textarea name="specs" rows="9" placeholder="Dimensiones: 120 × 74 × 80 cm\nMaterial: ABS de alta calidad\nMotor: 4 × 380 W\nBatería: 2 × 6V 4.5Ah\nIncluye: Control remoto, luces LED">${esc((p?.specs||[]).map(s=>`${s.label}: ${s.value}`).join('\n'))}</textarea>
      <small>Estas características se muestran cuando el comprador abre «Detalles».</small></label></div>
    <div id="save-status" class="admin-working" aria-live="polite"></div>
    <div class="form-footer"><button type="button" class="admin-secondary" data-admin-action="cancel-editor">Cancelar</button><button type="submit" class="admin-primary" id="save-product">Guardar producto</button></div></form>`;
  renderSelectedColors();renderEditorPhotos();
}
function renderSelectedColors(){
  const selected=$('selected-colors'),palette=$('color-palette');if(!selected||!palette)return;
  selected.innerHTML=editorColors.length ? editorColors.map((c,i)=>`<span class="selected-color"><i class="color-dot" style="background:${validColor(c.hex)}"></i>${esc(c.name)}<button type="button" data-admin-action="remove-color" data-index="${i}" aria-label="Eliminar color ${esc(c.name)}">✕</button></span>`).join('') : '<span class="muted">Aún no seleccionaste colores.</span>';
  palette.innerHTML=PALETTE.map(([name,hex])=>`<button type="button" class="palette-choice" data-admin-action="add-color" data-color-name="${esc(name)}" ${editorColors.some(c=>c.name.toLowerCase()===name.toLowerCase())?'disabled':''}><span class="color-dot" style="background:${hex}"></span>${esc(name)}</button>`).join('');
}
function renderEditorPhotos(){
  const wrap=$('editor-photos');if(!wrap)return;
  wrap.innerHTML=editorPhotos.length ? editorPhotos.map((ph,i)=>`<div class="photo-tile"><img src="${esc(safeImage(ph.preview||ph.url))}" alt="Foto ${i+1}">
    <label for="photo-color-${i}">Foto ${i+1} · Asociar al color</label><select id="photo-color-${i}" data-photo-color="${esc(ph.id)}"><option value="">Sin color específico</option>
    ${editorColors.map(c=>`<option value="${esc(c.name)}" ${ph.color===c.name?'selected':''}>${esc(c.name)}</option>`).join('')}</select>
    <button type="button" data-admin-action="remove-photo" data-photo-id="${esc(ph.id)}">✕ Quitar foto</button></div>`).join('') : '<p class="muted">Todavía no hay fotos. Añade al menos una antes de guardar.</p>';
}
function addColor(name,hex){
  name=String(name||'').trim().slice(0,35);if(!name)return notify('Escribe el nombre del color.');
  if(editorColors.some(c=>c.name.toLowerCase()===name.toLowerCase()))return notify('Ese color ya está agregado.');
  editorColors.push({name,hex:validColor(hex)});renderSelectedColors();renderEditorPhotos();
}
function returnToProducts(){if(saving)return;clearPhotoPreviews();editorPhotos=[];editorColors=[];editId=null;adminTab='products';renderAdmin();}
async function handleLogin(form){
  const status=$('login-status');status.textContent='Verificando credenciales…';
  const b=form.querySelector('[type=submit]');b.disabled=true;
  try{await sdk.signInWithEmailAndPassword(auth,form.elements.email.value.trim(),form.elements.password.value);}catch(e){
    status.innerHTML='<p class="admin-error">No se pudo ingresar. Revisa el correo, contraseña y la configuración de Authentication.</p>';
    b.disabled=false;
  }
}
async function saveSettings(form){
  const status=$('settings-status');const digits=form.elements.whatsapp.value.replace(/\D/g,'');
  if(!/^\d{8,15}$/.test(digits)){status.innerHTML='<p class="admin-error">Ingresa el número internacional completo (entre 8 y 15 dígitos).</p>';return;}
  try{await sdk.setDoc(sdk.doc(db,'settings','storefront'),{whatsapp:digits,updatedAt:sdk.serverTimestamp()},{merge:true});settings.whatsapp=digits;notify('WhatsApp actualizado.');renderSettings();}
  catch(e){status.innerHTML=`<p class="admin-error">No se pudo guardar: ${esc(e.code||e.message)}</p>`;}
}
function parseSpecs(value){return String(value).split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map(line=>{
  const pos=line.indexOf(':');return pos<0?{label:'Detalle',value:line.slice(0,550)}:{label:line.slice(0,pos).trim().slice(0,90)||'Detalle',value:line.slice(pos+1).trim().slice(0,550)};
}).slice(0,60);}
async function toOptimizedImage(file){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Solo se permiten imágenes JPG, PNG o WebP.');
  if(file.size>10*1024*1024)throw Error('La imagen supera los 10 MB permitidos.');
  const url=URL.createObjectURL(file);
  try{
    const img=new Image();img.src=url;await img.decode();
    const ratio=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));
    canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
    const webp=await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('No se pudo preparar la imagen.')),'image/webp',.86));
    return webp;
  }finally{URL.revokeObjectURL(url);}
}
async function cleanupPaths(paths){
  for(const path of paths){if(path?.startsWith('product-images/')){
    try{await sdk.deleteObject(sdk.ref(storage,path));}catch(e){console.warn('No se pudo eliminar foto anterior:',e.code||e);}
  }}
}
async function saveProduct(form){
  if(saving)return;
  const status=$('save-status');const current=adminProducts.find(x=>x.id===editId);
  const name=form.elements.name.value.trim(),desc=form.elements.desc.value.trim();
  const price=Number(form.elements.price.value),oldPrice=Number(form.elements.oldPrice.value||0),stock=Number(form.elements.stock.value);
  if(!name || !Number.isFinite(price) || price<=0 || !Number.isInteger(stock) || stock<0){status.textContent='Revisa nombre, precio y cantidad disponible.';return;}
  if(oldPrice<0 || !Number.isFinite(oldPrice)){status.textContent='El precio anterior no es válido.';return;}
  if(oldPrice>0 && oldPrice<=price){status.textContent='El precio anterior debe ser superior al actual para indicar descuento, o déjalo en blanco.';return;}
  if(!editorPhotos.length || editorPhotos.length>10){status.textContent='Necesitas entre 1 y 10 fotografías por producto.';return;}
  saving=true;const button=$('save-product');button.disabled=true;
  const productRef=editId ? sdk.doc(db,'products',editId) : sdk.doc(sdk.collection(db,'products'));
  const uploadedPaths=[];
  try {
    const photos=[];
    for(let i=0;i<editorPhotos.length;i++){
      const pic=editorPhotos[i];
      if(pic.file){
        status.textContent=`Preparando y subiendo foto ${i+1} de ${editorPhotos.length}…`;
        const blob=await toOptimizedImage(pic.file);
        const path=`product-images/${productRef.id}/${crypto.randomUUID()}.webp`;
        const loc=sdk.ref(storage,path);
        await sdk.uploadBytes(loc,blob,{contentType:'image/webp'});
        uploadedPaths.push(path);
        const url=await sdk.getDownloadURL(loc);
        photos.push({url,path,color:pic.color||''});
      }else photos.push({url:pic.url,path:pic.path||'',color:pic.color||''});
    }
    status.textContent='Guardando información del producto…';
    const payload={name,desc,price,oldPrice,stock,published:form.elements.published.value==='true',
      colors:editorColors.map(c=>({...c})),photos,specs:parseSpecs(form.elements.specs.value),updatedAt:sdk.serverTimestamp()};
    await sdk.setDoc(productRef,payload,{merge:true});
    const removed=(current?.photos||[]).map(p=>p.path).filter(path=>path && !photos.some(p=>p.path===path));
    await cleanupPaths(removed);
    notify(current?'Producto actualizado.':'Producto agregado.');returnToProductsAfterSave();
  }catch(e){await cleanupPaths(uploadedPaths);status.textContent=`Error al guardar: ${e.code||e.message}`;notify('No se pudo guardar el producto.');}
  finally{saving=false;const btn=$('save-product');if(btn)btn.disabled=false;}
}
function returnToProductsAfterSave(){clearPhotoPreviews();editorPhotos=[];editorColors=[];editId=null;adminTab='products';renderAdmin();}
async function deleteProduct(id){
  const p=adminProducts.find(x=>x.id===id);if(!p)return;
  if(!confirm(`¿Eliminar definitivamente «${p.name}» del catálogo?`))return;
  try {await sdk.deleteDoc(sdk.doc(db,'products',id));await cleanupPaths(p.photos.map(ph=>ph.path));notify('Producto eliminado.');}
  catch(e){notify(`Error al eliminar: ${e.code||e.message}`);}
}
async function importSamples(){
  if(!confirm('¿Importar los tres productos de ejemplo a Firebase? No reemplazará productos personalizados.'))return;
  try{
    const batch=sdk.writeBatch(db);
    for(const item of SAMPLE_PRODUCTS){
      if(adminProducts.some(p=>p.id===item.id))continue;
      const {id,...data}=item;
      batch.set(sdk.doc(db,'products',id),{...data,updatedAt:sdk.serverTimestamp()});
    }
    await batch.commit();notify('Productos de ejemplo importados.');
  }catch(e){notify(`No se pudieron importar: ${e.code||e.message}`);}
}
adminContent.addEventListener('submit', async e=>{
  e.preventDefault();if(e.target.id==='login-form')await handleLogin(e.target);
  if(e.target.id==='settings-form')await saveSettings(e.target);
  if(e.target.id==='editor-form')await saveProduct(e.target);
});
adminContent.addEventListener('change',e=>{
  if(e.target.matches('[data-photo-color]')){
    const ph=editorPhotos.find(p=>p.id===e.target.dataset.photoColor);if(ph)ph.color=e.target.value;
  }
  if(e.target.id==='product-photos'){
    const files=[...e.target.files];e.target.value='';
    if(files.length+editorPhotos.length>10){notify('Puedes cargar como máximo 10 fotos por producto.');return;}
    if(files.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>10*1024*1024)){
      notify('Usa JPG, PNG o WebP, hasta 10 MB por archivo.');return;
    }
    files.forEach(f=>editorPhotos.push({id:crypto.randomUUID(),url:'',path:'',color:'',file:f,preview:URL.createObjectURL(f)}));renderEditorPhotos();
  }
});
adminContent.addEventListener('click', async e=>{
  const b=e.target.closest('[data-admin-action]');if(!b)return;
  const act=b.dataset.adminAction;
  if(act==='close')return closeAdmin();
  if(act==='logout'){await sdk.signOut(auth);adminTab='products';return;}
  if(act==='tab-products')return returnToProducts();
  if(act==='tab-settings'){if(saving)return;adminTab='settings';renderAdmin();return;}
  if(act==='new')return openEditor();
  if(act==='edit')return openEditor(b.dataset.id);
  if(act==='cancel-editor')return returnToProducts();
  if(act==='delete')return deleteProduct(b.dataset.id);
  if(act==='import')return importSamples();
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
    const [app,firestore,storageMod,authMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js'),
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js'),
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js')
    ]);
    sdk={...firestore,...storageMod,...authMod};
    const firebaseApp=app.initializeApp(firebaseConfig);
    db=firestore.getFirestore(firebaseApp);storage=storageMod.getStorage(firebaseApp);auth=authMod.getAuth(firebaseApp);
    unsubscribePublic=firestore.onSnapshot(firestore.query(firestore.collection(db,'products'),firestore.where('published','==',true)),
      snap=>{products=snap.docs.map(d=>normalize({id:d.id,...d.data()})).sort((a,b)=>a.name.localeCompare(b.name,'es'));renderFeed();},
      err=>{console.error('Firestore productos:',err);notify('No se pudo cargar el catálogo. Revisa Firestore y sus reglas.');});
    unsubscribeSettings=firestore.onSnapshot(firestore.doc(db,'settings','storefront'),snap=>{settings={whatsapp:snap.exists()?String(snap.data().whatsapp||''):''};},
      err=>console.error('Firestore WhatsApp:',err));
    authMod.onAuthStateChanged(auth,user=>{
      activeUser=user;if(unsubscribeAdmin){unsubscribeAdmin();unsubscribeAdmin=null;}
      if(isAdmin()){
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
