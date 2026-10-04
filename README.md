# topgo

Aplicação web de rede social para compartilhar momentos, mídias e interações. O projeto combina Next.js, React, TypeScript, Express e Supabase.

> MVP funcional: autenticação, feed, posts com imagem/vídeo, perfis, seguir, comentários, curtidas, reposts, favoritos, temas e navegação responsiva.

## Arquitetura

```text
frontend/  Next.js 14 + React + Tailwind + Supabase Auth/Storage/Database
backend/   Express + TypeScript para health check e endpoints complementares
```

O frontend usa o cliente público do Supabase protegido por RLS. A chave `service_role` é exclusiva do backend e nunca deve ir para o navegador.

## Requisitos

- Node.js 18.17+ (recomendado: Node.js 20 LTS)
- npm 9+
- Projeto no [Supabase](https://supabase.com/)

## Instalação

```bash
git clone <URL_DO_REPOSITÓRIO>
cd entre-nos
npm install
cd frontend && npm install
cd ../backend && npm install
cd ..
```

1. Crie um projeto no Supabase.
2. Execute [`frontend/supabase/schema.sql`](frontend/supabase/schema.sql) no SQL Editor.
3. Copie `frontend/.env.example` para `frontend/.env.local` e informe a URL e a chave anon.
4. Copie `backend/.env.example` para `backend/.env` se usar a API.
5. Rode `npm run dev` e abra `http://localhost:3000`.

O backend fica em `http://localhost:4000`.

## Variáveis de ambiente

Frontend: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Backend: `PORT`, `FRONTEND_URL`, `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`. Nunca publique a última variável.

## Banco de dados

O schema cria perfis, posts, mídias, seguidores, comentários, curtidas, reposts e favoritos, além de RLS e do bucket `media`. Para conteúdo privado, prefira bucket privado e URLs assinadas; revise as políticas antes do deploy.

## Scripts

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Frontend e backend em paralelo |
| `npm run build` | Build completo |
| `cd frontend && npm run start` | Frontend em produção |
| `cd backend && npm run start` | API compilada |

## API

Base local: `http://localhost:4000`

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/health` | Health check |
| GET | `/api/profile/:id` | Busca perfil |
| PATCH | `/api/profile/:id` | Atualiza perfil |
| GET | `/api/posts` | Lista posts |
| POST | `/api/posts` | Cria post |
| DELETE | `/api/posts/:id` | Remove post |

```bash
curl http://localhost:4000/health
```

## Estrutura

```text
├── backend/src/server.ts        # API Express
├── frontend/app                 # Rotas e telas Next.js
├── frontend/components          # Componentes reutilizáveis
├── frontend/lib/supabase.ts     # Cliente Supabase
├── frontend/supabase/schema.sql # Schema e RLS
└── frontend/public               # Assets públicos
```

## Deploy

Publique o frontend em Vercel e o backend em Render, Railway, Fly.io ou equivalente. Configure as variáveis de ambiente e limite `FRONTEND_URL` ao domínio real.

Antes de liberar: execute `npm run build`, configure URLs de autenticação do Supabase, valide RLS, limite uploads e confirme que nenhum `.env` foi versionado.

## Segurança

- Nunca exponha `SUPABASE_SERVICE_ROLE_KEY`.
- Não confie em `author_id` enviado pelo cliente em endpoints server-side; valide o JWT.
- Restrinja CORS em produção.
- Limite tipo e tamanho de arquivos.
- Revogue credenciais imediatamente se forem expostas.

## Roadmap

Validação centralizada de payloads, autenticação JWT na API, testes automatizados, paginação do feed, notificações em tempo real, moderação, CI e Storage privado.

## Contribuição

Crie uma branch (`git checkout -b feat/minha-melhoria`), faça uma alteração pequena, rode `npm run build` e abra um pull request com contexto e passos de validação.

## Licença

Defina a licença antes de publicar. MIT é uma opção permissiva comum; adicione um arquivo `LICENSE` com o texto e os titulares corretos.
