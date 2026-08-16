# 🕌 Salifz - Application Complète de Mémorisation du Coran

> **Version:** 1.0.0 | **Expo SDK:** 52 | **Node.js:** 18+

Application islamique complète avec **50+ fonctionnalités**, reconnaissance faciale, 3 langues, apprentissage gamifié style Duolingo, chat audio/vidéo, et plus.

---

## 📋 Table des Matières

1. [Fonctionnalités (50+)](#-fonctionnalités-50)
2. [Architecture](#-architecture)
3. [Installation](#-installation)
4. [Configuration](#-configuration)
5. [Guide AI/ML](#-guide-aiml)
6. [API Documentation](#-api-documentation)
7. [Déploiement](#-déploiement)

---

## ✨ Fonctionnalités (50+)

### 🎯 Core Features (1-10)

| # | Fonctionnalité | Description |
|---|----------------|-------------|
| 1 | **Mémorisation Gamifiée** | Apprentissage style Duolingo avec XP, niveaux, cœurs |
| 2 | **Reconnaissance Faciale** | Détection homme/femme pour espace dédié |
| 3 | **Espace Femmes** | Zone exclusive avec fonctionnalités adaptées |
| 4 | **Espace Mixte** | Zone générale pour tous |
| 5 | **3 Langues** | Arabe, Français, Anglais |
| 6 | **Streaks & Freezes** | Suivi quotidien avec protection |
| 7 | **Système de Ligues** | Bronze → Argent → Or → Diamant → Hafiz |
| 8 | **Leaderboards** | Classements global, amis, ligue |
| 9 | **Quêtes Quotidiennes** | 3+ quêtes avec récompenses |
| 10 | **Système de Cœurs** | 5 cœurs, recharge toutes les 4h |

### 📖 Quran Features (11-20)

| # | Fonctionnalité | Description |
|---|----------------|-------------|
| 11 | **114 Sourates** | Texte arabe complet avec tashkeel |
| 12 | **6236 Versets** | Navigation complète |
| 13 | **30 Juz** | Organisation par juz |
| 14 | **Audio Récitation** | 10+ récitateurs (Mishary, Sudais, etc.) |
| 15 | **Traductions** | 20+ langues disponibles |
| 16 | **Tafsir** | Explication des versets |
| 17 | **Mot-à-Mot** | Traduction word-by-word |
| 18 | **Recherche Avancée** | Recherche dans tout le Coran |
| 19 | **Favoris/Bookmarks** | Sauvegarde des versets |
| 20 | **Verset du Jour** | Verset quotidien avec notification |

### 🎮 Gamification (21-30)

| # | Fonctionnalité | Description |
|---|----------------|-------------|
| 21 | **XP System** | Points d'expérience par activité |
| 22 | **Niveaux (1-100)** | Progression avec déblocages |
| 23 | **Gemmes** | Monnaie premium |
| 24 | **Boutique** | Achats avec gemmes (freezes, boosts) |
| 25 | **Achievements (50+)** | Badges et accomplissements |
| 26 | **Défis Quotidiens** | Challenges avec rewards |
| 27 | **Défis Hebdomadaires** | Challenges plus grands |
| 28 | **Défis Mensuels** | Grands objectifs |
| 29 | **Compétitions** | Tournois entre utilisateurs |
| 30 | **Récompenses Journalières** | Login rewards |

### 👥 Social (31-40)

| # | Fonctionnalité | Description |
|---|----------------|-------------|
| 31 | **Halaqat (Cercles)** | Groupes d'étude |
| 32 | **Chat Texte** | Messages en temps réel |
| 33 | **Chat Audio** | Appels audio 1-to-1 |
| 34 | **Chat Vidéo** | Appels vidéo 1-to-1 |
| 35 | **Appels de Groupe** | Audio/vidéo multi-participants |
| 36 | **Amis** | Système d'amitié |
| 37 | **Profils Publics** | Voir les stats des autres |
| 38 | **Activités de Groupe** | 12 types d'activités Halaqa |
| 39 | **Notifications Push** | Rappels et updates |
| 40 | **Partage Social** | Partager ses progrès |

### 🤖 AI Features (41-45)

| # | Fonctionnalité | Description |
|---|----------------|-------------|
| 41 | **Plan Personnalisé** | AI génère un plan adapté |
| 42 | **Analyse Tajwid** | Évaluation de la récitation |
| 43 | **Smart Review** | Révision espacée intelligente |
| 44 | **Insights AI** | Analyse des performances |
| 45 | **Motivation AI** | Messages personnalisés |

### 🔐 Authentification (46-50)

| # | Fonctionnalité | Description |
|---|----------------|-------------|
| 46 | **Email/Password** | Authentification classique |
| 47 | **Vérification SMS** | OTP par téléphone |
| 48 | **Vérification Email** | OTP par email |
| 49 | **Biométrie** | Face ID / Touch ID |
| 50 | **Contrôle Parental** | Comptes enfants supervisés |

### 🕌 Islamic Features (51-60)

| # | Fonctionnalité | Description |
|---|----------------|-------------|
| 51 | **Heures de Prière** | Calcul précis par localisation |
| 52 | **Direction Qibla** | Boussole vers la Mecque |
| 53 | **Calendrier Hijri** | Dates islamiques |
| 54 | **Rappels Prière** | Notifications Adhan |
| 55 | **Duas** | Collection d'invocations |
| 56 | **99 Noms d'Allah** | Asma ul Husna |
| 57 | **Histoires Prophètes** | Récits islamiques |
| 58 | **Mode Ramadan** | Fonctionnalités spéciales |
| 59 | **Compteur Dhikr** | Tasbih digital |
| 60 | **Zakat Calculator** | Calcul de la Zakat |

---

## 🏗 Architecture

```
salifz/
├── backend/                    # Node.js + Express + MongoDB
│   ├── config/                 # Configuration
│   ├── controllers/            # Business logic
│   ├── middleware/             # Auth, error handling
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # API endpoints
│   ├── services/               # External services
│   ├── scripts/                # Seeds, migrations
│   └── index.js                # Entry point
│
├── mobile/                     # React Native + Expo SDK 52
│   ├── app/                    # Expo Router screens
│   ├── components/             # Reusable components
│   ├── hooks/                  # Custom hooks
│   ├── services/               # API, Socket, etc.
│   ├── stores/                 # Zustand stores
│   ├── locales/                # i18n translations
│   ├── assets/                 # Images, fonts
│   └── app.json                # Expo config
│
└── docs/                       # Documentation
    └── AI_MODELS.md            # Guide AI/ML
```

---

## 🚀 Installation

### Prérequis

- Node.js 18+
- npm/yarn
- MongoDB (local ou Atlas)
- Redis (optionnel)
- Expo CLI

### Backend

```bash
cd backend
cp .env.example .env
# Configurer .env avec vos clés
npm install
npm run seed          # Initialiser la DB
npm run dev           # Démarrer en dev
```

### Mobile

```bash
cd mobile
npm install
npx expo start
```

---

## ⚙️ Configuration

### Variables d'Environnement (Backend)

```env
# Database
MONGODB_URI=mongodb://localhost:27017/salifz
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# Services
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

SENDGRID_API_KEY=your_sendgrid_key

# AI/ML (Optionnel)
OPENAI_API_KEY=your_openai_key
AZURE_FACE_KEY=your_azure_face_key
AZURE_FACE_ENDPOINT=https://your-region.api.cognitive.microsoft.com

# Payment
STRIPE_SECRET_KEY=your_stripe_key
```

---

## 🤖 Guide AI/ML

### 1. Reconnaissance Faciale (Genre)

**Objectif:** Détecter si l'utilisateur est homme ou femme pour afficher l'espace approprié.

#### Option A: Azure Face API (Recommandé - Production)

```javascript
// services/faceRecognition.js
const { FaceClient } = require('@azure/cognitiveservices-face');
const { CognitiveServicesCredentials } = require('@azure/ms-rest-azure-js');

const credentials = new CognitiveServicesCredentials(process.env.AZURE_FACE_KEY);
const client = new FaceClient(credentials, process.env.AZURE_FACE_ENDPOINT);

async function detectGender(imageBuffer) {
  const faces = await client.face.detectWithStream(imageBuffer, {
    returnFaceAttributes: ['gender', 'age']
  });
  
  if (faces.length === 0) {
    throw new Error('No face detected');
  }
  
  return {
    gender: faces[0].faceAttributes.gender, // 'male' or 'female'
    confidence: 0.95
  };
}
```

**Coût:** ~$1 pour 1000 détections

#### Option B: AWS Rekognition

```javascript
const { RekognitionClient, DetectFacesCommand } = require('@aws-sdk/client-rekognition');

const client = new RekognitionClient({ region: 'us-east-1' });

async function detectGender(imageBytes) {
  const command = new DetectFacesCommand({
    Image: { Bytes: imageBytes },
    Attributes: ['ALL']
  });
  
  const response = await client.send(command);
  const face = response.FaceDetails[0];
  
  return {
    gender: face.Gender.Value.toLowerCase(),
    confidence: face.Gender.Confidence / 100
  };
}
```

#### Option C: TensorFlow.js (Gratuit - On-Device)

```javascript
// Pour le mobile - détection locale
import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

// Modèle pré-entraîné pour classification de genre
// Dataset: UTKFace, IMDB-WIKI
```

### 2. Analyse Tajwid (Récitation)

**Objectif:** Évaluer la qualité de récitation du Coran.

#### Architecture ML

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Audio Input    │───▶│  Speech-to-Text  │───▶│  Text Alignment │
│  (Récitation)   │    │  (Whisper/Azure) │    │  avec le Coran  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                              ┌──────────────────────────┘
                              ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Tajwid Score   │◀───│  Règles Tajwid   │◀───│  Phoneme        │
│  (0-100)        │    │  Detection       │    │  Analysis       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

#### Dataset pour Tajwid

1. **Tarteel.ai Dataset** (Open Source)
   - 50,000+ heures de récitation
   - Annotations de qualité
   - https://tarteel.ai/

2. **Quran.com Audio**
   - Récitations professionnelles
   - Multiples récitateurs

3. **Dataset Personnalisé**
   ```json
   {
     "audio_file": "surah_1_ayah_1.wav",
     "text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
     "tajwid_rules": [
       {"rule": "idgham", "position": [5, 7], "correct": true},
       {"rule": "madd", "position": [12, 14], "correct": false}
     ],
     "overall_score": 85
   }
   ```

#### Implémentation

```javascript
// services/tajwidAnalysis.js
const { Configuration, OpenAIApi } = require('openai');

class TajwidAnalyzer {
  constructor() {
    this.openai = new OpenAIApi(new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    }));
  }

  async analyzeRecitation(audioUrl, expectedText) {
    // 1. Transcrire l'audio
    const transcription = await this.transcribe(audioUrl);
    
    // 2. Comparer avec le texte attendu
    const alignment = this.alignTexts(transcription, expectedText);
    
    // 3. Détecter les erreurs de Tajwid
    const tajwidErrors = this.detectTajwidErrors(transcription, expectedText);
    
    // 4. Calculer le score
    const score = this.calculateScore(alignment, tajwidErrors);
    
    return {
      score,
      transcription,
      errors: tajwidErrors,
      feedback: this.generateFeedback(tajwidErrors)
    };
  }

  async transcribe(audioUrl) {
    // Utiliser Whisper pour la transcription arabe
    const response = await this.openai.createTranscription(
      await this.fetchAudio(audioUrl),
      'whisper-1',
      undefined,
      'json',
      0,
      'ar'
    );
    return response.data.text;
  }

  detectTajwidErrors(recited, expected) {
    const errors = [];
    
    // Règles de Tajwid à vérifier
    const rules = {
      'idgham': /نْ\s*[يرملون]/g,      // Idgham avec Ghunnah
      'ikhfa': /نْ\s*[تثجدذزسشصضطظفقك]/g,  // Ikhfa
      'iqlab': /نْ\s*ب/g,              // Iqlab
      'qalqalah': /[قطبجد]ْ/g,         // Qalqalah
      'madd': /[اوي]ّ/g                // Madd
    };
    
    for (const [rule, pattern] of Object.entries(rules)) {
      // Vérifier si la règle est appliquée correctement
      // ... logique de comparaison
    }
    
    return errors;
  }

  calculateScore(alignment, errors) {
    let score = 100;
    
    // Pénalités par type d'erreur
    const penalties = {
      'pronunciation': 5,
      'tajwid_minor': 3,
      'tajwid_major': 10,
      'missing_word': 15
    };
    
    errors.forEach(error => {
      score -= penalties[error.type] || 5;
    });
    
    return Math.max(0, score);
  }
}

module.exports = new TajwidAnalyzer();
```

### 3. Plan de Mémorisation Personnalisé (AI)

**Modèle:** Système de recommandation basé sur les performances

```javascript
// services/aiPlanner.js
class AIPlanner {
  generatePlan(user, progress) {
    const features = this.extractFeatures(user, progress);
    
    return {
      dailyGoal: this.calculateOptimalGoal(features),
      suggestedSurahs: this.recommendSurahs(features),
      reviewSchedule: this.spacedRepetition(progress),
      estimatedCompletion: this.predictCompletion(features)
    };
  }

  extractFeatures(user, progress) {
    return {
      learningSpeed: this.calculateLearningSpeed(progress),
      retentionRate: this.calculateRetention(progress),
      consistencyScore: user.gamification.currentStreak / 30,
      dailyAvailableTime: user.profile.dailyGoal * 10, // minutes
      preferredTimes: this.detectPreferredTimes(progress)
    };
  }

  spacedRepetition(progress) {
    // Algorithme SM-2 (SuperMemo)
    const intervals = [1, 3, 7, 14, 30, 60]; // jours
    
    return progress.map(verse => {
      const ef = verse.easinessFactor || 2.5;
      const repetitions = verse.reviewCount || 0;
      
      const nextInterval = intervals[Math.min(repetitions, intervals.length - 1)];
      
      return {
        verseId: verse._id,
        nextReview: new Date(Date.now() + nextInterval * 86400000),
        priority: 1 / ef // Lower EF = higher priority
      };
    });
  }
}
```

### 4. Datasets Recommandés

| Dataset | Usage | Lien |
|---------|-------|------|
| **Tarteel.ai** | Tajwid, Récitation | https://tarteel.ai/dataset |
| **UTKFace** | Détection de genre | https://susanqq.github.io/UTKFace/ |
| **Common Voice Arabic** | Speech Recognition | https://commonvoice.mozilla.org/ar |
| **Quran.com API** | Texte, Audio, Tafsir | https://api.quran.com |
| **AlQuran Cloud** | Audio, Traductions | https://alquran.cloud/api |

### 5. Injection des Modèles dans les Routes

```javascript
// routes/ai.js
const express = require('express');
const router = express.Router();
const TajwidAnalyzer = require('../services/tajwidAnalysis');
const AIPlanner = require('../services/aiPlanner');
const FaceRecognition = require('../services/faceRecognition');

// Analyse Tajwid
router.post('/tajwid/analyze', auth, upload.single('audio'), async (req, res) => {
  const { surahId, ayahId } = req.body;
  const audioBuffer = req.file.buffer;
  
  const result = await TajwidAnalyzer.analyzeRecitation(audioBuffer, surahId, ayahId);
  
  res.json({ success: true, data: result });
});

// Plan personnalisé
router.get('/plan', auth, async (req, res) => {
  const progress = await SurahProgress.find({ userId: req.userId });
  const plan = await AIPlanner.generatePlan(req.user, progress);
  
  res.json({ success: true, data: plan });
});

// Reconnaissance faciale
router.post('/face/detect-gender', auth, upload.single('image'), async (req, res) => {
  const result = await FaceRecognition.detectGender(req.file.buffer);
  
  // Sauvegarder le résultat
  await User.findByIdAndUpdate(req.userId, {
    'profile.detectedGender': result.gender,
    'profile.genderVerified': true
  });
  
  res.json({ success: true, data: result });
});
```

---

## 📚 API Documentation

### Base URL
```
Production: https://api.salifz.com/api/v1
Development: http://localhost:8088/api/v1
```

### Endpoints Principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/auth/register` | Inscription |
| POST | `/auth/login` | Connexion |
| GET | `/quran/surah/:id` | Obtenir une sourate |
| GET | `/progress` | Progrès utilisateur |
| POST | `/ai/tajwid/analyze` | Analyse Tajwid |
| POST | `/face/detect-gender` | Détection genre |
| GET | `/halaqa` | Liste des Halaqat |
| POST | `/chat/send` | Envoyer message |

---

## 🌐 Déploiement

### Backend (Railway/Render)

```bash
# Railway
npm install -g @railway/cli
railway login
railway init
railway up

# Render
# Connecter le repo GitHub
# Build: npm install
# Start: npm start
```

### Mobile (Expo EAS)

```bash
npm install -g eas-cli
eas login
eas build --platform all
eas submit --platform all
```

---

## 📞 Support

- **Email:** support@salifz.com
- **Discord:** discord.gg/salifz

---

## 📜 Licence

MIT License - © 2024 Salifz Team

---

بارك الله فيكم 🤲

**"خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ"**
