import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
if (import.meta.env.DEV) {
  // Development-only validation. It reads the build/audit source inventory, so
  // it must not become a production dependency of the customer bundle.
  void import("./features/interview/validateQuestionBank").then(({ validateQuestionBank }) => {
    const issues = validateQuestionBank();
    if (issues.length > 0) {
      console.warn(`[question bank] ${issues.length} structural issue(s)`);
      for (const issue of issues) console.warn(`[question bank] ${issue}`);
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
