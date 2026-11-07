// Utilitários de interface: vocabulário das etapas, formatação e pedaços de HTML reutilizados.

export const ETAPAS = [
  { id: 'apresentado', nome: 'Apresentado', curto: 'Apresentado', n: 1, cor: 'var(--e1)', desc: 'Protocolado, ainda sem despacho a comissão.' },
  { id: 'comissoes', nome: 'Comissões', curto: 'Comissões', n: 2, cor: 'var(--e2)', desc: 'Em análise nas comissões da casa de origem.' },
  { id: 'plenario_origem', nome: 'Plenário', curto: 'Plenário', n: 3, cor: 'var(--e3)', desc: 'Pronto para pauta ou em votação no plenário da casa de origem.' },
  { id: 'casa_revisora', nome: 'Casa revisora', curto: 'Revisora', n: 4, cor: 'var(--e4)', desc: 'Enviado à outra casa do Congresso.' },
  { id: 'retorno_origem', nome: 'Volta à origem', curto: 'Retorno', n: 5, cor: 'var(--e4)', desc: 'Voltou à casa de origem para analisar emendas da revisora.' },
  { id: 'sancao', nome: 'Sanção', curto: 'Sanção', n: 6, cor: 'var(--e5)', desc: 'Enviado à sanção presidencial ou à promulgação.' },
  { id: 'lei', nome: 'Virou lei', curto: 'Lei', n: 7, cor: 'var(--e6)', desc: 'Transformado em norma jurídica.', terminal: true },
];
export const DESFECHOS = [
  { id: 'vetado', nome: 'Vetado', curto: 'Vetado', cor: 'var(--e-fim)', desc: 'Vetado totalmente (até o Congresso analisar o veto).', terminal: true },
  { id: 'arquivado', nome: 'Arquivado', curto: 'Arquivado', cor: 'var(--e-fim)', desc: 'Arquivado — pode ser desarquivado.', terminal: true },
  { id: 'retirado', nome: 'Retirado', curto: 'Retirado', cor: 'var(--e-fim)', desc: 'Retirado pelo autor ou declarado prejudicado.', terminal: true },
];
export const TODAS = [...ETAPAS, ...DESFECHOS];
export const ETAPA = Object.fromEntries(TODAS.map((e) => [e.id, e]));
export const TERMINAIS = new Set(['lei', 'vetado', 'arquivado', 'retirado']);
export const ORDEM_TRILHA = ETAPAS.map((e) => e.id);

// Siglas de órgãos mais comuns (o contrato só traz a sigla). Fallback: mostra a sigla.
export const ORGAOS = {
  PLEN: 'Plenário da Câmara', MESA: 'Mesa Diretora da Câmara', SF: 'Senado Federal', PR: 'Presidência da República', CN: 'Congresso Nacional',
  CCJC: 'Constituição e Justiça e de Cidadania', CFT: 'Finanças e Tributação', CSAUDE: 'Saúde', CE: 'Educação',
  CMADS: 'Meio Ambiente e Desenvolvimento Sustentável', CSPCCO: 'Segurança Pública e Combate ao Crime Organizado',
  CTRAB: 'Trabalho', CDEICS: 'Desenvolvimento Econômico', CCTI: 'Ciência, Tecnologia e Inovação', CCOM: 'Comunicação',
  CDC: 'Defesa do Consumidor', CDHMIR: 'Direitos Humanos, Minorias e Igualdade Racial', CAPADR: 'Agricultura, Pecuária, Abastecimento e Desenvolvimento Rural',
  CVT: 'Viação e Transportes', CPASF: 'Previdência, Assistência Social, Infância, Adolescência e Família', CDU: 'Desenvolvimento Urbano',
  CASP: 'Administração e Serviço Público', CESPO: 'Esporte', CCULT: 'Cultura', CESP: 'Comissão Especial', CMMPV: 'Comissão Mista da MP',
};
export const nomeOrgao = (s) => (s ? ORGAOS[s] || s : '—');
export const TIPOS = { PL: 'Projeto de Lei', PLP: 'Projeto de Lei Complementar', PEC: 'Proposta de Emenda à Constituição', MPV: 'Medida Provisória' };

// ---------- formatação (datas do contrato já vêm em BRT, sem hora) ----------
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export function parseData(s) {
  if (!s) return null;
  const [a, m, d] = s.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}
export function fmtData(s, { ano = true } = {}) {
  const d = parseData(s);
  if (!d) return '—';
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}${ano ? ' ' + d.getUTCFullYear() : ''}`;
}
// timestamps UTC (tramitações) exibidos em BRT
export function fmtDataHoraBRT(iso) {
  if (!iso) return '—';
  if (iso.length <= 10) return fmtData(iso);
  const d = new Date(iso);
  const f = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'short', year: 'numeric' });
  return f.format(d).replace(/ de /g, ' ').replace('.', '');
}
export const fmtN = (n) => (n == null ? '—' : Number(n).toLocaleString('pt-BR'));
export function diasEntre(a, b) {
  const da = parseData(a), db = b ? parseData(b) : null;
  if (!da || !db) return null;
  return Math.round((db - da) / 86400000);
}
export function fmtDuracao(dias) {
  if (dias == null) return '—';
  if (dias < 1) return 'menos de 1 dia';
  if (dias < 60) return `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  if (dias < 730) return `${Math.round(dias / 30.4)} meses`;
  const anos = dias / 365.25;
  return `${anos.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} anos`;
}
export const plural = (n, s, p) => `${fmtN(n)} ${n === 1 ? s : p}`;

// ---------- HTML ----------
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
// template tag: interpola com escape, exceto valores marcados com raw()
class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
export const raw = (s) => new Raw(s);
export function html(str, ...vals) {
  let out = '';
  str.forEach((s, i) => {
    out += s;
    if (i < vals.length) {
      const v = vals[i];
      if (v == null || v === false) return;
      if (Array.isArray(v)) out += v.map((x) => (x instanceof Raw ? x.s : esc(x))).join('');
      else out += v instanceof Raw ? v.s : esc(v);
    }
  });
  return raw(out);
}

export const ICONE = {
  seguir: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v16l-5-3.5L7 20z"/></svg>',
  seta: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
  externo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M18 14v5H5V6h5"/></svg>',
  volta: '<svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H6M11 6l-6 6 6 6"/></svg>',
};

export function etapaTag(id) {
  const e = ETAPA[id] || { nome: id, cor: 'var(--e-fim)' };
  const cls = id === 'lei' ? 'is-lei' : TERMINAIS.has(id) ? 'is-fim' : '';
  return html`<span class="etapa-tag ${cls}" style="--cor:${raw(e.cor)}"><i aria-hidden="true"></i>${e.nome}</span>`;
}

// Trilha-mini: posição da peça nas 7 casas; desfecho sem lei aparece como rótulo.
export function trilhaMini(etapa, etapasVividas) {
  const vividas = new Set(etapasVividas || []);
  const idx = ORDEM_TRILHA.indexOf(etapa);
  let ate = idx;
  if (idx < 0) {
    // desfecho: andou até a última etapa vivida (se soubermos) — senão, sem preenchimento
    ate = Math.max(-1, ...ORDEM_TRILHA.map((id, i) => (vividas.has(id) ? i : -1)));
  }
  const casas = ORDEM_TRILHA.filter((id) => id !== 'retorno_origem' || vividas.has('retorno_origem') || etapa === 'retorno_origem');
  const pos = (id) => ORDEM_TRILHA.indexOf(id);
  const spans = casas.map((id) => {
    let c = '';
    if (pos(id) < ate || (idx < 0 && pos(id) <= ate)) c = 'ok';
    if (id === etapa) c = 'agora';
    return `<span class="${c}" title="${esc(ETAPA[id].nome)}"></span>`;
  }).join('');
  const fim = ''; // o desfecho já aparece na etiqueta de etapa ao lado
  const label = idx < 0 ? `Desfecho: ${ETAPA[etapa]?.nome}` : `Etapa ${ETAPA[etapa].n} de 7: ${ETAPA[etapa].nome}`;
  return html`<span class="trilha-mini" role="img" aria-label="${label}">${raw(spans + fim)}</span>`;
}

export function contadorParado(p) {
  if (p.etapa === 'lei') return html`<span class="discreto">lei desde ${fmtData(p.ultima_movimentacao)}</span>`;
  if (TERMINAIS.has(p.etapa)) return html`<span class="discreto">desde ${fmtData(p.ultima_movimentacao)}</span>`;
  if (p.dias_parado == null) return '';
  if (p.dias_parado === 0) return html`<span class="discreto">movimentou hoje</span>`;
  if (p.dias_parado < 30) return html`<span class="discreto">movimentou há ${plural(p.dias_parado, 'dia', 'dias')}</span>`;
  return html`<span class="parado" title="Dias desde a última movimentação">parado há <b>${fmtN(p.dias_parado)}</b> dias</span>`;
}

export function botaoSeguir(id, seguindo, mini = false) {
  return html`<button type="button" class="btn btn--seguir ${mini ? 'btn--mini' : ''}" data-seguir="${id}" aria-pressed="${seguindo ? 'true' : 'false'}">${raw(ICONE.seguir)}<span>${seguindo ? 'Seguindo' : 'Seguir'}</span></button>`;
}

export function cartao(p, { seguindo = false, extra = '', resumo = true } = {}) {
  return html`<article class="cartao">
    <div class="cartao__topo">
      <a class="cartao__sigla" href="#/p/${p.id}">${p.sigla}</a>
      ${etapaTag(p.etapa)}
    </div>
    ${extra ? raw(String(extra)) : ''}
    ${resumo ? html`<p class="cartao__ementa">${p.ementa}</p>` : ''}
    <div class="cartao__pe">
      ${trilhaMini(p.etapa)}
      ${contadorParado(p)}
      <span style="margin-left:auto"></span>
      ${botaoSeguir(p.id, seguindo, true)}
    </div>
  </article>`;
}

export function vazio(texto) { return html`<p class="vazio">${texto}</p>`; }

// Anuncia mudanças para leitores de tela.
export function anunciar(t) { const a = document.getElementById('anuncio'); if (a) { a.textContent = ''; setTimeout(() => (a.textContent = t), 30); } }

// Seleção de semana ISO (AAAA-Www) a partir de uma data UTC
export function semanaISO(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dia = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dia);
  const ini = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const w = Math.ceil(((d - ini) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(w).padStart(2, '0')}`;
}
export function semanaAnterior(s, n = 1) {
  const [a, w] = s.split('-W').map(Number);
  // segunda-feira da semana ISO
  const j4 = new Date(Date.UTC(a, 0, 4));
  const seg = new Date(j4); seg.setUTCDate(j4.getUTCDate() - ((j4.getUTCDay() || 7) - 1) + (w - 1) * 7 - 7 * n);
  return semanaISO(seg);
}
