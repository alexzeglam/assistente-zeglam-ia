import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { useConsole } from "@/contexts/ConsoleContext";

export function Console({ logs: initialLogs = [] }: { logs?: any[] } = {}) {
  const { logs, clearLogs } = useConsole();
  const isAutoScroll = true;
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAutoScroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const handleClear = () => {
    clearLogs();
  };

  const handleCopy = () => {
    const text = logs
      .map((log) => `[${log.type.toUpperCase()}] ${log.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Console copiado para a área de transferência!");
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case "error":
        return "text-red-600";
      case "warn":
        return "text-yellow-600";
      case "info":
        return "text-blue-600";
      default:
        return "text-gray-400";
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Console de Debug</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={logs.length === 0}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copiar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={logs.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto bg-black rounded border border-gray-700 p-3 font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-gray-500">Nenhuma mensagem no console...</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="mb-1">
                <span className={`${getLogColor(log.type)} font-semibold`}>
                  [{log.type.toUpperCase()}]
                </span>
                <span className="text-gray-300 ml-2">{log.message}</span>
                <span className="text-gray-500 ml-2 text-xs">
                  {log.timestamp.toLocaleTimeString()}
                </span>
                {log.stack && (
                  <div className="text-red-400 text-xs mt-1 ml-4 whitespace-pre-wrap">
                    {log.stack}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={consoleEndRef} />
        </div>
            <label className="flex items-center gap-2 mt-3 text-sm">
          <input
            type="checkbox"
            defaultChecked={true}
            className="rounded"
          />
          Auto-scroll
        </label>
      </CardContent>
    </Card>
  );
}
