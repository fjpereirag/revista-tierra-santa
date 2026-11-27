"""Conexiones del panel con el exterior: GitHub (subir la web), FTP (subir al alojamiento) y WordPress (publicar la noticia).
Solo usa lo que trae Python. Los accesos se guardan en el perfil de Windows (%APPDATA%\\PanelRevistaTierraSanta\\ajustes.json), fuera de la carpeta de la web."""
import base64, ftplib, io, json, os, posixpath, urllib.error, urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
# Fuera de la carpeta de la web (en el perfil del usuario de Windows) para que nunca acabe en GitHub ni en el servidor.
D_AJUSTES = os.path.join(os.environ.get('APPDATA') or os.path.expanduser('~'), 'PanelRevistaTierraSanta')
F_AJUSTES = os.path.join(D_AJUSTES, 'ajustes.json')
SECRETOS = {'github': ['token'], 'ftp': ['contrasena'], 'wordpress': ['contrasena_app']}
POR_DEFECTO = {
    'github': {'repositorio': 'fjpereirag/revista-tierra-santa', 'rama': 'main', 'token': ''},
    'ftp': {'servidor': '', 'puerto': '21', 'usuario': '', 'contrasena': '', 'carpeta': '/public_html', 'segura': True},
    'wordpress': {'web': 'https://revistatierrasanta.com', 'usuario': '', 'contrasena_app': ''},
}
NAVEGADOR = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PanelRevistaTierraSanta/1.0'


# ---------------------------------------------------------------- ajustes
def lee_ajustes():
    a = json.loads(json.dumps(POR_DEFECTO))
    if os.path.exists(F_AJUSTES):
        with open(F_AJUSTES, encoding='utf-8') as f:
            guardado = json.load(f)
        for k in a:
            a[k].update(guardado.get(k, {}))
    return a


def ajustes_para_pantalla():
    """Igual que lee_ajustes pero sin enseñar contraseñas: solo si están puestas."""
    a = lee_ajustes()
    for k, campos in SECRETOS.items():
        for c in campos:
            a[k][c + '_puesta'] = bool(a[k][c])
            a[k][c] = ''
    a['listo'] = {k: listo(k, lee_ajustes()) for k in POR_DEFECTO}
    return a


def guarda_ajustes(nuevos):
    a = lee_ajustes()
    for k in POR_DEFECTO:
        for c, v in (nuevos.get(k) or {}).items():
            if c not in POR_DEFECTO[k]:
                continue
            if c in SECRETOS.get(k, []) and not v:
                continue            # vacío = dejar la que había
            a[k][c] = v.strip() if isinstance(v, str) else v
    os.makedirs(D_AJUSTES, exist_ok=True)
    with open(F_AJUSTES, 'w', encoding='utf-8') as f:
        json.dump(a, f, ensure_ascii=False, indent=2)


def listo(destino, a=None):
    a = a or lee_ajustes()
    c = a[destino]
    if destino == 'github':
        return bool(c['repositorio'] and c['token'])
    if destino == 'ftp':
        return bool(c['servidor'] and c['usuario'] and c['contrasena'])
    if destino == 'wordpress':
        return bool(c['web'] and c['usuario'] and c['contrasena_app'])


# ---------------------------------------------------------------- utilidades http
def pide(metodo, url, cabeceras=None, datos=None, json_cuerpo=None):
    h = {'User-Agent': NAVEGADOR, 'Accept': 'application/json'}
    h.update(cabeceras or {})
    if json_cuerpo is not None:
        datos = json.dumps(json_cuerpo).encode('utf-8')
        h['Content-Type'] = 'application/json'
    pet = urllib.request.Request(url, data=datos, method=metodo, headers=h)
    try:
        with urllib.request.urlopen(pet, timeout=60) as r:
            cuerpo = r.read()
            if 'json' not in r.headers.get('Content-Type', ''):
                raise IOError('El servidor ha respondido con una página en vez de datos (¿protección antibots?).')
            return json.loads(cuerpo.decode('utf-8') or 'null')
    except urllib.error.HTTPError as ex:
        try:
            msg = json.loads(ex.read().decode('utf-8')).get('message', '')
        except Exception:
            msg = ''
        if ex.code in (401, 403):
            raise IOError(f'Acceso denegado ({ex.code}). Revisa el usuario y la clave. {msg}'.strip())
        if ex.code == 404:
            raise IOError(f'No encontrado (404). Revisa el nombre del repositorio o la dirección. {msg}'.strip())
        raise IOError(f'Error {ex.code}. {msg}'.strip())
    except urllib.error.URLError as ex:
        raise IOError(f'No hay conexión ({ex.reason}).')


# ---------------------------------------------------------------- GitHub: todo en un único «commit»
def _gh(a):
    c = a['github']
    base = f"{os.environ.get('PANEL_API_GITHUB', 'https://api.github.com')}/repos/{c['repositorio'].strip('/')}"
    cab = {'Authorization': f"Bearer {c['token']}", 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'}
    return base, cab, c['rama'] or 'main'


def prueba_github(a=None):
    base, cab, rama = _gh(a or lee_ajustes())
    r = pide('GET', f'{base}/git/ref/heads/{rama}', cab)
    return f"Conexión correcta con GitHub (rama {rama})."


def sube_github(raiz, rutas, mensaje, avance=None):
    base, cab, rama = _gh(lee_ajustes())
    ref = pide('GET', f'{base}/git/ref/heads/{rama}', cab)
    padre = ref['object']['sha']
    arbol_base = pide('GET', f'{base}/git/commits/{padre}', cab)['tree']['sha']
    elementos = []
    for i, r in enumerate(rutas, 1):
        with open(os.path.join(raiz, r), 'rb') as f:
            b = pide('POST', f'{base}/git/blobs', cab, json_cuerpo={'content': base64.b64encode(f.read()).decode(), 'encoding': 'base64'})
        elementos.append({'path': r, 'mode': '100644', 'type': 'blob', 'sha': b['sha']})
        if avance:
            avance(i, len(rutas))
    arbol = pide('POST', f'{base}/git/trees', cab, json_cuerpo={'base_tree': arbol_base, 'tree': elementos})
    commit = pide('POST', f'{base}/git/commits', cab, json_cuerpo={'message': mensaje, 'tree': arbol['sha'], 'parents': [padre]})
    pide('PATCH', f'{base}/git/refs/heads/{rama}', cab, json_cuerpo={'sha': commit['sha']})
    return commit['sha'][:7]


# ---------------------------------------------------------------- FTP
def _ftp(a):
    c = a['ftp']
    clase = ftplib.FTP_TLS if c.get('segura') else ftplib.FTP
    f = clase()
    f.connect(c['servidor'].replace('ftp://', '').strip('/'), int(c.get('puerto') or 21), timeout=40)
    f.login(c['usuario'], c['contrasena'])
    if isinstance(f, ftplib.FTP_TLS):
        f.prot_p()
    f.encoding = 'utf-8'
    return f, (c.get('carpeta') or '/').rstrip('/') or '/'


def prueba_ftp(a=None):
    try:
        f, carpeta = _ftp(a or lee_ajustes())
        f.cwd(carpeta)
        f.quit()
    except ftplib.all_errors as ex:
        raise IOError(f'No puedo entrar por FTP: {ex}')
    return f'Conexión correcta con el servidor FTP (carpeta {carpeta}).'


def sube_ftp(raiz, rutas, avance=None):
    try:
        f, carpeta = _ftp(lee_ajustes())
        hechas = set()
        for i, r in enumerate(rutas, 1):
            destino = posixpath.join(carpeta, r)
            d = posixpath.dirname(destino)
            if d not in hechas:
                partes = d.strip('/').split('/')
                for k in range(1, len(partes) + 1):
                    sub = '/' + '/'.join(partes[:k])
                    if sub in hechas:
                        continue
                    try:
                        f.mkd(sub)
                    except ftplib.error_perm:
                        pass
                    hechas.add(sub)
            with open(os.path.join(raiz, r), 'rb') as fich:
                f.storbinary(f'STOR {destino}', fich)
            if avance:
                avance(i, len(rutas))
        f.quit()
    except ftplib.all_errors as ex:
        raise IOError(f'Fallo al subir por FTP: {ex}')


# ---------------------------------------------------------------- WordPress: la noticia como entrada de su web
def _wp(a):
    c = a['wordpress']
    clave = base64.b64encode(f"{c['usuario']}:{c['contrasena_app'].replace(' ', '')}".encode()).decode()
    return c['web'].rstrip('/') + '/wp-json/wp/v2', {'Authorization': f'Basic {clave}'}


def prueba_wordpress(a=None):
    base, cab = _wp(a or lee_ajustes())
    yo = pide('GET', base + '/users/me?context=edit', cab)
    return f"Conexión correcta con WordPress como «{yo.get('name', '?')}»."


def _sube_medio(base, cab, ruta):
    with open(ruta, 'rb') as f:
        datos = f.read()
    tipo = 'image/webp' if ruta.endswith('.webp') else 'image/jpeg'
    return pide('POST', base + '/media', dict(cab, **{'Content-Type': tipo, 'Content-Disposition': f'attachment; filename="{os.path.basename(ruta)}"'}), datos=datos)


def publica_wordpress(n, ruta_foto, parrafos_html, carpeta_fotos=None):
    """Crea (o actualiza, si ya tiene wp_id) la entrada en WordPress. Devuelve (id, enlace)."""
    base, cab = _wp(lee_ajustes())
    if not n.get('wp_foto_id') or n.get('wp_foto_de') != n['foto']:
        m = _sube_medio(base, cab, ruta_foto)
        n['wp_foto_id'], n['wp_foto_de'] = m['id'], n['foto']
    contenido = '\n\n'.join(f'<!-- wp:paragraph -->\n<p>{p}</p>\n<!-- /wp:paragraph -->' for p in parrafos_html)
    subidas = n.get('wp_galeria') or {}          # foto -> [id, url] ya subidas antes
    bloques = []
    for g in n.get('galeria') or []:
        if g['foto'] not in subidas:
            m = _sube_medio(base, cab, os.path.join(carpeta_fotos, g['foto']))
            subidas[g['foto']] = [m['id'], m.get('source_url', '')]
        i, u = subidas[g['foto']]
        bloques.append(f'<!-- wp:image {{"id":{i},"sizeSlug":"large","linkDestination":"media"}} -->\n<figure class="wp-block-image size-large"><a href="{u}"><img src="{u}" alt="" class="wp-image-{i}"/></a></figure>\n<!-- /wp:image -->')
    n['wp_galeria'] = {k: v for k, v in subidas.items() if any(g['foto'] == k for g in n.get('galeria') or [])}
    if bloques:
        contenido += '\n\n<!-- wp:gallery {"linkTo":"media"} -->\n<figure class="wp-block-gallery has-nested-images columns-default is-cropped">\n' + '\n'.join(bloques) + '\n</figure>\n<!-- /wp:gallery -->'
    entrada = {'title': n['titulo'], 'content': contenido, 'excerpt': n.get('entradilla', ''), 'status': 'publish',
               'date': n['fecha'] + 'T09:00:00', 'featured_media': n['wp_foto_id']}
    if n.get('wp_id'):
        r = pide('POST', f"{base}/posts/{n['wp_id']}", cab, json_cuerpo=entrada)
    else:
        r = pide('POST', base + '/posts', cab, json_cuerpo=entrada)
    return r['id'], r['link']
