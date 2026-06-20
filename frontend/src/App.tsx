import { useState, useRef, useEffect } from 'react'
import AuthPage from './AuthPage'
import KnowledgePanel from './KnowledgePanel'
import Sidebar from './Sidebar'
import ChatArea from './ChatArea'
import Settings from './Settings'
import { t as tl } from './i18n'
import { Message, Conversation } from './types'
import './styles.css'

const MAX_TITLE = 40
const MODULES = [{key:'product',label:'产品库'},{key:'sop',label:'操作SOP'},{key:'training',label:'培训资料'},{key:'store',label:'门店信息'},{key:'marketing',label:'营销活动'},{key:'brand',label:'品牌'},{key:'franchise',label:'特许经营'},{key:'operations',label:'运营管理'},{key:'equipment',label:'设备'},{key:'maintenance',label:'维修'}]
const CITIES = ['大诺夫哥罗德', '普斯科夫', '特维尔']

const App: React.FC = () => {
  const [token,setToken]=useState(localStorage.getItem('token')||'')
  const [convs,setConvs]=useState<Conversation[]>([])
  const [activeId,setActiveId]=useState('')
  const [input,setInput]=useState('')
  const [loading,setLoading]=useState(false)
  const [sidebarOpen,setSidebarOpen]=useState(true)
  const [showSettings,setShowSettings]=useState(false)
  const [showKnowledge,setShowKnowledge]=useState(false)
  const active=convs.find(c=>c.id===activeId)
  const messages=active?.messages||[]
  const currentLang=active?.lang||'zh'
  const _ = (k:string)=>tl(k,currentLang)

  useEffect(()=>{fetch('/api/conversations/list',{headers:{'ngrok-skip-browser-warning':'true'}}).then(r=>r.json()).then((list:any[])=>{if(list.length>0){setConvs(list.map(c=>({...c,messages:[],pinned:!!c.pinned})));setActiveId(list[0].id)}}).catch(()=>{})},[])

  const header = (url: string, opts: any) => fetch(url, { ...opts, headers: { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json', ...opts.headers } })

  const saveConv = (id:string,msgs:Message[],lang:string,t?:string)=>{header(`/api/conversations/${id}/full`,{method:'PUT',body:JSON.stringify({title:t||msgs[0]?.content?.slice(0,MAX_TITLE)||'新对话',lang,messages:msgs,pinned:false})}).catch(()=>{})}
  const newChat = async () => {try{const r=await header('/api/conversations/save',{method:'POST',body:JSON.stringify({title:'新对话',lang:currentLang,messages:[],pinned:false})});const d=await r.json();const c:Conversation={id:d.id,title:'新对话',lang:currentLang,messages:[],pinned:false};setConvs(p=>[c,...p]);setActiveId(c.id)}catch{}}
  const renameConv = async (id:string,title:string)=>{await header(`/api/conversations/${id}`,{method:'PUT',body:JSON.stringify({title})});setConvs(p=>p.map(c=>c.id===id?{...c,title}:c))}
  const deleteConv = async (id:string)=>{await header(`/api/conversations/${id}`,{method:'DELETE'});setConvs(p=>{const f=p.filter(c=>c.id!==id);if(activeId===id)setActiveId(f[0]?.id||'');return f})}
  const togglePin = async (id:string,pinned:boolean)=>{await header(`/api/conversations/${id}`,{method:'PUT',body:JSON.stringify({pinned})});setConvs(prev=>prev.map(c=>c.id===id?{...c,pinned}:c))}
  const switchConv = async (id:string)=>{setActiveId(id);try{const r=await header(`/api/conversations/${id}`,{});const d=await r.json();setConvs(p=>p.map(c=>c.id===id?{...c,messages:d.messages||[],lang:d.lang||'zh',pinned:!!d.pinned}:c))}catch{}}
  const setLang = (lang:'zh'|'ru')=>{if(!active)return;const u={...active,lang};setConvs(p=>p.map(c=>c.id===activeId?u:c));saveConv(activeId,active.messages,lang)}

  const send = async (text?:string)=>{
    const q=(text||input).trim();if(!q||loading||!active)return;setInput('')
    const hasCyrillic=/[\u0400-\u04FF]/.test(q);const replyLang=hasCyrillic?'ru':'zh'
    const history=messages.slice(-6);const msgs:Message[]=[...messages,{role:'user',content:q}]
    setConvs(p=>p.map(c=>c.id===activeId?{...c,messages:msgs}:c));setLoading(true)
    setConvs(p=>p.map(c=>c.id===activeId?{...c,messages:[...msgs,{role:'assistant',content:''}]}:c))
    try{const res=await fetch('/api/chat/ask/stream',{method:'POST',headers:{'ngrok-skip-browser-warning':'true','Content-Type':'application/json'},body:JSON.stringify({query:q,lang:replyLang,history:history.map(h=>({role:h.role,content:h.content}))})});const reader=res.body?.getReader();const decoder=new TextDecoder();let fullText='';let meta:any={}
      while(reader){const{done,value}=await reader.read();if(done)break;const t=decoder.decode(value,{stream:true});for(const line of t.split('\n')){if(line.startsWith('data: ')){const d=line.slice(6);if(d==='[DONE]')break;try{const j=JSON.parse(d);if(j.type==='meta')meta=j;if(j.type==='text'){fullText+=j.text;setConvs(p=>p.map(c=>c.id===activeId?{...c,messages:c.messages.map((m,i)=>i===c.messages.length-1?{...m,content:fullText,source:meta.source,references:meta.references}:m)}:c))}}catch{}}}}
      const all=[...msgs,{role:'assistant' as const,content:fullText,source:meta.source,references:meta.references}];setConvs(p=>p.map(c=>c.id===activeId?{...c,messages:all,title:c.title==='新对话'?(msgs[0]?.content?.slice(0,MAX_TITLE)||'新对话'):c.title}:c));saveConv(activeId,all,currentLang)
    }catch{setConvs(p=>p.map(c=>c.id===activeId?{...c,messages:[...msgs,{role:'assistant',content:'⚠️ 连接失败'}]}:c))}
    setLoading(false)
  }

  const handleLogin=(t:string,u:string,r:string,_:string[])=>{setToken(t);localStorage.setItem('token',t);localStorage.setItem('username',u);localStorage.setItem('role',r)}
  if(!token)return <AuthPage onLogin={handleLogin}/>

  return (
    <div className="body">
      <Sidebar convs={convs} activeId={activeId} currentLang={currentLang} sidebarOpen={sidebarOpen}
        onSwitch={switchConv} onNewChat={newChat} onRename={renameConv} onDelete={deleteConv}
        onTogglePin={togglePin} onSettings={()=>setShowSettings(true)} />
      <div className="main">
        <div className="topbar">
          <button className="toggle-btn" onClick={()=>setSidebarOpen(!sidebarOpen)}>☰</button>
          <span className="brand">CHUCHUTEA</span>
          <span className="badge">{_('知识优先')}</span>
          <button className="kb-btn" onClick={()=>{setShowKnowledge(true);setShowSettings(false)}}>📚 {_('知识管理')}</button>
        </div>
        {showSettings && <Settings currentLang={currentLang} setLang={setLang} onClose={()=>setShowSettings(false)} cities={CITIES} modules={MODULES} />}
        {showKnowledge && <KnowledgePanel onClose={()=>setShowKnowledge(false)} />}
        <ChatArea messages={messages} loading={loading} isEmpty={messages.length===0} currentLang={currentLang} modules={MODULES} onQuickAsk={send} />
        <div className="input-wrap">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}} placeholder={_('输入你的问题...')} className="chat-input" />
          <button onClick={()=>send()} disabled={loading||!input.trim()} className="send-btn">↑</button>
        </div>
      </div>
    </div>
  )
}
export default App
