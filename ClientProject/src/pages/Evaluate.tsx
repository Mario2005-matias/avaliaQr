import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { StarsInput } from "../components/StarsInput";

// Função para gerar/obter o ID único do dispositivo
function getDeviceId(): string {
  let deviceId = localStorage.getItem("avalia_qr_device_id");
  if (!deviceId) {
    // Gera um UUID v4 simples se não existir
    deviceId = crypto.randomUUID();
    localStorage.setItem("avalia_qr_device_id", deviceId);
  }
  return deviceId;
}

export default function Evaluate() {
  const { token } = useParams();
  
  // Estados da página
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Dados do técnico e colégio
  const [technician, setTechnician] = useState<{ name: string; photo_url: string | null } | null>(null);
  const [school, setSchool] = useState<{ name: string } | null>(null);

  // Estados do formulário
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ao carregar a página, valida o token
  useEffect(() => {
    async function fetchSession() {
      try {
        const { data } = await api.get(`/public/service-sessions/${token}`);
        
        if (data.is_full) {
          setError("Este atendimento já recebeu o número máximo de avaliações.");
          return;
        }

        setTechnician(data.technician);
        setSchool(data.school);
      } catch (err: any) {
        const code = err.response?.data?.error;
        if (code === "SESSAO_EXPIRADA") setError("Este QR code já expirou.");
        else if (code === "SESSAO_REVOGADA") setError("Este atendimento foi encerrado.");
        else setError("QR code inválido. Confirma com o técnico.");
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stars === 0) {
      setError("Por favor, escolhe de 1 a 5 estrelas.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post(`/public/service-sessions/${token}/ratings`, {
        stars,
        comment: comment.trim() === "" ? null : comment,
        device_id: getDeviceId(), // Envia o ID do telemóvel para o backend
      });
      setSuccess(true);
    } catch (err: any) {
      const code = err.response?.data?.error;
      if (code === "JA_AVALIASTE") setError("Já avaliaste este atendimento. Obrigado!");
      else if (code === "LIMITE_ATINGIDO") setError("Este atendimento já recebeu o número máximo de avaliações.");
      else if (code === "RATE_LIMIT") setError("Demasiadas tentativas. Tenta novamente daqui a pouco.");
      else setError("Ocorreu um erro. Tenta novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Ecrã de Loading
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">A carregar...</div>;
  }

  // Ecrã de Sucesso
  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mb-4">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Obrigado pela tua avaliação!</h1>
        <p className="text-gray-600 max-w-xs">A tua opinião ajuda-nos a melhorar o suporte.</p>
      </div>
    );
  }

  // Ecrã de Erro Fatal (QR Inválido/Expirado)
  if (error && !technician) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-4xl mb-4">
          ⚠
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Não foi possível avaliar</h1>
        <p className="text-gray-600 max-w-xs">{error}</p>
      </div>
    );
  }

  // Ecrã Principal (Formulário)
  return (
    <div className="min-h-screen flex flex-col items-center pt-12 px-4 bg-gray-50">
      {/* Cabeçalho */}
      <div className="flex flex-col items-center mb-8">
        {technician?.photo_url ? (
          <img
            src={technician.photo_url}
            alt={technician.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mb-4"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold border-4 border-white shadow-md mb-4">
            {technician?.name.charAt(0)}
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-800">{technician?.name}</h1>
        <p className="text-gray-500">{school?.name}</p>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm space-y-6">
        <h2 className="text-center text-lg font-medium text-gray-700">Como foi o atendimento?</h2>
        
        <StarsInput value={stars} onChange={setStars} disabled={isSubmitting} />

        <div>
          <textarea
            placeholder="Queres dizer mais alguma coisa? (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            disabled={isSubmitting}
            className="w-full border border-gray-200 bg-gray-50 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-gray-700"
            rows={4}
          />
          <div className="text-right text-xs text-gray-400 mt-2">{comment.length}/1000</div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? "A enviar..." : "Enviar avaliação"}
        </button>
      </form>
      
      <p className="mt-8 text-xs text-gray-400 text-center">
        A tua avaliação é anónima e segura.
      </p>
    </div>
  );
}