# Strategie Prisma

## Objectif

Garder une base Postgres propre, versionnee et reproductible pendant l'ajout progressif des modules RH.

## Regles du projet

1. Toute modification de schema passe par une migration Prisma versionnee.
2. Une migration correspond a un changement metier clair.
3. Le nom de migration doit decrire le module et le changement.
4. `prisma db push` ne doit pas etre utilise pour les evolutions normales du projet.
5. En production ou sur un environnement partage, seules les migrations versionnees doivent etre appliquees.

## Convention de nommage

Utiliser des noms explicites comme:

- `add_talent_acquisition_entities`
- `add_candidate_pipeline_stages`
- `add_employee_documents`
- `add_payroll_period_tables`
- `add_leave_request_workflow`
- `add_performance_review_cycle`

## Workflow developpement

1. Modifier `prisma/schema.prisma`
2. Formater et valider
3. Creer la migration
4. Generer le client
5. Mettre a jour le seed si necessaire
6. Tester l'application

Commandes:

```powershell
npm run prisma:format
npm run prisma:validate
npx prisma migrate dev --name add_talent_acquisition_entities
npm run prisma:generate
npm run prisma:seed
```

## Workflow production

En production ou preproduction:

```powershell
npm run prisma:migrate:deploy
```

Notes:
- ne pas utiliser `migrate dev` en production
- ne pas utiliser `db push` en production
- executer le seed seulement si on veut inserer des donnees systeme manquantes

## Quand utiliser `db push`

Seulement pour:
- un prototype jetable
- une base temporaire de test rapide
- un environnement local sans besoin d'historique

Pour le projet RH principal, preferer les migrations.

## Seed

Le seed doit rester reserve aux donnees systeme:

- roles
- permissions
- modules applicatifs
- super admin initial

Le seed ne doit pas contenir de donnees metier de production.

## Ajouter un nouveau module RH

Pour chaque module:

1. ajouter les nouveaux modeles Prisma
2. creer une migration dediee
3. si besoin, enrichir les permissions et modules systeme
4. mettre a jour le seed uniquement pour les referentiels systeme
5. documenter les nouveaux endpoints dans `server/endpoint.md`

## Commandes utiles

```powershell
npm run prisma:status
npm run prisma:studio
npm run prisma:migrate:reset
```

## Attention avec Postgres

Si ton utilisateur Postgres n'a pas les droits de creation de base pour le shadow database de Prisma, configure un `SHADOW_DATABASE_URL` dedie.
