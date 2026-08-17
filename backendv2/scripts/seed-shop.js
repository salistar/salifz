/**
 * Catalogue de la boutique — Salifz
 *
 * La route `/rewards/shop` fonctionnait mais renvoyait une liste vide : la
 * collection `ShopItem` n'avait jamais été alimentée. Côté application, la
 * boutique existait donc comme un écran toujours vide — impossible de savoir,
 * sans regarder la base, s'il s'agissait d'un bug ou d'un catalogue à écrire.
 *
 *   node scripts/seed-shop.js
 */

const mongoose = require('mongoose');

const ITEMS = [
  {
    itemId: 'streak_freeze',
    name: { ar: 'تجميد السلسلة', en: 'Streak freeze', fr: 'Gel de série' },
    description: {
      ar: 'يحمي سلسلتك ليوم واحد إذا فاتك الحفظ',
      en: 'Protects your streak for a day you miss',
      fr: 'Protège votre série un jour où vous ne pratiquez pas',
    },
    icon: '🧊',
    category: 'powerup',
    price: 200,
    effect: { type: 'streak_freeze', value: 1 },
    maxPurchases: 3,
    sortOrder: 1,
  },
  {
    itemId: 'heart_refill',
    name: { ar: 'ملء القلوب', en: 'Heart refill', fr: 'Recharge de cœurs' },
    description: {
      ar: 'استعد كل قلوبك فوراً',
      en: 'Restores all your hearts at once',
      fr: 'Restaure tous vos cœurs immédiatement',
    },
    icon: '❤️',
    category: 'powerup',
    price: 150,
    effect: { type: 'heart_refill', value: 5 },
    sortOrder: 2,
  },
  {
    itemId: 'xp_boost',
    name: { ar: 'مضاعفة النقاط', en: 'XP boost', fr: 'Bonus d’XP' },
    description: {
      ar: 'نقاط مضاعفة لمدة ثلاثين دقيقة',
      en: 'Double XP for thirty minutes',
      fr: 'XP doublé pendant trente minutes',
    },
    icon: '⚡',
    category: 'powerup',
    price: 300,
    effect: { type: 'xp_boost', value: 2, duration: 30 },
    sortOrder: 3,
  },
  {
    itemId: 'hint_pack',
    name: { ar: 'حزمة تلميحات', en: 'Hint pack', fr: 'Lot d’indices' },
    description: {
      ar: 'خمسة تلميحات أثناء المراجعة',
      en: 'Five hints during review',
      fr: 'Cinq indices pendant la révision',
    },
    icon: '💡',
    category: 'powerup',
    price: 120,
    effect: { type: 'hint', value: 5 },
    sortOrder: 4,
  },
  {
    itemId: 'theme_night',
    name: { ar: 'مظهر ليلي', en: 'Night theme', fr: 'Thème nocturne' },
    description: {
      ar: 'ألوان هادئة للقراءة الليلية',
      en: 'Calm colours for night reading',
      fr: 'Couleurs sobres pour la lecture nocturne',
    },
    icon: '🌙',
    category: 'cosmetic',
    price: 500,
    effect: { type: 'theme', variant: 'night' },
    maxPurchases: 1,
    sortOrder: 5,
  },
  {
    itemId: 'avatar_hafiz',
    name: { ar: 'أفاتار الحافظ', en: 'Hafiz avatar', fr: 'Avatar hafiz' },
    description: {
      ar: 'صورة رمزية مميزة',
      en: 'A distinctive profile picture',
      fr: 'Une image de profil distinctive',
    },
    icon: '🎓',
    category: 'cosmetic',
    price: 400,
    effect: { type: 'avatar', variant: 'hafiz' },
    maxPurchases: 1,
    sortOrder: 6,
  },
  {
    itemId: 'bundle_starter',
    name: { ar: 'حزمة البداية', en: 'Starter bundle', fr: 'Lot de démarrage' },
    description: {
      ar: 'تجميد سلسلة، ملء قلوب ومضاعفة نقاط',
      en: 'A streak freeze, a heart refill and an XP boost',
      fr: 'Un gel de série, une recharge de cœurs et un bonus d’XP',
    },
    icon: '🎁',
    category: 'bundle',
    price: 550,
    originalPrice: 650,
    badge: 'promo',
    effect: { type: 'none' },
    sortOrder: 7,
  },
];

async function seedShop() {
  // Le module exporte { ShopItem, UserPurchase }, pas le modèle directement.
  const { ShopItem } = require('../models/ShopItem');

  for (const item of ITEMS) {
    // `upsert` plutôt qu'un vidage : relancer le script ne doit pas effacer
    // l'historique d'achat lié aux articles existants.
    await ShopItem.updateOne(
      { itemId: item.itemId },
      { $set: { ...item, isActive: true } },
      { upsert: true }
    );
  }

  return ITEMS.length;
}

if (require.main === module) {
  (async () => {
    require('dotenv').config();
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salifz');
    const count = await seedShop();
    console.log(`✅ Catalogue de la boutique : ${count} articles`);
    await mongoose.disconnect();
  })().catch((error) => {
    console.error('❌ Échec du seed :', error.message);
    process.exit(1);
  });
}

module.exports = { seedShop, ITEMS };
