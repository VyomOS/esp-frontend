import VendorDashboard from "./VendorDashboard";
import BuyerDashboard  from "./BuyerDashboard";
import AdminDashboard  from "./AdminDashboard";
import { useNavigate } from "react-router-dom";
import { useEffect }   from "react";

export default function Dashboard() {
  const role     = localStorage.getItem("role");
  const navigate = useNavigate();
  useEffect(() => { if (!localStorage.getItem("token")) navigate("/"); }, []);
  if (role === "vendor") return <VendorDashboard />;
  if (role === "buyer")  return <BuyerDashboard />;
  if (role === "admin")  return <AdminDashboard />;
  return <div style={{padding:40,color:"var(--text2)",textAlign:"center"}}>Invalid role. Please log in again.</div>;
}
