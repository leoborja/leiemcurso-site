// Home: "o que andou esta semana" — mudanças de etapa, votações e apresentações, com seletor de semana.
import * as dados from '../data.js';
import { html, raw, esc, cartao, etapaTag, fmtData, fmtN, plural, vazio, ICONE, ETAPA } from '../ui.js';
import { placarHTML } from './proposicao.js';

export default async function home(main, ctx) {
  const { lista } = ctx;
  const semanas = await dados.semanas();
  if (!semanas.length) {
    main.innerHTML = String(html`<div class="cab"><h1>O que andou esta semana</h1></div>${vazio('Ainda não há resumos semanais publicados.')}`);
    return 'Esta semana';
  }
  const sel = ctx.params.semana && semanas.includes(ctx.params.semana) ? ctx.params.semana : semanas[0];
  const sem = await dados.semana(sel);
  if (!ctx.valido()) return;
  const i = semanas.indexOf(sel);
  const anterior = semanas[i + 1], proxima = semanas[i - 1];
  const P = (id) => lista.porId.get(Number(id));
  const mud = (sem.mudaram_de_etapa || []).filter((m) => P(m.id));
  const vot = (sem.votadas || []).filter((v) => P(v.id));
  const apr = (sem.apresentadas || []).map(P).filter(Boolean);
  const ehAtual = i === 0;
  const numSem = Number(sel.split('-W')[1]);

  const seguidos = dados.listaSeguidos();
  const idsSemana = new Set([...mud.map((m) => m.id), ...vot.map((v) => v.id)]);
  const meus = Object.keys(seguidos).map(Number).filter((id) => idsSemana.has(id));

  const viraramLei = mud.filter((m) => m.para === 'lei').length;
  const frase = [
    mud.length ? `<b>${plural(mud.length, 'proposição mudou', 'proposições mudaram')}</b> de etapa` : 'nenhuma proposição mudou de etapa',
    vot.length ? `<b>${plural(vot.length, 'votação', 'votações')}</b> registradas` : null,
    apr.length ? `<b>${plural(apr.length, 'nova', 'novas')}</b> apresentadas` : null,
  ].filter(Boolean);
  const lead = `${ehAtual ? 'Até agora, nesta semana' : 'Nesta semana'}: ${frase.join(', ').replace(/, ([^,]*)$/, ' e $1')}.` + (viraramLei ? ` ${viraramLei === 1 ? 'Uma virou lei' : `${viraramLei} viraram lei`}.` : '');

  const cartaoMud = (m) => {
    const p = P(m.id);
    const extra = html`<p class="movimento">${etapaTag(m.de)} ${raw(ICONE.seta.replace('<svg', '<svg class="seta"'))} ${etapaTag(m.para)} <span class="discreto">· ${fmtData(m.data, { ano: false })}</span></p>`;
    return cartao(p, { seguindo: dados.seguindo(p.id), extra });
  };
  const cartaoVot = (v) => {
    const p = P(v.id);
    const extra = html`<p class="movimento"><span class="voto-res">${v.aprovada ? 'Aprovada' : 'Rejeitada'}</span><span class="discreto" data-vot="${v.id}|${v.votacao_id}"></span></p><div data-placar="${v.id}|${v.votacao_id}"></div>`;
    return cartao(p, { seguindo: dados.seguindo(p.id), extra });
  };

  main.innerHTML = String(html`
    <div class="cab">
      <p class="olho">Semana ${numSem} · ${fmtData(sem.inicio, { ano: false })} a ${fmtData(sem.fim)}</p>
      <h1>${ehAtual ? 'O que andou esta semana' : 'O que andou nesta semana'}</h1>
      <p class="lead">${raw(lead)}</p>
      <div class="seletor-semana">
        <a class="btn btn--icone" ${anterior ? raw(`href="#/semana/${anterior}"`) : raw('aria-disabled="true" tabindex="-1" style="opacity:.4;pointer-events:none"')} aria-label="Semana anterior"><span aria-hidden="true">‹</span></a>
        <label class="vh" for="sel-semana">Escolher semana</label>
        <select id="sel-semana">
          ${semanas.map((s) => raw(`<option value="${s}" ${s === sel ? 'selected' : ''}>Semana ${Number(s.split('-W')[1])} · ${s.slice(0, 4)}${s === semanas[0] ? ' (atual)' : ''}</option>`))}
        </select>
        <a class="btn btn--icone" ${proxima ? raw(`href="#/semana/${proxima}"`) : raw('aria-disabled="true" tabindex="-1" style="opacity:.4;pointer-events:none"')} aria-label="Semana seguinte"><span aria-hidden="true">›</span></a>
      </div>
    </div>

    <div class="placar-semana">
      <a href="#/" data-ir="mudaram"><b>${fmtN(mud.length)}</b><span>mudaram de etapa</span></a>
      <a href="#/" data-ir="votadas"><b>${fmtN(vot.length)}</b><span>votações</span></a>
      <a href="#/" data-ir="apresentadas"><b>${fmtN(apr.length)}</b><span>apresentadas</span></a>
    </div>

    ${meus.length ? html`<p class="nota" style="margin-top:12px"><span class="parado" style="font-weight:600">${plural(meus.length, 'proposição que você segue andou', 'proposições que você segue andaram')} nesta semana</span> <a href="#/seguindo">ver as que você segue</a></p>` : ''}

    <section class="secao" id="mudaram" aria-labelledby="h-mud">
      <div class="secao__cab"><h2 id="h-mud">Mudaram de etapa</h2><p>Da etapa anterior para a nova, com a data da mudança.</p></div>
      ${mud.length ? html`<div class="lista lista--grade">${mud.map(cartaoMud)}</div>` : vazio('Nenhuma mudança de etapa nesta semana.')}
    </section>

    <section class="secao" id="votadas" aria-labelledby="h-vot">
      <div class="secao__cab"><h2 id="h-vot">Votadas</h2><p>Resultado e placar de cada votação.</p></div>
      ${vot.length ? html`<div class="lista lista--grade">${vot.map(cartaoVot)}</div>` : vazio('Nenhuma votação registrada nesta semana.')}
    </section>

    <section class="secao" id="apresentadas" aria-labelledby="h-apr">
      <div class="secao__cab"><h2 id="h-apr">Apresentadas</h2><p>Entraram no tabuleiro nesta semana.</p></div>
      ${apr.length ? html`<div class="lista lista--grade">${apr.map((p) => cartao(p, { seguindo: dados.seguindo(p.id) }))}</div>` : vazio('Nenhuma proposição nova nesta semana.')}
    </section>

    <section class="secao">
      <div class="secao__cab"><h2>E o que não andou?</h2></div>
      <p class="lead" style="font-size:16px">O parado também é dado. <a href="#/gaveta">Veja a gaveta</a> — o que está há mais tempo sem movimentação — ou <a href="#/tabuleiro">o tabuleiro inteiro</a>.</p>
    </section>
  `);

  main.querySelector('#sel-semana').addEventListener('change', (e) => { location.hash = `#/semana/${e.target.value}`; });
  main.querySelectorAll('[data-ir]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const alvo = document.getElementById(a.dataset.ir);
    alvo.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }));

  // placar de cada votação: vem do detalhe (o resumo semanal só traz aprovada/rejeitada)
  for (const v of vot) {
    dados.detalhe(v.id).then((d) => {
      const vv = (d.votacoes || []).find((x) => x.id === v.votacao_id);
      if (!vv || !ctx.valido()) return;
      const alvo = main.querySelector(`[data-placar="${CSS.escape(v.id + '|' + v.votacao_id)}"]`);
      const info = main.querySelector(`[data-vot="${CSS.escape(v.id + '|' + v.votacao_id)}"]`);
      if (info) info.textContent = `· ${vv.orgao === 'PLEN' ? 'Plenário' : vv.orgao} · ${fmtData(vv.data, { ano: false })}`;
      if (alvo && vv.placar) alvo.innerHTML = placarHTML(vv.placar, true);
    }).catch(() => {});
  }
  return ehAtual ? 'Esta semana' : `Semana ${numSem}`;
}
