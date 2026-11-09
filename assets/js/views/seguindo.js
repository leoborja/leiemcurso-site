// Seguindo: as proposições que a pessoa marcou (salvas só neste navegador), de todas as casas.
import * as dados from '../data.js';
import { html, raw, cartao, etapaTag, fmtData, plural, ICONE, href } from '../ui.js';

export default async function seguindo(main, ctx) {
  const { lista, casa } = ctx;
  const seg = Object.values(dados.listaSeguidos());
  const daqui = seg.filter((s) => s.casa === casa.id).map((info) => ({ p: lista.porId.get(Number(info.id)), info })).filter((x) => x.p);
  const deOutras = seg.filter((s) => s.casa !== casa.id);
  const casas = dados.listaCasas();
  const andaram = daqui.filter((x) => x.info.etapa && x.info.etapa !== x.p.etapa);

  if (!seg.length) {
    main.innerHTML = String(html`
      <div class="cab"><p class="olho">Seguindo</p><h1>Siga uma lei como quem segue um time</h1></div>
      <div class="seguir-vazio">
        <p class="lead" style="font-size:16px">Toque em <b>Seguir</b> em qualquer proposição e ela aparece aqui, com a etapa em que estava quando você começou a acompanhar. Fica salvo só neste navegador — sem cadastro.</p>
        <a class="btn btn--primario" href="${href('/tabuleiro')}">Ir para o tabuleiro ${raw(ICONE.seta)}</a>
      </div>`);
    return 'Seguindo';
  }

  daqui.sort((a, b) => (a.p.ultima_movimentacao < b.p.ultima_movimentacao ? 1 : -1));
  main.innerHTML = String(html`
    <div class="cab">
      <p class="olho">Seguindo</p>
      <h1>${plural(seg.length, 'proposição', 'proposições')} no seu radar</h1>
      <p class="lead">${daqui.length ? raw(andaram.length ? `Na ${casa.curto || casa.nome}, <b>${andaram.length}</b> ${andaram.length === 1 ? 'mudou' : 'mudaram'} de etapa desde que você começou a seguir.` : `Na ${casa.curto || casa.nome}, nenhuma mudou de etapa desde que você começou a seguir.`) : `Nenhuma da ${casa.curto || casa.nome}.`} Salvo só neste navegador.</p>
    </div>
    ${daqui.length ? html`<div class="lista lista--grade">
      ${daqui.map(({ p, info }) => {
        const mudou = info.etapa && info.etapa !== p.etapa;
        const extra = html`<p class="movimento discreto">Seguindo desde ${fmtData(info.desde)}${mudou ? html` · andou: ${etapaTag(info.etapa)} ${raw(ICONE.seta)} ${etapaTag(p.etapa)}` : ' · mesma etapa'}</p>`;
        return cartao(p, { extra, resumo: lista.resumos.get(Number(p.id)) });
      })}
    </div>` : ''}
    ${deOutras.length ? html`<section class="secao"><div class="secao__cab"><h2>Em outras casas</h2><p>Etapa de quando você começou a seguir; abra para ver a atual.</p></div>
      <div class="lista lista--grade">${deOutras.map((s) => {
        const c = casas.find((x) => x.id === s.casa) || { id: s.casa, nome: s.casa };
        return html`<article class="cartao"><div class="cartao__topo"><a class="cartao__sigla" href="${href('/p/' + s.id, c)}">${s.sigla || `#${s.id}`}</a><span class="chip">${c.curto || c.nome}</span></div>
          ${s.ementa ? html`<p class="cartao__ementa">${s.ementa}</p>` : ''}
          <div class="cartao__pe">${s.etapa ? etapaTag(s.etapa) : ''}<span class="discreto">desde ${fmtData(s.desde)}</span></div></article>`;
      })}</div></section>` : ''}
  `);
  return 'Seguindo';
}
