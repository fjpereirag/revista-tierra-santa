# Revista Tierra Santa · demo de rediseño (Collective)

Rediseño de la portada de https://revistatierrasanta.com/ **sin cambiar su estructura**:
cabecera con los mismos 5 enlaces + Suscripciones → banda de Jerusalén → Actualidad (2 grandes + 4 pequeñas,
con la columna de donación y enlaces de interés) → «¡Deja tu huella en Tierra Santa!» → Quiénes somos + Hemeroteca
→ las 4 suscripciones → pie con los datos del banco.

Qué se ha mejorado: entrada con la cruz de Jerusalén y los años 1921→hoy, banda con movimiento, fotos que se
descubren al bajar, noticias que se inclinan con el ratón, abanico con las 6 últimas portadas de la revista,
**suscripciones en tarjetas 3D que giran con el scroll** (la misma mecánica que Meta Ads de collective-ia.com y
las tarjetas de Capital Home) y botón para copiar el IBAN.

- Abrir en local: vista previa `tierra-santa` (Desktop/.claude/launch.json) o `python3 servir.py` → http://localhost:4360
- Todo el contenido (textos, noticias, precios, fotos, datos del banco) es el SUYO, sacado de su web pública el 27/11/2026.
- Los enlaces de noticias, revistas y «Suscribirme» llevan a su web real (se abren en otra pestaña).
- Solo está la PORTADA. Las páginas interiores (Quiénes somos, Dónde estamos, Actualidad, Hemeroteca, Suscripciones, Donaciones) no están hechas.
- Letras: Taviraj + Montserrat (las de su web, Google Fonts, licencia libre) servidas en local.
- `_origen/` = originales sin aligerar. Sin publicar.

## v2 · «salto de calidad» (27/11/2026, tarde)
Copia de la v1 en `_copias/v1-27nov.tgz`. Vídeo del recorrido: `_capturas/v2/recorrido-v2.mp4`.
- Entrada: la cruz se dibuja, los años corren 1921→hoy y el telón crema se rasga en dos con una línea dorada.
- Banda de Jerusalén en **relieve 3D** (WebGL propio, `js/relieve.js`): su misma foto + mapa de profundidad sacado
  en este Mac con Depth-Anything-V2-Small (`img/marca/banner-jerusalen-prof.png`: R = relieve suave para mover,
  G = relieve fino para la luz). Se mueve con el ratón; en móvil se mece sola. Sin créditos gastados.
- Teletipo «Última hora» con sus 8 últimos titulares (se acelera al hacer scroll).
- Scroll suave (Lenis, `vendor/lenis.mjs`, licencia MIT), cursor propio con etiquetas («Leer», «Abrir», «Elegir»),
  botones magnéticos, títulos que suben palabra a palabra, barra de lectura bajo la cabecera.
- Sello giratorio «Revista fundada en 1921 · La revista de los Santos Lugares» en Quiénes somos.
- Tarjetas de suscripción: la revista flota por delante de la tarjeta en 3D, canto dorado y dorso como papeleta crema del sorteo.
- Pie con la silueta de Jerusalén (sacada del relieve, `img/marca/skyline.png`) y «Tierra Santa» gigante.

## Hemeroteca = estantería (27/11/2026, noche)
Pedido de Mario: la Hemeroteca «como la estantería de los libros para emprender» (Collective, ~/Documents/Codex/2026-11-16/.../estanteria-emprendedora.html).
- Ahora es una sección propia a pantalla completa, justo después de Quiénes somos (antes era la cajita de la derecha; Quiénes somos queda a todo el ancho).
- `js/hemeroteca.js` (misma mecánica: lomos en fila, el elegido gira y enseña la portada, pestañas, rótulo que cambia, arrastre, flechas, teclado, rueda horizontal) + `js/hemeroteca-datos.js` (los **819 números** de su web).
- **Cada portada (y el botón ▶) abre directamente la página oficial de ese número** en su web (pedido de Mario). Un clic en un lomo lo saca al centro. «Leer la revista» del rótulo lleva al mismo sitio.
- Pestañas = las 11 décadas de su propio filtro (1920 … 2020); las cuentas coinciden con su web (94, 117, 23, 111, 102, 92, 65, 60, 59, 60, 36).
- Portadas: las suyas, aligeradas a webp en `img/hemeroteca/` (818; el nº 874 no tiene portada pública y lleva una diseñada). El color de cada lomo sale de su portada.
- Meses y año solo cuando vienen en el nombre de su archivo (71 números); si no, se pone la década.
- Correcciones de sus datos: 12 números recientes están titulados con la numeración de serie nueva («nº 60» = 873; se suma 813, como 897 = TS-84). Hay dos «324» y dos «391» repetidos en su web: se dejan los dos.
- Solo existen en la página los ~50 lomos que se ven (se reciclan al girar). Lomo y portada van como piezas hermanas: anidadas, Safari no pintaba la portada.
- Vídeo: `_capturas/v3/hemeroteca-estanteria.mp4`.

## Suscripciones v3 (27/11/2026, noche) — «que lo de dentro de la tarjeta sea más significativo y más interactivo»
Copia de antes en `_copias/v3-antes-tarjetas-27nov.tgz`. Vídeo: `_capturas/v4/suscripciones-tarjetas.mp4`.
- Cara = tarjeta de socio: chip dorado con la cruz de Jerusalén, «Revista Tierra Santa», nivel en cruces
  (Ordinaria 1 · Amigo 2 · Benefactor 3 · Protector 4, por aportación), grabado de líneas finas, horizonte de
  Jerusalén, precio, «6 revistas al año» (se edita cada dos meses) y «Sorteo de viajes» / «También en PDF».
  Brillo holográfico que sigue al ratón (sin mezcla de colores: en Safari salía arcoíris).
- Dorso = billete del sorteo anual de viajes a Tierra Santa: «Tu suscripción → Tierra Santa» con un avión
  que vuela por el arco, suscripción, aportación, sorteo (Incluido / Opcional · +12,00 €), talón con código de barras.
- Pinchar la tarjeta del centro la gira (vuelve a girar con otro clic); el selector de abajo (Amigo · Benefactor ·
  Ordinaria · Protector) lleva a cada una; la luz del fondo cambia de color con cada suscripción.

## Arreglos de revisión (27/11/2026, tarde)
- Menú del móvil: cerrado ya no está «presente» (antes el `display:flex` del CSS anulaba el `hidden`, y en el ordenador
  había 6 paradas invisibles del tabulador y el lector de pantalla leía el menú dos veces). La tecla Esc lo cierra.
- Teletipo: las copias de los titulares no reciben el foco ni las lee el lector de pantalla, también al redimensionar.
- Hemeroteca: el nº 834 es «Mayo – Junio 2015» (venía 2014 en el nombre de su archivo).
- No arrancaba al abrir `index.html` con doble clic (file://: el navegador bloquea los módulos). Nuevo `ABRIR-WEB.bat`:
  doble clic → arranca `servir.py` y abre http://localhost:4360. Si se abre con doble clic, la entrada lo avisa.
- Móvil: los enlaces del menú (botón de dos rayas) no llevaban a ninguna parte: con el menú abierto el desplazamiento
  suave (Lenis) está parado e ignoraba el salto. Ahora se reactiva antes de saltar (`js/tierra.js`).
- Quiénes somos y Dónde estamos puestos al día con el contenido de sus páginas interiores (27/11/2026):
  equipo (Fray Luis Quintana Giménez, María Díaz-Ripoll Lozano, Cayetana H. Johnson, María José Villegas; fotos en
  `img/equipo/`), botones «Haz una donación» y «Suscripciones», y sección propia «Contacta con nosotros» con su
  formulario, dirección, emails de Redacción y Suscripciones, teléfono, Ley 49/2002, NIE y Depósito legal/ISSN.
  El formulario abre el correo del visitante dirigido a direccion@revistatierrasanta.com (aquí no hay servidor).

## Panel de actualización (27/11/2026, noche) — para mantener la portada sin tocar código
- Doble clic en `ACTUALIZAR-WEB.bat` → se abre el panel en el navegador (http://localhost:4361/panel/). No cerrar la ventana negra.
- 1 · «Buscar novedades»: lee en revistatierrasanta.com (su API de WordPress) las noticias y revistas que faltan y las añade
  con su foto/portada. Si su web no deja leerla, se añaden a mano con los formularios.
- 2 · Noticias: añadir, cambiar o quitar. Se ordenan por fecha: 2 grandes, 4 pequeñas, 8 en el teletipo.
- 3 · Revistas: añadir el número nuevo (portada, meses, año); el contador de la hemeroteca se actualiza solo.
- 4 · Publicar: «Preparar archivos para subir» deja en `para-subir/` SOLO lo que ha cambiado, con sus carpetas.
  Se sube todo lo de dentro a `public_html` del alojamiento y a GitHub.
- «Deshacer el último cambio»: cada cambio guarda antes una copia en `copias/`.
- Cómo funciona: `datos/noticias.json` = las noticias; `herramientas/portada.py` rehace en `index.html` solo las zonas de
  noticias, teletipo, «Lo último» y el contador; `herramientas/panel.py` = el servidor local del panel; `panel/index.html` = la pantalla.
- No hace falta subir a la web ni a GitHub las carpetas `copias/` ni `para-subir/`.

## Panel v2 (27/11/2026, noche): escribir noticias y subir con un clic
- Noticia nueva: título, fecha, foto, entradilla y **texto**. El panel crea su página propia (`noticias/AAAA-MM-DD-titulo.html`,
  con el diseño de la web) y la pone en portada. Casilla «Publicarla también en WordPress»: la crea como entrada en su
  WordPress (con la foto destacada) y la portada enlaza a ella. Al «Cambiar» la noticia se actualiza la misma entrada.
  Quitarla de la portada NO la borra de WordPress.
- Paso 4 «Subir»: botón **Subir a GitHub** (un solo commit con solo lo cambiado) y **Subir al servidor de la revista** (FTP/FTPS
  a `public_html`). Cada destino recuerda lo que ya tiene (`datos/subido-github.json`, `datos/subido-ftp.json`).
  «Subir a mano» (carpeta `para-subir`) queda como alternativa.
- Paso 5 «Conexiones»: GitHub (token con permiso Contents: Read and write), FTP y WordPress (contraseña de aplicación).
  Se guardan en `%APPDATA%\PanelRevistaTierraSanta\ajustes.json`, FUERA de esta carpeta: nunca se suben.
- Código: `herramientas/conexiones.py` (GitHub por su API, FTP con ftplib, WordPress por su API REST). Solo Python estándar.
- Ajuste (27/11, 19:40): el panel guarda como máximo 8 noticias (al añadir una nueva sale de portada la más antigua;
  su página no se borra) y solo muestra/gestiona las 2 últimas revistas (la hemeroteca completa sigue entera).
  Noticias con «Imágenes adjuntas» (hasta 20): galería con visor en su página y galería en la entrada de WordPress.
