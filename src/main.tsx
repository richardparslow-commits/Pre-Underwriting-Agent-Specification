import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { validateQuestionBank } from "./features/interview/validateQuestionBank";

if (import.meta.env.DEV) {
  const issues = validateQuestionBank();
  if (issues.length > 0) {
    console.warn(`[question bank] ${issues.length} structural issue(s)`);
    for (const issue of issues) console.warn(`[question bank] ${issue}`);
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
