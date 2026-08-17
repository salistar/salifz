/**
 * Shop Item Model - Salifz
 */

const mongoose = require('mongoose');

const shopItemSchema = new mongoose.Schema({
  itemId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    ar: { type: String, required: true },
    en: { type: String, required: true },
    fr: String
  },
  description: {
    ar: String,
    en: String,
    fr: String
  },
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['powerup', 'cosmetic', 'premium', 'bundle'],
    required: true
  },
  
  // Pricing
  price: {
    gems: { type: Number, default: 0 },
    coins: { type: Number, default: 0 }
  },
  
  // Effect
  effect: {
    type: {
      type: String,
      enum: ['streak_freeze', 'heart_refill', 'xp_boost', 'time_boost', 'hint', 'avatar', 'theme', 'none']
    },
    value: Number,
    // Les effets cosmétiques désignent une variante ('night', 'hafiz') et non
    // une quantité : les forcer dans `value` échouait au cast en nombre.
    variant: String,
    duration: Number // in seconds, for boosts
  },
  
  // Availability
  isActive: {
    type: Boolean,
    default: true
  },
  isPremiumOnly: {
    type: Boolean,
    default: false
  },
  maxPurchases: {
    type: Number,
    default: -1 // -1 = unlimited
  },
  
  // Display
  sortOrder: {
    type: Number,
    default: 0
  },
  badge: String, // 'new', 'popular', 'sale'
  originalPrice: {
    gems: Number,
    coins: Number
  }
}, {
  timestamps: true
});

// User purchases tracking
const userPurchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShopItem',
    required: true
  },
  purchaseCount: {
    type: Number,
    default: 1
  },
  lastPurchasedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

userPurchaseSchema.index({ user: 1, item: 1 }, { unique: true });

const ShopItem = mongoose.model('ShopItem', shopItemSchema);
const UserPurchase = mongoose.model('UserPurchase', userPurchaseSchema);

// Seed default shop items
ShopItem.seedDefaults = async function() {
  const defaultItems = [
    // Power-ups
    {
      itemId: 'streak_freeze',
      name: { ar: 'تجميد السلسلة', en: 'Streak Freeze' },
      description: { ar: 'احمِ سلسلتك ليوم واحد', en: 'Protect your streak for one day' },
      icon: '❄️',
      category: 'powerup',
      price: { gems: 200 },
      effect: { type: 'streak_freeze', value: 1 },
      sortOrder: 1,
      badge: 'popular'
    },
    {
      itemId: 'heart_refill',
      name: { ar: 'تعبئة القلوب', en: 'Heart Refill' },
      description: { ar: 'استعد كل قلوبك فوراً', en: 'Instantly refill all your hearts' },
      icon: '❤️',
      category: 'powerup',
      price: { gems: 350 },
      effect: { type: 'heart_refill', value: 5 },
      sortOrder: 2
    },
    {
      itemId: 'xp_boost_1h',
      name: { ar: 'مضاعف XP (ساعة)', en: 'XP Boost (1 hour)' },
      description: { ar: 'ضاعف نقاط الخبرة لمدة ساعة', en: 'Double XP for 1 hour' },
      icon: '⚡',
      category: 'powerup',
      price: { gems: 150 },
      effect: { type: 'xp_boost', value: 2, duration: 3600 },
      sortOrder: 3
    },
    {
      itemId: 'xp_boost_24h',
      name: { ar: 'مضاعف XP (يوم)', en: 'XP Boost (24 hours)' },
      description: { ar: 'ضاعف نقاط الخبرة ليوم كامل', en: 'Double XP for 24 hours' },
      icon: '💫',
      category: 'powerup',
      price: { gems: 500 },
      effect: { type: 'xp_boost', value: 2, duration: 86400 },
      sortOrder: 4,
      badge: 'sale',
      originalPrice: { gems: 700 }
    },
    {
      itemId: 'hint_pack_5',
      name: { ar: 'حزمة تلميحات', en: 'Hint Pack' },
      description: { ar: '5 تلميحات للمساعدة في المراجعة', en: '5 hints to help with review' },
      icon: '💡',
      category: 'powerup',
      price: { gems: 100 },
      effect: { type: 'hint', value: 5 },
      sortOrder: 5
    },
    
    // Bundles
    {
      itemId: 'starter_bundle',
      name: { ar: 'حزمة البداية', en: 'Starter Bundle' },
      description: { ar: 'كل ما تحتاجه للبداية', en: 'Everything you need to start' },
      icon: '🎁',
      category: 'bundle',
      price: { gems: 400 },
      effect: { type: 'none' },
      sortOrder: 10,
      badge: 'new'
    },
    
    // Premium
    {
      itemId: 'premium_monthly',
      name: { ar: 'اشتراك شهري', en: 'Monthly Premium' },
      description: { ar: 'قلوب لا نهائية + بدون إعلانات', en: 'Unlimited hearts + No ads' },
      icon: '👑',
      category: 'premium',
      price: { gems: 0 }, // Real money
      effect: { type: 'none' },
      isPremiumOnly: false,
      sortOrder: 20
    }
  ];

  for (const item of defaultItems) {
    await ShopItem.findOneAndUpdate(
      { itemId: item.itemId },
      item,
      { upsert: true, new: true }
    );
  }
  
  console.log('✅ Shop items seeded');
};

module.exports = { ShopItem, UserPurchase };