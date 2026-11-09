// Gaveta: o que está parado há mais tempo, por tema e por órgão. Só proposições que ainda tramitam.
import * as dados from '../data.js';
import { html, raw, esc, etapaTag, trilhaMini, botaoSeguir, fmtN, fmtData, fmtDuracao, plural, nomeOrgao, TERMINAIS, vazio, href } from '../ui.js';

const FAIXAS = [
  { de: 0, ate: 180, nome: 'até 6 meses', c: 'var(--line-2)' },
  { de: 180, ate: 365, nome: '6 meses a 1 ano', c: 'var(--p1)' },
  { de: 365, ate: 730, nome: '1 a 2 anos', c: 'var(--p2)' },
  { de: 730, ate: 1460, nome: '2 a 4 anos', c: 'var(--p3)' },
  { de: 1460, ate: Infinity, nome: 'mais de 4 anos', c: 'var(--p4)' },
];
const idxFaixa = (d) => FAIXAS.findIndex((f) => d < f.ate);
const mediana = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };

export default async function gaveta(main, ctx) {
  const { lista, query } = ctx;
  const ativas = lista.proposicoes.filter((p) => !TERMINAIS.has(p.etapa) && p.dias_parado != null);
  const st = { tema: query.get('tema') || '', orgao: query.get('orgao') || '' };

  function agrupar(chave) {
    const m = new Map();
    for (const p of ativas) {
      const ks = chave === 'tema' ? (p.tema?.length ? p.tema : ['Sem tema']) : [p.orgao_atual || '—'];
      for (const k of ks) {
        if (!m.has(k)) m.set(k, { k, n: 0, faixas: FAIXAS.map(() => 0), dias: [] });
        const g = m.get(k); g.n++; g.faixas[idxFaixa(p.dias_parado)]++; g.dias.push(p.dias_parado);
      }
    }
    return [...m.values()].map((g) => ({ ...g, mais1ano: g.faixas.slice(2).reduce((a, b) => a + b, 0), med: mediana(g.dias) }))
      .sort((a, b) => b.mais1ano - a.mais1ano || b.med - a.med).slice(0, 12);
  }

  const barras = (grupos, chave) => {
    const max = Math.max(1, ...grupos.map((g) => g.n));
    return html`<div class="barras" role="list">${grupos.map((g) => html`
      <button type="button" class="barra" role="listitem" data-${raw(chave)}="${g.k}" aria-pressed="${st[chave] === g.k}" style="border:0;background:${raw(st[chave] === g.k ? 'var(--surface-2)' : 'transparent')};text-align:left;cursor:pointer;color:inherit;width:100%"
        aria-label="${chave === 'orgao' ? nomeOrgao(g.k) : g.k}: ${plural(g.n, 'proposição parada', 'proposições paradas')}, ${g.mais1ano} há mais de 1 ano, mediana de ${g.med} dias">
        <span class="barra__nome" title="${chave === 'orgao' ? nomeOrgao(g.k) : g.k}">${chave === 'orgao' ? html`<span class="mono" style="font-size:12.5px">${g.k}</span> <span class="mudo">${nomeOrgao(g.k) !== g.k ? nomeOrgao(g.k) : ''}</span>` : g.k}</span>
        <span class="barra__trilho" aria-hidden="true">${g.faixas.map((n, i) => (n ? html`<span style="width:${(100 * n) / max}%;background:${raw(FAIXAS[i].c)}" title="${FAIXAS[i].nome}: ${n}"></span>` : ''))}</span>
        <span class="barra__v">${fmtN(g.mais1ano)}<span class="mudo" style="font-weight:400">/${fmtN(g.n)}</span></span>
      </button>`)}</div>`;
  };

  function render() {
    const top = ativas.filter((p) => p.dias_parado >= 30 && (!st.tema || p.tema?.includes(st.tema)) && (!st.orgao || p.orgao_atual === st.orgao))
      .sort((a, b) => b.dias_parado - a.dias_parado).slice(0, 15);
    const maisAntiga = ativas.reduce((m, p) => (p.dias_parado > (m?.dias_parado ?? -1) ? p : m), null);
    const nAno = ativas.filter((p) => p.dias_parado >= 365).length;
    const filtroTxt = [st.tema && `tema “${st.tema}”`, st.orgao && `órgão ${st.orgao}`].filter(Boolean).join(' e ');

    main.innerHTML = String(html`
      <div class="cab">
        <p class="olho">Gaveta · ${ctx.casa.nome}</p>
        <h1>O que está parado há mais tempo</h1>
        <p class="lead">Das <b>${fmtN(ativas.length)}</b> proposições que ainda tramitam, <b>${fmtN(nAno)}</b> estão há mais de um ano sem nenhuma movimentação.${maisAntiga ? raw(` A mais antiga na gaveta está parada há <b>${esc(fmtDuracao(maisAntiga.dias_parado))}</b>.`) : ''}</p>
      </div>

      <section aria-labelledby="h-top">
        <div class="secao__cab"><h2 id="h-top">As mais esquecidas${filtroTxt ? ` — ${filtroTxt}` : ''}</h2>
          ${filtroTxt ? html`<button class="btn btn--mini" type="button" id="limpar">Limpar filtro</button>` : html`<p>Dias desde a última movimentação registrada.</p>`}</div>
        ${top.length ? html`<div class="gaveta-top">${top.map((p) => html`
          <article class="gaveta-item">
            <div class="dias">${fmtN(p.dias_parado)}<small>dias parada</small></div>
            <div class="corpo">
              <div class="cartao__topo"><a class="cartao__sigla" href="${href('/p/' + p.id)}">${p.sigla}</a>${etapaTag(p.etapa)}</div>
              <p class="cartao__ementa" style="-webkit-line-clamp:2">${p.ementa}</p>
              <div class="cartao__pe">${trilhaMini(p.etapa)}<span>${nomeOrgao(p.orgao_atual)} · sem movimentação desde ${fmtData(p.ultima_movimentacao)}</span><span style="margin-left:auto"></span>${botaoSeguir(p.id, dados.seguindo(p.id), true)}</div>
            </div>
          </article>`)}</div>` : vazio('Nada parado há mais de 30 dias com esse filtro.')}
      </section>

      <div class="secao legenda" aria-label="Legenda das faixas de tempo parado">${FAIXAS.map((f) => html`<span><i style="--c:${raw(f.c)}"></i>${f.nome}</span>`)}</div>
      <div class="duas" style="margin-top:14px">
        <section aria-labelledby="h-tema">
          <div class="secao__cab"><h2 id="h-tema">Por tema</h2><p>paradas há +1 ano / total</p></div>
          ${barras(agrupar('tema'), 'tema')}
        </section>
        <section aria-labelledby="h-org">
          <div class="secao__cab"><h2 id="h-org">Por órgão onde estão</h2><p>paradas há +1 ano / total</p></div>
          ${barras(agrupar('orgao'), 'orgao')}
        </section>
      </div>
      <p class="nota">“Parada” conta os dias desde a última movimentação registrada na tramitação, seja qual for. Uma proposição pode ter temas múltiplos e aparece em cada um. Toque numa barra para filtrar a lista.</p>
    `);
  }

  main.addEventListener('click', onClick);
  function onClick(e) {
    if (!main.isConnected) return;
    const b = e.target.closest('[data-tema],[data-orgao]');
    if (b) {
      const k = b.dataset.tema != null ? 'tema' : 'orgao';
      const v = b.dataset[k];
      st[k] = st[k] === v ? '' : v;
      render(); sync();
      main.querySelector('#h-top').scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    } else if (e.target.id === 'limpar') { st.tema = ''; st.orgao = ''; render(); sync(); }
  }
  function sync() { const q = new URLSearchParams(); if (st.tema) q.set('tema', st.tema); if (st.orgao) q.set('orgao', st.orgao); ctx.trocarQuery(q); }
  // remove o ouvinte quando a rota muda (o <main> é reaproveitado)
  window.addEventListener('hashchange', () => main.removeEventListener('click', onClick), { once: true });

  render();
  return 'Gaveta';
}
