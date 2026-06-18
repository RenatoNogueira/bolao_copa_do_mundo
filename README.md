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

## Segurança
A área administrativa é protegida por um sistema de autenticação via Bearer Token. Nenhum dado sensível é exposto ao público, e as credenciais não ficam hardcoded no código graças ao uso da biblioteca `dotenv`.

---
Feito rumo ao Hexa! ⭐️⭐️⭐️⭐️⭐️⭐️
