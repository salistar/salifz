/**
 * Seed Script - Salifz
 * ✅ COMPLETE: Creates test accounts, friends, conversations, and all initial data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const { Challenge } = require('../models/Challenge');
const { ShopItem } = require('../models/ShopItem');
const Streak = require('../models/Streak');
const Notification = require('../models/Notification');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/salifz';

// ============================================
// TEST USERS DATA
// ============================================

// Main test user
const TEST_USER = {
  email: 'test@salifz.com',
  username: 'testuser',
  password: 'test123',
  displayName: 'حساب تجريبي',
  avatar: 'avatar_1',
  profile: {
    language: 'ar',
    country: 'MA',
    dailyGoal: 5,
    gender: 'male',
    ageGroup: 'adult'
  },
  gamification: {
    totalXP: 2500,
    weeklyXP: 450,
    dailyXP: 50,
    level: 5,
    currentStreak: 7,
    longestStreak: 15,
    gems: 250,
    league: 'silver',
    hearts: { current: 5, max: 5, lastRefill: new Date() },
    streakFreezes: { available: 2, usedThisWeek: 0 }
  },
  quranProgress: {
    totalVersesMemorized: 87,
    totalSurahCompleted: 4,
    currentSurah: 110,
    currentAyah: 2,
    currentJuz: 30
  },
  dailyQuests: {
    date: new Date(),
    quests: [
      { questId: 'daily_memorize', type: 'memorize', description: 'احفظ 5 آيات جديدة', target: 5, current: 3, xpReward: 50, completed: false },
      { questId: 'daily_review', type: 'review', description: 'راجع 10 آيات', target: 10, current: 10, xpReward: 30, completed: true },
      { questId: 'daily_lesson', type: 'streak', description: 'أكمل درساً واحداً', target: 1, current: 1, xpReward: 20, completed: true }
    ]
  },
  isVerified: true,
  isActive: true
};

// Additional users (friends and potential friends)
const ADDITIONAL_USERS = [
  {
    email: 'ahmed@salifz.com',
    username: 'ahmed_hafiz',
    password: 'test123',
    displayName: 'أحمد الحافظ',
    avatar: 'avatar_2',
    profile: {
      language: 'ar',
      country: 'SA',
      dailyGoal: 10,
      gender: 'male',
      ageGroup: 'adult'
    },
    gamification: {
      totalXP: 5000,
      weeklyXP: 800,
      dailyXP: 120,
      level: 10,
      currentStreak: 30,
      longestStreak: 45,
      gems: 500,
      league: 'gold',
      hearts: { current: 5, max: 5, lastRefill: new Date() }
    },
    quranProgress: {
      totalVersesMemorized: 500,
      totalSurahCompleted: 15,
      currentSurah: 67,
      currentAyah: 10,
      currentJuz: 29
    },
    isVerified: true,
    isActive: true
  },
  {
    email: 'fatima@salifz.com',
    username: 'fatima_quran',
    password: 'test123',
    displayName: 'فاطمة الزهراء',
    avatar: 'avatar_3',
    profile: {
      language: 'ar',
      country: 'EG',
      dailyGoal: 7,
      gender: 'female',
      ageGroup: 'adult'
    },
    gamification: {
      totalXP: 8000,
      weeklyXP: 600,
      dailyXP: 80,
      level: 15,
      currentStreak: 60,
      longestStreak: 90,
      gems: 800,
      league: 'diamond',
      hearts: { current: 5, max: 5, lastRefill: new Date() }
    },
    quranProgress: {
      totalVersesMemorized: 1000,
      totalSurahCompleted: 30,
      currentSurah: 55,
      currentAyah: 5,
      currentJuz: 27
    },
    isVerified: true,
    isActive: true
  },
  {
    email: 'omar@salifz.com',
    username: 'omar_student',
    password: 'test123',
    displayName: 'عمر المتعلم',
    avatar: 'avatar_4',
    profile: {
      language: 'ar',
      country: 'MA',
      dailyGoal: 3,
      gender: 'male',
      ageGroup: 'teen'
    },
    gamification: {
      totalXP: 1000,
      weeklyXP: 200,
      dailyXP: 30,
      level: 3,
      currentStreak: 5,
      longestStreak: 10,
      gems: 100,
      league: 'bronze',
      hearts: { current: 3, max: 5, lastRefill: new Date() }
    },
    quranProgress: {
      totalVersesMemorized: 50,
      totalSurahCompleted: 2,
      currentSurah: 112,
      currentAyah: 1,
      currentJuz: 30
    },
    isVerified: true,
    isActive: true
  },
  {
    email: 'maryam@salifz.com',
    username: 'maryam_tajwid',
    password: 'test123',
    displayName: 'مريم التجويد',
    avatar: 'avatar_5',
    profile: {
      language: 'ar',
      country: 'JO',
      dailyGoal: 8,
      gender: 'female',
      ageGroup: 'adult'
    },
    gamification: {
      totalXP: 12000,
      weeklyXP: 1000,
      dailyXP: 150,
      level: 20,
      currentStreak: 100,
      longestStreak: 150,
      gems: 1500,
      league: 'diamond',
      hearts: { current: 5, max: 5, lastRefill: new Date() }
    },
    quranProgress: {
      totalVersesMemorized: 2000,
      totalSurahCompleted: 50,
      currentSurah: 36,
      currentAyah: 20,
      currentJuz: 22
    },
    isVerified: true,
    isActive: true
  },
  // Additional users for search/suggestions
  {
    email: 'youssef@salifz.com',
    username: 'youssef_hifz',
    password: 'test123',
    displayName: 'يوسف الحفظ',
    avatar: 'avatar_6',
    profile: {
      language: 'ar',
      country: 'MA',
      dailyGoal: 5,
      gender: 'male',
      ageGroup: 'adult'
    },
    gamification: {
      totalXP: 3500,
      weeklyXP: 350,
      dailyXP: 50,
      level: 7,
      currentStreak: 14,
      longestStreak: 25,
      gems: 300,
      league: 'silver',
      hearts: { current: 5, max: 5, lastRefill: new Date() }
    },
    quranProgress: {
      totalVersesMemorized: 200,
      totalSurahCompleted: 8,
      currentSurah: 78,
      currentAyah: 15,
      currentJuz: 30
    },
    isVerified: true,
    isActive: true
  },
  {
    email: 'aisha@salifz.com',
    username: 'aisha_reader',
    password: 'test123',
    displayName: 'عائشة القارئة',
    avatar: 'avatar_7',
    profile: {
      language: 'ar',
      country: 'AE',
      dailyGoal: 6,
      gender: 'female',
      ageGroup: 'adult'
    },
    gamification: {
      totalXP: 6500,
      weeklyXP: 550,
      dailyXP: 90,
      level: 12,
      currentStreak: 45,
      longestStreak: 60,
      gems: 650,
      league: 'gold',
      hearts: { current: 5, max: 5, lastRefill: new Date() }
    },
    quranProgress: {
      totalVersesMemorized: 750,
      totalSurahCompleted: 22,
      currentSurah: 56,
      currentAyah: 30,
      currentJuz: 27
    },
    isVerified: true,
    isActive: true
  },
  {
    email: 'ibrahim@salifz.com',
    username: 'ibrahim_quran',
    password: 'test123',
    displayName: 'إبراهيم القرآن',
    avatar: 'avatar_8',
    profile: {
      language: 'ar',
      country: 'SA',
      dailyGoal: 12,
      gender: 'male',
      ageGroup: 'adult'
    },
    gamification: {
      totalXP: 15000,
      weeklyXP: 1200,
      dailyXP: 180,
      level: 25,
      currentStreak: 120,
      longestStreak: 180,
      gems: 2000,
      league: 'hafiz',
      hearts: { current: 5, max: 5, lastRefill: new Date() }
    },
    quranProgress: {
      totalVersesMemorized: 3000,
      totalSurahCompleted: 70,
      currentSurah: 18,
      currentAyah: 50,
      currentJuz: 15
    },
    isVerified: true,
    isActive: true
  },
  {
    email: 'khadija@salifz.com',
    username: 'khadija_hifz',
    password: 'test123',
    displayName: 'خديجة الحفظ',
    avatar: 'avatar_9',
    profile: {
      language: 'ar',
      country: 'MA',
      dailyGoal: 4,
      gender: 'female',
      ageGroup: 'teen'
    },
    gamification: {
      totalXP: 2000,
      weeklyXP: 280,
      dailyXP: 40,
      level: 4,
      currentStreak: 10,
      longestStreak: 15,
      gems: 180,
      league: 'bronze',
      hearts: { current: 4, max: 5, lastRefill: new Date() }
    },
    quranProgress: {
      totalVersesMemorized: 100,
      totalSurahCompleted: 5,
      currentSurah: 105,
      currentAyah: 3,
      currentJuz: 30
    },
    isVerified: true,
    isActive: true
  },
  {
    email: 'ali@salifz.com',
    username: 'ali_memorizer',
    password: 'test123',
    displayName: 'علي المحفظ',
    avatar: 'avatar_10',
    profile: {
      language: 'ar',
      country: 'IQ',
      dailyGoal: 8,
      gender: 'male',
      ageGroup: 'adult'
    },
    gamification: {
      totalXP: 9000,
      weeklyXP: 700,
      dailyXP: 100,
      level: 16,
      currentStreak: 55,
      longestStreak: 80,
      gems: 900,
      league: 'gold',
      hearts: { current: 5, max: 5, lastRefill: new Date() }
    },
    quranProgress: {
      totalVersesMemorized: 1200,
      totalSurahCompleted: 35,
      currentSurah: 44,
      currentAyah: 25,
      currentJuz: 25
    },
    isVerified: true,
    isActive: true
  }
];

// ============================================
// MAIN SEED FUNCTION
// ============================================
async function seed() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // ============================================
    // CREATE USERS
    // ============================================
    console.log('\n👤 Creating users...');
    
    // Delete existing test users
    const emails = [TEST_USER.email, ...ADDITIONAL_USERS.map(u => u.email)];
    await User.deleteMany({ email: { $in: emails } });
    
    // Create main test user
    const testUser = new User(TEST_USER);
    await testUser.save();
    console.log(`   ✅ ${testUser.displayName} (${testUser.email})`);
    
    // Create additional users
    const createdUsers = [testUser];
    for (const userData of ADDITIONAL_USERS) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`   ✅ ${user.displayName} (${user.email})`);
    }

    // ============================================
    // SETUP FRIEND RELATIONSHIPS
    // ============================================
    console.log('\n👥 Setting up friend relationships...');
    
    const [mainUser, ahmed, fatima, omar, maryam, youssef, aisha, ibrahim, khadija, ali] = createdUsers;
    
    // Main user's friends: ahmed, fatima, omar, maryam (4 friends)
    mainUser.social = {
      friends: [ahmed._id, fatima._id, omar._id, maryam._id],
      friendRequests: {
        sent: [],
        received: [youssef._id, aisha._id] // 2 pending requests
      },
      halaqat: [],
      following: [],
      followers: []
    };
    await mainUser.save();
    console.log(`   ✅ ${mainUser.displayName}: 4 friends, 2 pending requests`);
    
    // Update friends to include mainUser
    ahmed.social = {
      friends: [mainUser._id, fatima._id, ibrahim._id],
      friendRequests: { sent: [], received: [] },
      halaqat: [],
      following: [],
      followers: []
    };
    await ahmed.save();
    
    fatima.social = {
      friends: [mainUser._id, ahmed._id, maryam._id, aisha._id],
      friendRequests: { sent: [], received: [] },
      halaqat: [],
      following: [],
      followers: []
    };
    await fatima.save();
    
    omar.social = {
      friends: [mainUser._id, khadija._id],
      friendRequests: { sent: [], received: [] },
      halaqat: [],
      following: [],
      followers: []
    };
    await omar.save();
    
    maryam.social = {
      friends: [mainUser._id, fatima._id, ali._id],
      friendRequests: { sent: [], received: [] },
      halaqat: [],
      following: [],
      followers: []
    };
    await maryam.save();
    
    // Users who sent requests to mainUser
    youssef.social = {
      friends: [khadija._id],
      friendRequests: { 
        sent: [mainUser._id], // Sent to mainUser
        received: [] 
      },
      halaqat: [],
      following: [],
      followers: []
    };
    await youssef.save();
    
    aisha.social = {
      friends: [fatima._id, ibrahim._id],
      friendRequests: { 
        sent: [mainUser._id], // Sent to mainUser
        received: [] 
      },
      halaqat: [],
      following: [],
      followers: []
    };
    await aisha.save();
    
    // Other users
    ibrahim.social = {
      friends: [ahmed._id, aisha._id, ali._id],
      friendRequests: { sent: [], received: [] },
      halaqat: [],
      following: [],
      followers: []
    };
    await ibrahim.save();
    
    khadija.social = {
      friends: [omar._id, youssef._id],
      friendRequests: { sent: [], received: [] },
      halaqat: [],
      following: [],
      followers: []
    };
    await khadija.save();
    
    ali.social = {
      friends: [maryam._id, ibrahim._id],
      friendRequests: { sent: [], received: [] },
      halaqat: [],
      following: [],
      followers: []
    };
    await ali.save();
    
    console.log('   ✅ All friend relationships configured');

    // ============================================
    // CREATE STREAKS
    // ============================================
    console.log('\n🔥 Creating streak data...');
    await Streak.deleteMany({ user: { $in: createdUsers.map(u => u._id) } });
    
    for (const user of createdUsers) {
      const streak = new Streak({
        user: user._id,
        current: user.gamification.currentStreak,
        longest: user.gamification.longestStreak,
        lastActivityDate: new Date(),
        freezesAvailable: user.gamification.streakFreezes?.available || 2,
        history: generateStreakHistory(user.gamification.currentStreak)
      });
      await streak.save();
    }
    console.log(`   ✅ Created streaks for ${createdUsers.length} users`);

    // ============================================
    // SEED ACHIEVEMENTS, CHALLENGES, SHOP
    // ============================================
    console.log('\n🏆 Seeding achievements...');
    if (Achievement.seedDefaults) {
      await Achievement.seedDefaults();
    }
    
    console.log('🎯 Seeding challenges...');
    if (Challenge.seedDefaults) {
      await Challenge.seedDefaults();
    }
    
    console.log('🛒 Seeding shop items...');
    if (ShopItem.seedDefaults) {
      await ShopItem.seedDefaults();
    }

    // ============================================
    // CREATE NOTIFICATIONS
    // ============================================
    console.log('\n🔔 Creating notifications...');
    await Notification.deleteMany({ user: mainUser._id });
    
    const notifications = [
      {
        user: mainUser._id,
        type: 'friend_request',
        title: { ar: '👥 طلب صداقة جديد', en: '👥 New friend request' },
        body: { ar: 'يوسف الحفظ يريد إضافتك كصديق', en: 'Youssef wants to add you as friend' },
        icon: '👥',
        isRead: false,
        action: { screen: 'Friends' },
        data: { fromUserId: youssef._id }
      },
      {
        user: mainUser._id,
        type: 'friend_request',
        title: { ar: '👥 طلب صداقة جديد', en: '👥 New friend request' },
        body: { ar: 'عائشة القارئة تريد إضافتك كصديقة', en: 'Aisha wants to add you as friend' },
        icon: '👥',
        isRead: false,
        action: { screen: 'Friends' },
        data: { fromUserId: aisha._id }
      },
      {
        user: mainUser._id,
        type: 'streak_milestone',
        title: { ar: '🎉 مبروك! وصلت لسلسلة 7 أيام', en: '🎉 Congrats! 7-day streak' },
        body: { ar: 'استمر في التقدم!', en: 'Keep it up!' },
        icon: '🔥',
        isRead: false,
        action: { screen: 'Streak' }
      },
      {
        user: mainUser._id,
        type: 'achievement_unlocked',
        title: { ar: '🏅 إنجاز جديد: أسبوع متواصل', en: '🏅 New achievement: Week Warrior' },
        body: { ar: 'أكملت 7 أيام متتالية', en: 'Completed 7 consecutive days' },
        icon: '🏅',
        isRead: true,
        action: { screen: 'Achievements' }
      },
      {
        user: mainUser._id,
        type: 'daily_reminder',
        title: { ar: '📖 وقت الحفظ!', en: '📖 Time to memorize!' },
        body: { ar: 'لا تنسَ حصتك اليومية', en: "Don't forget your daily session" },
        icon: '📖',
        isRead: true,
        action: { screen: 'Home' }
      }
    ];
    
    await Notification.insertMany(notifications);
    console.log(`   ✅ Created ${notifications.length} notifications`);

    // ============================================
    // CREATE CONVERSATIONS
    // ============================================
    console.log('\n💬 Creating conversations...');
    
    await Conversation.deleteMany({ participants: { $in: createdUsers.map(u => u._id) } });
    await Message.deleteMany({ sender: { $in: createdUsers.map(u => u._id) } });

    // Conversation 1: mainUser <-> ahmed
    const conv1 = await Conversation.create({
      participants: [mainUser._id, ahmed._id],
      type: 'direct',
      createdBy: mainUser._id,
      lastMessageAt: new Date()
    });

    const conv1Messages = [
      { conversation: conv1._id, sender: ahmed._id, content: 'السلام عليكم ورحمة الله وبركاته', type: 'text', createdAt: new Date(Date.now() - 3600000 * 5) },
      { conversation: conv1._id, sender: mainUser._id, content: 'وعليكم السلام ورحمة الله وبركاته، كيف حالك؟', type: 'text', createdAt: new Date(Date.now() - 3600000 * 4) },
      { conversation: conv1._id, sender: ahmed._id, content: 'الحمد لله بخير، هل راجعت سورة الملك؟', type: 'text', createdAt: new Date(Date.now() - 3600000 * 3) },
      { conversation: conv1._id, sender: mainUser._id, content: 'نعم، حفظت 10 آيات جديدة اليوم الحمد لله 📖', type: 'text', createdAt: new Date(Date.now() - 3600000 * 2) },
      { conversation: conv1._id, sender: ahmed._id, content: 'ما شاء الله تبارك الله! بارك الله فيك 🤲', type: 'text', createdAt: new Date(Date.now() - 3600000) }
    ];

    await Message.insertMany(conv1Messages);
    conv1.lastMessage = (await Message.findOne({ conversation: conv1._id }).sort({ createdAt: -1 }))._id;
    conv1.lastMessageText = 'ما شاء الله تبارك الله! بارك الله فيك 🤲';
    await conv1.save();
    console.log('   ✅ Conversation with أحمد الحافظ');

    // Conversation 2: mainUser <-> fatima
    const conv2 = await Conversation.create({
      participants: [mainUser._id, fatima._id],
      type: 'direct',
      createdBy: fatima._id,
      lastMessageAt: new Date(Date.now() - 7200000)
    });

    const conv2Messages = [
      { conversation: conv2._id, sender: fatima._id, content: 'السلام عليكم، هل تحتاج مساعدة في التجويد؟', type: 'text', createdAt: new Date(Date.now() - 86400000 * 2) },
      { conversation: conv2._id, sender: mainUser._id, content: 'وعليكم السلام أستاذة، نعم أحتاج مساعدة في أحكام النون الساكنة', type: 'text', createdAt: new Date(Date.now() - 86400000) },
      { conversation: conv2._id, sender: fatima._id, content: 'النون الساكنة لها أربعة أحكام: الإظهار، الإدغام، الإقلاب، والإخفاء', type: 'text', createdAt: new Date(Date.now() - 7200000) }
    ];

    await Message.insertMany(conv2Messages);
    conv2.lastMessage = (await Message.findOne({ conversation: conv2._id }).sort({ createdAt: -1 }))._id;
    conv2.lastMessageText = 'النون الساكنة لها أربعة أحكام...';
    conv2.unreadCount = [{ user: mainUser._id, count: 1 }];
    await conv2.save();
    console.log('   ✅ Conversation with فاطمة الزهراء');

    // Conversation 3: Group chat
    const groupChat = await Conversation.create({
      participants: [mainUser._id, ahmed._id, fatima._id, omar._id],
      type: 'group',
      name: 'حلقة الفجر 🌅',
      description: 'حلقة يومية لمراجعة الحفظ',
      createdBy: fatima._id,
      admins: [fatima._id, ahmed._id],
      lastMessageAt: new Date(Date.now() - 3600000)
    });

    const groupMessages = [
      { conversation: groupChat._id, sender: fatima._id, content: 'أهلاً بالجميع في حلقة الفجر! 🌅', type: 'text', createdAt: new Date(Date.now() - 86400000 * 3) },
      { conversation: groupChat._id, sender: ahmed._id, content: 'إن شاء الله! جاهز للتحدي 💪', type: 'text', createdAt: new Date(Date.now() - 86400000 * 2) },
      { conversation: groupChat._id, sender: omar._id, content: 'أنا مبتدئ لكن سأبذل جهدي', type: 'text', createdAt: new Date(Date.now() - 86400000) },
      { conversation: groupChat._id, sender: mainUser._id, content: 'الحمد لله أنهيت سورة الناس والفلق', type: 'text', createdAt: new Date(Date.now() - 7200000) },
      { conversation: groupChat._id, sender: ahmed._id, content: 'ما شاء الله! بارك الله فيك 👏', type: 'text', createdAt: new Date(Date.now() - 3600000) }
    ];

    await Message.insertMany(groupMessages);
    groupChat.lastMessage = (await Message.findOne({ conversation: groupChat._id }).sort({ createdAt: -1 }))._id;
    groupChat.lastMessageText = 'ما شاء الله! بارك الله فيك 👏';
    groupChat.unreadCount = [{ user: mainUser._id, count: 2 }];
    await groupChat.save();
    console.log('   ✅ Group chat "حلقة الفجر"');

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    
    console.log('\n📊 Database Summary:');
    console.log(`   - Users: ${await User.countDocuments()}`);
    console.log(`   - Streaks: ${await Streak.countDocuments()}`);
    console.log(`   - Notifications: ${await Notification.countDocuments()}`);
    console.log(`   - Conversations: ${await Conversation.countDocuments()}`);
    console.log(`   - Messages: ${await Message.countDocuments()}`);
    
    console.log('\n📱 Test Accounts:');
    console.log('   ┌──────────────────────────────────────────────────────────────┐');
    console.log('   │ Email                    │ Password │ Role                   │');
    console.log('   ├──────────────────────────────────────────────────────────────┤');
    console.log('   │ test@salifz.com       │ test123  │ Main User (4 friends)  │');
    console.log('   │ ahmed@salifz.com      │ test123  │ Friend (Gold)          │');
    console.log('   │ fatima@salifz.com     │ test123  │ Friend (Diamond)       │');
    console.log('   │ omar@salifz.com       │ test123  │ Friend (Bronze)        │');
    console.log('   │ maryam@salifz.com     │ test123  │ Friend (Diamond)       │');
    console.log('   │ youssef@salifz.com    │ test123  │ Pending Request        │');
    console.log('   │ aisha@salifz.com      │ test123  │ Pending Request        │');
    console.log('   │ ibrahim@salifz.com    │ test123  │ Searchable (Hafiz)     │');
    console.log('   │ khadija@salifz.com    │ test123  │ Searchable (Bronze)    │');
    console.log('   │ ali@salifz.com        │ test123  │ Searchable (Gold)      │');
    console.log('   └──────────────────────────────────────────────────────────────┘');
    
    console.log('\n👥 Friend Relationships for testuser:');
    console.log('   - Friends (4): أحمد, فاطمة, عمر, مريم');
    console.log('   - Pending Requests (2): يوسف, عائشة');
    console.log('   - Searchable (3): إبراهيم, خديجة, علي');
    
    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Seed error:', error);
    process.exit(1);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function generateStreakHistory(days) {
  const history = [];
  const today = new Date();
  
  for (let i = Math.min(days, 30) - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    history.push({
      date,
      completed: true,
      froze: false,
      xpEarned: Math.floor(Math.random() * 100) + 50,
      versesMemorized: Math.floor(Math.random() * 5) + 3,
      versesReviewed: Math.floor(Math.random() * 10) + 5
    });
  }
  
  return history;
}

// Run seed
seed();