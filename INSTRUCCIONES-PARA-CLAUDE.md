# Revista Tierra Santa · web (copia exacta)

**Para Claude Code:** esta carpeta es una web **ya terminada**. Tu único trabajo es ponerla en marcha tal cual
y abrirla en el navegador. No hay nada que programar.

## Reglas obligatorias

1. **No modifiques ningún archivo.** No reescribas, no "mejores", no reformatees, no traduzcas y no regeneres
   nada: ni el HTML, ni el CSS, ni el JavaScript, ni las imágenes, ni los textos, ni los datos.
2. **No instales nada ni conviertas el proyecto a otra cosa** (React, Vite, npm, Tailwind…). Es HTML + CSS +
   JavaScript tal cual, sin compilar.
3. **No borres archivos**, aunque te parezca que alguno no se usa.
4. **Comprueba que todo es idéntico al original** con `MANIFIESTO-SHA256.txt` (paso 2) antes de abrirla.
   Si algún archivo no coincide, **detente y avisa**; no lo arregles tú.
5. Si después te piden cambios, hazlos solo cuando el usuario lo pida expresamente y solo lo que pida.

## Pasos

1. **Descomprimir** `TIERRA-SANTA-web.zip`. Sale la carpeta `tierra-santa/`. Entra en ella.

2. **Comprobar que está completa y sin cambios** (el manifiesto comprueba los 867 archivos, uno a uno):
   - Mac / Linux:
     ```bash
     shasum -a 256 -c MANIFIESTO-SHA256.txt | grep -v ': OK$' ; echo "Comprobación terminada"
     ```
     Si solo sale «Comprobación terminada», está todo bien (cualquier otra línea es un archivo que no coincide).
   - Windows (PowerShell):
     ```powershell
     Get-Content MANIFIESTO-SHA256.txt | ForEach-Object { $h, $f = $_ -split '  ', 2; if ((Get-FileHash -Algorithm SHA256 -LiteralPath $f).Hash.ToLower() -ne $h) { "NO COINCIDE: $f" } }; "Comprobación terminada"
     ```

3. **Arrancar el servidor local.** Hace falta: la página usa módulos de JavaScript y **no funciona abriendo
   `index.html` con doble clic**.
   - Mac / Linux: `python3 servir.py 4360`
   - Windows: `py servir.py 4360` (o `python servir.py 4360`)
   - Si no hay Python: `npx --yes serve -l 4360 .`
   (`servir.py` es un servidor mínimo de Python que solo sirve esta carpeta y evita que el navegador guarde
   copias viejas.)

4. **Abrir** http://localhost:4360 en Chrome. Si se ve algo antiguo, recargar con Cmd+Shift+R
   (Ctrl+Shift+R en Windows).

## Qué tiene que verse (para comprobar que funciona; no para cambiarlo)

De arriba abajo, en este orden (es la misma estructura que revistatierrasanta.com):

1. **Entrada:** la cruz de Jerusalén se dibuja, los años corren de 1921 a hoy y el telón crema se abre en dos
   con una línea dorada.
2. **Cabecera:** logo, Inicio · Quiénes somos · Dónde estamos · Actualidad · Hemeroteca, y el botón Suscripciones.
3. **Banda de Jerusalén en relieve 3D** (se mueve con el ratón; en móvil se mece sola) y debajo el teletipo
   rojo «Última hora».
4. **Actualidad:** 2 noticias grandes + 4 pequeñas, con la columna de donación y enlaces de interés.
5. **Franja** «¡Deja tu huella en Tierra Santa!».
6. **Quiénes somos** con el sello que gira.
7. **Hemeroteca como estantería:** los 819 números de la revista de lomo, por décadas (1920–2020). La portada
   del centro (o el botón ▶) abre la página oficial de ese número en revistatierrasanta.com.
8. **Suscripciones:** tarjetas 3D que giran con el scroll. Delante, tarjeta de socio; detrás, billete del
   sorteo. Al pinchar la tarjeta se da la vuelta. Abajo, selector Amigo · Benefactor · Ordinaria · Protector.
9. **Pie** con los datos bancarios, botón «Copiar IBAN», la silueta de Jerusalén y «Tierra Santa» en grande.

Abrir la consola del navegador: **no debe haber errores**.

## Cómo está hecha (solo para entenderla)

- `index.html`: la página entera, con todos los textos.
- `css/tierra.css`: el diseño. `css/fuentes.css` + `fonts/`: las letras de su web (Taviraj y Montserrat), en local.
- `js/tierra.js`: entrada, cabecera, apariciones, teletipo, tarjetas de suscripción, cursor y copiar IBAN.
- `js/relieve.js`: la banda de Jerusalén en 3D (WebGL propio). Usa `img/marca/banner-jerusalen.jpg` y su
  mapa de profundidad `img/marca/banner-jerusalen-prof.png`.
- `js/hemeroteca.js` + `js/hemeroteca-datos.js`: la estantería y la lista de los 819 números.
  Portadas en `img/hemeroteca/`.
- `vendor/lenis.mjs`: desplazamiento suave (librería Lenis, licencia MIT), en local.
- `LEEME.md`: historial de lo que se hizo y por qué.
- Todo el contenido (textos, noticias, precios, portadas, datos de contacto y bancarios) es el de la web
  pública revistatierrasanta.com a fecha 27/11/2026. Los enlaces de noticias, revistas y «Suscribirme» llevan
  a esa web.
- No necesita internet para verse (salvo esos enlaces). No usa ningún servicio de pago.
