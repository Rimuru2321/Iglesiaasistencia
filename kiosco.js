/* ═══════════════════════════════════════════════════
   Kiosco · Iglesia Luz y Vida IV — JavaScript
═══════════════════════════════════════════════════ */

import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ── COLORES PERSONALIZADOS ────────────────────────────────────
function aplicarColores(){
  const saved=localStorage.getItem('lviv-colors');
  if(saved){try{const cols=JSON.parse(saved);Object.entries(cols).forEach(([k,v])=>document.documentElement.style.setProperty(k,v));}catch(e){}}
}
aplicarColores();

const firebaseConfig={apiKey:"AIzaSyA-XTJPcNGJN1cHKANF7ShwIW68vQ4V_OQ",authDomain:"iglesia-luz-vida.firebaseapp.com",projectId:"iglesia-luz-vida",storageBucket:"iglesia-luz-vida.firebasestorage.app",messagingSenderId:"2442440076",appId:"1:2442440076:web:6ec7c5643d3af4fd57faa9"};
const db=getFirestore(initializeApp(firebaseConfig));

// ⚠️ CLOUDINARY — Cambia estos valores con los de tu cuenta
const CLOUDINARY_CLOUD  = 'df6xaavst';    // Cloud Name de Cloudinary
const CLOUDINARY_PRESET = 'iglesia-luz-vida'; // Upload Preset (Unsigned)

const DIAS=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const RCLS={Pastor:'pastor','Co-Pastor':'copastor','Secretario General':'secgen','Tesorero General':'tesgen',Diácono:'diacono',Miembro:'miembro',Visitante:'visitante','Pres. Dayca':'presd','Vice. Dayca':'vpd','Sec. Dayca':'secd','Tes. Dayca':'tesd','1er Vocal Dayca':'vocal1d','2do Vocal Dayca':'vocal2d','Pres. Juvenil':'presj','Vice. Juvenil':'vpj','Sec. Juvenil':'secj','Tes. Juvenil':'tesj','1er Vocal Juv.':'vocal1j','2do Vocal Juv.':'vocal2j'};
const RICO={Pastor:'⛪','Co-Pastor':'⛪','Secretario General':'📋','Tesorero General':'💰',Diácono:'🙏',Miembro:'👤',Visitante:'🌟','Pres. Dayca':'👑','Vice. Dayca':'🌸','Sec. Dayca':'📋','Tes. Dayca':'💰','1er Vocal Dayca':'🎤','2do Vocal Dayca':'🎤','Pres. Juvenil':'👑','Vice. Juvenil':'🌸','Sec. Juvenil':'📋','Tes. Juvenil':'💰','1er Vocal Juv.':'🎤','2do Vocal Juv.':'🎤'};
const CCOLORS=['#C8A96E','#E4CF96','#F07080','#5DC99A','#7EB8FF','#FFE066','#FF8FA3','#fff'];

let miembros=[],asistidos=new Set(),selId=null,uploadId=null,roleFiltro='all',selectedFile=null;

// ── INTRO ──────────────────────────────────────────────────────
const savedTheme=localStorage.getItem('lviv-theme')||'dark';
document.documentElement.setAttribute('data-theme',savedTheme);
document.getElementById('tbtn').textContent=savedTheme==='dark'?'🌙':'🌞';

setTimeout(()=>{
  const fill=document.getElementById('intro-fill');
  fill.style.width='100%';
},100);
setTimeout(()=>{
  document.getElementById('intro').classList.add('fade-out');
  setTimeout(()=>document.getElementById('intro').classList.add('gone'),900);
},2400);

window.toggleTheme=function(){
  const html=document.documentElement;const isDark=html.getAttribute('data-theme')==='dark';
  html.setAttribute('data-theme',isDark?'light':'dark');
  document.getElementById('tbtn').textContent=isDark?'🌞':'🌙';
  localStorage.setItem('lviv-theme',isDark?'light':'dark');
};

// ── HELPERS ──────────────────────────────────────────────────
function hoy(){return new Date().toISOString().split('T')[0];}
function ini(n){return n.trim().split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();}
function toast(m,t='ok'){const el=document.getElementById('toast');el.textContent=m;el.className='toast show'+(t==='err'?' err':'');clearTimeout(el._t);el._t=setTimeout(()=>el.className='toast',3500);}
function rbadge(rol){if(!rol)return'';const c=RCLS[rol]||'miembro',i=RICO[rol]||'👤';return`<span class="rbadge ${c}">${i} ${rol}</span>`;}

function esCumple(m){
  if(!m.cumpleanos)return false;
  const hoyDate=new Date();
  const[,mes,dia]=m.cumpleanos.split('-');
  return parseInt(mes)===hoyDate.getMonth()+1&&parseInt(dia)===hoyDate.getDate();
}

// ── CONFETI ──────────────────────────────────────────────────
function confeti(){
  const box=document.getElementById('cbox');box.innerHTML='';
  for(let i=0;i<90;i++){
    const el=document.createElement('div');el.className='cp';
    const c=CCOLORS[Math.floor(Math.random()*CCOLORS.length)];
    const s=Math.random()*10+6,l=Math.random()*100,d=Math.random()*2.5+1.5,dl=Math.random()*.8,sh=Math.random()>.5?'50%':'2px';
    el.style.cssText=`left:${l}%;width:${s}px;height:${s}px;background:${c};border-radius:${sh};animation-duration:${d}s;animation-delay:${dl}s;`;
    box.appendChild(el);
  }
  setTimeout(()=>box.innerHTML='',4500);
}

// ── RELOJ + RECORDATORIO ─────────────────────────────────────
function getH(){const d=new Date().getDay();if(d===0)return{n:'Culto Dominical',i:'8:00 AM',f:'~3:00 PM',mi:480,mf:900};if(d===2)return{n:'Culto de Martes',i:'7:00 PM',f:'9:00 PM',mi:1140,mf:1260};if(d===6)return{n:'Culto de Sábado',i:'7:00 PM',f:'9:00 PM',mi:1140,mf:1260};return null;}
function tick(){
  const now=new Date();
  document.getElementById('clk-time').textContent=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  document.getElementById('clk-date').textContent=`${DIAS[now.getDay()]}, ${now.getDate()} de ${MESES[now.getMonth()]} ${now.getFullYear()}`;
  const h=getH(),strip=document.getElementById('cstrip'),txt=document.getElementById('ctxt'),mins=now.getHours()*60+now.getMinutes();
  if(h){
    if(mins>=h.mi&&mins<=h.mf){strip.className='culto-strip on';txt.textContent=`${h.n} en curso · ${h.i} – ${h.f}`;}
    else if(mins<h.mi){strip.className='culto-strip';txt.textContent=`Hoy · ${h.n} · ${h.i} – ${h.f}`;}
    else{strip.className='culto-strip';txt.textContent='✅ Culto finalizado · ¡Hasta la próxima!';}
    // Recordatorio: 1 hora antes del culto
    if(mins>=h.mi-60&&mins<h.mi&&!localStorage.getItem('reminder-'+hoy())){
      document.getElementById('reminder-title').textContent=`${h.n} en ${h.mi-mins} minutos`;
      document.getElementById('reminder-sub').textContent=`Hoy · ${h.i} – ${h.f} · ¡Recuerda asistir!`;
      document.getElementById('reminder').classList.add('show');
    }
  }else{strip.className='culto-strip';txt.textContent='Sin culto hoy · Próximo: Mar o Sáb 7:00 PM';}
}
setInterval(tick,1000);tick();

// ── DATOS ────────────────────────────────────────────────────
async function cargar(){
  const snap=await getDocs(collection(db,'miembros'));
  miembros=snap.docs.map(d=>({id:d.id,...d.data()})).filter(m=>m.activo!==false).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  onSnapshot(collection(db,`asistencia/${hoy()}/registros`),s=>{asistidos=new Set(s.docs.map(d=>d.id));render();});
  document.getElementById('obar').classList.remove('show');
  render();
}
cargar().catch(()=>{document.getElementById('obar').classList.add('show');document.getElementById('grid').innerHTML='<div class="empty">Sin conexión. Verifica tu internet.</div>';});

// ── RENDER ───────────────────────────────────────────────────
function render(){
  const q=document.getElementById('buscar').value.trim().toLowerCase();
  let lista=miembros;
  if(roleFiltro==='__group__')lista=lista.filter(m=>window._groupFilter&&window._groupFilter.includes(m.rol));  else if(roleFiltro!=='all')lista=lista.filter(m=>m.rol===roleFiltro);
  if(q)lista=lista.filter(m=>m.nombre.toLowerCase().includes(q)||m.codigo.includes(q));
  const grid=document.getElementById('grid');
  if(!lista.length){grid.innerHTML='<div class="empty">No se encontró ningún hermano/a</div>';return;}
  grid.innerHTML=lista.map((m,i)=>{
    const ok=asistidos.has(m.id);
    const cumple=esCumple(m);
    const fotoHtml=m.foto_url
      ?`<img src="${m.foto_url}" alt="${m.nombre}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="card-photo-ini" style="display:none">${ini(m.nombre)}</div>`
      :`<div class="card-photo-ini">${ini(m.nombre)}</div>`;
    return`<div class="card${ok?' ok':''}" style="animation-delay:${i*.035}s" onclick="abrirConf('${m.id}')">
      <div class="card-photo-wrap">
        ${fotoHtml}
        <div class="card-photo-overlay"></div>
        <div class="card-ok-badge">✓ Asistió</div>
        <button class="card-upload-btn" onclick="event.stopPropagation();abrirUpload('${m.id}')" title="Cambiar foto">📷</button>
      </div>
      <div class="card-body">
        <div class="card-nombre">${cumple?'🎂 ':''}${m.nombre}</div>
        <div class="card-meta">
          <div class="card-codigo">ID: ${m.codigo}</div>
          ${rbadge(m.rol)}
        </div>
      </div>
    </div>`;
  }).join('');
}
window.filtrar=function(){render();};
window.setRole=function(r,el){roleFiltro=r;document.querySelectorAll('.role-chip').forEach(c=>c.classList.remove('on'));el.classList.add('on');render();};

const GRUPO_DAYCA  =['Pres. Dayca','Vice. Dayca','Sec. Dayca','Tes. Dayca','1er Vocal Dayca','2do Vocal Dayca'];
const GRUPO_JUVENIL=['Pres. Juvenil','Vice. Juvenil','Sec. Juvenil','Tes. Juvenil','1er Vocal Juv.','2do Vocal Juv.'];

window.setRoleGroup=function(grupo,el){
  document.querySelectorAll('.role-chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
  const grupos={dayca:GRUPO_DAYCA,juvenil:GRUPO_JUVENIL};
  const lista=grupos[grupo]||[];
  roleFiltro='__group__';
  window._groupFilter=lista;
  render();
};

// ── MODAL CONFIRMAR ──────────────────────────────────────────
window.abrirConf=function(id){
  const m=miembros.find(x=>x.id===id);if(!m)return;selId=id;
  const i2=ini(m.nombre);
  document.getElementById('m-av').innerHTML=m.foto_url
    ?`<img src="${m.foto_url}" alt="${m.nombre}" onerror="this.parentElement.innerHTML='<span class=ini>${i2}</span>'">`
    :`<span class="ini">${i2}</span>`;
  document.getElementById('m-nb').textContent=(esCumple(m)?'🎂 ':'')+m.nombre;
  document.getElementById('m-cd').textContent=`ID: ${m.codigo}`;
  document.getElementById('m-rw').innerHTML=rbadge(m.rol);
  const h=getH();
  document.getElementById('m-cn').textContent=h?h.n:'Servicio General';
  document.getElementById('m-ch').textContent=h?`${h.i} – ${h.f}`:hoy();
  const act=document.getElementById('m-act');
  if(asistidos.has(id)){
    act.innerHTML=`<div class="m-ya">✅ Ya registraste tu asistencia hoy</div><button class="btn-can" style="width:100%;" onclick="cerrarConf()">Cerrar</button>`;
  }else{
    act.innerHTML=`<div class="m-btns"><button class="btn-can" onclick="cerrarConf()">Cancelar</button><button class="btn-conf" id="bcf" onclick="confirmar()">✓ Confirmar</button></div>`;
  }
  document.getElementById('ov1').classList.add('open');
};
window.cerrarConf=function(){document.getElementById('ov1').classList.remove('open');selId=null;};

window.confirmar=async function(){
  if(!selId)return;
  const btn=document.getElementById('bcf');if(btn)btn.disabled=true;
  try{
    const now=new Date();
    const hora=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    await setDoc(doc(db,`asistencia/${hoy()}/registros`,selId),{miembro_id:selId,hora_llegada:hora,timestamp:serverTimestamp()});
    const m=miembros.find(x=>x.id===selId);
    cerrarConf();
    mostrarBienvenida(m);
    confeti();
  }catch(e){toast(e.message,'err');if(btn)btn.disabled=false;}
};

// ── BIENVENIDA ───────────────────────────────────────────────
function mostrarBienvenida(m){
  const i2=ini(m.nombre);
  document.getElementById('w-photo').innerHTML=m.foto_url
    ?`<img src="${m.foto_url}" alt="${m.nombre}" onerror="this.innerHTML='<span class=ini>${i2}</span>'">`
    :`<span class="ini">${i2}</span>`;
  document.getElementById('w-name').textContent=m.nombre.split(' ').slice(0,2).join(' ');
  document.getElementById('w-role').innerHTML=rbadge(m.rol)+(esCumple(m)?'&nbsp;<span style="font-size:22px">🎂</span>':'');
  const h=getH();document.getElementById('w-msg').textContent=h?`Registrado en ${h.n}`:'¡Tu asistencia ha sido registrada!';
  document.getElementById('wscreen').classList.add('show');
  setTimeout(()=>document.getElementById('wscreen').classList.remove('show'),4500);
}

// ── UPLOAD FOTO (Cloudinary) ──────────────────────────────────
window.abrirUpload=function(id){
  uploadId=id;selectedFile=null;
  document.getElementById('upload-preview').innerHTML='📷';
  document.getElementById('upload-status').textContent='';
  document.getElementById('upload-progress').style.display='none';
  document.getElementById('upload-fill').style.width='0%';
  document.getElementById('file-input').value='';
  document.getElementById('ov-upload').classList.add('open');
};
window.cerrarUpload=function(){document.getElementById('ov-upload').classList.remove('open');uploadId=null;};

window.previewPhoto=function(e){
  selectedFile=e.target.files[0];
  if(!selectedFile)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    const prev=document.getElementById('upload-preview');
    prev.innerHTML=`<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  };
  reader.readAsDataURL(selectedFile);
  document.getElementById('upload-status').textContent=selectedFile.name;
};

window.subirFoto=async function(){
  if(!selectedFile||!uploadId){toast('Selecciona una foto primero','err');return;}
  // Cloudinary configurado ✓
  const btn=document.getElementById('btn-upload');btn.disabled=true;
  const prog=document.getElementById('upload-progress');
  const fill=document.getElementById('upload-fill');
  prog.style.display='block';
  document.getElementById('upload-status').textContent='Subiendo foto...';

  // Simular progreso mientras se sube
  let pct=0;const interval=setInterval(()=>{pct=Math.min(pct+8,85);fill.style.width=pct+'%';},200);

  try{
    const formData=new FormData();
    formData.append('file',selectedFile);
    formData.append('upload_preset',CLOUDINARY_PRESET);
    formData.append('folder','iglesia-luz-vida');

    const res=await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,{method:'POST',body:formData});
    const data=await res.json();
    clearInterval(interval);fill.style.width='100%';

    if(data.secure_url){
      // Actualizar en Firebase
      await updateDoc(doc(db,'miembros',uploadId),{foto_url:data.secure_url});
      // Actualizar en memoria
      const m=miembros.find(x=>x.id===uploadId);
      if(m)m.foto_url=data.secure_url;
      cerrarUpload();
      render();
      toast('✓ Foto actualizada');
    }else{throw new Error(data.error?.message||'Error al subir');}
  }catch(e){
    clearInterval(interval);
    toast(e.message,'err');
    document.getElementById('upload-status').textContent='Error al subir. Intenta de nuevo.';
  }finally{btn.disabled=false;}
};

// ── MODAL ID ─────────────────────────────────────────────────
window.abrirId=function(){document.getElementById('idf').value='';document.getElementById('ierr').style.display='none';document.getElementById('ov2').classList.add('open');setTimeout(()=>document.getElementById('idf').focus(),250);};
window.cerrarId=function(){document.getElementById('ov2').classList.remove('open');};
window.buscarId=function(){
  const val=document.getElementById('idf').value.trim().padStart(4,'0');
  const m=miembros.find(x=>x.codigo===val);
  if(m){cerrarId();abrirConf(m.id);}else{document.getElementById('ierr').style.display='block';}
};

['ov1','ov2','ov-upload','ov-selfie'].forEach(id=>{
  const el=document.getElementById(id);
  if(el) el.addEventListener('click',function(e){
    if(e.target===this){
      this.classList.remove('open');
      if(id==='ov1')selId=null;
      if(id==='ov-upload')uploadId=null;
      if(id==='ov-selfie')detenerCamara();
    }
  });
});

// ── SONIDO BIENVENIDA ─────────────────────────────────────────
function sonidoBienvenida(){
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    const notas=[523.25,659.25,783.99,1046.50]; // C E G C (acorde mayor)
    notas.forEach((freq,i)=>{
      const osc=ctx.createOscillator();
      const gain=ctx.createGain();
      osc.connect(gain);gain.connect(ctx.destination);
      osc.frequency.value=freq;
      osc.type='sine';
      gain.gain.setValueAtTime(0,ctx.currentTime+i*0.12);
      gain.gain.linearRampToValueAtTime(0.18,ctx.currentTime+i*0.12+0.05);
      gain.gain.linearRampToValueAtTime(0,ctx.currentTime+i*0.12+0.35);
      osc.start(ctx.currentTime+i*0.12);
      osc.stop(ctx.currentTime+i*0.12+0.4);
    });
  }catch(e){}
}

// ── MENSAJE PERSONALIZADO ─────────────────────────────────────
async function cargarMensajeAdmin(){
  try{
    const snap=await getDocs(collection(db,'config'));
    snap.docs.forEach(d=>{
      if(d.id==='bienvenida'&&d.data().mensaje){
        window._mensajeBienvenida=d.data().mensaje;
      }
    });
  }catch(e){}
}
cargarMensajeAdmin();

// Override mostrarBienvenida para incluir sonido y mensaje personalizado
const _origBienvenida=mostrarBienvenida;
window.mostrarBienvenida=function(m){
  sonidoBienvenida();
  _origBienvenida(m);
  if(window._mensajeBienvenida){
    setTimeout(()=>{
      const msgEl=document.getElementById('w-msg');
      if(msgEl) msgEl.textContent=window._mensajeBienvenida;
    },100);
  }
};

// ── SELFIE / BÚSQUEDA VISUAL ──────────────────────────────────
let stream=null;

window.abrirSelfie=async function(){
  document.getElementById('ov-selfie').classList.add('open');
  document.getElementById('selfie-results').style.display='none';
  try{
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});
    document.getElementById('selfie-video').srcObject=stream;
  }catch(e){
    toast('No se pudo acceder a la cámara','err');
    cerrarSelfie();
  }
};

window.cerrarSelfie=function(){
  document.getElementById('ov-selfie').classList.remove('open');
  detenerCamara();
};

function detenerCamara(){
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}
  const v=document.getElementById('selfie-video');
  if(v)v.srcObject=null;
}

window.tomarFoto=function(){
  const video=document.getElementById('selfie-video');
  const canvas=document.getElementById('selfie-canvas');
  canvas.width=video.videoWidth||320;
  canvas.height=video.videoHeight||240;
  canvas.getContext('2d').drawImage(video,0,0);

  // Buscar hermanos con foto y mostrar los 3 primeros como sugerencias
  const conFoto=miembros.filter(m=>m.foto_url);
  const sinFoto=miembros.filter(m=>!m.foto_url);

  // Mostrar sugerencias: primero con foto (más probable), luego sin foto
  const sugerencias=[...conFoto,...sinFoto].slice(0,4);

  const sugEl=document.getElementById('selfie-suggestions');
  sugEl.innerHTML=sugerencias.map(m=>{
    const i2=ini(m.nombre);
    const fotoHtml=m.foto_url
      ?`<img src="${m.foto_url}" alt="${m.nombre}" onerror="this.parentElement.innerHTML='${i2}'">`
      :i2;
    return`<div class="suggestion-row" onclick="seleccionarSugerencia('${m.id}')">
      <div class="suggestion-av">${fotoHtml}</div>
      <div class="suggestion-info">
        <strong>${m.nombre}</strong>
        <span>ID: ${m.codigo}</span>
      </div>
      <span style="margin-left:auto;color:var(--gold);font-size:18px;">→</span>
    </div>`;
  }).join('');

  if(!sugerencias.length){
    sugEl.innerHTML='<p style="color:var(--cream-s);text-align:center;padding:20px;">No hay hermanos registrados</p>';
  }

  document.getElementById('selfie-results').style.display='block';
  document.getElementById('selfie-video').style.display='none';
  document.getElementById('btn-snap').textContent='🔄 Otra vez';
  document.getElementById('btn-snap').onclick=function(){
    document.getElementById('selfie-video').style.display='block';
    document.getElementById('selfie-results').style.display='none';
    document.getElementById('btn-snap').textContent='📸 Tomar Foto';
    document.getElementById('btn-snap').onclick=tomarFoto;
  };
};

window.seleccionarSugerencia=function(id){
  cerrarSelfie();
  abrirConf(id);
};

// ── TEXT-TO-SPEECH ─────────────────────────────────────────────
function anunciarVoz(nombre, rol){
  if(!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const RICO_TTS={Pastor:'Pastor','Co-Pastor':'Co Pastor','Secretario General':'Secretario General','Tesorero General':'Tesorero General',Diácono:'Diácono',Miembro:'',Visitante:'Visitante',
    'Pres. Dayca':'Presidenta de la Dayca','Vice. Dayca':'Vicepresidenta de la Dayca',
    'Sec. Dayca':'Secretaria de la Dayca','Tes. Dayca':'Tesorera de la Dayca',
    '1er Vocal Dayca':'Primer Vocal','2do Vocal Dayca':'Segundo Vocal',
    'Pres. Juvenil':'Presidenta Juvenil','Vice. Juvenil':'Vicepresidenta Juvenil',
    'Sec. Juvenil':'Secretaria Juvenil','Tes. Juvenil':'Tesorera Juvenil',
    '1er Vocal Juv.':'Primer Vocal','2do Vocal Juv.':'Segundo Vocal'};
  const rolText=RICO_TTS[rol]||'';
  const texto=rolText?`Bienvenido ${rolText} ${nombre}`:`Bienvenido ${nombre}`;
  const utter=new SpeechSynthesisUtterance(texto);
  utter.lang='es-DO'; // español dominicano
  utter.rate=0.9; utter.pitch=1.1; utter.volume=0.85;
  // Buscar voz en español
  const voces=window.speechSynthesis.getVoices();
  const vozEs=voces.find(v=>v.lang.startsWith('es'))||voces[0];
  if(vozEs) utter.voice=vozEs;
  window.speechSynthesis.speak(utter);
}
// Cargar voces al inicio
if(window.speechSynthesis){
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged=()=>window.speechSynthesis.getVoices();
}

// ── HORA EXACTA EN BIENVENIDA ─────────────────────────────────
// Override mostrarBienvenida para incluir TTS + hora exacta
const _origBienvenidaTTS = window.mostrarBienvenida;
window.mostrarBienvenida = function(m){
  // Llamar original
  _origBienvenidaTTS(m);
  // Agregar hora exacta
  const now=new Date();
  const hora=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  setTimeout(()=>{
    const msgEl=document.getElementById('w-msg');
    const h=getH();
    const base=window._mensajeBienvenida||(h?`Registrado en ${h.n}`:'¡Tu asistencia ha sido registrada!');
    if(msgEl) msgEl.textContent=`${base} · ${hora}`;
  },120);
  // TTS
  setTimeout(()=>anunciarVoz(m.nombre.split(' ').slice(0,2).join(' '), m.rol), 600);
};

// ── MEDALLAS POR RACHA ───────────────────────────────────────
function calcularMedalla(diasAsistidos){
  if(diasAsistidos>=50) return{ico:'💎',nom:'Diamante',cls:'diamante'};
  if(diasAsistidos>=25) return{ico:'🔥',nom:'Fuego',cls:'fuego'};
  if(diasAsistidos>=15) return{ico:'🥇',nom:'Oro',cls:'oro'};
  if(diasAsistidos>=8)  return{ico:'🥈',nom:'Plata',cls:'plata'};
  if(diasAsistidos>=3)  return{ico:'🥉',nom:'Bronce',cls:'bronce'};
  return null;
}

// Patch render para incluir medallas
const _origRender=render;
window.render=function(){
  _origRender();
  // Agregar medallas a las cards
  document.querySelectorAll('.card').forEach(card=>{
    const id=card.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
    if(!id)return;
    const m=miembros.find(x=>x.id===id);
    if(!m)return;
    const med=calcularMedalla(m.dias_asistidos||0);
    if(med){
      const body=card.querySelector('.card-body');
      if(body&&!body.querySelector('.medal')){
        const span=document.createElement('span');
        span.className=`medal ${med.cls}`;
        span.innerHTML=`${med.ico} ${med.nom}`;
        body.appendChild(span);
      }
    }
  });
};
window.render=window.render; // trigger

// ── ANUNCIOS ──────────────────────────────────────────────────
async function cargarAnuncios(){
  try{
    const snap=await getDocs(collection(db,'anuncios'));
    const activos=snap.docs.map(d=>({id:d.id,...d.data()})).filter(a=>a.activo);
    if(!activos.length)return;
    const bar=document.getElementById('anuncios-bar');
    const track=document.getElementById('anuncios-track');
    bar.style.display='block';
    // Duplicar para efecto infinito
    const html=activos.map(a=>`<span class="anuncio-item"><span class="adot"></span>${a.icono||'📢'} ${a.texto}</span>`).join('');
    track.innerHTML=html+html; // doble para loop
  }catch(e){}
}
cargarAnuncios();

// ── ORACIÓN ───────────────────────────────────────────────────
window.abrirOracion=function(){
  document.getElementById('prayer-nombre').value='';
  document.getElementById('prayer-text').value='';
  document.getElementById('ov-oracion').classList.add('open');
  setTimeout(()=>document.getElementById('prayer-text').focus(),250);
};
window.cerrarOracion=function(){document.getElementById('ov-oracion').classList.remove('open');};

window.enviarOracion=async function(){
  const texto=document.getElementById('prayer-text').value.trim();
  const nombre=document.getElementById('prayer-nombre').value.trim();
  if(!texto){toast('Escribe tu petición primero','err');return;}
  try{
    await setDoc(doc(collection(db,'oraciones')),{
      nombre:nombre||'Anónimo',
      texto,
      fecha:hoy(),
      hora:`${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}`,
      respondida:false,
      timestamp:serverTimestamp()
    });
    cerrarOracion();
    toast('🙏 Tu petición fue enviada');
    // Animación especial
    setTimeout(()=>{
      const ws=document.getElementById('wscreen');
      const wp=document.getElementById('w-photo');
      const wn=document.getElementById('w-name');
      const wm=document.getElementById('w-msg');
      const wr=document.getElementById('w-role');
      if(ws){
        wp.innerHTML='🙏';wp.style.fontSize='72px';
        wn.textContent=nombre||'Petición Enviada';
        wm.textContent='Tu oración llegará al altar · Dios te escucha';
        wr.innerHTML='';
        ws.classList.add('show');
        setTimeout(()=>ws.classList.remove('show'),3500);
      }
    },400);
  }catch(e){toast(e.message,'err');}
};

document.getElementById('ov-oracion')?.addEventListener('click',function(e){if(e.target===this)cerrarOracion();});

// ── SALVAPANTALLAS ─────────────────────────────────────────────
let ssTimer=null;
const SS_TIMEOUT=90000; // 90 segundos sin interacción

function crearParticulas(){
  const cont=document.getElementById('ss-particles');
  if(!cont)return;
  cont.innerHTML='';
  for(let i=0;i<20;i++){
    const p=document.createElement('div');
    p.className='ss-particle';
    p.style.cssText=`left:${Math.random()*100}%;animation-duration:${Math.random()*8+6}s;animation-delay:${Math.random()*8}s;opacity:0;`;
    cont.appendChild(p);
  }
}

function mostrarSS(){
  const ss=document.getElementById('screensaver');
  if(!ss)return;
  crearParticulas();
  ss.classList.add('show');
  // Mover logo aleatoriamente
  const logo=ss.querySelector('.ss-logo');
  if(logo){
    const maxX=window.innerWidth-140, maxY=window.innerHeight-280;
    let posX=maxX/2,posY=maxY/2,velX=1.2,velY=0.9;
    window._ssAnim=setInterval(()=>{
      posX+=velX;posY+=velY;
      if(posX<=0||posX>=maxX)velX*=-1;
      if(posY<=0||posY>=maxY)velY*=-1;
      logo.style.left=posX+'px';logo.style.top=posY+'px';
    },16);
  }
}

function ocultarSS(){
  const ss=document.getElementById('screensaver');
  if(!ss)return;
  ss.classList.remove('show');
  if(window._ssAnim){clearInterval(window._ssAnim);window._ssAnim=null;}
}

function resetSS(){
  ocultarSS();
  clearTimeout(ssTimer);
  ssTimer=setTimeout(mostrarSS, SS_TIMEOUT);
}

// Actualizar reloj del salvapantallas
setInterval(()=>{
  const el=document.getElementById('ss-clock');
  if(el){const n=new Date();el.textContent=`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;}
},1000);

// Detectar interacción
['click','touchstart','keydown','mousemove'].forEach(ev=>{
  document.addEventListener(ev, resetSS, {passive:true});
});
// Click en salvapantallas lo oculta
document.getElementById('screensaver')?.addEventListener('click', resetSS);
// Iniciar timer
resetSS();
