// Hemiciclo ilustrativo: plenário em semicírculo com uma bolinha por cadeira.
//
// Neutralidade: as cadeiras são preenchidas em FAIXAS CONCÊNTRICAS (da fila da frente para a de trás),
// nunca da esquerda para a direita — assim a figura não sugere "lado" político. Cores só por voto
// (sim / não / abstenção / obstrução) ou neutras; nunca por partido.
import { html, raw, esc, fmtN } from './ui.js';

const cacheLayout = new Map();
function layout(membros) {
  if (cacheLayout.has(membros)) return cacheLayout.get(membros);
  const W = 400, cx = 200, cy = 204, R = 196;
  const filas = membros > 300 ? 12 : membros > 120 ? 9 : membros > 60 ? 6 : membros > 30 ? 5 : 4;
  const R0 = R * (membros > 120 ? 0.38 : 0.34);
  const raios = Array.from({ length: filas }, (_, i) => R0 + ((R - R0) * i) / Math.max(1, filas - 1));
  const soma = raios.reduce((a, b) => a + b, 0);
  let porFila = raios.map((r) => Math.max(1, Math.round((membros * r) / soma)));
  let dif = membros - porFila.reduce((a, b) => a + b, 0);
  for (let i = filas - 1; dif !== 0; i = (i - 1 + filas) % filas) { porFila[i] += Math.sign(dif); dif -= Math.sign(dif); }
  const passoFila = (R - R0) / Math.max(1, filas - 1);
  const arco = Math.min(...raios.map((r, i) => (Math.PI * r) / Math.max(1, porFila[i] - 1)));
  const rBola = Math.max(1.6, Math.min(arco, passoFila) * 0.42);
  const cadeiras = [];
  raios.forEach((r, i) => {
    const n = porFila[i];
    for (let k = 0; k < n; k++) {
      const ang = Math.PI - (n === 1 ? Math.PI / 2 : (Math.PI * k) / (n - 1));
      cadeiras.push({ x: cx + r * Math.cos(ang), y: cy - r * Math.sin(ang), fila: i });
    }
  });
  const res = { W, H: cy + rBola + 2, cadeiras, rBola };
  cacheLayout.set(membros, res);
  return res;
}

/**
 * grupos: [{ n, cls, nome }] em ordem de preenchimento (fila da frente primeiro).
 * As cadeiras que sobrarem viram `resto` (padrão: ausentes/sem registro, só contorno).
 * destaque: índice da cadeira a destacar (ex.: o parlamentar da página).
 */
export function hemiciclo({ membros, grupos = [], resto = { cls: 'h-vazio', nome: 'Ausentes ou sem registro' }, destaque = null, marcadas = null, rotulo = '', legenda = true }) {
  const L = layout(membros);
  const total = grupos.reduce((s, g) => s + Math.max(0, g.n || 0), 0);
  const gs = [...grupos.map((g) => ({ ...g, n: Math.max(0, g.n || 0) }))];
  if (total < membros) gs.push({ ...resto, n: membros - total });
  // se o placar passar do número de cadeiras (dado inconsistente), corta no fim
  let i = 0;
  const classes = new Array(L.cadeiras.length);
  for (const g of gs) for (let k = 0; k < g.n && i < classes.length; k++) classes[i++] = g.cls;
  if (marcadas) for (const j of marcadas) if (j < classes.length) classes[j] = 'h-marcada';
  const bolas = L.cadeiras.map((c, j) => `<circle class="${classes[j] || resto.cls}${j === destaque ? ' h-destaque' : ''}" cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${(j === destaque ? L.rBola * 1.7 : L.rBola).toFixed(2)}"/>`).join('');
  const aria = rotulo || `Plenário com ${membros} cadeiras: ` + gs.filter((g) => g.n).map((g) => `${g.n} ${g.nome.toLowerCase()}`).join(', ');
  return html`<figure class="hemiciclo">
    <svg viewBox="0 0 ${L.W} ${L.H.toFixed(0)}" role="img" aria-label="${aria}">${raw(bolas)}</svg>
    ${legenda ? html`<figcaption class="hemiciclo__leg">${gs.filter((g) => g.n).map((g) => html`<span><i class="${g.cls}" aria-hidden="true"></i>${g.nome} <b>${fmtN(g.n)}</b></span>`)}</figcaption>` : ''}
  </figure>`;
}

// Grupos de uma votação a partir do placar do contrato (sim/nao/abstencao/obstrucao/outros)
export function gruposVotacao(pl) {
  return [
    { n: pl.sim, cls: 'h-sim', nome: 'Sim' },
    { n: pl.nao, cls: 'h-nao', nome: 'Não' },
    { n: pl.abstencao, cls: 'h-abst', nome: 'Abstenção' },
    { n: pl.obstrucao, cls: 'h-obst', nome: 'Obstrução' },
    { n: pl.outros, cls: 'h-obst', nome: 'Outros' },
  ].filter((g) => g.n);
}

// Cadeira "ilustrativa" estável para um parlamentar (as cadeiras não são marcadas na maioria das casas)
export function cadeiraDe(id, membros) {
  let h = 2166136261;
  for (const ch of String(id)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return Math.abs(h) % membros;
}

// Distribui cadeiras ilustrativas sem colisão para uma lista de ids (mesmo resultado em qualquer tela)
export function atribuirCadeiras(ids, membros) {
  const livres = new Array(membros).fill(true);
  const mapa = new Map();
  for (const id of [...ids].sort((a, b) => Number(a) - Number(b))) {
    let j = cadeiraDe(id, membros), voltas = 0;
    while (!livres[j] && voltas < membros) { j = (j + 1) % membros; voltas++; }
    if (voltas >= membros) break;
    livres[j] = false;
    mapa.set(Number(id), j);
  }
  return mapa;
}

// Primeira cadeira de um grupo (para pôr o parlamentar dentro da faixa do seu voto)
export function inicioDoGrupo(grupos, cls) {
  let i = 0;
  for (const g of grupos) { if (g.cls === cls) return { ini: i, n: g.n }; i += g.n || 0; }
  return { ini: i, n: 0 };
}
