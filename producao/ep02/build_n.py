"""Episódio 1 — versão narrada (ElevenLabs). Cenas e legendas presas ao tempo da narração."""
import os, json, re, numpy as np, soundfile as sf
from scipy import signal
HERE=os.path.dirname(os.path.abspath(__file__))
src=open(os.path.join(HERE,"..","ep1","build_audio.py")).read()
a=src.index("# ---------------------------------------------------------------- utilidades"); b=src.index("# ---------------------------------------------------------------- mixagem")
SR=48000; FPS=30; rng=np.random.default_rng(7)
exec(src[a:b])

narr,_=sf.read(f"{HERE}/narr.wav")
END=101.5
BD,HO,HN,MA,GA,RI,BAR="bar_day","house","house_night","marilene","garage","river","bar"
SH=[
 (0.0, 3.7, dict(type="facade",place="bar_day",tag="Bar do Sandro",sub="Sexta-feira, de manhã",fi=.6)),
 (3.7, 7.7, dict(type="envelope_floor",revealAt=2.9)),
 (7.7, 9.6, dict(type="bust",char="sandro",bg=BD,expr="suspicious",cam="push"), [(7.82,9.38)]),
 (9.6,11.3, dict(type="envelope_pick")),
 (11.3,12.9,dict(type="bust",char="sandro",bg=BD,expr="serious",cam="drift_l",gaze=-.8)),
 (12.9,14.8,dict(type="drawer",closeAt=1.0)),
 (14.8,18.5,dict(type="title",ep="EPISÓDIO 2 · O MESMO LUGAR",fi=.3,fo=.35)),
 (18.5,23.3,dict(type="nails",buzzAt=3.1,fi=.3)),
 (23.3,25.0,dict(type="bust",char="keliane",bg=HO,expr="smile",cam="push",gaze=.3,gy=.8)),
 (25.0,27.5,dict(type="bust",char="raimundinha",bg=HO,expr="teasing",cam="push"), [(25.0,27.4)]),
 (27.5,30.2,dict(type="bust",char="keliane",bg=HO,expr="forced",cam="push"), [(27.6,30.03)]),
 (30.2,32.0,dict(type="bust",char="raimundinha",bg=HO,expr="suspicious",cam="push_fast"), [(30.25,31.72)]),
 (32.0,36.7,dict(type="phone_name")),
 (36.7,38.2,dict(type="facade",place="marilene",tag="Bar da Marilene",sub="Rua do Sossego")),
 (38.2,44.8,dict(type="bust",char="diego",bg=MA,expr="worried",cam="push"), [(40.85,44.62)]),
 (44.8,51.3,dict(type="bust",char="marilene",bg=MA,expr="firm",cam="push_slow"), [(44.86,51.08)]),
 (51.3,54.4,dict(type="bust",char="marilene",bg=MA,expr="teasing",cam="push_fast")),
 (54.4,58.3,dict(type="bust",char="rafael",bg=GA,expr="serious",cam="drift_r",gy=.6,fi=.3)),
 (58.3,60.8,dict(type="bust",char="rafael",bg=GA,expr="angry",cam="push"), [(58.38,60.69)]),
 (60.8,62.9,dict(type="bust",char="diego",bg=GA,expr="angry",cam="push"), [(60.93,62.77)]),
 (62.9,70.3,dict(type="flashback",giveAt=4.1,fi=.3,fo=.3)),
 (70.3,73.3,dict(type="chat_in",msgAt=2.9)),
 (73.3,76.3,dict(type="bust",char="keliane",bg=HN,expr="smile",cam="push"), [(73.39,76.02)]),
 (76.3,79.8,dict(type="pharmacy_exit",fi=.4)),
 (79.8,87.0,dict(type="river_moto",kelAt=4.6)),
 (87.0,88.5,dict(type="bust",char="raimundinha",bg=RI,expr="shocked",cam="push_fast"), [(87.17,88.23)]),
 (88.5,91.2,dict(type="photo_cam",snapAt=1.46)),
 (91.2,95.5,dict(type="card",text="Será que ela vai contar pro Juvenal?",fi=.25)),
 (95.5,99.5,dict(type="cta",likeAt=1.2,followAt=2.5)),
 (99.5,END,dict(type="continua",fo=.8)),
]
CAP=[]
SFXL=[("hit",6.6),("flip",9.9),("flip",13.9),("impact",14.8),("riser_out",15.0),("buzz",21.6),("buzz",22.3),("whoosh",62.9),("hit",67.0),
("ping",73.2),("step",77.0),("step",77.6),("step",78.2),("whoosh",84.3),("hit",86.0),("tick",89.96),("flip",89.98),("impact",91.1)]
MUSL=[("tension",0,14.8),("outro",18.5,36.7),("bar",36.7,54.4),("tension",54.4,62.9),("drone",62.9,70.3),("sad",70.3,76.3),("drone",76.3,91.2),("outro",95.5,END)]
AMBL=[("bar",36.7,54.4),("crickets",76.3,91.2)]

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
json.dump(dict(fps=FPS,total=END,ep="EP. 2",beats=beats),open(f"{HERE}/schedule.json","w"),ensure_ascii=False)

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
