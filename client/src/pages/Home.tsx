import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, Send, Download, MessageCircle, AlertCircle } from "lucide-react";
import { useConsole } from "@/contexts/ConsoleContext";
import { Console } from "@/components/Console";

export default function Home() {
  const [comando, setComando] = useState("");
  const [devedores, setDevedores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [objetivoIa, setObjetivoIa] = useState("");
  const [linksWhatsapp, setLinksWhatsapp] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("dashboard");
  const { logs: consoleLogs, addLog, clearLogs } = useConsole();

  const executarMutation = trpc.agente.executarComando.useMutation();

  const configQuery = trpc.configuracoes.get.useQuery();

  const handleExecutar = async () => {
    if (!comando.trim()) {
      toast.error("Digite um comando para a IA.");
      return;
    }

    setIsLoading(true);
    clearLogs();

    try {
      toast.info("IA analisando e executando comando...");

      // Extrair link alvo do comando se houver
      const linkMatch = comando.match(/link\s+\d+|Link\s+\d+/i);
      const linkAlvo = linkMatch?.[0] || "";

      const resultado = await executarMutation.mutateAsync({
        comando,
        acao: "extrair_link_especifico",
        link_alvo: linkAlvo,
        objetivo: comando,
      });

      if (resultado.success && resultado.devedores) {
        setDevedores(resultado.devedores);
        setObjetivoIa(resultado.objetivo || "Relatório processado");
        toast.success(`${resultado.totalDevedores} devedores encontrados!`);
        addLog({
          type: "log",
          message: `✅ Comando executado com sucesso`,
          timestamp: new Date(),
        });
        addLog({
          type: "log",
          message: `📊 Total de devedores: ${resultado.totalDevedores}`,
          timestamp: new Date(),
        });
        addLog({
          type: "log",
          message: `💰 Valor total: ${resultado.valorTotal}`,
          timestamp: new Date(),
        });
      } else {
        toast.error(resultado.error || "Falha na extração de dados.");
        addLog({
          type: "error",
          message: resultado.error || "Falha na extração de dados",
          timestamp: new Date(),
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      const errorStack = err instanceof Error ? err.stack : "";
      console.error("[ERRO DE COMANDO]", {
        mensagem: errorMessage,
        stack: errorStack,
        comando,
        timestamp: new Date().toISOString(),
      });
      toast.error(`Erro ao processar comando: ${errorMessage}`);
      addLog({
        type: "error",
        message: `❌ Erro: ${errorMessage}`,
        timestamp: new Date(),
        stack: errorStack,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGerarWhatsapp = async () => {
    if (devedores.length === 0) {
      toast.error("Nenhum devedor para gerar cobranças.");
      return;
    }

    const config = configQuery.data;
    if (!config?.chavePix) {
      toast.error("Configure sua chave PIX nas Configurações.");
      return;
    }

    const links: Record<string, string> = {};
    devedores.forEach((devedor) => {
      const mensagem = ((config?.mensagemCobranca) || "Olá {nome}, seu pagamento de {valor} está pendente. Chave PIX: {pix}")
        .replace("{nome}", devedor.nome)
        .replace("{valor}", devedor.valor)
        .replace("{pix}", config?.chavePix || "");

      const whatsappUrl = `https://wa.me/${devedor.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
      links[devedor.nome] = whatsappUrl;
    });

    setLinksWhatsapp(links);
    toast.success("Links de WhatsApp gerados!");
  };

  const handleExportarCSV = () => {
    if (devedores.length === 0) {
      toast.error("Nenhum devedor para exportar.");
      return;
    }

    const csv = [
      ["Nome", "WhatsApp", "Valor", "Status", "Link Origem"],
      ...devedores.map((d) => [d.nome, d.whatsapp, d.valor, d.status, d.linkOrigem]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `devedores_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Arquivo exportado!");
  };

  return (
    <div className="flex-1 p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dashboard Zeglam IA</h1>
        <p className="text-muted-foreground">Conferência de pagamentos e cobrança inteligente</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Devedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devedores.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {devedores
                .reduce((acc, d) => {
                  const valor = parseFloat(d.valor.replace("R$ ", "").replace(",", "."));
                  return acc + (isNaN(valor) ? 0 : valor);
                }, 0)
                .toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || "R$ 0,00"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Online</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="console">Console</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Comando para a IA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Comando para a IA
              </CardTitle>
              <CardDescription>Diga à IA o que você precisa (ex: "Puxe os devedores do Link 013")</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <textarea
                  value={comando}
                  onChange={(e) => setComando(e.target.value)}
                  placeholder="Ex: Puxe os devedores do link XANGAI BRUTOS - NOVIDADES 40% DE DESCONTO - Link 013 - SP"
                  className="w-full h-24 p-3 border border-border rounded-lg bg-background text-foreground"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">Pressione Ctrl+Enter para executar</p>
              </div>
              <Button
                onClick={handleExecutar}
                disabled={isLoading || !comando.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Executando com IA...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Executar com IA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Objetivo da IA */}
          {objetivoIa && (
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader>
                <CardTitle className="text-sm">Objetivo Identificado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-900">{objetivoIa}</p>
              </CardContent>
            </Card>
          )}

          {/* Tabela de Devedores */}
          {devedores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Devedores Encontrados</CardTitle>
                <CardDescription>{devedores.length} cliente(s) com saldo devedor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>WhatsApp</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Link Origem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {devedores.map((devedor, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{devedor.nome}</TableCell>
                          <TableCell>{devedor.whatsapp}</TableCell>
                          <TableCell>{devedor.valor}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-900 border-yellow-200">
                              {devedor.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{devedor.linkOrigem}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-2 mt-6">
                  <Button onClick={handleGerarWhatsapp} variant="default" className="gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Gerar Cobranças WhatsApp
                  </Button>
                  <Button onClick={handleExportarCSV} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Exportar CSV
                  </Button>
                </div>

                {/* Links de WhatsApp */}
                {Object.keys(linksWhatsapp).length > 0 && (
                  <div className="mt-6 space-y-2 p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-900">Links de WhatsApp gerados:</p>
                    {Object.entries(linksWhatsapp).map(([nome, url]) => (
                      <a
                        key={nome}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-green-700 hover:underline truncate"
                      >
                        {nome} →
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="console">
          <Console logs={consoleLogs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
