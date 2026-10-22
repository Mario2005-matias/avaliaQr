import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,          // cookie mode
  headers: { Accept: "application/json" },
});

// Antes de qualquer pedido que altere estado, obter o CSRF cookie
export async function ensureCsrf() {
  await api.get("/sanctum/csrf-cookie");
}

// Interceptor: em 401, limpar estado e redirecionar para /login
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      // evento global para o shell reagir
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }
    return Promise.reject(err);
  }
);