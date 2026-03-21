/* ═══════════════════════════════════════════════════
   Admin · Iglesia Luz y Vida IV — JavaScript
═══════════════════════════════════════════════════ */

// ══ ALERTAS — definidas primero para garantizar disponibilidad ══
const TOAST_META={ok:{ico:'✅',dur:3500},err:{ico:'❌',dur:5000},warn:{ico:'⚠️',dur:4000},info:{ico:'ℹ️',dur:3500}};

window.toast=function(mensaje,tipo,subtitulo){
  tipo=tipo||'ok'; subtitulo=subtitulo||'';
  var stack=document.getElementById('toast-stack');
  if(!stack)return;
  var meta=TOAST_META[tipo]||TOAST_META.ok;
  var item=document.createElement('div');
  item.className='toast-item '+tipo;
  item.style.setProperty('--dur',meta.dur+'ms');
  item.innerHTML='<span class="toast-ico">'+meta.ico+'</span><div class="toast-body"><div class="toast-title">'+mensaje+'</div>'+(subtitulo?'<div class="toast-sub">'+subtitulo+'</div>':'')+'</div><button class="toast-close">✕</button>';
  stack.appendChild(item);
  requestAnimationFrame(function(){requestAnimationFrame(function(){item.classList.add('show');});});
  var timer=setTimeout(function(){item.classList.add('hide');setTimeout(function(){if(item.parentNode)item.remove();},350);},meta.dur);
  item.querySelector('.toast-close').addEventListener('click',function(){clearTimeout(timer);item.classList.add('hide');setTimeout(function(){if(item.parentNode)item.remove();},350);});
};

window.confirmar=function(opts){
  var icono=opts.icono||'⚠️', titulo=opts.titulo||'¿Estás seguro?';
  var mensaje=opts.mensaje||'', txtOk=opts.txtOk||'Confirmar';
  var danger=opts.danger!==false, onOk=opts.onOk;

  var ov  = document.getElementById('dlg-overlay');
  var box = document.getElementById('dlg-box');

  // Si el dialog no está en el DOM todavía, reintentar en 100ms
  if(!ov||!box){
    setTimeout(function(){ window.confirmar(opts); }, 100);
    return;
  }

  document.getElementById('dlg-icon').textContent=icono;
  document.getElementById('dlg-icon').className='dialog-icon'+(danger?' danger':'');
  document.getElementById('dlg-title').textContent=titulo;
  document.getElementById('dlg-msg').textContent=mensaje;
  box.className='dialog '+(danger?'danger':'safe');
  ov.classList.add('open');

  var oldOk =document.getElementById('dlg-confirm');
  var oldCnc=document.getElementById('dlg-cancel');
  var newOk =oldOk.cloneNode(true);
  var newCnc=oldCnc.cloneNode(true);
  oldOk.parentNode.replaceChild(newOk,oldOk);
  oldCnc.parentNode.replaceChild(newCnc,oldCnc);
  newOk.textContent=txtOk;
  newOk.className='dialog-btn '+(danger?'confirm-danger':'confirm-ok');
  newOk.addEventListener('click',function(){ov.classList.remove('open');if(onOk)onOk();});
  newCnc.addEventListener('click',function(){ov.classList.remove('open');});
  ov.onclick=function(e){if(e.target===ov)ov.classList.remove('open');};
};

const firebaseConfig={apiKey:"AIzaSyA-XTJPcNGJN1cHKANF7ShwIW68vQ4V_OQ",authDomain:"iglesia-luz-vida.firebaseapp.com",projectId:"iglesia-luz-vida",storageBucket:"iglesia-luz-vida.firebasestorage.app",messagingSenderId:"2442440076",appId:"1:2442440076:web:6ec7c5643d3af4fd57faa9"};
try{ firebase.initializeApp(firebaseConfig); }catch(e){ /* ya inicializado */ }
const db = firebase.firestore();

const DIAS=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const MESES_S=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const PASS='admin1234'; // ← CAMBIA AQUÍ
const RCLS={Pastor:'pastor','Co-Pastor':'copastor','Secretario General':'secgen','Tesorero General':'tesgen',Diácono:'diacono',Miembro:'miembro',Visitante:'visitante','Pres. Dayca':'presd','Vice. Dayca':'vpd','Sec. Dayca':'secd','Tes. Dayca':'tesd','1er Vocal Dayca':'vocal1d','2do Vocal Dayca':'vocal2d','Pres. Juvenil':'presj','Vice. Juvenil':'vpj','Sec. Juvenil':'secj','Tes. Juvenil':'tesj','1er Vocal Juv.':'vocal1j','2do Vocal Juv.':'vocal2j'};
const RICO={Pastor:'⛪','Co-Pastor':'⛪','Secretario General':'📋','Tesorero General':'💰',Diácono:'🙏',Miembro:'👤',Visitante:'🌟','Pres. Dayca':'👑','Vice. Dayca':'🌸','Sec. Dayca':'📋','Tes. Dayca':'💰','1er Vocal Dayca':'🎤','2do Vocal Dayca':'🎤','Pres. Juvenil':'👑','Vice. Juvenil':'🌸','Sec. Juvenil':'📋','Tes. Juvenil':'💰','1er Vocal Juv.':'🎤','2do Vocal Juv.':'🎤'};

let miembros=[],asistidos=new Set(),asistMap={},historial=[],filtroActual='all';
let chartLine=null,chartRoles=null;

// ── TEMA ──────────────────────────────────────────────────────
const savedTheme=localStorage.getItem('lviv-theme')||'dark';
document.documentElement.setAttribute('data-theme',savedTheme);
// tbtn se actualiza en init() cuando el DOM esté listo
window.toggleTheme=function(){
  const html=document.documentElement;const isDark=html.getAttribute('data-theme')==='dark';
  html.setAttribute('data-theme',isDark?'light':'dark');
  document.getElementById('tbtn').textContent=isDark?'🌞':'🌙';
  localStorage.setItem('lviv-theme',isDark?'light':'dark');
};

// ── HELPERS ──────────────────────────────────────────────────
function hoy(){return new Date().toISOString().split('T')[0];}
function ini(n){return n.trim().split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();}
// ══ SISTEMA DE ALERTAS PREMIUM ═══════════════════════════════

// ── ALERTAS definidas al inicio del script ──
function rbadge(rol){if(!rol)return'';const c=RCLS[rol]||'miembro',i=RICO[rol]||'👤';return`<span class="rbadge ${c}">${i} ${rol}</span>`;}
function fotoEl(m,cls='mf'){const i=ini(m.nombre);const img=m.foto_url?`<img src="${m.foto_url}" alt="${m.nombre}" onerror="this.parentElement.innerHTML='${i}'">`:`${i}`;return`<div class="${cls}">${img}</div>`;}
function esCumpleHoy(m){if(!m.cumpleanos)return false;const n=new Date();const[,mes,dia]=m.cumpleanos.split('-');return parseInt(mes)===n.getMonth()+1&&parseInt(dia)===n.getDate();}
function esCumpleMes(m){if(!m.cumpleanos)return false;const[,mes]=m.cumpleanos.split('-');return parseInt(mes)===new Date().getMonth()+1;}

// ── RELOJ ─────────────────────────────────────────────────────
function horario(){const d=new Date().getDay();if(d===0)return{n:'Culto Dominical',i:'8:00 AM',f:'~3:00 PM',mi:480,mf:900};if(d===2)return{n:'Culto de Martes',i:'7:00 PM',f:'9:00 PM',mi:1140,mf:1260};if(d===6)return{n:'Culto de Sábado',i:'7:00 PM',f:'9:00 PM',mi:1140,mf:1260};return null;}
function tick(){
  const now=new Date();
  document.getElementById('clk-t').textContent=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  document.getElementById('clk-d').textContent=`${DIAS[now.getDay()]}, ${now.getDate()} de ${MESES[now.getMonth()]} ${now.getFullYear()}`;
  document.getElementById('cbar-date').textContent=`${DIAS[now.getDay()]} ${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`;
  const h=horario(),mins=now.getHours()*60+now.getMinutes(),cb=document.getElementById('cbar'),ct=document.getElementById('cbar-txt');
  if(h){if(mins>=h.mi&&mins<=h.mf){cb.className='cbar z on';ct.textContent=`${h.n} en curso · ${h.i} – ${h.f}`;}else if(mins<h.mi){cb.className='cbar z';ct.textContent=`Hoy · ${h.n} · ${h.i} – ${h.f}`;}else{cb.className='cbar z';ct.textContent='✅ Culto finalizado';}}
  else{cb.className='cbar z';ct.textContent='Sin culto hoy · Próximo: Mar o Sáb 7:00 PM';}
}
// tick() se inicia en init()

// ── AUTH ──────────────────────────────────────────────────────
window.login=function(){
  if(document.getElementById('pass').value===PASS){
    document.getElementById('login').style.display='none';
    document.getElementById('dash').style.display='flex';
    document.getElementById('btn-out').style.display='inline-flex';
    document.getElementById('lerr').style.display='none';
    document.getElementById('pass').value='';
    cargar();
  }else{document.getElementById('lerr').style.display='block';document.getElementById('pass').select();}
};
window.salir=function(){document.getElementById('login').style.display='flex';document.getElementById('dash').style.display='none';document.getElementById('btn-out').style.display='none';};

// ── CARGAR ────────────────────────────────────────────────────
async function cargar(){
  const ms=(await db.collection('miembros').get());
  miembros=ms.docs.map(d=>({id:d.id,...d.data()})).filter(m=>m.activo!==false).sort((a,b)=>a.nombre.localeCompare(b.nombre));

  // Cumpleaños de hoy
  const bdayHoy=miembros.filter(m=>esCumpleHoy(m));
  if(bdayHoy.length){
    document.getElementById('bday-names').textContent=bdayHoy.map(m=>`🎂 ${m.nombre}`).join('  ·  ');
    document.getElementById('bday-alert').classList.add('show');
  }

  db.collection(`asistencia/${hoy()}/registros`).onSnapshot(snap=>{
    asistidos=new Set(snap.docs.map(d=>d.id));
    asistMap={};snap.docs.forEach(d=>asistMap[d.id]=d.data().hora_llegada);
    stats();renderHoy(filtroActual);
  });

  // Historial
  const hSnap=(await db.collection('asistencia').get());
  const dates=[];
  for(const dd of hSnap.docs){
    const regs=(await db.collection(`asistencia/${dd.id}/registros`).get());
    if(regs.size>0)dates.push({fecha:dd.id,count:regs.size,registros:regs.docs.map(r=>({id:r.id,...r.data()}))});
  }
  historial=dates.sort((a,b)=>b.fecha.localeCompare(a.fecha));

  renderHermanos();renderHistorial();renderCumples();dayLabel();
  // Inicializar estado de tabs al cargar el dashboard
  document.querySelectorAll('.tab').forEach(t=>{t.style.display='none';});
  const activeTab=document.querySelector('.tab.on');
  if(activeTab) activeTab.style.display='block';
}

function dayLabel(){const now=new Date();const el=document.getElementById('dlbl');if(el)el.textContent=`${DIAS[now.getDay()]}, ${now.getDate()} de ${MESES[now.getMonth()]} de ${now.getFullYear()}`;}

// ── STATS ─────────────────────────────────────────────────────
function stats(){
  const tot=miembros.length,pre=asistidos.size,aus=tot-pre;
  document.getElementById('st-tot').textContent=tot;
  document.getElementById('st-pre').textContent=pre;
  document.getElementById('st-aus').textContent=aus;
  document.getElementById('st-pct').textContent=tot?Math.round(pre/tot*100)+'%':'0%';
}

// ── RENDER HOY ────────────────────────────────────────────────
function renderHoy(f='all'){
  let lista=miembros;
  if(f==='pre')lista=miembros.filter(m=>asistidos.has(m.id));
  if(f==='aus')lista=miembros.filter(m=>!asistidos.has(m.id));
  document.getElementById('tbody-hoy').innerHTML=lista.map(m=>{
    const p=asistidos.has(m.id),h=asistMap[m.id]||'—';
    const bday=esCumpleHoy(m)?'🎂 ':'';
    return`<tr>
      <td><div class="tn">${fotoEl(m)} ${bday}${m.nombre}</div></td>
      <td class="tid">${m.codigo}</td>
      <td>${rbadge(m.rol)}</td>
      <td><span class="pill ${p?'p':'a'}">${p?'Presente':'Ausente'}</span></td>
      <td class="ttime">${h}</td>
      <td><div class="rack">
        ${p?`<button class="rbtn" onclick="quitar('${m.id}')">✕</button>`:`<button class="rbtn" onclick="marcar('${m.id}')">✓</button>`}
      </div></td>
    </tr>`;
  }).join('')||`<tr><td colspan="6" class="etbl">Sin registros</td></tr>`;
}
window.filtro=function(f,el){filtroActual=f;document.querySelectorAll('.chip').forEach(c=>c.classList.remove('on'));el.classList.add('on');renderHoy(f);};

// ── RENDER HERMANOS ───────────────────────────────────────────
function renderHermanos(){
  document.getElementById('hcnt').textContent=`${miembros.length} miembro(s)`;
  document.getElementById('tbody-herm').innerHTML=miembros.map(m=>{
    const bday=m.cumpleanos||'—';
    const esBday=esCumpleHoy(m);
    return`<tr>
      <td><div class="tn">${fotoEl(m)} ${esBday?'🎂 ':''}${m.nombre}</div></td>
      <td class="tid">${m.codigo}</td>
      <td>${rbadge(m.rol)}</td>
      <td class="ttime">${bday!=='—'?bday.slice(5).replace('-','/')+(esBday?' 🎂':''):bday}</td>
      <td style="color:var(--gold)">${m.dias_asistidos||0} día(s)</td>
      <td><div class="rack"><button class="rbtn del" onclick="eliminar('${m.id}','${m.nombre.replace(/'/g,'')}')">🗑</button></div></td>
    </tr>`;
  }).join('')||`<tr><td colspan="6" class="etbl">No hay hermanos</td></tr>`;
}

// ── GRÁFICAS ──────────────────────────────────────────────────
function renderGraficas(){
  // Gráfica de línea: últimos 10 cultos
  const recent=historial.slice(0,10).reverse();
  const labels=recent.map(d=>d.fecha.slice(5));
  const data=recent.map(d=>d.count);

  const isDark=document.documentElement.getAttribute('data-theme')==='dark';
  const gridColor=isDark?'rgba(200,169,110,.08)':'rgba(100,75,30,.08)';
  const textColor=isDark?'#B8A888':'#5A4A2A';

  if(chartLine)chartLine.destroy();
  const ctx1=document.getElementById('chart-line').getContext('2d');
  chartLine=new Chart(ctx1,{
    type:'line',
    data:{
      labels,
      datasets:[{
        label:'Presentes',
        data,
        borderColor:'#C8A96E',
        backgroundColor:'rgba(200,169,110,.1)',
        borderWidth:2.5,
        pointBackgroundColor:'#C8A96E',
        pointRadius:5,
        tension:.4,
        fill:true,
      }]
    },
    options:{
      responsive:true,maintainAspectRatio:true,
      plugins:{legend:{display:false}},
      scales:{
        x:{grid:{color:gridColor},ticks:{color:textColor,font:{size:11}}},
        y:{grid:{color:gridColor},ticks:{color:textColor,font:{size:11}},beginAtZero:true}
      }
    }
  });

  // Gráfica de dona: roles
  const roleCounts={};
  miembros.forEach(m=>{const r=m.rol||'Miembro';roleCounts[r]=(roleCounts[r]||0)+1;});
  const rLabels=Object.keys(roleCounts);
  const rData=rLabels.map(k=>roleCounts[k]);
  const RCOLORS={'Pastor':'#F07080','Diácono':'#7EB8FF','Miembro':'#5DC99A','Visitante':'#CE93D8','Líder Jóvenes':'#FFAB40','Líder Martes':'#4DB6AC','Presidenta':'#EF9A9A','Vicepresidenta':'#F48FB1','Secretaria':'#90CAF9','Tesorera':'#A5D6A7','1er Vocal':'#B39DDB','2do Vocal':'#9FA8DA'};
  const colors=rLabels.map(r=>RCOLORS[r]||'#C8A96E');

  if(chartRoles)chartRoles.destroy();
  const ctx2=document.getElementById('chart-roles').getContext('2d');
  chartRoles=new Chart(ctx2,{
    type:'doughnut',
    data:{
      labels:rLabels,
      datasets:[{data:rData,backgroundColor:colors,borderColor:'rgba(0,0,0,.2)',borderWidth:2,hoverOffset:6}]
    },
    options:{
      responsive:true,maintainAspectRatio:true,
      plugins:{legend:{labels:{color:textColor,font:{size:11},padding:16}}}
    }
  });
}

// ── CUMPLEAÑOS ────────────────────────────────────────────────
function renderCumples(){
  const cont=document.getElementById('cumples-cont');
  const conBday=miembros.filter(m=>m.cumpleanos).sort((a,b)=>{
    const[,am,ad]=a.cumpleanos.split('-');
    const[,bm,bd]=b.cumpleanos.split('-');
    return(parseInt(am)-parseInt(bm))||(parseInt(ad)-parseInt(bd));
  });

  if(!conBday.length){cont.innerHTML=`<div style="text-align:center;padding:60px;color:var(--cream-s);font-style:italic;font-family:'Cormorant Garamond',serif;font-size:20px;">Ningún hermano tiene fecha de cumpleaños registrada</div>`;return;}

  // Agrupar por mes
  const byMonth={};
  conBday.forEach(m=>{const[,mes]=m.cumpleanos.split('-');const key=parseInt(mes);if(!byMonth[key])byMonth[key]=[];byMonth[key].push(m);});

  cont.innerHTML=Object.entries(byMonth).sort((a,b)=>parseInt(a[0])-parseInt(b[0])).map(([mes,lista])=>{
    const cards=lista.map(m=>{
      const isHoy=esCumpleHoy(m);
      const[,mm,dd]=m.cumpleanos.split('-');
      return`<div class="bday-card${isHoy?' today':''}">
        ${fotoEl(m,'bday-av')}
        <div>
          <div class="bday-name">${isHoy?'🎂 ':''}${m.nombre}</div>
          <div class="bday-date">${dd}/${mm} · ${rbadge(m.rol)}</div>
          ${isHoy?'<div class="bday-tag">¡HOY ES SU CUMPLEAÑOS!</div>':''}
        </div>
      </div>`;
    }).join('');
    return`<div style="margin-bottom:28px;">
      <h4 style="font-family:'Cormorant Garamond',serif;font-size:18px;color:var(--gold);margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid var(--border);">${MESES[parseInt(mes)-1]}</h4>
      <div class="bday-grid">${cards}</div>
    </div>`;
  }).join('');
}

// ── HISTORIAL ─────────────────────────────────────────────────
function renderHistorial(){
  const c=document.getElementById('hist-cont');
  if(!historial.length){c.innerHTML=`<div style="text-align:center;padding:60px;color:var(--cream-s);font-style:italic;font-family:'Cormorant Garamond',serif;font-size:20px;">Sin historial aún</div>`;return;}
  c.innerHTML=historial.map(d=>{
    const tot=miembros.length,pct=tot?Math.round(d.count/tot*100):0;
    const pills=d.registros.map(r=>{const m=miembros.find(x=>x.id===r.miembro_id||x.id===r.id);return`<span class="hpill">${m?m.nombre:r.miembro_id} <span style="opacity:.55;font-size:10px">${r.hora_llegada||''}</span></span>`;}).join('');
    return`<div class="hday"><div class="hday-h"><h4>${d.fecha}</h4><span>${d.count}/${tot} presentes · ${pct}%</span></div><div class="hpills">${pills||'<span style="color:var(--cream-s);font-size:12px;">Sin registros</span>'}</div></div>`;
  }).join('');
}

// ── TABS ──────────────────────────────────────────────────────
// ── TAB NAVIGATION (versión definitiva) ─────────────────────
window.tab=function(id,el){
  // 1. Ocultar TODOS los tabs con display:none explícito
  document.querySelectorAll('.tab').forEach(t=>{
    t.classList.remove('on');
    t.style.display='none';
  });
  // 2. Desactivar todos los botones del sidebar
  document.querySelectorAll('.sbtn').forEach(b=>b.classList.remove('on'));
  // 3. Mostrar SOLO el tab seleccionado
  const tabEl=document.getElementById('tab-'+id);
  if(tabEl){
    tabEl.classList.add('on');
    tabEl.style.display='block';
  }
  // 4. Activar el botón correcto en el sidebar
  if(el) el.classList.add('on');
  // 5. Scroll al tope de la página
  window.scrollTo({top:0,behavior:'smooth'});
  // 6. Cargar datos del tab
  const loaders={
    graficas:   ()=>renderGraficas(),
    ranking:    ()=>renderRanking(),
    calendario: ()=>renderCalendario(),
    stats:      ()=>poblarStatsSelect(),
    familias:   ()=>renderFamilias(),
    config:     ()=>{cargarConfig();cargarColoresInputs();},
    diezmos:    ()=>renderDiezmos(),
    oraciones:  ()=>renderOraciones(),
    anuncios:   ()=>renderAnuncios(),
    galeria:    ()=>renderGaleria(),
    votaciones: ()=>renderVotaciones(),
    misiones:   ()=>renderMisiones(),
    actas:      ()=>renderActas(),
  };
  if(loaders[id]) setTimeout(loaders[id],80);
};

// Inicializar todos los tabs ocultos menos el primero
document.querySelectorAll('.tab').forEach(t=>{t.style.display='none';});
const firstTab=document.getElementById('tab-hoy');
if(firstTab){firstTab.style.display='block';firstTab.classList.add('on');}

// ── ACCIONES ─────────────────────────────────────────────────
window.marcar=async function(id){try{const now=new Date();const h=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;await db.collection(`asistencia/${hoy()}/registros`).doc(id).set({miembro_id:id,hora_llegada:h,timestamp:firebase.firestore.FieldValue.serverTimestamp()});toast('✓ Asistencia marcada','ok','Registrado correctamente');}catch(e){toast(e.message,'err');}};
window.quitar=async function(id){try{await db.collection(`asistencia/${hoy()}/registros`).doc(id).delete();toast('Asistencia removida','warn','Quitada del registro de hoy');}catch(e){toast(e.message,'err');}};
window.eliminar=async function(id,nombre){
  confirmar({
    icono:'🗑️', titulo:`Eliminar a ${nombre}`,
    mensaje:`Esta acción no se puede deshacer. ${nombre} será removido de la lista de hermanos.`,
    txtOk:'Sí, eliminar', danger:true,
    onOk: async()=>{
      try{
        await db.collection('miembros').doc(id).update({activo:false});
        miembros=miembros.filter(m=>m.id!==id);
        renderHermanos();stats();renderHoy(filtroActual);
        toast(`${nombre} eliminado`,'ok');
      }catch(e){toast(e.message,'err');}
    }
  });
};
window.reiniciar=async function(){
  confirmar({
    icono:'🔄', titulo:'Reiniciar Asistencia',
    mensaje:'Se borrará la asistencia de HOY para todos los hermanos. Esta acción no se puede deshacer.',
    txtOk:'Sí, reiniciar', danger:true,
    onOk: async()=>{
      try{
        const snap=await db.collection(`asistencia/${hoy()}/registros`).get();
        await Promise.all(snap.docs.map(d=>d.ref.delete()));
        toast('Asistencia reiniciada','ok','Todos los registros de hoy borrados');
      }catch(e){toast(e.message,'err');}
    }
  });
};

// ── AGREGAR ───────────────────────────────────────────────────
window.abrirAdd=function(){['fn','fc','ff'].forEach(id=>document.getElementById(id).value='');document.getElementById('frol').value='Miembro';document.getElementById('fcumple').value='';document.getElementById('ov-add').classList.add('open');setTimeout(()=>document.getElementById('fn').focus(),200);};
window.cerrarAdd=function(){document.getElementById('ov-add').classList.remove('open');};

window.agregarMiembro=async function(){
  const nombre=document.getElementById('fn').value.trim();
  let codigo=document.getElementById('fc').value.trim();
  const rol=document.getElementById('frol').value;
  const cumpleanos=document.getElementById('fcumple').value;
  const foto_url=document.getElementById('ff').value.trim();
  if(!nombre){toast('El nombre es obligatorio','err');return;}
  if(!codigo){const max=miembros.reduce((mx,m)=>Math.max(mx,parseInt(m.codigo)||0),0);codigo=String(max+1).padStart(4,'0');}
  if(miembros.find(m=>m.codigo===codigo)){toast('Ese ID ya existe','err');return;}
  try{
    const ref=db.collection('miembros').doc();
    const data={nombre,codigo,rol,foto_url:foto_url||'',activo:true,dias_asistidos:0,creado_en:firebase.firestore.FieldValue.serverTimestamp()};
    if(cumpleanos)data.cumpleanos=cumpleanos;
    await ref.set(data);
    miembros.push({id:ref.id,...data});
    cerrarAdd();renderHermanos();stats();renderHoy(filtroActual);renderCumples();
    toast(`✓ ${nombre} agregado — ID: ${codigo}`);
  }catch(e){toast(e.message,'err');}
};

// ── EXPORTAR ──────────────────────────────────────────────────
window.exportar=function(){
  const rows=[['ID','Nombre','Rol','Cumpleaños','Estado','Hora']];
  miembros.forEach(m=>rows.push([m.codigo,m.nombre,m.rol||'',m.cumpleanos||'',asistidos.has(m.id)?'Presente':'Ausente',asistMap[m.id]||'']));
  const csv=rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'}));a.download=`asistencia_${hoy()}.csv`;a.click();
  toast('📥 CSV descargado','info','Revisa tu carpeta de descargas');
};

document.getElementById('ov-add').addEventListener('click',function(e){if(e.target===this)cerrarAdd();});
document.getElementById('ov-evento').addEventListener('click',function(e){if(e.target===this)cerrarAddEvento();});

// ── RANKING ───────────────────────────────────────────────────
function renderRanking(){
  const cont=document.getElementById('ranking-cont');
  if(!historial.length&&miembros.length===0){cont.innerHTML='<div style="text-align:center;padding:60px;color:var(--cream-s);font-family:Cormorant Garamond,serif;font-style:italic;font-size:20px;">Sin datos de asistencia aún</div>';return;}

  // Contar asistencias por miembro en todo el historial
  const conteo={};
  historial.forEach(d=>{
    d.registros.forEach(r=>{
      const id=r.miembro_id||r.id;
      conteo[id]=(conteo[id]||0)+1;
    });
  });

  const maxCultos=historial.length||1;
  const ranked=miembros.map(m=>({...m,total:conteo[m.id]||0,pct:Math.round((conteo[m.id]||0)/maxCultos*100)}))
    .sort((a,b)=>b.total-a.total);

  const MEDALS=['gold','silver','bronze'];
  const EMOJIS=['🥇','🥈','🥉'];

  cont.innerHTML=ranked.map((m,i)=>{
    const cls=i<3?MEDALS[i]:'rest';
    const emoji=i<3?EMOJIS[i]:`${i+1}`;
    return`<div class="rank-card">
      ${fotoEl(m,'mf')}
      <div class="rank-num ${cls}">${emoji}</div>
      <div class="rank-bar-wrap">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <strong style="color:var(--cream);font-size:14px;">${m.nombre}</strong>
          <span style="color:var(--gold);font-size:13px;font-family:'Cormorant Garamond',serif;">${m.total} cultos</span>
        </div>
        <div class="rank-bar"><div class="rank-bar-fill" style="width:${m.pct}%"></div></div>
        <div class="rank-pct">${m.pct}% de asistencia</div>
      </div>
      ${rbadge(m.rol)}
    </div>`;
  }).join('');
}

// ── CALENDARIO ────────────────────────────────────────────────
async function renderCalendario(){
  const cont=document.getElementById('calendario-cont');
  cont.innerHTML='<div style="color:var(--cream-s);text-align:center;padding:30px;">Cargando...</div>';
  try{
    const snap=(await db.collection('eventos').get());
    const eventos=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.fecha.localeCompare(b.fecha));
    const hoyStr=hoy();
    const futuros=eventos.filter(e=>e.fecha>=hoyStr);
    const pasados=eventos.filter(e=>e.fecha<hoyStr).reverse();

    if(!futuros.length&&!pasados.length){
      cont.innerHTML=`<div style="text-align:center;padding:60px;color:var(--cream-s);font-family:'Cormorant Garamond',serif;font-style:italic;font-size:20px;">No hay eventos programados.<br>¡Agrega el primero!</div>`;
      return;
    }

    const TIPO_ICONS={culto:'📅',especial:'⭐',aniversario:'🎉',retiro:'🏕️',ayuno:'🙏'};
    const renderEvento=e=>{
      const isEsp=e.tipo&&e.tipo!=='culto';
      const icon=TIPO_ICONS[e.tipo]||'📅';
      const fecha=new Date(e.fecha+'T12:00:00');
      const fechaStr=`${DIAS[fecha.getDay()]} ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`;
      return`<div class="evento-card${isEsp?' especial':''}">
        <div class="evento-fecha">${fecha.getDate()}</div>
        <div class="evento-info">
          <strong>${icon} ${e.nombre}</strong>
          <span>${fechaStr}${e.hora?' · '+e.hora:''}</span>
          ${e.descripcion?`<span style="display:block;margin-top:3px;opacity:.7">${e.descripcion}</span>`:''}
        </div>
        <button class="rbtn del" onclick="eliminarEvento('${e.id}')">🗑</button>
      </div>`;
    };

    cont.innerHTML=(futuros.length?`<h4 style="font-family:'Cormorant Garamond',serif;font-size:18px;color:var(--gold);margin-bottom:14px;">Próximos Eventos</h4>${futuros.map(renderEvento).join('')}`:'')
      +(pasados.length?`<h4 style="font-family:'Cormorant Garamond',serif;font-size:18px;color:var(--cream-s);margin-bottom:14px;margin-top:28px;">Eventos Pasados</h4>${pasados.map(renderEvento).join('')}`:'');
  }catch(e){cont.innerHTML='<div style="color:#F07080;text-align:center;padding:30px;">Error al cargar eventos</div>';}
}

window.abrirAddEvento=function(){
  ['ev-nombre','ev-desc','ev-hora'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=id==='ev-hora'?'19:00':'';});
  document.getElementById('ev-fecha').value=hoy();
  document.getElementById('ev-tipo').value='culto';
  document.getElementById('ov-evento').classList.add('open');
  setTimeout(()=>document.getElementById('ev-nombre').focus(),200);
};
window.cerrarAddEvento=function(){document.getElementById('ov-evento').classList.remove('open');};

window.guardarEvento=async function(){
  const nombre=document.getElementById('ev-nombre').value.trim();
  const fecha=document.getElementById('ev-fecha').value;
  if(!nombre||!fecha){toast('Nombre y fecha son obligatorios','err');return;}
  try{
    await db.collection('eventos').doc().set({nombre,fecha,hora:document.getElementById('ev-hora').value,tipo:document.getElementById('ev-tipo').value,descripcion:document.getElementById('ev-desc').value.trim(),creado_en:firebase.firestore.FieldValue.serverTimestamp()});
    cerrarAddEvento();renderCalendario();toast('✓ Evento guardado','ok','Aparece en el calendario');
  }catch(e){toast(e.message,'err');}
};

window.eliminarEvento=async function(id){
  confirmar({
    icono:'📆', titulo:'Eliminar Evento',
    mensaje:'¿Seguro que deseas eliminar este evento del calendario?',
    txtOk:'Sí, eliminar', danger:true,
    onOk: async()=>{
      try{await db.collection('eventos').doc(id).delete();renderCalendario();toast('Evento eliminado','warn','Removido del calendario');}
      catch(e){toast(e.message,'err');}
    }
  });
};

// ── ESTADÍSTICAS INDIVIDUALES ────────────────────────────────
function poblarStatsSelect(){
  const sel=document.getElementById('stats-select');
  sel.innerHTML='<option value="">— Selecciona un hermano —</option>';
  miembros.forEach(m=>{
    const opt=document.createElement('option');
    opt.value=m.id;opt.textContent=`${m.nombre} (${m.codigo})`;
    sel.appendChild(opt);
  });
}

window.verStats=function(id){
  const cont=document.getElementById('stats-cont');
  if(!id){cont.innerHTML='';return;}
  const m=miembros.find(x=>x.id===id);
  if(!m)return;

  // Contar en historial
  const cultosTotales=historial.length;
  const cultosAsistidos=historial.filter(d=>d.registros.some(r=>(r.miembro_id||r.id)===id));
  const pct=cultosTotales?Math.round(cultosAsistidos.length/cultosTotales*100):0;

  // Últimas asistencias
  const ultimas=cultosAsistidos.slice(0,8).map(d=>{
    const reg=d.registros.find(r=>(r.miembro_id||r.id)===id);
    return`<div class="hpill">${d.fecha} <span style="opacity:.6">${reg?.hora_llegada||''}</span></div>`;
  }).join('');

  cont.innerHTML=`
    <div style="display:flex;align-items:center;gap:18px;margin-bottom:20px;">
      ${fotoEl(m,'mf')}
      <div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:22px;color:var(--cream);">${m.nombre}</div>
        <div style="font-size:11px;color:var(--gold-d);letter-spacing:3px;">ID: ${m.codigo}</div>
        <div style="margin-top:6px;">${rbadge(m.rol)}</div>
      </div>
    </div>
    <div class="stat-overview">
      <div class="stat-mini"><div class="val">${cultosAsistidos.length}</div><div class="lbl">Asistencias</div></div>
      <div class="stat-mini"><div class="val">${cultosTotales-cultosAsistidos.length}</div><div class="lbl" style="color:#F07080;">Ausencias</div></div>
      <div class="stat-mini"><div class="val" style="color:${pct>=75?'#5DC99A':pct>=50?'var(--gold)':'#F07080'}">${pct}%</div><div class="lbl">Asistencia</div></div>
    </div>
    ${cultosAsistidos.length?`<div><p style="font-size:11px;color:var(--cream-s);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Últimas asistencias</p><div class="hpills">${ultimas}</div></div>`:'<p style="color:var(--cream-s);font-style:italic;">Sin asistencias registradas</p>'}
  `;
};

// ── CONFIG: MENSAJE PERSONALIZADO ────────────────────────────
async function cargarConfig(){
  try{
    const snap=(await db.collection('config').get());
    snap.docs.forEach(d=>{
      if(d.id==='bienvenida'&&d.data().mensaje){
        const el=document.getElementById('msg-bienvenida');
        if(el)el.value=d.data().mensaje;
      }
    });
  }catch(e){}
}

window.guardarMensaje=async function(){
  const msg=document.getElementById('msg-bienvenida').value.trim();
  try{
    await db.collection('config').doc('bienvenida').set({mensaje:msg,actualizado:firebase.firestore.FieldValue.serverTimestamp()});
    toast('✓ Mensaje guardado','ok','Se mostrará en el kiosco');
  }catch(e){toast(e.message,'err');}
};



// ── DIEZMOS ──────────────────────────────────────────────────
async function renderDiezmos(){
  try{
    const snap=(await db.collection('diezmos').get());
    const todos=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>b.fecha?.localeCompare(a.fecha)||0);
    // Stats
    const total=todos.reduce((s,d)=>s+(parseFloat(d.monto)||0),0);
    const mes=new Date().getMonth()+1,yr=new Date().getFullYear();
    const esteMes=todos.filter(d=>d.fecha?.startsWith(`${yr}-${String(mes).padStart(2,'0')}`)).reduce((s,d)=>s+(parseFloat(d.monto)||0),0);
    document.getElementById('diezmos-stats').innerHTML=`
      <div class="stat-mini"><div class="val" style="font-size:24px;">RD$ ${total.toLocaleString()}</div><div class="lbl">Total General</div></div>
      <div class="stat-mini"><div class="val" style="font-size:24px;color:#5DC99A;">RD$ ${esteMes.toLocaleString()}</div><div class="lbl">Este Mes</div></div>
      <div class="stat-mini"><div class="val">${todos.length}</div><div class="lbl">Registros</div></div>`;
    document.getElementById('tbody-diezmos').innerHTML=todos.map(d=>{
      const m=miembros.find(x=>x.id===d.miembro_id);
      const mNombre=m?m.nombre:'Anónimo';
      const mFoto=m?fotoEl(m):'<div class="mf">?</div>';
      return`<tr>
        <td><div class="tn">${mFoto} ${mNombre}</div></td>
        <td><span class="diezmo-tipo ${d.tipo}">${d.tipo}</span></td>
        <td style="color:var(--gold);font-family:'Cormorant Garamond',serif;font-size:16px;">RD$ ${parseFloat(d.monto||0).toLocaleString()}</td>
        <td class="ttime">${d.fecha||'—'}</td>
        <td class="ttime">${d.notas||'—'}</td>
        <td><button class="rbtn del" onclick="eliminarDoc('diezmos','${d.id}',renderDiezmos)">🗑</button></td>
      </tr>`;
    }).join('')||`<tr><td colspan="6" class="etbl">Sin registros de diezmos</td></tr>`;
  }catch(e){toast(e.message,'err');}
}
window.abrirAddDiezmo=function(){
  const sel=document.getElementById('d-miembro');
  sel.innerHTML='<option value="">— Selecciona hermano —</option>'+miembros.map(m=>`<option value="${m.id}">${m.nombre}</option>`).join('');
  document.getElementById('d-fecha').value=hoy();
  document.getElementById('d-monto').value='';
  document.getElementById('d-notas').value='';
  document.getElementById('ov-diezmo').classList.add('open');
};
window.cerrarAddDiezmo=function(){document.getElementById('ov-diezmo').classList.remove('open');};
window.guardarDiezmo=async function(){
  const monto=document.getElementById('d-monto').value;
  if(!monto){toast('El monto es obligatorio','err');return;}
  try{
    await db.collection('diezmos').doc().set({
      miembro_id:document.getElementById('d-miembro').value,
      tipo:document.getElementById('d-tipo').value,
      monto:parseFloat(monto),
      fecha:document.getElementById('d-fecha').value,
      notas:document.getElementById('d-notas').value.trim(),
      registrado_en:firebase.firestore.FieldValue.serverTimestamp()
    });
    cerrarAddDiezmo();renderDiezmos();toast('✓ Diezmo registrado','ok','Guardado en el registro financiero');
  }catch(e){toast(e.message,'err');}
};

// ── ORACIONES ─────────────────────────────────────────────────
async function renderOraciones(){
  try{
    const snap=(await db.collection('oraciones').get());
    const todas=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>b.fecha?.localeCompare(a.fecha)||0);
    const cont=document.getElementById('oraciones-cont');
    if(!todas.length){cont.innerHTML=`<div style="text-align:center;padding:60px;color:var(--cream-s);font-style:italic;font-family:'Cormorant Garamond',serif;font-size:20px;">No hay peticiones de oración aún</div>`;return;}
    cont.innerHTML=todas.map(p=>`<div class="prayer-card${p.respondida?' respondida':''}">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
        <div class="prayer-card-name">🙏 ${p.nombre||'Anónimo'}</div>
        <div style="display:flex;gap:8px;align-items:center;">
          ${!p.respondida?`<button class="rbtn" onclick="marcarRespondida('${p.id}')">✓ Respondida</button>`:'<span style="color:#5DC99A;font-size:11px;letter-spacing:1px;">✓ RESPONDIDA</span>'}
          <button class="rbtn del" onclick="eliminarDoc('oraciones','${p.id}',renderOraciones)">🗑</button>
        </div>
      </div>
      <div class="prayer-card-text">"${p.texto}"</div>
      <div class="prayer-card-meta">${p.fecha||''} ${p.hora?'· '+p.hora:''}</div>
    </div>`).join('');
  }catch(e){}
}
window.marcarRespondida=async function(id){
  try{await db.collection('oraciones').doc(id).update({respondida:true});renderOraciones();toast('✓ Petición respondida 🙏','ok','Gloria a Dios');}
  catch(e){toast(e.message,'err');}
};

// ── ANUNCIOS ──────────────────────────────────────────────────
async function renderAnuncios(){
  try{
    const snap=(await db.collection('anuncios').get());
    const todos=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.creado_at||'').localeCompare(a.creado_at||''));
    const cont=document.getElementById('anuncios-cont');
    if(!todos.length){cont.innerHTML=`<div style="text-align:center;padding:60px;color:var(--cream-s);font-style:italic;font-family:'Cormorant Garamond',serif;font-size:20px;">Sin anuncios. ¡Crea el primero!</div>`;return;}
    cont.innerHTML=todos.map(a=>`<div class="anuncio-admin-card${a.activo?'':' inactivo'}">
      <div style="font-size:22px;">${a.icono||'📢'}</div>
      <div class="anuncio-text-preview">${a.texto}</div>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <button class="rbtn" onclick="toggleAnuncio('${a.id}',${!a.activo})">${a.activo?'⏸ Pausar':'▶ Activar'}</button>
        <button class="rbtn del" onclick="eliminarDoc('anuncios','${a.id}',renderAnuncios)">🗑</button>
      </div>
    </div>`).join('');
  }catch(e){}
}
window.abrirAddAnuncio=function(){document.getElementById('an-texto').value='';document.getElementById('an-icono').value='📢';document.getElementById('ov-anuncio').classList.add('open');setTimeout(()=>document.getElementById('an-texto').focus(),200);};
window.cerrarAddAnuncio=function(){document.getElementById('ov-anuncio').classList.remove('open');};
window.guardarAnuncio=async function(){
  const txt=document.getElementById('an-texto').value.trim();
  if(!txt){toast('El texto es obligatorio','err');return;}
  try{await db.collection('anuncios').doc().set({texto:txt,icono:document.getElementById('an-icono').value||'📢',activo:true,creado_at:hoy()});cerrarAddAnuncio();renderAnuncios();toast('✓ Anuncio publicado','ok','Ya aparece en el kiosco');}
  catch(e){toast(e.message,'err');}
};
window.toggleAnuncio=async function(id,activo){
  try{await db.collection('anuncios').doc(id).update({activo});renderAnuncios();}catch(e){toast(e.message,'err');}
};

// ── GALERÍA ───────────────────────────────────────────────────
async function renderGaleria(){
  try{
    const snap=(await db.collection('galeria').get());
    const fotos=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>b.fecha?.localeCompare(a.fecha)||0);
    const cont=document.getElementById('galeria-cont');
    if(!fotos.length){cont.style.display='block';cont.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--cream-s);font-style:italic;font-family:'Cormorant Garamond',serif;font-size:20px;">Sin fotos aún. ¡Agrega la primera!</div>`;return;}
    cont.style.display='grid';
    cont.innerHTML=fotos.map(f=>`<div class="foto-thumb">
      <img src="${f.url}" alt="${f.descripcion||''}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 75%22><rect fill=%22%23182030%22 width=%22100%22 height=%22100%25%22/><text x=%2250%22 y=%2238%22 text-anchor=%22middle%22 fill=%22%23C8A96E%22 font-size=%2214%22>📷</text></svg>'">
      <div class="foto-thumb-overlay"><button class="rbtn del" onclick="eliminarDoc('galeria','${f.id}',renderGaleria)" style="background:rgba(139,26,42,.8);">🗑</button></div>
      ${f.descripcion?`<div class="foto-thumb-label">${f.descripcion}</div>`:''}
    </div>`).join('');
  }catch(e){}
}
window.abrirAddFoto=function(){['f-url','f-desc'].forEach(id=>document.getElementById(id).value='');document.getElementById('f-fecha').value=hoy();document.getElementById('ov-foto').classList.add('open');};
window.cerrarAddFoto=function(){document.getElementById('ov-foto').classList.remove('open');};
window.guardarFoto=async function(){
  const url=document.getElementById('f-url').value.trim();
  if(!url){toast('La URL es obligatoria','err');return;}
  try{await db.collection('galeria').doc().set({url,descripcion:document.getElementById('f-desc').value.trim(),fecha:document.getElementById('f-fecha').value,categoria:document.getElementById('f-cat').value,subida:firebase.firestore.FieldValue.serverTimestamp()});cerrarAddFoto();renderGaleria();toast('✓ Foto agregada','ok');}
  catch(e){toast(e.message,'err');}
};

// ── VOTACIONES ────────────────────────────────────────────────
async function renderVotaciones(){
  try{
    const snap=(await db.collection('votaciones').get());
    const todos=snap.docs.map(d=>({id:d.id,...d.data()}));
    const cont=document.getElementById('votaciones-cont');
    if(!todos.length){cont.innerHTML=`<div style="text-align:center;padding:60px;color:var(--cream-s);font-style:italic;font-family:'Cormorant Garamond',serif;font-size:20px;">Sin votaciones. ¡Crea la primera!</div>`;return;}
    cont.innerHTML=todos.map(v=>{
      const opciones=v.opciones||[];
      const totalVotos=opciones.reduce((s,o)=>s+(o.votos||0),0);
      const opcionesHtml=opciones.map(o=>{
        const pct=totalVotos?Math.round((o.votos||0)/totalVotos*100):0;
        return`<div class="voto-opcion">
          <span style="font-size:13px;color:var(--cream);min-width:120px;">${o.texto}</span>
          <div class="voto-bar"><div class="voto-bar-fill" style="width:${pct}%"></div></div>
          <span class="voto-pct">${pct}%</span>
          <span class="voto-count">(${o.votos||0})</span>
        </div>`;
      }).join('');
      return`<div class="voto-card">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px;">
          <div class="voto-pregunta">🗳️ ${v.pregunta}</div>
          <div style="display:flex;gap:8px;">
            <span style="font-size:11px;color:var(--cream-s);">${totalVotos} votos</span>
            <button class="rbtn del" onclick="eliminarDoc('votaciones','${v.id}',renderVotaciones)">🗑</button>
          </div>
        </div>
        ${opcionesHtml}
        <p style="font-size:11px;color:var(--cream-s);margin-top:10px;letter-spacing:1px;">Enlace para votar: <code style="color:var(--gold);background:rgba(200,169,110,.1);padding:2px 8px;border-radius:4px;">luzyvida.pages.dev/votar.html?id=${v.id}</code></p>
      </div>`;
    }).join('');
  }catch(e){}
}
window.abrirAddVotacion=function(){document.getElementById('v-pregunta').value='';document.getElementById('v-opciones').value='';document.getElementById('ov-votacion').classList.add('open');};
window.cerrarAddVotacion=function(){document.getElementById('ov-votacion').classList.remove('open');};
window.guardarVotacion=async function(){
  const pregunta=document.getElementById('v-pregunta').value.trim();
  const optsRaw=document.getElementById('v-opciones').value.trim().split('\n').filter(l=>l.trim());
  if(!pregunta||optsRaw.length<2){toast('Necesitas pregunta y al menos 2 opciones','err');return;}
  const opciones=optsRaw.slice(0,5).map(t=>({texto:t.trim(),votos:0}));
  try{await db.collection('votaciones').doc().set({pregunta,opciones,creado:firebase.firestore.FieldValue.serverTimestamp(),activa:true});cerrarAddVotacion();renderVotaciones();toast('🗳️ Votación creada','ok');}
  catch(e){toast(e.message,'err');}
};

// ── MISIONES ──────────────────────────────────────────────────
async function renderMisiones(){
  try{
    const snap=(await db.collection('misiones').get());
    const todos=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>b.salida?.localeCompare(a.salida)||0);
    const cont=document.getElementById('misiones-cont');
    if(!todos.length){cont.innerHTML=`<div style="text-align:center;padding:60px;color:var(--cream-s);font-style:italic;font-family:'Cormorant Garamond',serif;font-size:20px;">Sin viajes ministeriales registrados</div>`;return;}
    cont.innerHTML=todos.map(m=>{
      const hoyStr=hoy();
      const completada=m.regreso&&m.regreso<hoyStr;
      return`<div class="mision-card${completada?' completada':''}">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
          <div class="mision-titulo">✈️ ${m.nombre}</div>
          <div style="display:flex;gap:8px;align-items:center;">
            <span class="pill ${completada?'p':'a'}" style="font-size:9px;">${completada?'Completada':'En planificación'}</span>
            <button class="rbtn del" onclick="eliminarDoc('misiones','${m.id}',renderMisiones)">🗑</button>
          </div>
        </div>
        <div class="mision-meta">${m.salida?'Salida: '+m.salida:''} ${m.regreso?'· Regreso: '+m.regreso:''}</div>
        ${m.equipo?`<div class="mision-meta" style="margin-top:4px;">👥 ${m.equipo}</div>`:''}
        ${m.descripcion?`<div style="font-size:13px;color:var(--cream-s);margin-top:8px;line-height:1.6;">${m.descripcion}</div>`:''}
      </div>`;
    }).join('');
  }catch(e){}
}
window.abrirAddMision=function(){['ms-nombre','ms-equipo','ms-desc'].forEach(id=>document.getElementById(id).value='');document.getElementById('ms-salida').value=hoy();document.getElementById('ms-regreso').value='';document.getElementById('ov-mision').classList.add('open');};
window.cerrarAddMision=function(){document.getElementById('ov-mision').classList.remove('open');};
window.guardarMision=async function(){
  const nombre=document.getElementById('ms-nombre').value.trim();
  if(!nombre){toast('El nombre es obligatorio','err');return;}
  try{await db.collection('misiones').doc().set({nombre,salida:document.getElementById('ms-salida').value,regreso:document.getElementById('ms-regreso').value,equipo:document.getElementById('ms-equipo').value.trim(),descripcion:document.getElementById('ms-desc').value.trim(),creado:firebase.firestore.FieldValue.serverTimestamp()});cerrarAddMision();renderMisiones();toast('✈️ Misión registrada','ok');}
  catch(e){toast(e.message,'err');}
};

// ── ACTAS ─────────────────────────────────────────────────────
async function renderActas(){
  try{
    const snap=(await db.collection('actas').get());
    const todas=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>b.fecha?.localeCompare(a.fecha)||0);
    const cont=document.getElementById('actas-cont');
    if(!todas.length){cont.innerHTML=`<div style="text-align:center;padding:60px;color:var(--cream-s);font-style:italic;font-family:'Cormorant Garamond',serif;font-size:20px;">Sin actas registradas</div>`;return;}
    cont.innerHTML=todas.map(a=>`<div class="acta-card" onclick="this.classList.toggle('open')">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <div>
          <div class="acta-titulo">📝 ${a.titulo}</div>
          <div class="acta-meta">${a.tipo||''} ${a.fecha?'· '+a.fecha:''}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="color:var(--cream-s);font-size:18px;">▼</span>
          <button class="rbtn del" onclick="event.stopPropagation();eliminarDoc('actas','${a.id}',renderActas)">🗑</button>
        </div>
      </div>
      <div class="acta-body">${a.contenido?.replace(/\n/g,'<br>')||''}</div>
    </div>`).join('');
  }catch(e){}
}
window.abrirAddActa=function(){['ac-titulo','ac-contenido'].forEach(id=>document.getElementById(id).value='');document.getElementById('ac-fecha').value=hoy();document.getElementById('ov-acta').classList.add('open');};
window.cerrarAddActa=function(){document.getElementById('ov-acta').classList.remove('open');};
window.guardarActa=async function(){
  const titulo=document.getElementById('ac-titulo').value.trim();
  const contenido=document.getElementById('ac-contenido').value.trim();
  if(!titulo||!contenido){toast('Título y contenido son obligatorios','err');return;}
  try{await db.collection('actas').doc().set({titulo,contenido,tipo:document.getElementById('ac-tipo').value,fecha:document.getElementById('ac-fecha').value,creado:firebase.firestore.FieldValue.serverTimestamp()});cerrarAddActa();renderActas();toast('📝 Acta guardada','ok');}
  catch(e){toast(e.message,'err');}
};

// ── HELPER ELIMINAR ───────────────────────────────────────────
window.eliminarDoc=async function(coleccion,id,callback){
  const nombres={
    oraciones:'esta petición de oración',
    anuncios:'este anuncio',
    galeria:'esta foto',
    votaciones:'esta votación',
    misiones:'este registro de misión',
    actas:'esta acta',
    diezmos:'este registro de diezmo',
    familias:'esta familia',
  };
  confirmar({
    icono:'🗑️', titulo:'Eliminar registro',
    mensaje:`¿Seguro que deseas eliminar ${nombres[coleccion]||'este registro'}? Esta acción no se puede deshacer.`,
    txtOk:'Sí, eliminar', danger:true,
    onOk: async()=>{
      try{
        await db.collection(coleccion).doc(id).delete();
        if(callback)callback();
        toast('Registro eliminado','warn','Esta acción no se puede deshacer');
      }catch(e){toast(e.message,'err');}
    }
  });
};

// ── OVERRIDE TAB (agregar nuevos) ─────────────────────────────


// ── OVERLAY CLOSES ────────────────────────────────────────────
['ov-diezmo','ov-anuncio','ov-foto','ov-votacion','ov-mision','ov-acta'].forEach(id=>{
  const el=document.getElementById(id);
  if(el) el.addEventListener('click',function(e){
    if(e.target===this) this.classList.remove('open');
  });
});

// ── FAMILIAS ─────────────────────────────────────────────────
async function renderFamilias(){
  const cont=document.getElementById('familias-cont');
  cont.innerHTML='<div style="color:var(--cream-s);text-align:center;padding:30px;">Cargando...</div>';
  try{
    const snap=(await db.collection('familias').get());
    const familias=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.nombre.localeCompare(b.nombre));
    if(!familias.length){
      cont.innerHTML=`<div style="text-align:center;padding:60px;color:var(--cream-s);font-family:'Cormorant Garamond',serif;font-style:italic;font-size:20px;">No hay familias registradas.<br>¡Crea la primera!</div>`;
      return;
    }
    cont.innerHTML=familias.map(fam=>{
      const mems=miembros.filter(m=>fam.miembros&&fam.miembros.includes(m.id));
      const pills=mems.map(m=>{
        const fotoHtml=m.foto_url
          ?`<img src="${m.foto_url}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;" onerror="this.outerHTML='<span class=familia-member-ini>${ini(m.nombre)}</span>'">`
          :`<span class="familia-member-ini">${ini(m.nombre)}</span>`;
        return`<div class="familia-member-pill">${fotoHtml} ${m.nombre.split(' ').slice(0,2).join(' ')}</div>`;
      }).join('');
      return`<div class="familia-card">
        <div class="familia-header">
          <div>
            <div class="familia-nombre">👨‍👩‍👧 ${fam.nombre}</div>
            <div style="font-size:11px;color:var(--cream-s);letter-spacing:1px;margin-top:3px;">${mems.length} miembro(s)</div>
          </div>
          <div class="rack">
            <button class="rbtn del" onclick="eliminarFamilia('${fam.id}','${fam.nombre.replace(/'/g,'')}')">🗑 Eliminar</button>
          </div>
        </div>
        <div class="familia-miembros">${pills||'<span style="color:var(--cream-s);font-size:13px;font-style:italic;">Sin miembros asignados</span>'}</div>
      </div>`;
    }).join('');
  }catch(e){cont.innerHTML='<div style="color:#F07080;text-align:center;padding:30px;">Error al cargar familias</div>';}
}

window.abrirAddFamilia=function(){
  document.getElementById('fam-nombre').value='';
  // Render checkboxes de miembros
  const list=document.getElementById('fam-miembros-list');
  list.innerHTML=miembros.map(m=>`
    <label style="display:flex;align-items:center;gap:10px;padding:7px 6px;cursor:pointer;border-radius:6px;transition:background .15s;" onmouseover="this.style.background='rgba(200,169,110,.06)'" onmouseout="this.style.background='transparent'">
      <input type="checkbox" value="${m.id}" style="accent-color:var(--gold);width:16px;height:16px;">
      <span style="font-size:13px;color:var(--cream);">${m.nombre}</span>
      ${rbadge(m.rol)}
    </label>`).join('');
  document.getElementById('ov-familia').classList.add('open');
  setTimeout(()=>document.getElementById('fam-nombre').focus(),200);
};
window.cerrarAddFamilia=function(){document.getElementById('ov-familia').classList.remove('open');};

window.guardarFamilia=async function(){
  const nombre=document.getElementById('fam-nombre').value.trim();
  if(!nombre){toast('El nombre es obligatorio','err');return;}
  const checks=document.getElementById('fam-miembros-list').querySelectorAll('input[type=checkbox]:checked');
  const miembrosIds=Array.from(checks).map(c=>c.value);
  try{
    await db.collection('familias').doc().set({nombre,miembros:miembrosIds,creado_en:firebase.firestore.FieldValue.serverTimestamp()});
    cerrarAddFamilia();renderFamilias();toast(`✓ Familia guardada`,'ok');
  }catch(e){toast(e.message,'err');}
};

window.eliminarFamilia=async function(id,nombre){
  confirmar({
    icono:'👨‍👩‍👧', titulo:`Eliminar familia ${nombre}`,
    mensaje:'Los miembros no serán eliminados, solo el grupo familiar.',
    txtOk:'Sí, eliminar', danger:true,
    onOk: async()=>{
      try{await db.collection('familias').doc(id).delete();renderFamilias();toast('Familia eliminada','warn','Removida del registro');}
      catch(e){toast(e.message,'err');}
    }
  });
};

// ── COLORES PERSONALIZADOS ─────────────────────────────────────
function syncColor(colorId, hexId){
  const hex=document.getElementById(hexId).value;
  if(/^#[0-9A-Fa-f]{6}$/.test(hex)){
    document.getElementById(colorId).value=hex;
    previewColor(colorId,hex);
  }
}
window.syncColor=syncColor;

// Sincronizar input color → hex
['col-gold','col-crimson','col-ink','col-emerald'].forEach(id=>{
  const el=document.getElementById(id);
  if(el) el.addEventListener('input',function(){
    const hexEl=document.getElementById(id+'-hex');
    if(hexEl) hexEl.value=this.value;
    previewColor(id,this.value);
  });
});

function previewColor(id,val){
  const map={'col-gold':'--gold','col-crimson':'--crimson','col-ink':'--ink','col-emerald':'--emerald'};
  if(map[id]) document.documentElement.style.setProperty(map[id],val);
}

// Cargar colores guardados en los inputs
function cargarColoresInputs(){
  const saved=localStorage.getItem('lviv-colors');
  if(!saved) return;
  try{
    const cols=JSON.parse(saved);
    const map={'--gold':'col-gold','--crimson':'col-crimson','--ink':'col-ink','--emerald':'col-emerald'};
    Object.entries(map).forEach(([cssVar,inputId])=>{
      if(cols[cssVar]){
        const colorEl=document.getElementById(inputId);
        const hexEl=document.getElementById(inputId+'-hex');
        if(colorEl) colorEl.value=cols[cssVar];
        if(hexEl) hexEl.value=cols[cssVar];
      }
    });
  }catch(e){}
}

window.guardarColores=async function(){
  const cols={
    '--gold':   document.getElementById('col-gold').value,
    '--gold-b': ajustarBrillo(document.getElementById('col-gold').value, 30),
    '--gold-d': ajustarBrillo(document.getElementById('col-gold').value, -30),
    '--crimson':document.getElementById('col-crimson').value,
    '--ink':    document.getElementById('col-ink').value,
    '--emerald':document.getElementById('col-emerald').value,
  };
  localStorage.setItem('lviv-colors',JSON.stringify(cols));
  // Guardar en Firebase para que el kiosco también los aplique
  try{
    await db.collection('config').doc('colores').set({...cols,actualizado:firebase.firestore.FieldValue.serverTimestamp()});
    toast('🎨 Colores aplicados','info');
  }catch(e){toast('🎨 Colores guardados','info');}
  Object.entries(cols).forEach(([k,v])=>document.documentElement.style.setProperty(k,v));
};

window.resetColores=function(){
  localStorage.removeItem('lviv-colors');
  ['--gold','--gold-b','--gold-d','--crimson','--ink','--emerald'].forEach(v=>document.documentElement.style.removeProperty(v));
  document.getElementById('col-gold').value='#C8A96E';
  document.getElementById('col-gold-hex').value='#C8A96E';
  document.getElementById('col-crimson').value='#8B1A2A';
  document.getElementById('col-crimson-hex').value='#8B1A2A';
  document.getElementById('col-ink').value='#080C14';
  document.getElementById('col-ink-hex').value='#080C14';
  document.getElementById('col-emerald').value='#1A6647';
  document.getElementById('col-emerald-hex').value='#1A6647';
  toast('↺ Colores restablecidos','info');
};

function ajustarBrillo(hex,amount){
  const num=parseInt(hex.slice(1),16);
  const r=Math.min(255,Math.max(0,(num>>16)+amount));
  const g=Math.min(255,Math.max(0,((num>>8)&0x00FF)+amount));
  const b=Math.min(255,Math.max(0,(num&0x0000FF)+amount));
  return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
}

// Aplicar colores guardados al cargar
(function(){
  const saved=localStorage.getItem('lviv-colors');
  if(saved){try{const cols=JSON.parse(saved);Object.entries(cols).forEach(([k,v])=>document.documentElement.style.setProperty(k,v));}catch(e){}}
})();



// ── INIT — se ejecuta cuando el DOM está 100% listo ──────────
function init(){
  // Tema
  var tbtn=document.getElementById('tbtn');
  if(tbtn) tbtn.textContent=(localStorage.getItem('lviv-theme')||'dark')==='dark'?'🌙':'🌞';
  // Reloj
  setInterval(tick,1000); tick();
  // Cerrar overlays al click fuera
  ['ov-add','ov-evento','ov-diezmo','ov-anuncio','ov-foto','ov-votacion','ov-mision','ov-acta','ov-familia'].forEach(function(id){
    var el=document.getElementById(id);
    if(el) el.addEventListener('click',function(e){if(e.target===this)this.classList.remove('open');});
  });
}

// Ejecutar init cuando el DOM esté listo
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', init);
}else{
  init();
}
