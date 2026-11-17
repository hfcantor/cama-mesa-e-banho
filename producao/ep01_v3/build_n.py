"""Episódio 1 — versão narrada (ElevenLabs). Cenas e legendas presas ao tempo da narração."""
import os, json, re, numpy as np, soundfile as sf
from scipy import signal
HERE=os.path.dirname(os.path.abspath(__file__))
src=open(os.path.join(HERE,"..","ep1","build_audio.py")).read()
a=src.index("# ---------------------------------------------------------------- utilidades"); b=src.index("# ---------------------------------------------------------------- mixagem")
SR=48000; FPS=30; rng=np.random.default_rng(7)
exec(src[a:b])

narr,_=sf.read(f"{HERE}/narr.wav")
END=117.4
NIGHT,BAR,EXT="night_street","bar","bar_ext"
SH=[
 (0.0, 2.3, dict(type="night_establish")),
 (2.3, 9.1, dict(type="phone_notif",owner="diego",bg=NIGHT,onAt=.05,notifAt=1.9,buzz=[0.0,.8])),
 (9.1,13.6, dict(type="bust",char="diego",bg=NIGHT,expr="worried",cam="push"), [(10.07,13.24)]),
 (13.6,17.3,dict(type="title")),
 (17.3,19.0,dict(type="bar_establish")),
 (19.0,20.4,dict(type="bust",char="rafael",bg=BAR,expr="neutral",cam="drift_r")),
 (20.4,21.2,dict(type="bust",char="bruno",bg=BAR,expr="smile",cam="drift_l")),
 (21.2,24.6,dict(type="bust",char="lucas",bg=BAR,expr="soft",cam="push")),
 (24.6,29.3,dict(type="bust",char="sandro",bg=BAR,expr="smile",cam="push"), [(25.34,29.09)]),
 (29.3,36.1,dict(type="table_phone",buzz=[.15,.85],flipAt=4.7)),
 (36.1,41.8,dict(type="bust",char="bruno",bg=BAR,expr="smile",cam="push"), [(37.02,41.56)]),
 (41.8,48.3,dict(type="chat",readAt=4.17)),
 (48.3,52.5,dict(type="bust",char="diego",bg=BAR,expr="forced",cam="push")),
 (52.5,56.7,dict(type="doorway",openAt=1.1)),
 (56.7,59.2,dict(type="bust",char="marcelo",bg=BAR,expr="cold",cam="push_slow"), [(57.94,59.05)]),
 (59.2,61.2,dict(type="bust",char="diego",bg=BAR,expr="worried",cam="push"), [(59.38,61.10)]),
 (61.2,65.6,dict(type="bust",char="marcelo",bg=BAR,expr="cold",cam="push_fast"), [(61.35,65.33)]),
 (65.6,70.1,dict(type="split_eyes",top="marcelo",bottom="lucas",lookAt=1.6)),
 (70.1,73.0,dict(type="bust",char="diego",bg=BAR,expr="forced",cam="push"), [(70.26,72.78)]),
 (73.0,78.5,dict(type="bust",char="rafael",bg=BAR,expr="serious",cam="push_slow",gaze=-.5)),
 (78.5,81.3,dict(type="bust",char="rafael",bg=EXT,expr="sad",cam="drift_l")),
 (81.3,85.7,dict(type="bust",char="rafael",bg=EXT,expr="sad",cam="push"), [(81.42,85.54)]),
 (85.7,90.3,dict(type="bust",char="lucas",bg=EXT,expr="soft",cam="push"), [(85.9,89.96)]),
 (90.3,96.8,dict(type="street_walk",buzzAt=1.5)),
 (96.8,102.4,dict(type="secret_phone",inAt=.15,typeAt=2.2,sentAt=2.8,delAt=4.55)),
 (102.4,106.4,dict(type="calc",typeAt=1.4,step=.3)),
 (106.4,108.8,dict(type="bust",char="diego",bg=NIGHT,expr="worried",cam="pull"), [(107.08,108.52)]),
 (108.8,111.4,dict(type="card",text="Por que o Creisson tem dois celulares?")),
 (111.4,115.4,dict(type="cta",likeAt=1.2,followAt=2.5)),
 (115.4,END,dict(type="continua")),
]
CAP=[]
SFXL=[("buzz",2.3),("buzz",3.1),("impact",13.6),("riser_out",13.8),("buzz",29.45),("buzz",30.15),("flip",34.0),("tick",45.97),
("creak",53.6),("step",54.7),("step",55.3),("step",55.9),("chair",56.9),("whoosh",65.7),("hit",66.9),("door_slam",69.9),
("moto",87.5),("buzz_muffled",91.8),("buzz_muffled",92.4),("ping",96.95),("type",98.95),("type",99.1),("type",99.25),("type",99.4),
("delete",101.35),("type",103.8),("type",104.1),("type",104.4),("type",104.7),("type",105.0),("impact",108.7)]
MUSL=[("drone",0,13.6),("bar",17.3,52.5),("tension",52.5,78.5),("sad",78.5,90.3),("drone",90.3,108.8),("outro",111.4,END)]
AMBL=[("crickets",0,13.6),("bar",17.3,52.5),("bar_quiet",52.5,78.5),("night",78.5,90.3),("crickets",90.3,108.8)]

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
