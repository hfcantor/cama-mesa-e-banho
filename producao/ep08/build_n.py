"""Episódio 1 — versão narrada (ElevenLabs). Cenas e legendas presas ao tempo da narração."""
import os, json, re, numpy as np, soundfile as sf
from scipy import signal
HERE=os.path.dirname(os.path.abspath(__file__))
src=open(os.path.join(HERE,"..","ep1","build_audio.py")).read()
a=src.index("# ---------------------------------------------------------------- utilidades"); b=src.index("# ---------------------------------------------------------------- mixagem")
SR=48000; FPS=30; rng=np.random.default_rng(7)
exec(src[a:b])

narr,_=sf.read(f"{HERE}/narr.wav")
END=95.9
HO,GA,RI,RN,MA,HN,NI,BAR="house","garage","river","rental_night","marilene","house_night","night_street","bar"
SH=[
 (0.0, 4.1, dict(type="bust",char="rafael",bg=HO,expr="angry",cam="push",recap=True,fi=.4)),
 (4.1, 7.8, dict(type="bust",char="raimundinha",bg=GA,expr="soft",cam="push",recap=True)),
 (7.8,15.9, dict(type="bust",char="jessica",bg=RI,expr="serious",cam="push_slow",recap=True)),
 (15.9,19.2,dict(type="title",ep="EPISÓDIO 8 · A MOCHILA",fi=.3,fo=.35)),
 (19.2,22.4,dict(type="bust",char="marcelo",bg=RN,expr="cold",cam="push_slow",fi=.3)),
 (22.4,28.5,dict(type="bust",char="diego",bg=GA,expr="serious",cam="push"), [(24.27,28.32)]),
 (28.5,32.3,dict(type="bust",char="rafael",bg=GA,expr="serious",cam="push_slow",gy=.5)),
 (32.3,34.7,dict(type="bust",char="rafael",bg=GA,expr="serious",cam="push"), [(32.46,34.56)]),
 (34.7,40.0,dict(type="flashback",giveAt=.8,backpack=True,fi=.25,fo=.25)),
 (40.0,41.4,dict(type="bust",char="diego",bg=GA,expr="shocked",cam="push_fast"), [(40.11,41.09)]),
 (41.4,44.6,dict(type="facade",place="marilene",tag="Bar da Marilene",sub="Rua do Sossego")),
 (44.6,49.5,dict(type="bust",char="marilene",bg=MA,expr="serious",cam="push"), [(44.77,49.35)]),
 (49.5,55.5,dict(type="alley_two",fi=.3,fo=.3)),
 (55.5,58.1,dict(type="bust",char="keliane",bg=HN,expr="sad",cam="push_slow",fi=.3)),
 (58.1,62.0,dict(type="bust",char="keliane",bg=HN,expr="sad",cam="push"), [(58.22,61.75)]),
 (62.0,64.0,dict(type="bust",char="bruno",bg=NI,expr="cold",cam="push_fast"), [(62.06,63.65)]),
 (64.0,65.0,dict(type="bust",char="keliane",bg=HN,expr="sad",cam="push_slow",gy=.7)),
 (65.0,69.1,dict(type="bar_establish",fi=.3)),
 (69.1,69.9,dict(type="bust",char="rafael",bg=BAR,expr="serious",cam="drift_r")),
 (69.9,70.5,dict(type="bust",char="diego",bg=BAR,expr="serious",cam="drift_l")),
 (70.5,71.2,dict(type="bust",char="bruno",bg=BAR,expr="cold",cam="drift_r")),
 (71.2,74.0,dict(type="bust",char="lucas_nb",bg=BAR,expr="soft",cam="push")),
 (74.0,75.4,dict(type="bust",char="rafael",bg=BAR,expr="suspicious",cam="push_fast"), [(74.02,75.19)]),
 (75.4,77.2,dict(type="bust",char="lucas_nb",bg=BAR,expr="soft",cam="push"), [(75.50,77.04)]),
 (77.2,79.0,dict(type="bust",char="rafael",bg=BAR,expr="cold",cam="push_fast"), [(77.35,78.79)]),
 (79.0,80.9,dict(type="split_eyes",top="rafael",bottom="lucas_nb",lookAt=.2)),
 (80.9,85.1,dict(type="bust",char="lucas_nb",bg=BAR,expr="smirk",cam="push_fast")),
 (85.1,90.0,dict(type="card",text="x",l1="Amanhã é sábado.",l2="O dia do prazo.",fi=.25)),
 (90.0,93.9,dict(type="cta",likeAt=1.2,followAt=2.5)),
 (93.9,END,dict(type="continua",fo=.8)),
]
CAP=[]
SFXL=[("whoosh",4.0),("whoosh",7.7),("impact",15.9),("riser_out",16.1),("whoosh",34.6),("hit",38.5),("impact",40.0),("whoosh",49.4),("hit",54.3),
("hangup",64.0),("hit",72.9),("hit",78.8),("whoosh",79.0),("impact",85.0)]
MUSL=[("tension",0,15.9),("tension",19.2,34.7),("drone",34.7,41.4),("bar",41.4,49.5),("drone",49.5,55.5),("sad",55.5,65.0),("bar",65.0,74.0),("tension",74.0,90.0),("outro",90.0,END)]
AMBL=[("bar",41.4,49.5),("bar",65.0,74.0),("bar_quiet",74.0,85.1)]
def sfx_hangup():
    out=np.zeros(int(1.0*SR))
    for k in range(3):
        x=tt(.15); place(out,np.sin(2*np.pi*480*x)*env(len(x),.005,.02)*.2,k*.3)
    return out
SFX.update(hangup=sfx_hangup)

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
json.dump(dict(fps=FPS,total=END,ep="EP. 8",beats=beats),open(f"{HERE}/schedule.json","w"),ensure_ascii=False)

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
