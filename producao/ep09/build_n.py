"""Episódio 1 — versão narrada (ElevenLabs). Cenas e legendas presas ao tempo da narração."""
import os, json, re, numpy as np, soundfile as sf
from scipy import signal
HERE=os.path.dirname(os.path.abspath(__file__))
src=open(os.path.join(HERE,"..","ep1","build_audio.py")).read()
a=src.index("# ---------------------------------------------------------------- utilidades"); b=src.index("# ---------------------------------------------------------------- mixagem")
SR=48000; FPS=30; rng=np.random.default_rng(7)
exec(src[a:b])

narr,_=sf.read(f"{HERE}/narr.wav")
END=81.5
BAR="bar"
SH=[
 (0.0, 5.9, dict(type="flashback",giveAt=.5,backpack=True,recap=True,fi=.4)),
 (5.9, 9.3, dict(type="alley_two",recap=True)),
 (9.3,12.0, dict(type="bust",char="lucas_nb",bg=BAR,expr="smirk",cam="push",recap=True)),
 (12.0,15.6,dict(type="title",ep="EPISÓDIO 9 · O NÚMERO",fi=.3,fo=.35)),
 (15.6,20.2,dict(type="bar_establish",fi=.3)),
 (20.2,22.5,dict(type="bust",char="sandro",bg=BAR,expr="serious",cam="push_fast"), [(20.32,22.30)]),
 (22.5,23.3,dict(type="bust",char="rafael",bg=BAR,expr="serious",cam="drift_r")),
 (23.3,24.0,dict(type="bust",char="diego",bg=BAR,expr="serious",cam="drift_l")),
 (24.0,24.6,dict(type="bust",char="bruno",bg=BAR,expr="cold",cam="drift_r")),
 (24.6,25.6,dict(type="bust",char="raimundinha",bg=BAR,expr="serious",cam="drift_l")),
 (25.6,26.6,dict(type="bust",char="marilene",bg=BAR,expr="suspicious",cam="drift_r")),
 (26.6,29.6,dict(type="bust",char="lucas",bg=BAR,expr="soft",cam="push_slow")),
 (29.6,31.6,dict(type="doorway",openAt=.1,who="jessica",stopAt=.5)),
 (31.6,36.0,dict(type="bust",char="jessica",bg=BAR,expr="serious",cam="push"), [(31.76,35.84)]),
 (36.0,37.4,dict(type="receipt",all=True,night=True)),
 (37.4,41.9,dict(type="call",bgn=BAR,endAt=99,speaker=True)),
 (41.9,45.3,dict(type="ring_backpack")),
 (45.3,47.2,dict(type="bust",char="lucas",bg=BAR,expr="worried",cam="push_fast")),
 (47.2,49.1,dict(type="bust",char="lucas",bg=BAR,expr="forced",cam="push"), [(47.28,48.90)]),
 (49.1,51.8,dict(type="bust",char="jessica",bg=BAR,expr="cold",cam="push_fast"), [(49.26,51.62)]),
 (51.8,53.6,dict(type="bust",char="rafael",bg=BAR,expr="serious",cam="push_slow")),
 (53.6,56.7,dict(type="bust",char="rafael",bg=BAR,expr="sad",cam="push"), [(53.74,56.48)]),
 (56.7,58.1,dict(type="bust",char="lucas",bg=BAR,expr="worried",cam="push_slow",gy=.6)),
 (58.1,59.8,dict(type="ring_backpack")),
 (59.8,63.0,dict(type="bust",char="diego",bg=BAR,expr="angry",cam="push_fast"), [(59.92,62.77)]),
 (63.0,66.7,dict(type="doorway",openAt=.1)),
 (66.7,70.4,dict(type="bust",char="marcelo",bg=BAR,expr="cold",cam="push_slow"), [(66.90,70.20)]),
 (70.4,73.7,dict(type="card",text="x",l1="Onde está",l2="o dinheiro?",fi=.25)),
 (73.7,76.0,dict(type="next_ep")),
 (76.0,79.5,dict(type="cta",likeAt=.8,followAt=2.0)),
 (79.5,END,dict(type="continua",fo=.8)),
]
CAP=[]
def sfx_ring():
    d=1.0; x=tt(d); return np.sin(2*np.pi*425*x)*env(len(x),.01,.05)*.18
def sfx_ringtone():
    out=np.zeros(int(1.6*SR))
    for k,f in enumerate([988,1319,988,1319,1568,1319]):
        x=tt(.18); place(out,(np.sin(2*np.pi*f*x)+.3*np.sin(2*np.pi*2*f*x))*env(len(x),.005,.05)*.16,k*.22)
    return lp(out,2500)
SFX.update(ring=sfx_ring,ringtone=sfx_ringtone)
SFXL=[("whoosh",5.8),("whoosh",9.2),("impact",12.0),("riser_out",12.2),("hit",22.4),("creak",29.7),("step",30.6),("type",39.2),("type",39.4),("type",39.6),
("ring",40.9),("impact",41.9)]+[("ringtone",41.9+i*1.6) for i in range(11)]+[("creak",63.1),("step",64.2),("step",64.8),("impact",66.6),("hit",70.3),("impact",73.7)]
MUSL=[("tension",0,12.0),("bar",15.6,20.2),("tension",20.2,41.9),("drone",41.9,63.0),("tension",63.0,73.7),("outro",76.0,END)]
AMBL=[("bar_quiet",15.6,70.4)]

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
json.dump(dict(fps=FPS,total=END,ep="EP. 9",beats=beats),open(f"{HERE}/schedule.json","w"),ensure_ascii=False)

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
