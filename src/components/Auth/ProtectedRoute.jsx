import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // Sostituisci con la tua logica di autenticazione
  const isAuthenticated = !!localStorage.getItem("token");

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
