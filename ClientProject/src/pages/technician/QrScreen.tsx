import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../../lib/api";

export default function QrScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Tenta apanhar os dados via state (quando vem do botão "Criar"),
  // ou faz fetch se for uma entrada direta na página.
  const [token, setToken] = useState<string | null>(location.state?.token || null);
  const [schoolName, setSchoolName] = useState<string>(location.state?.schoolName || "Atendimento");

  useEffect(() => {
    // Se não tiver o token em memória (ex: fez refresh na página), 
    // precisas de um endpoint para recuperar o token.
    // Para simplificar nesta fase, se não houver token, avisamos o utilizador.
    if (!token) {
      // Idealmente, aqui fazíamos um GET /technician/sessions/{id}/token
      // Mas como a arquitetura de segurança decidiu não guardar o token em claro,
      // o técnico perde o token se fizer refresh, a não ser que a sessão seja reaproveitada.
      alert("Token perdido ao recarregar. Volta a trás e clica em 'Novo Atendimento' novamente.");
      navigate("/technician/today");
    }
  }, [token, navigate]);

  if (!token) return null;

  const url = `${import.meta.env.VITE_APP_URL}/avaliar/${token}`;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-4">
      <button 
        onClick={() => navigate("/technician/today")}
        className="absolute top-4 left-4 text-gray-500 hover:text-black font-medium"
      >
        ✕ Fechar
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-2">{schoolName}</h1>
      <p className="text-gray-500 mb-8">Mostra este código ao cliente para avaliar.</p>

      <div className="bg-white p-4 rounded-xl shadow-lg border">
        <QRCodeSVG value={url} size={280} level="M" />
      </div>

      <p className="mt-8 text-sm text-gray-400">
        Válido até ao fim do dia. O técnico pode encerrar a qualquer momento.
      </p>
    </div>
  );
}