import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";

const AuthContext = createContext(null);

const AUTHORIZED_EMAIL = String(
  import.meta.env.VITE_AUTHORIZED_EMAIL ?? ""
)
  .trim()
  .toLowerCase();

const DENIED_MESSAGE = "Acceso denegado: Usuario no autorizado";

function normalizeEmail(email) {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

function isAuthorizedUser(user) {
  return Boolean(user?.email) && normalizeEmail(user.email) === AUTHORIZED_EMAIL;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      if (!isAuthorizedUser(firebaseUser)) {
        setAuthError(DENIED_MESSAGE);
        setUser(null);
        setLoading(false);
        await signOut(auth);
        return;
      }

      setAuthError(null);
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setAuthError(null);
    setIsSigningIn(true);

    try {
      const { user: signedInUser } = await signInWithPopup(auth, googleProvider);

      if (!isAuthorizedUser(signedInUser)) {
        setAuthError(DENIED_MESSAGE);
        setUser(null);
        await signOut(auth);
      }
    } catch (error) {
      if (
        error?.code === "auth/popup-closed-by-user" ||
        error?.code === "auth/cancelled-popup-request"
      ) {
        return;
      }

      setAuthError(
        error?.code === "auth/unauthorized-domain"
          ? "Este dominio no está autorizado en Firebase Authentication."
          : "No se pudo iniciar sesión. Inténtalo de nuevo."
      );
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthError(null);
    await signOut(auth);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isSigningIn,
      authError,
      loginWithGoogle,
      logout,
      isAuthenticated: Boolean(user),
    }),
    [user, loading, isSigningIn, authError, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }

  return context;
}
