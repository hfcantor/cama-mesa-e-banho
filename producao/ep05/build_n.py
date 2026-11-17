"""Episódio 1 — versão narrada (ElevenLabs). Cenas e legendas presas ao tempo da narração."""
import os, json, re, numpy as np, soundfile as sf
from scipy import signal
HERE=os.path.dirname(os.path.abspath(__file__))
src=open(os.path.join(HERE,"..","ep1","build_audio.py")).read()
a=src.index("# ---------------------------------------------------------------- utilidades"); b=src.index("# ---------------------------------------------------------------- mixagem")
SR=48000; FPS=30; rng=np.random.default_rng(7)
exec(src[a:b])

narr,_=sf.read(f"{HERE}/narr.wav")
END=107.1
GP,MA,PO,RN,BAR="garage_paga","marilene","port","rental_night","bar"
SH=[
 (0.0, 6.9, dict(type="flashback",giveAt=1.5,recap=True,fi=.4)),
 (6.9,10.4, dict(type="receipt",all=True,night=True,recap=True)),
 (10.4,14.6,dict(type="river_two",recap=True)),
 (14.6,18.0,dict(type="title",ep="EPISÓDIO 5 · SEGUNDA-FEIRA",fi=.3,fo=.35)),
 (18.0,22.3,dict(type="bust",char="rafael",bg="garage",expr="neutral",cam="push",fi=.3)),
 (22.3,26.4,dict(type="graffiti",revealAt=2.9)),
 (26.4,31.5,dict(type="phone_notif",bgn="garage",sender="Tibúrcio",n1="Esse foi só o",n2="primeiro aviso.",clock="07:12",day="Segunda-feira",onAt=.05,notifAt=1.8,buzz=[0.0,.7])),
 (31.5,32.9,dict(type="bust",char="bruno",bg=GP,expr="serious",cam="drift_l")),
 (32.9,34.5,dict(type="bust",char="lucas",bg=GP,expr="neutral",cam="drift_r")),
 (34.5,37.3,dict(type="bust",char="rafael",bg=GP,expr="serious",cam="push")),
 (37.3,42.1,dict(type="bust",char="diego",bg=GP,expr="sad",cam="push_slow"), [(37.42,41.86)]),
 (42.1,44.7,dict(type="bust",char="bruno",bg=GP,expr="angry",cam="push_fast"), [(42.23,44.47)]),
 (44.7,47.2,dict(type="bust",char="lucas",bg=GP,expr="soft",cam="push"), [(44.78,47.0)]),
 (47.2,49.8,dict(type="bust",char="sandro",bg=GP,expr="serious",cam="drift_l")),
 (49.8,55.2,dict(type="bust",char="sandro",bg=GP,expr="suspicious",cam="push"), [(49.93,55.02)]),
 (55.2,60.3,dict(type="bust",char="lucas",bg=GP,expr="firm",cam="push_fast"), [(55.36,60.05)]),
 (60.3,61.7,dict(type="bust",char="diego",bg=GP,expr="serious",cam="push")),
 (61.7,63.0,dict(type="bust",char="rafael",bg=GP,expr="suspicious",cam="push_fast",gy=.7)),
 (63.0,65.0,dict(type="receipt",all=True,bgn=GP)),
 (65.0,67.0,dict(type="facade",place="marilene",tag="Bar da Marilene",sub="Rua do Sossego")),
 (67.0,74.3,dict(type="bust",char="jessica",bg=MA,expr="serious",cam="push_slow",phoneEar=True,gaze=-.5), [(70.66,74.08)]),
 (74.3,77.0,dict(type="bust",char="marilene",bg=MA,expr="suspicious",cam="push_fast",gaze=.7)),
 (77.0,83.4,dict(type="bust",char="keliane",bg=PO,expr="worried",cam="push",fi=.3), [(80.26,83.25)]),
 (83.4,85.5,dict(type="bust",char="bruno",bg=PO,expr="cold",cam="push_fast"), [(83.55,85.27)]),
 (85.5,94.9,dict(type="group_door",knockAt=3.9,openAt=5.6,tibAt=7.3,fi=.4)),
 (94.9,98.2,dict(type="bust",char="marcelo",bg=RN,expr="cold",cam="push_slow"), [(94.97,97.92)]),
 (98.2,101.3,dict(type="card",text="x",l1="O que o Tibúrcio",l2="faz na casa da Jéssica?",fi=.25)),
 (101.3,105.1,dict(type="cta",likeAt=1.2,followAt=2.5)),
 (105.1,END,dict(type="continua",fo=.8)),
]
CAP=[]
def sfx_spray():
    d=1.0; x=tt(d); return hp(noise(d),3000)*env(len(x),.05,.2)*.18
def sfx_knock():
    d=.3; x=tt(d); return (lp(noise(d),500)*np.exp(-x*35)*1.4+np.sin(2*np.pi*90*x)*np.exp(-x*30))*.8
SFX.update(spray=sfx_spray,knock=sfx_knock)
SFXL=[("whoosh",6.8),("whoosh",10.3),("impact",14.6),("riser_out",14.8),("step",19.0),("step",19.6),("hit",22.2),("spray",25.2),("impact",25.7),
("buzz",26.4),("buzz",27.1),("whoosh",47.2),("hit",55.4),("whoosh",65.0),("hit",74.4),("step",86.0),("step",86.6),("step",87.2),("step",87.8),
("knock",89.4),("knock",89.7),("knock",90.0),("creak",91.1),("impact",93.0),("hit",98.2)]
MUSL=[("tension",0,14.6),("tension",18.0,31.5),("drone",31.5,65.0),("bar",65.0,77.0),("sad",77.0,85.5),("tension",85.5,101.3),("outro",101.3,END)]
AMBL=[("bar",65.0,77.0),("crickets",85.5,101.3)]

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
json.dump(dict(fps=FPS,total=END,ep="EP. 5",beats=beats),open(f"{HERE}/schedule.json","w"),ensure_ascii=False)

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
