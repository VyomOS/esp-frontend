import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      authAPI.me()
        .then(r => setUser(r.data))
        .catch(() => { localStorage.clear(); navigate("/"); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const acceptSession = useCallback(data => {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("role",  data.role);
    localStorage.setItem("name",  data.name);
    if (data.permissions) localStorage.setItem("permissions", JSON.stringify(data.permissions));
    setUser(data);
    return data;
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    return acceptSession(res.data);
  };

  const logout = useCallback(() => {
    localStorage.clear();
    setUser(null);
    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, loading, login, acceptSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
