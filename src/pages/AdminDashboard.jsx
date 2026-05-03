import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { adminAPI } from "../api/api";
import { useToast } from "../context/ToastContext";
import { Card, StatCard, Btn, Textarea, Modal, SectionHeader, Tabs, Empty, Input } from "../components/UI";
import ConfirmModal from "../components/ConfirmModal";
import { useLocation, useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast    = useToast();
  const tab = location.pathname.includes("vendors")       ? "vendors"
    : location.pathname.includes("users")                 ? "users"
    : location.pathname.includes("impact")                ? "impact"
    : location.pathname.includes("notifications")         ? "notifications"
    : "overview";

  return (
    <Layout>
      <div style={{marginBottom:28}}>
        <Tabs tabs={[
          {id:"overview",       label:"Overview",      icon:"⬡"},
          {id:"vendors",        label:"Approvals",     icon:"◈"},
          {id:"users",          label:"Users",         icon:"◇"},
          {id:"impact",         label:"Impact",        icon:"◉"},
          {id:"notifications",  label:"Notify Users",  icon:"◻"},
        ]} active={tab} onChange={id=>navigate(id==="overview"?"/dashboard":`/dashboard/${id}`)}/>
      </div>
      {tab==="overview"      && <AdminOverview      toast={toast}/>}
      {tab==="vendors"       && <VendorApproval     toast={toast}/>}
      {tab==="users"         && <UserManagement     toast={toast}/>}
      {tab==="impact"        && <ImpactDashboard    toast={toast}/>}
      {tab==="notifications" && <SendNotifications  toast={toast}/>}
    </Layout>
  );
}

function AdminOverview({ toast }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{adminAPI.stats().then(r=>setStats(r.data)).finally(()=>setLoading(false));},[]);
  if(loading) return <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>{[...Array(6)].map((_,i)=><div key={i} className="skeleton" style={{height:100}}/>)}</div>;
  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <SectionHeader title="Platform Overview" sub="Real-time statistics"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>
        <StatCard label="Total Users"      value={stats?.total_users||0}      icon="◇" color="var(--accent)"/>
        <StatCard label="Total Vendors"    value={stats?.total_vendors||0}    icon="⬡" color="var(--accent2)"/>
        <StatCard label="Verified Vendors" value={stats?.verified_vendors||0} icon="✓" color="var(--accent3)"/>
        <StatCard label="Total Buyers"     value={stats?.total_buyers||0}     icon="◈" color="var(--warn)"/>
        <StatCard label="Total Requests"   value={stats?.total_requests||0}   icon="◻" color="var(--accent)"/>
        <StatCard label="Active Requests"  value={stats?.active_requests||0}  icon="◉" color="var(--accent3)" sub="Live on platform"/>
      </div>
    </div>
  );
}

function VendorApproval({ toast }) {
  const [vendors, setVendors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [docModal, setDocModal] = useState(null);
  const [docs, setDocs]         = useState([]);
  const [rejectTarget, setRejectTarget]     = useState(null);
  const [confirmVerify, setConfirmVerify]   = useState(null);
  const [confirmDocStatus, setConfirmDocStatus] = useState(null);

  const load = ()=>adminAPI.pendingVendors().then(r=>setVendors(r.data)).finally(()=>setLoading(false));
  useEffect(()=>{load();},[]);

  const reject = async reason=>{
    try{await adminAPI.rejectVendor(rejectTarget.vendor_id,reason);toast.success("Vendor rejected and notified");load();}
    catch{toast.error("Failed");}
  };

  const viewDocs = async id=>{
    setDocModal(id);
    try{const r=await adminAPI.vendorDocuments(id);setDocs(r.data);}
    catch{toast.error("Failed to load documents");}
  };

  const updateDocStatus = async(docId,status,note)=>{
    try{await adminAPI.updateDocStatus(docId,{status,note});toast.success(`Document ${status}`);viewDocs(docModal);}
    catch{toast.error("Failed");}
  };

  if(loading) return <div style={{display:"grid",gap:12}}>{[...Array(3)].map((_,i)=><div key={i} className="skeleton" style={{height:100}}/>)}</div>;
  const statusColor={pending:"var(--warn)",verified:"var(--accent3)",rejected:"var(--danger)"};

  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <SectionHeader title="Vendor Approvals" sub={`${vendors.length} pending verification`}/>
      {vendors.length===0?<Empty icon="◈" title="All caught up!" desc="No vendors pending verification"/>:(
        <div style={{display:"grid",gap:12}}>
          {vendors.map(v=>(
            <Card key={v.vendor_id}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16}}>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"Syne",fontWeight:700,fontSize:16,marginBottom:4}}>{v.organization_name}</div>
                  <div style={{fontSize:13,color:"var(--text2)",marginBottom:8}}>{v.user_name} · {v.user_email}</div>
                  <div style={{display:"flex",gap:12,fontSize:12,color:"var(--text3)"}}>
                    {v.category&&<span>🏷 {v.category}</span>}
                    {v.location&&<span>📍 {v.location}</span>}
                    <span>📄 {v.document_count} document{v.document_count!==1?"s":""}</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:8,flexShrink:0,flexWrap:"wrap"}}>
                  <Btn onClick={()=>viewDocs(v.vendor_id)} variant="secondary" size="sm">View Docs</Btn>
                  <Btn onClick={()=>setConfirmVerify(v)} variant="success" size="sm" disabled={v.document_count===0}>✓ Verify</Btn>
                  <Btn onClick={()=>setRejectTarget(v)} variant="danger" size="sm">✕ Reject</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!docModal} onClose={()=>{setDocModal(null);setDocs([]);}} title="Vendor Documents" width={600}>
        {docs.length===0?<Empty icon="◻" title="No documents uploaded"/>:(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {docs.map(d=>(
              <div key={d.id} style={{padding:"14px 16px",background:"var(--surface)",borderRadius:"var(--radius-sm)",border:"1px solid var(--border)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:14,marginBottom:4}}>{d.original_name}</div>
                    <div style={{fontSize:12,color:"var(--text3)",display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                      <span className="badge pending">{d.document_type?.toUpperCase()}</span>
                      <span style={{color:statusColor[d.status]}}>● {d.status}</span>
                      {d.file_size&&<span>{(d.file_size/1024).toFixed(0)} KB</span>}
                    </div>
                    {d.status_note&&<div style={{fontSize:12,color:"var(--danger)",marginTop:4}}>Note: {d.status_note}</div>}
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0,flexWrap:"wrap"}}>
                    <a href={adminAPI.downloadDocument(d.id)} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:4,padding:"6px 12px",background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:"var(--radius-sm)",color:"var(--text)",fontSize:12,textDecoration:"none",fontWeight:600}}>⬇ View</a>
                    {d.status!=="verified"&&<Btn onClick={()=>updateDocStatus(d.id,"verified",null)} variant="success" size="sm">✓ Verify</Btn>}
                    {d.status!=="rejected"&&<Btn onClick={()=>setConfirmDocStatus(d)} variant="danger" size="sm">✕ Reject</Btn>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!confirmVerify} onClose={()=>setConfirmVerify(null)}
        onConfirm={async()=>{await adminAPI.verifyVendor(confirmVerify.vendor_id);toast.success("Vendor verified!");load();}}
        title="Verify Vendor" message={`Are you sure you want to verify ${confirmVerify?.organization_name}? They will be notified by email.`} variant="success"/>

      <Modal open={!!rejectTarget} onClose={()=>setRejectTarget(null)} title="Reject Vendor" width={460}>
        <RejectForm vendor={rejectTarget} onReject={reject} onClose={()=>setRejectTarget(null)} toast={toast}/>
      </Modal>

      <Modal open={!!confirmDocStatus} onClose={()=>setConfirmDocStatus(null)} title="Reject Document" width={440}>
        <DocRejectForm doc={confirmDocStatus} onReject={async(note)=>{await updateDocStatus(confirmDocStatus.id,"rejected",note);setConfirmDocStatus(null);}} onClose={()=>setConfirmDocStatus(null)}/>
      </Modal>
    </div>
  );
}

function RejectForm({ vendor, onReject, onClose, toast }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const handle = async()=>{
    if(!reason.trim()){toast.error("Enter a reason");return;}
    setLoading(true);
    try{await onReject(reason);setReason("");}
    finally{setLoading(false);}
  };
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{padding:"14px 16px",background:"rgba(248,113,113,0.08)",borderRadius:10,border:"1px solid rgba(248,113,113,0.2)",fontSize:14,color:"var(--text2)"}}>
        Rejecting <strong style={{color:"var(--text)"}}>{vendor?.organization_name}</strong>. The vendor will be notified and can re-upload documents.
      </div>
      <Textarea label="Rejection Reason *" placeholder="e.g. PAN card image is blurry, please re-upload..." rows={4} value={reason} onChange={e=>setReason(e.target.value)}/>
      <div style={{display:"flex",gap:10}}>
        <Btn onClick={onClose} variant="secondary" fullWidth>Cancel</Btn>
        <Btn onClick={handle} loading={loading} variant="danger" fullWidth disabled={!reason.trim()}>Send Rejection</Btn>
      </div>
    </div>
  );
}

function DocRejectForm({ doc, onReject, onClose }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const handle = async()=>{setLoading(true);try{await onReject(note);}finally{setLoading(false);}};
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{fontSize:14,color:"var(--text2)"}}>Rejecting: <strong style={{color:"var(--text)"}}>{doc?.original_name}</strong></div>
      <Textarea label="Reason (optional)" placeholder="e.g. Image is blurry..." rows={3} value={note} onChange={e=>setNote(e.target.value)}/>
      <div style={{display:"flex",gap:10}}>
        <Btn onClick={onClose} variant="secondary" fullWidth>Cancel</Btn>
        <Btn onClick={handle} loading={loading} variant="danger" fullWidth>Reject Document</Btn>
      </div>
    </div>
  );
}

function UserManagement({ toast }) {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("");
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);
  const load = ()=>adminAPI.listUsers().then(r=>setUsers(r.data)).finally(()=>setLoading(false));
  useEffect(()=>{load();},[]);
  const filtered = filter?users.filter(u=>u.role===filter):users;
  if(loading) return <div className="skeleton" style={{height:400}}/>;
  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <SectionHeader title="User Management" sub={`${users.length} total users`}/>
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {["","vendor","buyer","admin"].map(r=>(
          <Btn key={r} onClick={()=>setFilter(r)} variant={filter===r?"primary":"secondary"} size="sm">{r||"All"}</Btn>
        ))}
      </div>
      <Card>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:"1px solid var(--border)"}}>
                {["ID","Name","Email","Role","Status","Verified","Joined","Actions"].map(h=>(
                  <th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:12,fontWeight:600,color:"var(--text2)",textTransform:"uppercase",letterSpacing:0.5}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u=>(
                <tr key={u.id} style={{borderBottom:"1px solid var(--border)"}}>
                  <td style={{padding:"12px 16px",fontSize:13,color:"var(--text3)"}}>{u.id}</td>
                  <td style={{padding:"12px 16px",fontWeight:600,fontSize:14}}>{u.name}</td>
                  <td style={{padding:"12px 16px",fontSize:13,color:"var(--text2)"}}>{u.email}</td>
                  <td style={{padding:"12px 16px"}}><span className={`badge ${u.role==="admin"?"danger":u.role==="vendor"?"active":"verified"}`}>{u.role}</span></td>
                  <td style={{padding:"12px 16px"}}><span style={{fontSize:12,color:u.is_active?"var(--accent3)":"var(--danger)"}}>{u.is_active?"● Active":"● Inactive"}</span></td>
                  <td style={{padding:"12px 16px"}}><span style={{fontSize:12,color:u.verified?"var(--accent3)":"var(--text3)"}}>{u.verified?"✓ Yes":"—"}</span></td>
                  <td style={{padding:"12px 16px",fontSize:12,color:"var(--text3)"}}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={{padding:"12px 16px"}}>
                    <div style={{display:"flex",gap:6}}>
                      {u.is_active
                        ?<Btn onClick={()=>setConfirmDeactivate(u)} variant="danger" size="sm">Deactivate</Btn>
                        :<Btn onClick={async()=>{await adminAPI.updateUser(u.id,{is_active:true});toast.success("Activated");load();}} variant="success" size="sm">Activate</Btn>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <ConfirmModal open={!!confirmDeactivate} onClose={()=>setConfirmDeactivate(null)}
        onConfirm={async()=>{await adminAPI.deactivateUser(confirmDeactivate.id);toast.success("User deactivated");load();}}
        title="Deactivate User" message={`Are you sure you want to deactivate ${confirmDeactivate?.name}?`} variant="danger"/>
    </div>
  );
}

function ImpactDashboard({ toast }) {
  const [impact, setImpact]       = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading]     = useState(true);
  useEffect(()=>{
    Promise.allSettled([adminAPI.impact(),adminAPI.esgBreakdown()])
      .then(([imp,brk])=>{
        if(imp.status==="fulfilled") setImpact(imp.value.data);
        if(brk.status==="fulfilled") setBreakdown(brk.value.data);
      }).finally(()=>setLoading(false));
  },[]);
  if(loading) return <div className="skeleton" style={{height:400}}/>;
  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <SectionHeader title="ESG Impact Dashboard" sub="Platform-wide social & environmental impact"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16,marginBottom:32}}>
        <StatCard label="Total Vendors"    value={impact?.total_vendors||0}        icon="⬡" color="var(--accent)"/>
        <StatCard label="Verified Vendors" value={impact?.verified_vendors||0}     icon="✓" color="var(--accent3)"/>
        <StatCard label="Jobs Created"     value={impact?.total_jobs_created||0}   icon="👷" color="var(--accent2)"/>
        <StatCard label="Women Employed"   value={impact?.total_women_employed||0} icon="👩" color="var(--accent)"/>
        <StatCard label="Carbon Saved (t)" value={impact?.total_carbon_saved?.toFixed(1)||0} icon="🌿" color="var(--accent3)"/>
        <StatCard label="Procurement Reqs" value={impact?.total_requests||0}       icon="◈" color="var(--warn)"/>
      </div>
      {breakdown.length>0&&(
        <Card>
          <SectionHeader title="Vendor ESG Breakdown"/>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{borderBottom:"1px solid var(--border)"}}>
                {["Vendor","Jobs","Women","Carbon Saved"].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:12,fontWeight:600,color:"var(--text2)",textTransform:"uppercase",letterSpacing:0.5}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {breakdown.map((b,i)=>(
                  <tr key={i} style={{borderBottom:"1px solid var(--border)"}}>
                    <td style={{padding:"12px 16px",fontWeight:600,fontSize:14}}>{b.vendor}</td>
                    <td style={{padding:"12px 16px",color:"var(--accent2)"}}>{b.jobs}</td>
                    <td style={{padding:"12px 16px",color:"var(--accent)"}}>{b.women}</td>
                    <td style={{padding:"12px 16px",color:"var(--accent3)"}}>{b.carbon}t</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function SendNotifications({ toast }) {
  const [message, setMessage]       = useState("");
  const [target, setTarget]         = useState("all");
  const [type, setType]             = useState("info");
  const [sending, setSending]       = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails]         = useState([]);

  const addEmail = ()=>{
    const val = emailInput.trim().toLowerCase();
    if(!val) return;
    if(!val.includes("@")){toast.error("Enter a valid email");return;}
    if(emails.includes(val)){toast.error("Already added");return;}
    setEmails(p=>[...p,val]); setEmailInput("");
  };
  const removeEmail = email => setEmails(p=>p.filter(e=>e!==email));
  const handleKeyDown = e => { if(e.key==="Enter"||e.key===","){e.preventDefault();addEmail();} };

  const send = async()=>{
    if(!message.trim()){toast.error("Enter a message");return;}
    if(target==="individual"&&emails.length===0){toast.error("Add at least one email");return;}
    setSending(true);
    try{
      const res = await adminAPI.sendNotification({message,target,emails,type});
      toast.success(res.data.message);
      if(res.data.not_found?.length>0) toast.error(`Not found: ${res.data.not_found.join(", ")}`);
      setMessage(""); setEmails([]); setEmailInput("");
    }catch(err){toast.error(err.response?.data?.detail||"Failed");}
    finally{setSending(false);}
  };

  return (
    <div style={{maxWidth:580,animation:"fadeUp 0.4s ease"}}>
      <SectionHeader title="Send Notifications" sub="Broadcast messages to users on the platform"/>
      <Card>
        <div style={{display:"flex",flexDirection:"column",gap:18}}>

          {/* Target */}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <label style={{fontSize:12,fontWeight:600,color:"var(--text2)",textTransform:"uppercase",letterSpacing:0.5}}>Send To</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[
                {id:"all",        label:"👥 Everyone"},
                {id:"vendors",    label:"🏭 All Vendors"},
                {id:"buyers",     label:"🛒 All Buyers"},
                {id:"individual", label:"👤 Specific Users"},
              ].map(t=>(
                <button key={t.id} onClick={()=>setTarget(t.id)}
                  style={{flex:1,minWidth:120,padding:"10px 12px",borderRadius:10,border:`2px solid ${target===t.id?"var(--accent)":"var(--border)"}`,background:target===t.id?"rgba(99,132,255,0.1)":"var(--surface)",color:target===t.id?"var(--accent)":"var(--text2)",cursor:"pointer",fontFamily:"Syne",fontWeight:600,fontSize:13,transition:"all 0.2s"}}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Email tags — only for individual */}
          {target==="individual"&&(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <label style={{fontSize:12,fontWeight:600,color:"var(--text2)",textTransform:"uppercase",letterSpacing:0.5}}>Add Recipients</label>
              {emails.length>0&&(
                <div style={{display:"flex",flexWrap:"wrap",gap:6,padding:"10px 12px",background:"var(--bg)",borderRadius:10,border:"1px solid var(--border)",minHeight:44}}>
                  {emails.map(email=>(
                    <div key={email} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 10px 4px 12px",background:"rgba(99,132,255,0.12)",border:"1px solid rgba(99,132,255,0.25)",borderRadius:20,fontSize:13,color:"var(--accent)",fontWeight:500}}>
                      {email}
                      <button onClick={()=>removeEmail(email)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--accent)",fontSize:16,lineHeight:1,padding:"0 2px",display:"flex",alignItems:"center"}}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:"flex",gap:8}}>
                <input placeholder="Enter email and press Enter or comma..." value={emailInput} onChange={e=>setEmailInput(e.target.value)} onKeyDown={handleKeyDown}
                  style={{flex:1,padding:"11px 16px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,color:"var(--text)",fontSize:14,outline:"none",fontFamily:"DM Sans,sans-serif"}}
                  onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                <Btn onClick={addEmail} variant="secondary" size="md">Add</Btn>
              </div>
              <div style={{fontSize:12,color:"var(--text3)"}}>{emails.length} recipient{emails.length!==1?"s":""} added.</div>
            </div>
          )}

          {/* Type */}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <label style={{fontSize:12,fontWeight:600,color:"var(--text2)",textTransform:"uppercase",letterSpacing:0.5}}>Type</label>
            <div style={{display:"flex",gap:8}}>
              {[{id:"info",l:"ℹ Info",c:"var(--accent)"},{id:"success",l:"✅ Success",c:"var(--accent3)"},{id:"warning",l:"⚠ Warning",c:"var(--warn)"}].map(t=>(
                <button key={t.id} onClick={()=>setType(t.id)}
                  style={{flex:1,padding:9,borderRadius:8,border:`2px solid ${type===t.id?t.c:"var(--border)"}`,background:type===t.id?`${t.c}18`:"var(--surface)",color:type===t.id?t.c:"var(--text2)",cursor:"pointer",fontFamily:"Syne",fontWeight:600,fontSize:12,transition:"all 0.2s"}}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>

          <Textarea label="Message *" placeholder="Type your notification message here..." rows={4} value={message} onChange={e=>setMessage(e.target.value)}/>

          {message&&(
            <div style={{padding:"12px 16px",background:"rgba(99,132,255,0.06)",borderRadius:10,border:"1px solid var(--border2)",fontSize:13,color:"var(--text2)",lineHeight:1.6}}>
              <span style={{fontWeight:600,color:"var(--text)",marginRight:8}}>Preview:</span>{message}
            </div>
          )}

          <Btn onClick={send} loading={sending} fullWidth size="lg">
            {target==="all"        ? "📢 Broadcast to Everyone"
            :target==="vendors"    ? "🏭 Send to All Vendors"
            :target==="buyers"     ? "🛒 Send to All Buyers"
            :`📨 Send to ${emails.length||0} User${emails.length!==1?"s":""}`}
          </Btn>

        </div>
      </Card>
    </div>
  );
}
