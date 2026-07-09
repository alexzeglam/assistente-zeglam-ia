# Project TODO - Assistente Zeglam IA

## Banco de Dados
- [x] Criar tabela `configuracoes` (credenciais Zeglam, chave PIX, mensagens personalizadas)
- [x] Criar tabela `manual_instrucoes` (texto editável do manual da IA)
- [x] Criar tabela `relatorios` (histórico de relatórios gerados)
- [x] Criar tabela `devedores` (devedores extraídos por relatório)
- [x] Gerar migration SQL e aplicar no banco

## Backend (tRPC + LLM)
- [x] Criar procedure de configurações (salvar/carregar credenciais e PIX)
- [x] Criar procedure do manual (salvar/carregar instruções)
- [x] Criar procedure do agente de IA (interpretar comando + decidir ação)
- [x] Criar procedure de relatórios (salvar/listar histórico)
- [x] Criar procedure de extração de devedores (simulação de automação)
- [x] Criar procedure de geração de links de WhatsApp

## Frontend (Interface Visual)
- [x] Criar DashboardLayout com sidebar de navegação
- [x] Criar página Dashboard com área de comando em texto natural
- [x] Criar página Configurações (credenciais + chave PIX)
- [x] Criar página Manual de Instruções (editor editável)
- [x] Criar página Relatórios (histórico)
- [x] Criar tabela de resultados com nome, WhatsApp, valor, status
- [x] Criar botão de exportação CSV/Excel
- [x] Criar botão de geração de links de WhatsApp
- [x] Criar cards de estatísticas no dashboard

## Integração
- [x] Conectar comando de texto com agente de IA
- [x] Conectar resultados da IA com tabela de devedores
- [x] Conectar devedores com geração de links WhatsApp
- [x] Persistir relatórios no banco de dados

## Testes e Entrega
- [x] Escrever testes vitest para procedures principais
- [x] Salvar checkpoint final
- [x] Entregar sistema ao usuário

## Melhorias
- [x] Adicionar campo de API key da OpenAI nas Configurações
- [x] Modificar backend para usar API key do usuário quando disponível
- [x] Atualizar schema do banco para armazenar a API key

## Melhorias Solicitadas
- [x] Criar aba de Console no Dashboard para visualizar erros em tempo real
- [x] Adicionar status de login nas Configurações (mostrando se está logado ou não)
- [x] Adicionar botão "Sistema Original" que abre zeglam.semijoias.net/admin já logado


## Integração com Playwright (Automação Real)
- [x] Criar script de automação com Playwright para login no Zeglam
- [x] Implementar navegação até "Grupo de Compras"
- [x] Implementar busca por link específico (com paginação)
- [x] Implementar clique em "Romaneios" e extração de tabela
- [x] Filtrar apenas clientes com status "Aguardando pagamento"
- [x] Integrar script no backend como procedure tRPC
- [x] Testar extração real com dados do Zeglam (Playwright instalado com dependências do sistema)


## Correções Urgentes
- [x] Corrigir Console para capturar logs de erro quando IA é executada (ConsoleContext criado e integrado globalmente)
- [x] Validar que Playwright está funcionando corretamente (instalado com todas as dependências)

## Status Final - Sistema Completo e Funcional ✅
- [x] Playwright funcionando com extração real de devedores do Zeglam
- [x] Console capturando logs em tempo real via ConsoleContext global
- [x] 23 testes vitest passando (automação, integração, auth)
- [x] Automação testada com credenciais reais
- [x] Exemplo de resultado: Sirley Noronha - R$ 586,08 (Xangai Bruto - Link 013)
- [x] Sistema pronto para uso em produção local
