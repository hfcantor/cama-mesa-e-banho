"""Episódio 1 — versão narrada (ElevenLabs). Cenas e legendas presas ao tempo da narração."""
import os, json, re, numpy as np, soundfile as sf
from scipy import signal
HERE=os.path.dirname(os.path.abspath(__file__))
src=open(os.path.join(HERE,"..","ep1","build_audio.py")).read()
a=src.index("# ---------------------------------------------------------------- utilidades"); b=src.index("# ---------------------------------------------------------------- mixagem")
SR=48000; FPS=30; rng=np.random.default_rng(7)
exec(src[a:b])

narr,_=sf.read(f"{HERE}/narr.wav")
END=93.8
RN,PI,HN,HD="rental_night","pharmacy_in","house_night","house_dark"
SH=[
 (0.0, 5.3, dict(type="graffiti",instant=True,recap=True,fi=.4)),
 (5.3,10.3, dict(type="receipt",all=True,night=True,zoomName=True,recap=True)),
 (10.3,14.6,dict(type="bust",char="marcelo",bg=RN,expr="cold",cam="push",recap=True)),
 (14.6,18.2,dict(type="title",ep="EPISÓDIO 6 · QUEM DEIXOU O ENVELOPE",fi=.3,fo=.35)),
 (18.2,24.8,dict(type="bust",char="marcelo",bg=RN,expr="cold",cam="push_slow",fi=.3), [(18.41,24.58)]),
 (24.8,26.2,dict(type="bust",char="sandro",bg=RN,expr="shocked",cam="push_fast"), [(24.92,25.98)]),
 (26.2,32.6,dict(type="bust",char="marcelo",bg=RN,expr="cold",cam="push_fast"), [(26.29,32.42)]),
 (32.6,34.3,dict(type="bust",char="diego",bg=RN,expr="worried",cam="push",gaze=.7)),
 (34.3,35.9,dict(type="bust",char="rafael",bg=RN,expr="serious",cam="push",gaze=-.7)),
 (35.9,37.3,dict(type="bust",char="bruno",bg=RN,expr="worried",cam="push",gaze=.6)),
 (37.3,39.3,dict(type="bust",char="lucas",bg=RN,expr="serious",cam="push_slow",gaze=-.4)),
 (39.3,42.3,dict(type="bust",char="bruno",bg=PI,expr="smirk",cam="drift_l",fi=.3)),
 (42.3,44.0,dict(type="cash_counter")),
 (44.0,47.5,dict(type="bust",char="bruno",bg=PI,expr="smirk",cam="push"), [(44.15,47.29)]),
 (47.5,49.5,dict(type="bust",char="raimundinha",bg=PI,expr="angry",cam="push_fast"), [(47.62,49.31)]),
 (49.5,51.7,dict(type="bust",char="bruno",bg=PI,expr="cold",cam="push_fast"), [(49.59,51.40)]),
 (51.7,54.8,dict(type="bust",char="keliane",bg=HN,expr="worried",cam="push_slow",fi=.3)),
 (54.8,57.9,dict(type="bust",char="rafael",bg=HN,expr="smile",cam="drift_r",flowers=True)),
 (57.9,62.3,dict(type="bust",char="rafael",bg=HN,expr="soft",cam="push",flowers=True), [(58.16,62.09)]),
 (62.3,63.8,dict(type="bust",char="keliane",bg=HN,expr="sad",cam="push"), [(62.43,63.6)]),
 (63.8,65.2,dict(type="bust",char="keliane",bg=HN,expr="sad",cam="push_slow",gy=.7)),
 (65.2,74.3,dict(type="pier_meet",womanAt=3.4,fi=.4)),
 (74.3,77.2,dict(type="bust",char="rafael",bg=HD,expr="neutral",cam="push_slow",fi=.3)),
 (77.2,83.0,dict(type="photo_msg",photoAt=1.45)),
 (83.0,84.1,dict(type="bust",char="rafael",bg=HD,expr="shocked",cam="push_fast"), [(83.11,83.84)]),
 (84.1,87.6,dict(type="card",text="x",l1="Quem mandou",l2="essa foto?",fi=.25)),
 (87.6,91.8,dict(type="cta",likeAt=1.2,followAt=2.5)),
 (91.8,END,dict(type="continua",fo=.8)),
]
CAP=[]
SFXL=[("whoosh",5.2),("whoosh",10.2),("impact",14.6),("riser_out",14.8),("hit",22.7),("hit",31.7),("whoosh",32.6),("whoosh",34.3),("whoosh",35.9),("whoosh",37.3),
("flip",42.6),("hit",49.6),("step",68.9),("step",69.5),("step",70.1),("hit",73.4),("buzz",77.2),("buzz",77.8),("ping",78.65),("impact",83.0)]
MUSL=[("tension",0,14.6),("tension",18.2,39.3),("drone",39.3,51.7),("sad",51.7,65.2),("drone",65.2,74.3),("tension",74.3,87.6),("outro",87.6,END)]
AMBL=[("crickets",18.2,39.3),("night",65.2,74.3)]

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
json.dump(dict(fps=FPS,total=END,ep="EP. 6",beats=beats),open(f"{HERE}/schedule.json","w"),ensure_ascii=False)

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
