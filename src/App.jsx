import { LoaderCircle } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950">
        <LoaderCircle className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return isAuthenticated ? <Dashboard /> : <Login />;
}
