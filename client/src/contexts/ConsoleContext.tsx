import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type LogEntry = {
  type: "log" | "error" | "warn" | "info";
  message: string;
  timestamp: Date;
  stack?: string;
};

type ConsoleContextType = {
  logs: LogEntry[];
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
};

const ConsoleContext = createContext<ConsoleContextType | undefined>(undefined);

export function ConsoleProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    // Interceptar console.log, console.error, console.warn
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    console.log = (...args) => {
      originalLog(...args);
      setLogs((prev) => [
        ...prev,
        {
          type: "log",
          message: args.map((arg) => {
            if (typeof arg === "string") return arg;
            return JSON.stringify(arg);
          }).join(" "),
          timestamp: new Date(),
        },
      ]);
    };

    console.error = (...args) => {
      originalError(...args);
      const errorObj = args[0];
      setLogs((prev) => [
        ...prev,
        {
          type: "error",
          message: errorObj?.message || JSON.stringify(args),
          timestamp: new Date(),
          stack: errorObj?.stack,
        },
      ]);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      setLogs((prev) => [
        ...prev,
        {
          type: "warn",
          message: args.map((arg) => {
            if (typeof arg === "string") return arg;
            return JSON.stringify(arg);
          }).join(" "),
          timestamp: new Date(),
        },
      ]);
    };

    console.info = (...args) => {
      originalInfo(...args);
      setLogs((prev) => [
        ...prev,
        {
          type: "info",
          message: args.map((arg) => {
            if (typeof arg === "string") return arg;
            return JSON.stringify(arg);
          }).join(" "),
          timestamp: new Date(),
        },
      ]);
    };

    // Interceptar erros não capturados
    const handleError = (event: ErrorEvent) => {
      setLogs((prev) => [
        ...prev,
        {
          type: "error",
          message: event.message,
          timestamp: new Date(),
          stack: event.error?.stack,
        },
      ]);
    };

    window.addEventListener("error", handleError);

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
      window.removeEventListener("error", handleError);
    };
  }, []);

  const addLog = (log: LogEntry) => {
    setLogs((prev) => [...prev, log]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <ConsoleContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </ConsoleContext.Provider>
  );
}

export function useConsole() {
  const context = useContext(ConsoleContext);
  if (!context) {
    throw new Error("useConsole deve ser usado dentro de ConsoleProvider");
  }
  return context;
}
