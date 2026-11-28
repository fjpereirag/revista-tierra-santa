// TIERRA SANTA · Hemeroteca como estantería 3D
// Misma mecánica que «La estantería para emprender» de Collective (lomos en fila, el elegido gira y enseña la portada,
// pestañas, rótulo que cambia), con los 819 números reales de su hemeroteca. Cada portada lleva a la página oficial de ese número.
// Solo existen en la página los ~40 lomos que se ven: se reciclan al girar (con 819 no se pueden pintar todos).
import { REVISTAS } from './hemeroteca-datos.js';
import { t, meses } from './idioma.js';
const IMG = (ruta) => new URL('../' + ruta, import.meta.url).href;   // las portadas, también desde en/, it/, pt-br/

// Año de cada revista para la línea de tiempo. Si su nombre trae el año (71 números) se usa ese; si no, se calcula
// entre puntos conocidos: mensual desde el nº 1 (enero 1921), pausa 1941–1945, bimestral después, y el primer número
// de cada década según su propio filtro. Es solo para moverse: el rótulo marca «≈» cuando el año es calculado.
const PUNTOS = [[1, 1921], [229, 1940], [234, 1946], [235, 1947], [253, 1950], [372, 1960], [491, 1970], [606, 1980],
  [682, 1990], [742, 2000], [802, 2010], [820, 2013], [862, 2020], [898, 2026]];
const anioDe = (n) => {
  for (let k = 0; k < PUNTOS.length - 1; k++) {
    const [n0, y0] = PUNTOS[k], [n1, y1] = PUNTOS[k + 1];
    if (n < n1) return Math.floor(y0 + ((n - n0) * (y1 - y0)) / (n1 - n0));
  }
  return PUNTOS[PUNTOS.length - 1][1];
};
REVISTAS.forEach((r) => { const m = (r.p || '').match(/(19|20)\d\d/); r.y = m ? +m[0] : Math.max(r.d, Math.min(r.d + 9, anioDe(r.n))); r.yx = !!m; });
const Y0 = 1921, Y1 = Math.max(...REVISTAS.map((r) => r.y));
let LISTA = REVISTAS, N = LISTA.length;   // LISTA cambia al filtrar por idioma
const CRUZ = 'M30 8H70V18H56V44H82V30H92V70H82V56H56V82H70V92H30V82H44V56H18V70H8V30H18V44H44V18H30Z M23.6 19H28.4V23.6H33V28.4H28.4V33H23.6V28.4H19V23.6H23.6Z M71.6 19H76.4V23.6H81V28.4H76.4V33H71.6V28.4H67V23.6H71.6Z M23.6 67H28.4V71.6H33V76.4H28.4V81H23.6V76.4H19V71.6H23.6Z M71.6 67H76.4V71.6H81V76.4H76.4V81H71.6V76.4H67V71.6H71.6Z';
const BASE = 'https://revistatierrasanta.com/revistas/';
const mod = (n, m) => ((n % m) + m) % m;
const limita = (x, a, b) => Math.max(a, Math.min(b, x));
const suave = (x) => { x = limita(x, 0, 1); return x * x * (3 - 2 * x); };
const pos = (i) => `${String(i + 1).padStart(3, '0')} / ${N}`;
const titulo = (r) => t('Revista nº {n}', { n: r.l.replace(/-/g, '\u2011') });   // guion que no parte la línea (números dobles)
const cuando = (r) => meses(r.p) || t('Década de {d}', { d: r.d });

export function iniciaHemeroteca(sec, { quieto = false, lenis = null } = {}) {
  const $ = (s) => sec.querySelector(s);
  const balda = $('.ts-est__balda'), escena = $('.ts-est__escena'), abrir = $('.ts-est__abrir');
  let H = 0, ws = 0, d = 0, gap = 0, W = 0, cy = 0;
  let s = 0, T = 0, activo = -1, hover = null, mx = -999, my = -999, tiltX = 0, tiltY = 0, sobrePortada = false;
  let arrastra = false, movido = false, x0 = 0, T0 = 0, puntero = null, rueda = 0, ultimo = performance.now(), visible = false, entrada = false;
  const vivos = new Map(), libres = [];
  let ciclo = true;   // con pocas revistas (al filtrar) no se repiten en bucle

  /* ---------- línea de tiempo 1921 → hoy: tocar o arrastrar para elegir un año (sustituye a las pestañas de décadas) ---------- */
  const linea = $('.ts-linea'), riel = linea.querySelector('.ts-linea__riel'), marca = linea.querySelector('.ts-linea__marca');
  const pct = (y) => ((y - Y0) / (Y1 - Y0)) * 100;
  const anios = [];
  for (let y = Y0; y <= Y1; y++) {
    const i = document.createElement('i'); i.className = 'ts-linea__anio' + (y % 10 === 0 ? ' es-decada' : ''); i.style.left = pct(y) + '%'; i.dataset.y = y;
    if (y % 10 === 0 || y === Y0) { const b = document.createElement('b'); b.textContent = y; i.append(b); }
    riel.append(i); anios.push(i);
  }
  linea.setAttribute('aria-valuemin', Y0); linea.setAttribute('aria-valuemax', Y1);
  const marcaVacios = () => { const hay = new Set(LISTA.map((r) => r.y)); anios.forEach((i) => i.classList.toggle('es-vacio', !hay.has(+i.dataset.y))); };
  marcaVacios();
  const ponMarca = (y, aprox) => {
    marca.style.left = pct(y) + '%'; marca.querySelector('b').textContent = (aprox ? '≈ ' : '') + y;
    linea.setAttribute('aria-valuenow', y); linea.setAttribute('aria-valuetext', (aprox ? '≈ ' : '') + y);
  };
  // la revista de ese año (la primera del año); si no hay, la del año más cercano
  const vaAlAnio = (y) => {
    let mejor = -1, dist = 1e9;
    LISTA.forEach((r, i) => { const dd = Math.abs(r.y - y) * 1000 + (r.y === y ? r.n / 1e4 : 0.5); if (dd < dist) { dist = dd; mejor = i; } });
    if (mejor >= 0) T = ciclo ? cercano(mejor) : mejor;
  };
  let arrastraLinea = false;
  const anioEn = (x) => { const r = riel.getBoundingClientRect(); return Math.round(Y0 + Math.max(0, Math.min(1, (x - r.left) / r.width)) * (Y1 - Y0)); };
  linea.addEventListener('pointerdown', (e) => { arrastraLinea = true; linea.setPointerCapture(e.pointerId); linea.classList.add('es-arrastre'); const y = anioEn(e.clientX); ponMarca(y, false); vaAlAnio(y); });
  linea.addEventListener('pointermove', (e) => { if (!arrastraLinea) return; const y = anioEn(e.clientX); if (+linea.getAttribute('aria-valuenow') !== y) { ponMarca(y, false); vaAlAnio(y); } });
  const sueltaLinea = () => { arrastraLinea = false; linea.classList.remove('es-arrastre'); };
  linea.addEventListener('pointerup', sueltaLinea); linea.addEventListener('pointercancel', sueltaLinea);
  linea.addEventListener('keydown', (e) => {
    const paso = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -10, PageUp: 10 }[e.key];
    if (!paso && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault(); e.stopPropagation();
    const y0 = +linea.getAttribute('aria-valuenow') || Y1, y = e.key === 'Home' ? Y0 : e.key === 'End' ? Y1 : Math.max(Y0, Math.min(Y1, y0 + paso));
    ponMarca(y, false); vaAlAnio(y);
  });
  const pestanas = () => { if (!arrastraLinea && LISTA[activo]) ponMarca(LISTA[activo].y, !LISTA[activo].yx); };

  /* ---------- un lomo (se recicla) ---------- */
  function crea() {
    // lomo y portada van como piezas hermanas dentro de la escena (y no una dentro de otra): Safari no pinta
    // las caras anidadas en un elemento girado en 3D. Cada fotograma se les da el mismo giro de la revista.
    const lomo = document.createElement('div'); lomo.className = 'ts-cara ts-lomo';
    lomo.innerHTML = `<div class="ts-lomo__dentro"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="${CRUZ}"/></svg><span class="ts-lomo__regla"></span><span class="ts-lomo__marca">Tierra Santa</span><span class="ts-lomo__regla"></span><span class="ts-lomo__num"></span></div>`;
    const tapa = document.createElement('div'); tapa.className = 'ts-cara ts-tapa';
    tapa.innerHTML = `<div class="ts-tapa__diseno"><span>Revista</span><b>Tierra Santa</b><i></i></div><img alt="" decoding="async">`;
    escena.append(lomo, tapa);
    const o = { lomo, tapa, img: tapa.querySelector('img'), num: lomo.querySelector('.ts-lomo__num'), diseno: tapa.querySelector('.ts-tapa__diseno i'), v: 0, i: -1, alza: 0, cargada: false };
    o.img.addEventListener('load', () => o.img.classList.add('es-lista'));
    [lomo, tapa].forEach((x) => {
      x.addEventListener('pointerenter', () => { hover = o; });
      x.addEventListener('pointerleave', () => { if (hover === o) hover = null; });
      x.addEventListener('click', () => { if (movido) return; const r = o.v - s; if (Math.abs(r) < 0.5) abre(); else T = Math.round(T + r); });
    });
    return o;
  }
  function asigna(o, v) {
    o.v = v; const i = mod(v, N); if (o.i === i) return;
    o.i = i; const r = LISTA[i];
    o.lomo.style.setProperty('--c', r.c); o.tapa.style.setProperty('--c', r.c); o.lomo.classList.toggle('es-claro', !r.t);
    o.num.textContent = r.l; o.diseno.textContent = t('Nº {n}', { n: r.l });
    o.img.classList.remove('es-lista'); o.img.removeAttribute('src'); o.cargada = false;
    o.tapa.classList.toggle('sin-portada', !r.i);
  }

  /* ---------- medidas ---------- */
  function mide() {
    const estrecho = innerWidth <= 767;
    W = sec.clientWidth; const alto = sec.clientHeight;
    H = estrecho ? Math.min(W * 0.63, alto * 0.39) : Math.min(alto * 0.46, W * 0.32);
    ws = H * 0.115; d = H * 0.72; gap = H * 0.022; cy = alto / 2;
    sec.style.setProperty('--H', `${H}px`); sec.style.setProperty('--ws', `${ws}px`); sec.style.setProperty('--d', `${d}px`);
  }
  const F = (r) => { const B = Math.abs(r) < 1 ? (r + Math.sin(Math.PI * r) / Math.PI) / 2 : Math.sign(r) * 0.5; return r * (ws + gap) + (d - ws + 1.6 * gap) * B; };
  const cercano = (i) => { const b = Math.round(T / N) * N + i; return [b - N, b, b + N].reduce((a, c) => (Math.abs(c - T) < Math.abs(a - T) ? c : a)); };

  /* ---------- rótulo que cambia ---------- */
  const cambia = (caja, texto, dir, ya) => {
    const viejos = [...caja.children]; const sp = document.createElement('span'); sp.textContent = texto; caja.append(sp);
    if (ya || quieto) { viejos.forEach((x) => x.remove()); return; }
    sp.animate([{ transform: `translateY(${dir * 110}%)` }, { transform: 'translateY(0)' }], { duration: 620, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' });
    viejos.forEach((x) => { x.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${-dir * 110}%)` }], { duration: 620, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' }).onfinish = () => x.remove(); });
  };
  const rotulo = (i, dir, ya = false) => {
    activo = i; const r = LISTA[i];
    cambia($('.ts-est__nombre'), titulo(r), dir, ya);
    cambia($('.ts-est__cuando'), cuando(r), dir, ya);
    cambia($('.ts-est__meta'), `${r.p ? t('Década de {d}', { d: r.d }) + ' · ' : ''}${pos(i)}`, dir, ya);
    const cta = $('.ts-est__leer'); cta.href = BASE + r.s + '/'; cta.setAttribute('aria-label', t('Leer la {t} completa en su web (se abre en otra pestaña)', { t: titulo(r) }));
    pestanas();
  };

  /* ---------- cada fotograma ---------- */
  function fotograma(ahora) {
    requestAnimationFrame(fotograma);
    const dt = Math.min((ahora - ultimo) / 1000, 0.05); ultimo = ahora;
    if (!visible) return;
    {
      const k = quieto ? 1000 : arrastra ? 18 : 5.2;
      s += (T - s) * (1 - Math.exp(-k * dt)); if (Math.abs(T - s) < 0.0001) s = T;
      if (!ciclo) T = Math.max(0, Math.min(N - 1, T));
      if (ciclo && Math.abs(s) > N * 4) { const c = Math.trunc(s / N) * N; s -= c; T -= c; }
      const i = mod(Math.round(s), N); if (i !== activo) rotulo(i, Math.sign(T - s) || 1);
    }
    // qué lomos hacen falta (y reciclar los que salen)
    const R = Math.ceil((W / 2 + d * 1.4) / (ws + gap)) + 2;
    let v0 = Math.floor(s) - R, v1 = Math.ceil(s) + R;
    if (!ciclo) { v0 = Math.max(v0, 0); v1 = Math.min(v1, N - 1); }
    for (const [v, o] of vivos) if (v < v0 || v > v1) { vivos.delete(v); o.lomo.style.visibility = o.tapa.style.visibility = 'hidden'; o.vl = o.vt = false; libres.push(o); }
    for (let v = v0; v <= v1; v++) if (!vivos.has(v)) { const o = libres.pop() || crea(); asigna(o, v); vivos.set(v, o); }
    const cerca = suave(1 - Math.abs(T - s) * 3);
    const rb = balda.getBoundingClientRect(), cx = rb.left + rb.width / 2, cyp = rb.top + rb.height / 2;
    sobrePortada = Math.abs(T - s) < 0.28 && Math.abs(mx - cx) < d * 0.55 && Math.abs(my - cyp) < H * 0.54;
    const tx = sobrePortada ? -((my - cyp) / (H / 2)) * 5 : 0, ty = sobrePortada ? ((mx - cx) / (d * 0.55)) * 8 : mx > -900 ? ((mx - cx) / W) * 3 : 0;
    tiltX += (tx - tiltX) * (1 - Math.exp(-7 * dt)); tiltY += (ty - tiltY) * (1 - Math.exp(-7 * dt));
    for (const [v, o] of vivos) {
      const r = v - s, x = F(r), op = suave(1 - Math.abs(r));
      if (Math.abs(x) > W / 2 + d * 1.6) { if (o.vl || o.vt) { o.lomo.style.visibility = o.tapa.style.visibility = 'hidden'; o.vl = o.vt = false; } continue; }
      const rv = LISTA[o.i];
      if (!o.cargada && rv.i && Math.abs(r) < 3.5) { o.img.src = IMG(rv.i); o.cargada = true; }
      const meta = o === hover && Math.abs(r) > 0.5 ? 1 : 0; o.alza += (meta - o.alza) * (1 - Math.exp(-12 * dt));
      const y = -op * 0.025 * H - o.alza * 0.05 * H, z = op * 0.2 * H;
      const giro = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${z.toFixed(2)}px) rotateZ(${(-4.5 * op).toFixed(2)}deg) rotateX(${(tiltX * op).toFixed(2)}deg) rotateY(${(-90 * op + tiltY * op).toFixed(2)}deg)`;
      o.lomo.style.transform = `${giro} translateZ(${(d / 2).toFixed(2)}px)`;
      o.tapa.style.transform = `${giro} rotateY(90deg) translateZ(${(ws / 2).toFixed(2)}px)`;
      o.lomo.style.setProperty('--sombra', (op * 0.5).toFixed(3)); o.tapa.style.setProperty('--sombra', ((1 - op) * 0.42).toFixed(3));
      const verLomo = op < 0.985, verTapa = op > 0.015;   // cada cara se apaga cuando queda de canto
      if (o.vl !== verLomo) { o.vl = verLomo; o.lomo.style.visibility = verLomo ? 'visible' : 'hidden'; }
      if (o.vt !== verTapa) { o.vt = verTapa; o.tapa.style.visibility = verTapa ? 'visible' : 'hidden'; }
    }
    abrir.style.setProperty('--esc', cerca.toFixed(3));
    balda.dataset.cursor = sobrePortada ? t('Ver revista') : t('Arrastrar');
  }

  /* ---------- la portada (y el botón ▶) abren la página oficial de ese número en su web ---------- */
  const abre = () => { T = Math.round(T); const r = LISTA[mod(Math.round(s), N)]; open(BASE + r.s + '/', '_blank', 'noopener'); };
  abrir.addEventListener('click', abre);

  /* ---------- mandos: flechas, teclado, rueda horizontal y arrastre ---------- */
  $('.ts-est__ant').addEventListener('click', () => { T = Math.round(T) - 1; });
  $('.ts-est__sig').addEventListener('click', () => { T = Math.round(T) + 1; });
  document.addEventListener('keydown', (e) => {
    if (!visible || /input|textarea/i.test(document.activeElement?.tagName || '') || document.activeElement === linea) return;
    const r = sec.getBoundingClientRect(); if (r.top > innerHeight * 0.5 || r.bottom < innerHeight * 0.5) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); T = Math.round(T) - 1; }
    if (e.key === 'ArrowRight') { e.preventDefault(); T = Math.round(T) + 1; }
  });
  // la rueda vertical sigue bajando la página; la horizontal (trackpad) gira la estantería
  balda.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault(); e.stopPropagation();
    T += (e.deltaX / (ws + gap)) * 0.52; clearTimeout(rueda); rueda = setTimeout(() => { T = Math.round(T); }, 150);
  }, { passive: false });
  balda.addEventListener('pointerdown', (e) => { x0 = e.clientX; T0 = T; puntero = e.pointerId; arrastra = false; movido = false; });
  balda.addEventListener('pointermove', (e) => {
    if (puntero !== e.pointerId) return; const dx = e.clientX - x0;
    if (Math.abs(dx) > 5) { if (!arrastra) { arrastra = true; balda.setPointerCapture(e.pointerId); } movido = true; balda.classList.add('es-arrastre'); T = T0 - dx / (ws + gap); }
  });
  const suelta = (e) => { if (puntero !== e.pointerId) return; if (arrastra) T = Math.round(T); arrastra = false; puntero = null; balda.classList.remove('es-arrastre'); setTimeout(() => { movido = false; }, 80); };
  balda.addEventListener('pointerup', suelta); balda.addEventListener('pointercancel', suelta);
  addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
  addEventListener('resize', () => { mide(); });

  /* ---------- filtro por idioma (botones «Todos · ES · EN · IT · PT») ---------- */
  const filtro = $('.ts-filtro[data-filtro="revistas"]');
  filtro?.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const L = b.dataset.idioma, nueva = L === 'todos' ? REVISTAS : REVISTAS.filter((r) => (r.g || 'es') === L);
    if (!nueva.length) return;
    filtro.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    LISTA = nueva; N = LISTA.length; ciclo = N > 40;
    for (const [, o] of vivos) { o.lomo.style.visibility = o.tapa.style.visibility = 'hidden'; o.vl = o.vt = false; o.i = -1; libres.push(o); }
    vivos.clear(); s = T = 0; activo = -1;
    marcaVacios();
    rotulo(0, 1, true);
  });

  // al entrar en pantalla por primera vez, la estantería llega girando desde la derecha
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !entrada) { entrada = true; if (!quieto) { s = 14; T = 0; } }
  }, { threshold: 0.05 }).observe(sec);

  mide(); rotulo(0, 1, true); requestAnimationFrame(fotograma);
}
