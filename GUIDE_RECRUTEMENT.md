# Guide Recrutement LESNORMESRH

## Objectif

Ce document sert de memo pour se souvenir :

- comment preparer un recrutement dans la partie `Planification`
- comment fonctionne actuellement la creation d'une offre d'emploi dans le systeme

## 1. Preparer un recrutement dans la partie Planning

Dans l'application, la preparation du recrutement se fait dans :

- `Recrutement > Planification`

Cette section sert a organiser le recrutement avant la publication d'une offre.

Les onglets disponibles sont :

- `Planning hebdomadaire`
- `Pipeline recrutement`
- `Scorecard recrutement`
- `Historique des modifications`

### A. Planning hebdomadaire

Cette partie permet de planifier les actions semaine par semaine.

Les informations a renseigner sont :

- `Semaine`
- `Objectif`
- `Responsable`
- `Actions cles`
- `Livrable`
- `KPI cible`
- `Statut`
- `Ordre`

Exemple :

- Semaine 1 : valider le besoin
- Semaine 2 : rediger l'annonce
- Semaine 3 : publier l'offre
- Semaine 4 : trier les candidatures
- Semaine 5 : organiser les entretiens

Le but est d'avoir une vue claire de ce qui doit etre fait, par qui, et dans quel ordre.

### B. Pipeline recrutement

Cette partie permet de definir les etapes par lesquelles un candidat va passer.

Les informations a renseigner sont :

- `Etape`
- `Responsable`
- `Critere entree`
- `Critere sortie`
- `SLA (jours)`
- `Ordre`
- `Actif`

Exemple de pipeline :

- Candidature recue
- Prequalification RH
- Test
- Entretien technique
- Entretien manager
- Decision finale

Le champ `SLA (jours)` sert a definir en combien de jours maximum chaque etape doit etre traitee.

### C. Scorecard recrutement

Cette partie sert a preparer la grille d'evaluation des candidats.

Les informations a renseigner sont :

- `Critere`
- `Poids`
- `Notes`
- `Ordre`
- `Actif`

Exemple :

- Competences techniques : 40
- Communication : 20
- Experience metier : 25
- Adequation culturelle : 15

Cette grille aide a comparer les candidats de maniere plus objective.

### D. Historique des modifications

Cet onglet permet de suivre les changements effectues sur :

- le planning hebdomadaire
- le pipeline
- la scorecard

Il sert a garder une trace de ce qui a ete modifie dans la preparation du recrutement.

### E. Ordre recommande pour preparer un recrutement

Le plus logique est de proceder comme ceci :

1. Creer le `Planning hebdomadaire`
2. Creer le `Pipeline recrutement`
3. Creer le `Scorecard recrutement`
4. Verifier l'`Historique des modifications`

### F. Comment creer un element dans Planning

Dans la page `Planification`, il faut utiliser le bouton :

- `Creer`

Puis choisir un type :

- `Planning hebdomadaire`
- `Pipeline recrutement`
- `Scorecard recrutement`

## 2. Creation d'une offre d'emploi dans le systeme actuel

### A. Situation actuelle

Le backend permet deja de creer une vraie offre d'emploi.

Mais dans le front-end actuel, la page :

- `Recrutement > Publication`

est encore une section placeholder. Cela veut dire que l'interface utilisateur pour creer une offre n'est pas encore finalisee.

### B. Ce que represente une offre d'emploi

Dans le systeme, une offre d'emploi correspond a un :

- `JobPosting`

Attention :

- `JobPosting` = offre d'emploi / poste a publier
- `HiringOffer` = offre d'embauche faite a un candidat apres le recrutement

### C. Route API disponible

La creation d'une offre d'emploi se fait par l'API :

- `POST /api/talent-acquisition/job-postings`

### D. Champs obligatoires

Pour creer une offre d'emploi, il faut au minimum :

- `title`
- `description`
- `departmentName`
- `employmentType`

### E. Champs utiles en plus

On peut aussi ajouter :

- `recruitmentRequestId`
- `code`
- `location`
- `openings`
- `status`
- `recruiterId`
- `hiringManagerId`

### F. Statuts possibles d'une offre d'emploi

Les statuts disponibles sont :

- `DRAFT`
- `PUBLISHED`
- `PAUSED`
- `CLOSED`
- `ARCHIVED`

Si on cree l'offre avec le statut `PUBLISHED`, le systeme renseigne automatiquement la date de publication.

### G. Exemple de payload

```json
{
  "title": "Charge(e) de recrutement",
  "description": "Nous recherchons un profil capable de gerer le sourcing, les entretiens et le suivi des candidatures.",
  "departmentName": "Ressources Humaines",
  "employmentType": "FULL_TIME",
  "location": "Kinshasa",
  "openings": 1,
  "status": "PUBLISHED"
}
```

### H. Ce que cela veut dire en pratique

Aujourd'hui, pour creer une offre d'emploi, il faut passer par :

- Postman
- Insomnia
- ou une future interface front-end a developper

### I. Permissions necessaires

L'utilisateur doit avoir :

- le module `TALENT_ACQUISITION`
- la permission `talent.job.create`

## 3. Resume simple

### Pour preparer le recrutement

Utiliser :

- `Recrutement > Planification`

Puis definir :

- le calendrier du recrutement
- le pipeline candidat
- la grille d'evaluation

### Pour creer l'offre d'emploi

Le backend est pret, mais l'ecran front-end `Publication` n'est pas encore termine.

## 4. Idee pour la suite

Quand on voudra aller plus loin, on pourra developper dans `Publication` :

- la liste des offres d'emploi
- un formulaire de creation
- un formulaire de modification
- le changement de statut de l'offre
- la liaison avec les candidatures

## 5. Exemple complet : recrutement d'un Assistant RH

Voici un exemple complet et simple que l'on peut reutiliser comme base dans la partie `Planification`.

### A. Contexte du besoin

Poste :

- `Assistant RH`

Objectif :

- renforcer l'equipe RH pour aider sur l'administration du personnel, le suivi documentaire, le recrutement et la gestion quotidienne des dossiers employes

Type de contrat :

- `FULL_TIME`

Localisation :

- `Kinshasa`

Nombre de postes :

- `1`

### B. Planning hebdomadaire

#### Semaine 1

- `Semaine` : Semaine 1
- `Objectif` : clarifier le besoin et valider le profil recherche
- `Responsable` : Responsable RH
- `Actions cles` : reunion de cadrage, definition des missions, validation du budget
- `Livrable` : fiche de poste validee
- `KPI cible` : fiche de poste approuvee en 3 jours
- `Statut` : `PLANNED`
- `Ordre` : `1`

#### Semaine 2

- `Semaine` : Semaine 2
- `Objectif` : preparer et publier l'annonce
- `Responsable` : Chargé(e) recrutement
- `Actions cles` : redaction de l'annonce, validation interne, diffusion
- `Livrable` : annonce publiee
- `KPI cible` : publication sur 3 canaux
- `Statut` : `PLANNED`
- `Ordre` : `2`

#### Semaine 3

- `Semaine` : Semaine 3
- `Objectif` : collecter et prequalifier les candidatures
- `Responsable` : Assistant RH senior
- `Actions cles` : tri CV, appels de prequalification, short-list
- `Livrable` : liste courte des candidats
- `KPI cible` : 8 candidats preselectionnes
- `Statut` : `PLANNED`
- `Ordre` : `3`

#### Semaine 4

- `Semaine` : Semaine 4
- `Objectif` : mener les entretiens RH et techniques
- `Responsable` : Responsable RH + manager demandeur
- `Actions cles` : planification des entretiens, evaluation, comparaison
- `Livrable` : classement final des candidats
- `KPI cible` : 3 finalistes evalues
- `Statut` : `PLANNED`
- `Ordre` : `4`

#### Semaine 5

- `Semaine` : Semaine 5
- `Objectif` : finaliser le choix et preparer l'embauche
- `Responsable` : Direction RH
- `Actions cles` : decision finale, validation salariale, preparation offre
- `Livrable` : candidat retenu
- `KPI cible` : 1 offre prete a etre envoyee
- `Statut` : `PLANNED`
- `Ordre` : `5`

### C. Pipeline recrutement

#### Etape 1

- `Etape` : Candidature recue
- `Responsable` : Chargé(e) recrutement
- `Critere entree` : CV recu
- `Critere sortie` : candidature enregistree et lisible
- `SLA (jours)` : `1`
- `Ordre` : `1`
- `Actif` : `Oui`

#### Etape 2

- `Etape` : Prequalification RH
- `Responsable` : Responsable RH
- `Critere entree` : candidature conforme au minimum requis
- `Critere sortie` : candidat retenu ou ecarte apres appel
- `SLA (jours)` : `2`
- `Ordre` : `2`
- `Actif` : `Oui`

#### Etape 3

- `Etape` : Test pratique
- `Responsable` : Equipe RH
- `Critere entree` : candidat shortlisté
- `Critere sortie` : test corrige et note
- `SLA (jours)` : `3`
- `Ordre` : `3`
- `Actif` : `Oui`

#### Etape 4

- `Etape` : Entretien RH
- `Responsable` : Responsable RH
- `Critere entree` : test satisfaisant
- `Critere sortie` : avis RH documente
- `SLA (jours)` : `2`
- `Ordre` : `4`
- `Actif` : `Oui`

#### Etape 5

- `Etape` : Entretien manager
- `Responsable` : Manager du service
- `Critere entree` : validation RH
- `Critere sortie` : avis manager documente
- `SLA (jours)` : `2`
- `Ordre` : `5`
- `Actif` : `Oui`

#### Etape 6

- `Etape` : Decision finale
- `Responsable` : Direction RH
- `Critere entree` : evaluations completes
- `Critere sortie` : candidat retenu ou refuse
- `SLA (jours)` : `2`
- `Ordre` : `6`
- `Actif` : `Oui`

### D. Scorecard recrutement

Pour un poste d'Assistant RH, on peut utiliser cette grille :

#### Critere 1

- `Critere` : Maitrise administrative RH
- `Poids` : `30`
- `Notes` : dossiers du personnel, contrats, classement, rigueur
- `Ordre` : `1`
- `Actif` : `Oui`

#### Critere 2

- `Critere` : Communication professionnelle
- `Poids` : `20`
- `Notes` : qualite d'expression orale et ecrite
- `Ordre` : `2`
- `Actif` : `Oui`

#### Critere 3

- `Critere` : Organisation et gestion des priorites
- `Poids` : `20`
- `Notes` : capacite a suivre plusieurs taches sans erreur
- `Ordre` : `3`
- `Actif` : `Oui`

#### Critere 4

- `Critere` : Maitrise bureautique
- `Poids` : `15`
- `Notes` : Word, Excel, classement et reporting simple
- `Ordre` : `4`
- `Actif` : `Oui`

#### Critere 5

- `Critere` : Confidentialite et posture professionnelle
- `Poids` : `15`
- `Notes` : discretion, fiabilite, comportement adapte
- `Ordre` : `5`
- `Actif` : `Oui`

Poids total :

- `100`

### E. Profil ideal a rechercher

Exemple de profil cible :

- Bac+3 en ressources humaines, gestion ou administration
- 1 a 3 ans d'experience en support RH ou administratif
- bonne maitrise des outils bureautiques
- bonne presentation et bon relationnel
- sens de la confidentialite

### F. Exemple d'annonce correspondante

Titre :

- `Assistant RH`

Resume de l'annonce :

- assurer le suivi administratif RH
- participer au recrutement et a l'integration
- gerer les dossiers du personnel
- produire des tableaux de suivi simples

### G. Resultat attendu a la fin du planning

Si tout se passe bien, a la fin de ce planning on doit avoir :

- une annonce bien preparee
- un pipeline clair
- une grille d'evaluation definie
- un candidat finaliste identifie
- une offre d'emploi ou une offre d'embauche prete selon l'etape atteinte
