import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { buyerAPI, vendorAPI } from "../api/api";
import { useToast } from "../context/ToastContext";
import { Card, StatCard, Btn, Input, Textarea, Select, Modal, SectionHeader, Tabs, Empty, Stars } from "../components/UI";
import ConfirmModal from "../components/ConfirmModal";
import { useLocation, useNavigate } from "react-router-dom";

const SERVICE_CATEGORIES = ["Logistics & Delivery","Facilities & Cleaning","Staffing & Training","Food & Catering","Textiles & Apparel","IT & Digital Services","Green & Sustainability","Handicrafts & Artisan","Healthcare & Wellness","Construction & Fitout"];
const CERT_TYPES = ["women_led","msme_udyam","sc_st_owned","shg","social_enterprise","cooperative","fair_trade","weps_signatory"];
const BID_STATUS_COLORS = {submitted:"var(--accent)",under_review:"var(--warn)",shortlisted:"var(--accent2)",awarded:"var(--accent3)",declined:"var(--danger)"};
const BID_STATUS_ICONS  = {submitted:"📨",under_review:"👀",shortlisted:"⭐",awarded:"🏆",declined:"❌"};

export default function BuyerDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast    = useToast();
  const tab = location.pathname.includes("my-requests")    ? "my-requests"
    : location.pathname.includes("vendors")                ? "vendors"
    : location.pathname.includes("notifications")          ? "notifications"
    : "overview";

  return (
    <Layout>
      <div style={{marginBottom:28}}>
        <Tabs tabs={[
          {id:"overview",      label:"Overview",      icon:"⬡"},
          {id:"my-requests",   label:"My Requests",   icon:"◈"},
          {id:"vendors",       label:"Find Vendors",  icon:"◇"},
          {id:"notifications", label:"Notifications", icon:"🔔"},
        ]} active={tab} onChange={id=>navigate(id==="overview"?"/dashboard":`/dashboard/${id}`)}/>
      </div>
      {tab==="overview"      && <BuyerOverview    toast={toast}/>}
      {tab==="my-requests"   && <MyRequests       toast={toast}/>}
      {tab==="vendors"       && <FindVendors      toast={toast}/>}
      {tab==="notifications" && <Notifications    toast={toast}/>}
    </Layout>
  );
}

function BuyerOverview({ toast }) {
  const navigate = useNavigate();
  const [reqs, setReqs]       = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    Promise.allSettled([buyerAPI.getMyRequests(),vendorAPI.getRanked()])
      .then(([r,v])=>{ if(r.status==="fulfilled") setReqs(r.value.data); if(v.status==="fulfilled") setVendors(v.value.data); })
      .finally(()=>setLoading(false));
  },[]);

  if(loading) return <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>{[...Array(3)].map((_,i)=><div key={i} className="skeleton" style={{height:100}}/>)}</div>;
  const active = reqs.filter(r=>r.status==="active").length;
  const totalBids = reqs.reduce((sum,r)=>sum+(r.bid_count||0),0);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:24,animation:"fadeUp 0.4s ease"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>
        <StatCard label="Total Requests"   value={reqs.length}    icon="◈" color="var(--accent)"/>
        <StatCard label="Active Requests"  value={active}          icon="⬡" color="var(--accent3)" sub={`${reqs.length-active} closed`}/>
        <StatCard label="Bids Received"    value={totalBids}       icon="📨" color="var(--accent2)"/>
        <StatCard label="Verified Vendors" value={vendors.length}  icon="◇" color="var(--warn)"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
        <Card>
          <SectionHeader title="Recent Requests" action={<Btn size="sm" variant="ghost" onClick={()=>navigate("/dashboard/my-requests")}>View all</Btn>}/>
          {reqs.length===0?<Empty icon="◈" title="No requests yet"/>:(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {reqs.slice(0,4).map(r=>(
                <div key={r.id} style={{padding:12,background:"var(--bg2)",borderRadius:"var(--radius-sm)",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div><div style={{fontWeight:600,fontSize:14,marginBottom:2}}>{r.title}</div><div style={{fontSize:12,color:"var(--text3)"}}>{r.category} · {r.bid_count||0} bids</div></div>
                  <span className={`badge ${r.status}`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <SectionHeader title="Top Vendors" action={<Btn size="sm" variant="ghost" onClick={()=>navigate("/dashboard/vendors")}>Find more</Btn>}/>
          {vendors.length===0?<Empty icon="◇" title="No verified vendors"/>:(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {vendors.slice(0,4).map((v,i)=>(
                <div key={v.vendor_id} style={{padding:12,background:"var(--bg2)",borderRadius:"var(--radius-sm)",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:28,height:28,background:"var(--accent)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"white",flexShrink:0}}>{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13}}>{v.name}</div>
                    <div style={{fontSize:11,color:"var(--text3)"}}>ESG: {v.esg_score?.toFixed(0)} · {v.esg_band||"Baseline"}</div>
                  </div>
                  {v.is_women_owned&&<span style={{fontSize:10,padding:"2px 8px",background:"rgba(244,114,182,0.1)",color:"#f472b6",borderRadius:20,border:"1px solid rgba(244,114,182,0.2)"}}>Women-led</span>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function MyRequests({ toast }) {
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [aiModal, setAiModal]     = useState(null);
  const [aiResults, setAiResults] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [bidsModal, setBidsModal] = useState(null);
  const [bids, setBids]           = useState([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [filter, setFilter]       = useState("all");
  const [form, setForm] = useState({title:"",description:"",category:"",location:"",budget:"",deadline:"",impact_requirements:"",min_esg_score:0});
  const [saving, setSaving]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmClose, setConfirmClose]   = useState(null);
  const [confirmReopen, setConfirmReopen] = useState(null);

  const load = ()=>buyerAPI.getMyRequests().then(r=>setRequests(r.data)).finally(()=>setLoading(false));
  useEffect(()=>{load();},[]);

  const create = async()=>{
    setSaving(true);
    try{await buyerAPI.createRequest(form);toast.success("Request posted!");setModal(false);setForm({title:"",description:"",category:"",location:"",budget:"",deadline:"",impact_requirements:"",min_esg_score:0});load();}
    catch(err){toast.error(err.response?.data?.detail||"Failed");}finally{setSaving(false);}
  };

  const viewBids = async r=>{
    setBidsModal(r);setBids([]);setBidsLoading(true);
    try{const res=await buyerAPI.getBidsOnRequest(r.id);setBids(res.data);}
    catch{toast.error("Failed to load bids");}finally{setBidsLoading(false);}
  };

  const updateBidStatus = async(bidId,status,note="")=>{
    try{await buyerAPI.updateBidStatus(bidId,{status,buyer_note:note});toast.success(`Bid ${status}`);viewBids(bidsModal);}
    catch{toast.error("Failed");}
  };

  const getAiMatch = async id=>{
    setAiModal(id);setAiResults(null);setAiLoading(true);
    try{const r=await buyerAPI.aiMatch(id);const m=r.data.matches?.matches||r.data.matches||[];setAiResults(Array.isArray(m)?m:[]);}
    catch{toast.error("AI matching failed");setAiResults([]);}finally{setAiLoading(false);}
  };

  const filtered = filter==="all"?requests:requests.filter(r=>r.status===filter);
  if(loading) return <div style={{display:"grid",gap:12}}>{[...Array(3)].map((_,i)=><div key={i} className="skeleton" style={{height:120}}/>)}</div>;

  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <SectionHeader title="My Procurement Requests" sub="Manage your sourcing requirements" action={<Btn onClick={()=>setModal(true)}>+ New Request</Btn>}/>
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {["all","active","completed","closed"].map(f=>(
          <Btn key={f} onClick={()=>setFilter(f)} variant={filter===f?"primary":"secondary"} size="sm">{f.charAt(0).toUpperCase()+f.slice(1)}</Btn>
        ))}
      </div>

      {filtered.length===0?<Empty icon="◈" title="No requests yet" desc="Post your first procurement requirement" action={<Btn onClick={()=>setModal(true)}>Post Request</Btn>}/>:(
        <div style={{display:"grid",gap:14}}>
          {filtered.map(r=>(
            <Card key={r.id}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,marginBottom:12}}>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"Syne",fontWeight:700,fontSize:16,marginBottom:4}}>{r.title}</div>
                  <div style={{color:"var(--text2)",fontSize:13,lineHeight:1.6,marginBottom:10}}>{r.description}</div>
                  <div style={{display:"flex",gap:12,fontSize:12,color:"var(--text3)",flexWrap:"wrap"}}>
                    {r.category&&<span className="badge active">{r.category}</span>}
                    {r.location&&<span>📍 {r.location}</span>}
                    {r.budget&&<span>💰 {r.budget}</span>}
                    {r.deadline&&<span>📅 {new Date(r.deadline).toLocaleDateString()}</span>}
                    {r.min_esg_score>0&&<span style={{color:"var(--accent3)"}}>🌱 Min ESG: {r.min_esg_score}</span>}
                  </div>
                  {r.impact_requirements&&<div style={{marginTop:8,fontSize:12,padding:"6px 10px",background:"rgba(52,211,153,0.08)",borderRadius:6,color:"var(--accent3)"}}>🌱 {r.impact_requirements}</div>}
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <span className={`badge ${r.status}`}>{r.status}</span>
                  {(r.bid_count||0)>0&&<div style={{marginTop:6,fontSize:12,color:"var(--accent)",fontWeight:600,cursor:"pointer"}} onClick={()=>viewBids(r)}>📨 {r.bid_count} bid{r.bid_count!==1?"s":""} →</div>}
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",borderTop:"1px solid var(--border)",paddingTop:12}}>
                {r.status==="active"&&<><Btn onClick={()=>getAiMatch(r.id)} variant="secondary" size="sm">🤖 AI Match</Btn><Btn onClick={()=>viewBids(r)} variant="secondary" size="sm">View Bids ({r.bid_count||0})</Btn><Btn onClick={()=>setConfirmClose(r.id)} variant="ghost" size="sm">Close</Btn></>}
                {(r.status==="closed"||r.status==="completed")&&<Btn onClick={()=>setConfirmReopen(r.id)} variant="success" size="sm">↺ Reopen</Btn>}
                <Btn onClick={()=>setConfirmDelete(r.id)} variant="danger" size="sm">Delete</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New Request Modal */}
      <Modal open={modal} onClose={()=>setModal(false)} title="Post Procurement Request" width={600}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Input label="Title *" placeholder="What do you need?" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
          <Textarea label="Description *" placeholder="Describe your requirement..." rows={4} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/>
          <Select label="Category (controlled taxonomy)" options={[{value:"",label:"Select category"},...SERVICE_CATEGORIES.map(c=>({value:c,label:c}))]} value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Location" placeholder="City, State" value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))}/>
            <Input label="Budget" placeholder="₹10,000–₹50,000" value={form.budget} onChange={e=>setForm(p=>({...p,budget:e.target.value}))}/>
            <Input label="Deadline" type="date" value={form.deadline} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))}/>
            <Input label="Min ESG Score (0–100)" type="number" min="0" max="100" value={form.min_esg_score} onChange={e=>setForm(p=>({...p,min_esg_score:Number(e.target.value)}))}/>
          </div>
          <Textarea label="Impact Requirements" placeholder="e.g. Prefer women-led vendors, MSME certified, local sourcing..." rows={2} value={form.impact_requirements} onChange={e=>setForm(p=>({...p,impact_requirements:e.target.value}))}/>
          <Btn onClick={create} loading={saving} fullWidth size="lg">Post Request</Btn>
        </div>
      </Modal>

      {/* Bids modal */}
      <Modal open={!!bidsModal} onClose={()=>{setBidsModal(null);setBids([]);}} title={`Bids — ${bidsModal?.title}`} width={640}>
        {bidsLoading?<div style={{textAlign:"center",padding:"40px 0"}}><div className="spinner" style={{width:40,height:40,margin:"0 auto 16px"}}/><div style={{color:"var(--text2)"}}>Loading bids...</div></div>
        :bids.length===0?<Empty icon="📨" title="No bids yet" desc="No vendors have submitted proposals yet"/>:(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {bids.map(b=>(
              <Card key={b.id} style={{borderLeft:`3px solid ${BID_STATUS_COLORS[b.status]||"var(--border)"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:10}}>
                  <div>
                    <div style={{fontFamily:"Syne",fontWeight:700,fontSize:15}}>{b.vendor_name}</div>
                    <div style={{fontSize:12,color:"var(--text2)",marginTop:2}}>
                      {b.vendor_location&&<span>📍 {b.vendor_location} · </span>}
                      {b.vendor_esg_score>0&&<span style={{color:"var(--accent3)"}}>ESG: {b.vendor_esg_score}/100 · </span>}
                      <span>{b.vendor_esg_band}</span>
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:18}}>{BID_STATUS_ICONS[b.status]}</div>
                    <div style={{fontSize:12,fontWeight:600,color:BID_STATUS_COLORS[b.status]}}>{b.status?.replace(/_/g," ")}</div>
                  </div>
                </div>
                <div style={{fontSize:13,color:"var(--text2)",lineHeight:1.6,marginBottom:10}}>{b.cover_note}</div>
                <div style={{display:"flex",gap:12,fontSize:12,color:"var(--text3)",marginBottom:12}}>
                  {b.proposed_price&&<span>💰 {b.proposed_price}</span>}
                  {b.timeline&&<span>⏱ {b.timeline}</span>}
                </div>
                {b.status==="submitted"&&(
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <Btn onClick={()=>updateBidStatus(b.id,"under_review")} variant="secondary" size="sm">👀 Under Review</Btn>
                    <Btn onClick={()=>updateBidStatus(b.id,"shortlisted")} variant="success" size="sm">⭐ Shortlist</Btn>
                    <Btn onClick={()=>updateBidStatus(b.id,"declined")} variant="danger" size="sm">✕ Decline</Btn>
                  </div>
                )}
                {b.status==="under_review"&&(
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <Btn onClick={()=>updateBidStatus(b.id,"shortlisted")} variant="success" size="sm">⭐ Shortlist</Btn>
                    <Btn onClick={()=>updateBidStatus(b.id,"awarded")} variant="primary" size="sm">🏆 Award</Btn>
                    <Btn onClick={()=>updateBidStatus(b.id,"declined")} variant="danger" size="sm">✕ Decline</Btn>
                  </div>
                )}
                {b.status==="shortlisted"&&(
                  <div style={{display:"flex",gap:8}}>
                    <Btn onClick={()=>updateBidStatus(b.id,"awarded")} variant="primary" size="sm">🏆 Award Contract</Btn>
                    <Btn onClick={()=>updateBidStatus(b.id,"declined")} variant="danger" size="sm">✕ Decline</Btn>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Modal>

      {/* AI Match Modal */}
      <Modal open={!!aiModal} onClose={()=>{setAiModal(null);setAiResults(null);}} title="🤖 AI Vendor Matching" width={520}>
        {aiLoading?<div style={{textAlign:"center",padding:"40px 0"}}><div className="spinner" style={{width:40,height:40,margin:"0 auto 16px"}}/><div style={{color:"var(--text2)"}}>Finding best vendors...</div></div>
        :aiResults?.length>0?(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {aiResults.map((m,i)=>(
              <div key={i} style={{padding:16,background:"var(--surface)",borderRadius:"var(--radius-sm)",border:"1px solid var(--border)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div style={{fontFamily:"Syne",fontWeight:700}}>{m.vendor_name||m.name}</div>
                  <span style={{background:"var(--accent)",color:"white",padding:"2px 10px",borderRadius:20,fontSize:12,fontWeight:700}}>{m.score}%</span>
                </div>
                <div style={{fontSize:13,color:"var(--text2)",lineHeight:1.6}}>{m.reason}</div>
              </div>
            ))}
          </div>
        ):aiResults!==null?<Empty icon="◇" title="No matches found" desc="No verified vendors match this requirement yet"/>:null}
      </Modal>

      <ConfirmModal open={!!confirmDelete} onClose={()=>setConfirmDelete(null)} onConfirm={async()=>{await buyerAPI.deleteRequest(confirmDelete);toast.success("Deleted");load();}} title="Delete Request" message="Permanently delete this request?" variant="danger"/>
      <ConfirmModal open={!!confirmClose} onClose={()=>setConfirmClose(null)} onConfirm={async()=>{await buyerAPI.closeRequest(confirmClose,{close_reason:"Closed by buyer"});toast.success("Closed");load();}} title="Close Request" message="Close this procurement request?" variant="danger"/>
      <ConfirmModal open={!!confirmReopen} onClose={()=>setConfirmReopen(null)} onConfirm={async()=>{await buyerAPI.reopenRequest(confirmReopen);toast.success("Reopened!");load();}} title="Reopen Request" message="Reopen this request? It will be visible to vendors again." variant="success"/>
    </div>
  );
}

function FindVendors({ toast }) {
  const [vendors, setVendors]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [category, setCategory]       = useState("");
  const [minEsg, setMinEsg]           = useState(0);
  const [certification, setCertification] = useState("");
  const [view, setView]               = useState("ranked");
  const [selected, setSelected]       = useState(null);
  const [vendorDetail, setVendorDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const openVendor = async vendor=>{
    setSelected(vendor);setDetailLoading(true);
    try{
      const id=vendor.vendor_id||vendor.id;
      const [profile,esg,rating]=await Promise.allSettled([vendorAPI.getVendor(id),vendorAPI.getESG(id),buyerAPI.getRating(id)]);
      setVendorDetail({profile:profile.status==="fulfilled"?profile.value.data:null,esg:esg.status==="fulfilled"?esg.value.data:[],rating:rating.status==="fulfilled"?rating.value.data:null});
    }catch{toast.error("Failed to load vendor");}finally{setDetailLoading(false);}
  };

  const load = async()=>{
    setLoading(true);
    try{
      if(view==="ranked"){const r=await vendorAPI.getRanked();setVendors(r.data);}
      else{const r=await vendorAPI.listVendors({search,category,min_esg:minEsg,certification});setVendors(r.data);}
    }catch{toast.error("Failed");}finally{setLoading(false);}
  };
  useEffect(()=>{load();},[view]);

  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <SectionHeader title="Find Vendors" sub="Browse verified impact vendors"/>
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:200}}><Input placeholder="Search vendors..." value={search} onChange={e=>setSearch(e.target.value)} icon="🔍"/></div>
        <Select options={[{value:"",label:"All Categories"},...SERVICE_CATEGORIES.map(c=>({value:c,label:c}))]} value={category} onChange={e=>setCategory(e.target.value)} style={{width:200}}/>
        <Select options={[{value:"",label:"Any Certification"},...CERT_TYPES.map(c=>({value:c,label:c.replace(/_/g," ")}))]} value={certification} onChange={e=>setCertification(e.target.value)} style={{width:180}}/>
        <Input placeholder="Min ESG Score" type="number" min="0" max="100" value={minEsg||""} onChange={e=>setMinEsg(Number(e.target.value))} style={{width:140}}/>
        <Btn onClick={load}>Search</Btn>
        <Btn onClick={()=>setView(v=>v==="ranked"?"all":"ranked")} variant="secondary">{view==="ranked"?"Show All":"Show Ranked"}</Btn>
      </div>

      {loading?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>{[...Array(6)].map((_,i)=><div key={i} className="skeleton" style={{height:180}}/>)}</div>
      :vendors.length===0?<Empty icon="◇" title="No vendors found" desc="Try different search terms"/>:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
          {vendors.map((v,i)=>(
            <Card key={v.vendor_id||v.id} glow={i===0&&view==="ranked"} onClick={()=>openVendor(v)}>
              {i===0&&view==="ranked"&&<div style={{marginBottom:10}}><span className="badge verified">🏆 Top Ranked</span></div>}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{fontFamily:"Syne",fontWeight:700,fontSize:15}}>{v.name||v.organization_name}</div>
                {v.is_women_owned&&<span style={{fontSize:10,padding:"2px 8px",background:"rgba(244,114,182,0.1)",color:"#f472b6",borderRadius:20,border:"1px solid rgba(244,114,182,0.2)",flexShrink:0}}>Women-led</span>}
              </div>
              {v.esg_band&&<div style={{fontSize:11,fontWeight:600,color:v.esg_score>=80?"var(--accent3)":v.esg_score>=60?"var(--warn)":"var(--danger)",marginBottom:6}}>{v.esg_band} · {v.esg_score}/100</div>}
              {v.location&&<div style={{fontSize:12,color:"var(--text2)",marginBottom:8}}>📍 {v.location}</div>}
              {v.description&&<div style={{fontSize:13,color:"var(--text2)",marginBottom:10,lineHeight:1.5}}>{v.description?.slice(0,80)}...</div>}
              {view==="ranked"&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,paddingTop:10,borderTop:"1px solid var(--border)"}}>
                  {[{l:"Rating",v:`⭐ ${v.avg_rating?.toFixed(1)}`,c:"var(--warn)"},{l:"ESG",v:v.esg_score?.toFixed(0),c:"var(--accent3)"},{l:"Score",v:v.final_score?.toFixed(0),c:"var(--accent)"}].map(s=>(
                    <div key={s.l} style={{textAlign:"center"}}><div style={{fontFamily:"Syne",fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:"var(--text3)"}}>{s.l}</div></div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Vendor detail modal */}
      <Modal open={!!selected} onClose={()=>{setSelected(null);setVendorDetail(null);}} title="Vendor Profile" width={600}>
        {detailLoading?<div style={{textAlign:"center",padding:"40px 0"}}><div className="spinner" style={{width:40,height:40,margin:"0 auto 16px"}}/></div>
        :vendorDetail?(
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:16}}>
              <div style={{width:52,height:52,background:"linear-gradient(135deg,var(--accent),var(--accent2))",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🏭</div>
              <div style={{flex:1}}>
                <h3 style={{fontFamily:"Syne",fontWeight:800,fontSize:19,marginBottom:4}}>{vendorDetail.profile?.organization_name||selected?.name}</h3>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                  {vendorDetail.profile?.is_women_owned&&<span style={{fontSize:11,padding:"2px 10px",background:"rgba(244,114,182,0.1)",color:"#f472b6",borderRadius:20,border:"1px solid rgba(244,114,182,0.2)"}}>Women-owned</span>}
                  {vendorDetail.profile?.location&&<span style={{fontSize:13,color:"var(--text2)"}}>📍 {vendorDetail.profile.location}</span>}
                  {vendorDetail.profile?.esg_band&&<span style={{fontSize:12,fontWeight:600,color:"var(--accent3)"}}>🌱 {vendorDetail.profile.esg_band} ({vendorDetail.profile.esg_score}/100)</span>}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"Syne",fontWeight:800,fontSize:20,color:"var(--warn)"}}>⭐ {vendorDetail.rating?.average_rating?.toFixed(1)||"—"}</div>
                <div style={{fontSize:11,color:"var(--text3)"}}>{vendorDetail.rating?.total_reviews||0} reviews</div>
              </div>
            </div>

            {vendorDetail.profile?.impact_statement&&<div style={{padding:"12px 16px",background:"rgba(52,211,153,0.06)",borderRadius:10,border:"1px solid rgba(52,211,153,0.2)",fontSize:14,color:"var(--text2)",lineHeight:1.7,fontStyle:"italic"}}>"{vendorDetail.profile.impact_statement}"</div>}
            {vendorDetail.profile?.description&&<div style={{background:"var(--bg)",borderRadius:10,padding:"14px 16px",border:"1px solid var(--border)",fontSize:13,color:"var(--text2)",lineHeight:1.7}}>{vendorDetail.profile.description}</div>}

            {vendorDetail.esg?.length>0&&(
              <div>
                <div style={{fontFamily:"Syne",fontWeight:700,fontSize:14,marginBottom:12,color:"var(--accent3)"}}>🌱 ESG Impact</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {[
                    {l:"Jobs Created",v:vendorDetail.esg[0].jobs_created,c:"var(--accent)",i:"👷"},
                    {l:"Women Employed",v:`${vendorDetail.esg[0].women_employees_pct||vendorDetail.esg[0].women_employed}${vendorDetail.esg[0].women_employees_pct?"%":""}`,c:"var(--accent2)",i:"👩"},
                    {l:"ESG Score",v:`${vendorDetail.esg[0].esg_score}/100`,c:"var(--accent3)",i:"🌱"},
                  ].map(m=>(
                    <div key={m.l} style={{padding:14,background:"var(--bg)",borderRadius:10,border:`1px solid ${m.c}25`,textAlign:"center"}}>
                      <div style={{fontSize:20,marginBottom:6}}>{m.i}</div>
                      <div style={{fontFamily:"Syne",fontWeight:800,fontSize:16,color:m.c}}>{m.v||"—"}</div>
                      <div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>{m.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Btn onClick={()=>{setSelected(null);setVendorDetail(null);}} variant="secondary" fullWidth>Close</Btn>
          </div>
        ):null}
      </Modal>
    </div>
  );
}

function Notifications({ toast }) {
  const [notes, setNotes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const load = ()=>buyerAPI.getNotifications().then(r=>setNotes(r.data)).finally(()=>setLoading(false));
  useEffect(()=>{load();},[]);
  const markAll = async()=>{try{await buyerAPI.markAllRead();toast.success("All read");load();}catch{}};
  const markOne = async id=>{try{await buyerAPI.markRead(id);load();}catch{}};
  if(loading) return <div style={{display:"grid",gap:8}}>{[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{height:60}}/>)}</div>;
  const unread = notes.filter(n=>!n.is_read).length;
  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <SectionHeader title="Notifications" sub={`${unread} unread`} action={unread>0&&<Btn onClick={markAll} variant="ghost" size="sm">Mark all read</Btn>}/>
      {notes.length===0?<Empty icon="🔔" title="No notifications" desc="You're all caught up!"/>:(
        <div style={{display:"flex",flexDirection:"column",gap:8,maxWidth:600}}>
          {notes.map(n=>(
            <div key={n.id} onClick={()=>!n.is_read&&markOne(n.id)}
              style={{padding:"16px 20px",background:n.is_read?"var(--surface)":"rgba(99,132,255,0.06)",border:`1px solid ${n.is_read?"var(--border)":"var(--border2)"}`,borderRadius:"var(--radius-sm)",cursor:n.is_read?"default":"pointer",display:"flex",alignItems:"flex-start",gap:12}}>
              <div style={{fontSize:20}}>{n.type==="success"?"✅":n.type==="warning"?"⚠️":"ℹ️"}</div>
              <div style={{flex:1}}><div style={{fontSize:14,lineHeight:1.6}}>{n.message}</div><div style={{fontSize:11,color:"var(--text3)",marginTop:4}}>{new Date(n.created_at).toLocaleString()}</div></div>
              {!n.is_read&&<div style={{width:8,height:8,background:"var(--accent)",borderRadius:"50%",flexShrink:0,marginTop:6}}/>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
