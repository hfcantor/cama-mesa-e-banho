"""Decupagem do episódio 1 — 'A Conta Chegou'.
Cada beat = uma tomada. 'lines' = falas (personagem, texto). 'min' = duração mínima.
'sfx' = efeitos (nome, segundo dentro da tomada). 'mus' = trilha a partir desta tomada.
"""
NIGHT, BAR, BAR_EXT = "night_street", "bar", "bar_ext"

BEATS = [
    # CENA 1 — GANCHO
    dict(id="c1_phone", shot=dict(type="phone_notif", owner="diego", bg=NIGHT,
         sender="Marcelo", msg="40 mil. Até sexta. Sem desculpa."), min=3.4,
         sfx=[("buzz", 0.5), ("buzz", 1.3)], mus="drone", amb="crickets"),
    dict(id="c1_diego", shot=dict(type="bust", char="diego", bg=NIGHT, expr="worried", cam="push"),
         lines=[("diego", "Sexta-feira? Não... não dá.")], pre=0.3, post=0.5),
    # VINHETA
    dict(id="title", shot=dict(type="title"), min=3.8, sfx=[("impact", 0.0), ("riser_out", 0.2)], mus="none", amb="none"),
    # CENA 2 — O BAR
    dict(id="c2_est", shot=dict(type="bar_establish"), min=2.4, mus="bar", amb="bar"),
    dict(id="c2_sandro", shot=dict(type="bust", char="sandro", bg=BAR, expr="smile", cam="push"),
         lines=[("sandro", "Bora, rapaziada! Aqui é a Rua da Felicidade, não quero tristeza!")]),
    dict(id="c2_bruno", shot=dict(type="bust", char="bruno", bg=BAR, expr="smile", cam="drift_l"),
         lines=[("bruno", "Égua, Rafa, perdeu de novo! Paga a próxima!")]),
    dict(id="c2_rafael", shot=dict(type="bust", char="rafael", bg=BAR, expr="neutral", cam="drift_r"),
         lines=[("rafael", "Tô devendo nada não.")]),
    dict(id="c2_bphone", shot=dict(type="table_phone", contact="Cliente Corrida"), min=2.6,
         sfx=[("buzz", 0.3), ("buzz", 1.0), ("flip", 1.75)]),
    dict(id="c2_lucas", shot=dict(type="bust", char="lucas", bg=BAR, expr="smirk", cam="push"),
         lines=[("lucas", "Quem é que tá te procurando a essa hora?")]),
    dict(id="c2_bruno2", shot=dict(type="bust", char="bruno", bg=BAR, expr="smile", cam="push"),
         lines=[("bruno", "Cliente pedindo corrida. Mototaxista não tem sossego, parceiro.")]),
    dict(id="c2_rchat", shot=dict(type="chat", owner="rafael", contact="Camila"), min=3.2,
         sfx=[("tick", 1.2)]),
    dict(id="c2_sandro2", shot=dict(type="bust", char="sandro", bg=BAR, expr="smile", cam="drift_l"),
         lines=[("sandro", "Diego! Pendura não, hein!")], pre=0.2),
    dict(id="c2_diego", shot=dict(type="bust", char="diego", bg=BAR, expr="forced", cam="push"),
         lines=[("diego", "Relaxa, Sandro, tá tudo sob controle.")]),
    # CENA 3 — A COBRANÇA
    dict(id="c3_door", shot=dict(type="doorway"), min=2.6, sfx=[("creak", 0.1), ("step", 1.2), ("step", 1.75), ("step", 2.3)],
         mus="tension", amb="bar_quiet"),
    dict(id="c3_marcelo", shot=dict(type="bust", char="marcelo", bg=BAR, expr="cold", cam="push_slow"),
         lines=[("marcelo", "Boa noite, rapaziada."), ("marcelo", "Recebeu minha mensagem?")], sfx=[("chair", 0.0)], gap=0.7),
    dict(id="c3_diego", shot=dict(type="bust", char="diego", bg=BAR, expr="worried", cam="push"),
         lines=[("diego", "Tu disse que eu tinha até o fim do mês.")]),
    dict(id="c3_marcelo2", shot=dict(type="bust", char="marcelo", bg=BAR, expr="cold", cam="push_fast"),
         lines=[("marcelo", "Eu disse. Mas mudou."), ("marcelo", "Prazo é prazo, Diego. Sexta.")], gap=0.5),
    dict(id="c3_watch", shot=dict(type="watch"), min=1.8, sfx=[("pat", 0.55), ("pat", 0.95)]),
    dict(id="c3_glance", shot=dict(type="split_eyes", top="marcelo", bottom="lucas"), min=2.4,
         sfx=[("whoosh", 0.1), ("hit", 0.9)]),
    dict(id="c3_bruno", shot=dict(type="bust", char="bruno", bg=BAR, expr="worried", cam="drift_r"),
         lines=[("bruno", "Que foi isso, mano?")], sfx=[("door_slam", 0.0)], pre=0.5),
    dict(id="c3_diego2", shot=dict(type="bust", char="diego", bg=BAR, expr="forced", cam="push"),
         lines=[("diego", "Coisa de trabalho. Tá tudo certo.")]),
    dict(id="c3_glance2", shot=dict(type="split_eyes", top="diego", bottom="rafael"), min=2.2,
         sfx=[("whoosh", 0.1)]),
    # CENA 4 — A DESCONFIANÇA
    dict(id="c4_rafael", shot=dict(type="bust", char="rafael", bg=BAR_EXT, expr="sad", cam="push_slow", watch=True), min=1.6,
         mus="sad", amb="night"),
    dict(id="c4_lucas", shot=dict(type="bust", char="lucas", bg=BAR_EXT, expr="neutral", cam="drift_l"),
         lines=[("lucas", "Tu também tá estranho hoje.")]),
    dict(id="c4_rafael2", shot=dict(type="bust", char="rafael", bg=BAR_EXT, expr="sad", cam="push"),
         lines=[("rafael", "É a Camila. Visualiza e não responde."), ("rafael", "Inventa desculpa pra tudo.")], gap=0.4),
    dict(id="c4_lucas2", shot=dict(type="bust", char="lucas", bg=BAR_EXT, expr="soft", cam="push"),
         lines=[("lucas", "Calma, Rafael. Confia nela."), ("lucas", "Nem todo mundo tá escondendo alguma coisa.")], gap=0.4),
    dict(id="c4_stare", shot=dict(type="bust", char="rafael", bg=BAR_EXT, expr="serious", cam="push_slow", gaze=-0.6), min=1.8,
         sfx=[("moto", 0.0)]),
    # CENA 5 — O SEGREDO
    dict(id="c5_walk", shot=dict(type="street_walk"), min=2.6, sfx=[("buzz_muffled", 1.2), ("buzz_muffled", 1.8)],
         mus="drone", amb="crickets"),
    dict(id="c5_phone2", shot=dict(type="secret_phone"), min=5.6,
         lines=[("lucas", "Ainda não.")], pre=2.3, sfx=[("ping", 0.3), ("type", 1.4), ("type", 1.6), ("type", 1.8), ("type", 2.0), ("delete", 4.1)]),
    dict(id="c5_calc", shot=dict(type="calc"), min=2.0, sfx=[("type", 0.3), ("type", 0.55), ("type", 0.8), ("type", 1.05)]),
    dict(id="c5_diego", shot=dict(type="bust", char="diego", bg=NIGHT, expr="worried", cam="pull", gaze=0.0),
         lines=[("diego", "Onde é que eu vou arrumar isso...")], post=0.6, sfx=[("impact", None)]),
    # CENA 6 — ENCERRAMENTO
    dict(id="c6_q", shot=dict(type="card", text="Por que Lucas tem dois celulares?"), min=2.6, mus="none", amb="none"),
    dict(id="c6_cta", shot=dict(type="cta"), lines=[("narr", "Curte e segue o Histórias do Tabocal, pra não perder o próximo episódio!")],
         pre=0.3, post=0.4, mus="outro"),
    dict(id="c6_end", shot=dict(type="continua"), min=1.8),
]
