# Eleição de Oficiais 2026 — IPST

Sistema de votação usado na Assembleia Geral Extraordinária da **Igreja Presbiteriana de Serra Talhada**
(08/11/2026) para a eleição de diáconos e presbíteros.

> **Código aberto apenas para auditoria.** Leia a [LICENSE](LICENSE): é permitido ler e executar
> localmente para verificar o funcionamento; não é permitido usar, replicar, modificar ou vender.

## Onde estão as regras da eleição

| Regra | Arquivo |
|---|---|
| Identificação do membro (nome **e** telefone), cadastro | `app/api/election/member/register/route.ts` |
| Voto pelo celular: liberação, conferência, 1 voto por membro, limite de vagas | `app/api/election/vote/route.ts` |
| Validação da cédula (vagas, repetidos, cargo) e normalização de nome/telefone | `lib/election-rules.ts` |
| Cédula de papel: entrega pela Mesa e escrutínio (apuradas ≤ entregues) | `app/api/election/mesa/paper-handout/route.ts`, `app/api/election/vote/paper/route.ts` |
| Conferência da ata e quórum | `app/api/election/mesa/*` |
| Apuração, eleitos (maioria simples), empate | `context/election-context.tsx` (`computeResults`) |
| O que fica gravado (sigilo do voto) | `db/init.mjs` — tabela `votes` não tem nenhuma referência ao membro |

## Rodar localmente (auditoria)

Requisitos: Node 20+, pnpm, Docker.

```bash
docker run -d --name ipst-pg -e POSTGRES_USER=ipst -e POSTGRES_PASSWORD=ipst -e POSTGRES_DB=app_ipst -p 5440:5432 postgres:16-alpine
docker run -d --name ipst-redis -p 6390:6379 redis:7-alpine
cp .env.example .env.local   # preencha com os endereços locais acima e um SESSION_SECRET aleatório
pnpm install
pnpm db:init                 # exige ADMIN_INITIAL_PASSWORD no ambiente
pnpm dev
```

## Variáveis de ambiente

Nenhuma credencial fica no código. Veja `.env.example`:

- `DATABASE_URL`, `REDIS_URL` — conexões.
- `SESSION_SECRET` — assina o login da Mesa (mínimo 32 caracteres; `openssl rand -base64 48`).
- `ADMIN_INITIAL_PASSWORD` — só para o `db:init` criar o primeiro admin.
- `ENABLE_STRESS_TEST` / `STRESS_ADMIN_KEY` — simulação de carga, **desligada por padrão** (apaga dados).

Para trocar a senha da Mesa: `NEW_ADMIN_PASSWORD='...' pnpm admin:password`.
