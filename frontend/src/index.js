import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Register service worker for PWA functionality
serviceWorkerRegistration.register({
  onSuccess: () => console.log('✅ PWA yüklendi - Artık çevrimdışı çalışabilir'),
  onUpdate: () => console.log('🔄 Yeni sürüm mevcut - Sayfayı yenileyin')
});
