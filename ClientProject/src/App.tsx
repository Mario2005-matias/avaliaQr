import { lazy, Suspense } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthGuard } from "./components/AuthGuard";
import { TechnicianLayout } from "./layouts/TechnicianLayout";
import { AdminLayout } from "./layouts/AdminLayout";

const Login = lazy(() => import("./pages/Login"));
const Evaluate = lazy(() => import("./pages/Evaluate"));
const Today = lazy(() => import("./pages/technician/today"));
const QrScreen = lazy(() => import("./pages/technician/QrScreen"));
const TechnicianRatings = lazy(() => import("./pages/technician/TechnicianRatings"));
const AdminRatings = lazy(() => import("./pages/admin/AdminRatings"));
const AdminTechnicians = lazy(() => import("./pages/admin/AdminTechnicians"));
const AdminSchools = lazy(() => import("./pages/admin/AdminSchools"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));

function RouteFallback() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center gap-3 bg-gray-50 text-gray-500 dark:bg-slate-900 dark:text-slate-400">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" aria-hidden="true" />
      {t("common.loading")}
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const pageVariants = {
    initial: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 },
    enter: { opacity: 1, y: 0 },
    exit: reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 },
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
        className="min-h-screen"
      >
      <Suspense fallback={<RouteFallback />}>
      <Routes location={location}>
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
      </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}