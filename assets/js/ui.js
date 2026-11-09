// Utilitários de interface: vocabulário das etapas, formatação, links por casa e pedaços de HTML reutilizados.

// Estado de interface compartilhado (preenchido por app.js a cada rota)
export const estado = { casa: null, seguindo: () => false, temParlamentares: false };

export const ETAPAS = [
  { id: 'apresentado', nome: 'Apresentado', n: 1, cor: 'var(--e1)', desc: 'Protocolado, ainda sem despacho a comissão.' },
  { id: 'comissoes', nome: 'Comissões', n: 2, cor: 'var(--e2)', desc: 'Em análise nas comissões da casa de origem.' },
  { id: 'plenario_origem', nome: 'Plenário', n: 3, cor: 'var(--e3)', desc: 'Pronto para pauta ou em votação no plenário.' },
  { id: 'casa_revisora', nome: 'Casa revisora', n: 4, cor: 'var(--e4)', desc: 'Enviado à outra casa do Congresso.', bicameral: true },
  { id: 'retorno_origem', nome: 'Volta à origem', n: 5, cor: 'var(--e4)', desc: 'Voltou à casa de origem para analisar emendas da revisora.', bicameral: true },
  { id: 'sancao', nome: 'Sanção', n: 6, cor: 'var(--e5)', desc: 'Enviado à sanção do Executivo ou à promulgação.' },
  { id: 'lei', nome: 'Virou lei', n: 7, cor: 'var(--e6)', desc: 'Transformado em norma jurídica.', terminal: true },
];
export const DESFECHOS = [
  { id: 'vetado', nome: 'Vetado', cor: 'var(--e-fim)', desc: 'Vetado totalmente (até o Legislativo analisar o veto).', terminal: true },
  { id: 'arquivado', nome: 'Arquivado', cor: 'var(--e-fim)', desc: 'Arquivado — pode ser desarquivado.', terminal: true },
  { id: 'retirado', nome: 'Retirado', cor: 'var(--e-fim)', desc: 'Retirado pelo autor ou declarado prejudicado.', terminal: true },
];
export const TODAS = [...ETAPAS, ...DESFECHOS];
export const ETAPA = Object.fromEntries(TODAS.map((e) => [e.id, e]));
export const TERMINAIS = new Set(['lei', 'vetado', 'arquivado', 'retirado']);

// Etapas da casa atual, numeradas em sequência (unicamerais não têm revisora/retorno)
export function etapasDaCasa(c = estado.casa) {
  const bi = c ? c.bicameral !== false : true;
  return ETAPAS.filter((e) => bi || !e.bicameral).map((e, i) => ({ ...e, n: i + 1, desc: e.id === 'sancao' && c?.executivo ? `Enviado à sanção do ${c.executivo} ou à promulgação.` : e.desc }));
}

// Links: a Câmara fica na raiz (#/tabuleiro); as outras casas levam prefixo (#/almg/tabuleiro)
export function href(caminho, c = estado.casa) {
  const id = c?.id || 'camara';
  return `#${id === 'camara' ? '' : '/' + id}${caminho}`;
}

// Siglas de órgãos comuns (o contrato só traz a sigla). Fallback: a própria sigla.
export const ORGAOS = {
  PLEN: 'Plenário', MESA: 'Mesa Diretora', SF: 'Senado Federal', PR: 'Presidência da República', CN: 'Congresso Nacional',
  GOV: 'Governador', PREF: 'Prefeito',
  CCJC: 'Constituição e Justiça e de Cidadania', CFT: 'Finanças e Tributação', CSAUDE: 'Saúde', CE: 'Educação',
  CMADS: 'Meio Ambiente e Desenvolvimento Sustentável', CSPCCO: 'Segurança Pública e Combate ao Crime Organizado',
  CTRAB: 'Trabalho', CDEICS: 'Desenvolvimento Econômico', CCTI: 'Ciência, Tecnologia e Inovação', CCOM: 'Comunicação',
  CDC: 'Defesa do Consumidor', CDHMIR: 'Direitos Humanos, Minorias e Igualdade Racial', CAPADR: 'Agricultura, Pecuária, Abastecimento e Desenvolvimento Rural',
  CVT: 'Viação e Transportes', CPASF: 'Previdência, Assistência Social, Infância, Adolescência e Família', CDU: 'Desenvolvimento Urbano',
  CASP: 'Administração e Serviço Público', CESPO: 'Esporte', CCULT: 'Cultura', CESP: 'Comissão Especial', CMMPV: 'Comissão Mista da MP',
  CICS: 'Indústria, Comércio e Serviços', CREDN: 'Relações Exteriores e de Defesa Nacional', CINDRE: 'Integração Nacional e Desenvolvimento Regional',
  CMULHER: 'Defesa dos Direitos da Mulher', CPD: 'Defesa dos Direitos das Pessoas com Deficiência', CPOVOS: 'Amazônia e dos Povos Originários e Tradicionais',
  CTUR: 'Turismo', CME: 'Minas e Energia', CFFC: 'Fiscalização Financeira e Controle',
  ESPECIAL: 'Comissão Especial', CCJ: 'Constituição e Justiça', FFO: 'Fiscalização Financeira e Orçamentária', CLJ: 'Legislação e Justiça', ORCFIN: 'Orçamento e Finanças Públicas',
};
export const nomeOrgao = (s) => (s ? ORGAOS[s] || s : '—');
export const TIPOS = {
  PL: 'Projeto de Lei', PLP: 'Projeto de Lei Complementar', PLC: 'Projeto de Lei Complementar', PEC: 'Proposta de Emenda à Constituição',
  MPV: 'Medida Provisória', PELO: 'Proposta de Emenda à Lei Orgânica',
};

// ---------- formatação (datas do contrato já vêm em BRT, sem hora) ----------
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export function parseData(s) {
  if (!s) return null;
  const [a, m, d] = String(s).slice(0, 10).split('-').map(Number);
  if (!a || !m || !d) return null;
  return new Date(Date.UTC(a, m - 1, d));
}
export function fmtData(s, { ano = true } = {}) {
  const d = parseData(s);
  if (!d) return '—';
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}${ano ? ' ' + d.getUTCFullYear() : ''}`;
}
export function fmtDataHoraBRT(iso) {
  if (!iso) return '—';
  if (String(iso).length <= 10) return fmtData(iso);
  const f = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'short', year: 'numeric' });
  return f.format(new Date(iso)).replace(/ de /g, ' ').replace('.', '');
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
  return `${(dias / 365.25).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} anos`;
}
export const plural = (n, s, p) => `${fmtN(n)} ${n === 1 ? s : p}`;

// ---------- semanas ISO ----------
export function semanaISO(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dia = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dia);
  const ini = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const w = Math.ceil(((d - ini) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(w).padStart(2, '0')}`;
}
function segundaDaSemana(s) {
  const [a, w] = s.split('-W').map(Number);
  const j4 = new Date(Date.UTC(a, 0, 4));
  const seg = new Date(j4);
  seg.setUTCDate(j4.getUTCDate() - ((j4.getUTCDay() || 7) - 1) + (w - 1) * 7);
  return seg;
}
export function semanaAnterior(s, n = 1) {
  const seg = segundaDaSemana(s);
  seg.setUTCDate(seg.getUTCDate() - 7 * n);
  return semanaISO(seg);
}
const isoData = (d) => d.toISOString().slice(0, 10);
export function intervaloSemana(s) {
  const seg = segundaDaSemana(s);
  const dom = new Date(seg); dom.setUTCDate(seg.getUTCDate() + 6);
  return { inicio: isoData(seg), fim: isoData(dom) };
}
// "2 a 8 nov 2026" · "27 out a 2 nov 2026" · "29 dez 2025 a 4 jan 2026"
export function fmtIntervalo(inicio, fim) {
  const a = parseData(inicio), b = parseData(fim);
  if (!a || !b) return '';
  const mesmoAno = a.getUTCFullYear() === b.getUTCFullYear();
  const mesmoMes = mesmoAno && a.getUTCMonth() === b.getUTCMonth();
  const ini = mesmoMes ? `${a.getUTCDate()}` : mesmoAno ? fmtData(inicio, { ano: false }) : fmtData(inicio);
  return `${ini} a ${fmtData(fim)}`;
}
// "Semana 45 · 2 a 8 nov 2026"
export function rotuloSemana(s, inicio, fim) {
  const iv = inicio && fim ? { inicio, fim } : intervaloSemana(s);
  return `Semana ${Number(s.split('-W')[1])} · ${fmtIntervalo(iv.inicio, iv.fim)}`;
}

// ---------- HTML ----------
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
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
  seta: '<svg viewBox="0 0 24 24" aria-hidden="true" class="ic-seta"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
  externo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M18 14v5H5V6h5"/></svg>',
  volta: '<svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H6M11 6l-6 6 6 6"/></svg>',
  filtro: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
  link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  auto: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3z"/></svg>',
};

export function etapaTag(id) {
  const e = ETAPA[id] || { nome: id, cor: 'var(--e-fim)' };
  const cls = id === 'lei' ? 'is-lei' : TERMINAIS.has(id) ? 'is-fim' : '';
  return html`<span class="etapa-tag ${cls}" style="--cor:${raw(e.cor)}"><i aria-hidden="true"></i>${e.nome}</span>`;
}

// Trilha-mini: posição da peça nas casas do tabuleiro da casa atual.
export function trilhaMini(etapa, etapasVividas) {
  const vividas = new Set(etapasVividas || []);
  const ordem = etapasDaCasa().map((e) => e.id);
  const idx = ordem.indexOf(etapa);
  let ate = idx;
  if (idx < 0) ate = Math.max(-1, ...ordem.map((id, i) => (vividas.has(id) ? i : -1)));
  const casas = ordem.filter((id) => id !== 'retorno_origem' || vividas.has('retorno_origem') || etapa === 'retorno_origem');
  const pos = (id) => ordem.indexOf(id);
  const spans = casas.map((id) => {
    let c = '';
    if (pos(id) < ate || (idx < 0 && pos(id) <= ate)) c = 'ok';
    if (id === etapa) c = 'agora';
    return `<span class="${c}" title="${esc(ETAPA[id].nome)}"></span>`;
  }).join('');
  const label = idx < 0 ? `Desfecho: ${ETAPA[etapa]?.nome || etapa}` : `Etapa ${idx + 1} de ${ordem.length}: ${ETAPA[etapa].nome}`;
  return html`<span class="trilha-mini" role="img" aria-label="${label}">${raw(spans)}</span>`;
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

export function seloResumo() {
  return html`<span class="selo-ia" title="Texto gerado automaticamente a partir da ementa e da tramitação; pode conter imprecisões. Confira a fonte oficial.">${raw(ICONE.auto)}resumo automático</span>`;
}

// Cartão de proposição. Com resumo: a frase principal vira o título e a ementa oficial fica abaixo.
export function cartao(p, { extra = '', resumo = null } = {}) {
  const autor = p.autor_principal;
  return html`<article class="cartao">
    <div class="cartao__topo">
      <a class="cartao__sigla" href="${href('/p/' + p.id)}">${p.sigla}</a>
      ${etapaTag(p.etapa)}
    </div>
    ${extra ? raw(String(extra)) : ''}
    ${resumo
      ? html`<p class="cartao__titulo">${resumo.titulo}</p><p class="cartao__ementa cartao__ementa--sec">${p.ementa}</p><span>${seloResumo()}</span>`
      : html`<p class="cartao__ementa">${p.ementa}</p>`}
    <div class="cartao__pe">
      ${trilhaMini(p.etapa)}
      ${contadorParado(p)}
      ${autor?.nome ? html`<span class="cartao__autor" title="Autoria">${autor.nome}${autor.partido ? html` <small>${autor.partido}${autor.uf ? '-' + autor.uf : ''}</small>` : ''}</span>` : ''}
      <span class="empurra"></span>
      ${botaoSeguir(p.id, estado.seguindo(p.id), true)}
    </div>
  </article>`;
}

export function vazio(texto) { return html`<p class="vazio">${texto}</p>`; }

// Iniciais para avatar sem foto (neutro, sem cor de partido)
export function avatar(nome, foto, tam = 48) {
  const ini = String(nome || '?').split(/\s+/).filter(Boolean).map((s) => s[0]).filter((c) => /[A-ZÀ-Ú]/i.test(c)).slice(0, 2).join('').toUpperCase();
  if (foto) return html`<img class="avatar" src="${foto}" alt="" width="${tam}" height="${tam}" loading="lazy" style="width:${tam}px;height:${tam}px">`;
  return html`<span class="avatar avatar--ini" aria-hidden="true" style="width:${tam}px;height:${tam}px;font-size:${Math.round(tam * 0.38)}px">${ini}</span>`;
}

export function anunciar(t) { const a = document.getElementById('anuncio'); if (a) { a.textContent = ''; setTimeout(() => (a.textContent = t), 30); } }
export const reduzMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const rolarPara = (el) => el?.scrollIntoView({ block: 'start', behavior: reduzMovimento() ? 'auto' : 'smooth' });

// Paginação simples: devolve HTML do botão "mostrar mais" (ou vazio)
export function botaoMais(id, resta, passo) {
  return resta > 0 ? `<div class="mais"><button class="btn" type="button" data-mais="${esc(id)}">Mostrar mais ${Math.min(resta, passo)} <span class="mudo">de ${fmtN(resta)}</span></button></div>` : '';
}

// "deputado"/"deputados estaduais"/"vereadores" conforme a casa
export function nomeParl(casa, n = 2) {
  const m = { Deputado: ['deputado', 'deputados'], 'Deputado Estadual': ['deputado estadual', 'deputados estaduais'], Vereador: ['vereador', 'vereadores'], Senador: ['senador', 'senadores'] }[casa?.parlamentar] || ['parlamentar', 'parlamentares'];
  return n === 1 ? m[0] : m[1];
}
