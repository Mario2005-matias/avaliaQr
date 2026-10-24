import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Evaluate from "./pages/Evaluate";
import { AuthGuard } from "./components/AuthGuard";
import { TechnicianLayout } from "./layouts/TechnicianLayout";
import Today from "./pages/technician/today";
import QrScreen from "./pages/technician/QrScreen";

// Placeholders para as outras rotas
const AdminDashboard = () => <div className="p-8">Painel do Administrador (em construção)</div>;
const TechnicianRatings = () => <div className="p-8">Avaliações do Técnico (em construção)</div>;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Rota Pública do Avaliador */}
        <Route path="/avaliar/:token" element={<Evaluate />} />

        {/* Rotas Protegidas do Técnico */}
        <Route path="/technician" element={<AuthGuard><TechnicianLayout /></AuthGuard>}>
          <Route index element={<Navigate to="/technician/today" replace />} />
          <Route path="today" element={<Today />} />
          <Route path="ratings" element={<TechnicianRatings />} />
          <Route path="session/:id" element={<QrScreen />} />
        </Route>

        {/* Rotas Protegidas do Admin */}
        <Route path="/admin/ratings" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}