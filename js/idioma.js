// TIERRA SANTA · textos del JavaScript en los 4 idiomas de la web (es, en, it, pt-BR).
// El idioma lo dice <html lang="…"> de cada página (la española en la raíz, las otras en en/, it/, pt-br/).
const COL = { en: 0, it: 1, pt: 2 }[(document.documentElement.lang || 'es').slice(0, 2).toLowerCase()];
export const IDIOMA = COL === undefined ? 'es' : ['en', 'it', 'pt'][COL];

// español → [inglés, italiano, portugués]; {x} se rellena al usarlo
const T = {
  'Década de {d}': ['The {d}s', 'Anni {d}', 'Década de {d}'],
  'Revista nº {n}': ['Issue no. {n}', 'Rivista n. {n}', 'Revista nº {n}'],
  'Nº {n}': ['No. {n}', 'N. {n}', 'Nº {n}'],
  'Leer la {t} completa en su web (se abre en otra pestaña)': ['Read {t} in full on its website (opens in a new tab)', 'Leggi la {t} completa sul suo sito (si apre in un’altra scheda)', 'Ler a {t} completa no site (abre em outra aba)'],
  'Ver revista': ['View issue', 'Vedi rivista', 'Ver revista'],
  'Arrastrar': ['Drag', 'Trascina', 'Arrastar'],
  'Toca la tarjeta para darle la vuelta': ['Tap the card to flip it', 'Tocca la tessera per girarla', 'Toque no cartão para virá-lo'],
  'IBAN copiado': ['IBAN copied', 'IBAN copiato', 'IBAN copiado'],
  'Copiar IBAN': ['Copy IBAN', 'Copia IBAN', 'Copiar IBAN'],
  'Escribe tu nombre.': ['Please enter your name.', 'Scrivi il tuo nome.', 'Escreva seu nome.'],
  'Escribe un email válido.': ['Please enter a valid email.', 'Scrivi un’email valida.', 'Escreva um e-mail válido.'],
  'Los dos emails no coinciden.': ['The two emails do not match.', 'Le due email non coincidono.', 'Os dois e-mails não coincidem.'],
  'Escribe el asunto.': ['Please enter the subject.', 'Scrivi l’oggetto.', 'Escreva o assunto.'],
  'Escribe tu mensaje.': ['Please write your message.', 'Scrivi il tuo messaggio.', 'Escreva sua mensagem.'],
  'Debes aceptar el tratamiento de protección de datos.': ['You must accept the data protection terms.', 'Devi accettare il trattamento dei dati.', 'Você deve aceitar o tratamento de proteção de dados.'],
  'Se ha abierto tu programa de correo con el mensaje. Solo falta pulsar «Enviar» allí.': ['Your email program has opened with the message. Just press “Send” there.', 'Si è aperto il tuo programma di posta con il messaggio. Basta premere «Invia».', 'Seu programa de e-mail foi aberto com a mensagem. Só falta clicar em “Enviar” lá.'],
};

export function t(es, v = {}) {
  const s = COL === undefined ? es : (T[es]?.[COL] ?? es);
  return s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
}

// meses de la hemeroteca («Noviembre – Diciembre 2025»)
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const OTROS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  it: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
  pt: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
};
const RE_MES = new RegExp(`\\b(${MESES.join('|')})\\b`, 'gi');
export function meses(txt) {
  if (!txt || IDIOMA === 'es') return txt;
  return txt.replace(RE_MES, (m) => OTROS[IDIOMA][MESES.findIndex((x) => x.toLowerCase() === m.toLowerCase())]);
}

// el selector de idioma recuerda la elección (así la portada en español no vuelve a mandar al inglés)
document.querySelectorAll('.ts-idiomas a[hreflang]').forEach((a) => a.addEventListener('click', () => {
  try { localStorage.setItem('ts-idioma', a.hreflang); } catch {}
  if (location.hash) a.href = a.href.split('#')[0] + location.hash;
}));
