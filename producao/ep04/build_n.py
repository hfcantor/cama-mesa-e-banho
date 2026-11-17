"""Episódio 1 — versão narrada (ElevenLabs). Cenas e legendas presas ao tempo da narração."""
import os, json, re, numpy as np, soundfile as sf
from scipy import signal
HERE=os.path.dirname(os.path.abspath(__file__))
src=open(os.path.join(HERE,"..","ep1","build_audio.py")).read()
a=src.index("# ---------------------------------------------------------------- utilidades"); b=src.index("# ---------------------------------------------------------------- mixagem")
SR=48000; FPS=30; rng=np.random.default_rng(7)
exec(src[a:b])

narr,_=sf.read(f"{HERE}/narr.wav")
END=106.0
NI,BAR,BD,PO,PI,RI="night_street","bar","bar_day","port","pharmacy_in","river"
SH=[
 (0.0, 3.7, dict(type="bust",char="diego",bg=BAR,expr="worried",cam="push",recap=True,fi=.4)),
 (3.7, 5.4, dict(type="bust",char="marcelo",bg=BAR,expr="cold",cam="push_fast",recap=True)),
 (5.4, 9.6, dict(type="gallery",recap=True)),
 (9.6,12.0, dict(type="secret_phone",msg="Oi, sumido.",msgTime="22:17",inAt=0,typeAt=99,sentAt=99.1,delAt=99.2,recap=True)),
 (12.0,16.9,dict(type="bust",char="jessica_sun",bg=PO,expr="neutral",cam="push",recap=True)),
 (16.9,20.4,dict(type="title",ep="EPISÓDIO 4 · O RECIBO",fi=.3,fo=.35)),
 (20.4,24.9,dict(type="bust",char="sandro",bg=BD,expr="suspicious",cam="push_slow",gaze=-.4,fi=.3)),
 (24.9,27.3,dict(type="drawer",still=True)),
 (27.3,35.9,dict(type="receipt",rev=[.7,1.6,3.4,5.6,7.1])),
 (35.9,39.4,dict(type="bust",char="sandro",bg=BD,expr="shocked",cam="push"), [(35.92,39.24)]),
 (39.4,43.7,dict(type="call",endAt=3.15)),
 (43.7,46.4,dict(type="bust",char="raimundinha",bg=PI,expr="serious",cam="push_slow",fi=.3)),
 (46.4,48.2,dict(type="gallery")),
 (48.2,49.7,dict(type="bust",char="raimundinha",bg=PI,expr="angry",cam="push_fast"), [(48.33,49.54)]),
 (49.7,55.4,dict(type="bust",char="keliane",bg=PI,expr="sad",cam="push"), [(49.83,55.25)]),
 (55.4,59.4,dict(type="bust",char="raimundinha",bg=PI,expr="firm",cam="push_slow"), [(55.5,59.09)]),
 (59.4,63.7,dict(type="river_two",fi=.4)),
 (63.7,65.3,dict(type="bust",char="jessica",bg=RI,expr="soft",cam="push"), [(63.85,65.12)]),
 (65.3,67.1,dict(type="bust",char="diego",bg=RI,expr="shocked",cam="push"), [(65.44,66.97)]),
 (67.1,74.7,dict(type="bust",char="jessica",bg=RI,expr="serious",cam="push_slow"), [(67.28,74.55)]),
 (74.7,76.3,dict(type="bust",char="diego",bg=RI,expr="shocked",cam="push_fast"), [(74.87,75.99)]),
 (76.3,78.6,dict(type="bar_establish",fi=.3)),
 (78.6,79.8,dict(type="bust",char="rafael",bg=BAR,expr="serious",cam="drift_r")),
 (79.8,80.5,dict(type="bust",char="bruno",bg=BAR,expr="smile",cam="drift_l")),
 (80.5,81.0,dict(type="bust",char="lucas",bg=BAR,expr="soft",cam="push")),
 (81.0,86.2,dict(type="bust",char="diego",bg=BAR,expr="suspicious",cam="push_slow",gaze=-.6)),
 (86.2,90.6,dict(type="receipt",all=True,night=True,zoomName=True)),
 (90.6,93.2,dict(type="doorway",openAt=.1,who="jessica",stopAt=.5)),
 (93.2,95.9,dict(type="bust",char="sandro",bg=BAR,expr="shocked",cam="push_fast"), [(93.33,95.76)]),
 (95.9,99.8,dict(type="bust",char="jessica",bg=BAR,expr="teasing",cam="push_fast")),
 (99.8,104.0,dict(type="cta",likeAt=1.2,followAt=2.5)),
 (104.0,END,dict(type="continua",fo=.8)),
]
CAP=[]
def sfx_tear():
    d=.6; x=tt(d); return bp(noise(d),1500,7000)*(0.5+0.5*np.abs(np.sin(2*np.pi*40*x)))*env(len(x),.02,.2)*.35
def sfx_ring():
    d=1.0; x=tt(d); return np.sin(2*np.pi*425*x)*env(len(x),.01,.05)*.18
def sfx_hangup():
    out=np.zeros(int(1.0*SR))
    for k in range(3):
        x=tt(.15); place(out,np.sin(2*np.pi*480*x)*env(len(x),.005,.02)*.2,k*.3)
    return out
def sfx_knock():
    d=.3; x=tt(d); return (lp(noise(d),500)*np.exp(-x*35)*1.4+np.sin(2*np.pi*90*x)*np.exp(-x*30))*.8
SFX.update(tear=sfx_tear,ring=sfx_ring,hangup=sfx_hangup,knock=sfx_knock)
SFXL=[("whoosh",3.6),("whoosh",5.3),("whoosh",9.5),("whoosh",11.9),("impact",16.9),("riser_out",17.1),("flip",25.5),("tear",26.2),("hit",31.0),("hit",33.1),
("ring",40.5),("ring",41.6),("hangup",42.55),("whoosh",46.3),("hit",58.5),("whoosh",86.1),("hit",88.9),("creak",90.7),("step",91.8),("step",92.4),("impact",99.6)]
MUSL=[("tension",0,16.9),("tension",20.4,43.7),("sad",43.7,59.4),("drone",59.4,76.3),("bar",76.3,90.6),("tension",90.6,99.8),("outro",99.8,END)]
AMBL=[("bar_quiet",20.4,43.7),("crickets",59.4,76.3),("bar",76.3,99.8)]

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
json.dump(dict(fps=FPS,total=END,ep="EP. 4",beats=beats),open(f"{HERE}/schedule.json","w"),ensure_ascii=False)

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
