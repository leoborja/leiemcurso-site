// Shell: roteamento por hash (funciona no GitHub Pages sem configuração), tema, botão "seguir".
import * as dados from './data.js';
import { anunciar, fmtDataHoraBRT, esc } from './ui.js';
import home from './views/home.js';
import tabuleiro from './views/tabuleiro.js';
import proposicao from './views/proposicao.js';
import gaveta from './views/gaveta.js';
import funil from './views/funil.js';
import seguindoView from './views/seguindo.js';

const main = document.getElementById('conteudo');

const ROTAS = [
  { re: /^\/?$/, view: home, nav: 'semana' },
  { re: /^\/semana\/(\d{4}-W\d{2})$/, view: home, nav: 'semana', params: ['semana'] },
  { re: /^\/tabuleiro$/, view: tabuleiro, nav: 'tabuleiro' },
  { re: /^\/p\/(\d+)$/, view: proposicao, nav: null, params: ['id'] },
  { re: /^\/gaveta$/, view: gaveta, nav: 'gaveta' },
  { re: /^\/funil$/, view: funil, nav: 'funil' },
  { re: /^\/seguindo$/, view: seguindoView, nav: 'seguindo' },
];

function lerHash() {
  const h = decodeURIComponent(location.hash.replace(/^#/, '')) || '/';
  const [caminho, qs = ''] = h.split('?');
  return { caminho, query: new URLSearchParams(qs) };
}

// Atualiza a query do hash sem re-renderizar (para filtros que já estão na tela).
export function trocarQuery(query) {
  const { caminho } = lerHash();
  const qs = query.toString();
  history.replaceState(null, '', `#${caminho}${qs ? '?' + qs : ''}`);
}

let ctxBase;
let renderId = 0;
async function rotear() {
  const id = ++renderId;
  const { caminho, query } = lerHash();
  const rota = ROTAS.find((r) => r.re.test(caminho));
  document.querySelectorAll('.nav a').forEach((a) => {
    if (rota && a.dataset.rota === rota.nav) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  if (!rota) {
    main.innerHTML = '<div class="erro"><h1>Página não encontrada</h1><p><a href="#/">Voltar para o início</a></p></div>';
    document.title = 'Não encontrada · Lei em Curso';
    return;
  }
  const m = caminho.match(rota.re);
  const params = Object.fromEntries((rota.params || []).map((p, i) => [p, m[i + 1]]));
  main.setAttribute('aria-busy', 'true');
  try {
    const titulo = await rota.view(main, { ...ctxBase, params, query, trocarQuery, valido: () => id === renderId });
    if (id !== renderId) return;
    document.title = titulo ? `${titulo} · Lei em Curso` : 'Lei em Curso — a vida inteira de uma lei';
    anunciar(titulo || 'Esta semana');
  } catch (e) {
    console.warn(e);
    if (id !== renderId) return;
    main.innerHTML = `<div class="erro"><h1>Não deu para carregar</h1><p>${esc(e.message)}</p><p><a href="#/">Voltar para o início</a></p></div>`;
  } finally {
    main.removeAttribute('aria-busy');
  }
  window.scrollTo(0, 0);
  if (document.activeElement && document.activeElement.closest('.nav')) main.focus({ preventScroll: true });
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
  window.dispatchEvent(new Event('lec:tema'));
});

// ---------- seguir ----------
function atualizarContador() {
  const n = Object.keys(dados.listaSeguidos()).length;
  const b = document.getElementById('n-seguindo');
  b.hidden = n === 0;
  b.textContent = n;
  b.setAttribute('aria-label', `${n} seguindo`);
}
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-seguir]');
  if (!b) return;
  ev.preventDefault();
  const id = b.dataset.seguir;
  const on = dados.alternarSeguir(id);
  document.querySelectorAll(`[data-seguir="${CSS.escape(id)}"]`).forEach((x) => {
    x.setAttribute('aria-pressed', on ? 'true' : 'false');
    const s = x.querySelector('span'); if (s) s.textContent = on ? 'Seguindo' : 'Seguir';
  });
  anunciar(on ? 'Você está seguindo esta proposição' : 'Você deixou de seguir esta proposição');
});
dados.aoMudarSeguidos(atualizarContador);

// ---------- início ----------
(async function () {
  try {
    const ini = await dados.iniciar();
    ctxBase = { lista: ini.lista, exemplo: ini.exemplo };
    document.getElementById('aviso-exemplo').hidden = !ini.exemplo;
    document.getElementById('rodape-meta').innerHTML = `Dados ${ini.exemplo ? 'de exemplo' : 'da Câmara dos Deputados (Dados Abertos)'} · atualizados em ${esc(fmtDataHoraBRT(ini.lista.gerado_em))} · ${ini.lista.proposicoes.length.toLocaleString('pt-BR')} proposições`;
    atualizarContador();
    window.addEventListener('hashchange', rotear);
    rotear();
  } catch (e) {
    console.warn(e);
    main.innerHTML = `<div class="erro"><h1>Sem dados</h1><p>${esc(e.message)}</p></div>`;
  }
})();
