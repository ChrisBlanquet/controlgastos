import { CreditCard, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.86-.07-1.49-.22-2.14H12v3.88h6.52c-.13 1.07-.84 2.68-2.42 3.76l-.02.14 3.51 2.72.24.02c2.24-2.07 3.53-5.12 3.53-8.38z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.89-1.05 7.85-2.87l-3.74-2.88c-1 .7-2.35 1.19-4.11 1.19-3.15 0-5.82-2.08-6.77-4.96l-.14.01-3.66 2.83-.05.13C3.35 21.54 7.37 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.23 14.48A7.23 7.23 0 0 1 4.84 12c0-.86.15-1.7.38-2.48l-.01-.16-3.7-2.87-.12.06A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.39 5.45l3.84-2.97z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c2.21 0 3.7.96 4.55 1.76l3.32-3.24C17.87 1.19 15.2 0 12 0 7.37 0 3.35 2.46 1.39 6.55l3.83 2.97C6.18 6.64 8.85 4.75 12 4.75z"
      />
    </svg>
  );
}

export default function Login() {
  const { loginWithGoogle, isSigningIn, authError } = useAuth();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-950 px-4 py-8">
      <section className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
              <CreditCard className="h-8 w-8 text-emerald-400" strokeWidth={1.75} />
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400/80">
              México
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Control de Pagos
            </h1>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-400">
              Acceso privado para administrar tus tarjetas, cortes y finanzas.
            </p>
          </div>

          <button
            type="button"
            onClick={loginWithGoogle}
            disabled={isSigningIn}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <GoogleMark />
            {isSigningIn ? "Conectando…" : "Continuar con Google"}
          </button>

          {authError ? (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-left"
            >
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
              <p className="text-sm font-medium text-rose-200">{authError}</p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
