import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Evaluate from "./pages/Evaluate";
import { AuthGuard } from "./components/AuthGuard";
import { TechnicianLayout } from "./layouts/TechnicianLayout";
import Today from "./pages/technician/today";
import QrScreen from "./pages/technician/QrScreen";
import TechnicianRatings from "./pages/technician/TechnicianRatings";
import { AdminLayout } from "./layouts/AdminLayout";
import AdminRatings from "./pages/admin/AdminRatings";
import AdminTechnicians from "./pages/admin/AdminTechnicians";
import AdminSchools from "./pages/admin/AdminSchools";
import AdminReports from "./pages/admin/AdminReports";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Rota Pública do Avaliador */}
        <Route path="/avaliar/:token" element={<Evaluate />} />

        {/* Rotas Protegidas do Técnico */}
        <Route path="/technician" element={<AuthGuard requiredRole="technician"><TechnicianLayout /></AuthGuard>}>
          <Route index element={<Navigate to="/technician/today" replace />} />
          <Route path="today" element={<Today />} />
          <Route path="ratings" element={<TechnicianRatings />} />
          <Route path="session/:id" element={<QrScreen />} />
        </Route>

        <Route path="/admin" element={<AuthGuard requiredRole="admin"><AdminLayout /></AuthGuard>}>
          <Route index element={<Navigate to="/admin/ratings" replace />} />
          <Route path="technicians" element={<AdminTechnicians />} />
          <Route path="schools" element={<AdminSchools />} />
          <Route path="ratings" element={<AdminRatings />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}