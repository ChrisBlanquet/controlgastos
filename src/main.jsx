import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./context/AuthContext";
import { PrivacyGate, PrivacyProvider } from "./context/PrivacyContext";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PrivacyProvider>
      <PrivacyGate>
        <AuthProvider>
          <App />
        </AuthProvider>
      </PrivacyGate>
    </PrivacyProvider>
  </StrictMode>
);
