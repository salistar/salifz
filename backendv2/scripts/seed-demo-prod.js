/**
 * Seed de démonstration — Salifz (production)
 *
 * Prépare deux comptes réels et cohérents pour la démonstration croisée
 * web ↔ mobile : progression, série, halaqa, khatam, file de révision.
 *
 * Idempotent : relançable sans dupliquer. Il ne touche QUE les deux comptes
 * de démonstration, jamais les autres documents.
 *
 * La série illustre la règle « une seule source de vérité » : on écrit le
 * calendrier dans la collection Streak, puis on RECOPIE current/longest vers
 * user.gamification — le même sens de recopie que User.updateStreak. Les
 * deux compteurs divergeaient (6 dans gamification, 0 dans Streak) parce que
 * l'ancien seed n'écrivait que le premier.
 *
 *   docker exec salifz-api node scripts/seed-demo-prod.js
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI manquant');
  process.exit(1);
}

const User = require('../models/User');
const Streak = require('../models/Streak');
const SurahProgress = require('../models/SurahProgress');
const Halaqa = require('../models/Halaqa');

async function assurerCompte({ email, username, displayName, langue, niveau, xp, gems, serie }) {
  let utilisateur = await User.findOne({ email });
  if (!utilisateur) {
    utilisateur = new User({
      email,
      username,
      displayName,
      password: 'Salifz2026',
      profile: { language: langue, dailyGoal: 5 },
    });
    console.log(`+ compte créé : ${email}`);
  } else {
    console.log(`= compte existant : ${email}`);
  }

  utilisateur.gamification = utilisateur.gamification || {};
  Object.assign(utilisateur.gamification, {
    level: niveau,
    totalXP: xp,
    gems,
    league: 'silver',
  });

  // --- Série : le calendrier d'abord, la recopie ensuite. ---
  let streak = await Streak.findOne({ user: utilisateur._id });
  if (!streak) streak = new Streak({ user: utilisateur._id });

  const aujourdHui = new Date();
  streak.calendar = [];
  for (let i = serie - 1; i >= 0; i--) {
    const jour = new Date(aujourdHui);
    jour.setDate(jour.getDate() - i);
    jour.setHours(12, 0, 0, 0);
    streak.calendar.push({
      date: jour,
      completed: true,
      froze: false,
      xpEarned: 30 + (i % 3) * 10,
    });
  }
  streak.current = serie;
  streak.longest = Math.max(serie, streak.longest || 0);
  streak.lastActivityDate = aujourdHui;
  streak.freezesAvailable = 2;
  await streak.save();

  utilisateur.gamification.currentStreak = streak.current;
  utilisateur.gamification.longestStreak = streak.longest;
  utilisateur.gamification.lastActivityDate = streak.lastActivityDate;

  await utilisateur.save();
  console.log(`  série ${serie} j (Streak + gamification), niveau ${niveau}, ${gems} gemmes`);
  return utilisateur;
}

/**
 * Progression coranique : des versets réellement mémorisés, dont une partie
 * est due en révision (nextReviewAt dans le passé) pour que l'écran Révision
 * et la file du serveur aient de la matière vraie.
 */
async function assurerProgression(utilisateur, sourates) {
  for (const { surahNumber, surahName, total, memorises, dus } of sourates) {
    let progression = await SurahProgress.findOne({ userId: utilisateur._id, surahNumber });
    if (!progression) {
      progression = new SurahProgress({
        userId: utilisateur._id,
        surahNumber,
        surahName,
        totalAyat: total,
      });
    }

    progression.verses = [];
    const hier = new Date(Date.now() - 24 * 3600 * 1000);
    const demain = new Date(Date.now() + 24 * 3600 * 1000);
    for (let ayah = 1; ayah <= total; ayah++) {
      const estMemorise = ayah <= memorises;
      progression.verses.push({
        ayahNumber: ayah,
        status: estMemorise ? 'memorized' : 'not_started',
        memorizedAt: estMemorise ? hier : undefined,
        reviewCount: estMemorise ? 2 : 0,
        lastReviewedAt: estMemorise ? hier : undefined,
        // Les `dus` premiers versets sont à réviser maintenant.
        nextReviewAt: estMemorise ? (ayah <= dus ? hier : demain) : undefined,
        confidence: estMemorise ? 0.6 + (ayah % 4) * 0.1 : 0,
      });
    }
    progression.totalAyat = total;
    // ayatMemorized, progressPercentage et status sont recalculés au save.
    await progression.save();
    console.log(`  sourate ${surahNumber} : ${memorises}/${total} mémorisés, ${Math.min(dus, memorises)} dus`);
  }
}

async function assurerHalaqa(enseignant, membre) {
  let halaqa = await Halaqa.findOne({ name: 'Halaqa de démonstration' });
  if (!halaqa) {
    halaqa = new Halaqa({
      name: 'Halaqa de démonstration',
      description: 'Cercle de mémorisation des deux comptes de démo.',
      creator: enseignant._id,
      settings: { isPublic: true },
    });
    console.log('+ halaqa créée');
  }
  halaqa.creator = enseignant._id;
  const ids = new Set((halaqa.members || []).map((m) => String(m.user || m)));
  for (const u of [enseignant, membre]) {
    if (!ids.has(String(u._id))) {
      halaqa.members = halaqa.members || [];
      halaqa.members.push({ user: u._id, role: String(u._id) === String(enseignant._id) ? 'creator' : 'member' });
    }
  }
  await halaqa.save();
  console.log(`  halaqa : ${halaqa.members.length} membres`);
  return halaqa;
}

async function principal() {
  await mongoose.connect(MONGODB_URI);
  console.log('connecté à Mongo');

  const test = await assurerCompte({
    email: 'test@salifz.com', username: 'testuser', displayName: 'Compte de test',
    langue: 'fr', niveau: 4, xp: 1250, gems: 240, serie: 6,
  });
  const amina = await assurerCompte({
    email: 'ami@salifz.com', username: 'amina', displayName: 'Amina',
    langue: 'fr', niveau: 3, xp: 800, gems: 120, serie: 3,
  });

  // Progression : al-Fatiha complète + un début d'al-Ikhlas pour test ;
  // al-Ikhlas complète pour Amina. Assez pour peupler révision et mushaf.
  await assurerProgression(test, [
    { surahNumber: 1, surahName: 'Al-Fatiha', total: 7, memorises: 7, dus: 3 },
    { surahNumber: 112, surahName: 'Al-Ikhlas', total: 4, memorises: 2, dus: 1 },
  ]);
  await assurerProgression(amina, [
    { surahNumber: 112, surahName: 'Al-Ikhlas', total: 4, memorises: 4, dus: 2 },
    { surahNumber: 114, surahName: 'An-Nas', total: 6, memorises: 3, dus: 1 },
  ]);

  await assurerHalaqa(test, amina);

  // Volontairement ABSENTS : l'amitié entre les deux comptes et leurs
  // conversations. C'est le scénario de démonstration qui les crée en direct —
  // les pré-remplir ôterait toute valeur au test.

  await mongoose.disconnect();
  console.log('seed terminé');
}

principal().catch((e) => {
  console.error('échec du seed :', e.message);
  process.exit(1);
});
