// Seguindo: as proposições que a pessoa marcou (salvas só neste navegador, em localStorage).
import * as dados from '../data.js';
import { html, raw, cartao, etapaTag, fmtData, plural, ETAPA, ICONE } from '../ui.js';

export default async function seguindo(main, ctx) {
  const { lista } = ctx;
  const seg = dados.listaSeguidos();
  const itens = Object.entries(seg).map(([id, info]) => ({ p: lista.porId.get(Number(id)), info })).filter((x) => x.p);
  const andaram = itens.filter((x) => x.info.etapa && x.info.etapa !== x.p.etapa);

  if (!itens.length) {
    main.innerHTML = String(html`
      <div class="cab"><p class="olho">Seguindo</p><h1>Siga uma lei como quem segue um time</h1></div>
      <div class="seguir-vazio">
        <p class="lead" style="font-size:16px">Toque em <b>Seguir</b> em qualquer proposição e ela aparece aqui, com a etapa em que estava quando você começou a acompanhar. Fica salvo só neste navegador — sem cadastro.</p>
        <a class="btn btn--primario" href="#/tabuleiro">Ir para o tabuleiro ${raw(ICONE.seta)}</a>
      </div>`);
    return 'Seguindo';
  }

  itens.sort((a, b) => (a.p.ultima_movimentacao < b.p.ultima_movimentacao ? 1 : -1));
  main.innerHTML = String(html`
    <div class="cab">
      <p class="olho">Seguindo</p>
      <h1>${plural(itens.length, 'proposição', 'proposições')} no seu radar</h1>
      <p class="lead">${andaram.length ? raw(`<b>${andaram.length}</b> ${andaram.length === 1 ? 'mudou' : 'mudaram'} de etapa desde que você começou a seguir.`) : 'Nenhuma mudou de etapa desde que você começou a seguir.'} Salvo só neste navegador.</p>
    </div>
    <div class="lista lista--grade">
      ${itens.map(({ p, info }) => {
        const mudou = info.etapa && info.etapa !== p.etapa;
        const extra = html`<p class="movimento discreto">Seguindo desde ${fmtData(info.desde)}${mudou ? html` · andou: ${etapaTag(info.etapa)} ${raw(ICONE.seta)} ${etapaTag(p.etapa)}` : ' · mesma etapa'}</p>`;
        return cartao(p, { seguindo: true, extra });
      })}
    </div>
  `);
  return 'Seguindo';
}
