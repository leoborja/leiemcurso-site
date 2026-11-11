// Página da proposição: resumo, percurso com tempo em cada etapa, votações (com hemiciclo), tramitações,
// autoria/relatoria (com link para a página do parlamentar) e fonte oficial.
import * as dados from '../data.js';
import { html, raw, etapaTag, trilhaMini, contadorParado, botaoSeguir, fmtData, fmtDataHoraBRT, fmtN, fmtDuracao, diasEntre, ETAPA, TERMINAIS, TIPOS, nomeOrgao, ICONE, vazio, href, estado, seloResumo } from '../ui.js';
import { hemiciclo, gruposVotacao } from '../hemiciclo.js';

const somaPlacar = (pl) => (pl ? (pl.sim || 0) + (pl.nao || 0) + (pl.abstencao || 0) + (pl.obstrucao || 0) + (pl.outros || 0) : 0);
export const ehNominal = (v) => v && v.nominal !== false && somaPlacar(v.placar) > 0;

// Barra de placar. Aceita a votação inteira (para saber se foi simbólica) ou só o placar.
export function placarHTML(v, compacto = false) {
  const pl = v.placar ? v.placar : v;
  if (v.placar !== undefined && !ehNominal(v)) return String(html`<p class="discreto">Votação simbólica — sem placar nominal.</p>`);
  const sim = pl.sim || 0, nao = pl.nao || 0, abst = pl.abstencao || 0, obst = (pl.obstrucao || 0) + (pl.outros || 0);
  const tot = sim + nao + abst + obst || 1;
  const pct = (x) => (100 * x / tot).toFixed(2);
  return String(html`
    <div class="placar" role="img" aria-label="Placar: ${sim} sim, ${nao} não, ${abst} abstenções${obst ? `, ${obst} obstrução ou outros` : ''}">
      <span class="s" style="width:${pct(sim)}%"></span><span class="n" style="width:${pct(nao)}%"></span>${abst ? html`<span class="a" style="width:${pct(abst)}%"></span>` : ''}${obst ? html`<span class="o" style="width:${pct(obst)}%"></span>` : ''}
    </div>
    <div class="placar-leg ${compacto ? 'placar-leg--mini' : ''}">
      <span><i style="--c:var(--sim)"></i>Sim <b>${fmtN(sim)}</b></span>
      <span><i style="--c:var(--nao)"></i>Não <b>${fmtN(nao)}</b></span>
      ${abst || !compacto ? html`<span><i style="--c:var(--abst)"></i>Abstenção <b>${fmtN(abst)}</b></span>` : ''}
      ${obst ? html`<span><i style="--c:var(--obst)"></i>Obstrução/outros <b>${fmtN(obst)}</b></span>` : ''}
    </div>`);
}

const idParl = (x) => x?.id_parlamentar ?? x?.id_deputado ?? null;
function nomePessoa(a) {
  const tit = /Deputad|Vereador|Senador/.test(a.tipo || '') ? ({ Senador: 'Sen. ', Vereador: 'Ver. ' }[a.tipo] || 'Dep. ') : '';
  const nome = html`${tit}${a.nome}`;
  const id = idParl(a);
  return estado.temParlamentares && id ? html`<a href="${href('/parlamentar/' + id)}">${nome}</a>` : nome;
}

export default async function proposicao(main, ctx) {
  const { lista, casa } = ctx;
  const id = Number(ctx.params.id);
  const linha = lista.porId.get(id);
  let d;
  try { d = await dados.detalhe(id); } catch (e) {
    if (!linha) throw new Error('Proposição não encontrada nesta casa.');
    d = { ...linha, etapas: [], tramitacoes: [], votacoes: [], autores: [linha.autor_principal], relatores: [], _semDetalhe: true };
  }
  const resumo = await dados.resumo(id);
  if (!ctx.valido()) return;
  const p = { ...linha, ...d };
  const hoje = (lista.gerado_em || new Date().toISOString()).slice(0, 10);
  const etapas = (p.etapas || []).map((e) => ({ ...e, dias: diasEntre(e.inicio, e.fim || hoje) }));
  const vividas = etapas.map((e) => e.etapa);
  const total = diasEntre(p.data_apresentacao, TERMINAIS.has(p.etapa) ? (etapas.at(-1)?.inicio || hoje) : hoje);
  const tram = [...(p.tramitacoes || [])].sort((a, b) => (a.data < b.data ? 1 : -1));
  const votos = [...(p.votacoes || [])].sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
  const plenNominais = votos.filter((v) => v.orgao === 'PLEN' && ehNominal(v));
  let votoHemi = plenNominais[0] || null;
  const vinc = p.vinculo_outra_casa;
  const fonte = p.url_fonte;
  const autores = (p.autores?.length ? p.autores : [p.autor_principal]).filter(Boolean);

  main.innerHTML = String(html`
    <a class="volta" href="${href('/tabuleiro')}">${raw(ICONE.volta)} Tabuleiro</a>
    <header class="prop-cab">
      <div class="prop-cab__linha">
        <span class="sigla">${p.sigla}</span>
        <span class="discreto">${TIPOS[p.tipo] || p.tipo} · ${casa.nome}</span>
      </div>
      <h1>${resumo?.titulo || p.ementa}</h1>
      ${resumo ? html`<p class="prop-cab__ementa"><span class="rot">Ementa oficial</span> ${p.ementa}</p>` : ''}
      ${resumo && !resumo.tldr?.length ? html`<p class="prop-cab__selo">${seloResumo()}</p>` : ''}
      <div class="prop-cab__linha">${etapaTag(p.etapa)} ${trilhaMini(p.etapa, vividas)} ${contadorParado(p)}</div>
      <div class="chips">${(p.tema || []).map((t) => html`<a class="chip" href="${href('/tabuleiro?tema=' + encodeURIComponent(t))}">${t}</a>`)}</div>
      <div class="prop-cab__acoes">
        ${botaoSeguir(id, dados.seguindo(id))}
        ${fonte ? html`<a class="btn" href="${fonte}" target="_blank" rel="noopener">${raw(ICONE.externo)} Ficha oficial (${casa.curto || casa.nome})</a>` : ''}
        ${vinc?.url ? html`<a class="btn" href="${vinc.url}" target="_blank" rel="noopener">${raw(ICONE.externo)} ${vinc.sigla || 'Na outra casa'} no ${vinc.casa}</a>` : ''}
      </div>
    </header>

    ${resumo?.tldr?.length ? html`<section class="resumo" aria-labelledby="h-resumo">
      <div class="resumo__cab"><h2 id="h-resumo">Em resumo</h2>${seloResumo()}</div>
      <ul>${(resumo.tldr || []).map((t) => html`<li>${t}</li>`)}</ul>
      <p class="resumo__pe">Gerado automaticamente${resumo.gerado_em ? ` em ${fmtData(resumo.gerado_em)}` : ''} a partir de ${(resumo.fontes || ['ementa']).join(', ').replace('inteiro_teor', 'inteiro teor').replace('tramitacao', 'tramitação')}${resumo.revisado ? ', revisado por pessoa' : ', sem revisão humana'}. Pode conter imprecisões: confira ${fonte ? html`<a href="${fonte}" target="_blank" rel="noopener">a fonte oficial ↗</a>` : 'a fonte oficial'}.</p>
    </section>` : ''}

    <div class="prop-grade">
      <div>
        <section aria-labelledby="h-etapas">
          <div class="secao__cab"><h2 id="h-etapas">Percurso</h2><p>${total != null ? `${fmtDuracao(total)} desde a apresentação` : ''}</p></div>
          ${etapas.length ? html`
            <div class="faixa" role="img" aria-label="Proporção do tempo em cada etapa">
              ${etapas.filter((e) => !TERMINAIS.has(e.etapa)).map((e) => html`<span class="${e.fim ? '' : 'atual'}" style="flex:${Math.max(e.dias || 0, 1)} 0 0;--cor:${raw(ETAPA[e.etapa]?.cor || 'var(--e-fim)')}" title="${ETAPA[e.etapa]?.nome}: ${fmtDuracao(e.dias)}"></span>`)}
            </div>
            <div class="faixa-eixo"><span>${fmtData(p.data_apresentacao)}</span><span>${TERMINAIS.has(p.etapa) ? fmtData(etapas.at(-1).inicio) : 'hoje'}</span></div>
            <ol class="linha-tempo">
              ${etapas.map((e) => {
                const meta = ETAPA[e.etapa] || { nome: e.etapa, cor: 'var(--e-fim)' };
                const term = TERMINAIS.has(e.etapa);
                const cls = e.etapa === 'lei' ? 'lei' : term ? 'fim' : !e.fim ? 'atual' : '';
                return html`<li class="${cls}" style="--cor:${raw(meta.cor)}">
                  <span class="ponto" aria-hidden="true"></span>
                  <h3>${meta.nome}${!e.fim && !term ? ' — agora' : ''}</h3>
                  ${term ? html`<span class="dur"></span>` : html`<span class="dur">${fmtDuracao(e.dias)}<small>${e.fim ? 'nesta etapa' : 'até agora'}</small></span>`}
                  <span class="datas">${term ? `em ${fmtData(e.inicio)}` : `${fmtData(e.inicio)} → ${e.fim ? fmtData(e.fim) : 'hoje'}`}</span>
                  ${e.orgaos?.length ? html`<span class="orgaos chips">${e.orgaos.map((o) => html`<span class="chip" title="${nomeOrgao(o)}">${o}</span>`)}</span>` : ''}
                </li>`;
              })}
            </ol>` : vazio(p._semDetalhe ? 'Detalhe desta proposição ainda não coletado.' : 'Sem etapas registradas.')}
        </section>

        <section class="secao" aria-labelledby="h-vot">
          <div class="secao__cab"><h2 id="h-vot">Votações</h2><p>${votos.length ? `${votos.length} registrada${votos.length > 1 ? 's' : ''}` : ''}</p></div>
          ${votoHemi ? html`<div class="plenario-vot" id="plenario-vot"></div>` : ''}
          ${votos.length ? html`<div class="lista" id="lista-vot">${votos.map((v) => html`
            <article class="votacao ${v === votoHemi ? 'is-sel' : ''}" data-vid="${v.id}">
              <div class="votacao__topo"><strong><span class="voto-res ${v.aprovada ? 'is-sim' : 'is-nao'}">${v.aprovada ? 'Aprovada' : 'Rejeitada'}</span> · ${v.orgao === 'PLEN' ? 'Plenário' : nomeOrgao(v.orgao)}${v.turno ? ` · ${v.turno}º turno` : ''}</strong><span class="discreto">${fmtData(v.data)}</span></div>
              <p class="votacao__desc">${v.descricao}</p>
              ${raw(placarHTML(v))}
              <div class="votacao__pe">
                ${v.orgao === 'PLEN' && ehNominal(v) ? html`<button type="button" class="btn btn--mini" data-hemi="${v.id}">Ver no plenário</button>` : ''}
                ${v.url ? html`<a class="discreto" href="${v.url}" target="_blank" rel="noopener">Fonte da votação ↗</a>` : ''}
              </div>
            </article>`)}</div>` : vazio('Nenhuma votação registrada até agora.')}
        </section>

        <section class="secao" aria-labelledby="h-tram">
          <div class="secao__cab"><h2 id="h-tram">Tramitações</h2><p>${tram.length ? `${fmtN(tram.length)} movimentações, da mais recente para a mais antiga` : ''}</p></div>
          ${tram.length ? html`<ol class="tramites" id="tramites">${tram.map((t, i) => html`
            <li ${i >= 8 ? raw('data-extra hidden') : ''}><time datetime="${t.data}">${fmtDataHoraBRT(t.data)}</time>
              <span><span class="org" title="${nomeOrgao(t.orgao)}">${t.orgao}</span><b class="tram-tipo">${t.descricao}</b>${t.despacho ? html` <span class="tram-desp">${t.despacho}</span>` : ''}${t.url ? html` <a href="${t.url}" target="_blank" rel="noopener" aria-label="Fonte desta movimentação">↗</a>` : ''}</span></li>`)}</ol>
            ${tram.length > 8 ? html`<div class="mais"><button class="btn" type="button" id="mais-tram">Mostrar todas as ${fmtN(tram.length)}</button></div>` : ''}` : vazio('Sem tramitações registradas.')}
        </section>
      </div>

      <aside class="ficha" aria-label="Ficha da proposição">
        ${!TERMINAIS.has(p.etapa) ? html`<div><span class="rot">Última movimentação</span><span class="grande">${fmtN(p.dias_parado)}<small> dias atrás</small></span><span class="discreto">${fmtData(p.ultima_movimentacao)} · ${nomeOrgao(p.orgao_atual)}</span></div>` : ''}
        <div><span class="rot">Apresentada em</span><span>${fmtData(p.data_apresentacao)}</span></div>
        <div><span class="rot">Autoria</span>${autores.map((a) => html`<span class="pessoa">${nomePessoa(a)}${a.partido ? html` <small>${a.partido}${a.uf ? '-' + a.uf : ''}</small>` : ''}</span>`)}</div>
        <div><span class="rot">Relatoria</span>${p.relatores?.length ? p.relatores.map((r) => html`<span class="pessoa">${nomePessoa({ ...r, tipo: 'Deputado' })} <small>${r.orgao} · desde ${fmtData(r.desde)}</small></span>`) : html`<span class="mudo">Sem relator designado</span>`}</div>
        ${p.regime ? html`<div><span class="rot">Regime</span><span>${p.regime}</span></div>` : ''}
        ${p.orgao_atual ? html`<div><span class="rot">Órgão atual</span><span>${nomeOrgao(p.orgao_atual)}${nomeOrgao(p.orgao_atual) !== p.orgao_atual ? html` <small class="mudo mono">${p.orgao_atual}</small>` : ''}</span></div>` : ''}
        ${casa.bicameral !== false ? html`<div><span class="rot">Na outra casa</span>${vinc?.sigla ? html`<a href="${vinc.url}" target="_blank" rel="noopener">${vinc.sigla} (${vinc.casa}) ↗</a>` : html`<span class="mudo">${p.etapa === 'lei' || vinc?.data ? 'Passou pela outra casa (vínculo não identificado)' : 'Ainda não chegou à outra casa'}</span>`}</div>` : ''}
        <div><span class="rot">Fonte</span>${fonte ? html`<a href="${fonte}" target="_blank" rel="noopener">${casa.nome} — ficha de tramitação ↗</a>` : html`<span class="mudo">—</span>`}</div>
      </aside>
    </div>
  `);

  function mostrarHemi(v) {
    const alvo = main.querySelector('#plenario-vot');
    if (!alvo || !v) return;
    const pres = somaPlacar(v.placar);
    alvo.innerHTML = String(html`
      <div class="plenario-vot__cab"><span class="rot">No plenário</span><strong>${v.aprovada ? 'Aprovada' : 'Rejeitada'} em ${fmtData(v.data)}${v.turno ? ` · ${v.turno}º turno` : ''}</strong>
        <span class="discreto">${fmtN(pres)} votos registrados de ${fmtN(casa.membros)} cadeiras</span></div>
      ${hemiciclo({ membros: casa.membros || pres, grupos: gruposVotacao(v.placar) })}
      <p class="nota">Cada bolinha é uma cadeira. As cores mostram só o voto; os grupos são preenchidos da fila da frente para a de trás, sem relação com partido ou posição real no plenário.</p>`);
    main.querySelectorAll('.votacao').forEach((a) => a.classList.toggle('is-sel', a.dataset.vid === v.id));
  }
  mostrarHemi(votoHemi);

  main.addEventListener('click', (e) => {
    const b = e.target.closest('[data-hemi]');
    if (b) {
      votoHemi = votos.find((v) => v.id === b.dataset.hemi);
      mostrarHemi(votoHemi);
      main.querySelector('#plenario-vot').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    if (e.target.id === 'mais-tram') { main.querySelectorAll('#tramites [data-extra]').forEach((li) => (li.hidden = false)); e.target.parentElement.remove(); }
  });
  return p.sigla;
}
