/**
 * Suivi de récitation — Salifz
 *
 * L'utilisateur récite, le service Python transcrit et aligne sur le verset
 * attendu, cette route relaie et conserve ce qui mérite de l'être.
 *
 * **Ce n'est pas l'analyse du tajwid** (`routes/tajwid.js`), et les deux ne
 * doivent pas être confondues. Ici on constate quels mots ont été prononcés ;
 * on ne juge pas la manière de les prononcer. Le service ne sait pas noter une
 * gutturale, et présenter une exactitude de mots sous le nom de tajwid
 * répéterait la faute que l'audit avait relevée.
 *
 * Sans `AI_SERVICE_URL`, la route déclare la fonctionnalité indisponible plutôt
 * que de rendre un résultat de complaisance.
 */

const express = require('express');
const multer = require('multer');
const SurahProgress = require('../models/SurahProgress');

const router = express.Router();

const storage = multer.memoryStorage();
// Un extrait de récitation dépasse rarement 300 Ko ; le plafond couvre un
// verset long enregistré sans compression agressive.
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || null;

// Deux délais distincts : en direct, un extrait qui tarde n'a plus d'intérêt,
// mieux vaut abandonner celui-là et suivre le suivant. Sur le verdict final,
// l'utilisateur attend une réponse et la lenteur vaut mieux que l'échec.
const DELAI_DIRECT_MS = Number(process.env.RECITATION_TIMEOUT_DIRECT_MS) || 12000;
const DELAI_FINAL_MS = Number(process.env.RECITATION_TIMEOUT_MS) || 45000;

const INDISPONIBLE = {
  success: false,
  error: "Le suivi de récitation n'est pas disponible.",
  code: 'RECITATION_MOTEUR_INDISPONIBLE',
};

/**
 * GET /api/v1/recitation/etat
 * Permet au mobile de masquer l'entrée du menu quand le moteur est absent,
 * plutôt que d'offrir un bouton qui échouera.
 */
router.get('/etat', async (req, res, next) => {
  if (!AI_SERVICE_URL) {
    return res.json({ success: true, data: { disponible: false, raison: 'non_configure' } });
  }

  try {
    const reponse = await appeler('/recitation/etat', { methode: 'GET', delai: 5000 });
    return res.json({
      success: true,
      data: {
        disponible: Boolean(reponse.ffmpeg),
        modeleCharge: Boolean(reponse.charge),
        modele: reponse.modele,
        versetsCharges: reponse.versets_charges,
      },
    });
  } catch (error) {
    if (error.code === 'RECITATION_MOTEUR_INJOIGNABLE') {
      return res.json({ success: true, data: { disponible: false, raison: 'injoignable' } });
    }
    return next(error);
  }
});

/**
 * POST /api/v1/recitation/suivre
 * Compare un extrait récité au verset attendu.
 *
 * `partiel=true` pendant la récitation : les mots non encore prononcés sont
 * rendus « en_attente ». `false` pour le verdict, où ils deviennent « oublie ».
 */
router.post('/suivre', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Fichier audio requis' });
    }

    const surahNumber = parseInt(req.body.surahNumber ?? req.body.surah, 10);
    const ayahNumber = parseInt(req.body.ayahNumber ?? req.body.ayah, 10);
    const partiel = req.body.partiel === 'true' || req.body.partiel === true;

    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      return res.status(400).json({ success: false, error: 'Numéro de sourate invalide' });
    }
    if (!Number.isInteger(ayahNumber) || ayahNumber < 1) {
      return res.status(400).json({ success: false, error: 'Numéro de verset invalide' });
    }

    if (!AI_SERVICE_URL) {
      return res.status(503).json(INDISPONIBLE);
    }

    const analyse = await analyser(req.file, surahNumber, ayahNumber, partiel);

    // Seul le verdict final est conservé, et seulement s'il est fiable : les
    // extraits intermédiaires se recouvrent et une transcription incomprise
    // n'apprend rien sur le récitant.
    if (!partiel && analyse.fiable && !analyse.silence) {
      await enregistrer(req.userId, surahNumber, ayahNumber, analyse).catch((error) => {
        // L'échec d'écriture ne doit pas masquer un résultat déjà obtenu.
        console.error('[recitation] progression non enregistrée :', error.message);
      });
    }

    return res.json({ success: true, data: analyse });
  } catch (error) {
    if (error.code === 'RECITATION_MOTEUR_INDISPONIBLE') {
      return res.status(503).json({ success: false, error: error.message, code: error.code });
    }
    if (error.code === 'RECITATION_AUDIO_INVALIDE') {
      return res.status(400).json({ success: false, error: error.message, code: error.code });
    }
    if (error.code === 'RECITATION_MOTEUR_INJOIGNABLE') {
      return res.status(502).json({ success: false, error: error.message, code: error.code });
    }
    return next(error);
  }
});

/** Envoie l'extrait au service d'analyse et normalise sa réponse. */
async function analyser(file, surahNumber, ayahNumber, partiel) {
  const form = new FormData();
  form.append(
    'audio',
    new Blob([file.buffer], { type: file.mimetype }),
    file.originalname || 'recitation.m4a'
  );
  form.append('surah', String(surahNumber));
  form.append('ayah', String(ayahNumber));
  form.append('partiel', partiel ? 'true' : 'false');

  const resultat = await appeler('/recitation/suivre', {
    methode: 'POST',
    corps: form,
    delai: partiel ? DELAI_DIRECT_MS : DELAI_FINAL_MS,
  });

  return {
    surahNumber,
    ayahNumber,
    partiel,
    mots: resultat.mots || [],
    ajouts: resultat.ajouts || [],
    position: resultat.position ?? 0,
    total: resultat.total ?? 0,
    exactitude: resultat.exactitude ?? null,
    confiance: resultat.confiance ?? null,
    fiable: resultat.fiable !== false,
    silence: Boolean(resultat.silence),
    termine: Boolean(resultat.termine),
    transcription: resultat.transcription || '',
    analyseLe: resultat.analyse_le || new Date().toISOString(),
  };
}

/** Appel HTTP au service d'analyse, avec traduction des pannes en codes. */
async function appeler(chemin, { methode = 'GET', corps = null, delai = 15000 }) {
  const controleur = new AbortController();
  const minuterie = setTimeout(() => controleur.abort(), delai);

  try {
    const reponse = await fetch(`${AI_SERVICE_URL.replace(/\/$/, '')}${chemin}`, {
      method: methode,
      body: corps,
      signal: controleur.signal,
    });

    if (reponse.status === 503) {
      const detail = await lireDetail(reponse);
      const error = new Error(detail || INDISPONIBLE.error);
      error.code = 'RECITATION_MOTEUR_INDISPONIBLE';
      throw error;
    }
    if (reponse.status === 400 || reponse.status === 413) {
      const detail = await lireDetail(reponse);
      const error = new Error(detail || 'Extrait audio inexploitable.');
      error.code = 'RECITATION_AUDIO_INVALIDE';
      throw error;
    }
    if (!reponse.ok) {
      const error = new Error(`Le service d'analyse a répondu ${reponse.status}.`);
      error.code = 'RECITATION_MOTEUR_INJOIGNABLE';
      throw error;
    }

    return await reponse.json();
  } catch (err) {
    if (err.code) throw err;
    const error = new Error(
      err.name === 'AbortError'
        ? "Le service d'analyse n'a pas répondu à temps."
        : "Le service d'analyse est injoignable."
    );
    error.code = 'RECITATION_MOTEUR_INJOIGNABLE';
    throw error;
  } finally {
    clearTimeout(minuterie);
  }
}

async function lireDetail(reponse) {
  try {
    const corps = await reponse.json();
    return corps.detail || corps.error || null;
  } catch (e) {
    return null;
  }
}

/**
 * Conserve le résultat sur le verset concerné.
 *
 * Les champs écrits sont déclarés au schéma. Mongoose en mode strict **écarte
 * silencieusement** une écriture vers un chemin inconnu : le document est
 * sauvegardé, aucune erreur n'est levée, et la donnée n'existe pas. C'est le
 * défaut qui faisait perdre les réglages utilisateur avant l'audit.
 */
async function enregistrer(userId, surahNumber, ayahNumber, analyse) {
  if (typeof analyse.exactitude !== 'number') return;

  const progression = await SurahProgress.findOne({ userId, surahNumber });
  if (!progression) return;

  const verset = (progression.verses || []).find((v) => v.ayahNumber === ayahNumber);
  if (!verset) return;

  verset.recitationScores = verset.recitationScores || [];
  verset.recitationScores.push({
    accuracy: analyse.exactitude,
    wordsTotal: analyse.total,
    wordsCorrect: analyse.mots.filter((m) => m.etat === 'juste').length,
    confidence: analyse.confiance,
    timestamp: new Date(),
  });

  // On ne garde que les vingt derniers passages : l'historique complet ferait
  // grossir le document sans jamais être lu.
  if (verset.recitationScores.length > 20) {
    verset.recitationScores = verset.recitationScores.slice(-20);
  }

  cumulerErreurs(verset, analyse);

  await progression.save();
}

/**
 * Cumule les mots régulièrement manqués.
 *
 * C'est la donnée réellement utile à la révision : savoir qu'un verset est à
 * 80 % n'indique pas quoi retravailler, savoir que le même mot tombe chaque
 * fois, oui.
 */
function cumulerErreurs(verset, analyse) {
  verset.commonErrors = verset.commonErrors || [];

  const fautifs = analyse.mots.filter(
    (mot) => mot.etat === 'oublie' || mot.etat === 'errone'
  );

  for (const mot of fautifs) {
    const existant = verset.commonErrors.find(
      (e) => e.word === mot.attendu && e.errorType === mot.etat
    );
    if (existant) {
      existant.count += 1;
    } else {
      verset.commonErrors.push({ errorType: mot.etat, word: mot.attendu, count: 1 });
    }
  }
}

module.exports = router;
