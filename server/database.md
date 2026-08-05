# Backend Auth et RBAC

## Setup local

1. Verifier `server/.env`
2. Installer les dependances
3. Executer `npm run prisma:format`
4. Executer `npm run prisma:validate`
5. Executer `npm run prisma:migrate:deploy`
6. Executer `npm run prisma:seed`
7. Lancer `npm run dev`

## Variables importantes

- `DATABASE_URL`: base Postgres locale par defaut
- `APP_ORIGINS`: origines front autorisees par CORS
- `SESSION_IDLE_TIMEOUT_MINUTES`: expiration apres 1h d inactivite
- `BREVO_API_KEY`: cle API Brevo pour email/SMS
- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_PHONE`
- `SUPER_ADMIN_PASSWORD`

## Endpoints Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

## Endpoints Admin

- `GET /api/admin/access/options`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:userId/access`
- `PATCH /api/admin/users/:userId/status`

## Notes

- Les sessions utilisent un cookie `httpOnly`.
- La session est invalidee apres 1h d inactivite.
- Les modules RH accessibles sont calcules a partir du role et des acces directs utilisateur.
- Le mot de passe temporaire et le code de reinitialisation peuvent etre retournes en reponse si `EXPOSE_DEBUG_SECRETS=true`.
- La strategie Prisma du projet est documentee dans `server/prisma/MIGRATION_STRATEGY.md`.

## Workflow Prisma recommande

Pour un nouveau changement de schema:

```powershell
npm run prisma:format
npm run prisma:validate
npx prisma migrate dev --name add_nom_du_module
npm run prisma:generate
```

Pour appliquer les migrations versionnees:

```powershell
npm run prisma:migrate:deploy
```
