// src/hooks/useAuth.js
import { useEffect, useState } from "react";
import { getCurrentUser } from "../Services/Auth";

export function useAuth() {
  const [user, setUser] = useState(getCurrentUser());
  useEffect(() => {
    const onStorage = () => setUser(getCurrentUser());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return { ...user, name: user?.name, role: user?.role };
}
