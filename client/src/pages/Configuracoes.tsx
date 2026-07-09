import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Key, Save, MessageCircle, Sparkles, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Configuracoes() {
  const [emailZeglam, setEmailZeglam] = useState("");
  const [senhaZeglam, setSenhaZeglam] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [whatsappAuto, setWhatsappAuto] = useState(true);
  const [mensagemCobranca, setMensagemCobranca] = useState(
    "Olá {nome}, tudo bem? Seu pagamento de {valor} está pendente. Chave PIX para acerto: {pix}. Se já pagou, desconsidere."
  );

  const configQuery = trpc.configuracoes.get.useQuery();
  const saveMutation = trpc.configuracoes.upsert.useMutation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (configQuery.data) {
      setEmailZeglam(configQuery.data.emailZeglam || "");
      setSenhaZeglam(configQuery.data.senhaZeglam || "");
      setChavePix(configQuery.data.chavePix || "");
      setOpenaiApiKey(configQuery.data.openaiApiKey || "");
      setWhatsappAuto(configQuery.data.whatsappAutomatico === "on");
      setMensagemCobranca(configQuery.data.mensagemCobranca || mensagemCobranca);
      setIsLoggedIn(!!(configQuery.data.emailZeglam && configQuery.data.senhaZeglam));
    }
  }, [configQuery.data]);

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({
        emailZeglam,
        senhaZeglam,
        chavePix,
        openaiApiKey,
        whatsappAutomatico: whatsappAuto ? "on" : "off",
        mensagemCobranca,
      });
      toast.success("Configurações salvas com sucesso!");
    } catch {
      toast.error("Erro ao salvar configurações.");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie suas credenciais e preferências de cobrança.
        </p>
      </div>

      {/* Credenciais Zeglam */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Credenciais do Zeglam
              </CardTitle>
              <CardDescription>
                Seus dados de acesso ao sistema Zeglam. Usados pelo robô para fazer login automaticamente.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {isLoggedIn ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Logado</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-yellow-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Não logado</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("https://zeglam.semijoias.net/admin/", "_blank")}
                className="ml-2"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Sistema Original
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={emailZeglam}
              onChange={(e) => setEmailZeglam(e.target.value)}
              placeholder="seu_email@exemplo.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              value={senhaZeglam}
              onChange={(e) => setSenhaZeglam(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </CardContent>
      </Card>

      {/* API Key da OpenAI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Chave da API OpenAI (Opcional)
          </CardTitle>
          <CardDescription>
            Coloque sua própria chave da OpenAI para controlar o gasto com IA. Se deixar vazio, o sistema usa a IA do Manus automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openai-key">API Key da OpenAI</Label>
            <Input
              id="openai-key"
              type="password"
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
              placeholder="sk-..."
            />
            <p className="text-xs text-muted-foreground">
              Pegue sua chave em <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">platform.openai.com/api-keys</a>. O custo de cada comando é apenas alguns centavos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Cobrança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Configurações de Cobrança
          </CardTitle>
          <CardDescription>
            Sua chave PIX e a mensagem que será enviada aos devedores via WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pix">Chave PIX</Label>
            <Input
              id="pix"
              value={chavePix}
              onChange={(e) => setChavePix(e.target.value)}
              placeholder="CPF, e-mail ou chave aleatória"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label>WhatsApp Automático</Label>
              <p className="text-xs text-muted-foreground">
                Gerar links de WhatsApp automaticamente ao extrair devedores.
              </p>
            </div>
            <Switch checked={whatsappAuto} onCheckedChange={setWhatsappAuto} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mensagem">Modelo de Mensagem de Cobrança</Label>
            <Textarea
              id="mensagem"
              value={mensagemCobranca}
              onChange={(e) => setMensagemCobranca(e.target.value)}
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              Use as variáveis: <code className="bg-muted px-1 rounded">{"{nome}"}</code>,{" "}
              <code className="bg-muted px-1 rounded">{"{valor}"}</code>,{" "}
              <code className="bg-muted px-1 rounded">{"{pix}"}</code>
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} size="lg" disabled={saveMutation.isPending} className="w-full">
        <Save className="mr-2 h-4 w-4" />
        {saveMutation.isPending ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </div>
  );
}
