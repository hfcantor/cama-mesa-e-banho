"""Episódio 1 — versão narrada (ElevenLabs). Cenas e legendas presas ao tempo da narração."""
import os, json, re, numpy as np, soundfile as sf
from scipy import signal
HERE=os.path.dirname(os.path.abspath(__file__))
src=open(os.path.join(HERE,"..","ep1","build_audio.py")).read()
a=src.index("# ---------------------------------------------------------------- utilidades"); b=src.index("# ---------------------------------------------------------------- mixagem")
SR=48000; FPS=30; rng=np.random.default_rng(7)
exec(src[a:b])

narr,_=sf.read(f"{HERE}/narr.wav")
END=114.0
NIGHT,BAR,EXT="night_street","bar","bar_ext"
# (início, fim, tomada, falas-com-boca)
SH=[
 (0.0, 2.3, dict(type="night_establish")),
 (2.3, 8.9, dict(type="phone_notif",owner="diego",bg=NIGHT,onAt=.05,notifAt=1.9,buzz=[0.0,.8])),
 (8.9,13.2, dict(type="bust",char="diego",bg=NIGHT,expr="worried",cam="push"), [(9.85,12.9)]),
 (13.2,16.9,dict(type="title")),
 (16.9,19.4,dict(type="bar_establish")),
 (19.4,20.7,dict(type="bust",char="rafael",bg=BAR,expr="neutral",cam="drift_r")),
 (20.7,21.9,dict(type="bust",char="bruno",bg=BAR,expr="smile",cam="drift_l")),
 (21.9,23.6,dict(type="bust",char="lucas",bg=BAR,expr="soft",cam="push")),
 (23.6,28.2,dict(type="bust",char="sandro",bg=BAR,expr="smile",cam="push"), [(24.35,28.06)]),
 (28.2,35.0,dict(type="table_phone",buzz=[.2,.9],flipAt=4.6)),
 (35.0,39.7,dict(type="bust",char="bruno",bg=BAR,expr="smile",cam="push"), [(35.6,39.52)]),
 (39.7,46.0,dict(type="chat",readAt=4.2)),
 (46.0,50.0,dict(type="bust",char="diego",bg=BAR,expr="forced",cam="push")),
 (50.0,54.1,dict(type="doorway",openAt=1.1)),
 (54.1,56.5,dict(type="bust",char="marcelo",bg=BAR,expr="cold",cam="push_slow"), [(55.22,56.22)]),
 (56.5,58.5,dict(type="bust",char="diego",bg=BAR,expr="worried",cam="push"), [(56.65,58.38)]),
 (58.5,62.7,dict(type="bust",char="marcelo",bg=BAR,expr="cold",cam="push_fast"), [(58.66,62.5)]),
 (62.7,66.9,dict(type="split_eyes",top="marcelo",bottom="lucas",lookAt=1.4)),
 (66.9,70.4,dict(type="bust",char="diego",bg=BAR,expr="forced",cam="push"), [(67.86,70.21)]),
 (70.4,75.6,dict(type="bust",char="rafael",bg=BAR,expr="serious",cam="push_slow",gaze=-.5)),
 (75.6,78.2,dict(type="bust",char="rafael",bg=EXT,expr="sad",cam="drift_l")),
 (78.2,82.6,dict(type="bust",char="rafael",bg=EXT,expr="sad",cam="push"), [(78.31,82.42)]),
 (82.6,86.9,dict(type="bust",char="lucas",bg=EXT,expr="soft",cam="push"), [(82.75,86.66)]),
 (86.9,93.4,dict(type="street_walk",buzzAt=1.4)),
 (93.4,99.2,dict(type="secret_phone",inAt=.25,typeAt=2.4,sentAt=3.0,delAt=4.8)),
 (99.2,103.2,dict(type="calc",typeAt=1.0,step=.3)),
 (103.2,105.4,dict(type="bust",char="diego",bg=NIGHT,expr="worried",cam="pull"), [(103.3,105.18)]),
 (105.4,108.0,dict(type="card",text="Por que o Lucas tem dois celulares?")),
 (108.0,112.1,dict(type="cta",likeAt=1.2,followAt=2.5)),
 (112.1,END,dict(type="continua")),
]
CAP=[(0.05,1.87,"Quase meia-noite no Tabocal."),(2.35,3.80,"O celular do Diego acende."),(4.20,5.32,"Mensagem do Marcelo."),
(5.73,6.46,"Quarenta mil."),(6.81,7.46,"Até sexta."),(7.77,8.58,"Sem desculpa."),(9.02,9.49,"Diego:"),(9.85,10.65,"Sexta?"),
(10.94,11.98,"Vixe..."),(12.37,12.85,"não dá."),(17.00,18.10,"Rua da Felicidade."),(18.47,19.35,"No Bar do Sandro,"),
(19.52,23.37,"Rafael, Bruno e Lucas, amigos de infância, estão na mesa de sempre."),(23.76,24.14,"Sandro:"),
(24.35,28.06,"Bora, rapaziada! Aqui é a Rua da Felicidade, não quero tristeza!"),(28.42,29.71,"O celular do Bruno vibra."),
(30.09,31.27,"Na tela, aparece:"),(31.50,32.48,"Cliente Corrida."),(32.82,34.78,"Ele vira o celular pra baixo, rapidinho."),
(35.06,35.45,"Bruno:"),(36.01,37.30,"Cliente pedindo corrida."),(37.46,39.52,"Mototaxista não tem sossego, parceiro."),
(39.85,41.46,"Rafael olha o próprio celular."),(41.75,42.73,"Ele mandou pra Camila:"),(43.01,43.52,"Tá tudo bem?"),
(43.91,44.80,"Ela visualizou..."),(45.06,45.79,"e não respondeu."),(46.21,47.18,"Aí chega o Diego."),(47.47,47.86,"Tenso."),
(48.15,49.71,"Fingindo que tá tudo sob controle."),(50.06,50.69,"Não tava."),(51.11,51.94,"A porta abre..."),
(52.16,53.79,"e o bar inteiro fica em silêncio."),(54.18,54.81,"É o Marcelo."),(55.22,56.22,"Recebeu minha mensagem?"),
(56.65,58.38,"Tu disse que eu tinha até o fim do mês."),(58.66,59.10,"Disse."),(59.47,59.86,"Mudou."),(60.50,61.62,"Prazo é prazo, Diego..."),
(61.97,62.50,"Sexta."),(62.88,65.84,"Na saída, Marcelo troca um olhar rápido com o Lucas."),(66.10,66.93,"Ninguém percebe."),
(67.23,67.66,"Diego:"),(67.86,70.21,"Coisa de trabalho. Tá tudo certo."),(70.56,72.19,"Mas o Rafael sabe que é mentira."),
(72.50,75.32,"Ele sabe mais sobre essa dívida do que conta pra qualquer um."),(75.70,76.25,"Lá fora,"),(76.45,78.02,"Rafael desabafa com o Lucas."),
(78.31,78.99,"É a Camila."),(79.34,80.70,"Visualiza e não responde."),(81.03,82.42,"Inventa desculpa pra tudo."),(82.75,83.46,"Calma, Rafa."),
(83.78,84.46,"Confia nela."),(84.84,86.66,"Nem todo mundo tá escondendo alguma coisa."),
(87.05,90.07,"No caminho pra casa, um celular vibra na mochila do Lucas."),(90.39,91.70,"Não é o celular de sempre..."),
(92.07,93.25,"É um segundo celular."),(93.62,94.71,"Número desconhecido:"),(95.10,95.98,"Tu contou pra eles?"),(96.37,96.92,"Ainda não."),
(97.38,97.99,"Depois..."),(98.20,98.90,"apaga tudo."),(99.33,100.02,"Enquanto isso,"),(100.19,101.66,"Diego faz a conta de novo."),
(102.03,102.91,"Quarenta mil."),(103.30,105.18,"Onde é que eu vou arrumar isso?"),
(108.17,111.90,"Curte e segue o Histórias do Tabocal pra não perder o próximo episódio.")]
SFXL=[("buzz",2.3),("buzz",3.1),("impact",13.2),("riser_out",13.4),("buzz",28.4),("buzz",29.1),("flip",32.8),("tick",43.9),
("creak",51.1),("step",52.2),("step",52.8),("step",53.4),("chair",54.3),("whoosh",62.8),("hit",64.0),("door_slam",66.85),
("moto",84.6),("buzz_muffled",88.3),("buzz_muffled",88.9),("ping",93.65),("type",95.8),("type",95.95),("type",96.1),("type",96.25),
("delete",98.2),("type",100.2),("type",100.5),("type",100.8),("type",101.1),("type",101.4),("impact",105.3)]
MUSL=[("drone",0,13.2),("bar",16.9,50.0),("tension",50.0,75.6),("sad",75.6,86.9),("drone",86.9,105.4),("outro",108.0,END)]
AMBL=[("crickets",0,13.2),("bar",16.9,50.0),("bar_quiet",50.0,75.6),("night",75.6,86.9),("crickets",86.9,105.4)]

def env_of(a,b):
    hop=SR//FPS; y=narr[int(a*SR):int(b*SR)]
    r=np.array([np.sqrt(np.mean(y[i:i+hop]**2)) for i in range(0,len(y),hop)]); r=(r/(np.percentile(r,90)+1e-9)).clip(0,1.2)
    return [round(float(v),2) for v in np.convolve(r,[.25,.5,.25],"same")]
def words(text,dur):
    ws=text.split(); w=np.array([len(re.sub(r"\W","",x))+1.5+(3 if re.search(r"[.,!?…:]$",x) else 0) for x in ws],float)
    cs=np.concatenate([[0],np.cumsum(w)])/w.sum()*dur
    return [dict(w=x,a=round(float(cs[i]),3),b=round(float(cs[i+1]),3)) for i,x in enumerate(ws)]
beats=[]
for i,s in enumerate(SH):
    t0,t1,sh=s[0],s[1],s[2]; lines=[]
    for a,b in (s[3] if len(s)>3 else []): lines.append(dict(speaker=sh["char"],t0=a,dur=b-a,mouth=env_of(a,b),words=[]))
    for a,b,tx in CAP:
        if t0<=a<t1: lines.append(dict(speaker="narr",t0=a,dur=b-a,text=tx,words=words(tx,b-a)))
    beats.append(dict(id=f"s{i:02d}_{sh['type']}",t0=t0,dur=t1-t0,shot=sh,lines=lines))
json.dump(dict(fps=FPS,total=END,beats=beats),open(f"{HERE}/schedule.json","w"),ensure_ascii=False)

N=int(END*SR); dia=np.zeros(N); mus=np.zeros(N); amb=np.zeros(N); fx=np.zeros(N); FADE=.6
place(dia,narr,0)
for n,a,b in MUSL:
    x=MUS[n](b-a+FADE)*MUS_GAIN[n]; x*=env(len(x),.4 if n!="bar" else .05,FADE); place(mus,x,a)
for n,a,b in AMBL:
    x=AMB[n](b-a+FADE); x*=env(len(x),.3,FADE); place(amb,x,a)
for n,t in SFXL: place(fx,SFX[n](),t)
de=np.abs(dia); de=signal.sosfilt(signal.butter(2,4,'low',fs=SR,output='sos'),de); de=(de/(de.max()+1e-9)*4).clip(0,1)
mix=dia*1.0+mus*(1-.6*de)*.85+amb*(1-.45*de)*.85+fx*.9
pk=np.max(np.abs(mix)); mix=mix/pk*.95 if pk>.95 else mix
sf.write(f"{HERE}/mix.wav",np.stack([mix,mix],1).astype(np.float32),SR)
print("ok", END)
