/**
 * @file App.jsx
 * @module App
 * @description Root React component. Owns all UI, state (xp, streak, lessons, SR, learned words, learned sentences, learned primitives), and lesson orchestration. Five screens: home, cards (intro / review / sentence-intro / primitive-intro), lesson, result, dict. Two content backends run side by side: legacy vocab-data.json drives the original 19 themed topics with word-and-sentence intros; the primitive-backed grammar engine drives foundation decks (`pronouns`, `qwords`) and composed topics (`travel`), showing primitives on intro cards and composing exercise sentences at runtime via engine/templates.js. Dictionary view exposes a Reset button that clears every `tamillearn:` key via storage.storageClear().
 * @exports
 *   - default App(): the root component rendered by main.jsx
 * @depends src/storage.js, src/audio.js, src/sm2.js, src/exercises.js, src/data/topics.js, src/data/vocab-data.json, src/data/primitives.json, src/engine/templates.js
 * @connects Loads persisted state on mount via storage.js; drives the whole UX.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { storageGet, storageSet, storageClear, KEYS } from "./storage";
import { speak } from "./audio";
import { sm2, isDue } from "./sm2";
import { TOPICS } from "./data/topics";
import vocabData from "./data/vocab-data.json";
import primData from "./data/primitives.json";
import { enumerate as enumerateSentences } from "./engine/templates";
import { generateExercise, genWordMatch, shuffle, pick } from "./exercises";

const V = {
  bg: "#0B0B1A", card: "#12122A", surf: "rgba(255,255,255,0.04)",
  bdr: "rgba(255,255,255,0.08)", txt: "#E8E8F4", dim: "#6B6B8D",
  acc: "#FF6B35", gold: "#FFD166", grn: "#06D6A0", red: "#EF476F",
  fn: "'DM Sans',sans-serif", ft: "'Noto Sans Tamil','DM Sans',sans-serif", rad: 16,
};

const LVLS = [0, 100, 250, 500, 800, 1200, 1800, 2500, 3500, 5000, 7000, 10000];
const LNMS = ["Seedling","Sprout","Sapling","Blooming","Flourishing","Skilled","Fluent","Advanced","Expert","Master","Legend","Sage"];
const LESSON_LEN = 10;
const BATCH_SIZE = 7;
const SENTENCE_BATCH_SIZE = 3;

const btnS = (bg, x = {}) => ({ width:"100%", padding:"16px 20px", background:bg, border:"none", borderRadius:V.rad, color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:V.fn, ...x });
const optS = (isSel, isCorr, isDone) => {
  let bg = V.surf, b = V.bdr;
  if (isDone && isSel) { bg = isCorr ? "rgba(6,214,160,0.15)" : "rgba(239,71,111,0.15)"; b = isCorr ? V.grn : V.red; }
  else if (isDone && isCorr) { bg = "rgba(6,214,160,0.08)"; b = V.grn+"66"; }
  return { background:bg, border:`2px solid ${b}`, borderRadius:V.rad, padding:"16px 20px", cursor:isDone?"default":"pointer", width:"100%", textAlign:"left", fontFamily:V.fn, transition:"all 0.15s" };
};
const Prog = ({pct,color}) => <div style={{width:"100%",height:10,background:"rgba(255,255,255,0.06)",borderRadius:5,overflow:"hidden"}}><div style={{width:`${Math.min(pct,100)}%`,height:"100%",background:color,borderRadius:5,transition:"width 0.5s ease"}}/></div>;
const chipS = a => ({ display:"inline-block", padding:"10px 16px", margin:4, background:a?"rgba(255,255,255,0.1)":V.surf, border:`1.5px solid ${a?"rgba(255,255,255,0.25)":V.bdr}`, borderRadius:12, cursor:"pointer", fontSize:16, fontFamily:V.ft, color:V.txt, transition:"all 0.15s" });
const Spk = ({text, topicId, size=18}) => <button onClick={e=>{e.stopPropagation();speak(text,topicId);}} style={{background:"rgba(255,107,53,0.12)",border:"1.5px solid rgba(255,107,53,0.25)",borderRadius:10,padding:"7px 12px",cursor:"pointer",fontSize:size,lineHeight:1,color:V.acc}}>🔊</button>;

export default function App() {
  const [scr, setScr] = useState("home");
  const [xp, setXP] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastDay, setLastDay] = useState(null);
  const [tLessons, setTLessons] = useState({});
  const [srData, setSR] = useState({});
  const [learned, setLearned] = useState([]);
  const [learnedSentences, setLearnedSentences] = useState({});
  const [learnedPrimitives, setLearnedPrimitives] = useState([]);
  const [ready, setReady] = useState(false);

  const [curT, setCurT] = useState(null);
  const [ex, setEx] = useState(null);
  const [step, setStep] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [earnXP, setEarnXP] = useState(0);
  const [sel, setSel] = useState(null);
  const [done, setDone] = useState(false);
  const [ok, setOk] = useState(false);
  const [built, setBuilt] = useState([]);
  const [rem, setRem] = useState([]);
  const [ci, setCi] = useState(0);
  const [introBatch, setIntroBatch] = useState([]);
  const [cardsMode, setCardsMode] = useState("intro");
  const [dSearch, setDSearch] = useState("");
  const [dTopic, setDTopic] = useState("all");

  useEffect(() => {
    setXP(storageGet(KEYS.XP, 0));
    setStreak(storageGet(KEYS.STREAK, 0));
    setLastDay(storageGet(KEYS.LAST_DAY, null));
    setTLessons(storageGet(KEYS.TOPIC_LESSONS, {}));
    setSR(storageGet(KEYS.SR_DATA, {}));
    setLearned(storageGet(KEYS.LEARNED_WORDS, []));
    setLearnedSentences(storageGet(KEYS.LEARNED_SENTENCES, {}));
    setLearnedPrimitives(storageGet(KEYS.LEARNED_PRIMITIVES, []));
    const ld = storageGet(KEYS.LAST_DAY, null);
    const today = new Date().toDateString();
    if (ld && ld !== today && ld !== new Date(Date.now()-864e5).toDateString()) {
      setStreak(0); storageSet(KEYS.STREAK, 0);
    }
    setReady(true);
  }, []);

  const saveAll = useCallback((u) => {
    const m = {xp:KEYS.XP,streak:KEYS.STREAK,lastDay:KEYS.LAST_DAY,tLessons:KEYS.TOPIC_LESSONS,srData:KEYS.SR_DATA,learned:KEYS.LEARNED_WORDS,learnedSentences:KEYS.LEARNED_SENTENCES,learnedPrimitives:KEYS.LEARNED_PRIMITIVES};
    for (const [k,v] of Object.entries(u)) if(m[k]) storageSet(m[k],v);
  },[]);

  const resetProgress = useCallback(() => {
    if (!window.confirm("Reset all progress? This cannot be undone.")) return;
    storageClear();
    setXP(0); setStreak(0); setLastDay(null);
    setTLessons({}); setSR({});
    setLearned([]); setLearnedSentences({}); setLearnedPrimitives([]);
    setDSearch(""); setDTopic("all");
    setScr("home");
  },[]);

  const getVocab = (topicId) => vocabData[topicId] || null;
  const isPrimTopic = (topicId) => !!primData.topics[topicId];

  const buildPrimPool = useCallback((topicId, pids) => {
    const topic = primData.topics[topicId]; if(!topic) return {words:[],sentences:[]};
    const all = primData.primitives;
    const words = pids.filter(id=>all[id]).map(id=>{
      const p = all[id];
      return {
        tamil: p.tamil, transliteration: p.transliteration, english: p.english,
        englishIng: p.englishIng || null, pos: p.pos, disambig: p.disambig || null,
        topicId, _primId: id,
      };
    });
    const sentences = enumerateSentences(all, new Set(pids), topic).map(s=>({
      tamil: s.tamil, transliteration: "", english: s.english,
      tokens: s.tokens, primIds: s.primIds, templateId: s.templateId,
    }));
    return {words, sentences};
  },[]);

  const nextPrimBatch = useCallback((topicId, pids) => {
    const topic = primData.topics[topicId]; if(!topic) return [];
    const all = primData.primitives;
    const known = new Set(pids);
    const batch = [];
    const groups = topic.groups || {};
    // One from each group in declaration order — gives a mixed first batch
    // for multi-group topics (e.g. pron+verb+dest for travel) and a single-
    // group slice for foundation decks (pronouns, qwords).
    for (const key of Object.keys(groups)) {
      if (batch.length >= 3) break;
      const id = (groups[key]||[]).find(id=>!known.has(id));
      if (id) { batch.push(id); known.add(id); }
    }
    if (batch.length < 3) {
      for (const id of Object.values(groups).flat()) {
        if (batch.length >= 3) break;
        if (!known.has(id)) { batch.push(id); known.add(id); }
      }
    }
    return batch.map(id=>({...all[id], _primId:id}));
  },[]);

  const startTopic = useCallback((topicId) => {
    const t = TOPICS.find(x=>x.id===topicId); setCurT(t);
    setStep(0); setHearts(5); setEarnXP(0); setDone(false); setSel(null); setBuilt([]); setRem([]);
    if(isPrimTopic(topicId)){
      const batch = nextPrimBatch(topicId, learnedPrimitives);
      if(batch.length>0){ setIntroBatch(batch); setCardsMode("primitive-intro"); setCi(0); setScr("cards"); return; }
      const pool = buildPrimPool(topicId, learnedPrimitives);
      const d = Math.min(Math.floor((tLessons[topicId]||0)/3),2);
      const e = generateExercise(pool.words, pool.sentences, d);
      setEx(e); if(e.type==="build") setRem([...e.scrambled]); setScr("lesson"); return;
    }
    const v = getVocab(topicId);
    if(!v||!v.words?.length) return;
    setStep(0); setHearts(5); setEarnXP(0); setDone(false); setSel(null); setBuilt([]); setRem([]);
    const learnedForTopic = learned.filter(w=>w.topicId===topicId);
    const introducedCount = learnedForTopic.length;
    const remaining = v.words.slice(introducedCount);
    const learnedSentIdx = learnedSentences[topicId] || [];
    const allSentences = v.sentences || [];
    const remainingSentences = allSentences
      .map((s,i)=>({s,i}))
      .filter(({i})=>!learnedSentIdx.includes(i));
    const completedBatches = Math.floor(introducedCount / BATCH_SIZE);
    const targetLearnedSents = completedBatches * SENTENCE_BATCH_SIZE;
    const sentenceDebt = targetLearnedSents - learnedSentIdx.length;
    if(sentenceDebt>0 && remainingSentences.length>0){
      const take = Math.min(SENTENCE_BATCH_SIZE, remainingSentences.length);
      setIntroBatch(remainingSentences.slice(0,take).map(({s,i})=>({...s,_idx:i})));
      setCardsMode("sentence-intro");setCi(0);setScr("cards");
    } else if(remaining.length>0){
      setIntroBatch(remaining.slice(0,BATCH_SIZE));
      setCardsMode("intro");setCi(0);setScr("cards");
    } else if(remainingSentences.length>0){
      const take = Math.min(SENTENCE_BATCH_SIZE, remainingSentences.length);
      setIntroBatch(remainingSentences.slice(0,take).map(({s,i})=>({...s,_idx:i})));
      setCardsMode("sentence-intro");setCi(0);setScr("cards");
    } else {
      const allowedSentences = learnedSentIdx.map(i=>allSentences[i]).filter(Boolean);
      const d = Math.min(Math.floor((tLessons[topicId]||0)/3),2);
      const e = generateExercise(learnedForTopic,allowedSentences,d);
      setEx(e);if(e.type==="build")setRem([...e.scrambled]);setScr("lesson");
    }
  },[tLessons,learned,learnedSentences]);

  const reviewCards = useCallback((topicId)=>{
    const t=TOPICS.find(x=>x.id===topicId);if(!t)return;
    if(isPrimTopic(topicId)){
      const all = primData.primitives;
      const cards = learnedPrimitives.filter(id=>all[id]).map(id=>({...all[id],_primId:id}));
      if(cards.length===0)return;
      setCurT(t);setIntroBatch(cards);setCardsMode("review");setCi(0);setScr("cards");return;
    }
    const learnedForTopic = learned.filter(w=>w.topicId===topicId);
    if(learnedForTopic.length===0)return;
    setCurT(t);setIntroBatch(learnedForTopic);setCardsMode("review");setCi(0);setScr("cards");
  },[learned,learnedPrimitives]);

  const startFromCards = useCallback(()=>{
    if(isPrimTopic(curT.id)){
      let npl = learnedPrimitives;
      if(cardsMode==="primitive-intro"){
        const add = introBatch.map(p=>p._primId).filter(id=>id && !npl.includes(id));
        npl = [...npl, ...add];
        setLearnedPrimitives(npl); saveAll({learnedPrimitives:npl});
        const nw = [...learned];
        introBatch.forEach(p=>{
          if(!nw.find(l=>l.tamil===p.tamil&&l.topicId===curT.id)){
            nw.push({tamil:p.tamil, transliteration:p.transliteration, english:p.english, topicId:curT.id});
          }
        });
        if(nw.length!==learned.length){ setLearned(nw); saveAll({learned:nw}); }
      }
      const pool = buildPrimPool(curT.id, npl);
      const d = Math.min(Math.floor((tLessons[curT.id]||0)/3),2);
      const e = generateExercise(pool.words, pool.sentences, d);
      setEx(e); if(e.type==="build") setRem([...e.scrambled]); setStep(0); setScr("lesson"); return;
    }
    const v=getVocab(curT.id);
    let nw=learned;
    let nls=learnedSentences;
    if(cardsMode==="sentence-intro"){
      const cur=nls[curT.id]||[];
      const add=introBatch.map(s=>s._idx).filter(i=>i!==undefined&&!cur.includes(i));
      nls={...nls,[curT.id]:[...cur,...add]};
      setLearnedSentences(nls);saveAll({learnedSentences:nls});
    } else {
      nw=[...learned];
      introBatch.forEach(w=>{if(!nw.find(l=>l.tamil===w.tamil&&l.topicId===curT.id))nw.push({...w,topicId:curT.id});});
      setLearned(nw);saveAll({learned:nw});
    }
    const learnedForTopic = nw.filter(w=>w.topicId===curT.id);
    const learnedSentIdx = nls[curT.id] || [];
    const allowedSentences = learnedSentIdx.map(i=>(v.sentences||[])[i]).filter(Boolean);
    const d = Math.min(Math.floor((tLessons[curT.id]||0)/3),2);
    const e=generateExercise(learnedForTopic,allowedSentences,d);
    setEx(e);if(e.type==="build")setRem([...e.scrambled]);setStep(0);setScr("lesson");
  },[curT,learned,learnedSentences,learnedPrimitives,introBatch,cardsMode,tLessons,saveAll,buildPrimPool]);

  const handlePick = (o)=>{
    if(done)return;setSel(o);setDone(true);setOk(o.correct);
    if(o.correct){setEarnXP(p=>p+ex.xp);if(ex.targetWord)setSR(s=>({...s,[ex.targetWord.tamil]:sm2(s[ex.targetWord.tamil],4)}));}
    else{setHearts(h=>h-1);if(ex.targetWord)setSR(s=>({...s,[ex.targetWord.tamil]:sm2(s[ex.targetWord.tamil],1)}));}
  };
  const tapB=(w,i)=>{if(done)return;setBuilt(p=>[...p,w]);setRem(p=>p.filter((_,j)=>j!==i));};
  const untapB=(w,i)=>{if(done)return;setRem(p=>[...p,w]);setBuilt(p=>p.filter((_,j)=>j!==i));};
  const checkB=()=>{const c=built.join(" ")===ex.correctOrder.join(" ");setDone(true);setOk(c);if(c)setEarnXP(p=>p+ex.xp);else setHearts(h=>h-1);};

  const nextStep = useCallback(()=>{
    if(hearts<=0||step+1>=LESSON_LEN){
      const today=new Date().toDateString();
      const nx=xp+earnXP, ns=lastDay===today?streak:streak+1;
      const nl={...tLessons,[curT.id]:(tLessons[curT.id]||0)+1};
      setXP(nx);setStreak(ns);setLastDay(today);setTLessons(nl);
      saveAll({xp:nx,streak:ns,lastDay:today,tLessons:nl,srData:srData,learned,learnedPrimitives});
      setScr("result");return;
    }
    setStep(s=>s+1);setDone(false);setSel(null);setBuilt([]);setRem([]);
    const d=Math.min(Math.floor((tLessons[curT.id]||0)/3),2);
    if(isPrimTopic(curT.id)){
      const pool = buildPrimPool(curT.id, learnedPrimitives);
      const e = generateExercise(pool.words, pool.sentences, d);
      setEx(e); if(e.type==="build") setRem([...e.scrambled]); return;
    }
    const v=getVocab(curT.id);
    const learnedForTopic = learned.filter(w=>w.topicId===curT.id);
    const learnedSentIdx = learnedSentences[curT.id] || [];
    const allowedSentences = learnedSentIdx.map(i=>(v.sentences||[])[i]).filter(Boolean);
    const e=generateExercise(learnedForTopic,allowedSentences,d);setEx(e);if(e.type==="build")setRem([...e.scrambled]);
  },[hearts,step,xp,earnXP,streak,lastDay,tLessons,curT,srData,learned,learnedSentences,learnedPrimitives,buildPrimPool,saveAll]);

  const startReview = useCallback(()=>{
    const due=learned.filter(w=>isDue(srData[w.tamil]));
    if(due.length<4){alert("Not enough words due for review!");return;}
    const t=TOPICS.find(x=>x.id===due[0].topicId)||TOPICS[0];setCurT(t);
    setStep(0);setHearts(5);setEarnXP(0);setDone(false);setSel(null);setBuilt([]);setRem([]);
    const pool=due.length>=4?pick(due,20):[...pick(due,due.length),...pick(learned,4)];
    setEx(genWordMatch(pool));setScr("lesson");
  },[learned,srData]);

  const lv = useMemo(()=>{let l=0;for(let i=LVLS.length-1;i>=0;i--)if(xp>=LVLS[i]){l=i;break;}return l;},[xp]);

  if(!ready) return <div style={{minHeight:"100vh",background:V.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center",fontFamily:V.fn}}><div style={{fontSize:48,marginBottom:12}}>🙏</div><div style={{color:V.dim,fontSize:16}}>Loading...</div></div></div>;

  // ═══ HOME / DICT ════════════════════════════════════════════════
  if(scr==="home"||scr==="dict"){
    const isD=scr==="dict";
    const fW=learned.filter(w=>{
      if(dTopic!=="all"&&w.topicId!==dTopic)return false;
      if(dSearch){const q=dSearch.toLowerCase();return w.english.toLowerCase().includes(q)||w.tamil.includes(dSearch)||w.transliteration.toLowerCase().includes(q);}
      return true;
    });
    return(
      <div style={{minHeight:"100vh",background:V.bg,fontFamily:V.fn,color:V.txt,paddingBottom:80}}>
        <div style={{padding:"22px 20px 14px",background:"linear-gradient(180deg,rgba(255,107,53,0.07) 0%,transparent 100%)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div><div style={{fontSize:26,fontWeight:800,fontFamily:V.ft}}><span style={{color:V.acc}}>தமிழ்</span> <span style={{color:V.txt}}>கற்போம்</span></div><div style={{color:V.dim,fontSize:12,marginTop:1}}>Tamil for Movie Lovers</div></div>
            <div style={{textAlign:"right"}}><div style={{color:V.gold,fontWeight:700,fontSize:14}}>⚡ {xp} XP</div><div style={{color:"#FF9F43",fontSize:12,marginTop:2}}>🔥 {streak} day{streak!==1?"s":""}</div></div>
          </div>
          <div style={{marginTop:14}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}><span style={{color:V.gold,fontWeight:600}}>Lvl {lv+1} · {LNMS[lv]}</span><span style={{color:V.dim}}>{xp}/{LVLS[Math.min(lv+1,LVLS.length-1)]}</span></div>
            <Prog pct={((xp-LVLS[lv])/(LVLS[Math.min(lv+1,LVLS.length-1)]-LVLS[lv]))*100} color={V.gold}/>
          </div>
          <div style={{display:"flex",gap:10,marginTop:14}}>
            {[{v:learned.length,l:"Words",c:V.grn},{v:Object.values(tLessons).reduce((a,b)=>a+b,0),l:"Lessons",c:V.acc},{v:Object.keys(tLessons).length,l:"Topics",c:V.gold}].map(s=>(
              <div key={s.l} style={{flex:1,background:V.card,borderRadius:12,padding:"10px 8px",textAlign:"center",border:`1px solid ${V.bdr}`}}><div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:V.dim}}>{s.l}</div></div>
            ))}
          </div>
          <div style={{display:"flex",gap:8,marginTop:14}}>
            {[["home","📚 Topics"],["dict",`📖 Dictionary (${learned.length})`]].map(([k,l])=>(<button key={k} onClick={()=>setScr(k)} style={{flex:1,padding:"9px",background:scr===k?"rgba(255,107,53,0.12)":V.surf,border:`1.5px solid ${scr===k?V.acc+"44":V.bdr}`,borderRadius:10,color:scr===k?V.acc:V.dim,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:V.fn}}>{l}</button>))}
          </div>
        </div>
        {!isD?(
          <div style={{padding:"8px 20px"}}>
            {learned.length>=4&&<button onClick={startReview} style={{...btnS("linear-gradient(135deg,#6D28D9,#A78BFA)"),marginBottom:14}}>🔄 Review Due Words</button>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {TOPICS.filter(t=>vocabData[t.id]||primData.topics[t.id]).map(t=>{
                const ls=tLessons[t.id]||0,mast=ls>=10;
                const primTopic = primData.topics[t.id];
                const primIds = primTopic ? Object.values(primTopic.groups).flat() : [];
                const learnedCt = primTopic
                  ? learnedPrimitives.filter(id=>primIds.includes(id)).length
                  : learned.filter(w=>w.topicId===t.id).length;
                return(<div key={t.id} onClick={()=>startTopic(t.id)} style={{background:`linear-gradient(145deg,${t.color}15,${t.color}08)`,border:`1.5px solid ${t.color}${mast?"66":"33"}`,borderRadius:20,padding:"18px 12px",textAlign:"center",cursor:"pointer",transition:"all 0.2s",position:"relative"}}>
                  {learnedCt>0&&<button onClick={e=>{e.stopPropagation();reviewCards(t.id);}} title="Review cards" style={{position:"absolute",top:6,left:8,background:"rgba(255,255,255,0.08)",border:"none",borderRadius:8,padding:"3px 7px",fontSize:11,color:V.dim,cursor:"pointer",fontFamily:V.fn}}>📖 {learnedCt}</button>}
                  {mast&&<div style={{position:"absolute",top:6,right:8,fontSize:13}}>👑</div>}
                  <div style={{fontSize:26,marginBottom:4}}>{t.emoji}</div>
                  <div style={{fontSize:13,fontWeight:700,color:V.txt}}>{t.title}</div>
                  <div style={{marginTop:8}}><Prog pct={Math.min(ls,10)/10*100} color={t.color}/></div>
                  <div style={{fontSize:10,color:V.dim,marginTop:3}}>{ls===0?"New":mast?"Mastered!":`${ls}/10`}</div>
                </div>);
              })}
            </div>
          </div>
        ):(
          <div style={{padding:"10px 20px"}}>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <input type="text" value={dSearch} onChange={e=>setDSearch(e.target.value)} placeholder="Search words..." style={{flex:1,padding:"11px 14px",background:V.card,border:`1.5px solid ${V.bdr}`,borderRadius:12,color:V.txt,fontSize:14,fontFamily:V.fn,boxSizing:"border-box",outline:"none"}}/>
              <button onClick={resetProgress} title="Reset all progress" style={{padding:"11px 14px",background:"transparent",border:`1.5px solid ${V.red}55`,borderRadius:12,color:V.red,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:V.fn,whiteSpace:"nowrap"}}>↺ Reset</button>
            </div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
              <button onClick={()=>setDTopic("all")} style={{padding:"5px 10px",borderRadius:8,border:`1px solid ${dTopic==="all"?V.acc:V.bdr}`,background:dTopic==="all"?V.acc+"22":"transparent",color:dTopic==="all"?V.acc:V.dim,fontSize:11,cursor:"pointer",fontFamily:V.fn}}>All</button>
              {TOPICS.filter(t=>vocabData[t.id]||primData.topics[t.id]).map(t=>(<button key={t.id} onClick={()=>setDTopic(t.id)} style={{padding:"5px 10px",borderRadius:8,border:`1px solid ${dTopic===t.id?t.color:V.bdr}`,background:dTopic===t.id?t.color+"22":"transparent",color:dTopic===t.id?t.color:V.dim,fontSize:11,cursor:"pointer",fontFamily:V.fn}}>{t.emoji}</button>))}
            </div>
            {fW.length===0?<div style={{textAlign:"center",padding:32,color:V.dim}}>{learned.length===0?"Complete a lesson to start your dictionary!":"No matches."}</div>:(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>{fW.map((w,i)=>(<div key={i} style={{background:V.card,borderRadius:14,padding:"12px 14px",border:`1px solid ${V.bdr}`,display:"flex",alignItems:"center",gap:10}}><div style={{flex:1}}><div style={{fontFamily:V.ft,fontSize:18,fontWeight:700}}>{w.tamil}</div><div style={{fontSize:11,color:V.dim,fontStyle:"italic"}}>{w.transliteration}</div><div style={{fontSize:13,color:"#aaa",marginTop:1}}>{w.english}</div></div><Spk text={w.tamil} topicId={w.topicId} size={14}/></div>))}</div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ═══ CARDS (word intro / review / sentence intro / primitive intro) ═══════════════
  if(scr==="cards"){
    const intro=introBatch;if(!intro.length){setScr("home");return null;}
    const w=intro[ci];const isReview=cardsMode==="review";
    const isSent=cardsMode==="sentence-intro";
    const isPrim=cardsMode==="primitive-intro"||(isReview&&w._primId);
    const isLast=ci+1>=intro.length;
    const label=isReview?"Review":isSent?"New Sentences":isPrim?"New Building Blocks":"New Words";
    const nextLabel=!isLast?(isSent?"Next Sentence →":isPrim?"Next →":"Next Word →"):(isReview?"Done ✓":"Start Practice! 🎯");
    const primExtra = isPrim && w.pos==="verb" ? (w.hint || `e.g. ${w.audioText||""}`)
      : isPrim && w.pos==="noun" ? `→ ${w.dative||""}${w.toGloss?` (${w.toGloss})`:""}`
      : null;
    return(
      <div style={{minHeight:"100vh",background:V.bg,fontFamily:V.fn,color:V.txt}}>
        <div style={{padding:"20px 20px 10px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <button onClick={()=>setScr("home")} style={{background:"none",border:"none",color:V.dim,fontSize:18,cursor:"pointer"}}>✕</button>
            <div style={{fontSize:13,color:V.dim,fontWeight:500}}>{label} · {ci+1}/{intro.length}</div>
            <div style={{width:24}}/>
          </div>
          <Prog pct={(ci+1)/intro.length*100} color={curT.color}/>
        </div>
        <div style={{margin:"28px 20px",padding:isSent?"32px 18px":"44px 20px",background:`linear-gradient(150deg,${curT.color}12,${curT.color}06)`,border:`2px solid ${curT.color}33`,borderRadius:24,textAlign:"center",animation:"fadeSlide 0.3s ease"}}>
          <div style={{marginBottom:14}}><Spk text={w.tamil} topicId={curT.id} size={22}/></div>
          <div style={{fontFamily:V.ft,fontSize:isSent?28:42,fontWeight:800,color:"#fff",lineHeight:1.35}}>{w.tamil}</div>
          <div style={{fontSize:isSent?14:15,color:V.dim,fontStyle:"italic",marginTop:8}}>{w.transliteration}</div>
          <div style={{width:50,height:3,background:curT.color,margin:"18px auto",borderRadius:2,opacity:0.5}}/>
          <div style={{fontSize:isSent?16:20,fontWeight:600,color:"#ddd",lineHeight:1.4}}>{w.english}</div>
          {isSent&&<div style={{marginTop:14,fontSize:11,color:V.dim,letterSpacing:1,textTransform:"uppercase"}}>How it sounds in real conversation</div>}
          {primExtra&&<div style={{marginTop:14,fontSize:14,color:V.dim,fontFamily:V.ft}}>{primExtra}</div>}
        </div>
        <div style={{padding:"0 20px"}}>
          <button onClick={()=>{speak(w.tamil,curT.id);if(!isLast)setCi(ci+1);else if(isReview)setScr("home");else startFromCards();}} style={btnS(`linear-gradient(135deg,${curT.color},${curT.color}bb)`)}>
            {nextLabel}
          </button>
        </div>
        <style>{`@keyframes fadeSlide{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}`}</style>
      </div>
    );
  }

  // ═══ LESSON ═════════════════════════════════════════════════════
  if(scr==="lesson"&&ex){
    const renderEx=()=>{
      if(ex.type==="word-match")return(<>
        <div style={{fontSize:11,color:V.dim,fontWeight:600,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>{ex.dir==="t2e"?"What does this mean?":"Choose the Tamil word"}</div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
          {ex.dir==="t2e"&&<Spk text={ex.prompt} topicId={curT?.id}/>}
          <div><div style={{fontFamily:ex.dir==="t2e"?V.ft:V.fn,fontSize:30,fontWeight:700,color:"#fff"}}>{ex.prompt}</div>{ex.promptSub&&<div style={{fontSize:13,color:V.dim,fontStyle:"italic",marginTop:2}}>{ex.promptSub}</div>}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:24}}>{ex.options.map((o,i)=>(<button key={i} style={optS(sel===o,o.correct,done)} onClick={()=>handlePick(o)}><div style={{fontFamily:ex.dir==="e2t"?V.ft:V.fn,fontSize:16,fontWeight:600,color:V.txt}}>{o.label}</div>{o.sub&&<div style={{fontSize:12,color:V.dim,marginTop:1}}>{o.sub}</div>}</button>))}</div>
      </>);
      if(ex.type==="listen")return(<>
        <div style={{fontSize:11,color:V.dim,fontWeight:600,textTransform:"uppercase",letterSpacing:1.5,marginBottom:14}}>Listen & Identify</div>
        <div style={{background:V.card,borderRadius:20,padding:"24px 16px",textAlign:"center",marginBottom:20,border:`1px solid ${V.bdr}`}}>
          <button onClick={()=>speak(ex.tamil,curT?.id)} style={{background:`linear-gradient(135deg,${V.acc}20,${V.acc}10)`,border:`2px solid ${V.acc}40`,borderRadius:14,padding:"12px 24px",cursor:"pointer",fontSize:16,color:V.acc,fontWeight:600,marginBottom:12,fontFamily:V.fn}}>🔊 Play Sound</button>
          <div style={{fontFamily:V.ft,fontSize:28,fontWeight:700,color:"#fff",marginTop:6}}>{ex.tamil}</div>
          <div style={{fontSize:13,color:V.dim,fontStyle:"italic",marginTop:4}}>{ex.transliteration}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>{ex.options.map((o,i)=>(<button key={i} style={optS(sel===o,o.correct,done)} onClick={()=>handlePick(o)}><div style={{fontSize:16,fontWeight:600,color:V.txt}}>{o.label}</div></button>))}</div>
      </>);
      if(ex.type==="fill"){
        const hl = ex.blankTamil;
        const toks = ex.tamil.split(" ");
        const matchIdx = hl ? toks.findIndex(t => t === hl || t.includes(hl)) : -1;
        const hlStyle = {color:V.acc, background:"rgba(255,107,53,0.14)", padding:"1px 8px", borderRadius:6, boxShadow:"0 0 0 1px rgba(255,107,53,0.3) inset"};
        return(<>
        <div style={{fontSize:11,color:V.dim,fontWeight:600,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Fill in the blank</div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}><Spk text={ex.tamil} topicId={curT?.id}/><div>
          <div style={{fontFamily:V.ft,fontSize:20,fontWeight:700,color:"#fff"}}>
            {matchIdx>=0 ? toks.map((t,i)=>(<span key={i}>{i>0?" ":""}<span style={i===matchIdx?hlStyle:undefined}>{t}</span></span>)) : ex.tamil}
          </div>
          <div style={{fontSize:12,color:V.dim,fontStyle:"italic",marginTop:1}}>{ex.transliteration}</div>
        </div></div>
        <div style={{background:V.card,borderRadius:12,padding:"12px 16px",margin:"10px 0 20px",fontSize:16,color:"#ccc",fontWeight:500,border:`1px solid ${V.bdr}`}}>{ex.display}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{ex.options.map((o,i)=>(<button key={i} style={{...optS(sel===o,o.correct,done),textAlign:"center"}} onClick={()=>handlePick(o)}><div style={{fontSize:15,fontWeight:600,color:V.txt}}>{o.label}</div></button>))}</div>
      </>);}
      if(ex.type==="build")return(<>
        <div style={{fontSize:11,color:V.dim,fontWeight:600,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Build the Tamil sentence</div>
        <div style={{fontSize:17,fontWeight:600,color:"#e0e0e8",marginBottom:3}}>{ex.english}</div>
        <div style={{fontSize:12,color:V.dim,fontStyle:"italic",marginBottom:18}}>{ex.transliteration}</div>
        <div style={{minHeight:52,background:V.card,border:"2px dashed rgba(255,255,255,0.1)",borderRadius:14,padding:"8px 6px",marginBottom:14,display:"flex",flexWrap:"wrap",gap:4,alignItems:"center",justifyContent:built.length?"flex-start":"center"}}>
          {!built.length&&<span style={{color:V.dim,fontSize:13}}>Tap words to build</span>}
          {built.map((w,i)=><span key={i} style={chipS(true)} onClick={()=>untapB(w,i)}>{w}</span>)}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,justifyContent:"center",marginBottom:14}}>{rem.map((w,i)=><span key={i} style={chipS(false)} onClick={()=>tapB(w,i)}>{w}</span>)}</div>
        {!done&&built.length===ex.correctOrder.length&&<button style={btnS(curT?.color||V.acc)} onClick={checkB}>Check ✓</button>}
      </>);
    };
    return(
      <div style={{minHeight:"100vh",background:V.bg,fontFamily:V.fn,color:V.txt}}>
        <div style={{padding:"18px 20px 10px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <button onClick={()=>setScr("home")} style={{background:"none",border:"none",color:V.dim,fontSize:18,cursor:"pointer"}}>✕</button>
            <div style={{display:"flex",gap:2}}>{[...Array(5)].map((_,i)=><span key={i} style={{fontSize:14,opacity:i<hearts?1:0.2}}>❤️</span>)}</div>
            <div style={{color:V.gold,fontWeight:700,fontSize:13}}>⚡{earnXP}</div>
          </div>
          <Prog pct={(step+1)/LESSON_LEN*100} color={curT?.color||V.acc}/>
        </div>
        <div style={{padding:"18px 20px",animation:"fadeIn 0.3s ease"}}>{renderEx()}</div>
        {done&&(<div style={{padding:"0 20px",animation:"slideUp 0.2s ease"}}>
          <div style={{padding:"12px 16px",borderRadius:V.rad,marginBottom:8,background:ok?"rgba(6,214,160,0.08)":"rgba(239,71,111,0.08)",border:`1.5px solid ${ok?V.grn+"44":V.red+"44"}`}}>
            <div style={{fontWeight:700,fontSize:15,color:ok?V.grn:V.red}}>{ok?"🎉 Correct!":"✕ Not quite"}</div>
            {!ok&&<div style={{marginTop:5,fontSize:13,color:"#bbb"}}>{ex.type==="build"?<>Correct: <span style={{fontFamily:V.ft}}>{ex.correctOrder.join(" ")}</span></>:<>Answer: {ex.answer}</>}</div>}
            {ok&&<div style={{fontSize:11,color:V.dim,marginTop:3}}>+{ex.xp} XP</div>}
          </div>
          {ex.grammarTip&&<div style={{padding:"10px 14px",borderRadius:V.rad,marginBottom:8,background:"rgba(255,209,102,0.08)",border:`1.5px solid ${V.gold}33`,fontSize:13,color:"#e0dcc0"}}>
            <span style={{fontWeight:700,color:V.gold,marginRight:6}}>💡 Rule:</span>
            <span style={{fontFamily:V.ft}}>{ex.grammarTip}</span>
          </div>}
          <button onClick={nextStep} style={btnS(ok?V.grn:V.red)}>{hearts<=0?"End Lesson":step+1>=LESSON_LEN?"Finish! 🏆":"Continue →"}</button>
        </div>)}
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    );
  }

  // ═══ RESULT ═════════════════════════════════════════════════════
  if(scr==="result"){
    const p=hearts>0;
    return(
      <div style={{minHeight:"100vh",background:V.bg,fontFamily:V.fn,color:V.txt,display:"flex",alignItems:"center"}}>
        <div style={{width:"100%",padding:"36px 24px",textAlign:"center",animation:"fadeIn 0.4s ease"}}>
          <div style={{fontSize:56,marginBottom:12}}>{p?"🏆":"💔"}</div>
          <div style={{fontSize:24,fontWeight:800,marginBottom:6}}>{p?"Lesson Complete!":"Out of Hearts"}</div>
          <div style={{fontSize:14,color:V.dim,marginBottom:28}}>{p?`+${earnXP} XP in ${curT?.title}`:"Try again to strengthen your skills!"}</div>
          {p&&<div style={{display:"flex",justifyContent:"center",gap:24,marginBottom:32}}>
            {[{v:`⚡${earnXP}`,l:"XP",c:V.gold},{v:`❤️${hearts}`,l:"Hearts",c:V.red},{v:`🔥${streak}`,l:"Streak",c:"#FF9F43"}].map(s=>(<div key={s.l} style={{textAlign:"center"}}><div style={{fontSize:26,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:V.dim}}>{s.l}</div></div>))}
          </div>}
          <button onClick={()=>setScr("home")} style={btnS(p?V.grn:V.acc)}>Back to Topics</button>
          {!p&&<button onClick={()=>startTopic(curT.id)} style={{...btnS("transparent"),border:`2px solid ${V.acc}`,color:V.acc,marginTop:10}}>Try Again 🔁</button>}
        </div>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    );
  }
  return null;
}
