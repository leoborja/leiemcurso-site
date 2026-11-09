// Filtros compartilhados (tabuleiro, semana): busca + painel + chips ativos. O estado vive na URL.
import { html, raw, esc, ICONE, TIPOS, ETAPA, DESFECHOS, etapasDaCasa, fmtN, plural, TERMINAIS } from './ui.js';
import { normalizar } from './data.js';

export const PARADO = [
  { v: '30', nome: 'mais de 30 dias' }, { v: '90', nome: 'mais de 3 meses' }, { v: '180', nome: 'mais de 6 meses' },
  { v: '365', nome: 'mais de 1 ano' }, { v: '730', nome: 'mais de 2 anos' },
];
export const ORDENS = {
  parado: { nome: 'Mais tempo paradas', cmp: (a, b) => (TERMINAIS.has(a.etapa) - TERMINAIS.has(b.etapa)) || ((b.dias_parado ?? -1) - (a.dias_parado ?? -1)) },
  recente: { nome: 'Movimentação mais recente', cmp: (a, b) => (a.ultima_movimentacao < b.ultima_movimentacao ? 1 : a.ultima_movimentacao > b.ultima_movimentacao ? -1 : 0) },
  nova: { nome: 'Apresentação mais recente', cmp: (a, b) => (a.data_apresentacao < b.data_apresentacao ? 1 : a.data_apresentacao > b.data_apresentacao ? -1 : 0) },
  antiga: { nome: 'Apresentação mais antiga', cmp: (a, b) => (a.data_apresentacao > b.data_apresentacao ? 1 : a.data_apresentacao < b.data_apresentacao ? -1 : 0) },
};
const CAMPOS = ['q', 'tipo', 'tema', 'etapa', 'ano', 'partido', 'uf', 'autoria', 'autor', 'parado'];

export function lerEstado(query, padrao = {}) {
  const st = { ordem: 'parado', ...padrao };
  for (const k of [...CAMPOS, 'ordem']) if (query.get(k)) st[k] = query.get(k);
  return st;
}
export function paraQuery(st, extra = {}, padrao = {}) {
  const q = new URLSearchParams();
  for (const k of CAMPOS) if (st[k]) q.set(k, st[k]);
  if (st.ordem && st.ordem !== (padrao.ordem || 'parado')) q.set('ordem', st.ordem);
  for (const [k, v] of Object.entries(extra)) if (v) q.set(k, v);
  return q;
}

export function predicado(st, { ignorarEtapa = false } = {}) {
  const termos = normalizar(st.q || '').split(/\s+/).filter(Boolean);
  const autor = normalizar(st.autor || '').trim();
  const ano = Number(st.ano), parado = Number(st.parado);
  return (p) => {
    const a = p.autor_principal || {};
    return (!st.tipo || p.tipo === st.tipo)
      && (!st.tema || (p.tema || []).includes(st.tema))
      && (ignorarEtapa || !st.etapa || p.etapa === st.etapa)
      && (!ano || p.ano === ano)
      && (!st.partido || a.partido === st.partido)
      && (!st.uf || a.uf === st.uf)
      && (!st.autoria || a.tipo === st.autoria)
      && (!autor || (p._autor || '').includes(autor))
      && (!parado || (!TERMINAIS.has(p.etapa) && (p.dias_parado ?? 0) >= parado))
      && (!termos.length || termos.every((t) => p._busca.includes(t)));
  };
}

// Descrição de cada filtro ativo (para os chips)
function rotulos(st) {
  const r = [];
  if (st.q) r.push(['q', `“${st.q}”`]);
  if (st.tipo) r.push(['tipo', st.tipo]);
  if (st.tema) r.push(['tema', st.tema]);
  if (st.etapa) r.push(['etapa', ETAPA[st.etapa]?.nome || st.etapa]);
  if (st.ano) r.push(['ano', `apresentadas em ${st.ano}`]);
  if (st.partido) r.push(['partido', `partido ${st.partido}`]);
  if (st.uf) r.push(['uf', `UF ${st.uf}`]);
  if (st.autoria) r.push(['autoria', `autoria: ${st.autoria}`]);
  if (st.autor) r.push(['autor', `autor “${st.autor}”`]);
  if (st.parado) r.push(['parado', `parado há ${PARADO.find((x) => x.v === st.parado)?.nome || st.parado + ' dias'}`]);
  return r;
}
export const nAtivos = (st) => rotulos(st).filter(([k]) => k !== 'q').length;

const opt = (v, nome, sel) => raw(`<option value="${esc(v)}" ${String(v) === String(sel ?? '') ? 'selected' : ''}>${esc(nome)}</option>`);

/**
 * Monta a barra de filtros dentro de `el`.
 * opcoes: { lista, st, ordens: bool, etapa: bool, aoMudar(st), contagem: () => string }
 */
export function montarFiltros(el, { lista, st, ordens = true, etapa = true, aoMudar, abertoPadrao = null, placeholder = 'Buscar por sigla, assunto, tema ou autor' }) {
  const idPainel = 'painel-filtros';
  let aberto;
  try { aberto = localStorage.getItem('lec:filtros-abertos'); } catch (e) { aberto = null; }
  aberto = abertoPadrao === false ? false : aberto == null ? matchMedia('(min-width: 860px)').matches : aberto === '1';
  if (nAtivos(st)) aberto = true;
  const multiUF = lista.ufs.length > 1;

  el.innerHTML = String(html`
    <form class="filtros" role="search" onsubmit="return false">
      <div class="filtros__linha">
        <label class="filtros__busca"><span class="vh">Buscar</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>
          <input type="search" name="q" placeholder="${placeholder}" value="${st.q || ''}" autocomplete="off" enterkeyhint="search">
        </label>
        <button type="button" class="btn filtros__abrir" aria-expanded="${aberto}" aria-controls="${idPainel}">${raw(ICONE.filtro)}<span>Filtros</span><b class="filtros__n" ${nAtivos(st) ? '' : raw('hidden')}>${nAtivos(st)}</b></button>
        ${ordens ? html`<label class="filtros__ordem"><span>Ordenar</span><select name="ordem">${Object.entries(ORDENS).map(([k, o]) => opt(k, o.nome, st.ordem))}</select></label>` : ''}
      </div>
      <div class="filtros__painel" id="${idPainel}" ${aberto ? '' : raw('hidden')}>
        <label>Tipo<select name="tipo">${opt('', 'Todos')}${lista.tipos.map((t) => opt(t, `${t} — ${TIPOS[t] || t}`, st.tipo))}</select></label>
        <label>Tema<select name="tema">${opt('', 'Todos')}${lista.temas.map((t) => opt(t, t, st.tema))}</select></label>
        ${etapa ? html`<label>Etapa atual<select name="etapa">${opt('', 'Todas')}${[...etapasDaCasa(), ...DESFECHOS].map((e) => opt(e.id, e.nome, st.etapa))}</select></label>` : ''}
        <label>Ano de apresentação<select name="ano">${opt('', 'Todos')}${lista.anos.map((a) => opt(a, a, st.ano))}</select></label>
        <label>Parada há<select name="parado">${opt('', 'Qualquer tempo')}${PARADO.map((x) => opt(x.v, x.nome, st.parado))}</select></label>
        <label>Tipo de autoria<select name="autoria">${opt('', 'Todas')}${lista.tiposAutor.map((t) => opt(t, t, st.autoria))}</select></label>
        <label>Partido do autor<select name="partido">${opt('', 'Todos')}${lista.partidos.map((t) => opt(t, t, st.partido))}</select></label>
        ${multiUF ? html`<label>UF do autor<select name="uf">${opt('', 'Todas')}${lista.ufs.map((t) => opt(t, t, st.uf))}</select></label>` : ''}
        <label>Nome do autor<input type="search" name="autor" value="${st.autor || ''}" placeholder="Ex.: Silva" autocomplete="off"></label>
      </div>
      <div class="filtros__ativos" aria-live="polite"></div>
    </form>`);

  const form = el.querySelector('form');
  const painel = form.querySelector('.filtros__painel');
  const botao = form.querySelector('.filtros__abrir');
  let t;

  function chips() {
    const r = rotulos(st);
    const alvo = form.querySelector('.filtros__ativos');
    const n = nAtivos(st);
    const badge = form.querySelector('.filtros__n');
    badge.hidden = !n; badge.textContent = n;
    alvo.innerHTML = r.length
      ? r.map(([k, txt]) => `<button type="button" class="chip-filtro" data-tirar="${k}" aria-label="Remover filtro: ${esc(txt)}">${esc(txt)}${ICONE.x}</button>`).join('')
        + '<button type="button" class="btn btn--mini btn--leve" data-limpar>Limpar tudo</button>'
        + `<button type="button" class="btn btn--mini btn--leve" data-copiar>${ICONE.link}<span>Copiar link</span></button>`
      : '';
  }
  function mudou(atraso = 0) {
    clearTimeout(t);
    t = setTimeout(() => { chips(); aoMudar(st); }, atraso);
  }

  form.addEventListener('input', (e) => {
    const x = e.target; if (!x.name) return;
    st[x.name] = x.value;
    mudou(x.type === 'search' ? 180 : 0);
  });
  botao.addEventListener('click', () => {
    const ab = painel.hidden;
    painel.hidden = !ab;
    botao.setAttribute('aria-expanded', String(ab));
    try { localStorage.setItem('lec:filtros-abertos', ab ? '1' : '0'); } catch (e) { /* ok */ }
  });
  form.addEventListener('click', async (e) => {
    const tirar = e.target.closest('[data-tirar]');
    if (tirar) {
      const k = tirar.dataset.tirar;
      st[k] = '';
      const campo = form.elements[k]; if (campo) campo.value = '';
      mudou();
    } else if (e.target.closest('[data-limpar]')) {
      for (const k of CAMPOS) { st[k] = ''; const c = form.elements[k]; if (c) c.value = ''; }
      mudou();
    } else if (e.target.closest('[data-copiar]')) {
      const b = e.target.closest('[data-copiar]');
      try { await navigator.clipboard.writeText(location.href); b.querySelector('span').textContent = 'Link copiado'; }
      catch (err) { b.querySelector('span').textContent = 'Copie da barra de endereço'; }
      setTimeout(() => { if (b.isConnected) b.querySelector('span').textContent = 'Copiar link'; }, 2200);
    }
  });
  chips();
  return {
    // mudança vinda de fora (ex.: clique numa casa do tabuleiro)
    definir(k, v) { st[k] = v; const c = form.elements[k]; if (c) c.value = v; chips(); },
  };
}

export function ordenar(arr, ordem) { return arr.sort((ORDENS[ordem] || ORDENS.parado).cmp); }
export const resumoContagem = (n, total) => (n === total ? plural(total, 'proposição', 'proposições') : `${fmtN(n)} de ${plural(total, 'proposição', 'proposições')}`);
