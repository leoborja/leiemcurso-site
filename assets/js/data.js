// Camada de dados: lê site/data/ (coleta real) e cai para site/data-exemplo/ se a real não existir.
// Formato: docs/contrato-dados.md. Tudo em cache na memória da página.
import { semanaISO, semanaAnterior, parseData } from './ui.js';

const BASES = ['data/', 'data-exemplo/'];
let base = null;
const cache = new Map();

async function getJSON(caminho) {
  if (cache.has(caminho)) return cache.get(caminho);
  const p = fetch(caminho, { cache: 'no-cache' }).then((r) => {
    if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status} em ${caminho}`), { status: r.status });
    return r.json();
  });
  cache.set(caminho, p);
  p.catch(() => cache.delete(caminho));
  return p;
}

// Descobre qual base usar: a primeira que tiver proposicoes.json.
export async function iniciar() {
  for (const b of BASES) {
    try {
      const lista = await getJSON(b + 'proposicoes.json');
      base = b;
      return { base, exemplo: b !== 'data/', lista: prepararLista(lista) };
    } catch (e) { /* tenta a próxima */ }
  }
  throw new Error('Nenhuma base de dados encontrada (site/data/ nem site/data-exemplo/).');
}

let listaPronta = null;
function prepararLista(json) {
  let props = json.proposicoes || [];
  // Modo estresse (só com dados de exemplo): ?estresse=5000 replica peças para testar o tabuleiro em escala.
  const q = new URLSearchParams(location.search);
  const n = Number(q.get('estresse'));
  if (base !== 'data/' && n > props.length) {
    const orig = props;
    const etapas = ['apresentado', 'comissoes', 'comissoes', 'comissoes', 'arquivado', 'apresentado', 'plenario_origem', 'casa_revisora', 'arquivado', 'lei', 'retirado', 'sancao'];
    props = [];
    for (let i = 0; i < n; i++) {
      const o = orig[i % orig.length];
      const ano = 2019 + (i % 8);
      const etapa = i < orig.length ? o.etapa : etapas[(i * 7) % etapas.length];
      props.push(i < orig.length ? o : { ...o, id: o.id, _clone: i, sigla: `${o.tipo} ${3000 + i}/${ano}`, numero: 3000 + i, ano, etapa, dias_parado: (i * 37) % 2400, data_apresentacao: `${ano}-0${1 + (i % 9)}-1${i % 9}` });
    }
  }
  const porId = new Map(props.filter((p) => !p._clone).map((p) => [p.id, p]));
  const temas = new Map();
  const anos = new Set();
  for (const p of props) {
    p._busca = `${p.sigla} ${p.ementa} ${(p.tema || []).join(' ')} ${p.autor_principal?.nome || ''}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    for (const t of p.tema || []) temas.set(t, (temas.get(t) || 0) + 1);
    if (p.ano) anos.add(p.ano);
  }
  listaPronta = {
    gerado_em: json.gerado_em,
    proposicoes: props,
    porId,
    temas: [...temas.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t),
    anos: [...anos].sort((a, b) => b - a),
    tipos: [...new Set(props.map((p) => p.tipo))].sort(),
  };
  return listaPronta;
}
export const lista = () => listaPronta;
export const normalizar = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export const detalhe = (id) => getJSON(`${base}proposicao/${id}.json`);
export const estatisticas = () => getJSON(`${base}estatisticas.json`);
export const semana = (s) => getJSON(`${base}semana/${s}.json`);

// Semanas disponíveis: usa semana/index.json se existir (proposta de extensão do contrato);
// senão, volta semana a semana a partir de gerado_em até a primeira que faltar (máx. 12).
let semanasP = null;
export function semanas() {
  if (semanasP) return semanasP;
  semanasP = (async () => {
    try {
      const idx = await getJSON(`${base}semana/index.json`);
      // aceita ["2026-W45", ...] (exemplo) ou [{semana: "2026-W45", ...}, ...] (coleta real)
      const lista = (idx.semanas || []).map((s) => (typeof s === 'string' ? s : s && s.semana)).filter(Boolean);
      if (lista.length) return [...lista].sort().reverse();
    } catch (e) { /* sem índice */ }
    const ref = parseData(listaPronta?.gerado_em) || new Date();
    let s = semanaISO(ref);
    const achadas = [];
    for (let i = 0; i < 12; i++) {
      try { await semana(s); achadas.push(s); } catch (e) { if (achadas.length) break; }
      s = semanaAnterior(s);
    }
    return achadas;
  })();
  return semanasP;
}

// ---------- seguir (localStorage) ----------
const CHAVE = 'lec:seguindo';
let seguidos = {};
try { seguidos = JSON.parse(localStorage.getItem(CHAVE) || '{}') || {}; } catch (e) { seguidos = {}; }
const ouvintes = new Set();
function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(seguidos)); } catch (e) { /* modo privado: fica só na sessão */ }
  ouvintes.forEach((f) => f());
}
export const seguindo = (id) => Object.prototype.hasOwnProperty.call(seguidos, id);
export const listaSeguidos = () => seguidos;
export function alternarSeguir(id) {
  const p = listaPronta?.porId.get(Number(id));
  if (seguindo(id)) delete seguidos[id];
  else seguidos[id] = { desde: new Date().toISOString().slice(0, 10), etapa: p?.etapa || null };
  salvar();
  return seguindo(id);
}
export const aoMudarSeguidos = (f) => ouvintes.add(f);
