import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Eye, Download, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Relatorios() {
  const [relatorioSelecionado, setRelatorioSelecionado] = useState<number | null>(null);

  const relatoriosQuery = trpc.relatorios.list.useQuery();
  const relatorioDetalheQuery = trpc.relatorios.getById.useQuery(
    { id: relatorioSelecionado ?? 0 },
    { enabled: relatorioSelecionado !== null }
  );

  const handleExport = (devedores: any[], relatorioId: number) => {
    if (!devedores || devedores.length === 0) return;
    const headers = ["Nome", "WhatsApp", "Valor", "Status", "Link Origem", "Cobrança"];
    const rows = devedores.map(d => [
      d.nome, d.whatsapp, d.valor, d.status, d.linkOrigem || "", d.cobrancaEnviada,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_${relatorioId}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
  };

  const relatorios = relatoriosQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Histórico de todas as extrações geradas pelo sistema.
        </p>
      </div>

      {relatorios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Nenhum relatório ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Execute um comando no Dashboard para gerar seu primeiro relatório.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Relatórios</CardTitle>
            <CardDescription>{relatorios.length} relatório(s) gerado(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Link Alvo</TableHead>
                  <TableHead>Devedores</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatorios.map((rel) => (
                  <TableRow key={rel.id}>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(rel.createdAt).toLocaleString("pt-BR")}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{rel.tipoRelatorio}</TableCell>
                    <TableCell>{rel.linkAlvo || "Geral"}</TableCell>
                    <TableCell>{rel.totalDevedores}</TableCell>
                    <TableCell className="font-semibold text-primary">{rel.valorTotal}</TableCell>
                    <TableCell>
                      <Badge
                        variant={rel.status === "concluido" ? "default" : rel.status === "erro" ? "destructive" : "secondary"}
                      >
                        {rel.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRelatorioSelecionado(rel.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
                          <DialogHeader>
                            <DialogTitle>Relatório #{rel.id}</DialogTitle>
                          </DialogHeader>
                          {relatorioDetalheQuery.data && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-3 gap-4">
                                <div className="rounded-lg border p-3">
                                  <p className="text-xs text-muted-foreground">Comando</p>
                                  <p className="text-sm font-medium mt-1">{rel.comandoOriginal}</p>
                                </div>
                                <div className="rounded-lg border p-3">
                                  <p className="text-xs text-muted-foreground">Total Devedores</p>
                                  <p className="text-2xl font-bold mt-1">{rel.totalDevedores}</p>
                                </div>
                                <div className="rounded-lg border p-3">
                                  <p className="text-xs text-muted-foreground">Valor Total</p>
                                  <p className="text-2xl font-bold mt-1 text-primary">{rel.valorTotal}</p>
                                </div>
                              </div>
                              <Button
                                onClick={() => handleExport(relatorioDetalheQuery.data?.devedores ?? [], rel.id)}
                                size="sm"
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Exportar CSV
                              </Button>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>WhatsApp</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Cobrança</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {relatorioDetalheQuery.data.devedores.map((d) => (
                                    <TableRow key={d.id}>
                                      <TableCell className="font-medium">{d.nome}</TableCell>
                                      <TableCell>{d.whatsapp}</TableCell>
                                      <TableCell className="text-primary font-semibold">{d.valor}</TableCell>
                                      <TableCell>
                                        <Badge variant="secondary">{d.status}</Badge>
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          variant={
                                            d.cobrancaEnviada === "enviada" ? "default" :
                                            d.cobrancaEnviada === "falhou" ? "destructive" : "secondary"
                                          }
                                        >
                                          {d.cobrancaEnviada}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
