// src/main.tsx
// React 18 entry point — mounts App into #root

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";


const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found in index.html");

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
