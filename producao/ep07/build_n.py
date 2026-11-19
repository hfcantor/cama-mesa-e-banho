"""Episódio 1 — versão narrada (ElevenLabs). Cenas e legendas presas ao tempo da narração."""
import os, json, re, numpy as np, soundfile as sf
from scipy import signal
HERE=os.path.dirname(os.path.abspath(__file__))
src=open(os.path.join(HERE,"..","ep1","build_audio.py")).read()
a=src.index("# ---------------------------------------------------------------- utilidades"); b=src.index("# ---------------------------------------------------------------- mixagem")
SR=48000; FPS=30; rng=np.random.default_rng(7)
exec(src[a:b])

narr,_=sf.read(f"{HERE}/narr.wav")
END=97.5
RN,HO,BD,GA,NI,RI,BAR="rental_night","house","bar_day","garage","night_street","river","bar"
SH=[
 (0.0, 5.8, dict(type="bust",char="marcelo",bg=RN,expr="cold",cam="push",recap=True,fi=.4)),
 (5.8,10.3, dict(type="cash_counter",recap=True)),
 (10.3,12.9,dict(type="photo_msg",photoAt=0,recap=True)),
 (12.9,16.2,dict(type="title",ep="EPISÓDIO 7 · TRAIÇÃO",fi=.3,fo=.35)),
 (16.2,20.1,dict(type="bust",char="rafael",expr="serious",bg=HO,cam="push_slow",fi=.3)),
 (20.1,21.6,dict(type="bust",char="rafael",expr="cold",bg=HO,cam="push_fast"), [(20.16,21.42)]),
 (21.6,24.8,dict(type="bust",char="keliane",expr="sad",bg=HO,cam="push"), [(21.74,24.58)]),
 (24.8,27.3,dict(type="bust",char="rafael",expr="sad",bg=HO,cam="push_fast"), [(24.85,27.17)]),
 (27.3,30.2,dict(type="bust",char="keliane",expr="sad",bg=HO,cam="push_slow")),
 (30.2,32.5,dict(type="facade",place="bar_day",tag="Bar do Sandro",sub="Rua da Felicidade")),
 (32.5,33.7,dict(type="bust",char="bruno",expr="smirk",bg=BD,cam="drift_l")),
 (33.7,35.4,dict(type="bust",char="rafael",expr="angry",bg=BD,cam="push_fast"), [(33.80,35.24)]),
 (35.4,38.5,dict(type="bust",char="bruno",expr="cold",bg=BD,cam="push"), [(35.58,38.30)]),
 (38.5,41.9,dict(type="bust",char="sandro",expr="angry",bg=BD,cam="push_fast"), [(38.62,41.67)]),
 (41.9,44.0,dict(type="bust",char="diego",expr="serious",bg=BD,cam="drift_r")),
 (44.0,46.6,dict(type="bust",char="rafael",expr="sad",bg=BD,cam="drift_l")),
 (46.6,49.3,dict(type="bust",char="lucas",expr="soft",bg=BD,cam="drift_r")),
 (49.3,51.9,dict(type="bust",char="lucas",expr="smirk",bg=BD,cam="push_slow")),
 (51.9,54.3,dict(type="bust",char="raimundinha",expr="serious",bg=GA,cam="drift_l",fi=.3)),
 (54.3,58.9,dict(type="bust",char="raimundinha",expr="soft",bg=GA,cam="push"), [(54.46,58.78)]),
 (58.9,60.1,dict(type="bust",char="rafael",expr="worried",bg=GA,cam="push_fast"), [(59.10,59.80)]),
 (60.1,64.9,dict(type="phone_notif",bgn=NI,sender="Jéssica",n1="Me encontra no porto.",n2="Agora.",clock="21:30",day="Quarta-feira",onAt=.05,notifAt=1.4,buzz=[0.0,.7],fi=.3)),
 (64.9,69.2,dict(type="bust",char="jessica",expr="serious",bg=RI,cam="push_slow"), [(65.20,69.02)]),
 (69.2,70.4,dict(type="bust",char="diego",expr="angry",bg=RI,cam="push_fast"), [(69.31,70.27)]),
 (70.4,75.5,dict(type="bust",char="jessica",expr="firm",bg=RI,cam="push"), [(70.55,75.34)]),
 (75.5,76.7,dict(type="bust",char="diego",expr="shocked",bg=RI,cam="push_fast"), [(75.66,76.56)]),
 (76.7,82.1,dict(type="bust",char="jessica",expr="teasing",bg=RI,cam="push_fast"), [(76.91,81.90)]),
 (82.1,88.1,dict(type="phone_notif",bgn=RI,sender="Creisson",n1="Onde tu tá, mano?",n2="Tô preocupado contigo.",clock="21:58",day="Quarta-feira",onAt=.05,notifAt=2.5,buzz=[0.0,.7])),
 (88.1,91.6,dict(type="card",text="x",l1="Quem é o sócio",l2="da Jéssica?",fi=.25)),
 (91.6,95.5,dict(type="cta",likeAt=1.2,followAt=2.5)),
 (95.5,END,dict(type="continua",fo=.8)),
]
CAP=[]
def sfx_knock():
    d=.3; x=tt(d); return (lp(noise(d),500)*np.exp(-x*35)*1.4+np.sin(2*np.pi*90*x)*np.exp(-x*30))*.8
SFX.update(knock=sfx_knock)
SFXL=[("whoosh",5.7),("whoosh",10.2),("impact",12.9),("riser_out",13.1),("knock",16.8),("knock",17.1),("knock",17.4),("hit",26.9),("whoosh",32.5),
("hit",35.3),("impact",38.5),("door_slam",41.8),("whoosh",46.6),("whoosh",49.3),("hit",58.8),("buzz",60.1),("buzz",60.8),("hit",68.9),("hit",81.9),
("buzz",82.1),("buzz",82.8),("ping",84.6),("impact",88.0)]
MUSL=[("tension",0,12.9),("sad",16.2,30.2),("tension",30.2,41.9),("sad",41.9,60.1),("drone",60.1,88.1),("outro",91.6,END)]
AMBL=[("bar_quiet",30.2,41.9),("crickets",60.1,88.1)]

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
json.dump(dict(fps=FPS,total=END,ep="EP. 7",beats=beats),open(f"{HERE}/schedule.json","w"),ensure_ascii=False)

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
