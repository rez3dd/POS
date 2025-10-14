// src/pages/Logout.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../Services/Auth";

export default function Logout() {
  const nav = useNavigate();
  useEffect(() => { logout(); nav("/login", { replace: true }); }, [nav]);
  return null;
}
