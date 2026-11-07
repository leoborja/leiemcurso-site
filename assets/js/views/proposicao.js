// Página da proposição: etapas com tempo em cada uma, tramitações, votações, autores/relatores, fonte.
import * as dados from '../data.js';
import { html, raw, esc, etapaTag, trilhaMini, contadorParado, botaoSeguir, fmtData, fmtDataHoraBRT, fmtN, fmtDuracao, diasEntre, ETAPA, TERMINAIS, TIPOS, nomeOrgao, ICONE, vazio } from '../ui.js';

export function placarHTML(pl, compacto = false) {
  const sim = pl.sim || 0, nao = pl.nao || 0, abst = pl.abstencao || 0;
  const tot = sim + nao + abst || 1;
  const pct = (v) => (100 * v / tot).toFixed(2);
  return String(html`
    <div class="placar" role="img" aria-label="Placar: ${sim} sim, ${nao} não, ${abst} abstenções">
      <span class="s" style="width:${pct(sim)}%" title="Sim: ${sim}"></span><span class="n" style="width:${pct(nao)}%" title="Não: ${nao}"></span>${abst ? html`<span class="a" style="width:${pct(abst)}%" title="Abstenção: ${abst}"></span>` : ''}
    </div>
    <div class="placar-leg" ${compacto ? raw('style="font-size:12.5px"') : ''}>
      <span><i style="--c:var(--sim)"></i>Sim <b>${fmtN(sim)}</b></span>
      <span><i style="--c:var(--nao)"></i>Não <b>${fmtN(nao)}</b></span>
      <span><i style="--c:var(--abst)"></i>Abstenção <b>${fmtN(abst)}</b></span>
    </div>`);
}

const HOJE = (lista) => (lista.gerado_em || new Date().toISOString()).slice(0, 10);

export default async function proposicao(main, ctx) {
  const id = Number(ctx.params.id);
  const linha = ctx.lista.porId.get(id);
  let d;
  try { d = await dados.detalhe(id); } catch (e) {
    if (!linha) throw new Error('Proposição não encontrada.');
    d = { ...linha, etapas: [], tramitacoes: [], votacoes: [], autores: [linha.autor_principal], relatores: [], _semDetalhe: true };
  }
  if (!ctx.valido()) return;
  const p = { ...linha, ...d };
  const hoje = HOJE(ctx.lista);
  const etapas = (p.etapas || []).map((e) => ({ ...e, dias: diasEntre(e.inicio, e.fim || hoje) }));
  const vividas = etapas.map((e) => e.etapa);
  const total = diasEntre(p.data_apresentacao, TERMINAIS.has(p.etapa) ? (etapas.at(-1)?.inicio || hoje) : hoje);
  const totalFaixa = etapas.filter((e) => !TERMINAIS.has(e.etapa)).reduce((s, e) => s + Math.max(e.dias || 0, 1), 0) || 1;
  const tram = [...(p.tramitacoes || [])].sort((a, b) => (a.data < b.data ? 1 : -1));
  const votos = [...(p.votacoes || [])].sort((a, b) => (a.data < b.data ? 1 : -1));
  const seguido = dados.seguindo(id);
  const vinc = p.vinculo_outra_casa;
  const fonte = p.url_fonte;

  main.innerHTML = String(html`
    <a class="volta" href="#/tabuleiro">${raw(ICONE.volta)} Tabuleiro</a>
    <header class="prop-cab" style="margin-top:12px">
      <div class="prop-cab__linha">
        <span class="sigla">${p.sigla}</span>
        <span class="discreto">${TIPOS[p.tipo] || p.tipo}</span>
      </div>
      <h1>${p.ementa}</h1>
      <div class="prop-cab__linha">${etapaTag(p.etapa)} ${trilhaMini(p.etapa, vividas)} ${contadorParado(p)}</div>
      <div class="chips">${(p.tema || []).map((t) => html`<a class="chip" href="#/tabuleiro?tema=${encodeURIComponent(t)}" style="text-decoration:none">${t}</a>`)}</div>
      <div class="prop-cab__acoes">
        ${botaoSeguir(id, seguido)}
        ${fonte ? html`<a class="btn" href="${fonte}" target="_blank" rel="noopener">${raw(ICONE.externo)} Ficha oficial na Câmara</a>` : ''}
        ${vinc?.url ? html`<a class="btn" href="${vinc.url}" target="_blank" rel="noopener">${raw(ICONE.externo)} ${vinc.sigla || 'Na outra casa'} no ${vinc.casa}</a>` : ''}
      </div>
    </header>

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
          ${votos.length ? html`<div class="lista">${votos.map((v) => html`
            <article class="votacao">
              <div class="votacao__topo"><strong>${v.aprovada ? 'Aprovada' : 'Rejeitada'} · ${v.orgao === 'PLEN' ? 'Plenário' : nomeOrgao(v.orgao)}</strong><span class="discreto">${fmtData(v.data)}</span></div>
              <p style="font-size:14.5px">${v.descricao}</p>
              ${v.placar ? raw(placarHTML(v.placar)) : html`<p class="discreto">Votação simbólica (sem placar nominal).</p>`}
              ${v.url ? html`<a class="discreto" href="${v.url}" target="_blank" rel="noopener">Fonte da votação ↗</a>` : ''}
            </article>`)}</div>` : vazio('Nenhuma votação registrada até agora.')}
        </section>

        <section class="secao" aria-labelledby="h-tram">
          <div class="secao__cab"><h2 id="h-tram">Tramitações</h2><p>${tram.length ? `${tram.length} movimentações, da mais recente para a mais antiga` : ''}</p></div>
          ${tram.length ? html`<ol class="tramites" id="tramites">${tram.map((t, i) => html`
            <li ${i >= 8 ? raw('data-extra hidden') : ''}><time datetime="${t.data}">${fmtDataHoraBRT(t.data)}</time>
              <span><span class="org" title="${nomeOrgao(t.orgao)}">${t.orgao}</span>${t.descricao}${t.url ? html` <a href="${t.url}" target="_blank" rel="noopener" aria-label="Fonte desta movimentação">↗</a>` : ''}</span></li>`)}</ol>
            ${tram.length > 8 ? html`<div class="mais"><button class="btn" type="button" id="mais-tram">Mostrar todas as ${tram.length}</button></div>` : ''}` : vazio('Sem tramitações registradas.')}
        </section>
      </div>

      <aside class="ficha" aria-label="Ficha da proposição">
        ${!TERMINAIS.has(p.etapa) ? html`<div><span class="rot">Última movimentação</span><span class="grande">${fmtN(p.dias_parado)}<small style="font:500 14px var(--f-texto);color:var(--ink-3)"> dias atrás</small></span><span class="discreto">${fmtData(p.ultima_movimentacao)} · ${nomeOrgao(p.orgao_atual)}</span></div>` : ''}
        <div><span class="rot">Apresentada em</span><span>${fmtData(p.data_apresentacao)}</span></div>
        <div><span class="rot">Autoria</span>${(p.autores?.length ? p.autores : [p.autor_principal]).filter(Boolean).map((a) => html`<span class="pessoa">${a.tipo === 'Deputado' ? 'Dep. ' : a.tipo === 'Senador' ? 'Sen. ' : ''}${a.nome}${a.partido ? html` <small>${a.partido}${a.uf ? '-' + a.uf : ''}</small>` : ''}</span>`)}</div>
        <div><span class="rot">Relatoria</span>${p.relatores?.length ? p.relatores.map((r) => html`<span class="pessoa">${r.nome} <small>${r.orgao} · desde ${fmtData(r.desde)}</small></span>`) : html`<span class="mudo">Sem relator designado</span>`}</div>
        ${p.orgao_atual ? '' : raw('<!-- sem órgão atual -->')}
        <div ${p.orgao_atual ? '' : raw('hidden')}><span class="rot">Órgão atual</span><span>${nomeOrgao(p.orgao_atual)}${p.orgao_atual && nomeOrgao(p.orgao_atual) !== p.orgao_atual ? html` <small class="mudo mono">${p.orgao_atual}</small>` : ''}</span></div>
        <div><span class="rot">Na outra casa</span>${vinc?.sigla ? html`<a href="${vinc.url}" target="_blank" rel="noopener">${vinc.sigla} (${vinc.casa}) ↗</a>` : html`<span class="mudo">Ainda não chegou ${vinc?.casa ? 'ao ' + vinc.casa : 'à outra casa'}</span>`}</div>
        <div><span class="rot">Fonte</span>${fonte ? html`<a href="${fonte}" target="_blank" rel="noopener">Câmara dos Deputados — ficha de tramitação ↗</a>` : html`<span class="mudo">—</span>`}</div>
      </aside>
    </div>
  `);

  const mais = main.querySelector('#mais-tram');
  if (mais) mais.addEventListener('click', () => { main.querySelectorAll('#tramites [data-extra]').forEach((li) => (li.hidden = false)); mais.parentElement.remove(); });
  return p.sigla;
}
