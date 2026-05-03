import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { vendorAPI, buyerAPI } from "../api/api";
import { useToast } from "../context/ToastContext";
import { Card, StatCard, Btn, Input, Textarea, Select, Modal, SectionHeader, Tabs, Empty, Progress } from "../components/UI";
import ConfirmModal from "../components/ConfirmModal";

import { useLocation, useNavigate } from "react-router-dom";

export default function VendorDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast    = useToast();
  const tab = location.pathname.includes("profile")        ? "profile"
    : location.pathname.includes("services")               ? "services"
    : location.pathname.includes("documents")              ? "documents"
    : location.pathname.includes("esg")                    ? "esg"
    : location.pathname.includes("requests")               ? "requests"
    : location.pathname.includes("notifications")          ? "notifications"
    : "overview";

  return (
    <Layout>
      <div style={{ marginBottom:28 }}>
        <Tabs tabs={[
          { id:"overview",       label:"Overview",       icon:"⬡" },
          { id:"profile",        label:"Profile",        icon:"◈" },
          { id:"services",       label:"Services",       icon:"◇" },
          { id:"documents",      label:"Documents",      icon:"◻" },
          { id:"esg",            label:"ESG",            icon:"◉" },
          { id:"requests",       label:"Requests",       icon:"◈" },
          { id:"notifications",  label:"Notifications",  icon:"🔔" },
        ]} active={tab} onChange={id=>navigate(id==="overview"?"/dashboard":`/dashboard/${id}`)} />
      </div>
      {tab==="overview"  && <VendorOverview  toast={toast}/>}
      {tab==="profile"   && <VendorProfile   toast={toast}/>}
      {tab==="services"  && <VendorServices  toast={toast}/>}
      {tab==="documents" && <VendorDocuments toast={toast}/>}
      {tab==="esg"       && <VendorESG       toast={toast}/>}
      {tab==="requests"      && <BrowseRequests       toast={toast}/>}
      {tab==="notifications" && <VendorNotifications toast={toast}/>}
    </Layout>
  );
}

function VendorOverview({ toast }) {
  const [profile, setProfile] = useState(null);
  const [completeness, setCompleteness] = useState(null);
  const [esgCompliance, setEsgCompliance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      vendorAPI.getMyProfile(),
      vendorAPI.completeness(),
      vendorAPI.esgCompliance(),
    ]).then(([p, c, e]) => {
      if (p.status==="fulfilled") setProfile(p.value.data);
      if (c.status==="fulfilled") setCompleteness(c.value.data);
      if (e.status==="fulfilled") setEsgCompliance(e.value.data);
    }).finally(()=>setLoading(false));
  }, []);

  if (loading) return <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>{[...Array(3)].map((_,i)=><div key={i} className="skeleton" style={{height:100}}/>)}</div>;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:24,animation:"fadeUp 0.4s ease"}}>
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>
        <StatCard label="Profile Completeness" value={`${completeness?.score||0}%`} icon="◈" color="var(--accent)"/>
        <StatCard label="ESG Status" value={esgCompliance?.status||"—"} icon="◉" color={esgCompliance?.color||"var(--text2)"}/>
        <StatCard label="GST Verified" value={profile?.gstin_verified?"Yes":"No"} icon="✓" color={profile?.gstin_verified?"var(--accent3)":"var(--warn)"}/>
        <StatCard label="PAN Verified" value={profile?.pan_verified?"Yes":"No"} icon="✓" color={profile?.pan_verified?"var(--accent3)":"var(--warn)"}/>
      </div>

      {/* Profile completeness */}
      {completeness && (
        <Card glow={completeness.score>=80}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div>
              <h3 style={{fontFamily:"Syne",fontWeight:700,fontSize:18}}>Profile Completeness</h3>
              <p style={{color:"var(--text2)",fontSize:13,marginTop:4}}>Complete your profile to attract more buyers</p>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"Syne",fontWeight:800,fontSize:36,color:completeness.color}}>{completeness.score}</div>
              <div style={{fontSize:12,color:"var(--text2)"}}>/ 100</div>
            </div>
          </div>
          <Progress value={completeness.score} max={100} color={completeness.color} />
          {completeness.tips?.length>0 && (
            <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:8}}>
              {completeness.tips.map((tip,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"var(--bg)",borderRadius:"var(--radius-sm)",fontSize:13,color:"var(--text2)"}}>
                  <span style={{color:"var(--warn)"}}>💡</span>{tip}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ESG compliance */}
      {esgCompliance && (
        <Card style={{borderColor:esgCompliance.badge==="verified"?"rgba(52,211,153,0.3)":esgCompliance.badge==="pending"?"rgba(251,191,36,0.3)":"rgba(248,113,113,0.3)"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:16}}>
            <div style={{fontSize:32}}>{esgCompliance.badge==="verified"?"✅":esgCompliance.badge==="pending"?"⚠️":"❌"}</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                <div style={{fontFamily:"Syne",fontWeight:700,fontSize:16}}>ESG Compliance</div>
                <span className={`badge ${esgCompliance.badge}`}>{esgCompliance.status}</span>
              </div>
              <div style={{color:"var(--text2)",fontSize:13,lineHeight:1.6,marginBottom:esgCompliance.missing?.length?12:0}}>{esgCompliance.message}</div>
              {esgCompliance.missing?.length>0 && (
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {esgCompliance.missing.map((m,i)=>(
                    <span key={i} style={{fontSize:11,padding:"3px 10px",background:"rgba(248,113,113,0.1)",color:"var(--danger)",borderRadius:20,border:"1px solid rgba(248,113,113,0.2)"}}>Missing: {m}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function VendorProfile({ toast }) {
  const [form, setForm] = useState({organization_name:"",description:"",location:"",category:"",website:"",phone:""});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
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
      .then(r=>{setForm(r.data);setHasProfile(true);setGstInput(r.data.gstin||"");setPanInput(r.data.pan||"");})
      .catch(()=>setHasProfile(false))
      .finally(()=>setLoading(false));
  },[]);

  const save = async()=>{
    setSaving(true);
    try{
      if(hasProfile) await vendorAPI.updateProfile(form);
      else{await vendorAPI.createProfile(form);setHasProfile(true);}
      toast.success("Profile saved!");
    }catch(err){toast.error(err.response?.data?.detail||"Failed");}
    finally{setSaving(false);}
  };

  const verifyGST = async()=>{
    setVerifying("gst");
    try{const r=await vendorAPI.verifyGST({gstin:gstInput});setGstResult(r.data);if(r.data.success&&r.data.legal_name&&!form.organization_name){setForm(p=>({...p,organization_name:r.data.legal_name}));}if(r.data.success){toast.success("GST verified!");}else{toast.error(r.data.error);}}
    catch{toast.error("Verification failed");}
    finally{setVerifying("");}
  };

  const verifyPAN = async()=>{
    setVerifying("pan");
    try{const r=await vendorAPI.verifyPAN({pan:panInput});setPanResult(r.data);if(r.data.success){toast.success("PAN verified!");}else{toast.error(r.data.error);}}
    catch{toast.error("Verification failed");}
    finally{setVerifying("");}
  };

  const lookupMCA = async()=>{
    setVerifying("mca");
    try{const r=await vendorAPI.lookupCompany({cin:cinInput||undefined,company_name:cinInput?undefined:form.organization_name});setMcaResult(r.data);}
    catch{toast.error("Lookup failed");}
    finally{setVerifying("");}
  };

  if(loading) return <div className="skeleton" style={{height:400}}/>;
  const cats=[{value:"",label:"Select category"},"Agriculture","Technology","Manufacturing","Services","Healthcare","Education","Construction","Retail"].map(c=>typeof c==="string"?{value:c,label:c}:c);

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,animation:"fadeUp 0.4s ease"}}>
      {/* Profile form */}
      <div>
        <SectionHeader title={hasProfile?"Edit Profile":"Create Profile"} sub="Your public vendor profile"/>
        <Card>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <Input label="Organization Name *" placeholder="Your company name" value={form.organization_name} onChange={e=>setForm(p=>({...p,organization_name:e.target.value}))}/>
            <Textarea label="Description *" placeholder="Describe your services..." rows={4} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Input label="Location" placeholder="City, State" value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))}/>
              <Select label="Category" options={cats} value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}/>
              <Input label="Website" placeholder="https://..." value={form.website} onChange={e=>setForm(p=>({...p,website:e.target.value}))}/>
              <Input label="Phone" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/>
            </div>
            <Btn onClick={save} loading={saving} fullWidth size="lg">{hasProfile?"Save Changes":"Create Profile"}</Btn>
          </div>
        </Card>
      </div>

      {/* Verification panel */}
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {/* GST */}
        <Card>
          <h4 style={{fontFamily:"Syne",fontWeight:700,marginBottom:16}}>GST Verification</h4>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <Input placeholder="Enter GSTIN (15 chars)" value={gstInput} onChange={e=>setGstInput(e.target.value.toUpperCase())} style={{flex:1}}/>
            <Btn onClick={verifyGST} loading={verifying==="gst"} size="sm">Verify</Btn>
          </div>
          {gstResult&&(
            <div style={{padding:"12px",background:gstResult.success?"rgba(52,211,153,0.08)":"rgba(248,113,113,0.08)",borderRadius:8,border:`1px solid ${gstResult.success?"rgba(52,211,153,0.2)":"rgba(248,113,113,0.2)"}`,fontSize:13}}>
              {gstResult.success?(
                <div>
                  <div style={{fontWeight:600,color:"var(--accent3)",marginBottom:4}}>✓ {gstResult.stub?"Format Valid (Stub)":"Verified"}</div>
                  {gstResult.legal_name&&<div>Business: {gstResult.legal_name}</div>}
                  {gstResult.status&&<div>Status: {gstResult.status}</div>}
                  {gstResult.stub&&<div style={{color:"var(--warn)",marginTop:4,fontSize:11}}>⚠ {gstResult.message}</div>}
                </div>
              ):<div style={{color:"var(--danger)"}}>{gstResult.error}</div>}
            </div>
          )}
        </Card>

        {/* PAN */}
        <Card>
          <h4 style={{fontFamily:"Syne",fontWeight:700,marginBottom:16}}>PAN Verification</h4>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <Input placeholder="Enter PAN (e.g. ABCDE1234F)" value={panInput} onChange={e=>setPanInput(e.target.value.toUpperCase())} style={{flex:1}}/>
            <Btn onClick={verifyPAN} loading={verifying==="pan"} size="sm">Verify</Btn>
          </div>
          {panResult&&(
            <div style={{padding:"12px",background:panResult.success?"rgba(52,211,153,0.08)":"rgba(248,113,113,0.08)",borderRadius:8,border:`1px solid ${panResult.success?"rgba(52,211,153,0.2)":"rgba(248,113,113,0.2)"}`,fontSize:13}}>
              {panResult.success?(
                <div>
                  <div style={{fontWeight:600,color:"var(--accent3)",marginBottom:4}}>✓ {panResult.stub?"Format Valid (Stub)":"Verified"}</div>
                  {panResult.name&&<div>Name: {panResult.name}</div>}
                  {panResult.pan_type&&<div>Type: {panResult.pan_type}</div>}
                  {panResult.stub&&<div style={{color:"var(--warn)",marginTop:4,fontSize:11}}>⚠ {panResult.message}</div>}
                </div>
              ):<div style={{color:"var(--danger)"}}>{panResult.error}</div>}
            </div>
          )}
        </Card>

        {/* MCA */}
        <Card>
          <h4 style={{fontFamily:"Syne",fontWeight:700,marginBottom:4}}>MCA Company Lookup</h4>
          <p style={{color:"var(--text2)",fontSize:13,marginBottom:16}}>Auto-fill your company details from MCA database</p>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <Input placeholder="Enter CIN or leave blank to use org name" value={cinInput} onChange={e=>setCinInput(e.target.value.toUpperCase())} style={{flex:1}}/>
            <Btn onClick={lookupMCA} loading={verifying==="mca"} size="sm">Lookup</Btn>
          </div>
          {mcaResult&&(
            <div style={{padding:"12px",background:mcaResult.success?"rgba(99,132,255,0.08)":"rgba(248,113,113,0.08)",borderRadius:8,border:`1px solid ${mcaResult.success?"var(--border2)":"rgba(248,113,113,0.2)"}`,fontSize:13}}>
              {mcaResult.success?(
                <div>
                  {mcaResult.results?(
                    <div>
                      <div style={{fontWeight:600,marginBottom:8}}>Found {mcaResult.results.length} companies:</div>
                      {mcaResult.results.map((r,i)=>(
                        <div key={i} style={{padding:"8px",background:"var(--surface)",borderRadius:6,marginBottom:6,cursor:"pointer"}}
                          onClick={()=>{setForm(p=>({...p,organization_name:r.company_name,cin:r.cin}));toast.success("Company details filled!");}}>
                          <div style={{fontWeight:600}}>{r.company_name}</div>
                          <div style={{fontSize:11,color:"var(--text3)"}}>{r.cin} · {r.status}</div>
                        </div>
                      ))}
                    </div>
                  ):(
                    <div>
                      <div style={{fontWeight:600,color:"var(--accent3)",marginBottom:4}}>✓ {mcaResult.stub?"Lookup (Stub)":"Found"}</div>
                      <div>{mcaResult.registered_name}</div>
                      <div style={{color:"var(--text3)",fontSize:11}}>{mcaResult.cin} · {mcaResult.status}</div>
                      {mcaResult.stub&&<div style={{color:"var(--warn)",marginTop:4,fontSize:11}}>⚠ {mcaResult.message}</div>}
                      {!mcaResult.stub&&<Btn size="sm" style={{marginTop:8}} onClick={()=>{setForm(p=>({...p,organization_name:mcaResult.registered_name,cin:mcaResult.cin}));toast.success("Details filled!");}}>Use This Company</Btn>}
                    </div>
                  )}
                </div>
              ):<div style={{color:"var(--danger)"}}>{mcaResult.error}</div>}
            </div>
          )}
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
    catch(err){toast.error(err.response?.data?.detail||"Failed");}
    finally{setSaving(false);}
  };

  const uploadCat = async()=>{
    if(!catFile){toast.error("Select a PDF file");return;}
    setUploading(true);
    try{const fd=new FormData();fd.append("file",catFile);await vendorAPI.uploadCatalogue(fd);toast.success("Catalogue uploaded!");setCatFile(null);load();}
    catch(err){toast.error(err.response?.data?.detail||"Upload failed");}
    finally{setUploading(false);}
  };

  const delCat = async id=>{
    try{await vendorAPI.deleteCatalogue(id);toast.success("Deleted");load();}
    catch{toast.error("Failed");}
  };

  if(loading) return <div style={{display:"grid",gap:12}}>{[...Array(3)].map((_,i)=><div key={i} className="skeleton" style={{height:80}}/>)}</div>;

  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <SectionHeader title="Services & Products" sub="What you offer to buyers" action={<Btn onClick={()=>setModal(true)} size="sm">+ Add Service</Btn>}/>
      {services.length===0?<Empty icon="◇" title="No services yet" desc="Add your services to appear in buyer searches" action={<Btn onClick={()=>setModal(true)}>Add First Service</Btn>}/>:(
        <div style={{display:"grid",gap:12,marginBottom:32}}>
          {services.map(s=>(
            <Card key={s.id} style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:"Syne",fontWeight:600,marginBottom:4}}>{s.title}</div>
                <div style={{color:"var(--text2)",fontSize:13,marginBottom:8}}>{s.description}</div>
                <div style={{display:"flex",gap:12,fontSize:12,color:"var(--text3)"}}>
                  {s.category&&<span>🏷 {s.category}</span>}
                  {s.price_range&&<span>💰 {s.price_range}</span>}
                  {s.unit&&<span>📦 per {s.unit}</span>}
                </div>
              </div>
              <Btn onClick={()=>setConfirmDelete(s.id)} variant="danger" size="sm">Delete</Btn>
            </Card>
          ))}
        </div>
      )}

      {/* Catalogues */}
      <SectionHeader title="Product Catalogues" sub="Upload PDF catalogues for buyers"/>
      <Card style={{marginBottom:16}}>
        <div style={{display:"flex",gap:12,alignItems:"flex-end",flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:200}}>
            <label style={{fontSize:12,fontWeight:600,color:"var(--text2)",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>PDF Catalogue (max 10MB)</label>
            <div style={{padding:16,border:`2px dashed ${catFile?"var(--accent3)":"var(--border)"}`,borderRadius:"var(--radius-sm)",textAlign:"center",cursor:"pointer",transition:"all 0.2s"}} onClick={()=>document.getElementById("cat-input").click()}>
              <div style={{fontSize:20,marginBottom:4}}>{catFile?"✅":"📋"}</div>
              <div style={{fontSize:13,color:"var(--text2)"}}>{catFile?catFile.name:"Click to select PDF"}</div>
              <input id="cat-input" type="file" accept=".pdf" onChange={e=>setCatFile(e.target.files[0])} style={{display:"none"}}/>
            </div>
          </div>
          <Btn onClick={uploadCat} loading={uploading}>Upload Catalogue</Btn>
        </div>
      </Card>
      {catalogues.length>0&&(
        <div style={{display:"grid",gap:8}}>
          {catalogues.map(c=>(
            <Card key={c.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:24}}>📋</span>
                <div><div style={{fontWeight:600,fontSize:14}}>{c.original_name}</div><div style={{fontSize:12,color:"var(--text3)"}}>{new Date(c.uploaded_at).toLocaleDateString()}</div></div>
              </div>
              <Btn onClick={()=>delCat(c.id)} variant="danger" size="sm">Delete</Btn>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={()=>setModal(false)} title="Add Service">
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Input label="Title *" placeholder="e.g. Organic Cotton Supply" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
          <Textarea label="Description *" placeholder="Describe your service..." value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Category" placeholder="Agriculture" value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}/>
            <Input label="Price Range" placeholder="₹500 - ₹2000" value={form.price_range} onChange={e=>setForm(p=>({...p,price_range:e.target.value}))}/>
            <Input label="Unit" placeholder="kg, piece, hour" value={form.unit} onChange={e=>setForm(p=>({...p,unit:e.target.value}))}/>
          </div>
          <Btn onClick={save} loading={saving} fullWidth>Add Service</Btn>
        </div>
      </Modal>

      <ConfirmModal open={!!confirmDelete} onClose={()=>setConfirmDelete(null)} onConfirm={async()=>{await vendorAPI.deleteService(confirmDelete);toast.success("Deleted");load();}} title="Delete Service" message="Are you sure you want to delete this service? This cannot be undone." variant="danger"/>
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
    if(!file){toast.error("Select a file first");return;}
    setUploading(true);
    try{const fd=new FormData();fd.append("file",file);fd.append("document_type",docType);await vendorAPI.uploadDocument(fd);toast.success("Document uploaded!");setFile(null);load();}
    catch(err){toast.error(err.response?.data?.detail||"Upload failed");}
    finally{setUploading(false);}
  };

  const docTypes=[{value:"pan",label:"PAN Card"},{value:"aadhaar",label:"Aadhaar Card"},{value:"gst",label:"GST Certificate"},{value:"registration",label:"Business Registration"},{value:"other",label:"Other"}];
  const fmt=bytes=>bytes<1024*1024?`${(bytes/1024).toFixed(1)} KB`:`${(bytes/(1024*1024)).toFixed(1)} MB`;
  const statusColor={pending:"var(--warn)",verified:"var(--accent3)",rejected:"var(--danger)"};
  const statusIcon={pending:"⏳",verified:"✅",rejected:"❌"};

  if(loading) return <div className="skeleton" style={{height:300}}/>;

  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <SectionHeader title="KYC Documents" sub="Upload documents for admin verification"/>
      <Card style={{marginBottom:24}}>
        <h4 style={{fontFamily:"Syne",fontWeight:600,marginBottom:16}}>Upload New Document</h4>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}}>
          <Select label="Document Type" options={docTypes} value={docType} onChange={e=>setDocType(e.target.value)} style={{minWidth:180}}/>
          <div style={{flex:1,minWidth:200}}>
            <label style={{fontSize:12,fontWeight:600,color:"var(--text2)",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>File (PDF or Image, max 10MB)</label>
            <div style={{padding:16,border:`2px dashed ${file?"var(--accent3)":"var(--border)"}`,borderRadius:"var(--radius-sm)",textAlign:"center",cursor:"pointer",transition:"all 0.2s"}} onClick={()=>document.getElementById("doc-file-input").click()}>
              <div style={{fontSize:20,marginBottom:4}}>{file?"✅":"📄"}</div>
              <div style={{fontSize:13,color:"var(--text2)"}}>{file?file.name:"Click to select file"}</div>
              <input id="doc-file-input" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e=>setFile(e.target.files[0])} style={{display:"none"}}/>
            </div>
          </div>
          <Btn onClick={upload} loading={uploading} variant={file?"primary":"secondary"}>Upload</Btn>
        </div>
      </Card>

      {docs.length===0?<Empty icon="◻" title="No documents uploaded" desc="Upload at least one document to get verified"/>:(
        <div style={{display:"grid",gap:10}}>
          {docs.map(d=>(
            <Card key={d.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,padding:"16px 20px"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontSize:28}}>📄</div>
                <div>
                  <div style={{fontFamily:"Syne",fontWeight:600,fontSize:14}}>{d.original_name}</div>
                  <div style={{fontSize:12,color:"var(--text3)",marginTop:2,display:"flex",alignItems:"center",gap:8}}>
                    <span className="badge pending">{d.document_type.toUpperCase()}</span>
                    <span style={{color:statusColor[d.status]}}>{statusIcon[d.status]} {d.status.charAt(0).toUpperCase()+d.status.slice(1)}</span>
                    {d.file_size&&<span>{fmt(d.file_size)}</span>}
                  </div>
                  {d.status==="rejected"&&d.status_note&&<div style={{fontSize:12,color:"var(--danger)",marginTop:4}}>Reason: {d.status_note}</div>}
                </div>
              </div>
              <Btn onClick={()=>setConfirmDelete(d.id)} variant="danger" size="sm">Remove</Btn>
            </Card>
          ))}
        </div>
      )}
      <ConfirmModal open={!!confirmDelete} onClose={()=>setConfirmDelete(null)} onConfirm={async()=>{await vendorAPI.deleteDocument(confirmDelete);toast.success("Deleted");load();}} title="Remove Document" message="Are you sure you want to remove this document?" variant="danger"/>
    </div>
  );
}

function VendorESG({ toast }) {
  const [profile, setProfile] = useState(null);
  const [existing, setExisting] = useState([]);
  const [form, setForm] = useState({jobs_created:0,women_employed:0,carbon_saved:0,local_sourcing_pct:0,msme_certified:false,year:new Date().getFullYear()});
  const [saving, setSaving] = useState(false);

  useEffect(()=>{
    vendorAPI.getMyProfile().then(r=>{setProfile(r.data);vendorAPI.getESG(r.data.id).then(e=>setExisting(e.data)).catch(()=>{});}).catch(()=>{});
  },[]);

  const save = async()=>{
    setSaving(true);
    try{
      await vendorAPI.addESG({...form,jobs_created:Number(form.jobs_created),women_employed:Number(form.women_employed),carbon_saved:Number(form.carbon_saved),local_sourcing_pct:Number(form.local_sourcing_pct)});
      toast.success("ESG metrics submitted!");
      if(profile) vendorAPI.getESG(profile.id).then(e=>setExisting(e.data)).catch(()=>{});
    }catch(err){toast.error(err.response?.data?.detail||"Failed");}
    finally{setSaving(false);}
  };

  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <SectionHeader title="ESG Metrics" sub="Environmental, Social & Governance impact data"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,maxWidth:800}}>
        <Card>
          <h4 style={{fontFamily:"Syne",fontWeight:700,marginBottom:20}}>Submit Report</h4>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Input label="Year" type="number" value={form.year} onChange={e=>setForm(p=>({...p,year:e.target.value}))}/>
            <Input label="Jobs Created" type="number" min="0" value={form.jobs_created} onChange={e=>setForm(p=>({...p,jobs_created:e.target.value}))}/>
            <Input label="Women Employed" type="number" min="0" value={form.women_employed} onChange={e=>setForm(p=>({...p,women_employed:e.target.value}))}/>
            <Input label="Carbon Saved (tonnes CO₂)" type="number" min="0" step="0.1" value={form.carbon_saved} onChange={e=>setForm(p=>({...p,carbon_saved:e.target.value}))}/>
            <Input label="Local Sourcing (%)" type="number" min="0" max="100" value={form.local_sourcing_pct} onChange={e=>setForm(p=>({...p,local_sourcing_pct:e.target.value}))}/>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:14,color:"var(--text2)"}}>
              <input type="checkbox" checked={form.msme_certified} onChange={e=>setForm(p=>({...p,msme_certified:e.target.checked}))}/>MSME Certified
            </label>
            <Btn onClick={save} loading={saving} fullWidth>Submit ESG Data</Btn>
          </div>
        </Card>
        <div>
          {existing.slice(0,1).map(e=>(
            <Card key={e.id} glow>
              <h4 style={{fontFamily:"Syne",fontWeight:700,marginBottom:20}}>Latest Report {e.year&&`(${e.year})`}</h4>
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <Progress label="Jobs Created" value={e.jobs_created} max={Math.max(e.jobs_created*1.5,10)} color="var(--accent)"/>
                <Progress label="Women Employed" value={e.women_employed} max={Math.max(e.women_employed*1.5,10)} color="var(--accent2)"/>
                <Progress label="Carbon Saved (t)" value={e.carbon_saved} max={Math.max(e.carbon_saved*1.5,10)} color="var(--accent3)"/>
                <Progress label="Local Sourcing %" value={e.local_sourcing_pct} max={100} color="var(--warn)"/>
                {e.msme_certified&&<span className="badge verified">✓ MSME Certified</span>}
              </div>
            </Card>
          ))}
          {existing.length===0&&<Card><Empty icon="◉" title="No ESG data yet" desc="Submit your first report"/></Card>}
        </div>
      </div>
    </div>
  );
}

function BrowseRequests({ toast }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");

  useEffect(()=>{buyerAPI.listRequests().then(r=>setRequests(r.data)).finally(()=>setLoading(false));},[]);
  const filtered = requests.filter(r=>r.title.toLowerCase().includes(search.toLowerCase())||r.description.toLowerCase().includes(search.toLowerCase()));

  if(loading) return <div style={{display:"grid",gap:12}}>{[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{height:100}}/>)}</div>;

  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <SectionHeader title="Browse Requests" sub="Active procurement requests from buyers"/>
      <Input placeholder="Search requests..." value={search} onChange={e=>setSearch(e.target.value)} icon="🔍" style={{marginBottom:20}}/>
      {filtered.length===0?<Empty icon="◈" title="No requests found"/>:(
        <div style={{display:"grid",gap:12}}>
          {filtered.map(r=>(
            <Card key={r.id}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16}}>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"Syne",fontWeight:700,fontSize:16,marginBottom:6}}>{r.title}</div>
                  <div style={{color:"var(--text2)",fontSize:13,marginBottom:10,lineHeight:1.6}}>{r.description}</div>
                  <div style={{display:"flex",gap:12,fontSize:12,color:"var(--text3)",flexWrap:"wrap"}}>
                    {r.category&&<span>🏷 {r.category}</span>}
                    {r.location&&<span>📍 {r.location}</span>}
                    {r.budget&&<span>💰 {r.budget}</span>}
                    {r.deadline&&<span>📅 {new Date(r.deadline).toLocaleDateString()}</span>}
                  </div>
                </div>
                <span className="badge active">{r.status}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function VendorNotifications({ toast }) {
  const [notes, setNotes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const load = () => buyerAPI.getNotifications().then(r=>setNotes(r.data)).finally(()=>setLoading(false));
  useEffect(()=>{ load(); },[]);
  const markAll = async()=>{ try{ await buyerAPI.markAllRead(); toast.success("All marked as read"); load(); } catch{ toast.error("Failed"); } };
  const markOne = async id=>{ try{ await buyerAPI.markRead(id); load(); } catch{} };
  if(loading) return <div style={{display:"grid",gap:8}}>{[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{height:60}}/>)}</div>;
  const unread = notes.filter(n=>!n.is_read).length;
  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <SectionHeader title="Notifications" sub={`${unread} unread`} action={unread>0&&<Btn onClick={markAll} variant="ghost" size="sm">Mark all read</Btn>}/>
      {notes.length===0 ? <Empty icon="🔔" title="No notifications" desc="You're all caught up!"/> : (
        <div style={{display:"flex",flexDirection:"column",gap:8,maxWidth:600}}>
          {notes.map(n=>(
            <div key={n.id} onClick={()=>!n.is_read&&markOne(n.id)}
              style={{padding:"16px 20px",background:n.is_read?"var(--surface)":"rgba(255,107,53,0.06)",border:`1px solid ${n.is_read?"var(--border)":"var(--border2)"}`,borderRadius:"var(--radius-sm)",cursor:n.is_read?"default":"pointer",display:"flex",alignItems:"flex-start",gap:12,transition:"all 0.2s"}}>
              <div style={{fontSize:20}}>{n.type==="success"?"✅":n.type==="warning"?"⚠️":"ℹ️"}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,lineHeight:1.6}}>{n.message}</div>
                <div style={{fontSize:11,color:"var(--text3)",marginTop:4}}>{new Date(n.created_at).toLocaleString()}</div>
              </div>
              {!n.is_read&&<div style={{width:8,height:8,background:"var(--accent)",borderRadius:"50%",flexShrink:0,marginTop:6}}/>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
