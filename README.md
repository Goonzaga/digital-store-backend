# Digital Store Backend

API REST de comércio eletrônico desenvolvida com Node.js, Express, Sequelize e MySQL, conforme os requisitos do [repositório da Geração Tech](https://github.com/digitalcollegebr/projeto-backend).

## Requisitos locais

- Node.js e npm
- MySQL

## Configuração

1. Instale as dependências com `npm install`.
2. Copie `.env.example` para `.env` e configure as variáveis locais do MySQL e um `JWT_SECRET` aleatório. Não versione `.env`.
3. Crie no MySQL o banco indicado em `DB_NAME`.
4. Execute `npm run db:migrate` para criar as tabelas.
5. Inicie com `npm run dev` ou `npm start`.

A API não usa `sequelize.sync()`; o schema é controlado pelas migrations em `src/migrations`.

## Scripts

- `npm start`: inicia a API.
- `npm run dev`: inicia com Nodemon.
- `npm test`: executa Jest/Supertest.
- `npm run db:migrate`: aplica migrations pendentes.
- `npm run db:migrate:undo`: reverte a migration mais recente.

## Endpoints oficiais

### Usuários

- `GET /v1/user/:id`
- `POST /v1/user` — cadastro com `firstname`, `surname`, `email`, `password` e `confirmPassword`.
- `PUT /v1/user/:id`
- `DELETE /v1/user/:id`
- `POST /v1/user/token` — recebe `email` e `password`, retorna `{ "token": "..." }`.

### Categorias

- `GET /v1/category/search` — suporta `limit` (padrão 12, `-1` sem limite), `page` (padrão 1), `fields` e `use_in_menu`.
- `GET /v1/category/:id`
- `POST /v1/category`
- `PUT /v1/category/:id`
- `DELETE /v1/category/:id`

### Produtos

- `GET /v1/product/search` — suporta `limit`, `page`, `fields`, `match`, `category_ids`, `price-range` e `option[id]`.
- `GET /v1/product/:id`
- `POST /v1/product`
- `PUT /v1/product/:id`
- `DELETE /v1/product/:id`

As rotas de escrita protegidas recebem `Authorization: Bearer <jwt>`. O cadastro e a emissão de token de usuário permanecem públicos para que o fluxo de autenticação possa começar. Respostas de atualização e exclusão bem sucedidas usam `204` sem corpo; erros passam pelo middleware central.

Imagens enviadas em Base64 são salvas em `uploads/` e servidas pelo caminho `/media/...`. A pasta de uploads é ignorada pelo Git.

## Estrutura

```text
src/
  config/       # Sequelize e configuração da CLI
  controllers/  # adaptação HTTP
  middleware/  # autenticação e erros
  migrations/  # schema versionado
  models/       # entidades e associações Sequelize
  routes/       # endpoints /v1
  services/     # regras de negócio
  app.js
  server.js
tests/
```
