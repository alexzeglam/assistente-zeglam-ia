import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Save, RotateCcw, Info } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Manual() {
  const [conteudo, setConteudo] = useState("");
  const [salvo, setSalvo] = useState(false);

  const manualQuery = trpc.manual.get.useQuery();
  const saveMutation = trpc.manual.upsert.useMutation();

  useEffect(() => {
    if (manualQuery.data) {
      setConteudo(manualQuery.data.conteudo);
    }
  }, [manualQuery.data]);

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({ conteudo });
      setSalvo(true);
      toast.success("Manual de instruções atualizado!");
    } catch {
      toast.error("Erro ao salvar manual.");
    }
  };

  const handleReset = () => {
    if (manualQuery.data) {
      setConteudo(manualQuery.data.conteudo);
      setSalvo(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manual de Instruções da IA</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ensine à IA como navegar no seu sistema Zeglam. Este manual é consultado a cada execução.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm space-y-2">
              <p className="font-medium">Como funciona o "ensino"?</p>
              <p className="text-muted-foreground">
                Escreva aqui as regras de navegação do Zeglam em português simples. A IA vai ler
                este manual antes de executar qualquer comando. Se o site mudar, basta atualizar
                as instruções aqui — sem precisar de programador.
              </p>
              <p className="text-muted-foreground">
                Exemplo: "O menu de grupos se chama 'Grupo de Compras'. Para ver devedores,
                procure o status 'Aguardando pagamento'."
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Editor do Manual
          </CardTitle>
          <CardDescription>
            Edite as instruções abaixo. Use linguagem natural em português.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={conteudo}
            onChange={(e) => {
              setConteudo(e.target.value);
              setSalvo(false);
            }}
            className="min-h-[500px] font-mono text-sm"
            placeholder="Escreva as regras de navegação do Zeglam aqui..."
          />
          <div className="flex items-center justify-between">
            {salvo ? (
              <p className="text-sm text-green-600 font-medium">Salvo!</p>
            ) : (
              <p className="text-sm text-muted-foreground">Alterações não salvas</p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} disabled={saveMutation.isPending}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Descartar
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending || salvo}>
                <Save className="mr-2 h-4 w-4" />
                {saveMutation.isPending ? "Salvando..." : "Salvar Manual"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
