// Home: "o que andou esta semana" — mudanças de etapa, votações e apresentações, com seletor de semana e filtros.
import * as dados from '../data.js';
import { html, raw, cartao, etapaTag, fmtData, fmtN, plural, vazio, ICONE, rotuloSemana, fmtIntervalo, intervaloSemana, href, botaoMais, rolarPara, nomeOrgao } from '../ui.js';
import { montarFiltros, lerEstado, paraQuery, predicado, nAtivos } from '../filtros.js';
import { placarHTML } from './proposicao.js';

const PASSO = 12;

export default async function home(main, ctx) {
  const { lista, casa } = ctx;
  const semanas = await dados.semanas();
  if (!ctx.valido()) return;
  if (!semanas.length) {
    main.innerHTML = String(html`<div class="cab"><p class="olho">${casa.nome}</p><h1>O que andou esta semana</h1></div>${vazio('Ainda não há resumos semanais publicados para esta casa.')}`);
    return 'Esta semana';
  }
  const lista_s = semanas.map((s) => s.semana);
  const sel = ctx.params.semana && lista_s.includes(ctx.params.semana) ? ctx.params.semana : lista_s[0];
  const info = semanas.find((s) => s.semana === sel);
  const sem = await dados.semana(sel);
  if (!ctx.valido()) return;
  const iv = sem.inicio && sem.fim ? sem : info.inicio ? info : intervaloSemana(sel);
  const i = lista_s.indexOf(sel);
  const anterior = lista_s[i + 1], proxima = lista_s[i - 1];
  const ehAtual = i === 0;
  const numSem = Number(sel.split('-W')[1]);
  const P = (id) => lista.porId.get(Number(id));
  const todos = {
    mud: (sem.mudaram_de_etapa || []).filter((m) => P(m.id)),
    vot: (sem.votadas || []).filter((v) => P(v.id)),
    apr: (sem.apresentadas || []).map((x) => P(typeof x === 'object' ? x.id : x)).filter(Boolean),
  };
  const st = lerEstado(ctx.query, { ordem: '' });
  const vistos = { mud: PASSO, vot: PASSO, apr: PASSO };

  const seguidos = dados.listaSeguidos();
  const idsSemana = new Set([...todos.mud.map((m) => Number(m.id)), ...todos.vot.map((v) => Number(v.id))]);
  const meus = Object.values(seguidos).filter((s) => s.casa === casa.id && idsSemana.has(Number(s.id)));

  const opcoesSemana = semanas.map((s) => raw(`<option value="${s.semana}" ${s.semana === sel ? 'selected' : ''}>${rotuloSemana(s.semana, s.inicio, s.fim)}${s.semana === lista_s[0] ? ' (atual)' : ''}</option>`));
  const navSem = (alvo, rot, sim) => (alvo ? raw(`<a class="btn btn--icone" href="${href('/semana/' + alvo)}" aria-label="${rot}: ${rotuloSemana(alvo)}"><span aria-hidden="true">${sim}</span></a>`) : raw(`<span class="btn btn--icone is-off" aria-hidden="true">${sim}</span>`));

  main.innerHTML = String(html`
    <div class="cab">
      <p class="olho">${casa.nome}</p>
      <h1>${ehAtual ? 'O que andou esta semana' : 'O que andou nesta semana'}</h1>
      <p class="cab__data">${rotuloSemana(sel, iv.inicio, iv.fim)}${ehAtual ? ' · em andamento' : ''}</p>
      <div class="seletor-semana">
        ${navSem(anterior, 'Semana anterior', '‹')}
        <label class="vh" for="sel-semana">Escolher semana</label>
        <select id="sel-semana">${opcoesSemana}</select>
        ${navSem(proxima, 'Semana seguinte', '›')}
      </div>
    </div>
    <div id="filtros"></div>
    <p class="lead lead--semana" id="lead"></p>
    <div class="placar-semana" id="placar"></div>
    ${meus.length ? html`<p class="nota nota--seguindo"><span class="parado">${plural(meus.length, 'proposição que você segue andou', 'proposições que você segue andaram')} nesta semana</span> <a href="${href('/seguindo')}">ver as que você segue</a></p>` : ''}
    <section class="secao" id="mudaram" aria-labelledby="h-mud">
      <div class="secao__cab"><h2 id="h-mud">Mudaram de etapa</h2><p>Da etapa anterior para a nova, com a data da mudança.</p></div>
      <div id="l-mud"></div>
    </section>
    <section class="secao" id="votadas" aria-labelledby="h-vot">
      <div class="secao__cab"><h2 id="h-vot">Votadas</h2><p>Resultado de cada votação; placar quando a votação foi nominal.</p></div>
      <div id="l-vot"></div>
    </section>
    <section class="secao" id="apresentadas" aria-labelledby="h-apr">
      <div class="secao__cab"><h2 id="h-apr">Apresentadas</h2><p>Entraram no tabuleiro nesta semana.</p></div>
      <div id="l-apr"></div>
    </section>
    <section class="secao">
      <div class="secao__cab"><h2>E o que não andou?</h2></div>
      <p class="lead" style="font-size:16px">O parado também é dado. <a href="${href('/gaveta')}">Veja a gaveta</a> — o que está há mais tempo sem movimentação — ou <a href="${href('/tabuleiro')}">o tabuleiro inteiro</a>.</p>
    </section>
  `);

  const $ = (s) => main.querySelector(s);
  let filtrados;

  function cartaoMud(m) {
    const p = P(m.id);
    const extra = html`<p class="movimento">${etapaTag(m.de)} ${raw(ICONE.seta)} ${etapaTag(m.para)} <span class="discreto">· ${fmtData(m.data, { ano: false })}</span></p>`;
    return cartao(p, { extra, resumo: lista.resumos.get(Number(p.id)) });
  }
  function cartaoVot(v) {
    const p = P(v.id);
    const chave = `${v.id}|${v.votacao_id}`;
    const extra = html`<p class="movimento"><span class="voto-res ${v.aprovada ? 'is-sim' : 'is-nao'}">${v.aprovada ? 'Aprovada' : 'Rejeitada'}</span><span class="discreto">${v.orgao ? `· ${v.orgao === 'PLEN' ? 'Plenário' : v.orgao}` : ''}${v.data ? ` · ${fmtData(v.data, { ano: false })}` : ''}</span></p><div class="placar-slot" data-placar="${chave}"></div>`;
    return cartao(p, { extra, resumo: lista.resumos.get(Number(p.id)) });
  }
  const desenha = { mud: cartaoMud, vot: cartaoVot, apr: (p) => cartao(p, { resumo: lista.resumos.get(Number(p.id)) }) };
  const vazios = { mud: 'Nenhuma mudança de etapa', vot: 'Nenhuma votação registrada', apr: 'Nenhuma proposição nova' };

  function secao(k) {
    const arr = filtrados[k];
    const alvo = $(`#l-${k}`);
    const fatia = arr.slice(0, vistos[k]);
    alvo.innerHTML = arr.length
      ? `<div class="lista lista--grade">${fatia.map((x) => String(desenha[k](x))).join('')}</div>${botaoMais(k, arr.length - fatia.length, PASSO)}`
      : String(vazio(`${vazios[k]} nesta semana${nAtivos(st) || st.q ? ' com esses filtros' : ''}.`));
    if (k === 'vot') carregarPlacares(fatia);
  }

  function aplicar() {
    const ok = predicado(st);
    filtrados = {
      mud: todos.mud.filter((m) => ok(P(m.id))),
      vot: todos.vot.filter((v) => ok(P(v.id))),
      apr: todos.apr.filter(ok),
    };
    const f = filtrados;
    const filtrando = nAtivos(st) || st.q;
    const viraramLei = f.mud.filter((m) => m.para === 'lei').length;
    const partes = [
      f.mud.length ? `<b>${plural(f.mud.length, 'proposição mudou', 'proposições mudaram')}</b> de etapa` : 'nenhuma proposição mudou de etapa',
      f.vot.length ? `<b>${plural(f.vot.length, 'votação', 'votações')}</b> registradas` : null,
      f.apr.length ? `<b>${plural(f.apr.length, 'nova', 'novas')}</b> apresentadas` : null,
    ].filter(Boolean);
    $('#lead').innerHTML = `${filtrando ? 'Com os filtros escolhidos' : ehAtual ? 'Até agora' : 'Nesta semana'}: ${partes.join(', ').replace(/, ([^,]*)$/, ' e $1')}.` + (viraramLei ? ` ${viraramLei === 1 ? 'Uma virou lei' : `${viraramLei} viraram lei`}.` : '');
    $('#placar').innerHTML = [['mudaram', f.mud.length, 'mudaram de etapa', todos.mud.length], ['votadas', f.vot.length, 'votações', todos.vot.length], ['apresentadas', f.apr.length, 'apresentadas', todos.apr.length]]
      .map(([id, n, rot, tot]) => `<a href="${href('/')}" data-ir="${id}"><b>${fmtN(n)}</b><span>${rot}${filtrando && n !== tot ? ` <small>de ${fmtN(tot)}</small>` : ''}</span></a>`).join('');
    vistos.mud = vistos.vot = vistos.apr = PASSO;
    ['mud', 'vot', 'apr'].forEach(secao);
  }

  // placar de cada votação visível: vem do detalhe (o resumo semanal só traz aprovada/rejeitada)
  function carregarPlacares(fatia) {
    for (const v of fatia) {
      const slot = main.querySelector(`[data-placar="${CSS.escape(v.id + '|' + v.votacao_id)}"]`);
      if (!slot || slot.dataset.ok) continue;
      slot.dataset.ok = '1';
      dados.detalhe(v.id).then((d) => {
        const vv = (d.votacoes || []).find((x) => x.id === v.votacao_id);
        if (!vv || !ctx.valido() || !slot.isConnected) return;
        slot.innerHTML = placarHTML(vv, true);
      }).catch(() => {});
    }
  }

  montarFiltros($('#filtros'), {
    lista, st, ordens: false, abertoPadrao: false, placeholder: 'Filtrar a semana por sigla, assunto, tema ou autor',
    aoMudar: () => { aplicar(); ctx.trocarQuery(paraQuery(st, {}, { ordem: '' })); },
  });
  aplicar();

  $('#sel-semana').addEventListener('change', (e) => { location.hash = href('/semana/' + e.target.value) + (paraQuery(st, {}, { ordem: '' }).toString() ? '?' + paraQuery(st, {}, { ordem: '' }) : ''); });
  main.addEventListener('click', (e) => {
    const ir = e.target.closest('[data-ir]');
    if (ir) { e.preventDefault(); rolarPara(document.getElementById(ir.dataset.ir)); return; }
    const mais = e.target.closest('[data-mais]');
    if (mais && ['mud', 'vot', 'apr'].includes(mais.dataset.mais)) { vistos[mais.dataset.mais] += PASSO; secao(mais.dataset.mais); }
  });
  return ehAtual ? 'Esta semana' : rotuloSemana(sel, iv.inicio, iv.fim);
}

export { fmtIntervalo, nomeOrgao };
