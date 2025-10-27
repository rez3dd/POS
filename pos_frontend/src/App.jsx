// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/shared/ProtectedRoute";

import HomeAdmin from "./pages/HomeAdmin";
import HomeStaff from "./pages/HomeStaff";

import Menu from "./pages/Menu";
import MenuDetail from "./pages/MenuDetail";
import Stats from "./pages/Stats";
import Users from "./pages/Users";

// ✅ ใช้หน้าแบบรวม
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";

// staff
import TakeOrder from "./pages/staff/TakeOrder";
// import PaymentPage from "./pages/staff/PaymentPage"; // ชื่อไฟล์ตัวจริง (ระวังตัวใหญ่/เล็ก)

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Logout from "./pages/Logout";

import { getCurrentUser } from "./Services/Auth";

/* Error boundary (เดิม) */
function ErrorBoundary({ children }) { return <ErrorCatcher>{children}</ErrorCatcher>; }
class ErrorCatcher extends React.Component {
  constructor(p){ super(p); this.state={ error:null }; }
  static getDerivedStateFromError(error){ return { error }; }
  componentDidCatch(err, info){ console.error("React error:", err, info); }
  render(){
    if(this.state.error){
      return (
        <div style={{ padding:24, color:"#fff", background:"#2d2d2d" }}>
          <h2 style={{ marginBottom:12 }}>เกิดข้อผิดพลาดในการแสดงผล</h2>
          <pre style={{ whiteSpace:"pre-wrap" }}>{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const user = getCurrentUser();

  const homeByRole = () => {
    if (!user) return "/login";
    if (user.role?.toUpperCase() === "ADMIN") return "/HomeAdmin";
    if (user.role?.toUpperCase() === "STAFF") return "/HomeStaff";
    return "/login";
  };

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          {/* public */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/logout" element={<Logout />} />

          {/* admin only */}
          <Route path="/HomeAdmin" element={
            <ProtectedRoute allowedRoles={["admin"]}><HomeAdmin /></ProtectedRoute>
          } />
          <Route path="/menu" element={
            <ProtectedRoute allowedRoles={["admin"]}><Menu /></ProtectedRoute>
          } />
          <Route path="/menu/:id" element={
            <ProtectedRoute allowedRoles={["admin"]}><MenuDetail /></ProtectedRoute>
          } />
          <Route path="/stats" element={
            <ProtectedRoute allowedRoles={["admin"]}><Stats /></ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={["admin"]}><Users /></ProtectedRoute>
          } />

          {/* staff only */}
          <Route path="/HomeStaff" element={
            <ProtectedRoute allowedRoles={["staff"]}><HomeStaff /></ProtectedRoute>
          } />
          <Route path="/takeorder" element={
            <ProtectedRoute allowedRoles={["staff"]}><TakeOrder /></ProtectedRoute>
          } />
          {/* <Route path="/payment" element={
            <ProtectedRoute allowedRoles={["staff"]}><PaymentPage /></ProtectedRoute>
          } /> */}

          {/* ✅ เส้นทางรวม (ใช้ร่วมกัน) */}
          <Route path="/orders" element={
            <ProtectedRoute allowedRoles={["admin","staff"]}><Orders /></ProtectedRoute>
          } />
          <Route path="/orders/:id" element={
            <ProtectedRoute allowedRoles={["admin","staff"]}><OrderDetail /></ProtectedRoute>
          } />

          {/* ✅ alias สำหรับ path แยก role -> redirect มาที่หน้ารวม */}
          <Route path="/orders-admin" element={<Navigate to="/orders" replace />} />
          <Route path="/orders-staff" element={<Navigate to="/orders" replace />} />
          <Route path="/orders-admin/:id" element={<Navigate to="/orders/:id" replace />} />
          <Route path="/orders-staff/:id" element={<Navigate to="/orders/:id" replace />} />

          {/* default & 404 */}
          <Route path="/" element={<Navigate to={homeByRole()} replace />} />
          <Route path="*" element={<Navigate to={homeByRole()} replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
