/* ════════════════════════════════════════════════
   BarberBook – WebinDev  |  app.js
   Lógica principal de la aplicación
   ════════════════════════════════════════════════ */

// ─── ESTADO DE LA RESERVA ───
let state = {
  step: 1,
  barberoId: null,
  serviciosIds: [],
  fecha: null,
  hora: null,
};

// ─── ESTADO DEL PANEL ───
let currentRole       = null;
let currentBarberoId  = null;
let loginRole         = 'admin';
let adminFiltroE      = 'todas';
let adminFiltroB      = 0;
let barberoFiltroE    = 'todas';
let ingresoPer        = 'dia';
let agendaDate        = new Date(); // fecha activa de la agenda del barbero

// ─── HELPERS GLOBALES ───
function fmtPrice(n) {
  return '$' + n.toLocaleString('es-CO');
}

function fmtEstado(e) {
  const map = { pendiente:'Pendiente', confirmada:'Confirmada', cancelada:'Cancelada', atendida:'Atendida', noshow:'No show' };
  return map[e] || e;
}

function statusBadge(e) {
  return `<span class="cita-status status-${e}">${fmtEstado(e)}</span>`;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

// ══════════════════════════════════════════════════════
// ─── INTRO ───
// ══════════════════════════════════════════════════════
const BRAND_TEXT = "web_indev";

function runIntro() {
  const brandLine = document.getElementById('brandLine');
  const introSub  = document.getElementById('introSub');
  const introDot  = document.getElementById('introDot');

  setTimeout(() => introDot.classList.add('visible'), 200);

  let i = 0;
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  brandLine.appendChild(cursor);

  const typeNext = () => {
    if (i >= BRAND_TEXT.length) {
      setTimeout(() => {
        cursor.style.display = 'none';
        introSub.classList.add('visible');
        setTimeout(slideToApp, 900);
      }, 500);
      return;
    }
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = BRAND_TEXT[i];
    if (BRAND_TEXT[i] === '_') {
      span.style.opacity = '0.5';
      span.style.color = 'var(--gold)';
    }
    brandLine.insertBefore(span, cursor);
    span.style.animationDelay = '0ms';
    i++;
    setTimeout(typeNext, i === 1 ? 80 : 55 + Math.random() * 40);
  };

  setTimeout(typeNext, 600);
}

function slideToApp() {
  document.getElementById('intro').classList.add('exit');
  document.getElementById('app').classList.add('visible');
}

// ══════════════════════════════════════════════════════
// ─── FLUJO DE RESERVA ───
// ══════════════════════════════════════════════════════

// ─── STEP 1: Barberos ───
function renderBarbers() {
  const grid = document.getElementById('barberGrid');
  grid.innerHTML = BARBEROS.map(b => `
    <div class="barber-card${state.barberoId === b.id ? ' selected' : ''}" data-id="${b.id}">
      <div class="barber-badge">✓</div>
      <div class="barber-avatar">${b.emoji}</div>
      <div class="barber-name">${b.nombre}</div>
      <div class="barber-specialty">${b.especialidad}</div>
    </div>
  `).join('');

  grid.querySelectorAll('.barber-card').forEach(card => {
    card.addEventListener('click', () => {
      state.barberoId = +card.dataset.id;
      renderBarbers();
      updateCTA();
    });
  });
}

// ─── STEP 2: Servicios ───
function renderServices() {
  const list = document.getElementById('serviceList');
  list.innerHTML = SERVICIOS.map(s => `
    <div class="service-item${state.serviciosIds.includes(s.id) ? ' selected' : ''}" data-id="${s.id}">
      <div class="service-info">
        <div class="service-name">${s.nombre}</div>
        <div class="service-meta"><span>⏱ ${s.duracion}</span></div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;position:relative;z-index:1">
        <div class="service-price">${fmtPrice(s.precio)}</div>
        <div class="service-check">
          <svg viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg>
        </div>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.service-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = +item.dataset.id;
      if (state.serviciosIds.includes(id)) {
        state.serviciosIds = state.serviciosIds.filter(x => x !== id);
      } else {
        state.serviciosIds.push(id);
      }
      renderServices();
      renderTotalPill();
      updateCTA();
    });
  });
}

function renderTotalPill() {
  const wrap = document.getElementById('totalPillWrap');
  if (!state.serviciosIds.length) { wrap.innerHTML = ''; return; }
  const total = state.serviciosIds.reduce((s, id) => {
    const svc = SERVICIOS.find(x => x.id === id);
    return s + (svc ? svc.precio : 0);
  }, 0);
  wrap.innerHTML = `<div class="total-pill">Total seleccionado: <strong>${fmtPrice(total)}</strong></div>`;
}

// ─── STEP 3: Carrusel de fechas ───
function initDatePicker() {
  renderDateCarousel();
}

function renderDateCarousel() {
  const carousel = document.getElementById('dateCarousel');
  carousel.innerHTML = '';

  const DAYS_ES  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const pad = n => String(n).padStart(2, '0');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let lastWeek = -1;

  // Mostrar 60 días hacia adelante, saltar domingos
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() === 0) continue;   // cerrado domingos

    // Separador entre semanas
    const weekNum = Math.floor((d - today) / (7 * 86400000));
    if (weekNum !== lastWeek && lastWeek !== -1) {
      const sep = document.createElement('div');
      sep.className = 'date-week-sep';
      carousel.appendChild(sep);
    }
    lastWeek = weekNum;

    const dateStr = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    const isSelected = state.fecha === dateStr;
    const isToday = i === 0;

    const card = document.createElement('div');
    card.className = 'date-card' + (isSelected ? ' selected' : '');
    card.dataset.date = dateStr;
    card.innerHTML = `
      <div class="date-card-day">${isToday ? 'Hoy' : DAYS_ES[d.getDay()]}</div>
      <div class="date-card-num">${d.getDate()}</div>
      <div class="date-card-month">${MONTHS_ES[d.getMonth()]}</div>
    `;

    card.addEventListener('click', () => {
      // Verificar bloqueos de día completo
      const bloqueado = BLOQUEOS.some(b => b.tipo === 'dia' && b.fecha === dateStr);
      if (bloqueado) {
        showToast('📅 Este día está cerrado');
        return;
      }
      state.fecha = dateStr;
      state.hora  = null;
      // Resaltar la card seleccionada
      carousel.querySelectorAll('.date-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      // Scroll suave para centrar la card seleccionada
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      loadTimeSlots();
      updateCTA();
    });

    carousel.appendChild(card);
  }

  // Scroll hasta la fecha ya seleccionada (si existe)
  if (state.fecha) {
    setTimeout(() => {
      const sel = carousel.querySelector('.date-card.selected');
      if (sel) sel.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      loadTimeSlots();
    }, 50);
  }
}

// Convierte "8:00 AM" / "2:30 PM" a minutos desde medianoche
function horaAMinutos(h) {
  const [time, period] = h.split(' ');
  let [hh, mm] = time.split(':').map(Number);
  if (period === 'PM' && hh !== 12) hh += 12;
  if (period === 'AM' && hh === 12) hh = 0;
  return hh * 60 + mm;
}

function loadTimeSlots() {
  const section = document.getElementById('timeSection');
  const content = document.getElementById('timeContent');
  const label   = document.getElementById('timeLabel');

  if (!state.fecha) { section.style.display = 'none'; return; }

  section.style.display = 'block';
  const d = new Date(state.fecha + 'T12:00:00');
  label.textContent = `Horarios para el ${d.toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long' })}`;

  content.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div><span>Cargando horarios...</span></div>`;

  setTimeout(() => {
    // Verificar si la fecha seleccionada es hoy
    const now     = new Date();
    const pad     = n => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
    const isToday  = state.fecha === todayStr;
    const nowMin   = now.getHours() * 60 + now.getMinutes();

    content.innerHTML = `<div class="time-grid">
      ${HORARIOS.map(h => {
        const ocupado  = OCUPADOS.includes(h);
        const pasado   = isToday && horaAMinutos(h) <= nowMin;
        const unavail  = ocupado || pasado;
        const sel      = state.hora === h;
        const cls      = unavail ? ' unavailable' : sel ? ' selected' : '';
        return `<div class="time-slot${cls}" data-time="${h}"${pasado ? ' title="Ya pasó"' : ''}>${h}</div>`;
      }).join('')}
    </div>`;

    // Si la hora que tenía seleccionada ya pasó, limpiarla
    if (state.hora && isToday && horaAMinutos(state.hora) <= nowMin) {
      state.hora = null;
    }

    content.querySelectorAll('.time-slot:not(.unavailable)').forEach(slot => {
      slot.addEventListener('click', () => {
        state.hora = slot.dataset.time;
        content.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
        slot.classList.add('selected');
        updateCTA();
        document.getElementById('scrollArea').scrollTop += 100;
      });
    });

    updateCTA();
  }, 800);
}

// ─── STEP 4: Resumen ───
function renderSummary() {
  const barbero   = BARBEROS.find(b => b.id === state.barberoId);
  const servicios = SERVICIOS.filter(s => state.serviciosIds.includes(s.id));
  const total     = servicios.reduce((s, x) => s + x.precio, 0);
  const d         = new Date(state.fecha + 'T12:00:00');
  const dateStr   = d.toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long' });

  document.getElementById('summaryCard').innerHTML = `
    <div class="summary-row"><span class="summary-key">Barbero</span><span class="summary-val">${barbero.emoji} ${barbero.nombre}</span></div>
    <div class="summary-row"><span class="summary-key">Servicios</span><span class="summary-val">${servicios.map(s => s.nombre).join(', ')}</span></div>
    <div class="summary-row"><span class="summary-key">Fecha</span><span class="summary-val">${dateStr}</span></div>
    <div class="summary-row"><span class="summary-key">Hora</span><span class="summary-val">${state.hora}</span></div>
    <div class="summary-total">
      <span class="summary-total-label">Total a pagar</span>
      <span class="summary-total-amount">${fmtPrice(total)}</span>
    </div>
  `;
}

// ─── NAVEGACIÓN ENTRE PASOS ───
const stepTitles = ['Tu cita perfecta', '¿Qué te hacemos?', 'Elige fecha y hora', 'Confirma tu reserva'];

function goToStep(s) {
  document.getElementById(`step${state.step}`).classList.remove('active');
  state.step = s;
  document.getElementById(`step${state.step}`).classList.add('active');
  document.getElementById('appTitle').textContent = stepTitles[s - 1];

  document.querySelectorAll('.step-pip').forEach((pip, i) => {
    pip.classList.toggle('active', i + 1 === s);
    pip.classList.toggle('done', i + 1 < s);
  });

  document.getElementById('backBtn').style.display = s > 1 ? 'flex' : 'none';
  document.getElementById('scrollArea').scrollTop = 0;

  if (s === 2) { renderServices(); renderTotalPill(); }
  if (s === 3) { initDatePicker(); }
  if (s === 4) { renderSummary(); }

  updateCTA();
}

function updateCTA() {
  const btn = document.getElementById('ctaBtn');
  let enabled = false;
  let label = 'Continuar';

  if (state.step === 1) enabled = !!state.barberoId;
  if (state.step === 2) enabled = state.serviciosIds.length > 0;
  if (state.step === 3) enabled = !!(state.fecha && state.hora);
  if (state.step === 4) {
    label = 'Confirmar por WhatsApp';
    btn.className = 'cta-btn cta-btn-whatsapp';
    const n = document.getElementById('inputNombre')?.value.trim();
    const t = document.getElementById('inputTel')?.value.trim();
    const c = document.getElementById('inputCedula')?.value.trim();
    enabled = !!(n && t && c);
  } else {
    btn.className = 'cta-btn cta-btn-primary';
  }

  btn.disabled = !enabled;
  btn.textContent = label;

  if (state.step === 4) {
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> Confirmar por WhatsApp`;
  }
}

// ─── ENVÍO POR WHATSAPP ───
function sendWhatsApp() {
  const barbero   = BARBEROS.find(b => b.id === state.barberoId);
  const servicios = SERVICIOS.filter(s => state.serviciosIds.includes(s.id));
  const total     = servicios.reduce((s, x) => s + x.precio, 0);
  const nombre    = document.getElementById('inputNombre').value.trim();
  const tel       = document.getElementById('inputTel').value.trim();
  const cedula    = document.getElementById('inputCedula').value.trim();
  const d         = new Date(state.fecha + 'T12:00:00');
  const dateStr   = d.toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const msg = encodeURIComponent(
`✂️ *NUEVA RESERVA – Barbería*

👤 *Cliente:* ${nombre}
📞 *Teléfono:* ${tel}
🪪 *Cédula:* ${cedula}

💈 *Barbero:* ${barbero.nombre}
✂️ *Servicios:* ${servicios.map(s => s.nombre).join(', ')}
📅 *Fecha:* ${dateStr}
⏰ *Hora:* ${state.hora}
💵 *Total:* ${fmtPrice(total)}

_Reserva generada desde el sistema WebinDev_`
  );

  // Pantalla de éxito
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('stepsProgress').style.display = 'none';
  document.getElementById('ctaBar').style.display = 'none';

  document.getElementById('successDetail').innerHTML = `
    <div class="success-detail-row"><span>Barbero</span><span>${barbero.emoji} ${barbero.nombre}</span></div>
    <div class="success-detail-row"><span>Servicios</span><span>${servicios.length} servicio${servicios.length > 1 ? 's' : ''}</span></div>
    <div class="success-detail-row"><span>Hora</span><span>${state.hora}</span></div>
    <div class="success-detail-row"><span>Total</span><span style="color:var(--gold);font-weight:700">${fmtPrice(total)}</span></div>
  `;

  document.getElementById('success-screen').classList.add('active');
  setTimeout(() => window.open(`https://wa.me/${BARBER_WHATSAPP}?text=${msg}`, '_blank'), 600);
}

// ─── EVENTOS PRINCIPALES ───
document.getElementById('ctaBtn').addEventListener('click', () => {
  if (state.step < 4) goToStep(state.step + 1);
  else sendWhatsApp();
});

document.getElementById('backBtn').addEventListener('click', () => {
  if (state.step > 1) goToStep(state.step - 1);
});

['inputNombre','inputTel','inputCedula'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', updateCTA);
});

// ══════════════════════════════════════════════════════
// ─── SISTEMA DE PANELES (Admin / Barbero) ───
// ══════════════════════════════════════════════════════

// ─── LOGIN TRIGGER (triple clic) ───
let triggerClicks = 0;
let triggerTimer  = null;
const trigger = document.getElementById('loginTrigger');

trigger.addEventListener('click', () => {
  triggerClicks++;
  trigger.style.transform = `scale(${0.85 + triggerClicks * 0.05})`;
  if (triggerClicks === 1) trigger.classList.add('lit');
  clearTimeout(triggerTimer);
  if (triggerClicks >= 3) {
    triggerClicks = 0;
    trigger.classList.remove('lit');
    trigger.style.transform = '';
    openLogin();
  } else {
    triggerTimer = setTimeout(() => {
      triggerClicks = 0;
      trigger.classList.remove('lit');
      trigger.style.transform = '';
    }, 1200);
  }
});

// ─── LOGIN ───
function setLoginRole(role) {
  loginRole = role;
  document.querySelectorAll('.login-tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && role === 'admin') || (i === 1 && role === 'barbero'));
  });
  document.getElementById('loginError').classList.remove('visible');
}

function openLogin() {
  setLoginRole('admin');
  document.getElementById('loginPass').value = '';
  document.getElementById('loginError').classList.remove('visible');
  document.getElementById('loginOverlay').classList.add('active');
  setTimeout(() => document.getElementById('loginPass').focus(), 300);
}

function closeLogin() {
  document.getElementById('loginOverlay').classList.remove('active');
}

document.getElementById('loginPass').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

function doLogin() {
  const pass = document.getElementById('loginPass').value;
  const err  = document.getElementById('loginError');
  err.classList.remove('visible');

  if (loginRole === 'admin') {
    if (pass !== CREDS.admin) { err.classList.add('visible'); return; }
    currentRole = 'admin';
    closeLogin();
    openAdminPanel();
  } else {
    const match = Object.entries(PASSWORDS_BARBERO).find(([, p]) => p === pass);
    if (!match) { err.classList.add('visible'); return; }
    currentRole      = 'barbero';
    currentBarberoId = +match[0];
    closeLogin();
    openBarberoPanel();
  }
}

function doLogout() {
  document.getElementById('panelAdmin').classList.remove('active');
  document.getElementById('panelBarbero').classList.remove('active');
  currentRole      = null;
  currentBarberoId = null;
  showToast('Sesión cerrada');
}

// ─── UTILIDADES DE PANEL ───
function setupNav(navId, prefix, contentId) {
  document.getElementById(navId).querySelectorAll('.panel-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll(`#${navId} .panel-nav-item`).forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const sec = item.dataset.sec;
      document.querySelectorAll(`#${contentId} .panel-section`).forEach(s => s.classList.remove('active'));
      document.getElementById(prefix + sec).classList.add('active');
    });
  });
}

function setupFilters(estadoWrapId, barberoWrapId) {
  document.getElementById(estadoWrapId).addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    document.querySelectorAll(`#${estadoWrapId} .filter-chip`).forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    adminFiltroE = chip.dataset.f || 'todas';
    renderAdminCitas();
  });
  if (barberoWrapId) {
    document.getElementById(barberoWrapId).addEventListener('click', e => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      document.querySelectorAll(`#${barberoWrapId} .filter-chip`).forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      adminFiltroB = +chip.dataset.b;
      renderAdminCitas();
    });
  }
}

function initHorarioSelects(ids) {
  ids.forEach(id => {
    const sel = document.getElementById(id);
    if (sel) sel.innerHTML = HORARIOS.map(h => `<option value="${h}">${h}</option>`).join('');
  });
}

// ══════════════════════════════════════════════════════
// ─── PANEL ADMIN ───
// ══════════════════════════════════════════════════════
function openAdminPanel() {
  // Poblar selects con barberos
  const sel = document.getElementById('bloqueo-barbero');
  sel.innerHTML = '<option value="0">Todos los barberos</option>' +
    BARBEROS.map(b => `<option value="${b.id}">${b.nombre}</option>`).join('');

  const bFiltro = document.getElementById('adminFiltroBarbero');
  bFiltro.innerHTML = '<button class="filter-chip active" data-b="0">Todos</button>' +
    BARBEROS.map(b => `<button class="filter-chip" data-b="${b.id}">${b.nombre}</button>`).join('');

  initHorarioSelects(['bloqueo-desde', 'bloqueo-hasta']);

  const today  = new Date();
  const pad    = n => String(n).padStart(2, '0');
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
  document.getElementById('bloqueo-fecha').min       = todayStr;
  document.getElementById('bloqueo-rango-fecha').min = todayStr;

  setupNav('adminNav', 'admin-', 'adminContent');
  setupFilters('adminFiltroEstado', 'adminFiltroBarbero');

  document.querySelectorAll('#adminContent .panel-section').forEach(s => s.classList.remove('active'));
  document.getElementById('admin-dashboard').classList.add('active');
  document.querySelectorAll('#adminNav .panel-nav-item').forEach(i => i.classList.remove('active'));
  document.querySelector('#adminNav [data-sec="dashboard"]').classList.add('active');

  renderAdminDashboard();
  renderAdminCitas();
  renderAdminBloqueos();

  document.getElementById('panelAdmin').classList.add('active');
}

function renderAdminDashboard() {
  const ranking = BARBEROS.map(b => {
    const citas = CITAS.filter(c => c.barberoId === b.id && c.estado === 'atendida').length;
    return { b, citas };
  }).sort((a, b2) => b2.citas - a.citas);

  document.getElementById('adminRanking').innerHTML = ranking.map((r, i) => `
    <div class="rank-item">
      <div class="rank-pos ${i === 0 ? 'gold' : ''}">${i + 1}</div>
      <div style="font-size:20px">${r.b.emoji}</div>
      <div class="rank-name">${r.b.nombre}</div>
      <div class="rank-count">${r.citas} citas</div>
    </div>
  `).join('');

  const today    = '2026-04-25';
  const proximas = CITAS.filter(c => c.fecha === today && (c.estado === 'pendiente' || c.estado === 'confirmada'))
    .sort((a, b2) => a.hora.localeCompare(b2.hora)).slice(0, 5);

  document.getElementById('adminProximas').innerHTML = proximas.length
    ? proximas.map(c => citaCardAdmin(c, false)).join('')
    : '<div style="color:var(--text-tertiary);font-size:14px;padding:16px 0">No hay citas próximas</div>';
}

function renderAdminCitas() {
  let lista = [...CITAS];
  if (adminFiltroE !== 'todas') lista = lista.filter(c => c.estado === adminFiltroE);
  if (adminFiltroB !== 0) lista = lista.filter(c => c.barberoId === adminFiltroB);
  lista.sort((a, b2) => b2.id - a.id);
  document.getElementById('adminCitasList').innerHTML = lista.length
    ? lista.map(c => citaCardAdmin(c, true)).join('')
    : '<div style="color:var(--text-tertiary);font-size:14px;padding:20px 0;text-align:center">No hay citas con estos filtros</div>';
}

function citaCardAdmin(c, showActions) {
  const b = BARBEROS.find(x => x.id === c.barberoId);
  const actions = showActions ? `
    <div class="cita-actions">
      ${c.estado === 'pendiente' ? `<button class="cita-btn cita-btn-confirm" onclick="cambiarEstado(${c.id},'confirmada','admin')">✓</button>` : ''}
      ${(c.estado === 'pendiente' || c.estado === 'confirmada') ? `<button class="cita-btn cita-btn-cancel" onclick="cambiarEstado(${c.id},'cancelada','admin')">✕</button>` : ''}
      ${(c.estado !== 'pendiente' && c.estado !== 'confirmada') ? statusBadge(c.estado) : ''}
    </div>` : statusBadge(c.estado);
  return `
    <div class="cita-card" id="cita-${c.id}">
      <div class="cita-hora-badge"><div class="cita-hora">${c.hora}</div></div>
      <div class="cita-info">
        <div class="cita-cliente">${c.cliente}</div>
        <div class="cita-meta">${b ? b.nombre : ''} · ${c.servicios.join(', ')} · ${fmtPrice(c.total)}</div>
      </div>
      ${actions}
    </div>`;
}

function renderAdminBloqueos() {
  document.getElementById('adminBloqueosList').innerHTML = BLOQUEOS.length
    ? BLOQUEOS.map(bl => `
      <div class="bloqueo-item" id="bl-${bl.id}">
        <div class="bloqueo-info">
          <div class="bloqueo-titulo">${bl.tipo === 'dia' ? '📅 Día completo' : '⏱ ' + bl.desde + ' – ' + bl.hasta}</div>
          <div class="bloqueo-detalle">${bl.fecha} ${bl.barberoId ? '· ' + BARBEROS.find(b => b.id === bl.barberoId)?.nombre : ''} · ${bl.motivo}</div>
        </div>
        <button class="bloqueo-del" onclick="eliminarBloqueo(${bl.id})">🗑</button>
      </div>`).join('')
    : '<div style="color:var(--text-tertiary);font-size:14px;padding:16px 0">No hay bloqueos activos</div>';
}

function agregarBloqueo(tipo) {
  if (tipo === 'dia') {
    const fecha  = document.getElementById('bloqueo-fecha').value;
    const motivo = document.getElementById('bloqueo-motivo').value.trim();
    if (!fecha || !motivo) { showToast('Completa todos los campos'); return; }
    BLOQUEOS.push({ id: Date.now(), tipo: 'dia', barberoId: 0, fecha, motivo });
    document.getElementById('bloqueo-fecha').value  = '';
    document.getElementById('bloqueo-motivo').value = '';
  } else {
    const barberoId = +document.getElementById('bloqueo-barbero').value;
    const fecha     = document.getElementById('bloqueo-rango-fecha').value;
    const desde     = document.getElementById('bloqueo-desde').value;
    const hasta     = document.getElementById('bloqueo-hasta').value;
    if (!fecha) { showToast('Completa todos los campos'); return; }
    BLOQUEOS.push({ id: Date.now(), tipo: 'rango', barberoId, fecha, desde, hasta, motivo: 'Bloqueo de horario' });
    document.getElementById('bloqueo-rango-fecha').value = '';
  }
  renderAdminBloqueos();
  showToast('✅ Bloqueo agregado');
}

function eliminarBloqueo(id) {
  BLOQUEOS = BLOQUEOS.filter(b => b.id !== id);
  renderAdminBloqueos();
  renderMisBloqueos();
  showToast('🗑 Bloqueo eliminado');
}

function cambiarEstado(citaId, nuevoEstado, panel) {
  const c = CITAS.find(x => x.id === citaId);
  if (c) c.estado = nuevoEstado;
  if (panel === 'admin') { renderAdminCitas(); renderAdminDashboard(); }
  else { renderBarberoAgenda(); renderBarberoCitas(); renderIngresosDetalle(); }
  const icons = { confirmada:'✅ Confirmada', cancelada:'❌ Cancelada', atendida:'✅ Atendida' };
  showToast(icons[nuevoEstado] || '⚠️ No show');
}

function confirmarPorWA(citaId) {
  const c = CITAS.find(x => x.id === citaId);
  if (!c) return;
  const b       = BARBEROS.find(x => x.id === c.barberoId);
  const d       = new Date(c.fecha + 'T12:00:00');
  const fechaStr = d.toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long' });
  const fechaCap = fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1);

  const msg = encodeURIComponent(
`✅ *Cita Confirmada – Barbería WebinDev*

Hola ${c.cliente} 👋, tu cita ha sido confirmada.

✂️ *Barbero:* ${b ? b.nombre : ''}
💈 *Servicios:* ${c.servicios.join(', ')}
📅 *Fecha:* ${fechaCap}
⏰ *Hora:* ${c.hora}
💵 *Total:* ${fmtPrice(c.total)}

📍 Te esperamos puntual. Si necesitas reagendar escríbenos.

_Barbería WebinDev_`
  );

  cambiarEstado(citaId, 'confirmada', 'barbero');
  const telLimpio = c.tel.replace(/\D/g, '');
  const telFinal  = telLimpio.startsWith('57') ? telLimpio : '57' + telLimpio;
  window.open(`https://wa.me/${telFinal}?text=${msg}`, '_blank');
  showToast('📲 Abriendo WhatsApp...');
}

// ══════════════════════════════════════════════════════
// ─── PANEL BARBERO ───
// ══════════════════════════════════════════════════════
function openBarberoPanel() {
  agendaDate = new Date(); // reset a hoy cada vez que se abre el panel
  const b = BARBEROS.find(x => x.id === currentBarberoId);
  document.getElementById('barberoPanelTitle').textContent = b ? b.nombre : 'Mi Panel';

  initHorarioSelects(['miBloqueo-desde', 'miBloqueo-hasta']);

  const today2   = new Date();
  const pad2     = n => String(n).padStart(2, '0');
  const todayStr2 = `${today2.getFullYear()}-${pad2(today2.getMonth()+1)}-${pad2(today2.getDate())}`;
  document.getElementById('miBloqueo-fecha').min = todayStr2;

  setupNav('barberoNav', 'barbero-', 'barberoContent');
  setupBarberoFilters();

  document.querySelectorAll('#barberoContent .panel-section').forEach(s => s.classList.remove('active'));
  document.getElementById('barbero-agenda').classList.add('active');
  document.querySelectorAll('#barberoNav .panel-nav-item').forEach(i => i.classList.remove('active'));
  document.querySelector('#barberoNav [data-sec="agenda"]').classList.add('active');

  renderBarberoAgenda();
  renderBarberoCitas();
  renderIngresosDetalle();
  renderMisBloqueos();
  setupIngresoPeriod();

  document.getElementById('panelBarbero').classList.add('active');
}

function agendaDateStr(d) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function agendaShiftDay(delta) {
  agendaDate = new Date(agendaDate.getFullYear(), agendaDate.getMonth(), agendaDate.getDate() + delta);
  renderBarberoAgenda();
}

function renderBarberoAgenda() {
  const todayStr = agendaDateStr(new Date());
  const selStr   = agendaDateStr(agendaDate);
  const isToday  = selStr === todayStr;

  const labelOpts = { weekday: 'long', day: 'numeric', month: 'short' };
  let labelFmt = agendaDate.toLocaleDateString('es-CO', labelOpts);
  labelFmt = labelFmt.charAt(0).toUpperCase() + labelFmt.slice(1);
  const label = isToday ? `Hoy · ${labelFmt}` : labelFmt;
  document.getElementById('agendaHoyLabel').textContent = label;

  const citas = CITAS.filter(c => c.barberoId === currentBarberoId && c.fecha === selStr)
    .sort((a, b2) => a.hora.localeCompare(b2.hora));

  document.getElementById('barberoAgendaList').innerHTML = citas.length
    ? citas.map(c => `
      <div class="cita-card" id="bcita-${c.id}">
        <div class="cita-hora-badge"><div class="cita-hora">${c.hora}</div></div>
        <div class="cita-info">
          <div class="cita-cliente">${c.cliente}</div>
          <div class="cita-meta">${c.servicios.join(', ')} · ${fmtPrice(c.total)}</div>
        </div>
        <div class="cita-actions">
          ${c.estado === 'pendiente' || c.estado === 'confirmada' ? `
            ${c.estado === 'pendiente' ? `<button class="cita-btn cita-btn-wa" onclick="confirmarPorWA(${c.id})" title="Confirmar por WhatsApp">💬</button>` : ''}
            <button class="cita-btn cita-btn-atend"  onclick="cambiarEstado(${c.id},'atendida','barbero')" title="Atendido">✅</button>
            <button class="cita-btn cita-btn-noshow" onclick="cambiarEstado(${c.id},'noshow','barbero')"  title="No show">❌</button>
          ` : statusBadge(c.estado)}
        </div>
      </div>`).join('')
    : '<div style="color:var(--text-tertiary);font-size:14px;padding:20px 0;text-align:center">Sin citas para este día 🎉</div>';
}

function setupBarberoFilters() {
  document.querySelectorAll('[data-bsf]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-bsf]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      barberoFiltroE = chip.dataset.bsf;
      renderBarberoCitas();
    });
  });
}

function renderBarberoCitas() {
  let lista = CITAS.filter(c => c.barberoId === currentBarberoId);
  if (barberoFiltroE !== 'todas') lista = lista.filter(c => c.estado === barberoFiltroE);
  lista.sort((a, b2) => b2.id - a.id);

  document.getElementById('barberoCitasList').innerHTML = lista.length
    ? lista.map(c => `
      <div class="cita-card">
        <div class="cita-hora-badge">
          <div class="cita-hora">${c.hora}</div>
          <div style="font-size:9px;color:var(--text-secondary)">${c.fecha.slice(5)}</div>
        </div>
        <div class="cita-info">
          <div class="cita-cliente">${c.cliente}</div>
          <div class="cita-meta">${c.servicios.join(', ')} · ${fmtPrice(c.total)}</div>
        </div>
        ${statusBadge(c.estado)}
      </div>`).join('')
    : '<div style="color:var(--text-tertiary);font-size:14px;padding:20px 0;text-align:center">Sin citas</div>';
}

function setupIngresoPeriod() {
  document.getElementById('ingresoPeriod').querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#ingresoPeriod button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      ingresoPer = btn.dataset.per;
      updateIngresosBig();
    });
  });
}

function updateIngresosBig() {
  const d = INGRESOS_DATA[ingresoPer];
  document.getElementById('ingresosBig').innerHTML = `
    <div class="ingreso-big-label">${d.label}</div>
    <div class="ingreso-big-value">${d.value}</div>
    <div class="ingreso-big-sub">${d.sub}</div>
  `;
}

function renderIngresosDetalle() {
  const atendidas = CITAS.filter(c => c.barberoId === currentBarberoId && c.estado === 'atendida');
  document.getElementById('ingresosDetalle').innerHTML = atendidas.map(c => `
    <div class="cita-card">
      <div class="cita-hora-badge"><div class="cita-hora">${c.hora}</div></div>
      <div class="cita-info">
        <div class="cita-cliente">${c.cliente}</div>
        <div class="cita-meta">${c.fecha} · ${c.servicios.join(', ')}</div>
      </div>
      <div style="font-size:15px;font-weight:700;color:var(--gold);flex-shrink:0">${fmtPrice(c.total)}</div>
    </div>`).join('')
    || '<div style="color:var(--text-tertiary);font-size:14px;padding:16px 0">Sin citas atendidas aún</div>';
}

function agregarMiBloqueo() {
  const fecha  = document.getElementById('miBloqueo-fecha').value;
  const desde  = document.getElementById('miBloqueo-desde').value;
  const hasta  = document.getElementById('miBloqueo-hasta').value;
  const motivo = document.getElementById('miBloqueo-motivo').value.trim() || 'No disponible';
  if (!fecha) { showToast('Elige una fecha'); return; }
  BLOQUEOS.push({ id: Date.now(), tipo: 'rango', barberoId: currentBarberoId, fecha, desde, hasta, motivo });
  document.getElementById('miBloqueo-fecha').value  = '';
  document.getElementById('miBloqueo-motivo').value = '';
  renderMisBloqueos();
  showToast('✅ Bloqueo registrado');
}

function renderMisBloqueos() {
  const misBl = BLOQUEOS.filter(b => b.barberoId === currentBarberoId || b.tipo === 'dia');
  document.getElementById('misBloqueosList').innerHTML = misBl.length
    ? misBl.map(bl => `
      <div class="bloqueo-item">
        <div class="bloqueo-info">
          <div class="bloqueo-titulo">${bl.tipo === 'dia' ? '📅 Día completo' : '⏱ ' + bl.desde + ' – ' + bl.hasta}</div>
          <div class="bloqueo-detalle">${bl.fecha} · ${bl.motivo}${bl.tipo === 'dia' ? ' · (Cierre general)' : ''}</div>
        </div>
        ${bl.barberoId === currentBarberoId
          ? `<button class="bloqueo-del" onclick="eliminarBloqueo(${bl.id})">🗑</button>`
          : '<span style="font-size:11px;color:var(--text-tertiary)">Admin</span>'}
      </div>`).join('')
    : '<div style="color:var(--text-tertiary);font-size:14px;padding:16px 0">Sin bloqueos activos</div>';
}

// ══════════════════════════════════════════════════════
// ─── INICIALIZACIÓN ───
// ══════════════════════════════════════════════════════
renderBarbers();
runIntro();
