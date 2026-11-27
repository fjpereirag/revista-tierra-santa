// REVISTA TIERRA SANTA · demo de rediseño (Collective) · v2 «salto de calidad»
// Entrada (el velo se rasga), banda de Jerusalén en relieve 3D, teletipo, desplazamiento suave, cursor propio,
// apariciones, abanico de la hemeroteca y tarjetas 3D de suscripciones
// (misma mecánica y números que Meta Ads de collective-ia.com y Capital Home).
import Lenis from '../vendor/lenis.mjs';
import { iniciaRelieve } from './relieve.js';
import { iniciaHemeroteca } from './hemeroteca.js';

const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
const tactil = matchMedia('(hover: none)').matches;
const raton = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const limita = (v, a, b) => Math.max(a, Math.min(b, v));
const suave = (t) => 1 - Math.pow(1 - t, 3);
const CRUZ = 'M30 8H70V18H56V44H82V30H92V70H82V56H56V82H70V92H30V82H44V56H18V70H8V30H18V44H44V18H30Z M23.6 19H28.4V23.6H33V28.4H28.4V33H23.6V28.4H19V23.6H23.6Z M71.6 19H76.4V23.6H81V28.4H76.4V33H71.6V28.4H67V23.6H71.6Z M23.6 67H28.4V71.6H33V76.4H28.4V81H23.6V76.4H19V71.6H23.6Z M71.6 67H76.4V71.6H81V76.4H76.4V81H71.6V76.4H67V71.6H71.6Z';
const CRUZ_GRANDE = 'M30 8H70V18H56V44H82V30H92V70H82V56H56V82H70V92H30V82H44V56H18V70H8V30H18V44H44V18H30Z';

/* ---------------------------------------------------------------- 0 · desplazamiento suave (solo rueda; en móvil, el del sistema) */
let lenis = null;
if (!quieto) {
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
  lenis.stop();
  const bucle = (t) => { lenis.raf(t); requestAnimationFrame(bucle); };
  requestAnimationFrame(bucle);
  document.documentElement.style.scrollBehavior = 'auto';
}
const cabAlto = () => $('.ts-cab').offsetHeight;
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href'); const destino = id.length > 1 ? $(id) : null;
  if (!destino) return;
  e.preventDefault();
  const ir = id === '#inicio' ? 0 : destino;
  lenis?.start(); // si el menú del móvil estaba abierto, Lenis seguía parado e ignoraba el salto
  if (lenis) lenis.scrollTo(ir, { offset: id === '#inicio' ? 0 : -(cabAlto() + 10), duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else destino.scrollIntoView({ behavior: quieto ? 'auto' : 'smooth' });
  history.replaceState(null, '', id);
}));

/* ---------------------------------------------------------------- 1 · banda de Jerusalén en relieve 3D */
const relieve = iniciaRelieve($('.ts-banner'), { tactil, quieto });

/* ---------------------------------------------------------------- 2 · entrada: la cruz, los años y el velo que se rasga */
(function entrada() {
  const telon = $('.ts-telon'), anio = $('[data-anio]');
  let hecho = false;
  const abre = () => {
    telon.classList.add('es-fuera');
    document.body.classList.remove('ts-cargando');
    document.body.classList.add('ts-listo');
    lenis?.start();
    relieve.then((r) => r?.entra());
    setTimeout(() => telon.classList.add('es-oculto'), 1400);
  };
  const fin = (rapido = false) => {
    if (hecho) return; hecho = true;
    if (quieto || rapido) { abre(); return; }
    telon.classList.add('es-rasga');
    setTimeout(abre, 620);
  };
  if (quieto) { anio.textContent = new Date().getFullYear(); fin(true); return; }
  const desde = 1921, hasta = new Date().getFullYear(), t0 = performance.now(), dura = 1400;
  const corre = (t) => {
    const k = limita((t - t0 - 150) / dura, 0, 1);
    anio.textContent = Math.round(desde + (hasta - desde) * suave(k));
    telon.style.setProperty('--carga', suave(k).toFixed(3));
    if (k < 1) requestAnimationFrame(corre); else setTimeout(fin, 300);
  };
  requestAnimationFrame(corre);
  telon.addEventListener('click', () => fin());
  setTimeout(() => fin(), 3400);   // por si el navegador congela los fotogramas (pestaña oculta)
})();

/* ---------------------------------------------------------------- 3 · cabecera, barra de lectura y menú */
(function cabecera() {
  const cab = $('.ts-cab'); let ultimo = scrollY;
  const mira = () => {
    const y = scrollY;
    cab.classList.toggle('es-bajado', y > 8);
    cab.classList.toggle('es-escondido', y > 420 && y > ultimo + 2 && !document.body.classList.contains('ts-menu-abierto'));
    if (y < ultimo - 2) cab.classList.remove('es-escondido');
    ultimo = y;
    cab.style.setProperty('--progreso', (y / Math.max(1, document.documentElement.scrollHeight - innerHeight)).toFixed(4));
  };
  addEventListener('scroll', mira, { passive: true }); mira();

  const enlaces = $$('.ts-menu a');
  const secciones = [...enlaces.map((a) => $(a.getAttribute('href'))), $('#suscripciones')].filter(Boolean);
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const id = scrollY < innerHeight * 0.35 ? 'inicio' : e.target.id;
    enlaces.forEach((a) => a.classList.toggle('es-actual', a.getAttribute('href') === '#' + id));
    $('.ts-cab__sus').classList.toggle('es-actual', id === 'suscripciones');
  }), { rootMargin: '-45% 0px -50% 0px' });
  secciones.forEach((s) => io.observe(s));

  const hamb = $('.ts-hamb'), cort = $('.ts-cortinilla');
  const abre = (si) => {
    hamb.setAttribute('aria-expanded', si); document.body.classList.toggle('ts-menu-abierto', si);
    if (si) { lenis?.stop(); cort.hidden = false; requestAnimationFrame(() => cort.classList.add('es-abierta')); }
    else { lenis?.start(); cort.classList.remove('es-abierta'); setTimeout(() => { if (!cort.classList.contains('es-abierta')) cort.hidden = true; }, 700); }
  };
  hamb.addEventListener('click', () => abre(hamb.getAttribute('aria-expanded') !== 'true'));
  $$('a', cort).forEach((a) => a.addEventListener('click', () => abre(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && hamb.getAttribute('aria-expanded') === 'true') { abre(false); hamb.focus(); } });
})();

/* ---------------------------------------------------------------- 4 · teletipo de titulares (se acelera con el scroll) */
(function teletipo() {
  const pista = $('.ts-teletipo__pista'), cinta = $('.ts-teletipo__cinta'); if (!cinta) return;
  const original = cinta.innerHTML;
  const nOrig = (() => { const t = document.createElement('div'); t.innerHTML = original; return t.children.length; })();
  const marcaCopias = () => { [...cinta.children].forEach((el, i) => { const copia = i >= nOrig; el.toggleAttribute('aria-hidden', copia); (el.matches('a') ? [el] : $$('a', el)).forEach((x) => { if (copia) x.tabIndex = -1; else x.removeAttribute('tabindex'); }); }); };
  const rellena = () => { cinta.innerHTML = original; const w = cinta.scrollWidth; let veces = 1; while (cinta.scrollWidth < pista.clientWidth + w && veces < 6) { cinta.insertAdjacentHTML('beforeend', original); veces++; } cinta.insertAdjacentHTML('beforeend', original); marcaCopias(); return w; };
  let ancho = rellena(), x = 0, encima = false, ultimo = performance.now();
  pista.addEventListener('pointerenter', () => { encima = true; }); pista.addEventListener('pointerleave', () => { encima = false; });
  addEventListener('resize', () => { ancho = rellena(); });
  let vel = 0;
  const paso = (t) => {
    requestAnimationFrame(paso);
    const dt = Math.min(0.05, (t - ultimo) / 1000); ultimo = t;
    if (quieto) return;
    const extra = lenis ? Math.min(Math.abs(lenis.velocity) * 14, 420) : 0;
    vel += ((encima ? 0 : 52 + extra) - vel) * 0.08;
    x -= vel * dt; if (x <= -ancho) x += ancho;
    cinta.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
  };
  requestAnimationFrame(paso);
})();

/* ---------------------------------------------------------------- 5 · apariciones */
(function apariciones() {
  $$('[data-palabras]').forEach((el) => {
    const palabras = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    palabras.forEach((p, i) => {
      const w = document.createElement('span'); w.className = 'ts-palabra';
      const d = document.createElement('span'); d.textContent = p; d.style.transitionDelay = `${i * 70}ms`;
      w.append(d); el.append(w); if (i < palabras.length - 1) el.append(' ');
    });
  });
  const objetivos = $$('.ts-entra, .ts-cortina, [data-palabras], .ts-titulo-linea, .ts-huella');
  if (quieto) { objetivos.forEach((e) => e.classList.add('es-dentro')); return; }
  $$('.ts-destacadas, .ts-breves, .ts-quienes__texto').forEach((g) => $$(':scope > .ts-entra', g).forEach((e, i) => { e.style.transitionDelay = `${i * 90}ms`; }));
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('es-dentro'); io.unobserve(e.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  const empieza = () => objetivos.forEach((e) => io.observe(e));
  if (document.body.classList.contains('ts-listo')) empieza();
  else new MutationObserver((m, o) => { if (document.body.classList.contains('ts-listo')) { o.disconnect(); setTimeout(empieza, 350); } }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();

/* ---------------------------------------------------------------- 6 · paralajes ligados al scroll */
(function paralajes() {
  if (quieto) return;
  const banda = $('.ts-banner__foto'), bandaSec = $('.ts-banner');
  const foto = $('[data-paralaje]'), huella = $('.ts-huella'), cruzP = $('.ts-pie__cruz');
  const horizonte = $('.ts-pie__horizonte'), firma = $('.ts-pie__firma'), final = $('.ts-pie__final');
  let pendiente = false;
  const pinta = () => {
    pendiente = false;
    const vh = innerHeight;
    const rb = bandaSec.getBoundingClientRect();
    if (rb.bottom > 0 && !bandaSec.classList.contains('ts-banner--3d')) banda.style.transform = `translate3d(0, ${(-rb.top * 0.28).toFixed(1)}px, 0)`;
    if (foto) { const r = foto.getBoundingClientRect(); if (r.bottom > 0 && r.top < vh) { const k = (r.top + r.height / 2 - vh / 2) / vh; foto.style.setProperty('--py', `${(-6 + k * 8).toFixed(2)}%`); } }
    if (huella) { const r = huella.getBoundingClientRect(); if (r.bottom > 0 && r.top < vh) huella.style.setProperty('--giro', `${((r.top - vh / 2) * -0.06).toFixed(2)}deg`); }
    if (cruzP) { const r = cruzP.getBoundingClientRect(); if (r.top < vh) cruzP.style.setProperty('--giro', `${limita((r.top - vh * 0.85) * 0.25, 0, 45).toFixed(2)}deg`); }
    if (final) { const r = final.getBoundingClientRect(); const k = limita((vh - r.top) / Math.max(1, r.height + 40), 0, 1);
      horizonte.style.setProperty('--sube', `${((1 - suave(k)) * 45).toFixed(2)}%`); firma.style.setProperty('--sube2', `${((1 - suave(k)) * 60).toFixed(2)}%`); }
  };
  addEventListener('scroll', () => { if (!pendiente) { pendiente = true; requestAnimationFrame(pinta); } }, { passive: true });
  addEventListener('resize', pinta); pinta();
})();

/* ---------------------------------------------------------------- 7 · noticias breves que se inclinan con el ratón */
(function inclina() {
  if (tactil || quieto) return;
  $$('[data-inclina]').forEach((card) => {
    const a = $('a', card), brillo = $('.ts-brillo', card);
    card.addEventListener('pointermove', (e) => {
      const r = a.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      a.style.setProperty('--ry', `${((x - 0.5) * 10).toFixed(2)}deg`); a.style.setProperty('--rx', `${((0.5 - y) * 8).toFixed(2)}deg`);
      brillo.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`); brillo.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
    });
    card.addEventListener('pointerleave', () => { a.style.setProperty('--rx', '0deg'); a.style.setProperty('--ry', '0deg'); });
  });
})();

/* ---------------------------------------------------------------- 8b · HEMEROTECA: la estantería con los 819 números */
if ($('.ts-est')) iniciaHemeroteca($('.ts-est'), { quieto, lenis });

/* ---------------------------------------------------------------- 9 · SUSCRIPCIONES: tarjetas 3D que giran con el scroll */
(function suscripciones() {
  const sec = $('.ts-sus'); if (!sec) return;
  const escena = $('.tsk', sec), vp = $('.tsk__vp', sec);
  const tarjetas = $$('.tsk__card', sec), n = tarjetas.length;
  const textos = $$('.ts-sus__lista li', sec), botones = $$('.ts-sus__selector button', sec), pista = $('.ts-sus__pista', sec);
  if (pista && tactil) pista.textContent = 'Toca la tarjeta para darle la vuelta';
  const estrecho = matchMedia('(max-width: 760px)');

  // cada tarjeta = dorso (billete del sorteo) + 3 capas de canto dorado + cara de socio + la revista flotando por delante
  const GROSOR = [-1.47, -0.73, 0, 0.73, 1.47];
  tarjetas.forEach((card) => {
    const f = $('.tsk__f', card), b = $('.tsk__b', card), revista = $('.tsk__revista', f);
    f.className = 'tsk__l tsk__face tsk__f'; f.style.transform = `translateZ(${GROSOR[4]}px)`;
    f.insertAdjacentHTML('afterbegin', '<i class="tsk__sombra"></i>');
    b.className = 'tsk__l tsk__face tsk__b'; b.style.transform = `translateZ(${GROSOR[0]}px) rotateX(180deg)`;
    b.insertAdjacentHTML('afterbegin', `<svg class="tsk__marca" viewBox="0 0 100 100"><path d="${CRUZ}"/></svg><i class="tsk__brillo"></i>`);
    const pop = document.createElement('div'); pop.className = 'tsk__l tsk__pop'; pop.style.transform = 'translateZ(26px)'; pop.append(revista);
    const mids = GROSOR.slice(1, 4).map((z) => { const m = document.createElement('div'); m.className = 'tsk__l tsk__mid'; m.style.transform = `translateZ(${z}px)`; return m; });
    card.replaceChildren(b, ...mids, f, pop);
  });

  let cardH = 211;
  function mide() {
    const w = innerWidth, hh = innerHeight, ancho = 0.56;
    let cw = Math.round((w * 0.19 + 140) * Math.min(1, Math.max(0.65, hh / 850)));
    cw = Math.min(460, Math.max(150, cw));
    cw = estrecho.matches ? Math.min(Math.round(w * 0.64), Math.round(escena.clientHeight * 0.62 * 1.5925), 320) : Math.max(150, Math.min(cw, Math.floor(w * ancho / 1.5)));
    cardH = Math.round(cw / 1.5925);
    vp.style.width = cw + 'px'; vp.style.height = cardH + 'px'; vp.style.fontSize = (cw / 21).toFixed(2) + 'px';
  }
  let volteo = 0, volteoMeta = 0;
  function gira(p, mx = 0, my = 0) {
    if (estrecho.matches || tactil) { const t = performance.now(); mx = 0.42 * Math.sin(t / 1900); my = 0.3 * Math.cos(t / 2600); }   // sin ratón: la tarjeta se mece sola
    const hh = escena.clientHeight || innerHeight;
    vp.style.setProperty('--gx', (50 - mx * 46 - my * 12).toFixed(1) + '%'); vp.style.setProperty('--gy', (50 - my * 40 + mx * 10).toFixed(1) + '%');
    const cur = Math.round(p);
    for (let i = 0; i < n; i++) {
      const card = tarjetas[i];
      const off = i - p;
      const a = Math.abs(off), sg = Math.sign(off);
      if (a > 3) { card.style.visibility = 'hidden'; continue; } card.style.visibility = 'visible';
      const gap = 36, asoma = -55, D = 1350; let y, z, rot;
      if (a <= 1) { const e = a * a * (3 - 2 * a); y = -sg * e * (cardH + gap); z = 400 + e * (220 - 400); rot = e * 132; }
      else if (a <= 2) { const t = a - 1, e = t * t * (3 - 2 * t), y0 = cardH + gap, y1 = (hh / 2 - asoma) / (D / (D + 60)) - cardH / 2;
        y = -sg * (y0 + e * (y1 - y0)); z = 220 + e * (-60 - 220); rot = 132 + e * (175 - 132); }
      else { const t = Math.min(a - 2, 1), e = t * t * (3 - 2 * t), y2 = (hh / 2 - asoma) / (D / (D + 60)) - cardH / 2, y3 = (hh / 2 + 100) / (D / (D + 250)) + cardH / 2;
        y = -sg * (y2 + e * (y3 - y2)); z = -60 + e * (-250 + 60); rot = 175 + e * (195 - 175); }
      // la tarjeta del centro se da la vuelta al pincharla (sobre el eje X, como al hacer scroll, para que el dorso salga derecho)
      const vu = i === cur ? volteo : 0; if (vu) z += Math.sin(Math.PI * vu) * 90;
      const cf = Math.max(0, 1 - a), rX = -sg * rot - my * 12 * cf + 180 * vu, rY = mx * 15 * cf * (1 - 2 * vu);
      const rev = Math.cos(rX * Math.PI / 180) < 0;
      if (card._rev !== rev) { card._rev = rev; card.classList.toggle('rev', rev); }
      card.style.zIndex = Math.round(z);
      card.style.transform = `translateY(${y.toFixed(2)}px) translateZ(${z.toFixed(2)}px) rotateX(${rX.toFixed(2)}deg) rotateY(${rY.toFixed(2)}deg) rotateZ(-3deg)`;
    }
  }

  const cuenta = (li) => {
    const s = $('[data-precio]', li), meta = +s.dataset.precio;
    if (quieto) { s.textContent = meta; return; }
    const t0 = performance.now();
    const f = (t) => { const k = limita((t - t0) / 900, 0, 1); s.textContent = Math.round(meta * suave(k)); if (k < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  };

  let ps = 0, act = -1, ox = 0, oy = 0, rx = 0, ry = 0;
  sec.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { ox = e.clientX / innerWidth - 0.5; oy = e.clientY / innerHeight - 0.5; } }, { passive: true });
  escena.addEventListener('click', () => { volteoMeta = volteoMeta > 0.5 ? 0 : 1; pista?.classList.add('es-usada'); });
  // selector de abajo: salta a cada suscripción (lleva el scroll hasta su sitio)
  botones.forEach((b, k) => b.addEventListener('click', () => {
    const y = sec.getBoundingClientRect().top + scrollY + (k / (n - 1)) * (sec.offsetHeight - innerHeight) + 1;
    if (lenis) lenis.scrollTo(y, { duration: 1.3, easing: (t) => 1 - Math.pow(1 - t, 4) }); else scrollTo({ top: y, behavior: quieto ? 'auto' : 'smooth' });
  }));
  addEventListener('resize', mide);
  const paso = () => {
    requestAnimationFrame(paso);
    const r = sec.getBoundingClientRect(); if (r.bottom < -200 || r.top > innerHeight + 200) return;
    const meta = limita(-r.top / Math.max(1, r.height - innerHeight), 0, 1) * (n - 1);
    ps += (meta - ps) * (quieto ? 1 : 0.12); if (Math.abs(meta - ps) < 0.0005) ps = meta;
    rx += (ox - rx) * 0.07; ry += (oy - ry) * 0.07;
    gira(ps, rx * 2, ry * 2);
    botones.forEach((b, k) => b.style.setProperty('--f', limita(1 - Math.abs(ps - k), 0, 1).toFixed(3)));
    volteo += (volteoMeta - volteo) * (quieto ? 1 : 0.09); if (Math.abs(volteoMeta - volteo) < 0.001) volteo = volteoMeta;
    const i = Math.round(ps);
    if (i !== act) {
      act = i;
      textos.forEach((li, j) => { li.classList.toggle('es-actual', j === i); li.classList.toggle('es-antes', j < i); });
      botones.forEach((b, k) => { b.classList.toggle('es-actual', k === i); b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      sec.dataset.tono = tarjetas[i].dataset.tono; volteoMeta = 0;
      if (r.top < innerHeight * 0.6) cuenta(textos[i]);
    }
  };
  mide(); gira(0); requestAnimationFrame(paso);
})();

/* ---------------------------------------------------------------- 10 · cursor propio y botones magnéticos (solo con ratón) */
(function cursor() {
  if (!raton || quieto) return;
  const c = document.createElement('div'); c.className = 'ts-cursor'; c.setAttribute('aria-hidden', 'true');
  c.innerHTML = '<i class="ts-cursor__aro"><span></span></i><i class="ts-cursor__punto"></i>';
  document.body.append(c);
  const aro = $('.ts-cursor__aro', c), punto = $('.ts-cursor__punto', c), etiqueta = $('span', aro);
  const oscuros = $$('.ts-sus, .ts-pie, .ts-teletipo');
  let x = innerWidth / 2, y = innerHeight / 2, ax = x, ay = y, primero = true;
  const mira = (objetivo) => {
    const sobre = objetivo?.closest?.('[data-cursor]');
    const enlace = !sobre && objetivo?.closest?.('a, button');
    c.classList.toggle('es-etiqueta', !!sobre); c.classList.toggle('es-enlace', !!enlace);
    if (sobre) etiqueta.textContent = sobre.dataset.cursor;
    c.classList.toggle('es-oscuro', oscuros.some((o) => { const r = o.getBoundingClientRect(); return y >= r.top && y <= r.bottom; }));
  };
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (primero) { ax = x; ay = y; primero = false; document.documentElement.classList.add('ts-con-cursor'); }
    mira(e.target);
  }, { passive: true });
  // al hacer scroll lo que hay bajo el ratón cambia sin que el ratón se mueva
  let pend = false;
  addEventListener('scroll', () => { if (primero || pend) return; pend = true; requestAnimationFrame(() => { pend = false; mira(document.elementFromPoint(x, y)); }); }, { passive: true });
  addEventListener('pointerdown', () => c.classList.add('es-pulsa')); addEventListener('pointerup', () => c.classList.remove('es-pulsa'));
  document.addEventListener('pointerleave', () => { c.style.opacity = '0'; }); document.addEventListener('pointerenter', () => { c.style.opacity = ''; });
  const paso = () => {
    requestAnimationFrame(paso);
    ax += (x - ax) * 0.18; ay += (y - ay) * 0.18;
    aro.style.transform = `translate3d(${ax.toFixed(1)}px, ${ay.toFixed(1)}px, 0)`;
    punto.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };
  requestAnimationFrame(paso);

  // botones que se acercan al ratón
  $$('.ts-boton, .ts-redes a, .ts-abanico__mando button').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      b.style.setProperty('--mx', `${(dx * 0.22).toFixed(1)}px`); b.style.setProperty('--my', `${(dy * 0.32).toFixed(1)}px`);
    });
    b.addEventListener('pointerleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
  });
})();

/* ---------------------------------------------------------------- 11 · copiar el IBAN */
$$('[data-copiar]').forEach((b) => b.addEventListener('click', async () => {
  const txt = b.dataset.copiar.replace(/\s/g, ''), et = $('span', b);
  try { await navigator.clipboard.writeText(txt); } catch { const t = document.createElement('textarea'); t.value = txt; document.body.append(t); t.select(); document.execCommand('copy'); t.remove(); }
  b.classList.add('es-copiado'); et.textContent = 'IBAN copiado';
  setTimeout(() => { b.classList.remove('es-copiado'); et.textContent = 'Copiar IBAN'; }, 2200);
}));

/* ---------------------------------------------------------------- formulario «Contacta con nosotros» (27/11)
   Su web envía el formulario a su servidor; aquí no hay servidor, así que se abre el correo del visitante
   con el mensaje ya escrito para la Redacción. */
(function contacto() {
  const f = $('.ts-form'); if (!f) return;
  const aviso = $('.ts-form__aviso', f), cuenta = $('[data-cuenta]', f), msg = f.mensaje;
  msg.addEventListener('input', () => { cuenta.textContent = msg.value.length; });
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    $$('[aria-invalid]', f).forEach((el) => el.removeAttribute('aria-invalid'));
    const mal = (el, texto) => { el.setAttribute('aria-invalid', 'true'); el.focus(); aviso.className = 'ts-form__aviso'; aviso.textContent = texto; };
    const v = (n) => f[n].value.trim();
    if (!v('nombre')) return mal(f.nombre, 'Escribe tu nombre.');
    if (!f.email.checkValidity() || !v('email')) return mal(f.email, 'Escribe un email válido.');
    if (v('email').toLowerCase() !== v('email2').toLowerCase()) return mal(f.email2, 'Los dos emails no coinciden.');
    if (!v('asunto')) return mal(f.asunto, 'Escribe el asunto.');
    if (!v('mensaje')) return mal(f.mensaje, 'Escribe tu mensaje.');
    if (!f.consiento.checked) return mal(f.consiento, 'Debes aceptar el tratamiento de protección de datos.');
    const cuerpo = `${v('mensaje')}\n\n— ${[v('nombre'), v('apellidos')].filter(Boolean).join(' ')}\n${v('email')}`;
    location.href = `mailto:direccion@revistatierrasanta.com?subject=${encodeURIComponent(v('asunto'))}&body=${encodeURIComponent(cuerpo)}`;
    aviso.className = 'ts-form__aviso es-ok'; aviso.textContent = 'Se ha abierto tu programa de correo con el mensaje. Solo falta pulsar «Enviar» allí.';
  });
})();
