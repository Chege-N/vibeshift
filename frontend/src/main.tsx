import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontFamily: "'Satoshi', sans-serif",
            fontSize: "14px",
            background: "#1a1a15",
            color: "#fafaf7",
            borderRadius: "10px",
            padding: "12px 16px",
          },
          success: { iconTheme: { primary: "#ff710a", secondary: "#fff" } },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);
