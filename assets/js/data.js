// Camada de dados. Formato: docs/contrato-dados.md (fase 1 + fase 2).
//
// casas.json lista as casas (Câmara, ALMG, CMBH), cada uma com a sua `base` e os `recursos` que já publica.
// O site só busca o que a casa declara — assim não há 404 no console por arquivo que ainda não existe.
// Modo exemplo: ?dados=exemplo usa data-exemplo/casas.json (dados fictícios das três casas).
import { semanaISO, semanaAnterior, parseData } from './ui.js';

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

const RECURSOS_FASE1 = ['proposicoes', 'semanas', 'estatisticas'];
export const modoExemplo = new URLSearchParams(location.search).get('dados') === 'exemplo';
let casas = [];
let casa = null;

export async function carregarCasas() {
  try {
    const j = await getJSON(modoExemplo ? 'data-exemplo/casas.json' : 'casas.json');
    casas = (j.casas || []).map((c) => ({ ...c, recursos: c.recursos || RECURSOS_FASE1 }));
  } catch (e) {
    // sem casas.json: comportamento da fase 1 (só a Câmara, data/ ou data-exemplo/)
    casas = [{ id: 'camara', nome: 'Câmara dos Deputados', curto: 'Câmara', base: modoExemplo ? 'data-exemplo/' : 'data/', membros: 513, bicameral: true, recursos: RECURSOS_FASE1 }];
  }
  return casas;
}
export const listaCasas = () => casas;
export const casaAtual = () => casa;
export const disponivel = (c) => (c?.recursos || []).includes('proposicoes');
export const tem = (recurso, c = casa) => (c?.recursos || []).includes(recurso);

// ---------- lista de proposições por casa ----------
const listas = new Map();
export async function usarCasa(id) {
  const c = casas.find((x) => x.id === id && disponivel(x)) || casas.find(disponivel);
  if (!c) throw new Error('Nenhuma casa com dados publicados ainda.');
  casa = c;
  if (!listas.has(c.id)) {
    listas.set(c.id, (async () => {
      const [json, res] = await Promise.all([
        getJSON(c.base + 'proposicoes.json'),
        tem('resumos', c) ? getJSON(c.base + 'resumos.json').catch(() => null)
          : tem('resumos_individuais', c) ? getJSON(c.base + 'resumos/index.json').catch(() => null) : null,
      ]);
      return prepararLista(json, c, res);
    })());
  }
  return listas.get(c.id);
}
export const lista = async () => (casa ? listas.get(casa.id) : null);

function prepararLista(json, c, resumosJson) {
  let props = json.proposicoes || [];
  // ?estresse=N (só no modo exemplo): replica peças para testar o tabuleiro em escala
  const n = Number(new URLSearchParams(location.search).get('estresse'));
  if (modoExemplo && n > props.length) {
    const orig = props;
    const etapas = ['apresentado', 'comissoes', 'comissoes', 'comissoes', 'arquivado', 'apresentado', 'plenario_origem', 'casa_revisora', 'arquivado', 'lei', 'retirado', 'sancao']
      .filter((e) => c.bicameral || e !== 'casa_revisora');
    props = [];
    for (let i = 0; i < n; i++) {
      const o = orig[i % orig.length];
      const ano = 2019 + (i % 8);
      props.push(i < orig.length ? o : { ...o, _clone: i, sigla: `${o.tipo} ${3000 + i}/${ano}`, numero: 3000 + i, ano, etapa: etapas[(i * 7) % etapas.length], dias_parado: (i * 37) % 2400, data_apresentacao: `${ano}-0${1 + (i % 9)}-1${i % 9}` });
    }
  }
  const resumos = new Map((resumosJson?.resumos || []).map((r) => [Number(r.id), r]));
  const porId = new Map(props.filter((p) => !p._clone).map((p) => [Number(p.id), p]));
  const temas = new Map(), partidos = new Map(), ufs = new Map(), tiposAutor = new Map();
  const anos = new Set();
  const conta = (m, k) => k && m.set(k, (m.get(k) || 0) + 1);
  for (const p of props) {
    const a = p.autor_principal || {};
    const r = resumos.get(Number(p.id));
    p._busca = normalizar(`${p.sigla} ${p.ementa} ${(p.tema || []).join(' ')} ${a.nome || ''} ${r?.titulo || ''}`);
    p._autor = normalizar(a.nome || '');
    for (const t of p.tema || []) conta(temas, t);
    conta(partidos, a.partido); conta(ufs, a.uf); conta(tiposAutor, a.tipo);
    if (p.ano) anos.add(p.ano);
  }
  const ordenar = (m) => [...m.entries()].sort((x, y) => y[1] - x[1]).map(([k]) => k);
  return {
    casa: c,
    gerado_em: json.gerado_em,
    proposicoes: props,
    porId,
    resumos,
    temas: ordenar(temas),
    partidos: [...partidos.keys()].sort((x, y) => x.localeCompare(y, 'pt-BR')),
    ufs: [...ufs.keys()].sort(),
    tiposAutor: ordenar(tiposAutor),
    anos: [...anos].sort((x, y) => y - x),
    tipos: [...new Set(props.map((p) => p.tipo))].sort(),
  };
}
export const normalizar = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const B = () => casa.base;
export const detalhe = (id) => getJSON(`${B()}proposicao/${id}.json`);
export const estatisticas = () => getJSON(`${B()}estatisticas.json`);
export const semana = (s) => getJSON(`${B()}semana/${s}.json`);
export const parlamentares = () => getJSON(`${B()}parlamentares.json`);
export const parlamentar = (id) => getJSON(`${B()}parlamentar/${id}.json`);
export async function resumo(id) {
  const l = await lista();
  const r = l?.resumos.get(Number(id)) || null;
  if (r?.tldr) return r;
  // resumos/index.json só traz o título; o TL;DR vem do arquivo individual (só busca se o índice tiver o id)
  if (r && tem('resumos_individuais')) return getJSON(`${B()}resumos/${id}.json`).catch(() => r);
  return r;
}

// Semanas disponíveis: semana/index.json (strings ou objetos {semana, inicio, fim, ...});
// sem índice, volta semana a semana a partir de gerado_em até a primeira que faltar (máx. 12).
const semanasP = new Map();
export function semanas() {
  const c = casa;
  if (semanasP.has(c.id)) return semanasP.get(c.id);
  const p = (async () => {
    try {
      const idx = await getJSON(`${c.base}semana/index.json`);
      const l = (idx.semanas || []).map((s) => (typeof s === 'string' ? { semana: s } : s)).filter((s) => s && s.semana);
      if (l.length) return l.sort((a, b) => (a.semana < b.semana ? 1 : -1));
    } catch (e) { /* sem índice */ }
    const l = await listas.get(c.id);
    let s = semanaISO(parseData(l?.gerado_em) || new Date());
    const achadas = [];
    for (let i = 0; i < 12; i++) {
      try { await semana(s); achadas.push({ semana: s }); } catch (e) { if (achadas.length) break; }
      s = semanaAnterior(s);
    }
    return achadas;
  })();
  semanasP.set(c.id, p);
  return p;
}

// ---------- seguir (localStorage), chave "casa:id" ----------
const CHAVE = 'lec:seguindo';
let seguidos = {};
try {
  seguidos = JSON.parse(localStorage.getItem(CHAVE) || '{}') || {};
  // migração da fase 1 (chave = id numérico, só Câmara)
  for (const k of Object.keys(seguidos)) if (!k.includes(':')) { seguidos[`camara:${k}`] = { casa: 'camara', ...seguidos[k] }; delete seguidos[k]; }
} catch (e) { seguidos = {}; }
const ouvintes = new Set();
function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(seguidos)); } catch (e) { /* modo privado: fica só na sessão */ }
  ouvintes.forEach((f) => f());
}
const chave = (id, c = casa?.id) => `${c}:${id}`;
export const seguindo = (id, c) => Object.prototype.hasOwnProperty.call(seguidos, chave(id, c));
export const listaSeguidos = () => seguidos;
export function alternarSeguir(id, p) {
  const k = chave(id);
  if (seguidos[k]) delete seguidos[k];
  else seguidos[k] = { casa: casa.id, id: Number(id), desde: new Date().toISOString().slice(0, 10), etapa: p?.etapa || null, sigla: p?.sigla || null, ementa: p?.ementa || null };
  salvar();
  return Boolean(seguidos[k]);
}
export const aoMudarSeguidos = (f) => ouvintes.add(f);
