#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    Salifz AI - Model Training Script                       ║
║                                                                               ║
║  Entraînement des modèles:                                                    ║
║  - Tajwid: Analyse des règles de Tajwid (Token Classification)               ║
║  - Chatbot: Assistant Sally (Causal LM avec LoRA)                            ║
║  - Speech: Reconnaissance vocale (Whisper fine-tuning)                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

Usage:
    python train_model.py --model chatbot --epochs 10
    python train_model.py --model tajwid --epochs 5
    python train_model.py --model all
"""

import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any, List

import yaml
import numpy as np

# ============================================
# Configuration
# ============================================

BASE_DIR = Path(__file__).parent.parent
CONFIG_PATH = BASE_DIR / "config" / "config.yaml"


def load_config() -> Dict[str, Any]:
    """Charger la configuration"""
    default_config = {
        "models": {
            "tajwid": {
                "base_model": "CAMeL-Lab/bert-base-arabic-camelbert-mix",
                "output_dir": "models/tajwid",
                "labels": ["O", "IZHAR", "IDGHAM_GHUNNAH", "IDGHAM_BILA", "IKHFA", "IQLAB", 
                          "QALQALA", "GHUNNAH", "MADD_TABII", "MADD_MUTTASIL", "MADD_MUNFASIL", "MADD_LAZIM"]
            },
            "chatbot": {
                "base_model": "aubmindlab/aragpt2-base",
                "output_dir": "models/chatbot",
                "max_length": 512
            },
            "speech": {
                "base_model": "openai/whisper-small",
                "output_dir": "models/speech"
            }
        },
        "training": {
            "device": "cuda",
            "num_epochs": 10,
            "batch_size": 8,
            "eval_batch_size": 16,
            "learning_rate": 2e-5,
            "weight_decay": 0.01,
            "warmup_steps": 500,
            "lr_scheduler": "cosine",
            "gradient_accumulation_steps": 4,
            "gradient_checkpointing": True,
            "mixed_precision": True,
            "eval_strategy": "steps",
            "eval_steps": 500,
            "save_steps": 500,
            "save_total_limit": 3,
            "logging_steps": 100,
            "report_to": "none",
            "early_stopping": True,
            "early_stopping_patience": 3,
            "early_stopping_threshold": 0.01,
            "seed": 42
        }
    }
    
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH) as f:
            return yaml.safe_load(f)
    return default_config


def set_seed(seed: int):
    """Fixer les graines aléatoires"""
    np.random.seed(seed)
    try:
        import torch
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)
    except ImportError:
        pass


def check_dependencies():
    """Vérifier les dépendances"""
    missing = []
    
    try:
        import torch
        print(f"✅ PyTorch {torch.__version__}")
        if torch.cuda.is_available():
            print(f"   GPU: {torch.cuda.get_device_name(0)}")
        else:
            print("   ⚠️ GPU non disponible, utilisation du CPU")
    except ImportError:
        missing.append("torch")
    
    try:
        import transformers
        print(f"✅ Transformers {transformers.__version__}")
    except ImportError:
        missing.append("transformers")
    
    try:
        import datasets
        print(f"✅ Datasets {datasets.__version__}")
    except ImportError:
        missing.append("datasets")
    
    if missing:
        print(f"\n❌ Dépendances manquantes: {', '.join(missing)}")
        print("   Installez-les avec: pip install " + " ".join(missing))
        return False
    
    return True


# ============================================
# Tajwid Model Trainer
# ============================================

class TajwidTrainer:
    """Entraîneur pour le modèle d'analyse de Tajwid"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.model_config = config['models']['tajwid']
        self.training_config = config['training']
        
        self.labels = self.model_config['labels']
        self.label2id = {label: i for i, label in enumerate(self.labels)}
        self.id2label = {i: label for label, i in self.label2id.items()}
    
    def load_data(self):
        """Charger les données"""
        data_dir = BASE_DIR / "data" / "datasets" / "tajwid"
        
        train_data, val_data = [], []
        
        train_file = data_dir / "train.json"
        if train_file.exists():
            with open(train_file, 'r', encoding='utf-8') as f:
                train_data = json.load(f)
        
        val_file = data_dir / "validation.json"
        if val_file.exists():
            with open(val_file, 'r', encoding='utf-8') as f:
                val_data = json.load(f)
        
        print(f"📊 Train: {len(train_data)}, Validation: {len(val_data)}")
        return train_data, val_data
    
    def train(self, output_dir: Optional[str] = None):
        """Entraîner le modèle"""
        print("\n" + "=" * 50)
        print("🏋️ Training Tajwid Model")
        print("=" * 50)
        
        # Vérifier les dépendances
        try:
            import torch
            from transformers import (
                AutoModelForTokenClassification, AutoTokenizer,
                TrainingArguments, Trainer, DataCollatorForTokenClassification
            )
            from datasets import Dataset
        except ImportError as e:
            print(f"❌ Dépendance manquante: {e}")
            return
        
        if output_dir is None:
            output_dir = self.model_config['output_dir']
        output_path = BASE_DIR / output_dir
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Device
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"🖥️ Device: {device}")
        
        # Charger le modèle et tokenizer
        print(f"\n📦 Loading: {self.model_config['base_model']}")
        tokenizer = AutoTokenizer.from_pretrained(self.model_config['base_model'])
        model = AutoModelForTokenClassification.from_pretrained(
            self.model_config['base_model'],
            num_labels=len(self.labels),
            id2label=self.id2label,
            label2id=self.label2id
        )
        model.to(device)
        
        # Charger les données
        train_data, val_data = self.load_data()
        
        if not train_data:
            print("❌ Pas de données d'entraînement!")
            return
        
        # Préparer le dataset
        def tokenize_and_align(examples):
            tokenized = tokenizer(
                examples['tokens'],
                truncation=True,
                is_split_into_words=True,
                max_length=512,
                padding='max_length'
            )
            
            labels = []
            for i, label in enumerate(examples['labels']):
                word_ids = tokenized.word_ids(batch_index=i)
                label_ids = []
                prev_word_idx = None
                
                for word_idx in word_ids:
                    if word_idx is None:
                        label_ids.append(-100)
                    elif word_idx != prev_word_idx:
                        label_ids.append(self.label2id.get(label[word_idx], 0))
                    else:
                        label_ids.append(-100)
                    prev_word_idx = word_idx
                
                labels.append(label_ids)
            
            tokenized['labels'] = labels
            return tokenized
        
        train_dataset = Dataset.from_dict({
            'tokens': [d['tokens'] for d in train_data],
            'labels': [d['labels'] for d in train_data]
        })
        train_dataset = train_dataset.map(tokenize_and_align, batched=True, remove_columns=train_dataset.column_names)
        
        val_dataset = None
        if val_data:
            val_dataset = Dataset.from_dict({
                'tokens': [d['tokens'] for d in val_data],
                'labels': [d['labels'] for d in val_data]
            })
            val_dataset = val_dataset.map(tokenize_and_align, batched=True, remove_columns=val_dataset.column_names)
        
        # Training arguments
        training_args = TrainingArguments(
            output_dir=str(output_path),
            num_train_epochs=self.training_config['num_epochs'],
            per_device_train_batch_size=self.training_config['batch_size'],
            per_device_eval_batch_size=self.training_config['eval_batch_size'],
            learning_rate=self.training_config['learning_rate'],
            weight_decay=self.training_config['weight_decay'],
            warmup_steps=self.training_config['warmup_steps'],
            logging_steps=self.training_config['logging_steps'],
            save_steps=self.training_config['save_steps'],
            eval_strategy="steps" if val_dataset else "no",
            eval_steps=self.training_config['eval_steps'] if val_dataset else None,
            save_total_limit=self.training_config['save_total_limit'],
            load_best_model_at_end=True if val_dataset else False,
            fp16=self.training_config['mixed_precision'] and torch.cuda.is_available(),
            report_to=self.training_config['report_to'],
        )
        
        # Trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=val_dataset,
            data_collator=DataCollatorForTokenClassification(tokenizer=tokenizer),
            tokenizer=tokenizer,
        )
        
        # Train
        print("\n🚀 Démarrage de l'entraînement...")
        trainer.train()
        
        # Save
        print("\n💾 Sauvegarde du modèle...")
        trainer.save_model(str(output_path / "final"))
        tokenizer.save_pretrained(str(output_path / "final"))
        
        print(f"\n✅ Entraînement terminé! Modèle: {output_path / 'final'}")


# ============================================
# Chatbot Model Trainer
# ============================================

class ChatbotTrainer:
    """Entraîneur pour le modèle de chatbot"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.model_config = config['models']['chatbot']
        self.training_config = config['training']
    
    def load_data(self):
        """Charger les données"""
        data_dir = BASE_DIR / "data" / "datasets" / "chatbot"
        
        train_data, val_data = [], []
        
        train_file = data_dir / "train.json"
        if train_file.exists():
            with open(train_file, 'r', encoding='utf-8') as f:
                train_data = json.load(f)
        
        val_file = data_dir / "validation.json"
        if val_file.exists():
            with open(val_file, 'r', encoding='utf-8') as f:
                val_data = json.load(f)
        
        print(f"📊 Train: {len(train_data)}, Validation: {len(val_data)}")
        return train_data, val_data
    
    def train(self, output_dir: Optional[str] = None, use_lora: bool = True):
        """Entraîner le modèle"""
        print("\n" + "=" * 50)
        print("🏋️ Training Chatbot Model (Sally)")
        print("=" * 50)
        
        try:
            import torch
            from transformers import (
                AutoModelForCausalLM, AutoTokenizer,
                TrainingArguments, Trainer, DataCollatorForLanguageModeling
            )
            from datasets import Dataset
        except ImportError as e:
            print(f"❌ Dépendance manquante: {e}")
            return
        
        if output_dir is None:
            output_dir = self.model_config['output_dir']
        output_path = BASE_DIR / output_dir
        output_path.mkdir(parents=True, exist_ok=True)
        
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"🖥️ Device: {device}")
        
        # Charger le modèle
        print(f"\n📦 Loading: {self.model_config['base_model']}")
        tokenizer = AutoTokenizer.from_pretrained(self.model_config['base_model'])
        
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        model = AutoModelForCausalLM.from_pretrained(
            self.model_config['base_model'],
            torch_dtype=torch.float16 if (self.training_config['mixed_precision'] and torch.cuda.is_available()) else torch.float32,
        )
        
        # LoRA (si disponible)
        if use_lora:
            try:
                from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
                
                print("🔧 Application de LoRA...")
                lora_config = LoraConfig(
                    r=16,
                    lora_alpha=32,
                    target_modules=["c_attn", "c_proj"],  # Pour GPT-2
                    lora_dropout=0.05,
                    bias="none",
                    task_type="CAUSAL_LM"
                )
                model = get_peft_model(model, lora_config)
                model.print_trainable_parameters()
            except ImportError:
                print("⚠️ PEFT non disponible, entraînement complet")
                use_lora = False
        
        model.to(device)
        
        # Charger les données
        train_data, val_data = self.load_data()
        
        if not train_data:
            print("❌ Pas de données d'entraînement!")
            return
        
        # Formatter les données
        def format_conversation(item):
            text = f"### Instruction:\n{item['instruction']}\n\n### Response:\n{item['output']}"
            return {"text": text}
        
        formatted_train = [format_conversation(item) for item in train_data]
        formatted_val = [format_conversation(item) for item in val_data] if val_data else None
        
        # Tokeniser
        def tokenize(examples):
            return tokenizer(
                examples['text'],
                truncation=True,
                max_length=self.model_config['max_length'],
                padding='max_length'
            )
        
        train_dataset = Dataset.from_list(formatted_train)
        train_dataset = train_dataset.map(tokenize, batched=True, remove_columns=['text'])
        
        val_dataset = None
        if formatted_val:
            val_dataset = Dataset.from_list(formatted_val)
            val_dataset = val_dataset.map(tokenize, batched=True, remove_columns=['text'])
        
        # Training arguments
        training_args = TrainingArguments(
            output_dir=str(output_path),
            num_train_epochs=self.training_config['num_epochs'],
            per_device_train_batch_size=self.training_config['batch_size'],
            per_device_eval_batch_size=self.training_config['eval_batch_size'],
            learning_rate=self.training_config['learning_rate'],
            weight_decay=self.training_config['weight_decay'],
            warmup_steps=self.training_config['warmup_steps'],
            logging_steps=self.training_config['logging_steps'],
            save_steps=self.training_config['save_steps'],
            save_total_limit=self.training_config['save_total_limit'],
            fp16=self.training_config['mixed_precision'] and torch.cuda.is_available(),
            gradient_checkpointing=self.training_config['gradient_checkpointing'] and torch.cuda.is_available(),
            report_to=self.training_config['report_to'],
        )
        
        # Trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=val_dataset,
            data_collator=DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False),
            tokenizer=tokenizer,
        )
        
        # Train
        print("\n🚀 Démarrage de l'entraînement...")
        trainer.train()
        
        # Save
        print("\n💾 Sauvegarde du modèle...")
        if use_lora:
            model.save_pretrained(str(output_path / "final"))
        else:
            trainer.save_model(str(output_path / "final"))
        tokenizer.save_pretrained(str(output_path / "final"))
        
        print(f"\n✅ Entraînement terminé! Modèle: {output_path / 'final'}")


# ============================================
# Speech Model Trainer
# ============================================

class SpeechTrainer:
    """Entraîneur pour le modèle de reconnaissance vocale"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.model_config = config['models']['speech']
        self.training_config = config['training']
    
    def train(self, output_dir: Optional[str] = None):
        """Entraîner le modèle Whisper"""
        print("\n" + "=" * 50)
        print("🏋️ Training Speech Model (Whisper)")
        print("=" * 50)
        
        print("\n⚠️ L'entraînement Speech nécessite:")
        print("  - Un grand dataset audio (50GB+)")
        print("  - GPU avec 16GB+ VRAM")
        print("  - Plusieurs heures d'entraînement")
        print("\n📝 Pour l'instant, utilisez le modèle pré-entraîné")
        print("   ou fine-tunez avec vos propres données audio.")
        
        # Structure pour l'entraînement (à compléter avec des données réelles)
        print("\n📋 Structure d'entraînement prête.")
        print("   Ajoutez des données audio pour continuer.")


# ============================================
# Main
# ============================================

def main():
    parser = argparse.ArgumentParser(description="Salifz AI - Entraînement des modèles")
    parser.add_argument("--model", choices=["tajwid", "chatbot", "speech", "all"], required=True)
    parser.add_argument("--epochs", type=int, default=None)
    parser.add_argument("--batch-size", type=int, default=None)
    parser.add_argument("--learning-rate", type=float, default=None)
    parser.add_argument("--output-dir", type=str, default=None)
    parser.add_argument("--no-lora", action="store_true")
    parser.add_argument("--seed", type=int, default=42)
    
    args = parser.parse_args()
    
    # Charger config
    config = load_config()
    
    # Override avec les arguments CLI
    if args.epochs:
        config['training']['num_epochs'] = args.epochs
    if args.batch_size:
        config['training']['batch_size'] = args.batch_size
    if args.learning_rate:
        config['training']['learning_rate'] = args.learning_rate
    
    set_seed(args.seed)
    
    print("\n" + "=" * 60)
    print("🚀 Salifz AI - Entraînement des Modèles")
    print("=" * 60)
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 Modèle: {args.model}")
    print(f"📊 Epochs: {config['training']['num_epochs']}")
    print("=" * 60)
    
    # Vérifier les dépendances
    if not check_dependencies():
        print("\n❌ Installez les dépendances manquantes avant de continuer")
        return
    
    # Entraîner selon le modèle
    if args.model in ["tajwid", "all"]:
        trainer = TajwidTrainer(config)
        trainer.train(args.output_dir)
    
    if args.model in ["chatbot", "all"]:
        trainer = ChatbotTrainer(config)
        trainer.train(args.output_dir, use_lora=not args.no_lora)
    
    if args.model in ["speech", "all"]:
        trainer = SpeechTrainer(config)
        trainer.train(args.output_dir)
    
    print("\n" + "=" * 60)
    print(f"✅ Terminé: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print("\n🎯 Prochaine étape:")
    print("   cd api && uvicorn app:app --reload")


if __name__ == "__main__":
    main()