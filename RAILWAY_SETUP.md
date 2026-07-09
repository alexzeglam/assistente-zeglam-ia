# Deploy no Railway

## Pré-requisitos

1. Conta no Railway (https://railway.app)
2. Conta no GitHub
3. Token do GitHub para conectar ao Railway

## Passos para Deploy

### 1. Criar Repositório no GitHub

```bash
cd /home/ubuntu/assistente-zeglam-ia
git init
git add .
git commit -m "Initial commit: Assistente Zeglam IA com Playwright"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/assistente-zeglam-ia.git
git push -u origin main
```

### 2. Conectar ao Railway

1. Acesse https://railway.app
2. Faça login com sua conta
3. Clique em "New Project"
4. Selecione "Deploy from GitHub"
5. Autorize o Railway a acessar seu GitHub
6. Selecione o repositório `assistente-zeglam-ia`
7. Clique em "Deploy"

### 3. Configurar Variáveis de Ambiente

No painel do Railway, vá para "Variables" e adicione:

```
NODE_ENV=production
DATABASE_URL=sua_url_do_banco_de_dados
JWT_SECRET=sua_chave_secreta
VITE_APP_ID=seu_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://app.manus.im
OWNER_OPEN_ID=seu_owner_id
OWNER_NAME=seu_nome
BUILT_IN_FORGE_API_URL=sua_url_da_api
BUILT_IN_FORGE_API_KEY=sua_chave_da_api
VITE_FRONTEND_FORGE_API_KEY=sua_chave_frontend
VITE_FRONTEND_FORGE_API_URL=sua_url_frontend
VITE_ANALYTICS_ENDPOINT=seu_endpoint
VITE_ANALYTICS_WEBSITE_ID=seu_website_id
```

### 4. Configurar Banco de Dados

Se estiver usando um banco de dados externo (MySQL, PostgreSQL):

1. No Railway, clique em "Add Service"
2. Selecione o banco de dados desejado
3. Configure as credenciais
4. O Railway vai gerar a `DATABASE_URL` automaticamente

### 5. Deploy

O Railway fará o deploy automaticamente quando você fizer push para o repositório:

```bash
git push origin main
```

## Troubleshooting

### Erro: "Executable doesn't exist"

Se o Playwright não conseguir encontrar o Chromium:

1. O Dockerfile instala o Chromium do Alpine Linux
2. O Railway usa o Chromium do sistema
3. Não é necessário instalar o Playwright browser

### Erro: "Build failed"

1. Verifique os logs no painel do Railway
2. Certifique-se de que o `package.json` tem todas as dependências
3. Verifique se o `Dockerfile` está correto

### Aplicação não inicia

1. Verifique as variáveis de ambiente
2. Verifique a conexão com o banco de dados
3. Verifique os logs no Railway

## Monitoramento

No painel do Railway você pode:

- Ver logs em tempo real
- Monitorar CPU e memória
- Gerenciar variáveis de ambiente
- Fazer rollback de versões
- Escalar a aplicação

## Suporte

Para mais informações sobre Railway, visite: https://docs.railway.app
