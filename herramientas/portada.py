"""Rehace las partes de la portada que cambian (noticias, teletipo, hemeroteca) a partir de los datos.
Lo usa panel.py. No necesita nada instalado aparte de Python."""
import json, re, html, os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F_INDEX = os.path.join(RAIZ, 'index.html')
F_NOTICIAS = os.path.join(RAIZ, 'datos', 'noticias.json')
F_REVISTAS = os.path.join(RAIZ, 'js', 'hemeroteca-datos.js')

MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
FLECHA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>'
e = lambda t: html.escape(t or '', quote=True)


def fecha_larga(iso, mayuscula):
    a, m, d = iso.split('-')
    mes = MESES[int(m) - 1]
    return f'{mes.capitalize() if mayuscula else mes} {int(d)}, {a}'


def lee_noticias():
    with open(F_NOTICIAS, encoding='utf-8') as f:
        n = json.load(f)
    return sorted(n, key=lambda x: x['fecha'], reverse=True)


def guarda_noticias(lista):
    with open(F_NOTICIAS, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(sorted(lista, key=lambda x: x['fecha'], reverse=True), f, ensure_ascii=False, indent=2)
        f.write('\n')


def html_destacada(n):
    return f'''        <article class="ts-noticia ts-entra" data-cursor="Leer">
          <a href="{e(n['url'])}" target="_blank" rel="noopener">
            <div class="ts-noticia__foto ts-cortina"><img src="img/noticias/{e(n['foto'])}" alt="{e(n['titulo'])}" width="{n['ancho']}" height="{n['alto']}" loading="lazy"></div>
            <p class="ts-fecha"><time datetime="{n['fecha']}">{fecha_larga(n['fecha'], True)}</time></p>
            <h2 class="ts-noticia__titulo"><span>{e(n['titulo'])}</span></h2>
            <p class="ts-noticia__entradilla">{e(n.get('entradilla', ''))}</p>
            <span class="ts-leer">Leer noticia {FLECHA}</span>
          </a>
        </article>'''


def html_breve(n):
    pos = f' style="object-position: {e(n["posicion"])}"' if n.get('posicion') else ''
    return f'''        <article class="ts-breve ts-entra" data-inclina data-cursor="Leer">
          <a href="{e(n['url'])}" target="_blank" rel="noopener">
            <div class="ts-breve__foto"><img src="img/noticias/{e(n['foto'])}" alt="" width="{n['ancho']}" height="{n['alto']}" loading="lazy"{pos}><i class="ts-brillo"></i></div>
            <h3 class="ts-breve__titulo">{e(n['titulo'])}</h3>
            <p class="ts-fecha ts-fecha--baja"><time datetime="{n['fecha']}">{fecha_larga(n['fecha'], False)}</time></p>
          </a>
        </article>'''


def html_teletipo(n):
    a, m, d = n['fecha'].split('-')
    return f'    <a href="{e(n["url"])}" target="_blank" rel="noopener"><time>{d}.{m}</time>{e(n["titulo"])}</a>'


def sustituye(texto, inicio, fin, nuevo, nombre):
    patron = re.compile(re.escape(inicio) + r'.*?' + re.escape(fin), re.S)
    if len(patron.findall(texto)) != 1:
        raise ValueError(f'No encuentro la zona «{nombre}» en index.html')
    return patron.sub(lambda _: inicio + nuevo + fin, texto)


def lee_revistas():
    with open(F_REVISTAS, encoding='utf-8') as f:
        t = f.read()
    m = re.match(r'(.*?export const REVISTAS = )(\[.*\])(;?\s*)$', t, re.S)
    if not m:
        raise ValueError('No entiendo el archivo js/hemeroteca-datos.js')
    return json.loads(m.group(2))


def guarda_revistas(lista):
    with open(F_REVISTAS, encoding='utf-8') as f:
        t = f.read()
    m = re.match(r'(.*?export const REVISTAS = )(\[.*\])(;?\s*)$', t, re.S)
    cab = re.sub(r'los \d+ números', f'los {len(lista)} números', m.group(1))
    nuevo = cab + json.dumps(lista, ensure_ascii=False, separators=(',', ':')) + m.group(3)
    with open(F_REVISTAS, 'w', encoding='utf-8', newline='\n') as f:
        f.write(nuevo)


def ultimo_anio(revistas):
    for r in revistas:
        m = re.search(r'(19|20)\d\d', r.get('p', ''))
        if m:
            return m.group(0)
    return str(revistas[0]['d'])


def rehace_portada():
    """Escribe en index.html las noticias (2 grandes + 4 pequeñas + 8 en el teletipo) y el contador de revistas."""
    noticias = lee_noticias()
    con_foto = [n for n in noticias if n.get('foto')]
    if len(con_foto) < 6:
        raise ValueError('Hacen falta al menos 6 noticias con foto')
    grandes, peques = con_foto[:2], con_foto[2:6]
    with open(F_INDEX, encoding='utf-8') as f:
        t = f.read()
    t = sustituye(t, '<div class="ts-teletipo__cinta">\n', '\n  </div></div>',
                  '\n'.join(html_teletipo(n) for n in noticias[:8]), 'teletipo')
    t = sustituye(t, '<div class="ts-destacadas">\n', '\n      </div>\n\n      <div class="ts-breves">',
                  '\n'.join(html_destacada(n) for n in grandes), 'noticias grandes')
    t = sustituye(t, '<div class="ts-breves">\n', '\n      </div>\n\n      <a class="ts-boton ts-boton--borde ts-entra" href="https://revistatierrasanta.com/actualidad/"',
                  '\n'.join(html_breve(n) for n in peques), 'noticias pequeñas')
    a, m, d = noticias[0]['fecha'].split('-')
    t, k = re.subn(r'Lo último · \d\d\.\d\d\.\d{4}', f'Lo último · {d}.{m}.{a}', t)
    revistas = lee_revistas()
    t, k2 = re.subn(r'<p class="ts-est__cuenta">\d+ revistas · <span>1921 – \d{4}</span></p>',
                    f'<p class="ts-est__cuenta">{len(revistas)} revistas · <span>1921 – {ultimo_anio(revistas)}</span></p>', t)
    if k != 1 or k2 != 1:
        raise ValueError('No encuentro la fecha de «Lo último» o el contador de revistas en index.html')
    with open(F_INDEX, 'w', encoding='utf-8', newline='\n') as f:
        f.write(t)
