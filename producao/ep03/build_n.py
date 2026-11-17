"""Episódio 1 — versão narrada (ElevenLabs). Cenas e legendas presas ao tempo da narração."""
import os, json, re, numpy as np, soundfile as sf
from scipy import signal
HERE=os.path.dirname(os.path.abspath(__file__))
src=open(os.path.join(HERE,"..","ep1","build_audio.py")).read()
a=src.index("# ---------------------------------------------------------------- utilidades"); b=src.index("# ---------------------------------------------------------------- mixagem")
SR=48000; FPS=30; rng=np.random.default_rng(7)
exec(src[a:b])

narr,_=sf.read(f"{HERE}/narr.wav")
END=104.8
NI,HD,BAR,PO,MA,PI="night_street","house_dark","bar","port","marilene","pharmacy_in"
SH=[
 (0.0, 3.4, dict(type="night_establish",sub="Sexta-feira · 23:00",fi=.6)),
 (3.4, 7.4, dict(type="bust",char="diego",bg=HD,expr="worried",cam="push_slow",gaze=.6)),
 (7.4, 9.1, dict(type="door_knock",knocks=[.15,.45,.75])),
 (9.1,15.3, dict(type="bust",char="marcelo",bg=NI,expr="cold",cam="push_slow"), [(9.19,15.03)]),
 (15.3,19.0,dict(type="title",ep="EPISÓDIO 3 · A MULHER DE FORA",fi=.3,fo=.35)),
 (19.0,24.6,dict(type="boat_arrive",walkAt=3.5,fi=.4)),
 (24.6,28.1,dict(type="bust",char="jessica_sun",bg=PO,expr="neutral",cam="push")),
 (28.1,32.4,dict(type="street_day_walk")),
 (32.4,35.9,dict(type="facade",place="marilene",tag="Bar da Marilene",sub="Rua do Sossego")),
 (35.9,39.2,dict(type="bust",char="jessica_sun",bg=MA,expr="soft",cam="push"), [(35.98,38.97)]),
 (39.2,43.0,dict(type="bust",char="marilene",bg=MA,expr="suspicious",cam="push"), [(39.26,42.74)]),
 (43.0,45.4,dict(type="bust",char="jessica_sun",bg=MA,expr="smile",cam="push"), [(43.02,45.18)]),
 (45.4,49.0,dict(type="bust",char="marilene",bg=MA,expr="teasing",cam="push_slow")),
 (49.0,53.2,dict(type="gallery",fi=.3)),
 (53.2,57.2,dict(type="bust",char="keliane",bg=PI,expr="smile",cam="drift_l"), [(55.34,57.10)]),
 (57.2,59.6,dict(type="bust",char="raimundinha",bg=PI,expr="worried",cam="push_fast",gaze=-.5), [(57.32,59.39)]),
 (59.6,62.9,dict(type="bust",char="diego",bg=BAR,expr="sad",cam="push_slow",gy=.6,fi=.3)),
 (62.9,65.5,dict(type="bust",char="jessica",bg=BAR,expr="soft",cam="drift_r")),
 (65.5,69.0,dict(type="bust",char="jessica",bg=BAR,expr="soft",cam="push"), [(65.66,68.84)]),
 (69.0,70.2,dict(type="bust",char="diego",bg=BAR,expr="shocked",cam="push_fast"), [(69.11,70.02)]),
 (70.2,71.5,dict(type="bust",char="jessica",bg=BAR,expr="smile",cam="push"), [(70.29,71.26)]),
 (71.5,73.6,dict(type="bust",char="sandro",bg=BAR,expr="suspicious",cam="push_slow",gaze=-.6)),
 (73.6,77.1,dict(type="drawer",still=True)),
 (77.1,80.6,dict(type="doorway",openAt=0,who="lucas",stopAt=.45)),
 (80.6,85.5,dict(type="split_eyes",top="jessica",bottom="lucas",lookAt=.2,away=True)),
 (85.5,91.4,dict(type="secret_phone",msg="Oi, sumido.",msgTime="22:17",inAt=3.4,typeAt=99,sentAt=99.1,delAt=99.2)),
 (91.4,95.0,dict(type="bust",char="jessica",bg=BAR,expr="teasing",cam="push_fast")),
 (95.0,98.7,dict(type="card",text="Quem é Jéssica Karoline?",l1="Quem é",l2="Jéssica Karoline?",fi=.25)),
 (98.7,102.8,dict(type="cta",likeAt=1.2,followAt=2.5)),
 (102.8,END,dict(type="continua",fo=.8)),
]
CAP=[]
def sfx_knock():
    d=.3; x=tt(d); return (lp(noise(d),500)*np.exp(-x*35)*1.4+np.sin(2*np.pi*90*x)*np.exp(-x*30))*.8
def sfx_horn():
    d=2.2; x=tt(d); f=110
    s=(signal.sawtooth(2*np.pi*f*x)+.6*signal.sawtooth(2*np.pi*f*1.5*x))*env(len(x),.15,.6)
    return reverb(lp(s,900),.5)*.25
SFX["knock"]=sfx_knock; SFX["horn"]=sfx_horn
SFXL=[("knock",7.55),("knock",7.85),("knock",8.15),("impact",15.3),("riser_out",15.5),("horn",19.3),("step",29.0),("step",29.6),("step",30.2),("step",30.8),
("whoosh",77.1),("whoosh",80.7),("hit",82.0),("buzz_muffled",86.4),("buzz_muffled",87.0),("ping",88.9),("impact",94.9)]
MUSL=[("tension",0,15.3),("outro",19.0,32.4),("bar",32.4,49.0),("sad",49.0,59.6),("bar",59.6,77.1),("tension",77.1,95.0),("outro",98.7,END)]
AMBL=[("crickets",0,15.3),("bar",32.4,49.0),("bar",59.6,77.1),("bar_quiet",77.1,95.0)]

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
json.dump(dict(fps=FPS,total=END,ep="EP. 3",beats=beats),open(f"{HERE}/schedule.json","w"),ensure_ascii=False)

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
