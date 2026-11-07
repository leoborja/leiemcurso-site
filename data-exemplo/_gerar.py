#!/usr/bin/env python3
"""Gera dados de EXEMPLO (fictícios) para o site, no formato de docs/contrato-dados.md.

Uso:  python3 site/data-exemplo/_gerar.py
Escreve em site/data-exemplo/. Nada aqui é dado real: nomes, partidos (siglas
inventadas) e ids são fictícios. Determinístico (seed fixa) e "hoje" = 2026-11-07.
"""
import json
import random
import statistics
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parent
HOJE = date(2026, 11, 7)
GERADO_EM = "2026-11-07T12:00:00Z"
rnd = random.Random(45)

PARTIDOS = ["ABC", "XYZ", "QRS", "MNO", "UVW", "HJK"]  # siglas fictícias
UFS = ["MG", "SP", "RJ", "BA", "PE", "RS", "PR", "CE", "PA", "GO", "AM", "DF", "SC", "MA"]
NOMES = [
    "Ana Ribeiro", "Carlos Menezes", "Joana Prado", "Rui Albuquerque", "Marta Siqueira",
    "Paulo Freitas", "Lúcia Andrade", "Tiago Moura", "Helena Castro", "Otávio Lima",
    "Sônia Barros", "Fábio Teles", "Renata Quintela", "Gustavo Pires", "Irene Matos",
    "Davi Cordeiro", "Beatriz Nunes", "Hugo Valente", "Clara Bastos", "Mauro Teixeira",
]
SENADORES = ["Vera Lobato", "Edson Paiva", "Rita Campello"]

ORGAOS_TEMA = {
    "Saúde": "CSAUDE", "Educação": "CE", "Meio Ambiente e Desenvolvimento Sustentável": "CMADS",
    "Direito Penal e Processual Penal": "CSPCCO", "Trabalho e Emprego": "CTRAB",
    "Economia": "CDEICS", "Finanças Públicas e Orçamento": "CFT", "Ciência, Tecnologia e Inovação": "CCTI",
    "Comunicações": "CCOM", "Defesa do Consumidor": "CDC", "Direitos Humanos e Minorias": "CDHMIR",
    "Segurança Pública": "CSPCCO", "Agricultura, Pecuária, Pesca e Extrativismo": "CAPADR",
    "Viação, Transporte e Mobilidade": "CVT", "Previdência e Assistência Social": "CPASF",
    "Cidades e Desenvolvimento Urbano": "CDU", "Administração Pública": "CASP", "Esporte e Lazer": "CESPO",
    "Cultura": "CCULT", "Direito Constitucional": "CCJC",
}

# (tipo, data_apresentacao, ementa, temas, caminho, data da última mudança de etapa, extra)
# caminho: lista de etapas a partir de "apresentado"; extra pode ter "rejeitada": True
P = [
    # ---- leis (chegaram ao fim) ----
    ("PL", "2023-03-14", "Dispõe sobre a obrigatoriedade de desfibriladores externos automáticos em estabelecimentos com circulação diária superior a mil pessoas.", ["Saúde"], ["apresentado", "comissoes", "plenario_origem", "casa_revisora", "sancao", "lei"], "2025-08-19", {}),
    ("PL", "2023-05-02", "Altera a Lei nº 9.394, de 20 de dezembro de 1996, para incluir a educação financeira como tema transversal no ensino fundamental.", ["Educação", "Economia"], ["apresentado", "comissoes", "plenario_origem", "casa_revisora", "retorno_origem", "sancao", "lei"], "2026-11-04", {}),
    ("MPV", "2026-04-08", "Institui o Programa Nacional de Renovação da Frota de Caminhões e dá outras providências.", ["Viação, Transporte e Mobilidade", "Economia"], ["apresentado", "comissoes", "plenario_origem", "casa_revisora", "sancao", "lei"], "2026-10-21", {}),
    ("PLP", "2024-02-20", "Altera a Lei Complementar nº 123, de 14 de dezembro de 2006, para atualizar os limites de receita bruta do microempreendedor individual.", ["Economia", "Finanças Públicas e Orçamento"], ["apresentado", "comissoes", "plenario_origem", "casa_revisora", "sancao", "lei"], "2026-03-11", {}),
    ("PEC", "2023-09-12", "Altera o art. 6º da Constituição Federal para incluir a mobilidade urbana entre os direitos sociais.", ["Direito Constitucional", "Cidades e Desenvolvimento Urbano"], ["apresentado", "comissoes", "plenario_origem", "casa_revisora", "sancao", "lei"], "2025-12-16", {}),
    # ---- vetado ----
    ("PL", "2023-06-27", "Concede isenção do imposto de importação para equipamentos de energia solar destinados a cooperativas rurais.", ["Agricultura, Pecuária, Pesca e Extrativismo", "Meio Ambiente e Desenvolvimento Sustentável"], ["apresentado", "comissoes", "plenario_origem", "casa_revisora", "sancao", "vetado"], "2026-07-30", {}),
    # ---- em sanção ----
    ("PL", "2024-04-16", "Estabelece normas para a doação de alimentos próximos ao vencimento por supermercados e restaurantes.", ["Defesa do Consumidor", "Previdência e Assistência Social"], ["apresentado", "comissoes", "plenario_origem", "casa_revisora", "sancao"], "2026-10-28", {}),
    # ---- casa revisora / retorno ----
    ("PL", "2023-08-08", "Regulamenta o exercício da profissão de cuidador de pessoa idosa.", ["Trabalho e Emprego", "Previdência e Assistência Social"], ["apresentado", "comissoes", "plenario_origem", "casa_revisora"], "2024-11-26", {}),
    ("PL", "2024-09-03", "Dispõe sobre a transparência dos algoritmos de recomendação em plataformas digitais de grande porte.", ["Comunicações", "Ciência, Tecnologia e Inovação"], ["apresentado", "comissoes", "plenario_origem", "casa_revisora"], "2026-11-05", {}),
    ("PL", "2025-02-11", "Cria o Cadastro Nacional de Pessoas Desaparecidas integrado aos órgãos de segurança pública.", ["Segurança Pública", "Direitos Humanos e Minorias"], ["apresentado", "comissoes", "plenario_origem", "casa_revisora"], "2026-06-03", {}),
    ("PL", "2023-11-21", "Altera o Código de Trânsito Brasileiro para dispor sobre o uso de patinetes elétricos em vias públicas.", ["Viação, Transporte e Mobilidade"], ["apresentado", "comissoes", "plenario_origem", "casa_revisora", "retorno_origem"], "2026-10-27", {}),
    # ---- plenário de origem ----
    ("PL", "2024-03-05", "Institui a Política Nacional de Combate ao Desperdício de Água em edificações públicas.", ["Meio Ambiente e Desenvolvimento Sustentável", "Administração Pública"], ["apresentado", "comissoes", "plenario_origem"], "2026-11-03", {}),
    ("PEC", "2025-03-18", "Altera o art. 37 da Constituição Federal para vedar o nepotismo cruzado na administração pública.", ["Direito Constitucional", "Administração Pública"], ["apresentado", "comissoes", "plenario_origem"], "2026-10-20", {}),
    ("PL", "2023-04-25", "Dispõe sobre a jornada de trabalho dos profissionais de enfermagem.", ["Saúde", "Trabalho e Emprego"], ["apresentado", "comissoes", "plenario_origem"], "2024-05-14", {}),
    ("PLP", "2025-06-10", "Dispõe sobre normas gerais para a cobrança do imposto sobre serviços em plataformas de transporte por aplicativo.", ["Finanças Públicas e Orçamento", "Viação, Transporte e Mobilidade"], ["apresentado", "comissoes", "plenario_origem"], "2026-10-30", {}),
    # ---- comissões ----
    ("PL", "2023-02-07", "Proíbe a cobrança de taxa de religação de energia elétrica em período de calamidade pública.", ["Defesa do Consumidor"], ["apresentado", "comissoes"], "2023-03-01", {}),
    ("PL", "2023-07-18", "Dispõe sobre a inclusão de pessoas com deficiência em programas de iniciação esportiva escolar.", ["Esporte e Lazer", "Educação", "Direitos Humanos e Minorias"], ["apresentado", "comissoes"], "2023-08-15", {}),
    ("PL", "2024-05-21", "Altera a Lei nº 8.069, de 13 de julho de 1990, para dispor sobre a proteção de crianças em ambientes digitais.", ["Direitos Humanos e Minorias", "Comunicações"], ["apresentado", "comissoes"], "2024-06-04", {}),
    ("PL", "2024-10-29", "Cria incentivo fiscal para empresas que contratem jovens egressos de medidas socioeducativas.", ["Trabalho e Emprego", "Finanças Públicas e Orçamento"], ["apresentado", "comissoes"], "2024-11-19", {}),
    ("PL", "2025-04-01", "Institui o Dia Nacional da Cultura Popular Nordestina.", ["Cultura"], ["apresentado", "comissoes"], "2025-04-22", {}),
    ("PL", "2025-08-12", "Estabelece prazo máximo para a realização de exames de diagnóstico de câncer no Sistema Único de Saúde.", ["Saúde"], ["apresentado", "comissoes"], "2025-09-02", {}),
    ("PL", "2026-02-24", "Dispõe sobre a rotulagem de alimentos ultraprocessados com advertência frontal.", ["Saúde", "Defesa do Consumidor"], ["apresentado", "comissoes"], "2026-03-17", {}),
    ("PEC", "2026-05-05", "Altera o art. 212 da Constituição Federal para ampliar o percentual mínimo de aplicação em educação pelos municípios.", ["Direito Constitucional", "Educação"], ["apresentado", "comissoes"], "2026-10-22", {}),
    ("PL", "2026-06-16", "Regulamenta a atividade de entregador por aplicativo e dispõe sobre seguro contra acidentes.", ["Trabalho e Emprego", "Viação, Transporte e Mobilidade"], ["apresentado", "comissoes"], "2026-11-04", {}),
    ("PL", "2026-08-25", "Dispõe sobre a criação de corredores ecológicos em áreas de expansão urbana.", ["Meio Ambiente e Desenvolvimento Sustentável", "Cidades e Desenvolvimento Urbano"], ["apresentado", "comissoes"], "2026-10-26", {}),
    ("MPV", "2026-09-30", "Abre crédito extraordinário em favor de ministérios para ações de resposta a eventos climáticos extremos.", ["Finanças Públicas e Orçamento", "Meio Ambiente e Desenvolvimento Sustentável"], ["apresentado", "comissoes"], "2026-10-06", {}),
    # ---- só apresentado (inclui os desta semana e os nunca despachados) ----
    ("PL", "2023-10-03", "Dispõe sobre a gratuidade do transporte público intermunicipal para estudantes de baixa renda.", ["Viação, Transporte e Mobilidade", "Educação"], ["apresentado"], "2023-10-03", {}),
    ("PL", "2026-10-21", "Institui o programa de hortas comunitárias em terrenos públicos ociosos.", ["Cidades e Desenvolvimento Urbano", "Agricultura, Pecuária, Pesca e Extrativismo"], ["apresentado"], "2026-10-21", {}),
    ("PL", "2026-10-28", "Dispõe sobre a obrigatoriedade de cardápio em braile em restaurantes.", ["Direitos Humanos e Minorias", "Defesa do Consumidor"], ["apresentado"], "2026-10-28", {}),
    ("PL", "2026-10-29", "Altera a Lei nº 9.503, de 23 de setembro de 1997, para tornar obrigatório o curso de direção defensiva na renovação da habilitação.", ["Viação, Transporte e Mobilidade"], ["apresentado"], "2026-10-29", {}),
    ("PL", "2026-11-03", "Estabelece diretrizes para o uso de inteligência artificial no atendimento ao cidadão em órgãos públicos.", ["Ciência, Tecnologia e Inovação", "Administração Pública"], ["apresentado"], "2026-11-03", {}),
    ("PLP", "2026-11-04", "Altera a Lei Complementar nº 101, de 4 de maio de 2000, para dispor sobre a publicação de dados de execução orçamentária em formato aberto.", ["Finanças Públicas e Orçamento", "Administração Pública"], ["apresentado"], "2026-11-04", {}),
    ("PL", "2026-11-05", "Dispõe sobre a prevenção ao assédio em ambientes esportivos de base.", ["Esporte e Lazer", "Direitos Humanos e Minorias"], ["apresentado"], "2026-11-05", {}),
    ("MPV", "2026-11-05", "Dispõe sobre medidas temporárias de apoio ao setor pesqueiro afetado pela estiagem.", ["Agricultura, Pecuária, Pesca e Extrativismo"], ["apresentado"], "2026-11-05", {}),
    # ---- arquivados / retirados ----
    ("PL", "2019-04-09", "Dispõe sobre a obrigatoriedade de câmeras em salas de aula da educação básica.", ["Educação", "Segurança Pública"], ["apresentado", "comissoes", "arquivado"], "2023-01-31", {}),
    ("PL", "2023-03-28", "Proíbe o uso de fogos de artifício com estampido em áreas urbanas.", ["Meio Ambiente e Desenvolvimento Sustentável"], ["apresentado", "comissoes", "plenario_origem", "arquivado"], "2026-11-03", {"rejeitada": True}),
    ("PL", "2024-07-09", "Institui o selo nacional de empresa amiga da primeira infância.", ["Previdência e Assistência Social"], ["apresentado", "retirado"], "2024-08-13", {}),
    ("MPV", "2025-11-19", "Altera regras do seguro-defeso para pescadores artesanais.", ["Agricultura, Pecuária, Pesca e Extrativismo", "Previdência e Assistência Social"], ["apresentado", "comissoes", "arquivado"], "2026-03-20", {"motivo": "Perda de eficácia por decurso de prazo"}),
    ("PEC", "2023-05-23", "Altera o art. 14 da Constituição Federal para dispor sobre o voto facultativo.", ["Direito Constitucional"], ["apresentado", "comissoes", "arquivado"], "2026-10-29", {}),
    ("PL", "2025-09-16", "Dispõe sobre a criação de cadastro de devedores de pensão alimentícia.", ["Direitos Humanos e Minorias"], ["apresentado", "comissoes", "retirado"], "2026-02-10", {}),
]

TIPO_NUM = {"PL": 1000, "PLP": 40, "PEC": 10, "MPV": 1150}
ETAPA_NOME = {
    "apresentado": "Apresentação", "comissoes": "Comissões", "plenario_origem": "Plenário",
    "casa_revisora": "Casa revisora", "retorno_origem": "Retorno à origem", "sancao": "Sanção",
    "lei": "Lei", "vetado": "Vetado", "arquivado": "Arquivado", "retirado": "Retirado",
}
TERMINAIS = {"lei", "vetado", "arquivado", "retirado"}


def d(s):
    return date.fromisoformat(s)


def iso(dt):
    return dt.isoformat()


def ts(dt, hora=None):
    hora = hora if hora is not None else rnd.choice([10, 11, 14, 15, 16, 17, 18])
    # BRT 14h -> UTC 17h
    return datetime(dt.year, dt.month, dt.day, hora + 3, rnd.choice([0, 15, 30, 45]), tzinfo=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def entre(a, b, n):
    """n datas crescentes estritamente entre a e b (dias úteis aproximados)."""
    span = (b - a).days
    if n <= 0:
        return []
    if span <= n:
        return [a + timedelta(days=min(span, i + 1)) for i in range(n)]
    pts = sorted(rnd.sample(range(1, span), n))
    return [a + timedelta(days=p) for p in pts]


def autor(tipo, i):
    if tipo == "MPV":
        return {"nome": "Poder Executivo", "partido": None, "uf": None, "tipo": "Poder Executivo"}
    if i % 9 == 4:
        n = SENADORES[i % len(SENADORES)]
        return {"nome": n, "partido": PARTIDOS[(i + 2) % len(PARTIDOS)], "uf": UFS[(i + 5) % len(UFS)], "tipo": "Senador", "id_deputado": None}
    return {"nome": NOMES[i % len(NOMES)], "partido": PARTIDOS[i % len(PARTIDOS)], "uf": UFS[i % len(UFS)], "tipo": "Deputado", "id_deputado": 990000 + i}


def placar(total, aprovada, folga=0.62):
    if aprovada:
        sim = int(total * rnd.uniform(folga, 0.86))
    else:
        sim = int(total * rnd.uniform(0.25, 0.45))
    abst = rnd.randint(0, 9)
    nao = total - sim - abst
    return {"sim": sim, "nao": nao, "abstencao": abst}


props, detalhes, eventos_semana = [], [], []
num_por_tipo_ano = {}

for i, (tipo, apres, ementa, temas, caminho, ultima_mud, extra) in enumerate(P):
    pid = 9100001 + i
    ano = d(apres).year
    k = (tipo, ano)
    num_por_tipo_ano[k] = num_por_tipo_ano.get(k, TIPO_NUM[tipo] + rnd.randint(0, 900)) + rnd.randint(7, 140)
    numero = num_por_tipo_ano[k]
    sigla = f"{tipo} {numero}/{ano}"
    url = f"https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao={pid}"
    orgao_tema = ORGAOS_TEMA[temas[0]]
    orgaos_com = [orgao_tema] + (["CFT"] if "Finanças" in " ".join(temas) or rnd.random() < 0.35 else []) + ["CCJC"]
    if tipo == "PEC":
        orgaos_com = ["CCJC", "CESP"]
    if tipo == "MPV":
        orgaos_com = ["CMMPV"]
    orgaos_com = list(dict.fromkeys(orgaos_com))

    # datas de início de cada etapa
    a, b = d(apres), d(ultima_mud)
    inicios = [a] + entre(a, b, len(caminho) - 2) + ([b] if len(caminho) > 1 else [])
    etapas, tram, votacoes = [], [], []
    au = autor(tipo, i)
    autores = [au]
    if au["tipo"] == "Deputado" and i % 3 == 0:
        autores.append({"nome": NOMES[(i + 7) % len(NOMES)], "partido": PARTIDOS[(i + 3) % len(PARTIDOS)], "uf": UFS[(i + 3) % len(UFS)], "tipo": "Deputado", "id_deputado": 990100 + i})
    relatores = []
    nvot = 0
    mudancas = []  # (data, de, para)

    for j, et in enumerate(caminho):
        ini = inicios[j]
        fim = inicios[j + 1] if j + 1 < len(caminho) else None
        reg = {"etapa": et, "inicio": iso(ini), "fim": iso(fim) if fim else None}
        if et == "comissoes":
            reg["orgaos"] = orgaos_com
        etapas.append(reg)
        if j > 0:
            mudancas.append((ini, caminho[j - 1], et))
        fim_ref = fim or HOJE

        if et == "apresentado":
            tram.append({"data": ts(ini), "orgao": "PLEN", "descricao": f"Apresentação do {sigla} pelo(a) autor(a): {au['nome']}."})
            if fim and fim > ini:
                tram.append({"data": ts(min(ini + timedelta(days=1), fim)), "orgao": "MESA", "descricao": "Recebimento e leitura. Aguardando despacho."})
        elif et == "comissoes":
            tram.append({"data": ts(ini), "orgao": "MESA", "descricao": "Despacho às comissões: " + ", ".join(orgaos_com) + ". Proposição sujeita à apreciação " + ("do Plenário." if tipo in ("PEC", "MPV", "PLP") else "conclusiva pelas comissões.")})
            # cada comissão: relator designado, parecer
            pts = entre(ini, fim_ref if fim else min(fim_ref, ini + timedelta(days=900)), len(orgaos_com) * 2)
            if not fim:
                # projeto parado em comissão: só os primeiros passos
                pts = pts[: max(1, len(pts) // 2)] if (b - a).days > 60 else pts[:1]
                pts = [p for p in pts if p <= HOJE]
            if fim and pts:
                pts[-1] = fim  # o último parecer sai no dia em que a proposição deixa as comissões
            for kk, p in enumerate(pts):
                org = orgaos_com[min(kk // 2, len(orgaos_com) - 1)]
                if kk % 2 == 0:
                    rel = NOMES[(i * 3 + kk) % len(NOMES)]
                    relatores.append({"nome": rel, "orgao": org, "desde": iso(p)})
                    tram.append({"data": ts(p), "orgao": org, "descricao": f"Designado relator(a) Dep. {rel}."})
                else:
                    if fim:
                        nvot += 1
                        vid = f"{pid}-{nvot}"
                        votacoes.append({"id": vid, "data": iso(p), "orgao": org, "descricao": f"Aprovado o parecer do(a) relator(a) na {org}.", "aprovada": True, "placar": placar(rnd.choice([18, 24, 30, 38]), True), "url": url})
                        tram.append({"data": ts(p), "orgao": org, "descricao": "Aprovado o parecer."})
                    else:
                        tram.append({"data": ts(p), "orgao": org, "descricao": "Apresentação do parecer do(a) relator(a). Aguardando inclusão em pauta."})
        elif et == "plenario_origem":
            tram.append({"data": ts(ini), "orgao": "PLEN", "descricao": "Pronta para pauta no Plenário."})
            if fim:
                vdata = fim
                turnos = 2 if tipo == "PEC" else 1
                rej = extra.get("rejeitada")
                for t in range(turnos):
                    nvot += 1
                    vd = vdata - timedelta(days=(turnos - 1 - t) * 5)
                    desc = ("Votação em " + ("primeiro" if t == 0 else "segundo") + " turno. ") if tipo == "PEC" else ""
                    desc += "Rejeitado o projeto." if rej else "Aprovado o projeto."
                    votacoes.append({"id": f"{pid}-{nvot}", "data": iso(vd), "orgao": "PLEN", "descricao": desc, "aprovada": not rej, "placar": placar(rnd.randint(430, 495), not rej, 0.64 if tipo == "PEC" else 0.52), "url": url})
                    tram.append({"data": ts(vd), "orgao": "PLEN", "descricao": desc + " Votação nominal."})
        elif et == "casa_revisora":
            tram.append({"data": ts(ini), "orgao": "MESA", "descricao": "Remessa ao Senado Federal por meio de ofício."})
            tram.append({"data": ts(ini + timedelta(days=2)), "orgao": "SF", "descricao": "Recebido no Senado Federal."})
            if fim:
                tram.append({"data": ts(fim - timedelta(days=1)), "orgao": "SF", "descricao": "Aprovado pelo Plenário do Senado Federal" + (" com emendas." if "retorno_origem" in caminho else ".")})
        elif et == "retorno_origem":
            tram.append({"data": ts(ini), "orgao": "MESA", "descricao": "Recebidas as emendas do Senado Federal."})
            if fim:
                nvot += 1
                votacoes.append({"id": f"{pid}-{nvot}", "data": iso(fim - timedelta(days=1)), "orgao": "PLEN", "descricao": "Votação das emendas do Senado Federal. Aprovadas.", "aprovada": True, "placar": placar(rnd.randint(430, 490), True), "url": url})
                tram.append({"data": ts(fim - timedelta(days=1)), "orgao": "PLEN", "descricao": "Aprovadas as emendas do Senado Federal."})
        elif et == "sancao":
            tram.append({"data": ts(ini), "orgao": "MESA", "descricao": "Remessa à sanção." if tipo != "PEC" else "Remessa à promulgação pelas Mesas da Câmara e do Senado."})
        elif et == "lei":
            norma = f"Lei nº {15000 + i * 37}/{ini.year}" if tipo != "PEC" else f"Emenda Constitucional nº {130 + i}/{ini.year}"
            if tipo == "PLP":
                norma = f"Lei Complementar nº {210 + i}/{ini.year}"
            tram.append({"data": ts(ini), "orgao": "PR" if tipo != "PEC" else "MESA", "descricao": f"Transformado na {norma}. Publicação no Diário Oficial da União."})
        elif et == "vetado":
            tram.append({"data": ts(ini), "orgao": "PR", "descricao": "Vetado totalmente. Veto encaminhado ao Congresso Nacional."})
        elif et == "arquivado":
            motivo = extra.get("motivo") or ("Arquivado após rejeição em Plenário." if extra.get("rejeitada") else "Arquivado nos termos do art. 105 do Regimento Interno (fim da legislatura).")
            if tipo == "PEC" and not extra.get("motivo"):
                motivo = "Arquivado por não ter sido admitido na CCJC."
            tram.append({"data": ts(ini), "orgao": "MESA", "descricao": motivo})
        elif et == "retirado":
            tram.append({"data": ts(ini), "orgao": "MESA", "descricao": "Deferido o requerimento de retirada de tramitação apresentado pelo(a) autor(a)."})

    # movimentação dentro da etapa atual depois da mudança (alguns casos)
    etapa = caminho[-1]
    tram.sort(key=lambda t: t["data"])
    for t in tram:
        t["url"] = url
    ultima = max(d(t["data"][:10]) for t in tram)
    ultima = min(ultima, HOJE)
    dias_parado = (HOJE - ultima).days
    orgao_atual = {
        "apresentado": "MESA", "comissoes": None, "plenario_origem": "PLEN", "casa_revisora": "SF",
        "retorno_origem": "PLEN", "sancao": "PR" if tipo != "PEC" else "MESA", "lei": None,
        "vetado": "CN", "arquivado": "MESA", "retirado": "MESA",
    }[etapa]
    if etapa == "comissoes":
        orgao_atual = relatores[-1]["orgao"] if relatores else orgaos_com[0]

    linha = {
        "id": pid, "sigla": sigla, "tipo": tipo, "numero": numero, "ano": ano, "ementa": ementa,
        "tema": temas, "data_apresentacao": apres, "autor_principal": {k2: v for k2, v in au.items() if k2 != "id_deputado"},
        "etapa": etapa, "orgao_atual": orgao_atual, "ultima_movimentacao": iso(ultima),
        "dias_parado": dias_parado, "url_fonte": url,
    }
    props.append(linha)
    vinc = {"casa": "Senado", "id": None, "sigla": None, "url": None}
    if "casa_revisora" in caminho:
        vinc = {"casa": "Senado", "id": 170000 + i, "sigla": f"{tipo} {numero + 3000}/{inicios[caminho.index('casa_revisora')].year}", "url": f"https://www25.senado.leg.br/web/atividade/materias/-/materia/{170000 + i}"}
    det = dict(linha)
    det.update({"autores": autores, "relatores": relatores, "etapas": etapas, "tramitacoes": tram, "votacoes": votacoes, "vinculo_outra_casa": vinc})
    detalhes.append(det)
    for (dt_m, de, para) in mudancas:
        eventos_semana.append(("mud", dt_m, {"id": pid, "de": de, "para": para, "data": iso(dt_m)}))
    for v in votacoes:
        eventos_semana.append(("vot", d(v["data"]), {"id": pid, "votacao_id": v["id"], "aprovada": v["aprovada"]}))
    eventos_semana.append(("apr", d(apres), pid))

# ---- arquivos ----
(OUT / "proposicao").mkdir(parents=True, exist_ok=True)
(OUT / "semana").mkdir(parents=True, exist_ok=True)
for f in (OUT / "proposicao").glob("*.json"):
    f.unlink()
for f in (OUT / "semana").glob("*.json"):  # inclui index.json
    f.unlink()

json.dump({"gerado_em": GERADO_EM, "proposicoes": props}, open(OUT / "proposicoes.json", "w"), ensure_ascii=False, indent=1)
for det in detalhes:
    json.dump(det, open(OUT / "proposicao" / f"{det['id']}.json", "w"), ensure_ascii=False, indent=1)

semanas = []
for w in (43, 44, 45):
    ini = date.fromisocalendar(2026, w, 1)
    fim = ini + timedelta(days=6)
    dentro = lambda x: ini <= x <= fim
    sem = {
        "semana": f"2026-W{w}", "inicio": iso(ini), "fim": iso(fim),
        "mudaram_de_etapa": [e for (k, dt_, e) in eventos_semana if k == "mud" and dentro(dt_)],
        "votadas": [e for (k, dt_, e) in eventos_semana if k == "vot" and dentro(dt_)],
        "apresentadas": [e for (k, dt_, e) in eventos_semana if k == "apr" and dentro(dt_)],
    }
    sem["mudaram_de_etapa"].sort(key=lambda e: e["data"], reverse=True)
    json.dump(sem, open(OUT / "semana" / f"2026-W{w}.json", "w"), ensure_ascii=False, indent=1)
    semanas.append((sem["semana"], len(sem["mudaram_de_etapa"]), len(sem["votadas"]), len(sem["apresentadas"])))

# índice de semanas (extensão proposta ao contrato: evita o site "adivinhar" quais semanas existem)
json.dump({"semanas": [s[0] for s in semanas]}, open(OUT / "semana" / "index.json", "w"), ensure_ascii=False, indent=1)

# ---- estatísticas ----
ORDEM = ["apresentado", "comissoes", "plenario_origem", "casa_revisora", "retorno_origem", "sancao", "lei"]
funil = {e: 0 for e in ORDEM}
tempos = {e: [] for e in ORDEM if e != "lei"}
for det in detalhes:
    vistas = {e["etapa"] for e in det["etapas"]}
    for e in ORDEM:
        if e in vistas:
            funil[e] += 1
    for e in det["etapas"]:
        if e["etapa"] in tempos and e["fim"]:
            tempos[e["etapa"]].append((d(e["fim"]) - d(e["inicio"])).days)
# curva de sobrevivência (Kaplan-Meier): % ainda em tramitação (sem desfecho) após N dias,
# censurando quem ainda não tem idade para o ponto.
vidas = []
for p in detalhes:
    fim_vida = next((d(e["inicio"]) for e in p["etapas"] if e["etapa"] in TERMINAIS), None)
    ini_p = d(p["data_apresentacao"])
    vidas.append(((fim_vida or HOJE) - ini_p).days if True else 0)
    vidas[-1] = (vidas[-1], fim_vida is not None)
sobrev, s_atual = [], 1.0
tempos_ev = sorted({t for t, ev in vidas if ev})
pontos = [0, 30, 90, 180, 365, 545, 730, 1095, 1460, 1825]
for dias in pontos:
    for t in [t for t in tempos_ev if t <= dias]:
        n_risco = sum(1 for tt, _ in vidas if tt >= t)
        n_ev = sum(1 for tt, ev in vidas if ev and tt == t)
        if n_risco:
            s_atual *= 1 - n_ev / n_risco
    tempos_ev = [t for t in tempos_ev if t > dias]
    if sum(1 for tt, _ in vidas if tt >= dias) == 0:
        break
    sobrev.append({"dias": dias, "pct_ainda_ativo": round(100 * s_atual, 1)})
gaveta = sorted([p for p in props if p["etapa"] not in TERMINAIS], key=lambda p: -p["dias_parado"])[:20]
est = {
    "gerado_em": GERADO_EM,
    "funil": funil,
    "gaveta_top": [{"id": p["id"], "dias_parado": p["dias_parado"], "orgao_atual": p["orgao_atual"]} for p in gaveta],
    "tempo_mediano_por_etapa_dias": {k: int(statistics.median(v)) for k, v in tempos.items() if v},
    "sobrevivencia": sobrev,
}
json.dump(est, open(OUT / "estatisticas.json", "w"), ensure_ascii=False, indent=1)

print(f"{len(props)} proposições")
for s in semanas:
    print("semana %s: %d mudaram, %d votações, %d apresentadas" % s)
print("funil", funil)
print("tempos", est["tempo_mediano_por_etapa_dias"])
print("sobrevivencia", sobrev)
