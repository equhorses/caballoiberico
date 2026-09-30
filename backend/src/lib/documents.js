// Lectura de documentación con IA (carta genealógica, certificado de libro, pasaporte equino / DIE).
// La IA SOLO propone datos: el titular los revisa y la presidencia acredita. Nunca inventa lo que no se lee.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { UPLOAD_DIR } = require('./common');
const { providers, callModel, parseJson } = require('./ai');

// Carpeta privada, FUERA de /uploads (que es pública)
const DOCS_DIR = process.env.DOCS_DIR || path.resolve(UPLOAD_DIR, '..', 'private-docs');
fs.mkdirSync(DOCS_DIR, { recursive: true });

const FIELDS = ['name', 'birthDate', 'sex', 'coat', 'breed', 'microchip', 'ueln', 'officialRegistry', 'studbook',
  'sireName', 'sireRegistry', 'damName', 'damRegistry', 'breederName', 'country'];

// Mueve el archivo subido por multer a la carpeta privada
function storePrivate(file) {
  const name = `${crypto.randomUUID()}${path.extname(file.originalname || '').toLowerCase() || '.bin'}`;
  const dest = path.join(DOCS_DIR, name);
  try { fs.renameSync(file.path, dest) } catch { fs.copyFileSync(file.path, dest); fs.unlinkSync(file.path) }
  return name;
}
const privatePath = (name) => path.join(DOCS_DIR, path.basename(name));

async function toImages(file, mime) {
  if (mime === 'application/pdf') {
    const { pdfToPng } = require('pdf-to-png-converter');
    const pages = await pdfToPng(file, { pagesToProcess: [1, 2], viewportScale: 2 });
    return pages.map((p) => `data:image/png;base64,${p.content.toString('base64')}`);
  }
  const { resizeImage } = require('./frames');
  return [(await resizeImage(file)) || `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`];
}

const ROLE_TEXT = {
  EJEMPLAR: 'el documento del PROPIO EJEMPLAR que se da de alta',
  PADRE: 'el documento del PADRE del ejemplar',
  MADRE: 'el documento de la MADRE del ejemplar',
};

function prompt(role) {
  return `Eres el asistente administrativo de C-IBERICO. Recibes ${ROLE_TEXT[role]}: puede ser una carta genealógica o certificado de un libro genealógico (ANCCE para PRE, APSL para PSL u otro), un pasaporte equino / DIE, o una ficha de C-IBERICO.
Lee SOLO lo que está escrito. Si un dato no aparece o no se lee con claridad, pon null. No deduzcas ni inventes nada.
Formato: fechas en AAAA-MM-DD; sex en MACHO, HEMBRA o CASTRADO; breed en PRE, PSL u OTRA (según el libro); nombres en MAYÚSCULAS tal como aparecen.
"officialRegistry" es el número del caballo del documento en su libro (con el nombre del libro delante si aparece, p. ej. "ANCCE 123456").
"sireRegistry"/"damRegistry" son los números del padre y de la madre si aparecen.
No devuelvas datos personales del propietario (nombre, DNI, dirección).
Responde SOLO con JSON válido:
{"docType":"carta genealógica ANCCE|certificado APSL|pasaporte equino|otro","legible":true,"fields":{${FIELDS.map((f) => `"${f}":null`).join(',')}},"notes":"lo que no se lee bien o parece raro"}`;
}

async function extract({ name, mime, role }) {
  const list = providers();
  if (!list.length) return { error: 'IA no configurada: rellena los datos a mano' };
  const p = list[0];
  try {
    const images = await toImages(privatePath(name), mime);
    const content = [{ type: 'text', text: prompt(role) }, ...images.map((url) => ({ type: 'image_url', image_url: { url } }))];
    const body = await callModel(p, { model: p.model, messages: [{ role: 'user', content }] });
    const out = parseJson(body.choices?.[0]?.message?.content);
    const fields = {};
    FIELDS.forEach((k) => { const v = out.fields?.[k]; fields[k] = v === undefined || v === '' ? null : v; });
    return { model: p.model, docType: out.docType || null, legible: out.legible !== false, fields, notes: out.notes || '' };
  } catch (e) {
    return { model: p.model, error: e.message };
  }
}

// Comparación documento ↔ datos declarados, para que el evaluador vea lo que no cuadra
const norm = (v) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const digits = (v) => String(v ?? '').replace(/\D/g, '');
function cmp(label, declared, read, mode = 'text') {
  if (!read) return { label, declared: declared || null, read: null, status: 'SIN_DATO' };
  if (!declared) return { label, declared: null, read, status: 'NO_DECLARADO' };
  const a = mode === 'num' ? digits(declared) : norm(declared);
  const b = mode === 'num' ? digits(read) : norm(read);
  return { label, declared, read, status: a && b && (a === b || (mode === 'text' && (a.includes(b) || b.includes(a)))) ? 'OK' : 'DISTINTO' };
}

function compare(horse, doc) {
  const f = doc.extracted?.fields;
  if (!f) return [];
  if (doc.role === 'PADRE') return [cmp('Nombre del padre', horse.sireName, f.name), cmp('Nº registro del padre', horse.sireRegistry, f.officialRegistry, 'num')];
  if (doc.role === 'MADRE') return [cmp('Nombre de la madre', horse.damName, f.name), cmp('Nº registro de la madre', horse.damRegistry, f.officialRegistry, 'num')];
  return [
    cmp('Nombre', horse.name, f.name),
    cmp('Fecha de nacimiento', horse.birthDate, f.birthDate, 'num'),
    cmp('Sexo', horse.sex, f.sex),
    cmp('Microchip', horse.microchip, f.microchip, 'num'),
    cmp('Nº libro oficial', horse.officialRegistry, f.officialRegistry, 'num'),
    cmp('Padre', horse.sireName, f.sireName),
    cmp('Madre', horse.damName, f.damName),
  ];
}

module.exports = { DOCS_DIR, storePrivate, privatePath, extract, compare, FIELDS };
