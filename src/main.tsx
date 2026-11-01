import "@fontsource-variable/big-shoulders-display";
import "@fontsource-variable/public-sans";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { Toaster } from "./components/ui/sonner";
import { iniciarTema } from "./lib/tema";
import "./styles/globals.css";

registerSW({ immediate: true });
iniciarTema();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Toaster />
  </StrictMode>,
);
