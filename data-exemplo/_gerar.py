#!/usr/bin/env python3
"""Gera dados de EXEMPLO (fictícios) para o site, no formato de docs/contrato-dados.md (fase 1 + fase 2).

Uso:  python3 site/data-exemplo/_gerar.py
Escreve em site/data-exemplo/ três casas (Câmara na raiz, ALMG em almg/, CMBH em cmbh/), cada uma com
proposicoes.json, proposicao/, semana/, estatisticas.json, parlamentares.json, parlamentar/ e resumos.json,
mais o casas.json do modo exemplo. Nada aqui é dado real: nomes, partidos (siglas inventadas) e ids são
fictícios. Determinístico (seed fixa) e "hoje" = 2026-11-07.
"""
import json
import random
import statistics
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
HOJE = date(2026, 11, 7)
GERADO_EM = "2026-11-07T12:00:00Z"
SEMANAS = (43, 44, 45)
TERMINAIS = {"lei", "vetado", "arquivado", "retirado"}
rnd = random.Random(45)

PARTIDOS = ["ABC", "XYZ", "QRS", "MNO", "UVW", "HJK"]  # siglas fictícias
UFS = ["MG", "SP", "RJ", "BA", "PE", "RS", "PR", "CE", "PA", "GO", "AM", "DF", "SC", "MA"]

ETAPA_SITUACAO = {
    "apresentado": "Aguarda despacho para as comissões.",
    "comissoes": "Em análise nas comissões ({orgao}).",
    "plenario_origem": "Pronto para votação no Plenário.",
    "casa_revisora": "Aprovado na Câmara; em análise no Senado.",
    "retorno_origem": "Voltou à casa de origem para analisar mudanças da outra casa.",
    "sancao": "Aprovado; aguarda sanção do {executivo}.",
    "lei": "Virou lei.",
    "vetado": "Vetado totalmente; o veto ainda pode ser analisado pelo Legislativo.",
    "arquivado": "Arquivado.",
    "retirado": "Retirado de tramitação.",
}

CASAS = {
    "camara": {
        "nome": "Câmara dos Deputados", "curto": "Câmara", "esfera": "federal", "base": "data-exemplo/", "membros": 513,
        "bicameral": True, "executivo": "Presidente da República", "orgao_exec": "PR", "tit": "Dep.", "tipo_parl": "Deputado",
        "id0": 9100001, "pid0": 990000,
        "url_prop": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao={id}",
        "url_parl": "https://www.camara.leg.br/deputados/{id}",
        "nomes": [
            "Ana Ribeiro", "Carlos Menezes", "Joana Prado", "Rui Albuquerque", "Marta Siqueira",
            "Paulo Freitas", "Lúcia Andrade", "Tiago Moura", "Helena Castro", "Otávio Lima",
            "Sônia Barros", "Fábio Teles", "Renata Quintela", "Gustavo Pires", "Irene Matos",
            "Davi Cordeiro", "Beatriz Nunes", "Hugo Valente", "Clara Bastos", "Mauro Teixeira",
        ],
        "ufs": UFS,
        "orgaos_tema": {
            "Saúde": "CSAUDE", "Educação": "CE", "Meio Ambiente e Desenvolvimento Sustentável": "CMADS",
            "Direito Penal e Processual Penal": "CSPCCO", "Trabalho e Emprego": "CTRAB",
            "Economia": "CDEICS", "Finanças Públicas e Orçamento": "CFT", "Ciência, Tecnologia e Inovação": "CCTI",
            "Comunicações": "CCOM", "Defesa do Consumidor": "CDC", "Direitos Humanos e Minorias": "CDHMIR",
            "Segurança Pública": "CSPCCO", "Agricultura, Pecuária, Pesca e Extrativismo": "CAPADR",
            "Viação, Transporte e Mobilidade": "CVT", "Previdência e Assistência Social": "CPASF",
            "Cidades e Desenvolvimento Urbano": "CDU", "Administração Pública": "CASP", "Esporte e Lazer": "CESPO",
            "Cultura": "CCULT", "Direito Constitucional": "CCJC", "Homenagens e Datas Comemorativas": "CCULT",
        },
        "ccj": "CCJC", "fin": "CFT", "plen": "PLEN", "mesa": "MESA",
        "tipo_num": {"PL": 1000, "PLP": 40, "PEC": 10, "MPV": 1150},
    },
    "almg": {
        "nome": "Assembleia Legislativa de Minas Gerais", "curto": "ALMG", "esfera": "estadual", "base": "data-exemplo/almg/", "membros": 77,
        "bicameral": False, "executivo": "Governador", "orgao_exec": "GOV", "tit": "Dep.", "tipo_parl": "Deputado Estadual",
        "id0": 7200001, "pid0": 880000,
        "url_prop": "https://www.almg.gov.br/projetos-de-lei/?id={id}",
        "url_parl": "https://www.almg.gov.br/deputados/?id={id}",
        "nomes": ["Alice Fontoura", "Bruno Tavares", "Célia Drummond", "Diego Rezende", "Elisa Vasconcelos", "Fernando Lage",
                  "Gisele Amaral", "Heitor Campos", "Ivone Guimarães", "Júlio Brandão", "Lívia Pacheco", "Marcos Viana"],
        "ufs": ["MG"],
        "orgaos_tema": {
            "Saúde": "SAUDE", "Educação": "EDUC", "Meio Ambiente e Desenvolvimento Sustentável": "MEIOAMB",
            "Agricultura, Pecuária, Pesca e Extrativismo": "AGROPEC", "Administração Pública": "ADMPUB",
            "Direito Constitucional": "CCJ", "Direitos Humanos e Minorias": "DIRHUM", "Cultura": "CULTURA",
            "Segurança Pública": "SEGPUB", "Trabalho e Emprego": "TRABALHO", "Cidades e Desenvolvimento Urbano": "ASSMUN",
            "Defesa do Consumidor": "CONSUM", "Viação, Transporte e Mobilidade": "TRANSP", "Esporte e Lazer": "ESPORTE",
        },
        "ccj": "CCJ", "fin": "FFO", "plen": "PLEN", "mesa": "MESA",
        "tipo_num": {"PL": 2100, "PLC": 30, "PEC": 20},
    },
    "cmbh": {
        "nome": "Câmara Municipal de Belo Horizonte", "curto": "CMBH", "esfera": "municipal", "base": "data-exemplo/cmbh/", "membros": 41,
        "bicameral": False, "executivo": "Prefeito", "orgao_exec": "PREF", "tit": "Ver.", "tipo_parl": "Vereador",
        "id0": 5300001, "pid0": 770000,
        "url_prop": "https://www.cmbh.mg.gov.br/atividade-legislativa/pesquisar-proposicoes?id={id}",
        "url_parl": "https://www.cmbh.mg.gov.br/vereadores/?id={id}",
        "nomes": ["Aline Barcelos", "Breno Saraiva", "Cecília Mourão", "Daniel Arruda", "Estela Paiva",
                  "Flávio Godinho", "Graça Ventura", "Henrique Lobo", "Isadora Neves", "Jorge Rocha"],
        "ufs": ["MG"],
        "orgaos_tema": {
            "Educação": "EDUCACAO", "Meio Ambiente e Desenvolvimento Sustentável": "MEIOAMB", "Cidades e Desenvolvimento Urbano": "POLURB",
            "Homenagens e Datas Comemorativas": "CLJ", "Viação, Transporte e Mobilidade": "MOBIL", "Direitos Humanos e Minorias": "DIRHUM",
            "Saúde": "SAUDE", "Defesa do Consumidor": "CONSUM", "Esporte e Lazer": "ESPORTE", "Direito Constitucional": "CLJ",
            "Administração Pública": "ADMPUB",
        },
        "ccj": "CLJ", "fin": "ORCFIN", "plen": "PLEN", "mesa": "MESA",
        "tipo_num": {"PL": 600, "PELO": 3},
    },
}

# (tipo, data_apresentacao, ementa, temas, caminho, data da última mudança de etapa, extra)
P_CAMARA = [
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

UNI = ["apresentado", "comissoes", "plenario_origem", "sancao"]
P_ALMG = [
    ("PL", "2024-03-12", "Institui a política estadual de prevenção a enchentes nos municípios da bacia do Rio Doce.", ["Meio Ambiente e Desenvolvimento Sustentável", "Cidades e Desenvolvimento Urbano"], UNI + ["lei"], "2026-06-18", {}),
    ("PL", "2025-02-18", "Dispõe sobre a gratuidade da segunda via da carteira de identidade para pessoas em situação de rua.", ["Direitos Humanos e Minorias"], UNI + ["lei"], "2026-11-04", {}),
    ("PL", "2025-05-06", "Cria o selo estadual de qualidade do queijo artesanal produzido em Minas Gerais.", ["Agricultura, Pecuária, Pesca e Extrativismo"], UNI, "2026-11-03", {}),
    ("PL", "2025-08-19", "Dispõe sobre a instalação de bebedouros com água filtrada nas escolas estaduais.", ["Educação", "Saúde"], ["apresentado", "comissoes", "plenario_origem"], "2026-10-28", {}),
    ("PLC", "2025-10-07", "Altera a lei complementar que organiza a carreira dos profissionais da educação básica do Estado.", ["Administração Pública", "Educação"], ["apresentado", "comissoes"], "2026-10-21", {}),
    ("PEC", "2024-04-09", "Altera a Constituição do Estado para reduzir o número de assinaturas exigidas na iniciativa popular de leis.", ["Direito Constitucional"], ["apresentado", "comissoes"], "2024-06-11", {}),
    ("PL", "2023-09-26", "Proíbe a cobrança de estacionamento nas duas primeiras horas em hospitais públicos estaduais.", ["Saúde", "Defesa do Consumidor"], ["apresentado", "comissoes"], "2023-11-07", {}),
    ("PL", "2026-11-04", "Institui o programa estadual de transporte escolar rural.", ["Educação", "Viação, Transporte e Mobilidade"], ["apresentado"], "2026-11-04", {}),
    ("PL", "2026-02-10", "Dispõe sobre a transparência das filas de cirurgias eletivas no sistema estadual de saúde.", ["Saúde"], ["apresentado", "comissoes", "plenario_origem"], "2026-09-15", {}),
    ("PL", "2025-03-25", "Cria o cadastro estadual de barragens desativadas.", ["Meio Ambiente e Desenvolvimento Sustentável"], UNI + ["vetado"], "2026-08-27", {}),
    ("PL", "2019-05-14", "Dispõe sobre a reserva de vagas para mulheres em cursos técnicos mantidos pelo Estado.", ["Trabalho e Emprego", "Direitos Humanos e Minorias"], ["apresentado", "comissoes", "arquivado"], "2023-02-01", {"motivo": "Arquivado ao fim da legislatura."}),
    ("PL", "2025-06-03", "Institui a semana estadual de conscientização sobre o transtorno do espectro autista.", ["Saúde", "Direitos Humanos e Minorias"], ["apresentado", "retirado"], "2025-07-01", {}),
    ("PL", "2023-12-05", "Dispõe sobre normas de segurança em eventos com grande público em praças esportivas estaduais.", ["Segurança Pública", "Esporte e Lazer"], ["apresentado"], "2023-12-05", {}),
    ("PL", "2026-10-27", "Cria o programa estadual de apoio a cuidadores familiares de pessoas com deficiência.", ["Direitos Humanos e Minorias"], ["apresentado"], "2026-10-27", {}),
]
P_CMBH = [
    ("PL", "2025-03-11", "Institui o programa municipal de hortas pedagógicas nas escolas.", ["Educação", "Meio Ambiente e Desenvolvimento Sustentável"], UNI + ["lei"], "2026-07-09", {}),
    ("PL", "2024-05-21", "Dispõe sobre a poda de árvores em vias públicas e a comunicação prévia aos moradores.", ["Meio Ambiente e Desenvolvimento Sustentável", "Cidades e Desenvolvimento Urbano"], ["apresentado", "comissoes"], "2024-08-13", {}),
    ("PL", "2026-02-03", "Denomina praça localizada no bairro Santa Tereza.", ["Homenagens e Datas Comemorativas"], UNI + ["lei"], "2026-10-29", {}),
    ("PL", "2025-09-09", "Dispõe sobre acessibilidade em pontos de ônibus do transporte coletivo municipal.", ["Viação, Transporte e Mobilidade", "Direitos Humanos e Minorias"], ["apresentado", "comissoes", "plenario_origem"], "2026-11-05", {}),
    ("PL", "2025-11-18", "Cria o cadastro municipal de imóveis abandonados para fins de habitação social.", ["Cidades e Desenvolvimento Urbano"], ["apresentado", "comissoes"], "2026-02-24", {}),
    ("PELO", "2024-08-06", "Altera a Lei Orgânica para tornar obrigatória audiência pública na revisão do plano diretor.", ["Direito Constitucional", "Cidades e Desenvolvimento Urbano"], ["apresentado", "comissoes"], "2024-09-17", {}),
    ("PL", "2022-04-12", "Dispõe sobre o horário de funcionamento de bares em áreas predominantemente residenciais.", ["Cidades e Desenvolvimento Urbano"], ["apresentado", "comissoes", "plenario_origem", "arquivado"], "2026-10-22", {"rejeitada": True}),
    ("PL", "2026-03-17", "Institui o Dia Municipal do Ciclista.", ["Homenagens e Datas Comemorativas", "Esporte e Lazer"], UNI, "2026-11-03", {}),
    ("PL", "2025-04-29", "Dispõe sobre a instalação de fraldários acessíveis a todos os responsáveis em estabelecimentos comerciais.", ["Defesa do Consumidor"], UNI + ["vetado"], "2026-05-21", {}),
    ("PL", "2026-10-20", "Cria a ouvidoria municipal da pessoa idosa.", ["Direitos Humanos e Minorias", "Administração Pública"], ["apresentado"], "2026-10-20", {}),
    ("PL", "2025-10-14", "Dispõe sobre a limpeza de lotes vagos e a aplicação de multa ao proprietário.", ["Cidades e Desenvolvimento Urbano"], ["apresentado", "comissoes", "retirado"], "2026-04-07", {}),
    ("PL", "2026-11-05", "Institui o programa de bicicletas compartilhadas em parques municipais.", ["Esporte e Lazer", "Viação, Transporte e Mobilidade"], ["apresentado"], "2026-11-05", {}),
]

# resumos (fictícios, como sairiam da frente de resumos): índice da proposição -> (titulo, o que muda, para quem)
RESUMOS = {
    "camara": {
        0: ("Locais com mais de mil pessoas por dia teriam de ter desfibrilador", "Obriga estabelecimentos com circulação diária acima de mil pessoas a manter desfibrilador externo automático.", "Shoppings, estações, estádios e outros locais de grande circulação."),
        1: ("Educação financeira entra como tema no ensino fundamental", "Inclui a educação financeira entre os temas tratados ao longo do ensino fundamental, alterando a LDB.", "Redes de ensino públicas e privadas e seus estudantes."),
        2: ("Programa federal para renovar a frota de caminhões", "Cria um programa nacional de renovação da frota de caminhões.", "Transportadoras e caminhoneiros autônomos."),
        3: ("Muda o limite de faturamento do MEI", "Atualiza os limites de receita bruta do microempreendedor individual na Lei Complementar 123/2006.", "Quem é ou quer ser microempreendedor individual."),
        6: ("Regras para doar alimentos perto do vencimento", "Estabelece normas para supermercados e restaurantes doarem alimentos próximos ao vencimento.", "Comércio de alimentos e entidades que recebem doações."),
        8: ("Plataformas grandes teriam de explicar como recomendam conteúdo", "Exige transparência sobre os algoritmos de recomendação de plataformas digitais de grande porte.", "Redes sociais e serviços digitais com muitos usuários."),
        11: ("Política para reduzir desperdício de água em prédios públicos", "Cria uma política nacional de combate ao desperdício de água em edificações públicas.", "Órgãos públicos federais, estaduais e municipais."),
        15: ("Sem taxa de religação de luz durante calamidade pública", "Proíbe cobrar taxa de religação de energia elétrica em período de calamidade pública.", "Consumidores de energia elétrica e distribuidoras."),
        20: ("Prazo máximo no SUS para exames que diagnosticam câncer", "Estabelece prazo máximo para a realização de exames de diagnóstico de câncer no SUS.", "Pacientes com suspeita de câncer atendidos pelo SUS."),
        21: ("Aviso na frente da embalagem de alimentos ultraprocessados", "Exige advertência frontal na rotulagem de alimentos ultraprocessados.", "Fabricantes de alimentos e consumidores."),
        23: ("Regras e seguro contra acidentes para entregadores de aplicativo", "Regulamenta a atividade de entregador por aplicativo e prevê seguro contra acidentes.", "Entregadores e empresas de aplicativo de entrega."),
        26: ("Ônibus intermunicipal gratuito para estudante de baixa renda", "Garante gratuidade no transporte público intermunicipal a estudantes de baixa renda.", "Estudantes de baixa renda que se deslocam entre cidades."),
        30: ("Regras para uso de inteligência artificial no atendimento público", "Estabelece diretrizes para o uso de IA no atendimento ao cidadão em órgãos públicos.", "Órgãos públicos e cidadãos atendidos por eles."),
        34: ("Câmeras obrigatórias em salas de aula", "Tornaria obrigatória a instalação de câmeras em salas de aula da educação básica.", "Escolas de educação básica, estudantes e professores."),
        35: ("Proibição de fogos com estampido nas cidades", "Proibiria o uso de fogos de artifício com estampido em áreas urbanas.", "Moradores de áreas urbanas, comércio de fogos e organizadores de eventos."),
    },
    "almg": {
        0: ("Política estadual contra enchentes na bacia do Rio Doce", "Cria diretrizes estaduais de prevenção a enchentes nos municípios da bacia do Rio Doce.", "Municípios da bacia e seus moradores."),
        1: ("Segunda via da identidade gratuita para pessoas em situação de rua", "Isenta da taxa a emissão da segunda via da carteira de identidade para esse público.", "Pessoas em situação de rua em Minas Gerais."),
        2: ("Selo estadual para o queijo artesanal mineiro", "Cria um selo de qualidade para o queijo artesanal produzido no Estado.", "Produtores de queijo artesanal e consumidores."),
        6: ("Duas primeiras horas grátis no estacionamento de hospital público estadual", "Proíbe a cobrança de estacionamento nas duas primeiras horas em hospitais públicos estaduais.", "Pacientes, acompanhantes e visitantes."),
        8: ("Filas de cirurgias eletivas públicas e transparentes", "Obriga a divulgação das filas de cirurgias eletivas do sistema estadual de saúde.", "Pacientes que aguardam cirurgia eletiva."),
    },
    "cmbh": {
        0: ("Hortas pedagógicas nas escolas municipais", "Institui um programa de hortas pedagógicas nas escolas do município.", "Escolas municipais e seus estudantes."),
        1: ("Moradores avisados antes da poda de árvores na rua", "Exige comunicação prévia aos moradores antes da poda de árvores em vias públicas.", "Moradores e o serviço municipal de poda."),
        3: ("Pontos de ônibus acessíveis", "Define requisitos de acessibilidade para pontos de ônibus do transporte coletivo.", "Usuários do transporte coletivo, especialmente pessoas com deficiência."),
        4: ("Cadastro de imóveis abandonados para habitação social", "Cria um cadastro municipal de imóveis abandonados que podem ser usados para habitação social.", "Proprietários de imóveis abandonados e famílias que aguardam moradia."),
    },
}

DISCURSOS = [
    "Pronunciamento sobre a tramitação de proposições na área de {tema}.",
    "Comunicação sobre audiência pública realizada na comissão.",
    "Pronunciamento sobre demandas de municípios de {uf}.",
    "Encaminhamento de votação em Plenário.",
]


def d(s):
    return date.fromisoformat(s)


def iso(dt):
    return dt.isoformat()


def ts(dt, hora=None):
    hora = hora if hora is not None else rnd.choice([10, 11, 14, 15, 16, 17, 18])
    return datetime(dt.year, dt.month, dt.day, hora + 3, rnd.choice([0, 15, 30, 45]), tzinfo=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def entre(a, b, n):
    span = (b - a).days
    if n <= 0:
        return []
    if span <= n:
        return [a + timedelta(days=min(span, i + 1)) for i in range(n)]
    pts = sorted(rnd.sample(range(1, span), n))
    return [a + timedelta(days=p) for p in pts]


def placar(total, aprovada, folga=0.62):
    sim = int(total * (rnd.uniform(folga, 0.86) if aprovada else rnd.uniform(0.25, 0.45)))
    abst = rnd.randint(0, max(1, total // 60))
    nao = total - sim - abst
    return {"sim": sim, "nao": nao, "abstencao": abst}


def semana_de(dt):
    a, w, _ = dt.isocalendar()
    return f"{a}-W{w:02d}"


def gerar(cid, P):
    C = CASAS[cid]
    out = RAIZ / C["base"].replace("data-exemplo/", "")
    nomes = C["nomes"]
    parl = [{"id": C["pid0"] + k, "nome": n, "partido": PARTIDOS[k % len(PARTIDOS)], "uf": C["ufs"][k % len(C["ufs"])]} for k, n in enumerate(nomes)]
    executivo = {"nome": "Poder Executivo", "partido": None, "uf": None, "tipo": "Poder Executivo", "id_parlamentar": None}
    props, detalhes, eventos = [], [], []
    num = {}
    for i, (tipo, apres, ementa, temas, caminho, ultima_mud, extra) in enumerate(P):
        pid = C["id0"] + i
        ano = d(apres).year
        k = (tipo, ano)
        num[k] = num.get(k, C["tipo_num"][tipo] + rnd.randint(0, 300)) + rnd.randint(5, 120)
        numero = num[k]
        sigla = f"{tipo} {numero}/{ano}"
        url = C["url_prop"].format(id=pid)
        org_tema = C["orgaos_tema"].get(temas[0], C["ccj"])
        orgaos_com = [org_tema] + ([C["fin"]] if ("Finanças" in " ".join(temas) or rnd.random() < 0.3) else []) + [C["ccj"]]
        if tipo in ("PEC", "PELO"):
            orgaos_com = [C["ccj"], "ESPECIAL"]
        if tipo == "MPV":
            orgaos_com = ["CMMPV"]
        orgaos_com = list(dict.fromkeys(orgaos_com))
        a, b = d(apres), d(ultima_mud)
        inicios = [a] + entre(a, b, len(caminho) - 2) + ([b] if len(caminho) > 1 else [])
        if tipo == "MPV":
            au = executivo
        else:
            p0 = parl[i % len(parl)]
            au = {"nome": p0["nome"], "partido": p0["partido"], "uf": p0["uf"], "tipo": C["tipo_parl"], "id_parlamentar": p0["id"]}
        autores = [au]
        if au["id_parlamentar"] and i % 3 == 0:
            p1 = parl[(i + 7) % len(parl)]
            autores.append({"nome": p1["nome"], "partido": p1["partido"], "uf": p1["uf"], "tipo": C["tipo_parl"], "id_parlamentar": p1["id"]})
        etapas, tram, votacoes, relatores, mudancas = [], [], [], [], []
        nvot = 0
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
                tram.append({"data": ts(ini), "orgao": C["plen"], "descricao": f"Apresentação do {sigla} pelo(a) autor(a): {au['nome']}."})
                if fim and fim > ini:
                    tram.append({"data": ts(min(ini + timedelta(days=1), fim)), "orgao": C["mesa"], "descricao": "Recebimento e leitura. Aguardando despacho."})
            elif et == "comissoes":
                tram.append({"data": ts(ini), "orgao": C["mesa"], "descricao": "Despacho às comissões: " + ", ".join(orgaos_com) + "."})
                pts = entre(ini, fim_ref if fim else min(fim_ref, ini + timedelta(days=900)), len(orgaos_com) * 2)
                if not fim:
                    pts = pts[: max(1, len(pts) // 2)] if (b - a).days > 60 else pts[:1]
                    pts = [p for p in pts if p <= HOJE]
                if fim and pts:
                    pts[-1] = fim
                for kk, p in enumerate(pts):
                    org = orgaos_com[min(kk // 2, len(orgaos_com) - 1)]
                    if kk % 2 == 0:
                        rel = parl[(i * 3 + kk) % len(parl)]
                        relatores.append({"nome": rel["nome"], "orgao": org, "desde": iso(p), "id_parlamentar": rel["id"]})
                        tram.append({"data": ts(p), "orgao": org, "descricao": f"Designado relator(a) {C['tit']} {rel['nome']}."})
                    elif fim:
                        nvot += 1
                        votacoes.append({"id": f"{pid}-{nvot}", "data": iso(p), "orgao": org, "descricao": f"Aprovado o parecer do(a) relator(a) na {org}.", "aprovada": True, "nominal": True, "placar": placar(rnd.choice([5, 7, 9]) if cid != "camara" else rnd.choice([18, 24, 30, 38]), True), "url": url})
                        tram.append({"data": ts(p), "orgao": org, "descricao": "Aprovado o parecer."})
                    else:
                        tram.append({"data": ts(p), "orgao": org, "descricao": "Apresentação do parecer do(a) relator(a). Aguardando inclusão em pauta."})
            elif et == "plenario_origem":
                tram.append({"data": ts(ini), "orgao": C["plen"], "descricao": "Pronta para pauta no Plenário."})
                if fim:
                    turnos = 2 if (tipo in ("PEC", "PELO") or not C["bicameral"]) else 1
                    rej = extra.get("rejeitada")
                    for t in range(turnos):
                        nvot += 1
                        vd = fim - timedelta(days=(turnos - 1 - t) * 6)
                        if rej and t < turnos - 1:
                            ok = True
                        else:
                            ok = not rej
                        desc = (f"Votação em {'1º' if t == 0 else '2º'} turno. " if turnos == 2 else "") + ("Aprovado o projeto." if ok else "Rejeitado o projeto.")
                        presentes = int(C["membros"] * rnd.uniform(0.84, 0.95))
                        v = {"id": f"{pid}-{nvot}", "data": iso(vd), "orgao": C["plen"], "descricao": desc, "aprovada": ok, "nominal": True,
                             "placar": placar(presentes, ok, 0.64 if tipo in ("PEC", "PELO") else 0.52), "url": url}
                        if turnos == 2:
                            v["turno"] = t + 1
                        votacoes.append(v)
                        tram.append({"data": ts(vd), "orgao": C["plen"], "descricao": desc + " Votação nominal."})
            elif et == "casa_revisora":
                tram.append({"data": ts(ini), "orgao": C["mesa"], "descricao": "Remessa ao Senado Federal por meio de ofício."})
                tram.append({"data": ts(ini + timedelta(days=2)), "orgao": "SF", "descricao": "Recebido no Senado Federal."})
                if fim:
                    tram.append({"data": ts(fim - timedelta(days=1)), "orgao": "SF", "descricao": "Aprovado pelo Plenário do Senado Federal" + (" com emendas." if "retorno_origem" in caminho else ".")})
            elif et == "retorno_origem":
                tram.append({"data": ts(ini), "orgao": C["mesa"], "descricao": "Recebidas as emendas do Senado Federal."})
                if fim:
                    nvot += 1
                    votacoes.append({"id": f"{pid}-{nvot}", "data": iso(fim - timedelta(days=1)), "orgao": C["plen"], "descricao": "Votação das emendas do Senado Federal. Aprovadas.", "aprovada": True, "nominal": True, "placar": placar(rnd.randint(430, 490), True), "url": url})
                    tram.append({"data": ts(fim - timedelta(days=1)), "orgao": C["plen"], "descricao": "Aprovadas as emendas do Senado Federal."})
            elif et == "sancao":
                tram.append({"data": ts(ini), "orgao": C["mesa"], "descricao": f"Remessa à sanção do {C['executivo']}." if tipo not in ("PEC", "PELO") else "Remessa à promulgação."})
            elif et == "lei":
                if tipo == "PEC":
                    norma = f"Emenda Constitucional nº {130 + i}/{ini.year}"
                elif tipo == "PELO":
                    norma = f"Emenda à Lei Orgânica nº {40 + i}/{ini.year}"
                elif tipo in ("PLP", "PLC"):
                    norma = f"Lei Complementar nº {210 + i}/{ini.year}"
                else:
                    norma = f"Lei nº {(15000 if cid == 'camara' else 24000 if cid == 'almg' else 11800) + i * 37}/{ini.year}"
                tram.append({"data": ts(ini), "orgao": C["orgao_exec"], "descricao": f"Transformado na {norma}. Publicação no diário oficial."})
            elif et == "vetado":
                tram.append({"data": ts(ini), "orgao": C["orgao_exec"], "descricao": "Vetado totalmente pelo " + C["executivo"] + "."})
            elif et == "arquivado":
                motivo = extra.get("motivo") or ("Arquivado após rejeição em Plenário." if extra.get("rejeitada") else "Arquivado ao fim da legislatura.")
                if tipo == "PEC" and not extra.get("motivo"):
                    motivo = "Arquivado por não ter sido admitido na comissão de constituição e justiça."
                tram.append({"data": ts(ini), "orgao": C["mesa"], "descricao": motivo})
            elif et == "retirado":
                tram.append({"data": ts(ini), "orgao": C["mesa"], "descricao": "Deferido o requerimento de retirada de tramitação apresentado pelo(a) autor(a)."})
        etapa = caminho[-1]
        tram.sort(key=lambda t: t["data"])
        for t in tram:
            t["url"] = url
        ultima = min(max(d(t["data"][:10]) for t in tram), HOJE)
        orgao_atual = {"apresentado": C["mesa"], "comissoes": None, "plenario_origem": C["plen"], "casa_revisora": "SF", "retorno_origem": C["plen"],
                       "sancao": C["orgao_exec"] if tipo not in ("PEC", "PELO") else C["mesa"], "lei": None, "vetado": C["plen"], "arquivado": C["mesa"], "retirado": C["mesa"]}[etapa]
        if etapa == "comissoes":
            orgao_atual = relatores[-1]["orgao"] if relatores else orgaos_com[0]
        linha = {"id": pid, "sigla": sigla, "tipo": tipo, "numero": numero, "ano": ano, "ementa": ementa, "tema": temas, "data_apresentacao": apres,
                 "autor_principal": {k2: v for k2, v in au.items() if k2 != "id_parlamentar"} | {"id_parlamentar": au["id_parlamentar"]},
                 "etapa": etapa, "orgao_atual": orgao_atual, "ultima_movimentacao": iso(ultima), "dias_parado": (HOJE - ultima).days, "url_fonte": url}
        props.append(linha)
        det = dict(linha)
        if C["bicameral"]:
            vinc = {"casa": "Senado", "id": None, "sigla": None, "url": None}
            if "casa_revisora" in caminho:
                vinc = {"casa": "Senado", "id": 170000 + i, "sigla": f"{tipo} {numero + 3000}/{inicios[caminho.index('casa_revisora')].year}", "url": f"https://www25.senado.leg.br/web/atividade/materias/-/materia/{170000 + i}"}
            det["vinculo_outra_casa"] = vinc
        det.update({"autores": autores, "relatores": relatores, "etapas": etapas, "tramitacoes": tram, "votacoes": votacoes})
        detalhes.append(det)
        for (dt_m, de, para) in mudancas:
            eventos.append(("mud", dt_m, {"id": pid, "sigla": sigla, "de": de, "para": para, "data": iso(dt_m)}))
        for v in votacoes:
            eventos.append(("vot", d(v["data"]), {"id": pid, "sigla": sigla, "votacao_id": v["id"], "aprovada": v["aprovada"], "orgao": v["orgao"], "data": v["data"]}))
        eventos.append(("apr", d(apres), pid))

    # ---- arquivos de proposições e semanas ----
    for sub in ("proposicao", "semana", "parlamentar"):
        (out / sub).mkdir(parents=True, exist_ok=True)
        for f in (out / sub).glob("*.json"):
            f.unlink()
    escrever(out / "proposicoes.json", {"gerado_em": GERADO_EM, "proposicoes": props})
    for det in detalhes:
        escrever(out / "proposicao" / f"{det['id']}.json", det)
    idx = []
    for w in SEMANAS:
        ini = date.fromisocalendar(2026, w, 1)
        fim = ini + timedelta(days=6)
        dentro = lambda x: ini <= x <= fim
        sem = {"semana": f"2026-W{w}", "inicio": iso(ini), "fim": iso(fim),
               "mudaram_de_etapa": sorted([e for (k, dt_, e) in eventos if k == "mud" and dentro(dt_)], key=lambda e: e["data"], reverse=True),
               "votadas": [e for (k, dt_, e) in eventos if k == "vot" and dentro(dt_)],
               "apresentadas": [e for (k, dt_, e) in eventos if k == "apr" and dentro(dt_)]}
        escrever(out / "semana" / f"2026-W{w}.json", sem)
        idx.append({"semana": sem["semana"], "inicio": sem["inicio"], "fim": sem["fim"], "mudaram_de_etapa": len(sem["mudaram_de_etapa"]), "votadas": len(sem["votadas"]), "apresentadas": len(sem["apresentadas"])})
    escrever(out / "semana" / "index.json", {"gerado_em": GERADO_EM, "semanas": sorted(idx, key=lambda s: s["semana"], reverse=True)})

    # ---- estatísticas ----
    ordem = ["apresentado", "comissoes", "plenario_origem"] + (["casa_revisora", "retorno_origem"] if C["bicameral"] else []) + ["sancao", "lei"]
    funil = {e: 0 for e in ordem}
    tempos = {e: [] for e in ordem if e != "lei"}
    for det in detalhes:
        vistas = {e["etapa"] for e in det["etapas"]}
        for e in ordem:
            if e in vistas:
                funil[e] += 1
        for e in det["etapas"]:
            if e["etapa"] in tempos and e["fim"]:
                tempos[e["etapa"]].append((d(e["fim"]) - d(e["inicio"])).days)
    vidas = []
    for p in detalhes:
        fv = next((d(e["inicio"]) for e in p["etapas"] if e["etapa"] in TERMINAIS), None)
        vidas.append((((fv or HOJE) - d(p["data_apresentacao"])).days, fv is not None))
    sobrev, s_atual = [], 1.0
    tempos_ev = sorted({t for t, ev in vidas if ev})
    for dias in [0, 30, 90, 180, 365, 545, 730, 1095, 1460, 1825]:
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
    escrever(out / "estatisticas.json", {
        "gerado_em": GERADO_EM, "total": len(props), "funil": funil,
        "gaveta_top": [{"id": p["id"], "dias_parado": p["dias_parado"], "orgao_atual": p["orgao_atual"]} for p in gaveta],
        "tempo_mediano_por_etapa_dias": {k: int(statistics.median(v)) for k, v in tempos.items() if v},
        "sobrevivencia": sobrev,
    })

    # ---- parlamentares ----
    votos_plen = [(det, v) for det in detalhes for v in det["votacoes"] if v["orgao"] == C["plen"] and v.get("nominal")]
    lista_parl = []
    for k, p in enumerate(parl):
        autorias = [{"proposicao_id": det["id"], "sigla": det["sigla"], "etapa": det["etapa"], "proponente": det["autores"][0].get("id_parlamentar") == p["id"]}
                    for det in detalhes if any(a.get("id_parlamentar") == p["id"] for a in det["autores"])]
        relatorias = [{"proposicao_id": det["id"], "sigla": det["sigla"], "orgao": r["orgao"], "desde": r["desde"]}
                      for det in detalhes for r in det["relatores"] if r["id_parlamentar"] == p["id"]]
        votos = []
        for det, v in votos_plen:
            if rnd.random() < 0.08:
                continue  # ausente
            pl = v["placar"]
            tot = pl["sim"] + pl["nao"] + pl["abstencao"]
            r = rnd.random() * tot
            voto = "Sim" if r < pl["sim"] else "Não" if r < pl["sim"] + pl["nao"] else "Abstenção"
            ori = rnd.choice(["Sim", "Sim", "Não", "Liberado"]) if v["aprovada"] else rnd.choice(["Não", "Não", "Sim", "Liberado"])
            votos.append({"votacao_id": v["id"], "proposicao_id": det["id"], "sigla": det["sigla"], "data": v["data"], "descricao": v["descricao"], "voto": voto, "orientacao_partido": ori})
        votos.sort(key=lambda x: x["data"], reverse=True)
        tema = detalhes[k % len(detalhes)]["tema"][0]
        discursos = [{"data": iso(HOJE - timedelta(days=rnd.randint(1, 120))), "sumario": DISCURSOS[(k + m) % len(DISCURSOS)].format(tema=tema.lower(), uf=p["uf"]), "url": C["url_parl"].format(id=p["id"])} for m in range(rnd.randint(0, 3))]
        discursos.sort(key=lambda x: x["data"], reverse=True)
        semanas = []
        for w in SEMANAS:
            sw = f"2026-W{w}"
            semanas.append({"semana": sw,
                            "autorias": sum(1 for det in detalhes if semana_de(d(det["data_apresentacao"])) == sw and any(a.get("id_parlamentar") == p["id"] for a in det["autores"])),
                            "votos": sum(1 for v in votos if semana_de(d(v["data"])) == sw),
                            "relatorias": sum(1 for r in relatorias if semana_de(d(r["desde"])) == sw),
                            "discursos": sum(1 for x in discursos if semana_de(d(x["data"])) == sw)})
        datas = [a for a in [*(det["ultima_movimentacao"] for det in detalhes if any(x.get("id_parlamentar") == p["id"] for x in det["autores"])), *(v["data"] for v in votos), *(x["data"] for x in discursos)]]
        coms = sorted({r["orgao"] for r in relatorias} | {C["orgaos_tema"][list(C["orgaos_tema"])[k % len(C["orgaos_tema"])]]})
        linha_p = {"id": p["id"], "nome": p["nome"], "partido": p["partido"], "uf": p["uf"], "foto_url": None, "em_exercicio": k != len(parl) - 1,
                   "n_autorias": len(autorias), "n_relatorias": len(relatorias), "ultima_atividade": max(datas) if datas else None,
                   "url_fonte": C["url_parl"].format(id=p["id"])}
        lista_parl.append(linha_p)
        det_p = dict(linha_p)
        det_p.update({"nome_civil": p["nome"] + " " + rnd.choice(["da Silva", "de Souza", "Pereira", "Oliveira", "Costa"]), "email": None,
                      "comissoes": [{"sigla": c, "nome": None, "papel": "Titular" if m == 0 else "Suplente"} for m, c in enumerate(coms)],
                      "autorias": autorias, "relatorias": relatorias, "votos": votos, "discursos": discursos, "semanas": semanas})
        escrever(out / "parlamentar" / f"{p['id']}.json", det_p)
    escrever(out / "parlamentares.json", {"gerado_em": GERADO_EM, "parlamentares": lista_parl})

    # ---- resumos (lote) ----
    res = []
    for i, (titulo, muda, quem) in RESUMOS.get(cid, {}).items():
        det = detalhes[i]
        sit = ETAPA_SITUACAO[det["etapa"]].format(orgao=det["orgao_atual"], executivo=C["executivo"])
        res.append({"id": det["id"], "titulo": titulo, "tldr": [muda, quem, sit], "fontes": ["ementa", "tramitacao"],
                    "modelo": "exemplo", "gerado_em": GERADO_EM, "revisado": False})
    escrever(out / "resumos.json", {"gerado_em": GERADO_EM, "resumos": res})
    return {"proposicoes": len(props), "parlamentares": len(lista_parl), "resumos": len(res), "semanas": [(s["semana"], s["mudaram_de_etapa"], s["votadas"], s["apresentadas"]) for s in idx]}


def escrever(caminho, obj):
    with open(caminho, "w") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    resumo = {"camara": gerar("camara", P_CAMARA), "almg": gerar("almg", P_ALMG), "cmbh": gerar("cmbh", P_CMBH)}
    escrever(RAIZ / "casas.json", {"casas": [
        {"id": cid, "nome": C["nome"], "curto": C["curto"], "esfera": C["esfera"], "base": C["base"], "membros": C["membros"],
         "bicameral": C["bicameral"], "executivo": C["executivo"], "parlamentar": C["tipo_parl"],
         "recursos": ["proposicoes", "semanas", "estatisticas", "parlamentares", "resumos"]}
        for cid, C in CASAS.items()]})
    for cid, r in resumo.items():
        print(cid, r)
