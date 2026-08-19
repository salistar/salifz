#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    Salifz AI - FastAPI Backend                             ║
║                                                                               ║
║  API REST pour l'application mobile Salifz:                               ║
║  - /chat: Chatbot Sally                                                       ║
║  - /tajwid/analyze: Analyse de Tajwid                                        ║
║  - /speech/transcribe: Transcription vocale                                  ║
║  - /quran/*: Données coraniques                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

Usage:
    uvicorn app:app --reload --host 0.0.0.0 --port 8000
"""

import os
import sys
import json
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime

from fastapi import FastAPI, Form, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ============================================
# Configuration
# ============================================

BASE_DIR = Path(__file__).parent.parent

# L'image docker pose PYTHONPATH=/app ; en lancement local, uvicorn part du
# dossier api/ et ne verrait pas src/. On l'ajoute plutot que d'imposer une
# variable d'environnement pour un simple essai.
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
DATA_DIR = BASE_DIR / "data" / "raw"
MODELS_DIR = BASE_DIR / "models"

# ============================================
# Modèles Pydantic
# ============================================

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = None

class ChatResponse(BaseModel):
    response: str
    context: str
    timestamp: str

class TajwidRequest(BaseModel):
    text: str

class TajwidResponse(BaseModel):
    text: str
    tokens: List[str]
    labels: List[str]
    rules: List[Dict[str, Any]]

class SurahInfo(BaseModel):
    number: int
    name_arabic: str
    name_english: str
    verses: int
    revelation_type: str

class VerseInfo(BaseModel):
    surah: int
    verse: int
    text_arabic: str
    text_simple: Optional[str] = None
    translation: Optional[str] = None
    audio_url: Optional[str] = None

# ============================================
# Application FastAPI
# ============================================

app = FastAPI(
    title="Salifz AI API",
    description="API pour l'application de mémorisation du Coran",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifier les origines
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Données en mémoire (cache)
# ============================================

quran_data = {}
tajwid_rules = {}

def load_data():
    """Charger les données au démarrage"""
    global quran_data, tajwid_rules
    
    # Charger le Coran
    quran_file = DATA_DIR / "quran" / "text" / "quran_uthmani.json"
    if not quran_file.exists():
        quran_file = DATA_DIR / "quran" / "text" / "quran_full.json"
    
    if quran_file.exists():
        with open(quran_file, 'r', encoding='utf-8') as f:
            surahs = json.load(f)
            for surah in surahs:
                quran_data[surah['number']] = surah
        print(f"✅ {len(quran_data)} sourates chargées")
    
    # Charger les règles de Tajwid
    rules_file = DATA_DIR / "tajwid" / "rules" / "tajwid_rules.json"
    if rules_file.exists():
        with open(rules_file, 'r', encoding='utf-8') as f:
            tajwid_rules = json.load(f)
        print(f"✅ {len(tajwid_rules)} règles de Tajwid chargées")

# Charger au démarrage
@app.on_event("startup")
async def startup_event():
    print("\n🚀 Démarrage de l'API Salifz...")
    load_data()
    print("✅ API prête!\n")

# ============================================
# Endpoints - Health
# ============================================

@app.get("/")
async def root():
    """Page d'accueil"""
    return {
        "name": "Salifz AI API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "chat": "/chat",
            "tajwid": "/tajwid/analyze",
            "quran": "/quran/surahs",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    """Vérification de santé"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "data_loaded": {
            "quran": len(quran_data) > 0,
            "tajwid": len(tajwid_rules) > 0
        }
    }

# ============================================
# Endpoints - Chat (Sally)
# ============================================

# Réponses prédéfinies pour le chatbot
SALLY_RESPONSES = {
    "سلام": "وعليكم السلام ورحمة الله وبركاته! 😊 كيف يمكنني مساعدتك اليوم؟",
    "كيف حالك": "الحمد لله بخير! أنا سعيدة بخدمتك في رحلتك مع القرآن الكريم 💚",
    "شكرا": "العفو! سعيدة بمساعدتك 😊 بالتوفيق في حفظك!",
    "مساعدة": "أنا هنا لمساعدتك في:\n📖 حفظ القرآن\n🎤 أحكام التجويد\n❓ أسئلة عن القرآن\n💪 التشجيع والدعم\n\nكيف يمكنني مساعدتك؟",
}

TAJWID_QA = {
    "الإدغام": "الإدغام: إدخال حرف ساكن في متحرك ليصيرا حرفاً مشدداً.\n\n1️⃣ بغنة: في حروف (ينمو)\n2️⃣ بلا غنة: في حروف (ل، ر)\n\nمثال: \"مَن يَعْمَلْ\" ← \"مَيَّعْمَلْ\"",
    "الإخفاء": "الإخفاء: النطق بالنون الساكنة بين الإظهار والإدغام مع الغنة.\n\nحروفه 15 في: \"صف ذا ثنا كم جاد شخص قد سما دم طيباً زد في تقى ضع ظالماً\"",
    "القلقلة": "القلقلة: اضطراب صوتي عند نطق حروف (قطب جد) ساكنة.\n\n• صغرى: وسط الكلمة\n• كبرى: آخر الكلمة عند الوقف",
    "المد": "أنواع المد:\n\n1️⃣ طبيعي: حركتان\n2️⃣ متصل: 4-5 حركات\n3️⃣ منفصل: 4-5 حركات\n4️⃣ عارض للسكون: 2-4-6\n5️⃣ لازم: 6 حركات",
    "الإقلاب": "الإقلاب: قلب النون الساكنة ميماً مخفاة عند الباء.\n\nمثال: \"مِن بَعْدِ\" ← \"مِمْبَعْدِ\"",
}

MEMORIZATION_TIPS = {
    "حفظ": "نصائح للحفظ:\n1️⃣ اختر وقت الفجر\n2️⃣ كرر الآية 20 مرة\n3️⃣ افهم المعنى\n4️⃣ راجع قبل النوم\n5️⃣ استمع كثيراً\n\nالاستمرارية أهم من السرعة! 💪",
    "نسيان": "النسيان طبيعي! الحل: المراجعة\n\n🔄 يومياً: راجع ما حفظت بالأمس\n📅 أسبوعياً: راجع ما حفظت هذا الأسبوع\n📖 صلِّ بما تحفظ\n\nما نسيته يمكن استرجاعه بإذن الله! 💪",
    "صعوبة": "لا تقلق! الصعوبة طبيعية في البداية 💚\n\n🌟 تذكر:\n• كل حافظ مر بهذه المرحلة\n• القرآن ميسر للذكر\n• ابدأ بآية واحدة يومياً\n\nأنت قادر! 💪",
}

def get_sally_response(message: str) -> str:
    """Obtenir une réponse de Sally"""
    message_lower = message.lower().strip()
    
    # Réponses directes
    for key, response in SALLY_RESPONSES.items():
        if key in message_lower:
            return response
    
    # Questions sur le Tajwid
    for key, response in TAJWID_QA.items():
        if key in message_lower or key.replace("ال", "") in message_lower:
            return response
    
    # Questions sur la mémorisation
    for key, response in MEMORIZATION_TIPS.items():
        if key in message_lower:
            return response
    
    # Questions sur le nombre de sourates/versets
    if "عدد" in message_lower and "سور" in message_lower:
        return "عدد سور القرآن الكريم 114 سورة، منها 86 مكية و28 مدنية. 📖"
    
    if "عدد" in message_lower and "آيات" in message_lower:
        return "عدد آيات القرآن الكريم 6236 آية حسب العد الكوفي."
    
    if "أطول سورة" in message_lower:
        return "أطول سورة هي سورة البقرة (286 آية)."
    
    if "أقصر سورة" in message_lower:
        return "أقصر سورة هي سورة الكوثر (3 آيات)."
    
    # Réponse par défaut
    return "مرحباً! 😊 أنا سالي، مساعدتك في حفظ القرآن.\n\nيمكنني مساعدتك في:\n📖 الحفظ والمراجعة\n🎤 أحكام التجويد\n❓ أسئلة عن القرآن\n\nكيف يمكنني مساعدتك اليوم؟"

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Endpoint du chatbot Sally
    
    Envoie un message et reçoit une réponse de Sally.
    """
    response = get_sally_response(request.message)
    
    return ChatResponse(
        response=response,
        context=request.context or "general",
        timestamp=datetime.now().isoformat()
    )

# ============================================
# Endpoints - Tajwid
# ============================================

def analyze_tajwid_simple(text: str) -> TajwidResponse:
    """Analyse simple de Tajwid (sans modèle ML)"""
    tokens = text.split()
    labels = []
    rules_found = []
    
    for token in tokens:
        label = "O"
        
        # Détection basique des règles
        if "نّ" in token or "مّ" in token:
            label = "GHUNNAH"
            rules_found.append({"rule": "GHUNNAH", "token": token, "description": "غنة"})
        elif any(c in token for c in "قطبجد"):
            if token.endswith(("قْ", "طْ", "بْ", "جْ", "دْ")):
                label = "QALQALA"
                rules_found.append({"rule": "QALQALA", "token": token, "description": "قلقلة"})
        elif "آ" in token or "وا" in token[-2:] or "ي" in token[-2:]:
            label = "MADD_TABII"
            rules_found.append({"rule": "MADD_TABII", "token": token, "description": "مد طبيعي"})
        
        labels.append(label)
    
    return TajwidResponse(
        text=text,
        tokens=tokens,
        labels=labels,
        rules=rules_found
    )

@app.post("/tajwid/analyze", response_model=TajwidResponse)
async def analyze_tajwid(request: TajwidRequest):
    """
    Analyser le texte pour les règles de Tajwid
    
    Retourne les tokens annotés avec les règles détectées.
    """
    return analyze_tajwid_simple(request.text)

@app.get("/tajwid/rules")
async def get_tajwid_rules():
    """Obtenir toutes les règles de Tajwid"""
    if not tajwid_rules:
        return {"rules": {}, "message": "Règles non chargées"}
    return {"rules": tajwid_rules}

# ============================================
# Endpoints - Quran
# ============================================

@app.get("/quran/surahs")
async def get_surahs():
    """Obtenir la liste de toutes les sourates"""
    if not quran_data:
        raise HTTPException(status_code=503, detail="Données non chargées")
    
    surahs = []
    for num, surah in quran_data.items():
        surahs.append({
            "number": num,
            "name": surah.get("name", ""),
            "englishName": surah.get("englishName", ""),
            "verses": len(surah.get("ayahs", [])),
            "revelationType": surah.get("revelationType", "")
        })
    
    return {"surahs": sorted(surahs, key=lambda x: x["number"])}

@app.get("/quran/surah/{surah_num}")
async def get_surah(surah_num: int):
    """Obtenir une sourate complète"""
    if surah_num not in quran_data:
        raise HTTPException(status_code=404, detail=f"Sourate {surah_num} non trouvée")
    
    return quran_data[surah_num]

@app.get("/quran/verse/{surah_num}/{verse_num}")
async def get_verse(surah_num: int, verse_num: int):
    """Obtenir un verset spécifique"""
    if surah_num not in quran_data:
        raise HTTPException(status_code=404, detail=f"Sourate {surah_num} non trouvée")
    
    surah = quran_data[surah_num]
    ayahs = surah.get("ayahs", [])
    
    for ayah in ayahs:
        if ayah.get("numberInSurah") == verse_num:
            return {
                "surah": surah_num,
                "verse": verse_num,
                "text": ayah.get("text", ""),
                "juz": ayah.get("juz", 0),
                "page": ayah.get("page", 0)
            }
    
    raise HTTPException(status_code=404, detail=f"Verset {verse_num} non trouvé")

@app.get("/quran/search")
async def search_quran(q: str, limit: int = 10):
    """Rechercher dans le Coran"""
    if not q or len(q) < 2:
        raise HTTPException(status_code=400, detail="Requête trop courte")
    
    results = []
    
    for surah_num, surah in quran_data.items():
        for ayah in surah.get("ayahs", []):
            if q in ayah.get("text", ""):
                results.append({
                    "surah": surah_num,
                    "surah_name": surah.get("name", ""),
                    "verse": ayah.get("numberInSurah"),
                    "text": ayah.get("text", ""),
                })
                
                if len(results) >= limit:
                    break
        
        if len(results) >= limit:
            break
    
    return {"query": q, "results": results, "count": len(results)}

# ============================================
# Endpoints - Statistics
# ============================================

@app.get("/stats")
async def get_stats():
    """Obtenir les statistiques"""
    total_verses = sum(len(s.get("ayahs", [])) for s in quran_data.values())
    
    return {
        "quran": {
            "surahs": len(quran_data),
            "verses": total_verses
        },
        "tajwid": {
            "rules": len(tajwid_rules)
        },
        "api": {
            "version": "1.0.0",
            "uptime": datetime.now().isoformat()
        }
    }

# ============================================
# Endpoints - Suivi de recitation
# ============================================

# Plafond aligne sur celui du backend Node : un extrait de recitation depasse
# rarement 300 Ko, au-dela c'est une erreur d'appel.
TAILLE_AUDIO_MAX = 10 * 1024 * 1024


def texte_du_verset(surah_num: int, verse_num: int) -> Optional[str]:
    """Retrouve le verset attendu dans les donnees chargees au demarrage.

    Le texte de reference vient du serveur, pas du client : c'est lui qui
    definit ce qui est juste, et le faire remonter du telephone reviendrait a
    laisser l'application noter sa propre copie.
    """
    from src.recitation.reference import retirer_basmala

    sourate = quran_data.get(surah_num)
    if not sourate:
        return None
    for ayah in sourate.get("ayahs", []):
        if ayah.get("numberInSurah") == verse_num:
            return retirer_basmala(ayah.get("text", ""), surah_num, verse_num)
    return None


@app.get("/recitation/etat")
async def etat_recitation(charger: bool = False):
    """Ce que le moteur peut faire, ici et maintenant.

    Ne charge pas le modele par defaut : cette route sert de sonde, et une
    sonde qui declenche le telechargement de 277 Mo fait expirer le premier
    appel venu.
    """
    from src.recitation import audio as prep_audio
    from src.recitation import moteur

    charge = moteur._etat["modele"] is not None
    if charger and not charge:
        charge = moteur.disponible()

    return {
        "modele": moteur.nom_du_modele(),
        "charge": charge,
        "ffmpeg": prep_audio.ffmpeg_disponible(),
        "erreur": moteur._etat["erreur"],
        "versets_charges": sum(len(s.get("ayahs", [])) for s in quran_data.values()),
    }


@app.post("/recitation/suivre")
async def suivre_recitation(
    audio: UploadFile = File(...),
    surah: int = Form(...),
    ayah: int = Form(...),
    partiel: bool = Form(False),
    depuis: int = Form(0),
    texte: Optional[str] = Form(None),
):
    """Compare un extrait recite au verset attendu.

    `partiel=true` pendant la recitation : les mots pas encore prononces sont
    rendus « en_attente ». `false` pour le verdict final, ou ils deviennent
    « oublie ».

    `depuis` est l'indice du premier mot que cet extrait couvre. Indispensable
    en mode par extraits : sans lui, le deuxieme extrait ferait passer tout le
    debut du verset pour oublie.
    """
    from src.recitation.audio import AudioIllisible
    from src.recitation.moteur import MoteurIndisponible
    from src.recitation.suivi import suivre

    if not 1 <= surah <= 114:
        raise HTTPException(status_code=400, detail="Numero de sourate invalide")
    if ayah < 1:
        raise HTTPException(status_code=400, detail="Numero de verset invalide")

    # Le texte transmis n'est accepte que pour un passage de plusieurs versets,
    # ou la reference du serveur ne suffit pas.
    attendu = texte or texte_du_verset(surah, ayah)
    if not attendu:
        raise HTTPException(
            status_code=404,
            detail="Verset %d:%d introuvable dans les donnees du service" % (surah, ayah),
        )

    donnees = await audio.read()
    if len(donnees) > TAILLE_AUDIO_MAX:
        raise HTTPException(status_code=413, detail="Extrait audio trop volumineux")

    try:
        resultat = suivre(attendu, donnees, partiel=partiel, depuis=max(0, depuis))
    except AudioIllisible as erreur:
        raise HTTPException(status_code=400, detail="Audio illisible : %s" % erreur)
    except MoteurIndisponible as erreur:
        # 503 et non 200 avec un resultat vide : l'appelant doit pouvoir
        # distinguer « rien reconnu » de « rien tente ».
        raise HTTPException(status_code=503, detail=str(erreur))

    resultat["surah"] = surah
    resultat["ayah"] = ayah
    resultat["analyse_le"] = datetime.now().isoformat()
    return resultat


# ============================================
# Main
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)