// Tabuleiro: cada proposição é uma peça numa casa (etapa). Escala para milhares com agregação:
// cada quadradinho vale N peças, N escolhido para que a casa mais cheia caiba em ~240 quadradinhos.
import { html, raw, cartao, etapasDaCasa, DESFECHOS, ETAPA, fmtN, plural, vazio, botaoMais, rolarPara } from '../ui.js';
import { montarFiltros, lerEstado, paraQuery, predicado, ordenar, ORDENS, resumoContagem } from '../filtros.js';

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
  const { lista, casa, query } = ctx;
  const st = lerEstado(query);
  let cor = query.get('cor') || 'etapa';
  let pagina = 1;
  const etapas = etapasDaCasa();
  const unicameral = casa.bicameral === false;

  main.innerHTML = String(html`
    <div class="cab">
      <p class="olho">${casa.nome}</p>
      <h1>Onde está cada proposição</h1>
      <p class="lead">Cada quadradinho é uma proposição na sua etapa atual — inclusive as que nunca saíram da primeira casa. Toque numa casa do tabuleiro para ver quem está lá.${unicameral ? ` Aqui o caminho é direto do Plenário para a sanção do ${casa.executivo || 'Executivo'}: não há segunda casa.` : ''}</p>
    </div>
    <div id="filtros"></div>
    <div class="tab-barra">
      <span id="contagem" class="tab-barra__n" aria-live="polite"></span>
      <span class="tab-barra__cor"><span class="discreto">Colorir por</span>
        <span class="seg" role="group" aria-label="Colorir peças por">
          <button type="button" data-cor="etapa" aria-pressed="${cor === 'etapa'}">Etapa</button>
          <button type="button" data-cor="parado" aria-pressed="${cor === 'parado'}">Tempo parado</button>
        </span>
      </span>
    </div>
    <div class="tabuleiro" id="tab"></div>
    <div class="resultado-cab"><h2 id="res-titulo">Proposições</h2><span class="discreto" id="res-ordem"></span></div>
    <div class="lista lista--grade" id="resultados"></div>
    <div id="mais"></div>
  `);

  const $ = (s) => main.querySelector(s);

  function pilha(itens, unidade, porTempo) {
    if (!itens.length) return '';
    const ord = porTempo ? [...itens].sort((a, b) => (a.dias_parado ?? 0) - (b.dias_parado ?? 0)) : itens;
    const n = Math.ceil(ord.length / unidade);
    let s = '';
    for (let i = 0; i < n; i++) {
      if (porTempo) s += `<span class="${faixa(ord[Math.min(ord.length - 1, i * unidade + Math.floor(unidade / 2))].dias_parado).cls}"></span>`;
      else s += '<span></span>';
    }
    return s;
  }

  function desenharTabuleiro() {
    const base = lista.proposicoes.filter(predicado(st, { ignorarEtapa: true }));
    const grupos = Object.fromEntries([...etapas, ...DESFECHOS].map((e) => [e.id, []]));
    for (const p of base) (grupos[p.etapa] || (grupos[p.etapa] = [])).push(p);
    const maior = Math.max(1, ...Object.values(grupos).map((g) => g.length));
    const unidade = Math.max(1, Math.ceil(maior / MAX_QUADROS));
    const porTempo = cor === 'parado';
    const casaHTML = (e, saida) => {
      const g = grupos[e.id] || [];
      const pct = base.length ? Math.round((100 * g.length) / base.length) : 0;
      return html`<button type="button" class="casa" data-etapa="${e.id}" aria-pressed="${st.etapa === e.id}" style="--cor:${raw(e.cor)}" aria-label="${e.nome}: ${plural(g.length, 'proposição', 'proposições')}. ${e.desc}">
        <span class="casa__n"><i class="${e.n <= 2 ? 't-esc' : ''}">${saida ? '' : e.n}</i><span class="casa__nome">${e.nome}</span></span>
        <span class="casa__qtd">${fmtN(g.length)}<small>${pct}% do total</small></span>
        <span class="pilha" aria-hidden="true">${raw(pilha(g, unidade, porTempo && !saida && e.id !== 'lei'))}</span>
      </button>`;
    };
    $('#tab').innerHTML = String(html`
      <div class="trilha" style="--n:${etapas.length}">${etapas.map((e) => casaHTML(e, false))}</div>
      <p class="saidas__rotulo">Saíram do tabuleiro sem virar lei</p>
      <div class="saidas">${DESFECHOS.map((e) => casaHTML(e, true))}</div>
      <div class="legenda"><span>${unidade === 1 ? 'Cada quadradinho = 1 proposição' : `Cada quadradinho = ${fmtN(unidade)} proposições`}</span>
        ${porTempo ? html`<span>· tempo desde a última movimentação:</span>${FAIXAS.map((f) => html`<span><i style="--c:${raw(f.c)}"></i>${f.nome}</span>`)}` : ''}</div>
    `);
    return base.length;
  }

  let filtradas = [];
  function desenharLista(reset) {
    if (reset) { filtradas = ordenar(lista.proposicoes.filter(predicado(st)), st.ordem); pagina = 1; }
    const fatia = filtradas.slice(0, pagina * POR_PAGINA);
    $('#resultados').innerHTML = fatia.length ? fatia.map((p) => String(cartao(p, { resumo: lista.resumos.get(Number(p.id)) }))).join('') : String(vazio('Nenhuma proposição com esses filtros.'));
    $('#mais').innerHTML = botaoMais('lista', filtradas.length - fatia.length, POR_PAGINA);
    $('#res-titulo').textContent = st.etapa ? `Em “${ETAPA[st.etapa]?.nome}” · ${fmtN(filtradas.length)}` : `Proposições · ${fmtN(filtradas.length)}`;
    $('#res-ordem').textContent = `ordem: ${(ORDENS[st.ordem] || ORDENS.parado).nome.toLowerCase()}`;
  }

  function tudo() {
    const nBase = desenharTabuleiro();
    desenharLista(true);
    $('#contagem').textContent = `${resumoContagem(nBase, lista.proposicoes.length)} no tabuleiro`;
    ctx.trocarQuery(paraQuery(st, { cor: cor !== 'etapa' ? cor : '' }));
  }

  const filtros = montarFiltros($('#filtros'), { lista, st, aoMudar: tudo });
  $('#tab').addEventListener('click', (e) => {
    const b = e.target.closest('.casa'); if (!b) return;
    filtros.definir('etapa', st.etapa === b.dataset.etapa ? '' : b.dataset.etapa);
    tudo();
    if (st.etapa) rolarPara($('#res-titulo'));
  });
  main.querySelector('.tab-barra').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cor]'); if (!b) return;
    cor = b.dataset.cor;
    main.querySelectorAll('[data-cor]').forEach((x) => x.setAttribute('aria-pressed', x.dataset.cor === cor));
    tudo();
  });
  $('#mais').addEventListener('click', (e) => { if (e.target.closest('[data-mais]')) { pagina++; desenharLista(false); } });

  tudo();
  return 'Tabuleiro';
}
