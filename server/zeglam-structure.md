# Estrutura da Página de Romaneios do Zeglam

## Fluxo de Navegação
1. Login em https://zeglam.semijoias.net/admin/
2. Clicar em `#li-virtualcatalog` (Grupo de Compras) - muda hash para #virtualcatalog
3. Buscar link na tabela (51 linhas, header: Nome, Criado em, Encerramento, Ações)
4. Clicar em "Romaneios" (onclick="Main.getObj('VirtualCatalog').listInvoices(167);")
5. Página carrega via AJAX - título muda para "Xangai Bruto 40% - JANEIRO 2026" / "Romaneio dos Clientes"

## Tabela de Romaneios (após clicar em Romaneios)
- **Header**: Nome | Qtd Produtos | Valor Produtos | Total Compra | Saldo Aberto | Status | Romaneio
- **110 linhas** (clientes)
- **Status badges**:
  - Verde: "Pagamento Concluído" (pago)
  - Amarelo/Laranja: "Aguardando pagamento" (devedor)
- **NÃO há coluna WhatsApp** na tabela de romaneios
- **Saldo Aberto** = coluna 4 (index 4) - valor que o cliente deve
- **Valor Produtos** = coluna 2 (index 2)
- **Total Compra** = coluna 3 (index 3)

## Resumo no rodapé
- Quantidade Produtos: 5.765 (110 clientes)
- Valor Produtos: R$ 75.825,80
- Total Geral: R$ 52.252,24
- Total Pago: R$ 52.404,01 (99.34%)

## Problemas a Corrigir
1. Após clicar em Romaneios, a tabela antiga ainda está no DOM - preciso buscar a tabela correta pelo header "Saldo Aberto"
2. Não há coluna WhatsApp - preciso extrair apenas Nome, Saldo Aberto e Status
3. O WhatsApp pode estar disponível clicando no cliente ou em outra página
