import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { getDeviceId } from "../utils/device";
import { StarsInput } from "../components/StarsInput";
import axios from "axios";

export default function Evaluate() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Dados do técnico
  const [technician, setTechnician] = useState<{ name: string; photo_url: string | null } | null>(null);
  const [school, setSchool] = useState<{ name: string } | null>(null);

  // Estado do formulário
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Valida o token ao abrir a página
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
      } catch (error: unknown) {
        const code = axios.isAxiosError<{ error?: string }>(error)
          ? error.response?.data?.error
          : undefined;
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
      setError("Escolhe de 1 a 5 estrelas.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post(`/public/service-sessions/${token}/ratings`, {
        stars,
        comment: comment.trim() === "" ? null : comment,
        device_id: getDeviceId(),
      });
      setSuccess(true);
    } catch (error: unknown) {
      const code = axios.isAxiosError<{ error?: string }>(error)
        ? error.response?.data?.error
        : undefined;
      if (code === "JA_AVALIASTE") setError("Já avaliaste este atendimento. Obrigado!");
      else if (code === "LIMITE_ATINGIDO") setError("Este atendimento já recebeu o número máximo de avaliações.");
      else if (code === "RATE_LIMIT") setError("Demasiadas tentativas. Tenta novamente daqui a pouco.");
      else setError("Ocorreu um erro. Tenta novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">A carregar...</div>;
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
        <div className="text-6xl text-green-500 mb-4">✓</div>
        <h1 className="text-2xl font-bold mb-2">Obrigado pela tua avaliação!</h1>
        <p className="text-gray-600">A tua opinião ajuda-nos a melhorar o suporte.</p>
      </div>
    );
  }

  // Se houver erro e não houver técnico carregado (erro fatal de validação do QR)
  if (error && !technician) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
        <div className="text-6xl text-red-500 mb-4">⚠</div>
        <h1 className="text-xl font-bold mb-2">Não foi possível avaliar</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center pt-12 px-6 bg-gray-50">
      {/* Cabeçalho do Técnico */}
      <div className="flex flex-col items-center mb-8">
        {technician?.photo_url ? (
          <img
            src={technician.photo_url}
            alt={technician.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mb-4"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-white text-3xl font-bold mb-4">
            {technician?.name.charAt(0)}
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-800">{technician?.name}</h1>
        <p className="text-gray-500">{school?.name}</p>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-6 rounded-lg shadow-sm space-y-6">
        <h2 className="text-center text-lg font-medium text-gray-700">Como foi o atendimento?</h2>
        
        <StarsInput value={stars} onChange={setStars} disabled={isSubmitting} />

        <div>
          <textarea
            placeholder="Queres dizer mais alguma coisa? (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            disabled={isSubmitting}
            className="w-full border border-gray-300 rounded p-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            rows={4}
          />
          <div className="text-right text-xs text-gray-400 mt-1">{comment.length}/1000</div>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center">{error}</div>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? "A enviar..." : "Enviar avaliação"}
        </button>
      </form>
      
      <p className="mt-8 text-xs text-gray-400 text-center">
        A tua avaliação é anónima.
      </p>
    </div>
  );
}