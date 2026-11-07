// Funil + curva de sobrevivência (estatisticas.json).
import * as dados from '../data.js';
import { html, raw, esc, ETAPAS, ETAPA, fmtN, fmtDuracao, vazio } from '../ui.js';

export default async function funil(main, ctx) {
  const est = await dados.estatisticas();
  if (!ctx.valido()) return;
  const f = est.funil || {};
  const base = f.apresentado || Math.max(0, ...Object.values(f)) || 1;
  // a volta à origem é um desvio (nem todo projeto passa por ela): fica fora das barras, citada em nota
  const linhas = ETAPAS.filter((e) => f[e.id] != null && e.id !== 'retorno_origem');
  const tempos = est.tempo_mediano_por_etapa_dias || {};
  const sob = (est.sobrevivencia || []).filter((s) => s.dias != null && s.pct_ainda_ativo != null).sort((a, b) => a.dias - b.dias);
  const lei = f.lei != null ? (100 * f.lei) / base : null;
  // soma das medianas no caminho principal até a sanção (aproximação, não é mediana do total)
  const caminho = ['apresentado', 'comissoes', 'plenario_origem', 'casa_revisora', 'sancao'];
  const somaMed = caminho.every((k) => tempos[k] != null) ? caminho.reduce((s, k) => s + tempos[k], 0) : null;

  const por100 = (v) => (100 * v) / base;
  const fmtPor100 = (v) => { const x = por100(v); return x >= 10 || x === 0 ? Math.round(x).toString() : x.toLocaleString('pt-BR', { maximumFractionDigits: 1 }); };

  main.innerHTML = String(html`
    <div class="cab">
      <p class="olho">Funil</p>
      <h1>De cada 100 apresentadas, quantas chegam lá</h1>
      <p class="lead">${lei != null ? raw(`De cada 100 proposições apresentadas, <b>${esc(fmtPor100(f.lei))}</b> viraram lei.`) : ''} As demais seguem tramitando, ficaram paradas no caminho ou saíram por arquivamento, retirada ou veto.</p>
    </div>

    <section aria-labelledby="h-funil">
      <div class="secao__cab"><h2 id="h-funil">Até onde chegam</h2><p>Proposições que passaram por cada etapa · base: ${fmtN(base)} apresentadas</p></div>
      <div class="funil">
        ${linhas.map((e) => html`<div class="funil__linha" style="--cor:${raw(e.cor)}">
          <span class="funil__nome"><i aria-hidden="true"></i>${e.nome}</span>
          <span class="funil__barra" aria-hidden="true"><span style="width:${Math.max(0.4, por100(f[e.id]))}%"></span></span>
          <span class="funil__v"><b>${fmtPor100(f[e.id])}</b> <span class="mudo" style="font-size:13px">de 100</span><small>${fmtN(f[e.id])} proposições${tempos[e.id] != null ? ` · mediana ${fmtDuracao(tempos[e.id])} na etapa` : ''}</small></span>
        </div>`)}
      </div>
      ${f.retorno_origem ? html`<p class="nota">Além disso, ${fmtPor100(f.retorno_origem)} de cada 100 (${fmtN(f.retorno_origem)}) voltaram à casa de origem para analisar emendas da casa revisora.</p>` : ''}
      <details class="tabela-ver"><summary>Ver como tabela</summary>
        <table><thead><tr><th>Etapa</th><th class="n">Proposições</th><th class="n">De cada 100</th><th class="n">Mediana na etapa (dias)</th></tr></thead>
        <tbody>${linhas.map((e) => html`<tr><td>${e.nome}</td><td class="n">${fmtN(f[e.id])}</td><td class="n">${fmtPor100(f[e.id])}</td><td class="n">${tempos[e.id] != null ? fmtN(tempos[e.id]) : '—'}</td></tr>`)}</tbody></table>
      </details>
    </section>

    <section class="secao" aria-labelledby="h-tempo">
      <div class="secao__cab"><h2 id="h-tempo">Quanto tempo fica em cada etapa</h2><p>Mediana entre as que já saíram da etapa</p></div>
      <div class="tempos">
        ${ETAPAS.filter((e) => tempos[e.id] != null).map((e) => html`<div class="tempo"><span>${e.nome}</span><b>${fmtDuracao(tempos[e.id])}</b></div>`)}
        ${somaMed != null ? html`<div class="tempo" style="border-style:dashed"><span>Da apresentação à sanção (soma das medianas)</span><b>${fmtDuracao(somaMed)}</b></div>` : ''}
      </div>
    </section>

    <section class="secao" aria-labelledby="h-sob">
      <div class="secao__cab"><h2 id="h-sob">Curva de sobrevivência</h2><p>% ainda em tramitação (sem desfecho) depois de N dias da apresentação</p></div>
      ${sob.length > 1 ? html`<div class="grafico" id="g-sob"></div>
        <details class="tabela-ver"><summary>Ver como tabela</summary>
          <table><thead><tr><th>Dias desde a apresentação</th><th class="n">% ainda tramitando</th></tr></thead>
          <tbody>${sob.map((s) => html`<tr><td>${fmtN(s.dias)} (${fmtDuracao(s.dias)})</td><td class="n">${s.pct_ainda_ativo.toLocaleString('pt-BR')}%</td></tr>`)}</tbody></table>
        </details>
        <p class="nota">Lê-se assim: depois de um ano, a porcentagem indicada das proposições ainda não teve desfecho (lei, veto, arquivamento ou retirada). A curva cai quando projetos saem do tabuleiro — por qualquer motivo.</p>` : vazio('Curva ainda não calculada.')}
    </section>
  `);

  if (sob.length > 1) desenharCurva(main.querySelector('#g-sob'), sob);
  return 'Funil';
}

function desenharCurva(el, sob) {
  const W = 720, H = 280, m = { t: 12, r: 16, b: 34, l: 40 };
  const maxX = sob.at(-1).dias || 1;
  const x = (d) => m.l + (d / maxX) * (W - m.l - m.r);
  const y = (p) => m.t + (1 - p / 100) * (H - m.t - m.b);
  // degraus: a sobrevivência só muda nos pontos medidos
  let d = `M${x(sob[0].dias)},${y(sob[0].pct_ainda_ativo)}`;
  for (let i = 1; i < sob.length; i++) d += ` H${x(sob[i].dias)} V${y(sob[i].pct_ainda_ativo)}`;
  const area = `${d} V${y(0)} H${x(sob[0].dias)} Z`;
  const ticksY = [0, 25, 50, 75, 100];
  const anos = []; for (let a = 0; a * 365 <= maxX; a++) anos.push(a * 365);
  const ticksX = anos.length >= 2 ? anos : sob.map((s) => s.dias);
  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Curva de sobrevivência: ${sob.map((s) => `${s.pct_ainda_ativo}% após ${s.dias} dias`).join('; ')}">
      <g class="eixo">
        ${ticksY.map((t) => `<line x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}"/><text x="${m.l - 8}" y="${y(t) + 4}" text-anchor="end">${t}%</text>`).join('')}
        ${ticksX.map((t) => `<text x="${x(t)}" y="${H - 12}" text-anchor="middle">${t === 0 ? '0' : t % 365 === 0 ? `${t / 365} ano${t / 365 > 1 ? 's' : ''}` : t + 'd'}</text>`).join('')}
      </g>
      <path class="area" d="${area}"/>
      <path class="curva" d="${d}"/>
      ${sob.map((s) => `<circle class="ponto" r="4" cx="${x(s.dias)}" cy="${y(s.pct_ainda_ativo)}"/>`).join('')}
      <line class="cruz" id="cruz" y1="${m.t}" y2="${H - m.b}" x1="-10" x2="-10"/>
      <rect id="alvo" x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}" fill="transparent"/>
    </svg>
    <div class="dica" id="dica"></div>`;
  const svg = el.querySelector('svg'), cruz = el.querySelector('#cruz'), dica = el.querySelector('#dica');
  function mover(ev) {
    const r = svg.getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * W;
    const dias = Math.max(0, Math.min(maxX, ((px - m.l) / (W - m.l - m.r)) * maxX));
    let s = sob[0]; for (const p of sob) if (p.dias <= dias) s = p;
    cruz.setAttribute('x1', x(dias)); cruz.setAttribute('x2', x(dias));
    dica.innerHTML = `<b>${s.pct_ainda_ativo.toLocaleString('pt-BR')}%</b> ainda tramitando<br>após ${fmtDuracao(Math.round(dias))}`;
    dica.style.left = `${(x(dias) / W) * r.width + 12}px`;
    dica.style.top = `${(y(s.pct_ainda_ativo) / H) * r.height + 16}px`;
    dica.classList.add('on');
  }
  svg.addEventListener('pointermove', mover);
  svg.addEventListener('pointerleave', () => { dica.classList.remove('on'); cruz.setAttribute('x1', -10); cruz.setAttribute('x2', -10); });
}
