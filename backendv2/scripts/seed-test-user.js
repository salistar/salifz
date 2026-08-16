/**
 * Compte de démonstration — Salifz
 *
 * Crée (ou remet à jour) le compte utilisé par le bouton « Test User » de
 * l'écran de connexion, avec un peu de progression pour que les écrans
 * d'accueil, d'insights et de tajwid aient de quoi afficher.
 *
 * Le mot de passe respecte la politique en vigueur (10 caractères minimum,
 * une majuscule, une minuscule, un chiffre) — l'ancien `test123` ne passait
 * plus la validation.
 *
 *   node scripts/seed-test-user.js
 */

const mongoose = require('mongoose');

const TEST_EMAIL = 'test@salifz.com';
const TEST_PASSWORD = 'Salifz2026';
const TEST_USERNAME = 'testuser';

async function seedTestUser() {
  const User = require('../models/User');
  const SurahProgress = require('../models/SurahProgress');

  await User.deleteOne({ email: TEST_EMAIL });

  const user = new User({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    username: TEST_USERNAME,
    displayName: 'Compte de test',
    isVerified: true,
    isActive: true,
    profile: { language: 'fr', dailyGoal: 5 },
    gamification: {
      level: 4,
      totalXP: 1250,
      weeklyXP: 320,
      currentStreak: 6,
      longestStreak: 14,
      gems: 240,
      // `hearts` est un sous-document dans le schéma, pas un nombre.
      hearts: { current: 5, max: 5, lastRefill: new Date() },
      league: 'silver',
    },
    quranProgress: {
      totalVersesMemorized: 87,
      totalVersesMastered: 42,
      currentSurah: 78,
      currentAyah: 12,
      memorizationPath: 'juz_amma_first',
    },
  });

  await user.save();

  // Progression réelle sur trois sourates courtes, avec dates échelonnées :
  // les insights et la progression tajwid se calculent désormais à partir de
  // ces données au lieu d'être tirées au hasard.
  const daysAgo = (n) => new Date(Date.now() - n * 86400000);

  const surahs = [
    { surahNumber: 114, surahName: 'An-Nas', surahNameArabic: 'الناس', count: 6 },
    { surahNumber: 113, surahName: 'Al-Falaq', surahNameArabic: 'الفلق', count: 5 },
    { surahNumber: 112, surahName: 'Al-Ikhlas', surahNameArabic: 'الإخلاص', count: 4 },
  ];

  await SurahProgress.deleteMany({ userId: user._id });

  for (const surah of surahs) {
    const verses = [];
    for (let ayah = 1; ayah <= surah.count; ayah++) {
      verses.push({
        ayahNumber: ayah,
        status: ayah <= surah.count - 1 ? 'memorized' : 'learning',
        memorizedAt: daysAgo(ayah % 6),
        lastReviewedAt: daysAgo(ayah % 3),
        nextReviewAt: daysAgo(-1),
        reviewCount: 3 + (ayah % 4),
        confidence: 55 + ((ayah * 13) % 40),
        tajwidScores: [
          {
            score: 70 + ((ayah * 7) % 25),
            timestamp: daysAgo(ayah % 5),
            details: { pronunciation: 78, makharij: 72, rules: 81 },
          },
        ],
      });
    }

    await SurahProgress.create({
      userId: user._id,
      surahNumber: surah.surahNumber,
      surahName: surah.surahName,
      surahNameArabic: surah.surahNameArabic,
      totalAyat: surah.count,
      verses,
    });
  }

  return user;
}

// Exécution directe : se connecte à MONGODB_URI puis sème.
if (require.main === module) {
  (async () => {
    require('dotenv').config();
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/salifz';
    await mongoose.connect(uri);
    const user = await seedTestUser();
    console.log(`✅ Compte de test prêt : ${user.email} / ${TEST_PASSWORD}`);
    await mongoose.disconnect();
  })().catch((error) => {
    console.error('❌ Échec du seed :', error.message);
    process.exit(1);
  });
}

module.exports = { seedTestUser, TEST_EMAIL, TEST_PASSWORD };
