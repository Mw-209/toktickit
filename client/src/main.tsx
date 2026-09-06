import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.js";
import { RequesterProvider } from "./context/RequesterContext.js";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RequesterProvider>
      <App />
    </RequesterProvider>
  </React.StrictMode>
);
