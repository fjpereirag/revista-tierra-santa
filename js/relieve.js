// TIERRA SANTA · banda de Jerusalén en relieve 3D (WebGL propio, sin librerías)
// Su misma foto + un mapa de profundidad sacado en local (Depth-Anything-V2-Small).
// El ratón (o un vaivén automático en móvil) mueve la cámara: la Cúpula y los minaretes se separan del fondo.
// Al bajar, la cámara se acerca; una luz dorada sigue al puntero. Si WebGL falla, se queda la foto normal.

const VS = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;
const FS = `precision highp float;
uniform sampler2D uImg, uProf;
uniform vec2 uRes, uImgRes, uRaton;
uniform float uPan, uScroll, uT, uEntra;
varying vec2 vUv;
float prof(vec2 uv){ return texture2D(uProf, uv).r; }
float fino(vec2 uv){ return texture2D(uProf, uv).g; }
void main(){
  float ra = uRes.x / uRes.y, ri = uImgRes.x / uImgRes.y;
  vec2 s = ra > ri ? vec2(1.0, ri / ra) : vec2(ra / ri, 1.0);
  s *= 0.95 - 0.08 * (1.0 - uEntra);                         // margen para el movimiento + acercamiento de entrada
  vec2 c = vec2(mix(s.x * 0.5 + 0.03, 1.0 - s.x * 0.5 - 0.03, uPan), 0.5);
  vec2 q = vec2(vUv.x, vUv.y) - 0.5;
  vec2 base = c + q * s;
  base.y = 1.0 - base.y;
  vec2 dir = uRaton * vec2(0.026 * s.x, 0.06 * s.y);
  vec2 uv = base; float h = 0.5;
  for (int i = 0; i < 7; i++) {                            // paralaje con refinamiento (la profundidad decide cuánto se mueve cada punto)
    h = prof(uv);
    vec2 zoom = (base - vec2(c.x, 1.0 - c.y)) * (1.0 - uScroll * 0.07 * h);
    uv = vec2(c.x, 1.0 - c.y) + zoom + dir * (h - 0.42);
  }
  uv = clamp(uv, vec2(0.001), vec2(0.999));
  vec3 col = texture2D(uImg, uv).rgb;
  // relieve iluminado: normal a partir de la profundidad, luz dorada que sigue al puntero
  vec2 e = 1.5 / uImgRes;
  float dx = fino(uv + vec2(e.x, 0.0)) - fino(uv - vec2(e.x, 0.0));
  float dy = fino(uv + vec2(0.0, e.y)) - fino(uv - vec2(0.0, e.y));
  h = fino(uv);
  vec3 n = normalize(vec3(-dx * 9.0, dy * 9.0, 1.0));
  vec3 L = normalize(vec3(uRaton.x * 0.9, 0.35 - uRaton.y * 0.4, 0.75));
  float dif = clamp(dot(n, L), 0.0, 1.0);
  col *= 0.9 + 0.16 * dif;
  col += vec3(1.0, 0.8, 0.48) * pow(dif, 10.0) * 0.16 * h;
  // bruma: lo lejano un poco más claro y cálido (da sensación de distancia)
  col = mix(col, vec3(0.96, 0.91, 0.82), (1.0 - h) * 0.14);
  // barrido de sol al entrar
  float barrido = smoothstep(0.16, 0.0, abs(vUv.x - (uEntra * 1.6 - 0.3)));
  col += vec3(1.0, 0.86, 0.6) * barrido * 0.22 * (1.0 - uEntra * 0.6);
  // brillo dorado alrededor del puntero
  vec2 pr = vec2(uRaton.x * 0.5 + 0.5, 0.5 - uRaton.y * 0.5);
  float dh = length((vUv - pr) * vec2(ra, 1.0));
  float halo = exp(-dh * dh * 0.45);
  col += vec3(1.0, 0.84, 0.55) * halo * 0.08 * h;
  gl_FragColor = vec4(col, 1.0);
}`;

const carga = (src) => new Promise((ok, mal) => { const i = new Image(); i.decoding = 'async'; i.onload = () => (i.decode ? i.decode().then(() => ok(i), () => ok(i)) : ok(i)); i.onerror = mal; i.src = src; });

export async function iniciaRelieve(seccion, { tactil = false, quieto = false } = {}) {
  const foto = seccion.querySelector('.ts-banner__foto img');
  const canvas = document.createElement('canvas'); canvas.className = 'ts-banner__lienzo';
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
  if (!gl) return null;
  let img, prof;
  try { [img, prof] = await Promise.all([carga(foto.currentSrc || foto.src), carga(new URL('../img/marca/banner-jerusalen-prof.png', import.meta.url).href)]); } catch { return null; }

  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const pr = gl.createProgram();
  try { gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); } catch (e) { console.warn('relieve', e); return null; }
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  // en WebKit la textura se sube desde los píxeles de un canvas 2D (subir la imagen directa da fallos)
  const tex = (im, unidad) => {
    const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height);
    const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unidad); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, d);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  };
  tex(img, 0); tex(prof, 1);
  const U = (n) => gl.getUniformLocation(pr, n);
  gl.uniform1i(U('uImg'), 0); gl.uniform1i(U('uProf'), 1);
  gl.uniform2f(U('uImgRes'), img.naturalWidth, img.naturalHeight);
  const uRes = U('uRes'), uRaton = U('uRaton'), uPan = U('uPan'), uScroll = U('uScroll'), uT = U('uT'), uEntra = U('uEntra');

  const mide = () => {
    const r = seccion.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(2, Math.round(r.width * dpr)); canvas.height = Math.max(2, Math.round(r.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(uRes, canvas.width, canvas.height);
  };
  seccion.querySelector('.ts-banner__foto').append(canvas);
  mide(); addEventListener('resize', mide);

  let mx = 0, my = 0, tx = 0, ty = 0, visible = true, entra = 0, entraMeta = 0, t0 = performance.now();
  addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; tx = (e.clientX / innerWidth) * 2 - 1; ty = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(seccion);
  const pinta = (t) => {
    requestAnimationFrame(pinta);
    if (!visible) return;
    const s = (t - t0) / 1000;
    if (tactil || quieto) { tx = quieto ? 0 : Math.sin(s * 0.55) * 0.85; ty = quieto ? 0 : Math.cos(s * 0.4) * 0.5; }   // móvil: la cámara se mece sola
    mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
    entra += (entraMeta - entra) * 0.035;
    const r = seccion.getBoundingClientRect();
    gl.uniform2f(uRaton, mx, my);
    gl.uniform1f(uPan, quieto ? 0.35 : 0.35 + 0.18 * Math.sin(s * 0.05) + mx * 0.03);
    gl.uniform1f(uScroll, Math.max(0, Math.min(1, -r.top / Math.max(1, r.height))));
    gl.uniform1f(uT, s); gl.uniform1f(uEntra, entra);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  requestAnimationFrame(pinta);
  seccion.classList.add('ts-banner--3d');
  return { entra: () => { entraMeta = 1; } };
}
