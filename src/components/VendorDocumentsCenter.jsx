import { useEffect, useState } from "react";
import { apiErrorMessage, vendorAPI } from "../api/api";
import ConfirmModal from "./ConfirmModal";

const DOCUMENT_TYPES = [["pan", "PAN"], ["aadhaar", "Aadhaar"], ["gst", "GST certificate"], ["registration", "Registration certificate"], ["other", "Other compliance document"]];
const bytes = value => !value ? "Size unavailable" : value < 1024 * 1024 ? `${Math.ceil(value / 1024)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`;
const statusValue = value => typeof value === "string" ? value : value?.value || "pending";

export default function VendorDocumentsCenter({ toast }) {
  const [documents, setDocuments] = useState([]);
  const [catalogues, setCatalogues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [docType, setDocType] = useState("gst");
  const [docFile, setDocFile] = useState(null);
  const [catalogueFile, setCatalogueFile] = useState(null);
  const [uploading, setUploading] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true); setError("");
    const [docs, cats] = await Promise.allSettled([vendorAPI.getMyDocuments(), vendorAPI.getMyCatalogues()]);
    if (docs.status === "fulfilled") setDocuments(docs.value.data || []);
    if (cats.status === "fulfilled") setCatalogues(cats.value.data || []);
    if (docs.status === "rejected" && cats.status === "rejected") setError(apiErrorMessage(docs.reason, "Could not load documents"));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const uploadDocument = async event => {
    event.preventDefault();
    if (!docFile) { toast.error("Choose a PDF or image to upload"); return; }
    setUploading("document");
    try {
      const data = new FormData(); data.append("document_type", docType); data.append("file", docFile);
      await vendorAPI.uploadDocument(data); setDocFile(null); await load(); toast.success("Document uploaded for review");
    } catch (requestError) { toast.error(apiErrorMessage(requestError, "Could not upload document")); }
    finally { setUploading(""); }
  };
  const uploadCatalogue = async event => {
    event.preventDefault();
    if (!catalogueFile) { toast.error("Choose a catalogue PDF"); return; }
    setUploading("catalogue");
    try {
      const data = new FormData(); data.append("file", catalogueFile);
      await vendorAPI.uploadCatalogue(data); setCatalogueFile(null); await load(); toast.success("Catalogue uploaded");
    } catch (requestError) { toast.error(apiErrorMessage(requestError, "Could not upload catalogue")); }
    finally { setUploading(""); }
  };
  const remove = async () => {
    const target = deleteTarget; setDeleteTarget(null); setUploading(`delete-${target.id}`);
    try {
      if (target.kind === "document") await vendorAPI.deleteDocument(target.id); else await vendorAPI.deleteCatalogue(target.id);
      await load(); toast.success(target.kind === "document" ? "Document removed" : "Catalogue removed");
    } catch (requestError) { toast.error(apiErrorMessage(requestError, "Could not remove file")); }
    finally { setUploading(""); }
  };

  if (loading && !documents.length && !catalogues.length) return <div className="workspace-loading"><i className="page-spinner" /><b>Loading your compliance workspace...</b></div>;
  if (error) return <div className="workspace-error"><b>Documents are unavailable</b><p>{error}</p><button onClick={load}>Try again</button></div>;
  return <div className="seller-documents">
    <header className="workspace-heading"><div><span>SELLER OPERATIONS</span><h1>Documents & catalogues</h1><p>Keep verification evidence and buyer-ready catalogue files in one place.</p></div><div className="workspace-summary"><strong>{documents.filter(item => statusValue(item.status) === "verified").length}</strong><small>verified documents</small></div></header>
    <section className="seller-upload-grid">
      <form onSubmit={uploadDocument}><div><span>COMPLIANCE</span><h2>Upload verification evidence</h2><p>PDF, JPG, PNG or WebP. Files remain private to your organisation and admins.</p></div><label><span>Document type</span><select value={docType} onChange={event => setDocType(event.target.value)}>{DOCUMENT_TYPES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className="file-drop"><input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={event => setDocFile(event.target.files?.[0] || null)} /><b>{docFile?.name || "Choose document"}</b><small>{docFile ? bytes(docFile.size) : "Maximum size follows platform upload policy"}</small></label><button className="primary-action" disabled={uploading === "document"}>{uploading === "document" ? "Uploading..." : "Upload document"}</button></form>
      <form onSubmit={uploadCatalogue}><div><span>BUYER MATERIAL</span><h2>Upload a service catalogue</h2><p>Use a current PDF with clear service descriptions. Catalogue files do not replace listing photos.</p></div><label className="file-drop"><input type="file" accept="application/pdf,.pdf" onChange={event => setCatalogueFile(event.target.files?.[0] || null)} /><b>{catalogueFile?.name || "Choose catalogue PDF"}</b><small>{catalogueFile ? bytes(catalogueFile.size) : "PDF only"}</small></label><button className="secondary-workspace-action" disabled={uploading === "catalogue"}>{uploading === "catalogue" ? "Uploading..." : "Upload catalogue"}</button></form>
    </section>
    <section className="workspace-list-section"><div className="workspace-section-title"><div><span>REVIEW STATUS</span><h2>Compliance documents</h2></div><b>{documents.length} files</b></div>{documents.length ? <div className="workspace-file-list">{documents.map(item => { const status = statusValue(item.status); return <article key={item.id}><div className="workspace-file-mark">DOC</div><div><b>{item.original_name}</b><small>{DOCUMENT_TYPES.find(([value]) => value === statusValue(item.document_type))?.[1] || statusValue(item.document_type)} · {bytes(item.file_size)}</small>{item.status_note && <p>{item.status_note}</p>}</div><span className={`workspace-status ${status}`}>{status.replaceAll("_", " ")}</span>{item.view_url ? <a href={item.view_url} target="_blank" rel="noreferrer">Open</a> : <small className="local-file-note">Stored securely</small>}<button disabled={uploading === `delete-${item.id}`} onClick={() => setDeleteTarget({ id: item.id, kind: "document", name: item.original_name })}>Remove</button></article>})}</div> : <div className="workspace-empty"><b>No compliance documents yet</b><p>Upload at least one relevant document to support verification.</p></div>}</section>
    <section className="workspace-list-section"><div className="workspace-section-title"><div><span>CATALOGUE LIBRARY</span><h2>Buyer-ready catalogues</h2></div><b>{catalogues.length} files</b></div>{catalogues.length ? <div className="workspace-file-list">{catalogues.map(item => <article key={item.id}><div className="workspace-file-mark catalogue">PDF</div><div><b>{item.original_name}</b><small>{bytes(item.file_size)} · Uploaded {item.uploaded_at ? new Date(item.uploaded_at).toLocaleDateString("en-IN") : "recently"}</small></div><span className="workspace-status ready">Ready</span><button disabled={uploading === `delete-${item.id}`} onClick={() => setDeleteTarget({ id: item.id, kind: "catalogue", name: item.original_name })}>Remove</button></article>)}</div> : <div className="workspace-empty"><b>No catalogue uploaded</b><p>Add a PDF buyers can use while evaluating your services.</p></div>}</section>
    <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={remove} title={`Remove ${deleteTarget?.kind || "file"}`} message={`Remove ${deleteTarget?.name || "this file"}? This cannot be undone.`} variant="danger" />
  </div>;
}
