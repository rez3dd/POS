import { Navigate } from "react-router-dom";
import { getStoredUser } from "../Services/Auth";

export default function OrdersIndex() {
  const user = getStoredUser();
  if (!user) return <Navigate to="/login" replace />;
  const role = String(user.role || "").toLowerCase();
  return <Navigate to={role === "admin" ? "/orders/admin" : "/orders/staff"} replace />;
}
