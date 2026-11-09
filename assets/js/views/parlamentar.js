// Página do parlamentar: cadeira ilustrativa no plenário, atividade por semana, comissões, autorias,
// relatorias, votos (com a orientação do partido, como fato, sem índice de "fidelidade") e discursos.
import * as dados from '../data.js';
import { html, raw, avatar, fmtN, fmtData, plural, vazio, href, etapaTag, rotuloSemana, nomeOrgao, botaoMais, ICONE, nomeParl } from '../ui.js';
import { hemiciclo, gruposVotacao, atribuirCadeiras, cadeiraDe, inicioDoGrupo } from '../hemiciclo.js';
import { semParlamentares } from './parlamentares.js';
import { ehNominal } from './proposicao.js';

const CLS_VOTO = { Sim: 'h-sim', Não: 'h-nao', Nao: 'h-nao', Abstenção: 'h-abst', Abstencao: 'h-abst', Obstrução: 'h-obst', Obstrucao: 'h-obst' };
const PASSO_VOTOS = 15;

export default async function parlamentar(main, ctx) {
  const { casa, lista } = ctx;
  if (!dados.tem('parlamentares')) { main.innerHTML = String(semParlamentares(casa)); return 'Parlamentar'; }
  const id = Number(ctx.params.id);
  const [p, todos] = await Promise.all([dados.parlamentar(id), dados.parlamentares().catch(() => null)]);
  if (!ctx.valido()) return;
  const membros = casa.membros || 513;
  const ids = (todos?.parlamentares || []).map((x) => x.id);
  const cadeira = ids.length ? atribuirCadeiras(ids, membros).get(id) ?? cadeiraDe(id, membros) : cadeiraDe(id, membros);
  const semanas = [...(p.semanas || [])].sort((a, b) => (a.semana < b.semana ? 1 : -1)).slice(0, 12);
  const maxSem = Math.max(1, ...semanas.map((s) => Math.max(s.autorias || 0, s.votos || 0, s.relatorias || 0, s.discursos || 0)));
  const votos = p.votos || [];
  let vistos = PASSO_VOTOS;
  const P = (pid) => lista.porId.get(Number(pid));

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
          <div class="tempo"><span>Autorias</span><b>${fmtN(p.autorias?.length ?? p.n_autorias)}</b></div>
          <div class="tempo"><span>Relatorias</span><b>${fmtN(p.relatorias?.length ?? p.n_relatorias)}</b></div>
          <div class="tempo"><span>Votos registrados</span><b>${fmtN(votos.length)}</b></div>
          <div class="tempo"><span>Discursos</span><b>${fmtN(p.discursos?.length ?? 0)}</b></div>
        </div>
        ${p.comissoes?.length ? html`<h3 class="sub">Comissões</h3><div class="chips">${p.comissoes.map((c) => html`<span class="chip" title="${c.nome || nomeOrgao(c.sigla)}">${c.sigla}${c.papel ? html` <small>· ${c.papel.toLowerCase()}</small>` : ''}</span>`)}</div>` : ''}
      </section>
    </div>

    ${semanas.length ? html`<section class="secao" aria-labelledby="h-sem">
      <div class="secao__cab"><h2 id="h-sem">Atividade por semana</h2><p>Últimas ${semanas.length} semanas com registro</p></div>
      <div class="ativ" role="table" aria-label="Atividade por semana">
        <div class="ativ__lin ativ__cab" role="row"><span role="columnheader">Semana</span><span role="columnheader">Autorias</span><span role="columnheader">Relatorias</span><span role="columnheader">Votos</span><span role="columnheader">Discursos</span></div>
        ${semanas.map((s) => html`<div class="ativ__lin" role="row"><span role="rowheader">${rotuloSemana(s.semana, s.inicio, s.fim)}</span>
          ${['autorias', 'relatorias', 'votos', 'discursos'].map((k) => html`<span role="cell" class="ativ__c"><i style="width:${(100 * (s[k] || 0)) / maxSem}%"></i><b>${fmtN(s[k] || 0)}</b></span>`)}</div>`)}
      </div>
    </section>` : ''}

    <div class="duas secao">
      <section aria-labelledby="h-aut">
        <div class="secao__cab"><h2 id="h-aut">Autorias</h2><p>${plural(p.autorias?.length || 0, 'proposição', 'proposições')}</p></div>
        ${p.autorias?.length ? html`<ul class="lista-simples">${p.autorias.slice(0, 30).map((a) => {
          const pr = P(a.proposicao_id);
          return html`<li><a class="mono" href="${href('/p/' + a.proposicao_id)}">${a.sigla}</a> ${etapaTag(pr?.etapa || a.etapa)}${a.proponente === false ? html` <small class="mudo">coautoria</small>` : ''}${pr ? html`<span class="lista-simples__txt">${lista.resumos.get(Number(pr.id))?.titulo || pr.ementa}</span>` : ''}</li>`;
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
  hemiNeutro();
  linhasVotos();
  main.addEventListener('click', (e) => {
    const b = e.target.closest('[data-voto]');
    if (b) { hemiVoto(votos[Number(b.dataset.voto)]); $('#hemi').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    if (e.target.closest('[data-neutro]')) hemiNeutro();
    if (e.target.closest('[data-mais="votos"]')) { vistos += PASSO_VOTOS; linhasVotos(); }
  });
  return p.nome;
}
