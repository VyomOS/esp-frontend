import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { vendorAPI, buyerAPI, bidAPI } from "../api/api";
import { useToast } from "../context/ToastContext";
import { Card, StatCard, Btn, Input, Textarea, Select, Modal, SectionHeader, Tabs, Empty, Progress } from "../components/UI";
import ConfirmModal from "../components/ConfirmModal";
import { useLocation, useNavigate } from "react-router-dom";

const SERVICE_CATEGORIES = [
  "Logistics & Delivery","Facilities & Cleaning","Staffing & Training","Food & Catering",
  "Textiles & Apparel","IT & Digital Services","Green & Sustainability",
  "Handicrafts & Artisan","Healthcare & Wellness","Construction & Fitout",
];
const CERT_TYPES = ["women_led","msme_udyam","sc_st_owned","shg","social_enterprise","cooperative","fair_trade","weps_signatory"];
const SDG_TAGS   = ["SDG1_No_Poverty","SDG2_Zero_Hunger","SDG3_Good_Health","SDG4_Quality_Education","SDG5_Gender_Equality","SDG6_Clean_Water","SDG7_Clean_Energy","SDG8_Decent_Work","SDG9_Industry_Innovation","SDG10_Reduced_Inequalities","SDG11_Sustainable_Cities","SDG12_Responsible_Consumption","SDG13_Climate_Action","SDG14_Life_Below_Water","SDG15_Life_On_Land","SDG16_Peace_Justice","SDG17_Partnerships"];

function parseJSON(s) { try { return JSON.parse(s || "[]"); } catch { return []; } }
function toJSON(arr)  { return JSON.stringify(arr); }

function TagSelect({ label, options, selected, onChange, colorMap }) {
  const arr = typeof selected === "string" ? parseJSON(selected) : (selected || []);
  const toggle = v => {
    const next = arr.includes(v) ? arr.filter(x=>x!==v) : [...arr, v];
    onChange(toJSON(next));
  };
  return (
    <div>
      {label && <div style={{fontSize:12,fontWeight:600,color:"var(--text2)",marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>{label}</div>}
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {options.map(o=>{
          const sel = arr.includes(o);
          const color = colorMap?.[o] || "var(--accent)";
          return (
            <button key={o} onClick={()=>toggle(o)}
              style={{padding:"5px 12px",borderRadius:20,border:`1.5px solid ${sel?color:"var(--border)"}`,background:sel?`${color}15`:"var(--surface)",color:sel?color:"var(--text2)",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"Syne",transition:"all 0.15s"}}>
              {o.replace(/_/g," ")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function VendorDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast    = useToast();
  const tab = location.pathname.includes("profile")       ? "profile"
    : location.pathname.includes("services")              ? "services"
    : location.pathname.includes("documents")             ? "documents"
    : location.pathname.includes("esg")                   ? "esg"
    : location.pathname.includes("my-bids")               ? "my-bids"
    : location.pathname.includes("requests")              ? "requests"
    : location.pathname.includes("notifications")         ? "notifications"
    : "overview";

  return (
    <Layout>
      <div style={{marginBottom:28}}>
        <Tabs tabs={[
          {id:"overview",       label:"Overview",       icon:"⬡"},
          {id:"profile",        label:"Profile",        icon:"◈"},
          {id:"services",       label:"Services",       icon:"◇"},
          {id:"documents",      label:"Documents",      icon:"◻"},
          {id:"esg",            label:"ESG",            icon:"🌱"},
          {id:"requests",       label:"Browse RFPs",    icon:"📋"},
          {id:"my-bids",        label:"My Bids",        icon:"📨"},
          {id:"notifications",  label:"Notifications",  icon:"🔔"},
        ]} active={tab} onChange={id=>navigate(id==="overview"?"/dashboard":`/dashboard/${id}`)}/>
      </div>
      {tab==="overview"      && <VendorOverview   toast={toast}/>}
      {tab==="profile"       && <VendorProfile    toast={toast}/>}
      {tab==="services"      && <VendorServices   toast={toast}/>}
      {tab==="documents"     && <VendorDocuments  toast={toast}/>}
      {tab==="esg"           && <VendorESG        toast={toast}/>}
      {tab==="requests"      && <BrowseRFPs       toast={toast}/>}
      {tab==="my-bids"       && <MyBids           toast={toast}/>}
      {tab==="notifications" && <VendorNotifs     toast={toast}/>}
    </Layout>
  );
}

function VendorOverview({ toast }) {
  const navigate = useNavigate();
  const [profile, setProfile]         = useState(null);
  const [completeness, setCompleteness] = useState(null);
  const [esgResult, setEsgResult]     = useState(null);
  const [gaps, setGaps]               = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(()=>{
    Promise.allSettled([
      vendorAPI.getMyProfile(), vendorAPI.completeness(),
      vendorAPI.esgCompliance(), vendorAPI.getCertGaps(),
    ]).then(([p,c,e,g])=>{
      if(p.status==="fulfilled") setProfile(p.value.data);
      if(c.status==="fulfilled") setCompleteness(c.value.data);
      if(e.status==="fulfilled") setEsgResult(e.value.data);
      if(g.status==="fulfilled") setGaps(g.value.data);
    }).finally(()=>setLoading(false));
  },[]);

  if(loading) return <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>{[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{height:100}}/>)}</div>;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:24,animation:"fadeUp 0.4s ease"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>
        <StatCard label="Profile Score"   value={`${completeness?.score||0}%`} icon="◈" color="var(--accent)"/>
        <StatCard label="ESG Score"       value={`${esgResult?.score||0}/100`}  icon="🌱" color={esgResult?.band_color||"var(--text2)"}/>
        <StatCard label="ESG Band"        value={esgResult?.band||"—"}          icon="🏆" color={esgResult?.band_color||"var(--text2)"}/>
        <StatCard label="GST Verified"    value={profile?.gstin_verified?"Yes":"No"} icon="✓" color={profile?.gstin_verified?"var(--accent3)":"var(--warn)"}/>
      </div>

      {/* Profile completeness */}
      {completeness&&(
        <Card glow={completeness.score>=80}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div>
              <h3 style={{fontFamily:"Syne",fontWeight:700,fontSize:18}}>Profile Completeness</h3>
              <p style={{color:"var(--text2)",fontSize:13,marginTop:4}}>Complete your profile to appear in buyer searches</p>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"Syne",fontWeight:800,fontSize:36,color:completeness.score>=80?"var(--accent3)":completeness.score>=50?"var(--warn)":"var(--danger)"}}>{completeness.score}</div>
              <div style={{fontSize:12,color:"var(--text2)"}}>/100</div>
            </div>
          </div>
          <Progress value={completeness.score} max={100} color={completeness.score>=80?"var(--accent3)":completeness.score>=50?"var(--warn)":"var(--danger)"}/>
          {completeness.tips?.length>0&&(
            <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:8}}>
              {completeness.tips.map((tip,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"var(--bg)",borderRadius:8,fontSize:13,color:"var(--text2)"}}>
                  <span style={{color:"var(--warn)"}}>💡</span>{tip}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ESG Score breakdown */}
      {esgResult&&(
        <Card>
          <h3 style={{fontFamily:"Syne",fontWeight:700,fontSize:18,marginBottom:16}}>ESG Score Breakdown</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
            {[
              {label:"Environmental",value:esgResult.e_score||0,max:30,color:"#10b981"},
              {label:"Social",       value:esgResult.s_score||0,max:45,color:"#6384ff"},
              {label:"Governance",   value:esgResult.g_score||0,max:25,color:"#f59e0b"},
            ].map(p=>(
              <div key={p.label} style={{padding:16,background:"var(--bg)",borderRadius:10,textAlign:"center",border:`1px solid ${p.color}20`}}>
                <div style={{fontFamily:"Syne",fontWeight:800,fontSize:24,color:p.color}}>{p.value}</div>
                <div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>/{p.max}</div>
                <div style={{fontSize:12,color:"var(--text2)",marginTop:4}}>{p.label}</div>
              </div>
            ))}
          </div>
          {esgResult.missing?.length>0&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {esgResult.missing.map((m,i)=><span key={i} style={{fontSize:11,padding:"3px 10px",background:"rgba(248,113,113,0.1)",color:"var(--danger)",borderRadius:20,border:"1px solid rgba(248,113,113,0.2)"}}>Missing: {m}</span>)}
            </div>
          )}
        </Card>
      )}

      {/* Certification gaps */}
      {gaps.length>0&&(
        <div>
          <h3 style={{fontFamily:"Syne",fontWeight:700,fontSize:18,marginBottom:12}}>🎯 Certification Gaps & Opportunities</h3>
          <div style={{display:"grid",gap:10}}>
            {gaps.slice(0,3).map((g,i)=>(
              <Card key={i} style={{border:`1px solid ${g.advisory_fee==="FREE"?"rgba(52,211,153,0.2)":"rgba(251,191,36,0.2)"}`}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"Syne",fontWeight:700,fontSize:15,marginBottom:4}}>{g.gap_type}</div>
                    <div style={{fontSize:13,color:"var(--text2)",lineHeight:1.6,marginBottom:8}}>{g.description}</div>
                    <div style={{fontSize:12,color:"var(--accent)"}}>{g.action}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontFamily:"Syne",fontWeight:700,fontSize:14,color:g.advisory_fee==="FREE"?"var(--accent3)":"var(--warn)"}}>{g.advisory_fee}</div>
                    <div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>advisory fee</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VendorProfile({ toast }) {
  const [form, setForm] = useState({organization_name:"",description:"",impact_statement:"",location:"",category:"",website:"",phone:"",year_founded:"",is_women_owned:false,women_ownership_percent:0,team_size_band:"",annual_turnover_band:"",certification_types:"[]",sdg_tags:"[]",service_categories:"[]",gstin:"",pan:"",cin:""});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [gstInput, setGstInput] = useState("");
  const [panInput, setPanInput] = useState("");
  const [cinInput, setCinInput] = useState("");
  const [verifying, setVerifying] = useState("");
  const [gstResult, setGstResult] = useState(null);
  const [panResult, setPanResult] = useState(null);
  const [mcaResult, setMcaResult] = useState(null);

  useEffect(()=>{
    vendorAPI.getMyProfile()
      .then(r=>{setForm({...form,...r.data});setHasProfile(true);setGstInput(r.data.gstin||"");setPanInput(r.data.pan||"");})
      .catch(()=>setHasProfile(false))
      .finally(()=>setLoading(false));
  },[]);

  const save = async()=>{
    setSaving(true);
    try{
      const payload = {...form,women_ownership_percent:Number(form.women_ownership_percent||0),year_founded:form.year_founded?Number(form.year_founded):null};
      if(hasProfile) await vendorAPI.updateProfile(payload);
      else{await vendorAPI.createProfile(payload);setHasProfile(true);}
      toast.success("Profile saved!");
    }catch(err){toast.error(err.response?.data?.detail||"Failed");}
    finally{setSaving(false);}
  };

  const verifyGST = async()=>{
    setVerifying("gst");
    try{const r=await vendorAPI.verifyGST({gstin:gstInput});setGstResult(r.data);if(r.data.success){toast.success("GST verified!");if(r.data.legal_name&&!form.organization_name)setForm(p=>({...p,organization_name:r.data.legal_name}));}}
    catch{toast.error("Verification failed");}finally{setVerifying("");}
  };
  const verifyPAN = async()=>{
    setVerifying("pan");
    try{const r=await vendorAPI.verifyPAN({pan:panInput});setPanResult(r.data);if(r.data.success){toast.success("PAN verified!");}}
    catch{toast.error("Verification failed");}finally{setVerifying("");}
  };
  const lookupMCA = async()=>{
    setVerifying("mca");
    try{const r=await vendorAPI.lookupCompany({cin:cinInput||undefined,company_name:cinInput?undefined:form.organization_name});setMcaResult(r.data);}
    catch{toast.error("Lookup failed");}finally{setVerifying("");}
  };

  if(loading) return <div className="skeleton" style={{height:400}}/>;

  const ResultBox = ({result})=>result?(
    <div style={{padding:"12px",background:result.success?"rgba(52,211,153,0.08)":"rgba(248,113,113,0.08)",borderRadius:8,border:`1px solid ${result.success?"rgba(52,211,153,0.2)":"rgba(248,113,113,0.2)"}`,fontSize:13,marginTop:8}}>
      {result.success?<div><div style={{fontWeight:600,color:"var(--accent3)",marginBottom:4}}>✓ {result.stub?"Format Valid (Stub)":"Verified"}</div>{result.legal_name&&<div>Business: {result.legal_name}</div>}{result.status&&<div>Status: {result.status}</div>}{result.name&&<div>Name: {result.name}</div>}{result.stub&&<div style={{color:"var(--warn)",marginTop:4,fontSize:11}}>⚠ {result.message}</div>}</div>
      :<div style={{color:"var(--danger)"}}>{result.error}</div>}
    </div>
  ):null;

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,animation:"fadeUp 0.4s ease"}}>
      {/* Left: Main profile */}
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <SectionHeader title={hasProfile?"Edit Profile":"Create Profile"} sub="Your public vendor profile"/>
        <Card>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Input label="Organization Name *" value={form.organization_name} onChange={e=>setForm(p=>({...p,organization_name:e.target.value}))} placeholder="Your company name"/>
            <Textarea label="Description *" rows={3} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Describe your services and impact..."/>
            <Input label="Impact Statement (1-2 sentences)" value={form.impact_statement} onChange={e=>setForm(p=>({...p,impact_statement:e.target.value}))} placeholder="We create sustainable livelihoods for..."/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Input label="Location" value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))} placeholder="City, State"/>
              <Input label="Phone" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="+91 XXXXX XXXXX"/>
              <Input label="Website" value={form.website} onChange={e=>setForm(p=>({...p,website:e.target.value}))} placeholder="https://..."/>
              <Input label="Year Founded" type="number" value={form.year_founded} onChange={e=>setForm(p=>({...p,year_founded:e.target.value}))} placeholder="2018"/>
              <Select label="Team Size" options={[{value:"",label:"Select"},{value:"1-10",label:"1–10 people"},{value:"11-50",label:"11–50 people"},{value:"51-200",label:"51–200 people"},{value:"200+",label:"200+ people"}]} value={form.team_size_band} onChange={e=>setForm(p=>({...p,team_size_band:e.target.value}))}/>
              <Select label="Annual Turnover" options={[{value:"",label:"Select"},{value:"<10L",label:"Less than ₹10L"},{value:"10L-1Cr",label:"₹10L – ₹1Cr"},{value:"1Cr-10Cr",label:"₹1Cr – ₹10Cr"},{value:"10Cr+",label:"₹10Cr+"}]} value={form.annual_turnover_band} onChange={e=>setForm(p=>({...p,annual_turnover_band:e.target.value}))}/>
            </div>

            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:14}}>
              <input type="checkbox" checked={form.is_women_owned} onChange={e=>setForm(p=>({...p,is_women_owned:e.target.checked}))}/>
              <span style={{fontWeight:600}}>Women-owned business</span>
            </label>
            {form.is_women_owned&&<Input label="Women Ownership %" type="number" min="0" max="100" value={form.women_ownership_percent} onChange={e=>setForm(p=>({...p,women_ownership_percent:e.target.value}))}/>}

            <TagSelect label="Service Categories (select all that apply)" options={SERVICE_CATEGORIES} selected={form.service_categories} onChange={v=>setForm(p=>({...p,service_categories:v}))}/>
            <TagSelect label="Certifications" options={CERT_TYPES} selected={form.certification_types} onChange={v=>setForm(p=>({...p,certification_types:v}))}/>
            <TagSelect label="SDG Alignment" options={SDG_TAGS} selected={form.sdg_tags} onChange={v=>setForm(p=>({...p,sdg_tags:v}))}/>

            <Btn onClick={save} loading={saving} fullWidth size="lg">{hasProfile?"Save Changes":"Create Profile"}</Btn>
          </div>
        </Card>
      </div>

      {/* Right: Verification */}
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <SectionHeader title="Verification" sub="Verify your business credentials"/>
        <Card>
          <h4 style={{fontFamily:"Syne",fontWeight:700,marginBottom:12}}>🏛 MCA Company Lookup</h4>
          <p style={{fontSize:13,color:"var(--text2)",marginBottom:12}}>Auto-fill from MCA21 registry using CIN or company name</p>
          <div style={{display:"flex",gap:8}}>
            <Input placeholder="Enter CIN or leave blank to use org name" value={cinInput} onChange={e=>setCinInput(e.target.value.toUpperCase())} style={{flex:1}}/>
            <Btn onClick={lookupMCA} loading={verifying==="mca"} size="sm">Lookup</Btn>
          </div>
          {mcaResult&&(
            <div style={{marginTop:8,padding:"12px",background:"rgba(99,132,255,0.06)",borderRadius:8,border:"1px solid var(--border2)",fontSize:13}}>
              {mcaResult.success?(
                <div>
                  {mcaResult.results?(<div>{mcaResult.results.map((r,i)=>(
                    <div key={i} style={{padding:"8px",background:"var(--surface)",borderRadius:6,marginBottom:6,cursor:"pointer"}} onClick={()=>{setForm(p=>({...p,organization_name:r.company_name,cin:r.cin}));toast.success("Details filled!");}}>
                      <div style={{fontWeight:600}}>{r.company_name}</div>
                      <div style={{fontSize:11,color:"var(--text3)"}}>{r.cin} · {r.status}</div>
                    </div>
                  ))}</div>):(
                    <div><div style={{fontWeight:600,color:"var(--accent3)",marginBottom:4}}>✓ {mcaResult.stub?"Lookup (Stub)":"Found"}</div><div>{mcaResult.registered_name}</div><div style={{fontSize:11,color:"var(--text3)"}}>{mcaResult.cin} · {mcaResult.status}</div>{mcaResult.stub&&<div style={{color:"var(--warn)",marginTop:4,fontSize:11}}>⚠ {mcaResult.message}</div>}</div>
                  )}
                </div>
              ):<div style={{color:"var(--danger)"}}>{mcaResult.error}</div>}
            </div>
          )}
        </Card>

        <Card>
          <h4 style={{fontFamily:"Syne",fontWeight:700,marginBottom:12}}>✅ GST Verification</h4>
          <div style={{display:"flex",gap:8}}>
            <Input placeholder="Enter GSTIN (15 chars)" value={gstInput} onChange={e=>setGstInput(e.target.value.toUpperCase())} style={{flex:1}}/>
            <Btn onClick={verifyGST} loading={verifying==="gst"} size="sm">Verify</Btn>
          </div>
          <ResultBox result={gstResult}/>
        </Card>

        <Card>
          <h4 style={{fontFamily:"Syne",fontWeight:700,marginBottom:12}}>🪪 PAN Verification</h4>
          <div style={{display:"flex",gap:8}}>
            <Input placeholder="Enter PAN (e.g. ABCDE1234F)" value={panInput} onChange={e=>setPanInput(e.target.value.toUpperCase())} style={{flex:1}}/>
            <Btn onClick={verifyPAN} loading={verifying==="pan"} size="sm">Verify</Btn>
          </div>
          <ResultBox result={panResult}/>
        </Card>

        <Card style={{background:"rgba(99,132,255,0.04)",border:"1px solid var(--border2)"}}>
          <h4 style={{fontFamily:"Syne",fontWeight:700,marginBottom:8}}>🔒 DigiLocker Integration</h4>
          <p style={{fontSize:13,color:"var(--text2)",lineHeight:1.6,marginBottom:12}}>Verify your Aadhaar, PAN, and certificates directly from DigiLocker — government-signed, tamper-proof. Integration coming soon pending government approval.</p>
          <Btn variant="secondary" size="sm" onClick={()=>window.open("https://partners.digitallocker.gov.in","_blank")}>Learn about DigiLocker →</Btn>
        </Card>
      </div>
    </div>
  );
}

function VendorServices({ toast }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState({title:"",description:"",category:"",price_range:"",unit:""});
  const [saving, setSaving]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [catalogues, setCatalogues] = useState([]);
  const [catFile, setCatFile]       = useState(null);
  const [uploading, setUploading]   = useState(false);

  const load = ()=>{
    vendorAPI.getMyServices().then(r=>setServices(r.data)).finally(()=>setLoading(false));
    vendorAPI.getMyCatalogues().then(r=>setCatalogues(r.data)).catch(()=>{});
  };
  useEffect(()=>{load();},[]);

  const save = async()=>{
    setSaving(true);
    try{await vendorAPI.addService(form);toast.success("Service added!");setModal(false);setForm({title:"",description:"",category:"",price_range:"",unit:""});load();}
    catch(err){toast.error(err.response?.data?.detail||"Failed");}finally{setSaving(false);}
  };

  const uploadCat = async()=>{
    if(!catFile){toast.error("Select a PDF");return;}
    setUploading(true);
    try{const fd=new FormData();fd.append("file",catFile);await vendorAPI.uploadCatalogue(fd);toast.success("Catalogue uploaded!");setCatFile(null);load();}
    catch(err){toast.error(err.response?.data?.detail||"Failed");}finally{setUploading(false);}
  };

  if(loading) return <div style={{display:"grid",gap:12}}>{[...Array(3)].map((_,i)=><div key={i} className="skeleton" style={{height:80}}/>)}</div>;

  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <SectionHeader title="Services & Products" sub="What you offer to buyers" action={<Btn onClick={()=>setModal(true)} size="sm">+ Add Service</Btn>}/>
      {services.length===0?<Empty icon="◇" title="No services yet" desc="Add services to appear in buyer searches" action={<Btn onClick={()=>setModal(true)}>Add First Service</Btn>}/>:(
        <div style={{display:"grid",gap:12,marginBottom:32}}>
          {services.map(s=>(
            <Card key={s.id} style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:"Syne",fontWeight:600,marginBottom:4}}>{s.title}</div>
                <div style={{color:"var(--text2)",fontSize:13,marginBottom:8}}>{s.description}</div>
                <div style={{display:"flex",gap:12,fontSize:12,color:"var(--text3)"}}>
                  {s.category&&<span className="badge active">{s.category}</span>}
                  {s.price_range&&<span>💰 {s.price_range}</span>}
                  {s.unit&&<span>📦 per {s.unit}</span>}
                </div>
              </div>
              <Btn onClick={()=>setConfirmDelete(s.id)} variant="danger" size="sm">Delete</Btn>
            </Card>
          ))}
        </div>
      )}

      <SectionHeader title="Product Catalogues" sub="Upload PDF catalogues (max 10MB)"/>
      <Card style={{marginBottom:16}}>
        <div style={{display:"flex",gap:12,alignItems:"flex-end",flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:200}}>
            <div style={{padding:16,border:`2px dashed ${catFile?"var(--accent3)":"var(--border)"}`,borderRadius:10,textAlign:"center",cursor:"pointer"}} onClick={()=>document.getElementById("cat-input").click()}>
              <div style={{fontSize:20,marginBottom:4}}>{catFile?"✅":"📋"}</div>
              <div style={{fontSize:13,color:"var(--text2)"}}>{catFile?catFile.name:"Click to select PDF"}</div>
              <input id="cat-input" type="file" accept=".pdf" onChange={e=>setCatFile(e.target.files[0])} style={{display:"none"}}/>
            </div>
          </div>
          <Btn onClick={uploadCat} loading={uploading}>Upload Catalogue</Btn>
        </div>
      </Card>
      {catalogues.length>0&&catalogues.map(c=>(
        <Card key={c.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:24}}>📋</span>
            <div><div style={{fontWeight:600,fontSize:14}}>{c.original_name}</div><div style={{fontSize:12,color:"var(--text3)"}}>{new Date(c.uploaded_at).toLocaleDateString()}</div></div>
          </div>
          <Btn onClick={async()=>{await vendorAPI.deleteCatalogue(c.id);toast.success("Deleted");load();}} variant="danger" size="sm">Delete</Btn>
        </Card>
      ))}

      <Modal open={modal} onClose={()=>setModal(false)} title="Add Service">
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Input label="Title *" placeholder="e.g. Organic Cotton Supply" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
          <Textarea label="Description" rows={3} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/>
          <Select label="Category (controlled taxonomy)" options={[{value:"",label:"Select category"},...SERVICE_CATEGORIES.map(c=>({value:c,label:c}))]} value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Price Range" placeholder="₹500–₹2000" value={form.price_range} onChange={e=>setForm(p=>({...p,price_range:e.target.value}))}/>
            <Input label="Unit" placeholder="kg, piece, hour" value={form.unit} onChange={e=>setForm(p=>({...p,unit:e.target.value}))}/>
          </div>
          <Btn onClick={save} loading={saving} fullWidth>Add Service</Btn>
        </div>
      </Modal>
      <ConfirmModal open={!!confirmDelete} onClose={()=>setConfirmDelete(null)} onConfirm={async()=>{await vendorAPI.deleteService(confirmDelete);toast.success("Deleted");load();}} title="Delete Service" message="Delete this service? This cannot be undone." variant="danger"/>
    </div>
  );
}

function VendorDocuments({ toast }) {
  const [docs, setDocs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile]       = useState(null);
  const [docType, setDocType] = useState("pan");
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const load = ()=>vendorAPI.getMyDocuments().then(r=>setDocs(r.data)).finally(()=>setLoading(false));
  useEffect(()=>{load();},[]);
  const upload = async()=>{
    if(!file){toast.error("Select a file");return;}
    setUploading(true);
    try{const fd=new FormData();fd.append("file",file);fd.append("document_type",docType);await vendorAPI.uploadDocument(fd);toast.success("Uploaded!");setFile(null);load();}
    catch(err){toast.error(err.response?.data?.detail||"Upload failed");}finally{setUploading(false);}
  };
  const statusColor={pending:"var(--warn)",verified:"var(--accent3)",rejected:"var(--danger)"};
  const statusIcon={pending:"⏳",verified:"✅",rejected:"❌"};
  if(loading) return <div className="skeleton" style={{height:300}}/>;
  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <SectionHeader title="KYC Documents" sub="Upload documents for admin verification"/>
      <Card style={{marginBottom:24}}>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}}>
          <Select label="Document Type" options={[{value:"pan",label:"PAN Card"},{value:"aadhaar",label:"Aadhaar Card"},{value:"gst",label:"GST Certificate"},{value:"registration",label:"Business Registration"},{value:"other",label:"Other"}]} value={docType} onChange={e=>setDocType(e.target.value)} style={{minWidth:180}}/>
          <div style={{flex:1,minWidth:200}}>
            <label style={{fontSize:12,fontWeight:600,color:"var(--text2)",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>File (PDF or Image)</label>
            <div style={{padding:16,border:`2px dashed ${file?"var(--accent3)":"var(--border)"}`,borderRadius:10,textAlign:"center",cursor:"pointer"}} onClick={()=>document.getElementById("doc-input").click()}>
              <div style={{fontSize:20,marginBottom:4}}>{file?"✅":"📄"}</div>
              <div style={{fontSize:13,color:"var(--text2)"}}>{file?file.name:"Click to select file"}</div>
              <input id="doc-input" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e=>setFile(e.target.files[0])} style={{display:"none"}}/>
            </div>
          </div>
          <Btn onClick={upload} loading={uploading}>Upload</Btn>
        </div>
      </Card>
      {docs.length===0?<Empty icon="◻" title="No documents" desc="Upload at least one document to get verified"/>:(
        <div style={{display:"grid",gap:10}}>
          {docs.map(d=>(
            <Card key={d.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,padding:"16px 20px"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontSize:28}}>📄</div>
                <div>
                  <div style={{fontFamily:"Syne",fontWeight:600,fontSize:14}}>{d.original_name}</div>
                  <div style={{fontSize:12,color:"var(--text3)",marginTop:2,display:"flex",alignItems:"center",gap:8}}>
                    <span className="badge pending">{d.document_type?.toUpperCase()}</span>
                    <span style={{color:statusColor[d.status]}}>{statusIcon[d.status]} {d.status.charAt(0).toUpperCase()+d.status.slice(1)}</span>
                  </div>
                  {d.status==="rejected"&&d.status_note&&<div style={{fontSize:12,color:"var(--danger)",marginTop:4}}>Reason: {d.status_note}</div>}
                </div>
              </div>
              <Btn onClick={()=>setConfirmDelete(d.id)} variant="danger" size="sm">Remove</Btn>
            </Card>
          ))}
        </div>
      )}
      <ConfirmModal open={!!confirmDelete} onClose={()=>setConfirmDelete(null)} onConfirm={async()=>{await vendorAPI.deleteDocument(confirmDelete);toast.success("Removed");load();}} title="Remove Document" message="Remove this document?" variant="danger"/>
    </div>
  );
}

function VendorESG({ toast }) {
  const [profile, setProfile]   = useState(null);
  const [existing, setExisting] = useState([]);
  const [form, setForm] = useState({
    year:new Date().getFullYear(),
    // E
    carbon_emissions:0,renewable_energy_pct:0,ev_fleet_pct:0,waste_recycling_pct:0,biodegradable_packaging_pct:0,water_consumption:0,carbon_offset_programme:false,
    // S
    total_employees:0,women_employees_pct:0,women_leadership_pct:0,sc_st_obc_pct:0,pwd_employees_pct:0,jobs_created:0,jobs_marginalised:0,living_wage_compliance:false,health_insurance_pct:0,training_hours_per_emp:0,community_sourcing_pct:0,
    // G
    women_ownership_pct:0,women_board_pct:0,grievance_mechanism:false,avg_payment_days:30,annual_report_filed:false,data_privacy_policy:false,
    // Legacy
    women_employed:0,carbon_saved:0,local_sourcing_pct:0,msme_certified:false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(()=>{
    vendorAPI.getMyProfile().then(r=>{setProfile(r.data);vendorAPI.getESG(r.data.id).then(e=>setExisting(e.data)).catch(()=>{});}).catch(()=>{});
  },[]);

  const save = async()=>{
    setSaving(true);
    try{
      const res = await vendorAPI.addESG(form);
      toast.success(`ESG submitted! Score: ${res.data.score}/100 — ${res.data.band}`);
      if(profile) vendorAPI.getESG(profile.id).then(e=>setExisting(e.data)).catch(()=>{});
    }catch(err){toast.error(err.response?.data?.detail||"Failed");}
    finally{setSaving(false);}
  };

  const F = ({label,field,type="number",min,max,step,bool}) => bool?(
    <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:14,padding:"6px 0"}}>
      <input type="checkbox" checked={!!form[field]} onChange={e=>setForm(p=>({...p,[field]:e.target.checked}))}/>
      <span>{label}</span>
    </label>
  ):(
    <Input label={label} type={type} min={min} max={max} step={step} value={form[field]} onChange={e=>setForm(p=>({...p,[field]:Number(e.target.value)}))}/>
  );

  const PillarCard = ({title,color,weight,children})=>(
    <Card style={{borderTop:`3px solid ${color}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h4 style={{fontFamily:"Syne",fontWeight:700,fontSize:16}}>{title}</h4>
        <span style={{fontSize:12,fontWeight:600,color,background:`${color}15`,padding:"3px 10px",borderRadius:20}}>{weight}% of total</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>{children}</div>
    </Card>
  );

  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <SectionHeader title="ESG Assessment" sub="25-field assessment · Environmental 30% · Social 45% · Governance 25%"/>
      {existing.slice(0,1).map(e=>(
        <Card key={e.id} glow style={{marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
            <div>
              <h3 style={{fontFamily:"Syne",fontWeight:800,fontSize:20}}>Latest Score {e.year&&`(${e.year})`}</h3>
              <p style={{color:"var(--text2)",fontSize:13,marginTop:4}}>{e.esg_band}</p>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"Syne",fontWeight:800,fontSize:44,color:e.esg_score>=80?"var(--accent3)":e.esg_score>=60?"var(--warn)":"var(--danger)"}}>{e.esg_score}</div>
              <div style={{fontSize:12,color:"var(--text2)"}}>/ 100</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginTop:16}}>
            {[{l:"Environmental",v:e.e_score,max:30,c:"#10b981"},{l:"Social",v:e.s_score,max:45,c:"#6384ff"},{l:"Governance",v:e.g_score,max:25,c:"#f59e0b"}].map(p=>(
              <div key={p.l} style={{textAlign:"center",padding:12,background:"var(--bg)",borderRadius:8}}>
                <div style={{fontFamily:"Syne",fontWeight:700,fontSize:20,color:p.c}}>{p.v}</div>
                <div style={{fontSize:11,color:"var(--text3)"}}>{p.l}/{p.max}</div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <PillarCard title="🌿 Environmental" color="#10b981" weight={30}>
            <F label="Carbon Emissions (tCO₂e/year)" field="carbon_emissions"/>
            <F label="Renewable Energy (%)" field="renewable_energy_pct" max={100}/>
            <F label="EV / Non-motorised Fleet (%)" field="ev_fleet_pct" max={100}/>
            <F label="Waste Recycling Rate (%)" field="waste_recycling_pct" max={100}/>
            <F label="Biodegradable Packaging (%)" field="biodegradable_packaging_pct" max={100}/>
            <F label="Water Consumption (litres/year)" field="water_consumption"/>
            <F label="Carbon Offset Programme" field="carbon_offset_programme" bool/>
          </PillarCard>

          <PillarCard title="🏛 Governance" color="#f59e0b" weight={25}>
            <F label="Women Ownership (%)" field="women_ownership_pct" max={100}/>
            <F label="Women on Board/Management (%)" field="women_board_pct" max={100}/>
            <F label="Average Days to Pay Suppliers" field="avg_payment_days"/>
            <F label="Formal Grievance Mechanism" field="grievance_mechanism" bool/>
            <F label="Annual Report / Audited Accounts Filed" field="annual_report_filed" bool/>
            <F label="Data Privacy Policy in Place" field="data_privacy_policy" bool/>
          </PillarCard>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <PillarCard title="👥 Social" color="#6384ff" weight={45}>
            <F label="Total Employees" field="total_employees"/>
            <F label="Women Employees (%)" field="women_employees_pct" max={100}/>
            <F label="Women in Leadership (%)" field="women_leadership_pct" max={100}/>
            <F label="SC/ST/OBC Employees (%)" field="sc_st_obc_pct" max={100}/>
            <F label="PwD Employees (%)" field="pwd_employees_pct" max={100}/>
            <F label="Jobs Created (last 12 months)" field="jobs_created"/>
            <F label="Jobs for Marginalised Communities" field="jobs_marginalised"/>
            <F label="Health Insurance Coverage (%)" field="health_insurance_pct" max={100}/>
            <F label="Training Hours per Employee/Year" field="training_hours_per_emp"/>
            <F label="Community Sourcing (%)" field="community_sourcing_pct" max={100}/>
            <F label="Living Wage Compliance" field="living_wage_compliance" bool/>
            <F label="MSME Certified" field="msme_certified" bool/>
          </PillarCard>

          <Btn onClick={save} loading={saving} fullWidth size="lg">Submit ESG Assessment</Btn>
        </div>
      </div>
    </div>
  );
}

function BrowseRFPs({ toast }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [bidModal, setBidModal] = useState(null);
  const [bidForm, setBidForm]   = useState({cover_note:"",proposed_price:"",timeline:""});
  const [submitting, setSubmitting] = useState(false);

  useEffect(()=>{buyerAPI.listRequests().then(r=>setRequests(r.data)).finally(()=>setLoading(false));},[]);

  const submitBid = async()=>{
    if(!bidForm.cover_note.trim()){toast.error("Write a cover note");return;}
    setSubmitting(true);
    try{
      await bidAPI.submit({request_id:bidModal.id,cover_note:bidForm.cover_note,proposed_price:bidForm.proposed_price,timeline:bidForm.timeline});
      toast.success("Bid submitted successfully!");
      setBidModal(null);setBidForm({cover_note:"",proposed_price:"",timeline:""});
    }catch(err){toast.error(err.response?.data?.detail||"Failed to submit bid");}
    finally{setSubmitting(false);}
  };

  const filtered = requests.filter(r=>r.title.toLowerCase().includes(search.toLowerCase())||r.description.toLowerCase().includes(search.toLowerCase()));
  if(loading) return <div style={{display:"grid",gap:12}}>{[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{height:100}}/>)}</div>;

  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <SectionHeader title="Browse RFPs" sub="Active procurement requests from buyers"/>
      <Input placeholder="Search requests..." value={search} onChange={e=>setSearch(e.target.value)} icon="🔍" style={{marginBottom:20}}/>
      {filtered.length===0?<Empty icon="📋" title="No requests found"/>:(
        <div style={{display:"grid",gap:12}}>
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
                    <span style={{color:"var(--text3)"}}>📨 {r.bid_count||0} bids</span>
                  </div>
                  {r.impact_requirements&&<div style={{marginTop:8,fontSize:12,padding:"6px 10px",background:"rgba(52,211,153,0.08)",borderRadius:6,color:"var(--accent3)"}}>🌱 Impact: {r.impact_requirements}</div>}
                </div>
                <Btn onClick={()=>setBidModal(r)} size="sm">Submit Bid →</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!bidModal} onClose={()=>setBidModal(null)} title="Submit Proposal" width={540}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{padding:"12px 16px",background:"var(--bg)",borderRadius:10,border:"1px solid var(--border)"}}>
            <div style={{fontFamily:"Syne",fontWeight:700,fontSize:15}}>{bidModal?.title}</div>
            <div style={{fontSize:13,color:"var(--text2)",marginTop:4}}>{bidModal?.description?.slice(0,120)}...</div>
          </div>
          <Textarea label="Cover Note *" placeholder="Describe why you are the right vendor for this requirement, your experience, and approach..." rows={5} value={bidForm.cover_note} onChange={e=>setBidForm(p=>({...p,cover_note:e.target.value}))}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Proposed Price" placeholder="₹50,000" value={bidForm.proposed_price} onChange={e=>setBidForm(p=>({...p,proposed_price:e.target.value}))}/>
            <Input label="Timeline" placeholder="3 weeks, 2 months..." value={bidForm.timeline} onChange={e=>setBidForm(p=>({...p,timeline:e.target.value}))}/>
          </div>
          <Btn onClick={submitBid} loading={submitting} fullWidth size="lg">Submit Proposal →</Btn>
        </div>
      </Modal>
    </div>
  );
}

function MyBids({ toast }) {
  const [bids, setBids]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmWithdraw, setConfirmWithdraw] = useState(null);

  const load = ()=>bidAPI.myBids().then(r=>setBids(r.data)).finally(()=>setLoading(false));
  useEffect(()=>{load();},[]);

  const statusColor={submitted:"var(--accent)",under_review:"var(--warn)",shortlisted:"var(--accent2)",awarded:"var(--accent3)",declined:"var(--danger)"};
  const statusIcon={submitted:"📨",under_review:"👀",shortlisted:"⭐",awarded:"🏆",declined:"❌"};

  if(loading) return <div style={{display:"grid",gap:12}}>{[...Array(3)].map((_,i)=><div key={i} className="skeleton" style={{height:120}}/>)}</div>;

  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <SectionHeader title="My Bids" sub={`${bids.length} proposals submitted`}/>
      {bids.length===0?<Empty icon="📨" title="No bids yet" desc="Browse RFPs and submit your first proposal"/>:(
        <div style={{display:"grid",gap:12}}>
          {bids.map(b=>(
            <Card key={b.id}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,marginBottom:12}}>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"Syne",fontWeight:700,fontSize:16,marginBottom:4}}>{b.request_title}</div>
                  <div style={{fontSize:12,color:"var(--text2)",marginBottom:8}}>Buyer: {b.buyer_name} · Category: {b.request_category}</div>
                  <div style={{fontSize:13,color:"var(--text2)",lineHeight:1.6,marginBottom:8}}>{b.cover_note?.slice(0,150)}...</div>
                  <div style={{display:"flex",gap:12,fontSize:12,color:"var(--text3)"}}>
                    {b.proposed_price&&<span>💰 {b.proposed_price}</span>}
                    {b.timeline&&<span>⏱ {b.timeline}</span>}
                    <span>📅 {new Date(b.created_at).toLocaleDateString()}</span>
                  </div>
                  {b.buyer_note&&<div style={{marginTop:8,fontSize:12,padding:"8px 12px",background:"var(--bg)",borderRadius:8,border:"1px solid var(--border)",color:"var(--text2)"}}>💬 Buyer note: {b.buyer_note}</div>}
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:18}}>{statusIcon[b.status]}</div>
                  <div style={{fontFamily:"Syne",fontWeight:700,fontSize:13,color:statusColor[b.status],marginTop:4}}>{b.status.replace(/_/g," ")}</div>
                </div>
              </div>
              {["submitted","under_review"].includes(b.status)&&(
                <div style={{borderTop:"1px solid var(--border)",paddingTop:12}}>
                  <Btn onClick={()=>setConfirmWithdraw(b.id)} variant="danger" size="sm">Withdraw Bid</Btn>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      <ConfirmModal open={!!confirmWithdraw} onClose={()=>setConfirmWithdraw(null)} onConfirm={async()=>{await bidAPI.withdraw(confirmWithdraw);toast.success("Bid withdrawn");load();}} title="Withdraw Bid" message="Withdraw this bid? You can resubmit later." variant="danger"/>
    </div>
  );
}

function VendorNotifs({ toast }) {
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
              style={{padding:"16px 20px",background:n.is_read?"var(--surface)":"rgba(99,132,255,0.06)",border:`1px solid ${n.is_read?"var(--border)":"var(--border2)"}`,borderRadius:"var(--radius-sm)",cursor:n.is_read?"default":"pointer",display:"flex",alignItems:"flex-start",gap:12,transition:"all 0.2s"}}>
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
