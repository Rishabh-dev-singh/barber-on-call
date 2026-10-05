import { useEffect } from "react";
import { BrowserRouter, useNavigate, useLocation } from "react-router-dom";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import "./App.css";
import AppRoutes from "./routes/AppRoutes";
import AppLayout from "./components/layout/AppLayout";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";

function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const listenerPromise = CapApp.addListener("backButton", () => {
      const rootPaths = [
        "/",
        "/customer/dashboard",
        "/barber/dashboard",
        "/customer/login",
        "/barber/login",
      ];

      if (rootPaths.includes(location.pathname)) {
        CapApp.minimizeApp();
      } else {
        navigate(-1);
      }
    });

    return () => {
      listenerPromise.then((handle) => handle.remove()).catch(() => {});
    };
  }, [navigate, location]);

  return null;
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <BackButtonHandler />
          <AppLayout>
            <AppRoutes />
          </AppLayout>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;