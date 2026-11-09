// Shell: roteamento por hash com prefixo de casa (#/almg/tabuleiro), seletor de casa, tema e "seguir".
import * as dados from './data.js';
import { anunciar, fmtDataHoraBRT, esc, estado, href } from './ui.js';
import home from './views/home.js';
import tabuleiro from './views/tabuleiro.js';
import proposicao from './views/proposicao.js';
import gaveta from './views/gaveta.js';
import funil from './views/funil.js';
import seguindoView from './views/seguindo.js';
import parlamentares from './views/parlamentares.js';
import parlamentar from './views/parlamentar.js';

const main = document.getElementById('conteudo');

const ROTAS = [
  { re: /^\/?$/, view: home, nav: 'semana' },
  { re: /^\/semana\/(\d{4}-W\d{2})$/, view: home, nav: 'semana', params: ['semana'] },
  { re: /^\/tabuleiro$/, view: tabuleiro, nav: 'tabuleiro' },
  { re: /^\/p\/(\d+)$/, view: proposicao, nav: null, params: ['id'] },
  { re: /^\/gaveta$/, view: gaveta, nav: 'gaveta' },
  { re: /^\/funil$/, view: funil, nav: 'funil' },
  { re: /^\/seguindo$/, view: seguindoView, nav: 'seguindo' },
  { re: /^\/parlamentares$/, view: parlamentares, nav: 'parlamentares' },
  { re: /^\/parlamentar\/(\d+)$/, view: parlamentar, nav: 'parlamentares', params: ['id'] },
];
const CAMINHO_NAV = { semana: '/', tabuleiro: '/tabuleiro', gaveta: '/gaveta', funil: '/funil', seguindo: '/seguindo', parlamentares: '/parlamentares' };

function lerHash() {
  const h = decodeURIComponent(location.hash.replace(/^#/, '')) || '/';
  const [caminhoTodo, qs = ''] = h.split('?');
  // prefixo de casa: /almg/tabuleiro → casa=almg, caminho=/tabuleiro
  const m = caminhoTodo.match(/^\/([a-z][a-z0-9_-]*)(\/.*)?$/);
  let casa = 'camara', caminho = caminhoTodo;
  if (m && dados.listaCasas().some((c) => c.id === m[1])) { casa = m[1]; caminho = m[2] || '/'; }
  return { casa, caminho, query: new URLSearchParams(qs) };
}

// Atualiza a query do hash sem re-renderizar (filtros que já estão na tela)
export function trocarQuery(query) {
  const { caminho } = lerHash();
  const qs = query.toString();
  history.replaceState(null, '', `${href(caminho === '/' ? '/' : caminho)}${qs ? '?' + qs : ''}`);
}

let renderId = 0;
async function rotear() {
  const id = ++renderId;
  const { casa: casaId, caminho, query } = lerHash();
  const rota = ROTAS.find((r) => r.re.test(caminho));
  let lista;
  try {
    if (dados.casaAtual()?.id !== casaId) main.innerHTML = '<p class="carregando">Carregando os dados da casa…</p>';
    lista = await dados.usarCasa(casaId);
  } catch (e) {
    console.warn(e);
    main.innerHTML = `<div class="erro"><h1>Sem dados</h1><p>${esc(e.message)}</p></div>`;
    return;
  }
  if (id !== renderId) return;
  const casa = dados.casaAtual();
  estado.casa = casa;
  estado.temParlamentares = dados.tem('parlamentares');
  atualizarShell(casa, lista, rota);
  if (!rota) {
    main.innerHTML = `<div class="erro"><h1>Página não encontrada</h1><p><a href="${href('/')}">Voltar para o início</a></p></div>`;
    document.title = 'Não encontrada · Lei em Curso';
    return;
  }
  const m = caminho.match(rota.re);
  const params = Object.fromEntries((rota.params || []).map((p, i) => [p, m[i + 1]]));
  main.setAttribute('aria-busy', 'true');
  try {
    // cada tela desenha num contêiner novo (os ouvintes de eventos morrem com ele) e só entra no ar pronta
    const raiz = document.createElement('div');
    raiz.className = 'vista';
    const titulo = await rota.view(raiz, { lista, casa, params, query, trocarQuery, valido: () => id === renderId });
    if (id !== renderId) return;
    main.replaceChildren(raiz);
    document.title = titulo ? `${titulo} · ${casa.curto || casa.nome} · Lei em Curso` : 'Lei em Curso — a vida inteira de uma lei';
    anunciar(titulo || 'Esta semana');
  } catch (e) {
    console.warn(e);
    if (id !== renderId) return;
    main.innerHTML = `<div class="erro"><h1>Não deu para carregar</h1><p>${esc(e.message)}</p><p><a href="${href('/')}">Voltar para o início</a></p></div>`;
  } finally {
    main.removeAttribute('aria-busy');
  }
  window.scrollTo(0, 0);
  if (document.activeElement && document.activeElement.closest('.nav, .topo')) main.focus({ preventScroll: true });
}

function atualizarShell(casa, lista, rota) {
  document.querySelectorAll('[data-rota]').forEach((a) => {
    a.setAttribute('href', href(CAMINHO_NAV[a.dataset.rota]));
    if (rota && a.dataset.rota === rota.nav) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  document.querySelector('.marca').setAttribute('href', href('/'));
  const sel = document.getElementById('casa');
  if (sel.value !== casa.id) sel.value = casa.id;
  document.getElementById('rodape-meta').innerHTML =
    `${esc(casa.nome)} · dados ${dados.modoExemplo ? 'de exemplo' : 'públicos oficiais'} · atualizados em ${esc(fmtDataHoraBRT(lista.gerado_em))} · ${lista.proposicoes.length.toLocaleString('pt-BR')} proposições`
    + (dados.modoExemplo ? ' · <a href="./">ver dados reais</a>' : ' · <a href="?dados=exemplo">ver o site com dados de exemplo</a>');
}

function montarSeletorCasa() {
  const casas = dados.listaCasas();
  const sel = document.getElementById('casa');
  sel.innerHTML = casas.map((c) => `<option value="${esc(c.id)}" ${dados.disponivel(c) ? '' : 'disabled'}>${esc(c.curto || c.nome)}${dados.disponivel(c) ? '' : ' (em coleta)'}</option>`).join('');
  document.getElementById('casa-sel').hidden = casas.length < 2;
  sel.addEventListener('change', () => {
    const c = casas.find((x) => x.id === sel.value);
    const rotaAtual = ROTAS.find((r) => r.re.test(lerHash().caminho));
    const caminho = CAMINHO_NAV[rotaAtual?.nav] || '/';
    location.hash = href(caminho, c);
  });
}

// ---------- tema: automático → claro → escuro ----------
const botaoTema = document.getElementById('tema');
const TEMAS = ['auto', 'claro', 'escuro'];
function aplicarTema(t) {
  const root = document.documentElement;
  if (t === 'claro') root.dataset.theme = 'light';
  else if (t === 'escuro') root.dataset.theme = 'dark';
  else delete root.dataset.theme;
  botaoTema.setAttribute('aria-label', `Tema: ${t === 'auto' ? 'automático' : t}. Trocar tema`);
  botaoTema.title = `Tema: ${t === 'auto' ? 'automático (do sistema)' : t}`;
}
let tema = 'auto';
try { tema = localStorage.getItem('lec:tema') || 'auto'; } catch (e) { /* sem storage */ }
aplicarTema(tema);
botaoTema.addEventListener('click', () => {
  tema = TEMAS[(TEMAS.indexOf(tema) + 1) % TEMAS.length];
  try { localStorage.setItem('lec:tema', tema); } catch (e) { /* ok */ }
  aplicarTema(tema);
});

// ---------- seguir ----------
function atualizarContador() {
  const n = Object.keys(dados.listaSeguidos()).length;
  const b = document.getElementById('n-seguindo');
  b.hidden = n === 0;
  b.textContent = n;
  b.parentElement.setAttribute('aria-label', n ? `Seguindo (${n})` : 'Seguindo');
}
document.addEventListener('click', async (ev) => {
  const b = ev.target.closest('[data-seguir]');
  if (!b) return;
  ev.preventDefault();
  const id = b.dataset.seguir;
  const l = await dados.lista();
  const on = dados.alternarSeguir(id, l?.porId.get(Number(id)));
  document.querySelectorAll(`[data-seguir="${CSS.escape(id)}"]`).forEach((x) => {
    x.setAttribute('aria-pressed', on ? 'true' : 'false');
    const s = x.querySelector('span'); if (s) s.textContent = on ? 'Seguindo' : 'Seguir';
  });
  anunciar(on ? 'Você está seguindo esta proposição' : 'Você deixou de seguir esta proposição');
});
dados.aoMudarSeguidos(atualizarContador);
estado.seguindo = (id) => dados.seguindo(id);

// ---------- início ----------
(async function () {
  await dados.carregarCasas();
  montarSeletorCasa();
  const aviso = document.getElementById('aviso-exemplo');
  if (dados.modoExemplo) {
    aviso.hidden = false;
    aviso.innerHTML = '<strong>Dados de exemplo.</strong> Projetos, nomes, partidos e resumos são fictícios — servem para testar o site. <a href="./">Ver dados reais</a>';
  }
  atualizarContador();
  window.addEventListener('hashchange', rotear);
  rotear();
})();
