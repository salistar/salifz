#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    Salifz AI - Data Preprocessor                           ║
║                                                                               ║
║  Prétraitement des données pour l'entraînement des modèles:                  ║
║  - Nettoyage du texte arabe                                                   ║
║  - Tokenisation et normalisation                                              ║
║  - Préparation des datasets                                                   ║
║  - Division train/val/test                                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

Usage:
    python src/data/preprocessor.py --type all
    python src/data/preprocessor.py --type chatbot --format alpaca
"""

import json
import os
import re
import argparse
from pathlib import Path
from typing import List, Dict, Optional, Tuple, Any
from dataclasses import dataclass
import numpy as np
from datetime import datetime

# Arabic tools (optionnel)
try:
    import pyarabic.araby as araby
    from camel_tools.utils.normalize import normalize_unicode
    from camel_tools.utils.dediac import dediac_ar
    ARABIC_TOOLS_AVAILABLE = True
except ImportError:
    ARABIC_TOOLS_AVAILABLE = False
    print("⚠️ Outils arabes non disponibles, utilisation du traitement basique")

# ============================================
# Configuration - CORRECTION DES CHEMINS
# ============================================

# Trouver le dossier racine du projet
# Le script est dans: salifz-ai-model/src/data/preprocessor.py
# On remonte de 2 niveaux pour atteindre la racine

SCRIPT_DIR = Path(__file__).parent.resolve()  # src/data
SRC_DIR = SCRIPT_DIR.parent  # src
BASE_DIR = SRC_DIR.parent  # salifz-ai-model (racine)

# Chemins corrects vers les données
DATA_RAW = BASE_DIR / "data" / "raw"
DATA_OUT = BASE_DIR / "data" / "datasets"


# ============================================
# Classes de données
# ============================================

@dataclass
class QuranVerse:
    """Représentation d'un verset"""
    surah_num: int
    verse_num: int
    text_arabic: str
    text_clean: str
    text_simple: str
    audio_path: Optional[str] = None
    tajwid_labels: Optional[List[str]] = None


@dataclass
class ConversationSample:
    """Échantillon de conversation"""
    instruction: str
    input_text: str
    output_text: str
    context: str


# ============================================
# Traitement du texte arabe
# ============================================

class ArabicTextProcessor:
    """Traitement du texte arabe"""
    
    ARABIC_DIACRITICS = re.compile(r'[\u064B-\u065F\u0670]')
    ARABIC_LETTERS = re.compile(r'[\u0621-\u063A\u0641-\u064A]')
    
    CHAR_MAPPINGS = {
        'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا',
        'ة': 'ه', 'ى': 'ي', 'ؤ': 'و', 'ئ': 'ي',
    }
    
    @staticmethod
    def remove_diacritics(text: str) -> str:
        if ARABIC_TOOLS_AVAILABLE:
            return dediac_ar(text)
        return ArabicTextProcessor.ARABIC_DIACRITICS.sub('', text)
    
    @staticmethod
    def normalize_arabic(text: str) -> str:
        if ARABIC_TOOLS_AVAILABLE:
            text = normalize_unicode(text)
        for old, new in ArabicTextProcessor.CHAR_MAPPINGS.items():
            text = text.replace(old, new)
        return text
    
    @staticmethod
    def clean_text(text: str) -> str:
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    @staticmethod
    def tokenize_arabic(text: str) -> List[str]:
        if ARABIC_TOOLS_AVAILABLE:
            return araby.tokenize(text)
        return text.split()


# ============================================
# Processeurs de données
# ============================================

class QuranDataProcessor:
    """Traitement des données coraniques"""
    
    def __init__(self, data_dir: Path):
        self.data_dir = Path(data_dir)
        self.text_processor = ArabicTextProcessor()
        self.verses: List[QuranVerse] = []
    
    def load_quran_text(self) -> List[QuranVerse]:
        """Charger le texte du Coran"""
        print("📖 Chargement du texte coranique...")
        
        text_dir = self.data_dir / "quran" / "text"
        
        # Chercher le fichier
        possible_files = [
            text_dir / "quran_uthmani.json",
            text_dir / "quran_full.json",
            text_dir / "quran_simple.json",
        ]
        
        quran_file = None
        for f in possible_files:
            if f.exists():
                quran_file = f
                print(f"   ✓ Fichier trouvé: {f.name}")
                break
        
        if not quran_file:
            print(f"❌ Aucun fichier Coran trouvé dans: {text_dir}")
            if text_dir.exists():
                files = list(text_dir.glob("*.json"))
                if files:
                    print(f"   Fichiers disponibles: {[f.name for f in files]}")
            return []
        
        with open(quran_file, 'r', encoding='utf-8') as f:
            surahs = json.load(f)
        
        verses = []
        for surah in surahs:
            surah_num = surah['number']
            for ayah in surah.get('ayahs', []):
                verse = QuranVerse(
                    surah_num=surah_num,
                    verse_num=ayah['numberInSurah'],
                    text_arabic=ayah['text'],
                    text_clean=self.text_processor.clean_text(ayah['text']),
                    text_simple=self.text_processor.remove_diacritics(ayah['text'])
                )
                verses.append(verse)
        
        self.verses = verses
        print(f"✅ {len(verses)} versets chargés")
        return verses
    
    def link_audio_files(self, reciter: str = "alafasy"):
        """Lier les fichiers audio aux versets"""
        print(f"🎙️ Liaison des fichiers audio ({reciter})...")
        
        audio_dir = self.data_dir / "quran" / "audio" / reciter
        linked = 0
        
        if not audio_dir.exists():
            print(f"   ⚠️ Dossier audio non trouvé: {audio_dir}")
            return
        
        for verse in self.verses:
            audio_file = audio_dir / f"surah_{verse.surah_num:03d}" / \
                        f"{verse.surah_num:03d}{verse.verse_num:03d}.mp3"
            
            if audio_file.exists():
                verse.audio_path = str(audio_file)
                linked += 1
        
        print(f"✅ {linked}/{len(self.verses)} fichiers audio liés")
    
    def prepare_speech_dataset(self) -> List[Dict]:
        """Préparer le dataset pour la reconnaissance vocale"""
        dataset = []
        for verse in self.verses:
            if verse.audio_path:
                dataset.append({
                    'audio_path': verse.audio_path,
                    'text': verse.text_arabic,
                    'text_normalized': verse.text_clean,
                    'surah': verse.surah_num,
                    'ayah': verse.verse_num
                })
        return dataset


class TajwidDataProcessor:
    """Traitement des données de Tajwid"""
    
    def __init__(self, data_dir: Path):
        self.data_dir = Path(data_dir)
    
    def load_annotations(self) -> List[Dict]:
        """Charger les annotations de Tajwid"""
        print("📖 Chargement des annotations Tajwid...")
        
        possible_files = [
            self.data_dir / "tajwid" / "annotations" / "annotations.json",
            self.data_dir / "tajwid" / "annotations.json",
        ]
        
        for f in possible_files:
            if f.exists():
                print(f"   ✓ Fichier trouvé: {f}")
                with open(f, 'r', encoding='utf-8') as file:
                    annotations = json.load(file)
                print(f"✅ {len(annotations)} annotations chargées")
                return annotations
        
        print("   ⚠️ Aucun fichier d'annotations trouvé, génération...")
        return self.generate_basic_annotations()
    
    def generate_basic_annotations(self) -> List[Dict]:
        """Générer des annotations basiques"""
        quran_file = self.data_dir / "quran" / "text" / "quran_uthmani.json"
        if not quran_file.exists():
            quran_file = self.data_dir / "quran" / "text" / "quran_full.json"
        
        if not quran_file.exists():
            print("   ❌ Pas de texte coranique disponible")
            return []
        
        with open(quran_file, 'r', encoding='utf-8') as f:
            surahs = json.load(f)
        
        annotations = []
        for surah in surahs[:10]:  # 10 premières sourates
            for ayah in surah.get('ayahs', []):
                text = ayah['text']
                tokens = text.split()
                labels = ["O"] * len(tokens)
                
                for i, token in enumerate(tokens):
                    if "نّ" in token or "مّ" in token:
                        labels[i] = "GHUNNAH"
                    elif any(c in token for c in "آوا"):
                        labels[i] = "MADD_TABII"
                
                annotations.append({
                    "surah": surah['number'],
                    "ayah": ayah['numberInSurah'],
                    "text": text,
                    "tokens": tokens,
                    "labels": labels,
                })
        
        print(f"   ✅ {len(annotations)} annotations générées")
        return annotations
    
    def prepare_ner_dataset(self) -> List[Dict]:
        """Préparer le dataset NER"""
        annotations = self.load_annotations()
        return [{'text': a['text'], 'tokens': a['tokens'], 'labels': a['labels'], 
                 'surah': a.get('surah', 0), 'ayah': a.get('ayah', 0)} for a in annotations]


class ConversationDataProcessor:
    """Traitement des conversations"""
    
    def __init__(self, data_dir: Path):
        self.data_dir = Path(data_dir)
        self.samples: List[ConversationSample] = []
    
    def load_conversations(self) -> List[ConversationSample]:
        """Charger les conversations"""
        print("💬 Chargement des conversations...")
        
        possible_files = [
            self.data_dir / "conversations" / "training_data.json",
            self.data_dir / "conversations" / "conversations.json",
        ]
        
        for f in possible_files:
            if f.exists():
                print(f"   ✓ Fichier trouvé: {f}")
                with open(f, 'r', encoding='utf-8') as file:
                    data = json.load(file)
                
                samples = []
                for item in data:
                    samples.append(ConversationSample(
                        instruction=item['instruction'],
                        input_text=item.get('input', ''),
                        output_text=item['output'],
                        context=item.get('context', 'general')
                    ))
                
                self.samples = samples
                print(f"✅ {len(samples)} conversations chargées")
                return samples
        
        print("   ⚠️ Aucun fichier trouvé, génération...")
        return self.generate_default_conversations()
    
    def generate_default_conversations(self) -> List[ConversationSample]:
        """Générer des conversations par défaut"""
        default_convs = [
            ("كم عدد سور القرآن؟", "عدد سور القرآن الكريم 114 سورة. 📖", "general"),
            ("كم عدد آيات القرآن؟", "عدد آيات القرآن الكريم 6236 آية.", "general"),
            ("ما أطول سورة؟", "أطول سورة هي سورة البقرة (286 آية).", "general"),
            ("ما أقصر سورة؟", "أقصر سورة هي سورة الكوثر (3 آيات).", "general"),
            ("كيف أحفظ القرآن؟", "نصائح للحفظ:\n1. اختر وقت الفجر\n2. كرر الآية 20 مرة\n3. افهم المعنى\n4. راجع قبل النوم", "memorization"),
            ("ما هو الإدغام؟", "الإدغام: إدخال حرف ساكن في متحرك.\n• بغنة: في (ينمو)\n• بلا غنة: في (ل، ر)", "tajwid"),
            ("ما هو الإخفاء؟", "الإخفاء: النطق بالنون الساكنة بين الإظهار والإدغام مع الغنة.", "tajwid"),
            ("ما هي القلقلة؟", "القلقلة: اضطراب صوتي عند نطق حروف (قطب جد) ساكنة.", "tajwid"),
            ("أشعر بصعوبة", "لا تقلق! هذا طبيعي 💚 كل حافظ مر بهذه المرحلة. ابدأ بآية واحدة يومياً!", "motivation"),
            ("شكراً سالي", "العفو! سعيدة بمساعدتك 😊 بالتوفيق في حفظك!", "general"),
        ]
        
        samples = [ConversationSample(i, "", o, c) for i, o, c in default_convs]
        self.samples = samples
        print(f"   ✅ {len(samples)} conversations générées")
        return samples
    
    def augment_conversations(self, samples: List[ConversationSample]) -> List[ConversationSample]:
        """Augmenter les conversations"""
        augmented = list(samples)
        synonyms = {"كيف": ["كيفية", "بأي طريقة"], "ما هو": ["ما معنى", "اشرح لي"]}
        
        for sample in samples:
            for old, news in synonyms.items():
                if old in sample.instruction:
                    for new in news:
                        augmented.append(ConversationSample(
                            sample.instruction.replace(old, new),
                            sample.input_text, sample.output_text, sample.context
                        ))
        return augmented
    
    def prepare_chatbot_dataset(self, format: str = "alpaca") -> List[Dict]:
        """Préparer le dataset chatbot"""
        system_prompt = "أنت سالي، مساعد ذكي متخصص في تعليم القرآن الكريم والتجويد."
        
        dataset = []
        for s in self.samples:
            if format == "alpaca":
                dataset.append({"instruction": s.instruction, "input": s.input_text, "output": s.output_text})
            elif format == "sharegpt":
                dataset.append({"conversations": [
                    {"from": "system", "value": system_prompt},
                    {"from": "human", "value": s.instruction},
                    {"from": "gpt", "value": s.output_text}
                ]})
            elif format == "openai":
                dataset.append({"messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": s.instruction},
                    {"role": "assistant", "content": s.output_text}
                ]})
        return dataset


# ============================================
# Dataset Builder
# ============================================

class DatasetBuilder:
    """Construction des datasets"""
    
    def __init__(self, data_dir: Path, output_dir: Path):
        self.data_dir = Path(data_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def split_dataset(self, dataset: List, ratios=(0.8, 0.1, 0.1)) -> Dict[str, List]:
        if not dataset:
            return {'train': [], 'validation': [], 'test': []}
        
        data = dataset.copy()
        np.random.shuffle(data)
        n = len(data)
        t1, t2 = int(n * ratios[0]), int(n * (ratios[0] + ratios[1]))
        return {'train': data[:t1], 'validation': data[t1:t2], 'test': data[t2:]}
    
    def save_splits(self, splits: Dict[str, List], subdir: str):
        out_dir = self.output_dir / subdir
        out_dir.mkdir(exist_ok=True, parents=True)
        
        for name, data in splits.items():
            with open(out_dir / f"{name}.json", 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"    {name}: {len(data)} samples")
    
    def build_speech_dataset(self):
        print("\n" + "=" * 50)
        print("🎙️ Construction du dataset Speech")
        print("=" * 50)
        
        processor = QuranDataProcessor(self.data_dir)
        processor.load_quran_text()
        processor.link_audio_files()
        
        dataset = processor.prepare_speech_dataset()
        if not dataset:
            print("❌ Pas de données audio")
            return
        
        self.save_splits(self.split_dataset(dataset), "speech")
        print(f"✅ Dataset Speech: {len(dataset)} samples")
    
    def build_tajwid_dataset(self):
        print("\n" + "=" * 50)
        print("📖 Construction du dataset Tajwid")
        print("=" * 50)
        
        processor = TajwidDataProcessor(self.data_dir)
        dataset = processor.prepare_ner_dataset()
        
        if not dataset:
            print("❌ Pas de données Tajwid")
            return
        
        self.save_splits(self.split_dataset(dataset), "tajwid")
        print(f"✅ Dataset Tajwid: {len(dataset)} samples")
    
    def build_chatbot_dataset(self, format: str = "alpaca", augment: bool = True):
        print("\n" + "=" * 50)
        print(f"💬 Construction du dataset Chatbot (format: {format})")
        print("=" * 50)
        
        processor = ConversationDataProcessor(self.data_dir)
        samples = processor.load_conversations()
        
        if not samples:
            print("❌ Pas de conversations")
            return
        
        if augment:
            samples = processor.augment_conversations(samples)
            print(f"  Après augmentation: {len(samples)} samples")
        
        processor.samples = samples
        dataset = processor.prepare_chatbot_dataset(format=format)
        
        self.save_splits(self.split_dataset(dataset), "chatbot")
        print(f"✅ Dataset Chatbot: {len(dataset)} samples")
    
    def build_all(self):
        self.build_speech_dataset()
        self.build_tajwid_dataset()
        self.build_chatbot_dataset()
        
        print("\n" + "=" * 50)
        print("✅ Tous les datasets créés!")
        print(f"📂 Sauvegardés: {self.output_dir}")
        print("=" * 50)


# ============================================
# Main
# ============================================

def main():
    parser = argparse.ArgumentParser(description="Salifz AI - Prétraitement")
    parser.add_argument("--data-dir", default=None, help="Dossier données brutes")
    parser.add_argument("--output-dir", default=None, help="Dossier sortie")
    parser.add_argument("--type", choices=["all", "speech", "tajwid", "chatbot"], default="all")
    parser.add_argument("--format", choices=["alpaca", "sharegpt", "openai"], default="alpaca")
    parser.add_argument("--no-augment", action="store_true")
    
    args = parser.parse_args()
    
    # Chemins
    data_dir = Path(args.data_dir) if args.data_dir else DATA_RAW
    output_dir = Path(args.output_dir) if args.output_dir else DATA_OUT
    
    print("\n" + "=" * 60)
    print("🔧 Salifz AI - Prétraitement des Données")
    print("=" * 60)
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📂 Racine projet: {BASE_DIR}")
    print(f"📂 Input:  {data_dir}")
    print(f"📂 Output: {output_dir}")
    print("=" * 60)
    
    if not data_dir.exists():
        print(f"\n❌ ERREUR: Dossier de données introuvable: {data_dir}")
        print(f"\n💡 Exécutez d'abord:")
        print(f"   python scripts/download_data_full.py --type all")
        return
    
    builder = DatasetBuilder(data_dir, output_dir)
    
    if args.type == "all":
        builder.build_all()
    elif args.type == "speech":
        builder.build_speech_dataset()
    elif args.type == "tajwid":
        builder.build_tajwid_dataset()
    elif args.type == "chatbot":
        builder.build_chatbot_dataset(format=args.format, augment=not args.no_augment)
    
    print("\n🎯 Prochaine étape:")
    print("   python scripts/train_model.py --model chatbot --epochs 10")


if __name__ == "__main__":
    main()