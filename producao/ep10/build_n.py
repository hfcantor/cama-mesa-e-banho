"""Episódio 1 — versão narrada (ElevenLabs). Cenas e legendas presas ao tempo da narração."""
import os, json, re, numpy as np, soundfile as sf
from scipy import signal
HERE=os.path.dirname(os.path.abspath(__file__))
src=open(os.path.join(HERE,"..","ep1","build_audio.py")).read()
a=src.index("# ---------------------------------------------------------------- utilidades"); b=src.index("# ---------------------------------------------------------------- mixagem")
SR=48000; FPS=30; rng=np.random.default_rng(7)
exec(src[a:b])

narr,_=sf.read(f"{HERE}/narr.wav")
END=96.0
BAR,BD,GA,PO="bar","bar_day","garage","port"
SH=[
 (0.0, 4.4, dict(type="ring_backpack",recap=True,fi=.4)),
 (4.4, 6.5, dict(type="bust",char="lucas",bg=BAR,expr="worried",cam="push_fast",recap=True)),
 (6.5, 9.0, dict(type="doorway",openAt=0,recap=True)),
 (9.0,12.2, dict(type="title",ep="EPISÓDIO 10 · GRANDE FINAL",fi=.3,fo=.35)),
 (12.2,14.3,dict(type="bust",char="marcelo",bg=BAR,expr="cold",cam="push_fast"), [(12.40,14.06)]),
 (14.3,16.3,dict(type="ring_backpack")),
 (16.3,19.0,dict(type="bust",char="lucas",bg=BAR,expr="worried",cam="push_slow",gy=.5)),
 (19.0,25.8,dict(type="bust",char="lucas",bg=BAR,expr="cold",cam="push"), [(19.03,25.62)]),
 (25.8,28.0,dict(type="bust",char="rafael",bg=BAR,expr="sad",cam="push_fast"), [(25.99,27.80)]),
 (28.0,32.0,dict(type="bust",char="lucas",bg=BAR,expr="smirk",cam="push_fast"), [(28.15,31.82)]),
 (32.0,35.6,dict(type="cash_bag")),
 (35.6,37.5,dict(type="bust",char="lucas",bg=BAR,expr="sad",cam="push_slow",gy=.6)),
 (37.5,38.5,dict(type="bust",char="marcelo",bg=BAR,expr="cold",cam="push_fast"), [(37.62,38.28)]),
 (38.5,39.3,dict(type="bust",char="diego",bg=BAR,expr="worried",cam="push")),
 (39.3,41.9,dict(type="cash_counter",bgn=BAR,hand="rafael")),
 (41.9,45.5,dict(type="bust",char="rafael",bg=BAR,expr="serious",cam="push_slow"), [(42.02,45.23)]),
 (45.5,47.8,dict(type="bust",char="diego",bg=BAR,expr="sad",cam="push"), [(45.62,47.60)]),
 (47.8,52.4,dict(type="bust",char="marcelo",bg=BAR,expr="cold",cam="push"), [(47.95,52.19)]),
 (52.4,55.7,dict(type="doorway",openAt=0,who="lucas",leave=True)),
 (55.7,59.3,dict(type="bust",char="keliane",bg=GA,expr="sad",cam="push_slow",fi=.4)),
 (59.3,61.4,dict(type="bust",char="keliane",bg=GA,expr="sad",cam="push"), [(59.36,61.24)]),
 (61.4,62.6,dict(type="bust",char="rafael",bg=GA,expr="sad",cam="push_fast"), [(61.52,62.35)]),
 (62.6,64.5,dict(type="bust",char="raimundinha",bg=GA,expr="soft",cam="push")),
 (64.5,67.6,dict(type="toast",hitAt=1.6)),
 (67.6,71.2,dict(type="bust",char="diego",bg=BD,expr="smile",cam="push")),
 (71.2,75.5,dict(type="boat_leave",fi=.3)),
 (75.5,79.6,dict(type="bust",char="jessica_sun",bg=PO,expr="smirk",cam="push",phoneEar=True), [(77.80,79.41)]),
 (79.6,82.8,dict(type="call",bgn=PO,endAt=99,hand="jessica",label="Em chamada")),
 (82.8,84.6,dict(type="bust",char="jessica_sun",bg=PO,expr="teasing",cam="push_fast",phoneEar=True), [(82.91,84.38)]),
 (84.6,87.4,dict(type="card",text="x",l1="No Tabocal,",l2="todo mundo tem um segredo.",fi=.25)),
 (87.4,89.0,dict(type="season_end")),
 (89.0,93.4,dict(type="cta",likeAt=.9,followAt=2.3)),
 (93.4,END,dict(type="continua",big="2ª TEMPORADA EM BREVE",fo=.9)),
]
CAP=[tuple(x) for x in json.load(open(f"{HERE}/cap.json"))]
def sfx_horn():
    d=2.2; x=tt(d); f=110
    s=(signal.sawtooth(2*np.pi*f*x)+.6*signal.sawtooth(2*np.pi*f*1.5*x))*env(len(x),.15,.6)
    return reverb(lp(s,900),.5)*.25
def sfx_clink():
    d=1.2; x=tt(d); return (np.sin(2*np.pi*2350*x)+.6*np.sin(2*np.pi*3610*x))*np.exp(-x*6)*.2
SFX.update(horn=sfx_horn,clink=sfx_clink)
SFXL=[("whoosh",4.3),("whoosh",6.4),("impact",9.0),("riser_out",9.2),("hit",19.3),("hit",28.2),("flip",33.0),("hit",34.5),("impact",37.6),("flip",39.6),
("hit",44.3),("impact",48.0),("step",53.0),("step",53.6),("step",54.2),("door_slam",55.5),("clink",66.1),("horn",71.4),("ping",77.6),("impact",84.5),("impact",87.4)]
MUSL=[("tension",0,9.0),("tension",12.2,32.0),("drone",32.0,55.7),("sad",55.7,64.5),("outro",64.5,71.2),("drone",71.2,84.6),("sad",84.6,89.0),("outro",89.0,END)]
AMBL=[("bar_quiet",12.2,55.7),("bar",64.5,71.2)]

def env_of(a,b):
    hop=SR//FPS; y=narr[int(a*SR):int(b*SR)]
    r=np.array([np.sqrt(np.mean(y[i:i+hop]**2)) for i in range(0,len(y),hop)]); r=(r/(np.percentile(r,90)+1e-9)).clip(0,1.2)
    return [round(float(v),2) for v in np.convolve(r,[.25,.5,.25],"same")]
def syl(w):
    w=re.sub(r"[^a-záéíóúâêôãõàüç]","",w.lower())
    return max(1,len(re.findall(r"[aeiouáéíóúâêôãõàü]+",w)))
def words(text,dur):
    ws=text.split()
    wt=np.array([syl(x)+(0.8 if re.search(r"[.,!?…:]$",x) else 0) for x in ws],float)
    cs=np.concatenate([[0],np.cumsum(wt)])/wt.sum()*dur
    return [dict(w=x,a=round(float(cs[i]),3),b=round(float(cs[i+1]),3)) for i,x in enumerate(ws)]
beats=[]
for i,s in enumerate(SH):
    t0,t1,sh=s[0],s[1],s[2]; lines=[]
    for a,b in (s[3] if len(s)>3 else []): lines.append(dict(speaker=sh["char"],t0=a,dur=b-a,mouth=env_of(a,b),words=[]))
    for a,b,tx in CAP:
        if t0<=a<t1: lines.append(dict(speaker="narr",t0=a,dur=b-a,text=tx,words=words(tx,b-a)))
    beats.append(dict(id=f"s{i:02d}_{sh['type']}",t0=t0,dur=t1-t0,shot=sh,lines=lines))
json.dump(dict(fps=FPS,total=END,ep="EP. 10",beats=beats),open(f"{HERE}/schedule.json","w"),ensure_ascii=False)

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
