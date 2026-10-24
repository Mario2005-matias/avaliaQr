import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../../lib/api";
import type { Session } from "../../types/index";

export default function QrScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Tenta apanhar os dados via state (quando vem do botão "Criar"),
  // ou faz fetch se for uma entrada direta na página.
  const [token] = useState<string | null>(location.state?.token || null);
  const [schoolName] = useState<string>(location.state?.schoolName || "Atendimento");
  const [ratingsCount, setRatingsCount] = useState(0);
  const [counterLoading, setCounterLoading] = useState(false);
  const [counterError, setCounterError] = useState<string | null>(null);

  async function refreshCounter() {
    if (!id) return;

    setCounterLoading(true);
    setCounterError(null);
    try {
      const { data } = await api.get<Session[]>("/technician/sessions/today");
      const session = data.find((item) => item.id === Number(id));
      if (!session) {
        setCounterError("Não foi possível encontrar este atendimento.");
        return;
      }
      setRatingsCount(session.ratings_count);
    } catch {
      setCounterError("Não foi possível actualizar o contador. Tenta novamente.");
    } finally {
      setCounterLoading(false);
    }
  }

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

      <div className="mt-6 text-center">
        <p className="text-gray-700">Avaliações recebidas: <strong>{ratingsCount}</strong></p>
        <button
          type="button"
          onClick={refreshCounter}
          disabled={counterLoading}
          className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {counterLoading ? "A actualizar..." : "Actualizar Contador"}
        </button>
        {counterError && <p role="alert" className="mt-2 text-sm text-red-600">{counterError}</p>}
      </div>

      <p className="mt-8 text-sm text-gray-400">
        Válido até ao fim do dia. O técnico pode encerrar a qualquer momento.
      </p>
    </div>
  );
}