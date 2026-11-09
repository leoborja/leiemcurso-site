// Lista de parlamentares da casa, com o plenário ilustrado. Ordem por nome ou atividade recente —
// de propósito, sem ordenar por "quem mais apresentou" (o projeto não é ranking de parlamentar).
import * as dados from '../data.js';
import { html, raw, esc, avatar, fmtN, fmtData, plural, vazio, href, botaoMais, nomeParl } from '../ui.js';
import { hemiciclo, atribuirCadeiras } from '../hemiciclo.js';

const PASSO = 48;

export function semParlamentares(casa) {
  return html`<div class="cab"><p class="olho">Parlamentares · ${casa.nome}</p><h1>Quem propõe, relata e vota</h1></div>
    <div class="seguir-vazio">
      <p class="lead" style="font-size:16px">Os dados de ${nomeParl(casa)} da ${casa.curto || casa.nome} ainda estão sendo coletados. Quando chegarem, aparecem aqui: autorias, relatorias, votos, comissões e atividade por semana.</p>
      ${dados.modoExemplo ? '' : html`<a class="btn" href="?dados=exemplo${raw(href('/parlamentares'))}">Ver como fica com dados de exemplo</a>`}
    </div>`;
}

export default async function parlamentares(main, ctx) {
  const { casa, query } = ctx;
  if (!dados.tem('parlamentares')) { main.innerHTML = String(semParlamentares(casa)); return 'Parlamentares'; }
  const j = await dados.parlamentares();
  if (!ctx.valido()) return;
  const todos = j.parlamentares || [];
  const cadeiras = atribuirCadeiras(todos.map((p) => p.id), casa.membros || todos.length);
  const partidos = [...new Set(todos.map((p) => p.partido).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const ufs = [...new Set(todos.map((p) => p.uf).filter(Boolean))].sort();
  const st = { q: query.get('q') || '', partido: query.get('partido') || '', uf: query.get('uf') || '', todos: query.get('todos') === '1', ordem: query.get('ordem') || 'nome' };
  let vistos = PASSO;
  const titulo = nomeParl(casa).replace(/^./, (c) => c.toUpperCase());

  main.innerHTML = String(html`
    <div class="cab">
      <p class="olho">Parlamentares · ${casa.nome}</p>
      <h1>Quem propõe, relata e vota</h1>
      <p class="lead">${titulo} com autorias, relatorias, votos, comissões e atividade por semana. A lei continua sendo o centro: aqui está quem a moveu.</p>
    </div>
    <div class="parl-topo">
      <div id="hemi"></div>
      <form class="filtros filtros--compacto" role="search" onsubmit="return false">
        <label class="filtros__busca"><span class="vh">Buscar parlamentar</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>
          <input type="search" name="q" value="${st.q}" placeholder="Buscar por nome" autocomplete="off"></label>
        <div class="filtros__painel">
          <label>Partido<select name="partido"><option value="">Todos</option>${partidos.map((x) => raw(`<option ${x === st.partido ? 'selected' : ''}>${esc(x)}</option>`))}</select></label>
          ${ufs.length > 1 ? html`<label>UF<select name="uf"><option value="">Todas</option>${ufs.map((x) => raw(`<option ${x === st.uf ? 'selected' : ''}>${esc(x)}</option>`))}</select></label>` : ''}
          <label>Ordenar<select name="ordem"><option value="nome" ${st.ordem === 'nome' ? 'selected' : ''}>Nome</option><option value="atividade" ${st.ordem === 'atividade' ? 'selected' : ''}>Atividade mais recente</option></select></label>
          <label class="check"><input type="checkbox" name="todos" ${st.todos ? 'checked' : ''}> Incluir fora de exercício</label>
        </div>
      </form>
    </div>
    <div class="resultado-cab"><h2 id="n-parl"></h2></div>
    <div class="lista lista--parl" id="lista"></div>
    <div id="mais"></div>
  `);
  const $ = (s) => main.querySelector(s);

  function filtrar() {
    const q = dados.normalizar(st.q);
    const r = todos.filter((p) => (st.todos || p.em_exercicio !== false) && (!st.partido || p.partido === st.partido) && (!st.uf || p.uf === st.uf) && (!q || dados.normalizar(p.nome).includes(q)));
    return r.sort(st.ordem === 'atividade' ? (a, b) => ((a.ultima_atividade || '') < (b.ultima_atividade || '') ? 1 : -1) : (a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }
  function render() {
    const r = filtrar();
    const filtrando = st.q || st.partido || st.uf;
    $('#hemi').innerHTML = String(hemiciclo({
      membros: casa.membros || todos.length, grupos: [], resto: { cls: 'h-neutra', nome: 'Cadeiras' },
      marcadas: r.map((p) => cadeiras.get(Number(p.id))).filter((x) => x != null),
      legenda: false, rotulo: `Plenário com ${casa.membros} cadeiras; ${r.length} destacadas pelo filtro`,
    })) + `<p class="nota hemi-nota"><span class="leg-bola h-marcada"></span>${filtrando ? `${fmtN(r.length)} no filtro` : `${fmtN(r.length)} em exercício`} de ${fmtN(casa.membros)} cadeiras · posições ilustrativas</p>`;
    $('#n-parl').textContent = plural(r.length, nomeParl(casa, 1), nomeParl(casa));
    const fatia = r.slice(0, vistos);
    $('#lista').innerHTML = fatia.length ? fatia.map((p) => String(html`
      <a class="parl-cartao" href="${href('/parlamentar/' + p.id)}">
        ${avatar(p.nome, p.foto_url, 52)}
        <span class="parl-cartao__corpo">
          <strong>${p.nome}</strong>
          <span class="discreto">${p.partido || 'sem partido'}${p.uf ? '-' + p.uf : ''}${p.em_exercicio === false ? ' · fora de exercício' : ''}</span>
          <span class="parl-cartao__nums"><span><b>${fmtN(p.n_autorias)}</b> autorias</span><span><b>${fmtN(p.n_relatorias)}</b> relatorias</span></span>
          ${p.ultima_atividade ? html`<span class="discreto">última atividade ${fmtData(p.ultima_atividade)}</span>` : ''}
        </span>
      </a>`)).join('') : String(vazio('Ninguém com esses filtros.'));
    $('#mais').innerHTML = botaoMais('parl', r.length - fatia.length, PASSO);
    const q = new URLSearchParams();
    for (const k of ['q', 'partido', 'uf']) if (st[k]) q.set(k, st[k]);
    if (st.todos) q.set('todos', '1');
    if (st.ordem !== 'nome') q.set('ordem', st.ordem);
    ctx.trocarQuery(q);
  }
  let t;
  main.querySelector('form').addEventListener('input', (e) => {
    const x = e.target; if (!x.name) return;
    st[x.name] = x.type === 'checkbox' ? x.checked : x.value;
    vistos = PASSO;
    clearTimeout(t); t = setTimeout(render, x.type === 'search' ? 150 : 0);
  });
  $('#mais').addEventListener('click', (e) => { if (e.target.closest('[data-mais]')) { vistos += PASSO; render(); } });
  render();
  return 'Parlamentares';
}
