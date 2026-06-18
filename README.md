# Bolão Copa 2026 🏆🇧🇷

Um sistema completo, leve e seguro para gerenciar um Bolão da Copa do Mundo de 2026.

## Funcionalidades
- **Área do Usuário**: Interface moderna (glassmorphism) onde o usuário pode ver os próximos jogos do Brasil, registrar palpites de placar, anexar comprovante de pagamento via PIX e consultar o status de seus palpites usando apenas o número de WhatsApp.
- **Painel Administrativo**: Área restrita (protegida por usuário/senha) para que o administrador possa cadastrar novos jogos, configurar a chave PIX, validar pagamentos de palpites e apurar o resultado de jogos finalizados.
- **Apuração Automática**: O sistema divide automaticamente 50% do valor arrecadado entre todos os usuários que acertaram na mosca o placar do jogo.
- **Banco de Dados em Nuvem**: Utiliza MySQL para persistência de dados (Jogos, Palpites, Configurações).

## Tecnologias Utilizadas
- **Backend**: Node.js com Express
- **Banco de Dados**: MySQL (via `mysql2/promise`)
- **Uploads**: Multer (para upload local de comprovantes PIX)
- **Frontend**: HTML5 puro, Alpine.js (para reatividade leve) e Tailwind CSS via CDN.

## Como rodar o projeto localmente

### 1. Requisitos
- Node.js instalado (v16 ou superior)
- MySQL (ou utilize o FreeSQLDatabase configurado por padrão)

### 2. Instalação
Clone este repositório e instale as dependências:
```bash
git clone https://github.com/seu-usuario/copa2026-bolao.git
cd copa2026-bolao
npm install
```

### 3. Configuração de Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:
```bash
cp .env.example .env
```
Preencha o `.env` com suas credenciais do banco de dados e as senhas do painel administrativo.

### 4. Executando o Servidor
```bash
node server.js
```
Acesse no seu navegador:
- Página Principal: `http://localhost:3000/`
- Painel Admin: `http://localhost:3000/painel`

A área administrativa é protegida por um sistema de autenticação via Bearer Token. Nenhum dado sensível é exposto ao público, e as credenciais não ficam hardcoded no código graças ao uso da biblioteca `dotenv`.

## Deploy no Vercel

O projeto já está configurado com um arquivo `vercel.json` para facilitar o deploy gratuito no Vercel utilizando as **Serverless Functions** do Node.js.

### Passos para Deploy:

1. **Suba seu código para o GitHub** seguindo o passo a passo de versionamento.
2. Crie uma conta no [Vercel](https://vercel.com/) (caso não tenha) e faça login com seu GitHub.
3. Clique em **Add New... > Project** e importe o seu repositório `copa2026-bolao`.
4. Na tela de configuração de Deploy do Vercel, vá até a seção **Environment Variables** (Variáveis de Ambiente) e adicione todas as variáveis do seu `.env`:
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASS`
   - `DB_NAME`
   - `ADMIN_USER`
   - `ADMIN_PASS`
   - `ADMIN_TOKEN`
5. Clique em **Deploy**!

> [!WARNING]
> **Aviso sobre Comprovantes PIX (Uploads):**
> O Vercel possui um sistema de arquivos *Serverless/Efêmero*. Isso significa que arquivos enviados via formulário (fotos de comprovantes) salvos na pasta `/public/uploads/` não ficarão salvos permanentemente após o servidor reiniciar (a cada requisição). O resto da aplicação (Jogos, Palpites e Configurações) funcionará perfeitamente graças ao banco de dados MySQL externo (FreeSQLDatabase). 

---
Feito rumo ao Hexa! ⭐️⭐️⭐️⭐️⭐️⭐️
