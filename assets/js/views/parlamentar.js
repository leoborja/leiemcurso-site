// Página do parlamentar: cadeira ilustrativa no plenário, "semana a semana" em frases (ao lado do que a Casa fez
// na semana, para ser justo), comissões, autorias,
// relatorias, votos (com a orientação do partido, como fato, sem índice de "fidelidade") e discursos.
import * as dados from '../data.js';
import { html, raw, avatar, fmtN, fmtData, plural, vazio, href, etapaTag, rotuloSemana, nomeOrgao, botaoMais, ICONE, nomeParl, semanaISO, parseData, simbolica } from '../ui.js';
import { hemiciclo, gruposVotacao, atribuirCadeiras, cadeiraDe, inicioDoGrupo } from '../hemiciclo.js';
import { semParlamentares } from './parlamentares.js';
import { ehNominal } from './proposicao.js';

const CLS_VOTO = { Sim: 'h-sim', Não: 'h-nao', Nao: 'h-nao', Abstenção: 'h-abst', Abstencao: 'h-abst', Obstrução: 'h-obst', Obstrucao: 'h-obst' };
const PASSO_VOTOS = 15;

export default async function parlamentar(main, ctx) {
  const { casa, lista } = ctx;
  if (!dados.tem('parlamentares')) { main.innerHTML = String(semParlamentares(casa)); return 'Parlamentar'; }
  const id = Number(ctx.params.id);
  const [p, todos, casaSem] = await Promise.all([dados.parlamentar(id), dados.parlamentares().catch(() => null), dados.semanaCasa()]);
  if (!ctx.valido()) return;
  const membros = casa.membros || 513;
  const ids = (todos?.parlamentares || []).map((x) => x.id);
  const cadeira = ids.length ? atribuirCadeiras(ids, membros).get(id) ?? cadeiraDe(id, membros) : cadeiraDe(id, membros);
  const votos = p.votos || [];
  let vistos = PASSO_VOTOS;
  const P = (pid) => lista.porId.get(Number(pid));
  const titulo = (pid) => lista.resumos.get(Number(pid))?.titulo || P(pid)?.ementa || '';
  const tipoSimb = (pid) => simbolica(P(pid)?.ementa);
  const nSimb = (p.autorias || []).filter((a) => tipoSimb(a.proposicao_id)).length;
  const porSemana = agruparPorSemana(p, casaSem);
  const casaVota = votos.length > 0 || Object.values(casaSem?.semanas || {}).some((c) => c.votacoes_plenario || c.votacoes_comissoes);
  const listaSem = [...porSemana.keys()].sort((a, b) => (a < b ? 1 : -1));

  main.innerHTML = String(html`
    <a class="volta" href="${href('/parlamentares')}">${raw(ICONE.volta)} ${nomeParl(casa).replace(/^./, (c) => c.toUpperCase())}</a>
    <header class="parl-cab">
      ${avatar(p.nome, p.foto_url, 88)}
      <div class="parl-cab__txt">
        <p class="olho">${casa.parlamentar || 'Parlamentar'} · ${casa.nome}</p>
        <h1>${p.nome}</h1>
        <p class="parl-cab__meta">${p.partido || 'sem partido'}${p.uf ? '-' + p.uf : ''} · ${p.em_exercicio === false ? 'fora de exercício' : 'em exercício'}${p.nome_civil && p.nome_civil !== p.nome ? html` · nome civil: ${p.nome_civil}` : ''}</p>
        <div class="prop-cab__acoes">
          ${p.url_fonte ? html`<a class="btn" href="${p.url_fonte}" target="_blank" rel="noopener">${raw(ICONE.externo)} Página oficial</a>` : ''}
          ${p.email ? html`<a class="btn" href="mailto:${p.email}">E-mail</a>` : ''}
        </div>
      </div>
    </header>

    <div class="parl-grade">
      <section class="parl-plenario" aria-labelledby="h-plen">
        <div class="secao__cab"><h2 id="h-plen">No plenário</h2></div>
        <div id="hemi"></div>
      </section>
      <section aria-labelledby="h-num">
        <h2 id="h-num" class="vh">Em números</h2>
        <div class="tempos tempos--4">
          <div class="tempo"><span>Autorias</span><b>${fmtN(p.autorias?.length ?? p.n_autorias)}</b>${nSimb ? html`<small class="tempo__nota">${fmtN(nSimb)} de homenagem, nome, data ou utilidade pública</small>` : ''}</div>
          <div class="tempo"><span>Relatorias</span><b>${fmtN(p.relatorias?.length ?? p.n_relatorias)}</b></div>
          <div class="tempo"><span>Votos registrados</span><b>${fmtN(votos.length)}</b></div>
          <div class="tempo"><span>Discursos</span><b>${fmtN(p.discursos?.length ?? 0)}</b></div>
        </div>
        ${p.comissoes?.length ? html`<h3 class="sub">Comissões</h3><div class="chips">${p.comissoes.map((c) => html`<span class="chip" title="${c.nome || nomeOrgao(c.sigla)}">${c.sigla}${c.papel ? html` <small>· ${c.papel.toLowerCase()}</small>` : ''}</span>`)}</div>` : ''}
      </section>
    </div>

    ${listaSem.length ? html`<section class="secao" aria-labelledby="h-sem">
      <div class="secao__cab"><h2 id="h-sem">Semana a semana</h2><p>O que ficou registrado de ${p.nome} em cada semana, ao lado do que a Casa fez.</p></div>
      <div class="seletor-semana">
        <button type="button" class="btn btn--icone" data-sem-ir="1" aria-label="Semana anterior"><span aria-hidden="true">‹</span></button>
        <label class="vh" for="sel-sem-parl">Escolher semana</label>
        <select id="sel-sem-parl">${listaSem.map((w) => raw(`<option value="${w}">${rotuloSemana(w)}</option>`))}</select>
        <button type="button" class="btn btn--icone" data-sem-ir="-1" aria-label="Semana seguinte"><span aria-hidden="true">›</span></button>
      </div>
      <div id="sem-parl" class="sem-parl" aria-live="polite"></div>
      <p class="nota">Só entram as votações <b>nominais</b> sobre as proposições acompanhadas aqui: votação simbólica não registra o voto de cada um. Voto ou presença sem registro pode ser falta, licença, missão oficial ou outra atividade da Casa, e a base pública não diz qual. O site não dá nota nem compara parlamentares.</p>
    </section>` : ''}

    <div class="duas secao">
      <section aria-labelledby="h-aut">
        <div class="secao__cab"><h2 id="h-aut">Autorias</h2><p>${plural(p.autorias?.length || 0, 'proposição', 'proposições')}</p></div>
        ${p.autorias?.length ? html`<ul class="lista-simples">${p.autorias.slice(0, 30).map((a) => {
          const pr = P(a.proposicao_id);
          return html`<li><a class="mono" href="${href('/p/' + a.proposicao_id)}">${a.sigla}</a> ${etapaTag(pr?.etapa || a.etapa)}${a.proponente === false ? html` <small class="mudo">coautoria</small>` : ''}${tipoSimb(a.proposicao_id) ? html` <span class="chip chip--simb">${tipoSimb(a.proposicao_id)}</span>` : ''}${pr ? html`<span class="lista-simples__txt">${lista.resumos.get(Number(pr.id))?.titulo || pr.ementa}</span>` : ''}</li>`;
        })}</ul>${p.autorias.length > 30 ? html`<p class="nota">Mostrando 30 de ${fmtN(p.autorias.length)}. <a href="${href('/tabuleiro?autor=' + encodeURIComponent(p.nome))}">Ver todas no tabuleiro</a></p>` : ''}` : vazio('Nenhuma autoria registrada.')}
      </section>
      <section aria-labelledby="h-rel">
        <div class="secao__cab"><h2 id="h-rel">Relatorias</h2><p>${plural(p.relatorias?.length || 0, 'designação', 'designações')}</p></div>
        ${p.relatorias?.length ? html`<ul class="lista-simples">${p.relatorias.slice(0, 30).map((r) => {
          const pr = P(r.proposicao_id);
          return html`<li><a class="mono" href="${href('/p/' + r.proposicao_id)}">${r.sigla}</a> <span class="chip" title="${nomeOrgao(r.orgao)}">${r.orgao}</span> <small class="mudo">desde ${fmtData(r.desde)}</small>${pr ? html`<span class="lista-simples__txt">${lista.resumos.get(Number(pr.id))?.titulo || pr.ementa}</span>` : ''}</li>`;
        })}</ul>` : vazio('Nenhuma relatoria registrada.')}
      </section>
    </div>

    <section class="secao" aria-labelledby="h-votos">
      <div class="secao__cab"><h2 id="h-votos">Votos</h2><p>Votações nominais em que o voto foi registrado. “Orientação” é o que o partido indicou naquela votação.</p></div>
      ${votos.length ? html`<div class="tabela-rolagem"><table class="votos"><thead><tr><th>Data</th><th>Proposição</th><th>Voto</th><th>Orientação do partido</th><th><span class="vh">Plenário</span></th></tr></thead><tbody id="votos-corpo"></tbody></table></div><div id="votos-mais"></div>` : vazio('Nenhum voto registrado.')}
    </section>

    ${p.discursos?.length ? html`<section class="secao" aria-labelledby="h-disc">
      <div class="secao__cab"><h2 id="h-disc">Discursos</h2></div>
      <ul class="lista-simples">${p.discursos.slice(0, 20).map((x) => html`<li><small class="mudo">${fmtData(x.data)}</small><span class="lista-simples__txt">${x.sumario}${x.url ? html` <a href="${x.url}" target="_blank" rel="noopener" aria-label="Fonte do discurso">↗</a>` : ''}</span></li>`)}</ul>
    </section>` : ''}
  `);

  const $ = (s) => main.querySelector(s);
  function hemiNeutro() {
    $('#hemi').innerHTML = String(hemiciclo({ membros, grupos: [], resto: { cls: 'h-neutra', nome: 'Cadeiras' }, destaque: cadeira, legenda: false, rotulo: `Plenário com ${membros} cadeiras, uma delas destacada para ${p.nome}` }))
      + String(html`<p class="nota hemi-nota"><span class="leg-bola h-destaque"></span>${p.nome} — 1 de ${fmtN(membros)} cadeiras. Posição ilustrativa: as cadeiras não são marcadas no plenário. Escolha um voto abaixo para ver como ficou o plenário naquela votação.</p>`);
  }
  async function hemiVoto(v) {
    let pl = null, vot = null;
    try {
      const d = await dados.detalhe(v.proposicao_id);
      vot = (d.votacoes || []).find((x) => x.id === v.votacao_id);
      pl = vot && ehNominal(vot) ? vot.placar : null;
    } catch (e) { /* sem detalhe */ }
    if (!pl) { hemiNeutro(); $('#hemi').insertAdjacentHTML('beforeend', String(html`<p class="nota">Placar dessa votação não disponível.</p>`)); return; }
    const grupos = gruposVotacao(pl);
    const cls = CLS_VOTO[v.voto] || 'h-obst';
    const g = inicioDoGrupo(grupos, cls);
    const seat = g.n ? g.ini + (cadeiraDe(id, g.n)) : cadeira;
    $('#hemi').innerHTML = String(html`<div class="plenario-vot__cab"><span class="rot">${v.sigla || ''} · ${fmtData(v.data)}</span><strong>${p.nome} votou ${v.voto}</strong>${v.orientacao_partido ? html`<span class="discreto">orientação do partido: ${v.orientacao_partido}</span>` : ''}</div>`)
      + String(hemiciclo({ membros, grupos, destaque: seat }))
      + String(html`<p class="nota hemi-nota"><span class="leg-bola h-anel ${cls}"></span>cadeira de ${p.nome} (ilustrativa), dentro da faixa do seu voto. <button type="button" class="btn btn--mini btn--leve" data-neutro>voltar</button></p>`);
  }
  function linhasVotos() {
    const corpo = $('#votos-corpo'); if (!corpo) return;
    corpo.innerHTML = votos.slice(0, vistos).map((v, i) => String(html`<tr>
      <td class="nowrap">${fmtData(v.data)}</td>
      <td><a class="mono" href="${href('/p/' + v.proposicao_id)}">${v.sigla || P(v.proposicao_id)?.sigla || v.proposicao_id}</a>${v.descricao ? html`<span class="lista-simples__txt">${v.descricao}</span>` : ''}</td>
      <td><span class="voto-pt"><i class="${CLS_VOTO[v.voto] || 'h-obst'}"></i>${v.voto}</span></td>
      <td>${v.orientacao_partido || '—'}</td>
      <td><button type="button" class="btn btn--mini" data-voto="${i}">Ver no plenário</button></td></tr>`)).join('');
    $('#votos-mais').innerHTML = botaoMais('votos', votos.length - Math.min(vistos, votos.length), PASSO_VOTOS);
  }
  // ---------- semana a semana ----------
  const resultadoVot = new Map(); // votacao_id -> aprovada (do resumo semanal da Casa)
  async function desenharSemana(w) {
    const alvo = $('#sem-parl'); if (!alvo) return;
    const e = porSemana.get(w) || {};
    const temVoto = (e.votos || []).length;
    if (temVoto && !resultadoVot.has('@' + w)) {
      resultadoVot.set('@' + w, true);
      try { for (const v of (await dados.semana(w)).votadas || []) resultadoVot.set(v.votacao_id, v.aprovada); } catch (err) { /* sem resumo da semana */ }
      if (!ctx.valido() || $('#sel-sem-parl')?.value !== w) return;
    }
    alvo.innerHTML = String(semanaHTML(w, e));
    const sel = $('#sel-sem-parl'); const i = listaSem.indexOf(w);
    main.querySelector('[data-sem-ir="1"]').disabled = i >= listaSem.length - 1;
    main.querySelector('[data-sem-ir="-1"]').disabled = i <= 0;
    if (sel.value !== w) sel.value = w;
  }
  function contextoCasa(w, e) {
    const c = casaSem?.semanas?.[w] || {};
    const curto = casa.curto || casa.nome;
    const partes = [];
    const nPlen = new Set((e.votos || []).filter((v) => v.orgao === 'PLEN').map((v) => v.votacao_id)).size;
    const nCom = new Set((e.votos || []).filter((v) => v.orgao !== 'PLEN').map((v) => v.votacao_id)).size;
    if ('reunioes_plenario' in c || 'reunioes_comissoes' in c || (e.presencas || []).length) {
      const pPlen = (e.presencas || []).filter((r) => r.orgao === 'PLEN').length, pCom = (e.presencas || []).length - pPlen;
      partes.push(c.reunioes_plenario ? html`${plural(c.reunioes_plenario, 'reunião', 'reuniões')} do Plenário, com presença registrada de ${p.nome} em <b>${fmtN(pPlen)}</b>` : html`nenhuma reunião do Plenário com presença registrada`);
      if (c.reunioes_comissoes) partes.push(html`${plural(c.reunioes_comissoes, 'reunião', 'reuniões')} de comissão, com presença em <b>${fmtN(pCom)}</b> (cada um só participa das comissões de que é membro)`);
    } else {
      partes.push(c.votacoes_plenario ? html`${plural(c.votacoes_plenario, 'votação nominal', 'votações nominais')} no Plenário; ${p.nome} registrou voto em <b>${fmtN(nPlen)}</b>` : html`nenhuma votação nominal no Plenário`);
      if (c.votacoes_comissoes) partes.push(html`${plural(c.votacoes_comissoes, 'votação nominal', 'votações nominais')} em comissões, com voto em <b>${fmtN(nCom)}</b> (só vota quem é membro da comissão)`);
    }
    return html`<p class="sem-parl__casa"><span class="olho">Na ${curto} nesta semana</span> ${partes.map((x, k) => html`${k ? '; ' : ''}${x}`)}.</p>`;
  }
  function frasePartido(v) {
    const o = v.orientacao_partido;
    if (!o || v.voto === 'Artigo 17') return '';
    if (/libera/i.test(o)) return 'o partido liberou o voto';
    return norm(o) === norm(v.voto) ? 'como o partido orientou' : `o partido orientou ${o}`;
  }
  function linhaProp(pid, sigla) {
    const t = titulo(pid);
    const tipo = tipoSimb(pid);
    return html`<a href="${href('/p/' + pid)}">${t || sigla}</a> <small class="mudo mono">${sigla || P(pid)?.sigla || ''}</small>${tipo ? html` <span class="chip chip--simb">${tipo}</span>` : ''}`;
  }
  function semanaHTML(w, e) {
    const itens = [];
    // votos agrupados por proposição (destaques e requerimentos da mesma proposição ficam juntos)
    const grupos = new Map();
    for (const v of e.votos || []) { if (!grupos.has(v.proposicao_id)) grupos.set(v.proposicao_id, []); grupos.get(v.proposicao_id).push(v); }
    for (const [pid, vs] of grupos) {
      itens.push(html`<li class="feito"><span class="feito__verbo">Votou</span><div class="feito__txt">${linhaProp(pid, vs[0].sigla)}
        <ul class="feito__votos">${vs.sort((a, b) => (a.data < b.data ? -1 : 1)).map((v) => {
          const r = resultadoVot.get(v.votacao_id);
          const det = [v.orgao === 'PLEN' ? 'Plenário' : nomeOrgao(v.orgao), fmtData(v.data, { ano: false }), v.turno, r === true ? 'resultado: aprovado' : r === false ? 'resultado: rejeitado' : '', frasePartido(v)].filter(Boolean).join(' · ');
          return html`<li><span class="voto-pt"><i class="${CLS_VOTO[v.voto] || 'h-obst'}"></i>${v.voto === 'Artigo 17' ? 'não vota (presidia, art. 17)' : v.voto}</span> <small class="mudo">${det}</small></li>`;
        })}</ul></div></li>`);
    }
    for (const a of e.autorias || []) itens.push(html`<li class="feito"><span class="feito__verbo">Apresentou</span><div class="feito__txt">${linhaProp(a.proposicao_id, a.sigla)} <small class="mudo">${a.proponente === false ? 'coautoria' : 'autoria'} · ${fmtData(a.data_apresentacao || a.data, { ano: false })}</small></div></li>`);
    for (const r of e.relatorias || []) itens.push(html`<li class="feito"><span class="feito__verbo">Passou a relatar</span><div class="feito__txt">${linhaProp(r.proposicao_id, r.sigla)} <small class="mudo">${nomeOrgao(r.orgao)}${r.turno ? ' · ' + r.turno : ''} · ${fmtData(r.desde, { ano: false })}</small></div></li>`);
    for (const d of e.discursos || []) itens.push(html`<li class="feito"><span class="feito__verbo">Discursou</span><div class="feito__txt">${d.sumario || d.tipo || 'Pronunciamento'}${d.url ? html` <a href="${d.url}" target="_blank" rel="noopener" aria-label="Fonte do discurso">↗</a>` : ''} <small class="mudo">${fmtData(d.data, { ano: false })} · sumário oficial da Casa</small></div></li>`);
    return html`${contextoCasa(w, e)}
      ${itens.length ? html`<ul class="feitos">${itens}</ul>` : html`<p class="vazio">${(e.presencas || []).length ? 'Além das presenças, nenhum' : 'Nenhum'} registro de ${casaVota ? 'voto, ' : ''}proposição, relatoria ou discurso de ${p.nome} nesta semana.</p>`}`;
  }

  hemiNeutro();
  linhasVotos();
  if (listaSem.length) {
    desenharSemana(listaSem[0]);
    $('#sel-sem-parl').addEventListener('change', (ev) => desenharSemana(ev.target.value));
  }
  main.addEventListener('click', (e) => {
    const b = e.target.closest('[data-voto]');
    if (b) { hemiVoto(votos[Number(b.dataset.voto)]); $('#hemi').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    if (e.target.closest('[data-neutro]')) hemiNeutro();
    if (e.target.closest('[data-mais="votos"]')) { vistos += PASSO_VOTOS; linhasVotos(); }
    const ir = e.target.closest('[data-sem-ir]');
    if (ir && !ir.disabled) { const k = listaSem.indexOf($('#sel-sem-parl').value) + Number(ir.dataset.semIr); if (listaSem[k]) desenharSemana(listaSem[k]); }
  });
  return p.nome;
}

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Agrupa votos, autorias, relatorias, discursos e presenças por semana ISO. Entram também as semanas em que a Casa
// votou ou se reuniu e o parlamentar não tem registro — dentro do período em que ele tem alguma atividade, para não
// cobrar semanas de antes do mandato ou depois da saída.
function agruparPorSemana(p, casaSem) {
  const m = new Map();
  const add = (data, k, x) => {
    const d = parseData(data); if (!d) return;
    const w = semanaISO(d);
    if (!m.has(w)) m.set(w, {});
    (m.get(w)[k] ||= []).push(x);
  };
  for (const v of p.votos || []) add(v.data, 'votos', v);
  for (const a of p.autorias || []) add(a.data_apresentacao || a.data, 'autorias', a);
  for (const r of p.relatorias || []) add(r.desde, 'relatorias', r);
  for (const d of p.discursos || []) add(d.data, 'discursos', d);
  for (const r of p.presencas || []) add(r.data, 'presencas', r);
  if (casaSem?.semanas && m.size) {
    const ws = [...m.keys()].sort();
    const ini = ws[0];
    const fim = p.em_exercicio === false ? ws[ws.length - 1] : '9999';
    for (const w of Object.keys(casaSem.semanas)) if (w >= ini && w <= fim && !m.has(w)) m.set(w, {});
  }
  return m;
}
