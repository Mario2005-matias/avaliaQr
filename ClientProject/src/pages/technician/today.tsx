import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import type { Session, School } from "../../types/index";

export default function Today() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState("");
  const navigate = useNavigate();

  async function loadData() {
    try {
      const [sessionsRes, schoolsRes] = await Promise.all([
        api.get("/technician/sessions/today"),
        api.get("/technician/schools"),
      ]);
      setSessions(sessionsRes.data);
      setSchools(schoolsRes.data);
    } catch (err) {
      console.error("Erro ao carregar dados", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data } = await api.post("/technician/sessions", { school_id: selectedSchool });
      
      // Fecha o modal e vai para a tela do QR
      setIsModalOpen(false);
      navigate(`/technician/session/${data.session_id}`, { 
        state: { token: data.token, schoolName: data.school_name } 
      });
    } catch (err) {
      alert("Erro ao criar sessão.");
    }
  }

  async function handleRevoke(id: number) {
    if (!confirm("Encerrar este QR?")) return;
    await api.delete(`/technician/sessions/${id}`);
    loadData(); // Recarrega a lista
  }

  if (loading) return <div>A carregar...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Atendimentos de Hoje</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Novo Atendimento
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-lg shadow-sm text-gray-500">
          Ainda não tens atendimentos hoje.
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((s) => {
            const isExpired = new Date(s.expires_at) < new Date();
            const isRevoked = s.revoked_at !== null;
            const isInactive = isExpired || isRevoked;

            return (
              <div key={s.id} className={`bg-white p-5 rounded-lg shadow-sm border-l-4 ${isInactive ? 'border-gray-300' : 'border-green-500'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{s.school_name}</h3>
                    <p className="text-sm text-gray-500">
                      {s.created_at} → {s.expires_at} · {s.ratings_count} avaliações 
                      {s.ratings_count > 0 && ` · ★ ${s.average_rating}`}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${isInactive ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                    {isRevoked ? 'Encerrado' : isExpired ? 'Expirado' : 'Ativo'}
                  </span>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  {!isInactive && (
                    <>
                      <button 
                        onClick={() => navigate(`/technician/session/${s.id}`)}
                        className="bg-gray-900 text-white px-4 py-1.5 text-sm rounded hover:bg-black"
                      >
                        Mostrar QR
                      </button>
                      <button 
                        onClick={() => handleRevoke(s.id)}
                        className="text-red-600 px-4 py-1.5 text-sm hover:bg-red-50 rounded"
                      >
                        Encerrar
                      </button>
                    </>
                  )}
                  {isInactive && (
                    <button className="text-blue-600 px-4 py-1.5 text-sm hover:underline">
                      Ver avaliações
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Novo Atendimento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Novo Atendimento</h2>
            <form onSubmit={handleCreateSession}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Colégio</label>
              <select 
                required
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 mb-6"
              >
                <option value="">Escolhe um colégio...</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Gerar QR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}