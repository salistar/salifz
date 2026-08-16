# 🤖 Salifz AI Model

Sous-projet d'intelligence artificielle pour l'application Salifz - Mémorisation du Coran.

## 📋 Vue d'ensemble

Ce projet contient tout le nécessaire pour entraîner, évaluer et déployer des modèles d'IA spécialisés pour :

1. **🎙️ Reconnaissance vocale arabe** - Transcription de récitation coranique
2. **📖 Analyse de Tajwid** - Détection et correction des erreurs de prononciation
3. **🧠 Assistant conversationnel** - Chatbot spécialisé Coran/Islam
4. **📊 Recommandations personnalisées** - Plans d'étude et révision

## 🏗️ Structure du Projet

```
salifz-ai-model/
├── README.md
├── requirements.txt
├── setup.py
├── config/
│   ├── config.yaml           # Configuration principale
│   ├── model_config.yaml     # Paramètres des modèles
│   └── training_config.yaml  # Paramètres d'entraînement
│
├── data/
│   ├── raw/                  # Données brutes
│   │   ├── quran/           # Texte coranique
│   │   ├── audio/           # Fichiers audio
│   │   ├── tajwid/          # Annotations Tajwid
│   │   └── conversations/   # Conversations chatbot
│   ├── processed/            # Données prétraitées
│   └── datasets/             # Datasets formatés
│
├── models/
│   ├── speech/              # Modèles de reconnaissance vocale
│   ├── tajwid/              # Modèles d'analyse Tajwid
│   ├── chatbot/             # Modèles conversationnels
│   └── recommendation/      # Modèles de recommandation
│
├── src/
│   ├── __init__.py
│   ├── data/
│   │   ├── __init__.py
│   │   ├── data_loader.py
│   │   ├── preprocessor.py
│   │   ├── augmentation.py
│   │   └── dataset.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── speech_model.py
│   │   ├── tajwid_model.py
│   │   ├── chatbot_model.py
│   │   └── recommendation_model.py
│   ├── training/
│   │   ├── __init__.py
│   │   ├── trainer.py
│   │   ├── callbacks.py
│   │   └── metrics.py
│   ├── inference/
│   │   ├── __init__.py
│   │   ├── predictor.py
│   │   └── pipeline.py
│   └── utils/
│       ├── __init__.py
│       ├── arabic_utils.py
│       ├── audio_utils.py
│       └── helpers.py
│
├── notebooks/
│   ├── 01_data_exploration.ipynb
│   ├── 02_preprocessing.ipynb
│   ├── 03_model_training.ipynb
│   ├── 04_evaluation.ipynb
│   └── 05_deployment.ipynb
│
├── scripts/
│   ├── download_data.py
│   ├── prepare_dataset.py
│   ├── train_model.py
│   ├── evaluate_model.py
│   └── export_model.py
│
├── api/
│   ├── __init__.py
│   ├── app.py               # FastAPI server
│   ├── routes/
│   │   ├── speech.py
│   │   ├── tajwid.py
│   │   ├── chat.py
│   │   └── recommend.py
│   └── schemas/
│       └── models.py
│
├── tests/
│   ├── test_data.py
│   ├── test_models.py
│   └── test_api.py
│
├── docker/
│   ├── Dockerfile
│   ├── Dockerfile.gpu
│   └── docker-compose.yml
│
└── docs/
    ├── architecture.md
    ├── datasets.md
    ├── training.md
    └── deployment.md
```

## 🚀 Installation

### Prérequis

- Python 3.9+
- CUDA 11.8+ (pour GPU)
- 16GB+ RAM
- 50GB+ espace disque

### Installation locale

```bash
# Cloner le repo
cd salifz-ai-model

# Créer environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
.\venv\Scripts\activate   # Windows

# Installer les dépendances
pip install -r requirements.txt

# Installer le package en mode développement
pip install -e .
```

### Installation Docker

```bash
docker-compose up -d
```

## 📊 Datasets

### Sources de données

| Dataset | Description | Taille | Source |
|---------|-------------|--------|--------|
| Quran Text | 114 sourates, 6236 versets | 1MB | tanzil.net |
| Quran Audio | Récitations de 10+ récitateurs | 50GB+ | everyayah.com |
| Tajwid Annotations | Règles de Tajwid annotées | 10MB | Custom |
| Conversations | Q&A islamiques | 100K+ | Custom |

### Préparation des données

```bash
# Télécharger les données
python scripts/download_data.py

# Préparer les datasets
python scripts/prepare_dataset.py --type all
```

## 🏋️ Entraînement

### Entraîner un modèle

```bash
# Modèle de reconnaissance vocale
python scripts/train_model.py --model speech --config config/training_config.yaml

# Modèle Tajwid
python scripts/train_model.py --model tajwid --epochs 50

# Chatbot
python scripts/train_model.py --model chatbot --base-model arabert
```

### Monitoring

```bash
# TensorBoard
tensorboard --logdir=runs/

# MLflow
mlflow ui
```

## 📈 Évaluation

```bash
python scripts/evaluate_model.py --model speech --checkpoint models/speech/best.pt
```

## 🌐 Déploiement

### API locale

```bash
cd api
uvicorn app:app --reload --port 8000
```

### Export pour mobile

```bash
# Export ONNX
python scripts/export_model.py --format onnx --model tajwid

# Export TensorFlow Lite
python scripts/export_model.py --format tflite --model speech
```

## 📚 Documentation

- [Architecture](docs/architecture.md)
- [Datasets](docs/datasets.md)
- [Training Guide](docs/training.md)
- [Deployment](docs/deployment.md)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

MIT License - voir [LICENSE](LICENSE)

## 📞 Contact

Salifz Team - contact@salifz.com
