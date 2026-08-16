# Politique de confidentialité — Salifz

**Dernière mise à jour : 16 août 2026**

Ce document décrit les données que l'application Salifz collecte, pourquoi elle
les collecte, et ce que vous pouvez en faire. Il sert de base à la fiche
« Sécurité des données » de Google Play et à la « Nutrition Label » de
l'App Store : les deux doivent rester cohérentes avec ce texte.

> ⚠️ **À faire avant publication** : faire relire ce document par un juriste,
> renseigner le responsable de traitement ci-dessous, et l'héberger à une URL
> publique stable (le formulaire des stores exige un lien accessible sans
> connexion).

---

## 1. Responsable du traitement

| | |
|---|---|
| Éditeur | *à compléter — raison sociale et adresse* |
| Contact | privacy@salifz.com |
| Délégué à la protection des données | *à désigner si requis* |

## 2. Données collectées

### Compte
- Adresse email, nom d'utilisateur, nom affiché
- Mot de passe — stocké uniquement sous forme de hachage bcrypt (coût 12).
  Il n'est jamais lisible, ni par nous ni par un tiers.
- Langue et préférences d'affichage
- Genre, **déclaré par vous** et facultatif (`non précisé` par défaut). Il sert
  uniquement à donner accès à l'espace réservé aux femmes.

### Usage de l'application
- Progression de mémorisation : sourates, versets, scores de révision
- Séries quotidiennes, points d'expérience, succès
- Objectif quotidien et horaires d'étude

### Contenus que vous produisez
- Messages envoyés dans les discussions et les halaqat
- Enregistrements audio de récitation, si vous utilisez l'analyse de tajwid

### Données techniques
- Identifiant d'appareil pour les notifications
- Journaux d'erreurs et de connexion (adresse IP, horodatage), conservés
  30 jours pour la sécurité et le diagnostic

### Ce que nous ne collectons pas
- **Aucune donnée biométrique.** Une fonctionnalité de reconnaissance faciale
  destinée à déduire le genre a existé dans le code ; elle a été retirée le
  16 août 2026 sans avoir jamais été déployée. Aucun visage n'a été traité ni
  conservé.
- Aucune donnée de localisation précise. Les heures de prière et la direction
  de la qibla sont calculées **sur votre appareil** ; les coordonnées ne sont
  pas transmises à nos serveurs.
- Aucun contact, aucun accès à votre galerie photo en dehors des images que
  vous choisissez explicitement d'envoyer.
- Aucune revente de données. Aucun courtier publicitaire.

## 3. Base légale (RGPD)

| Traitement | Base légale |
|---|---|
| Compte et authentification | Exécution du contrat (art. 6.1.b) |
| Progression et gamification | Exécution du contrat |
| Messages et halaqat | Exécution du contrat |
| Enregistrements de récitation | Consentement (art. 6.1.a), révocable |
| Journaux de sécurité | Intérêt légitime (art. 6.1.f) |
| Notifications push | Consentement, révocable dans les réglages |

## 4. Durées de conservation

| Donnée | Durée |
|---|---|
| Compte et progression | Tant que le compte existe |
| Enregistrements audio de récitation | 30 jours, puis suppression automatique |
| Messages | Tant que la conversation existe |
| Journaux techniques | 30 jours |
| Après suppression du compte | Effacement sous 30 jours, sauvegardes comprises |

## 5. Vos droits

Vous pouvez à tout moment, depuis l'application ou par email :

- **Accéder à vos données** — `Réglages → Mon compte → Exporter mes données`
  (fichier JSON complet)
- **Corriger** vos informations depuis votre profil
- **Supprimer votre compte** — `Réglages → Mon compte → Supprimer mon compte`.
  La suppression est définitive et emporte toutes les données rattachées.
- **Retirer un consentement** (audio, notifications) dans les réglages
- **Vous opposer** ou demander une limitation, en écrivant à privacy@salifz.com

Nous répondons sous un mois. Vous pouvez saisir la CNIL si la réponse ne vous
satisfait pas.

## 6. Comptes enfants

Les comptes enfants sont créés par un parent depuis un abonnement Famille.

- Le parent choisit les restrictions de contenu et la limite de temps
  quotidienne ; **elles sont appliquées côté serveur**, pas seulement affichées.
- Les discussions et les appels vidéo sont désactivés par défaut.
- Le parent peut consulter la progression, modifier les restrictions et
  supprimer le compte enfant à tout moment.
- Aucune publicité, aucun achat intégré n'est accessible depuis un compte enfant.

## 7. Sous-traitants

| Prestataire | Rôle | Données transmises |
|---|---|---|
| Hébergeur *(à préciser)* | Serveurs applicatifs et base de données | Toutes les données de compte |
| RevenueCat | Gestion des abonnements | Identifiant de compte, statut d'abonnement |
| Apple / Google | Paiement et notifications | Identifiant de transaction, jeton d'appareil |

Aucun transfert hors Union européenne n'est effectué sans clauses
contractuelles types.

## 8. Sécurité

- Chiffrement en transit (TLS) sur toutes les communications
- Mots de passe hachés avec bcrypt, jamais stockés en clair
- Jetons d'authentification stockés dans le Keystore Android / la Keychain iOS
- Secrets distincts par type de jeton, durée de vie courte pour les jetons d'accès
- Limitation de débit sur l'authentification et la réinitialisation de mot de passe

## 9. Modifications

Toute modification substantielle vous est notifiée dans l'application au moins
30 jours avant son entrée en vigueur.

---

**Contact : privacy@salifz.com**
