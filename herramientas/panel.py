# Panel de actualización de la web de la Revista Tierra Santa.
# Se abre con ACTUALIZAR-WEB.bat (doble clic). Solo funciona en este ordenador (127.0.0.1); no necesita instalar nada.
import base64, datetime, hashlib, html, json, os, re, shutil, sys, threading, urllib.parse, urllib.request, webbrowser
import http.server

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import portada as P
import conexiones as C

RAIZ = P.RAIZ
PUERTO = int(sys.argv[1]) if len(sys.argv) > 1 else 4361
WEB_REVISTA = 'https://revistatierrasanta.com'
COPIAS = os.path.join(RAIZ, 'copias')
PARA_SUBIR = os.path.join(RAIZ, 'para-subir')
MANIFIESTO = os.path.join(RAIZ, 'MANIFIESTO-SHA256.txt')
CARPETAS_WEB = ('css', 'fonts', 'img', 'js', 'vendor', 'noticias')
ARCHIVOS_WEB = ('index.html',)
PROTEGIDOS = ('datos/noticias.json', 'js/hemeroteca-datos.js', 'index.html')
NAVEGADOR = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'
cerrojo = threading.Lock()


# ---------------------------------------------------------------- utilidades
def slug(t):
    t = t.lower()
    for a, b in zip('áéíóúüñàèìòùç', 'aeiouunaeiouc'):
        t = t.replace(a, b)
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')[:60] or 'noticia'


def copia_de_seguridad(motivo):
    marca = datetime.datetime.now().strftime('%Y-%m-%d_%H%M%S')
    dest = os.path.join(COPIAS, marca)
    for rel in PROTEGIDOS:
        o = os.path.join(RAIZ, rel)
        if os.path.exists(o):
            os.makedirs(os.path.dirname(os.path.join(dest, rel)), exist_ok=True)
            shutil.copy2(o, os.path.join(dest, rel))
    with open(os.path.join(dest, 'motivo.txt'), 'w', encoding='utf-8') as f:
        f.write(motivo)
    return marca


def lista_copias():
    if not os.path.isdir(COPIAS):
        return []
    return sorted((d for d in os.listdir(COPIAS) if os.path.isdir(os.path.join(COPIAS, d))), reverse=True)


def guarda_imagen(dataurl, carpeta, nombre):
    cab, datos = dataurl.split(',', 1)
    ext = 'webp' if 'webp' in cab else 'jpg'
    nombre = f'{nombre}.{ext}'
    os.makedirs(os.path.join(RAIZ, 'img', carpeta), exist_ok=True)
    with open(os.path.join(RAIZ, 'img', carpeta, nombre), 'wb') as f:
        f.write(base64.b64decode(datos))
    return nombre


def descarga(url, tipo='texto'):
    pet = urllib.request.Request(url, headers={'User-Agent': NAVEGADOR, 'Accept': '*/*', 'Accept-Language': 'es-ES,es;q=0.9'})
    with urllib.request.urlopen(pet, timeout=20) as r:
        cuerpo = r.read()
        ctype = r.headers.get('Content-Type', '')
    if tipo == 'json':
        if 'json' not in ctype:
            raise IOError('La web de la revista ha respondido con una página de verificación en vez de los datos.')
        return json.loads(cuerpo.decode('utf-8'))
    return cuerpo, ctype


def limpia(t):
    t = re.sub(r'<[^>]+>', '', t or '')
    return html.unescape(t).replace(' ', ' ').strip()


def entradilla_de(extracto):
    t = limpia(extracto).replace('[…]', '').replace('[&hellip;]', '').strip()
    frase = re.split(r'(?<=[.!?])\s', t)[0] if t else ''
    return (frase if len(frase) <= 170 else frase[:167].rsplit(' ', 1)[0] + '…')


# ---------------------------------------------------------------- publicar
def huella(ruta):
    h = hashlib.sha256()
    with open(ruta, 'rb') as f:
        for trozo in iter(lambda: f.read(1 << 20), b''):
            h.update(trozo)
    return h.hexdigest()


def lee_manifiesto():
    d = {}
    if os.path.exists(MANIFIESTO):
        for l in open(MANIFIESTO, encoding='utf-8'):
            if '  ' in l:
                h, f = l.rstrip('\n').split('  ', 1)
                d[f] = h
    return d


def archivos_web():
    for a in ARCHIVOS_WEB:
        yield a
    for c in CARPETAS_WEB:
        for raiz, _, fs in os.walk(os.path.join(RAIZ, c)):
            for f in fs:
                yield os.path.relpath(os.path.join(raiz, f), RAIZ).replace(os.sep, '/')


def pendientes():
    man = lee_manifiesto()
    return [r for r in archivos_web() if man.get(r) != huella(os.path.join(RAIZ, r))]


def prepara_subida():
    cambiados = pendientes()
    if os.path.isdir(PARA_SUBIR):
        shutil.rmtree(PARA_SUBIR)
    os.makedirs(PARA_SUBIR)
    for r in cambiados:
        os.makedirs(os.path.dirname(os.path.join(PARA_SUBIR, r)) or PARA_SUBIR, exist_ok=True)
        shutil.copy2(os.path.join(RAIZ, r), os.path.join(PARA_SUBIR, r))
    man = lee_manifiesto()
    for r in cambiados + ['datos/noticias.json']:
        if os.path.exists(os.path.join(RAIZ, r)):
            man[r] = huella(os.path.join(RAIZ, r))
    with open(MANIFIESTO, 'w', encoding='utf-8', newline='\n') as f:
        f.write(''.join(f'{h}  {r}\n' for r, h in sorted(man.items())))
    return cambiados


# ---------------------------------------------------------------- acciones
def estado():
    revistas = P.lee_revistas()
    return {'noticias': P.lee_noticias(), 'revistas': revistas[:8], 'total_revistas': len(revistas),
            'pendientes': len(pendientes()), 'copias': len(lista_copias()),
            'por_subir': {k: len(por_subir(k)) for k in ('github', 'ftp')}, 'ajustes': C.ajustes_para_pantalla()}


def guarda_noticia(d):
    noticias = P.lee_noticias()
    previa = next((n for n in noticias if n['url'] == d.get('url_original')), None)
    titulo, texto, url = d.get('titulo', '').strip(), d.get('texto', '').strip(), d.get('url', '').strip()
    if not titulo:
        raise ValueError('Falta el título.')
    if not re.match(r'\d{4}-\d\d-\d\d$', d.get('fecha', '')):
        raise ValueError('Falta la fecha.')
    if not texto and not url.startswith('http'):
        raise ValueError('Escribe el texto de la noticia (o pega el enlace si ya está publicada en la web de la revista).')
    if not d.get('foto') and not (previa and previa.get('foto')):
        raise ValueError('Falta la foto de la noticia.')
    if d.get('wordpress') and not C.listo('wordpress'):
        raise ValueError('Para publicarla en WordPress, rellena antes sus datos en «Conexiones» (paso 5).')
    copia_de_seguridad(('Editar' if previa else 'Añadir') + ' noticia: ' + titulo)
    n = previa or {}
    n.update(titulo=titulo, fecha=d['fecha'], entradilla=d.get('entradilla', '').strip(), texto=texto, posicion=n.get('posicion', ''))
    if d.get('foto'):
        n['foto'] = guarda_imagen(d['foto'], 'noticias', f"{d['fecha']}-{slug(titulo)}")
        n['ancho'], n['alto'], n['posicion'] = int(d['ancho']), int(d['alto']), ''
    aviso = ''
    if texto:   # noticia escrita aquí: página propia en la web nueva
        n['pagina'] = n.get('pagina') or f"noticias/{d['fecha']}-{slug(titulo)}.html"
        P.escribe_pagina_noticia(n)
        n['url'] = n['pagina']
        if d.get('wordpress'):
            try:
                n['wp_id'], n['wp_enlace'] = C.publica_wordpress(n, os.path.join(RAIZ, 'img', 'noticias', n['foto']), P.parrafos(texto))
                n['url'] = n['wp_enlace']
                aviso = ' También está publicada en WordPress.'
            except Exception as ex:
                aviso = f' ⚠ No se ha podido publicar en WordPress: {ex} (queda guardada aquí; puedes volver a intentarlo con «Cambiar»).'
        elif n.get('wp_enlace'):
            n['url'] = n['wp_enlace']
    else:
        n['url'] = url
    if any(o['url'] == n['url'] and o is not n for o in noticias):
        raise ValueError('Esa noticia ya está en la portada.')
    if not previa:
        noticias.append(n)
    P.guarda_noticias(noticias)
    P.rehace_portada()
    return 'Noticia guardada.' + aviso


def quita_noticia(d):
    noticias = P.lee_noticias()
    resto = [n for n in noticias if n['url'] != d['url']]
    if len([n for n in resto if n.get('foto')]) < 6:
        raise ValueError('No se puede quitar: la portada necesita al menos 6 noticias con foto. Añade antes otra.')
    copia_de_seguridad('Quitar noticia: ' + next(n['titulo'] for n in noticias if n['url'] == d['url']))
    P.guarda_noticias(resto)
    P.rehace_portada()


def guarda_revista(d):
    revistas = P.lee_revistas()
    try:
        num = int(d['numero'])
    except (KeyError, ValueError):
        raise ValueError('Falta el número de la revista.')
    if any(r['n'] == num for r in revistas):
        raise ValueError(f'La revista nº {num} ya está en la hemeroteca.')
    if not d.get('portada'):
        raise ValueError('Falta la foto de la portada.')
    anio = int(d['anio'])
    copia_de_seguridad(f'Añadir revista nº {num}')
    nombre = guarda_imagen(d['portada'], 'hemeroteca', str(num))
    nueva = {'s': d.get('slug') or f'revista-no-{num}', 'n': num, 'l': str(num), 'd': anio // 10 * 10,
             'p': f"{d['meses']} {anio}".strip(), 'c': d.get('color') or '#6a4639', 't': 1 if d.get('claro', True) else 0,
             'r': round(float(d.get('proporcion') or 0.735), 3), 'i': f'img/hemeroteca/{nombre}'}
    revistas.append(nueva)
    revistas.sort(key=lambda r: r['n'], reverse=True)
    P.guarda_revistas(revistas)
    P.rehace_portada()


def quita_revista(d):
    revistas = P.lee_revistas()
    num = int(d['numero'])
    copia_de_seguridad(f'Quitar revista nº {num}')
    P.guarda_revistas([r for r in revistas if r['n'] != num])
    P.rehace_portada()


def deshacer():
    copias = lista_copias()
    if not copias:
        raise ValueError('No hay ningún cambio que deshacer.')
    ultima = os.path.join(COPIAS, copias[0])
    for rel in PROTEGIDOS:
        o = os.path.join(ultima, rel)
        if os.path.exists(o):
            shutil.copy2(o, os.path.join(RAIZ, rel))
    motivo = open(os.path.join(ultima, 'motivo.txt'), encoding='utf-8').read() if os.path.exists(os.path.join(ultima, 'motivo.txt')) else ''
    shutil.rmtree(ultima)
    return motivo


def novedades():
    try:
        return _novedades()
    except ValueError:
        raise
    except Exception:
        raise ValueError('ahora mismo no responde o no deja leerla automáticamente; comprueba la conexión a internet')


def _novedades():
    """Lee de la web de la revista las últimas noticias y revistas que aún no están en la portada."""
    ya = {n['url'] for n in P.lee_noticias()}
    posts = descarga(f'{WEB_REVISTA}/wp-json/wp/v2/posts?per_page=12&_embed=wp:featuredmedia', 'json')
    nuevas = []
    for p in posts:
        if p['link'] in ya:
            continue
        foto = ''
        try:
            foto = p['_embedded']['wp:featuredmedia'][0]['source_url']
        except (KeyError, IndexError, TypeError):
            pass
        nuevas.append({'url': p['link'], 'titulo': limpia(p['title']['rendered']), 'fecha': p['date'][:10],
                       'entradilla': entradilla_de(p.get('excerpt', {}).get('rendered', '')), 'foto_url': foto})
    hay = {r['n'] for r in P.lee_revistas()}
    revs = descarga(f'{WEB_REVISTA}/wp-json/wp/v2/revistas?per_page=6&_embed=wp:featuredmedia', 'json')
    nuevas_r = []
    for r in revs:
        m = re.search(r'(\d+)', limpia(r['title']['rendered']))
        if not m or int(m.group(1)) in hay:
            continue
        foto = ''
        try:
            foto = r['_embedded']['wp:featuredmedia'][0]['source_url']
        except (KeyError, IndexError, TypeError):
            pass
        nuevas_r.append({'numero': int(m.group(1)), 'slug': r['slug'], 'titulo': limpia(r['title']['rendered']),
                         'foto_url': foto, 'fecha': r['date'][:10]})
    return {'noticias': nuevas, 'revistas': nuevas_r}



# ---------------------------------------------------------------- subir (GitHub ahora; FTP cuando haya accesos)
def f_subido(destino):
    return os.path.join(RAIZ, 'datos', f'subido-{destino}.json')


def lee_subido(destino):
    try:
        with open(f_subido(destino), encoding='utf-8') as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def por_subir(destino):
    hecho = lee_subido(destino)
    return [r for r in archivos_web() if hecho.get(r) != huella(os.path.join(RAIZ, r))]


progreso = {'texto': ''}


def subir(d):
    destino = d.get('destino')
    if destino not in ('github', 'ftp'):
        raise ValueError('Destino desconocido.')
    if not C.listo(destino):
        raise ValueError('Faltan los datos de conexión. Rellénalos en «Conexiones» (paso 5).')
    rutas = por_subir(destino)
    if not rutas:
        return 'No hay nada nuevo que subir: ya está todo al día.'
    def avance(i, total):
        progreso['texto'] = f'Subiendo {i} de {total}…'
    hecho = lee_subido(destino)
    if destino == 'github':
        C.sube_github(RAIZ, rutas, f'Actualización desde el panel ({datetime.date.today():%d/%m/%Y}): {len(rutas)} archivo(s)', avance)
    else:
        C.sube_ftp(RAIZ, rutas, avance)
    for r in rutas:
        hecho[r] = huella(os.path.join(RAIZ, r))
    with open(f_subido(destino), 'w', encoding='utf-8', newline='\n') as f:
        json.dump(hecho, f, ensure_ascii=False, indent=0, sort_keys=True)
    progreso['texto'] = ''
    sitio = 'GitHub' if destino == 'github' else 'el servidor de la revista'
    return f'✔ Subidos {len(rutas)} archivo(s) {"a " + sitio if destino == "github" else "al servidor de la revista"}.' + (' En 1–2 minutos se verá en GitHub Pages.' if destino == 'github' else ' Vacía la caché de la web si no se ve.')


def probar(d):
    return {'github': C.prueba_github, 'ftp': C.prueba_ftp, 'wordpress': C.prueba_wordpress}[d['destino']]()


def guarda_ajustes(d):
    C.guarda_ajustes(d)
    return C.ajustes_para_pantalla()


# ---------------------------------------------------------------- servidor
class Panel(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=RAIZ, **k)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()

    def log_message(self, *a):
        pass

    def responde(self, codigo, obj):
        cuerpo = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(codigo)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        if u.path in ('/', '/panel'):
            self.send_response(302)
            self.send_header('Location', '/panel/')
            self.end_headers()
            return
        if u.path == '/api/estado':
            return self.trata(estado)
        if u.path == '/api/progreso':
            return self.responde(200, {'ok': True, 'resultado': progreso['texto']})
        if u.path == '/api/novedades':
            return self.trata(novedades)
        if u.path == '/api/imagen':
            url = urllib.parse.parse_qs(u.query).get('url', [''])[0]
            if not url.startswith(WEB_REVISTA + '/'):
                return self.responde(400, {'error': 'Dirección no permitida'})
            try:
                cuerpo, ctype = descarga(url)
                if not ctype.startswith('image/'):
                    raise IOError('No es una imagen')
            except Exception as ex:
                return self.responde(502, {'error': f'No he podido descargar la foto: {ex}'})
            self.send_response(200)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Length', str(len(cuerpo)))
            self.end_headers()
            self.wfile.write(cuerpo)
            return
        for h in ('If-Modified-Since', 'If-None-Match'):
            if h in self.headers:
                del self.headers[h]
        super().do_GET()

    def do_POST(self):
        acciones = {'/api/noticia': guarda_noticia, '/api/noticia/quitar': quita_noticia,
                    '/api/revista': guarda_revista, '/api/revista/quitar': quita_revista,
                    '/api/deshacer': lambda d: deshacer(), '/api/preparar': lambda d: prepara_subida(),
                    '/api/abrir-carpeta': lambda d: abre_carpeta(), '/api/subir': subir,
                    '/api/probar': probar, '/api/ajustes': guarda_ajustes}
        f = acciones.get(self.path)
        if not f:
            return self.responde(404, {'error': 'No existe'})
        n = int(self.headers.get('Content-Length') or 0)
        try:
            d = json.loads(self.rfile.read(n).decode('utf-8') or '{}')
        except ValueError:
            return self.responde(400, {'error': 'Datos ilegibles'})
        self.trata(lambda: f(d))

    def trata(self, f):
        try:
            with cerrojo:
                r = f()
            self.responde(200, {'ok': True, 'resultado': r})
        except Exception as ex:
            self.responde(400, {'ok': False, 'error': str(ex)})


def abre_carpeta():
    os.makedirs(PARA_SUBIR, exist_ok=True)
    if hasattr(os, 'startfile'):
        os.startfile(PARA_SUBIR)
    return PARA_SUBIR


if __name__ == '__main__':
    servidor = http.server.ThreadingHTTPServer(('127.0.0.1', PUERTO), Panel)
    servidor.daemon_threads = True
    url = f'http://localhost:{PUERTO}/panel/'
    print(f'\n  Panel de la Revista Tierra Santa abierto en {url}\n  No cierres esta ventana mientras lo uses.\n')
    if '--sin-navegador' not in sys.argv:
        threading.Timer(1.0, lambda: webbrowser.open(url)).start()
    servidor.serve_forever()
