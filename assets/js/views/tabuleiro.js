// Tabuleiro: cada proposição é uma peça numa casa (etapa). Escala para milhares com agregação:
// cada quadradinho vale N peças, N escolhido para que a casa mais cheia caiba em ~240 quadradinhos.
import * as dados from '../data.js';
import { html, raw, esc, cartao, ETAPAS, DESFECHOS, ETAPA, fmtN, plural, vazio } from '../ui.js';
import { normalizar as norm } from '../data.js';

const POR_PAGINA = 30;
const MAX_QUADROS = 240;
const FAIXAS = [
  { ate: 30, cls: 'p0', nome: 'menos de 30 dias', c: 'var(--line-2)' },
  { ate: 180, cls: 'p1', nome: '1 a 6 meses', c: 'var(--p1)' },
  { ate: 365, cls: 'p2', nome: '6 meses a 1 ano', c: 'var(--p2)' },
  { ate: 730, cls: 'p3', nome: '1 a 2 anos', c: 'var(--p3)' },
  { ate: Infinity, cls: 'p4', nome: 'mais de 2 anos', c: 'var(--p4)' },
];
const faixa = (d) => FAIXAS.find((f) => (d ?? 0) < f.ate);

export default async function tabuleiro(main, ctx) {
  const { lista, query } = ctx;
  const st = {
    q: query.get('q') || '', tipo: query.get('tipo') || '', tema: query.get('tema') || '', ano: query.get('ano') || '',
    etapa: query.get('etapa') || '', cor: query.get('cor') || 'etapa', ordem: query.get('ordem') || 'parado', pagina: 1,
  };

  main.innerHTML = String(html`
    <div class="cab">
      <p class="olho">Tabuleiro</p>
      <h1>Onde está cada proposição</h1>
      <p class="lead">Cada quadradinho é uma proposição na sua etapa atual — inclusive as que nunca saíram da primeira casa. Toque numa casa para ver quem está lá.</p>
    </div>
    <form class="filtros" role="search" id="filtros" onsubmit="return false">
      <label class="busca">Buscar<input type="search" name="q" placeholder="Sigla, ementa, tema ou autor" value="${st.q}" autocomplete="off"></label>
      <label>Tipo<select name="tipo"><option value="">Todos</option>${lista.tipos.map((t) => raw(`<option ${t === st.tipo ? 'selected' : ''}>${esc(t)}</option>`))}</select></label>
      <label>Tema<select name="tema"><option value="">Todos</option>${lista.temas.map((t) => raw(`<option ${t === st.tema ? 'selected' : ''}>${esc(t)}</option>`))}</select></label>
      <label>Ano<select name="ano"><option value="">Todos</option>${lista.anos.map((a) => raw(`<option ${String(a) === st.ano ? 'selected' : ''}>${a}</option>`))}</select></label>
      <label>Etapa<select name="etapa"><option value="">Todas</option>${[...ETAPAS, ...DESFECHOS].map((e) => raw(`<option value="${e.id}" ${e.id === st.etapa ? 'selected' : ''}>${esc(e.nome)}</option>`))}</select></label>
      <div class="filtros__pe">
        <span id="contagem" aria-live="polite"></span>
        <span style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="discreto">Colorir por</span>
          <span class="seg" role="group" aria-label="Colorir peças por">
            <button type="button" data-cor="etapa" aria-pressed="${st.cor === 'etapa'}">Etapa</button>
            <button type="button" data-cor="parado" aria-pressed="${st.cor === 'parado'}">Tempo parado</button>
          </span>
          <button type="button" class="btn btn--mini" id="limpar">Limpar</button>
        </span>
      </div>
    </form>
    <div class="tabuleiro" id="tab"></div>
    <div class="resultado-cab">
      <h2 id="res-titulo">Proposições</h2>
      <label class="ordenar">Ordenar <select id="ordem">
        <option value="parado" ${st.ordem === 'parado' ? 'selected' : ''}>Mais tempo paradas</option>
        <option value="recente" ${st.ordem === 'recente' ? 'selected' : ''}>Movimentação mais recente</option>
        <option value="antiga" ${st.ordem === 'antiga' ? 'selected' : ''}>Apresentação mais antiga</option>
        <option value="nova" ${st.ordem === 'nova' ? 'selected' : ''}>Apresentação mais recente</option>
      </select></label>
    </div>
    <div class="lista lista--grade" id="resultados"></div>
    <div class="mais" id="mais"></div>
  `);

  const $ = (s) => main.querySelector(s);
  const form = $('#filtros');

  function filtrar(semEtapa) {
    const termos = norm(st.q.trim()).split(/\s+/).filter(Boolean);
    const ano = Number(st.ano);
    return lista.proposicoes.filter((p) => (!st.tipo || p.tipo === st.tipo)
      && (!st.tema || (p.tema || []).includes(st.tema))
      && (!ano || p.ano === ano)
      && (semEtapa || !st.etapa || p.etapa === st.etapa)
      && (!termos.length || termos.every((t) => p._busca.includes(t))));
  }

  function pilha(itens, unidade, porTempo) {
    if (!itens.length) return '';
    const ord = porTempo ? [...itens].sort((a, b) => (a.dias_parado ?? 0) - (b.dias_parado ?? 0)) : itens;
    const n = Math.ceil(ord.length / unidade);
    let s = '';
    for (let i = 0; i < n; i++) {
      if (porTempo) {
        const meio = ord[Math.min(ord.length - 1, i * unidade + Math.floor(unidade / 2))];
        s += `<span class="${faixa(meio.dias_parado).cls}"></span>`;
      } else s += '<span></span>';
    }
    return s;
  }

  function desenharTabuleiro() {
    const base = filtrar(true);
    const grupos = Object.fromEntries([...ETAPAS, ...DESFECHOS].map((e) => [e.id, []]));
    for (const p of base) (grupos[p.etapa] || (grupos[p.etapa] = [])).push(p);
    const maior = Math.max(1, ...Object.values(grupos).map((g) => g.length));
    const unidade = Math.max(1, Math.ceil(maior / MAX_QUADROS));
    const porTempo = st.cor === 'parado';
    const casa = (e, saida) => {
      const g = grupos[e.id] || [];
      const pct = base.length ? Math.round((100 * g.length) / base.length) : 0;
      return html`<button type="button" class="casa" data-etapa="${e.id}" aria-pressed="${st.etapa === e.id}" style="--cor:${raw(e.cor)}" aria-label="${e.nome}: ${plural(g.length, 'proposição', 'proposições')}. ${e.desc}">
        <span class="casa__n"><i class="${e.n <= 2 ? 't-esc' : ''}">${saida ? '' : e.n}</i><span class="casa__nome">${e.nome}</span></span>
        <span class="casa__qtd">${fmtN(g.length)}<small>${pct}% do total</small></span>
        <span class="pilha" aria-hidden="true">${raw(pilha(g, unidade, porTempo && !saida && e.id !== 'lei'))}</span>
      </button>`;
    };
    const legenda = porTempo
      ? html`<div class="legenda"><span>Tempo desde a última movimentação:</span>${FAIXAS.map((f) => html`<span><i style="--c:${raw(f.c)}"></i>${f.nome}</span>`)}</div>`
      : '';
    $('#tab').innerHTML = String(html`
      <div class="trilha">${ETAPAS.map((e) => casa(e, false))}</div>
      <p class="saidas__rotulo">Saíram do tabuleiro sem virar lei</p>
      <div class="saidas">${DESFECHOS.map((e) => casa(e, true))}</div>
      <div class="legenda"><span>${unidade === 1 ? 'Cada quadradinho = 1 proposição' : `Cada quadradinho = ${fmtN(unidade)} proposições`}</span></div>
      ${legenda}
    `);
    return base.length;
  }

  function ordenar(arr) {
    const k = st.ordem;
    const cmp = {
      parado: (a, b) => (b.dias_parado ?? -1) - (a.dias_parado ?? -1),
      recente: (a, b) => (a.ultima_movimentacao < b.ultima_movimentacao ? 1 : -1),
      antiga: (a, b) => (a.data_apresentacao > b.data_apresentacao ? 1 : -1),
      nova: (a, b) => (a.data_apresentacao < b.data_apresentacao ? 1 : -1),
    }[k];
    // "mais tempo paradas" só faz sentido entre as que ainda tramitam: desfechos vão para o fim
    if (k === 'parado') return arr.sort((a, b) => (ETAPA[a.etapa]?.terminal ? 1 : 0) - (ETAPA[b.etapa]?.terminal ? 1 : 0) || cmp(a, b));
    return arr.sort(cmp);
  }

  let filtradas = [];
  function desenharLista(reset) {
    if (reset) { filtradas = ordenar(filtrar(false)); st.pagina = 1; }
    const fatia = filtradas.slice(0, st.pagina * POR_PAGINA);
    const alvo = $('#resultados');
    alvo.innerHTML = fatia.length ? fatia.map((p) => String(cartao(p, { seguindo: dados.seguindo(p.id) }))).join('') : String(vazio('Nenhuma proposição com esses filtros.'));
    const resta = filtradas.length - fatia.length;
    $('#mais').innerHTML = resta > 0 ? `<button class="btn" type="button" id="ver-mais">Mostrar mais ${Math.min(resta, POR_PAGINA)} de ${fmtN(resta)}</button>` : '';
    $('#res-titulo').textContent = st.etapa ? `Em “${ETAPA[st.etapa]?.nome}”` : 'Proposições';
  }

  function tudo() {
    const nBase = desenharTabuleiro();
    desenharLista(true);
    const extras = st.etapa ? ` · ${fmtN(filtradas.length)} em “${ETAPA[st.etapa]?.nome}”` : '';
    $('#contagem').textContent = `${plural(nBase, 'proposição', 'proposições')} no tabuleiro${extras}`;
    const q = new URLSearchParams();
    for (const k of ['q', 'tipo', 'tema', 'ano', 'etapa']) if (st[k]) q.set(k, st[k]);
    if (st.cor !== 'etapa') q.set('cor', st.cor);
    if (st.ordem !== 'parado') q.set('ordem', st.ordem);
    ctx.trocarQuery(q);
  }

  let t;
  form.addEventListener('input', (e) => {
    const el = e.target; if (!el.name) return;
    st[el.name] = el.value;
    clearTimeout(t);
    t = setTimeout(tudo, el.name === 'q' ? 160 : 0);
  });
  $('#tab').addEventListener('click', (e) => {
    const b = e.target.closest('.casa'); if (!b) return;
    st.etapa = st.etapa === b.dataset.etapa ? '' : b.dataset.etapa;
    form.etapa.value = st.etapa;
    tudo();
    if (st.etapa) $('#res-titulo').scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  form.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cor]');
    if (b) {
      st.cor = b.dataset.cor;
      form.querySelectorAll('[data-cor]').forEach((x) => x.setAttribute('aria-pressed', x.dataset.cor === st.cor));
      tudo();
    }
    if (e.target.id === 'limpar') {
      Object.assign(st, { q: '', tipo: '', tema: '', ano: '', etapa: '' });
      form.reset(); form.querySelectorAll('select').forEach((s) => (s.value = '')); form.q.value = '';
      tudo();
    }
  });
  $('#ordem').addEventListener('change', (e) => { st.ordem = e.target.value; tudo(); });
  $('#mais').addEventListener('click', (e) => { if (e.target.id === 'ver-mais') { st.pagina++; desenharLista(false); } });

  tudo();
  return 'Tabuleiro';
}
