import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";

const AdminDashboard = () => <div className="p-8">Painel do Administrador (em construção)</div>;
const TechnicianToday = () => <div className="p-8">Painel do Técnico (em construção)</div>;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/ratings" element={<AdminDashboard />} />
        <Route path="/technician/today" element={<TechnicianToday />} />
      </Routes>
    </BrowserRouter>
  );
}