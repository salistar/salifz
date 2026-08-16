/**
 * Halaqa Seed Script - Salifz
 * Creates test halaqat with activities
 * Run with: node scripts/seed-halaqa.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Halaqa = require('../models/Halaqa');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/salifz';

async function seedHalaqat() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get test users
    const testUser = await User.findOne({ email: 'test@salifz.com' });
    const ahmed = await User.findOne({ email: 'ahmed@salifz.com' });
    const fatima = await User.findOne({ email: 'fatima@salifz.com' });
    const omar = await User.findOne({ email: 'omar@salifz.com' });
    const maryam = await User.findOne({ email: 'maryam@salifz.com' });

    if (!testUser) {
      console.error('❌ Test users not found. Run seed.js first!');
      process.exit(1);
    }

    console.log(`👥 Found ${[testUser, ahmed, fatima, omar, maryam].filter(Boolean).length} test users`);

    // Delete existing halaqat
    await Halaqa.deleteMany({});
    console.log('🗑️ Cleared existing halaqat');

    // HALAQA 1: testUser is Admin - Private
    const halaqa1 = await Halaqa.create({
      name: 'حلقة الفجر',
      description: 'حلقة يومية لمراجعة الحفظ بعد صلاة الفجر',
      creator: testUser._id,
      admins: [testUser._id],
      members: [
        { user: testUser._id, role: 'creator', joinedAt: new Date(Date.now() - 86400000 * 30), stats: { weeklyXP: 450, totalXP: 2500, versesMemorized: 87, activitiesCompleted: 15 } },
        ahmed && { user: ahmed._id, role: 'member', joinedAt: new Date(Date.now() - 86400000 * 20), stats: { weeklyXP: 800, totalXP: 5000, versesMemorized: 500, activitiesCompleted: 25 } },
        fatima && { user: fatima._id, role: 'admin', joinedAt: new Date(Date.now() - 86400000 * 25), stats: { weeklyXP: 600, totalXP: 8000, versesMemorized: 1000, activitiesCompleted: 40 } },
      ].filter(Boolean),
      settings: {
        isPublic: false,
        allowChat: true,
        allowVoice: true,
        dailyGoal: 5,
        activityTypes: ['memorize', 'review', 'tajweed', 'recitation', 'quiz', 'discussion'],
      },
      inviteCode: 'FAJR01',
      maxMembers: 20,
      stats: { totalVersesMemorized: 1587, weeklyXP: 1850, totalXP: 15500, activitiesCount: 5 },
      activities: [
        { type: 'memorize', title: 'حفظ سورة الملك', description: 'حفظ أول 10 آيات', createdBy: testUser._id, xpReward: 50, status: 'active', completedBy: ahmed ? [ahmed._id] : [], createdAt: new Date(Date.now() - 86400000 * 2) },
        { type: 'review', title: 'مراجعة جزء عم', description: 'مراجعة سور جزء عم', createdBy: testUser._id, xpReward: 30, status: 'active', completedBy: [], createdAt: new Date(Date.now() - 86400000) },
        { type: 'tajweed', title: 'درس أحكام النون الساكنة', description: 'الإظهار والإدغام والإقلاب والإخفاء', createdBy: fatima?._id || testUser._id, xpReward: 40, status: 'completed', completedBy: [testUser._id, ahmed?._id].filter(Boolean), createdAt: new Date(Date.now() - 86400000 * 5) },
        { type: 'quiz', title: 'اختبار سورة الفاتحة', description: 'اختبار حفظ مع التجويد', createdBy: testUser._id, xpReward: 60, status: 'active', completedBy: [], createdAt: new Date(Date.now() - 3600000 * 5) },
        { type: 'recitation', title: 'تلاوة جماعية', description: 'تلاوة سورة يس', createdBy: testUser._id, xpReward: 25, status: 'active', completedBy: fatima ? [fatima._id] : [], createdAt: new Date(Date.now() - 3600000 * 2) },
      ],
    });
    console.log('   ✅ حلقة الفجر (Private, Code: FAJR01)');

    // HALAQA 2: fatima is Admin - Public
    const halaqa2 = await Halaqa.create({
      name: 'حلقة التجويد المتقدم',
      description: 'حلقة متخصصة في التجويد والقراءات',
      creator: fatima?._id || testUser._id,
      admins: [fatima?._id || testUser._id],
      members: [
        { user: fatima?._id || testUser._id, role: 'creator', joinedAt: new Date(Date.now() - 86400000 * 60), stats: { weeklyXP: 600, totalXP: 8000, versesMemorized: 1000, activitiesCompleted: 50 } },
        maryam && { user: maryam._id, role: 'admin', joinedAt: new Date(Date.now() - 86400000 * 45), stats: { weeklyXP: 1000, totalXP: 12000, versesMemorized: 2000, activitiesCompleted: 70 } },
        { user: testUser._id, role: 'member', joinedAt: new Date(Date.now() - 86400000 * 10), stats: { weeklyXP: 450, totalXP: 2500, versesMemorized: 87, activitiesCompleted: 8 } },
      ].filter(Boolean),
      settings: {
        isPublic: true,
        allowChat: true,
        allowVoice: true,
        dailyGoal: 10,
        activityTypes: ['tajweed', 'recitation', 'lesson', 'quiz', 'workshop', 'competition'],
      },
      inviteCode: 'TAJWD1',
      maxMembers: 50,
      stats: { totalVersesMemorized: 3087, weeklyXP: 2050, totalXP: 22500, activitiesCount: 4 },
      activities: [
        { type: 'tajweed', title: 'أحكام المد', description: 'المد الطبيعي والفرعي', createdBy: fatima?._id || testUser._id, xpReward: 40, status: 'active', completedBy: maryam ? [maryam._id] : [], createdAt: new Date(Date.now() - 86400000 * 3) },
        { type: 'workshop', title: 'ورشة التلاوة الصحيحة', description: 'تدريب على التلاوة', createdBy: maryam?._id || testUser._id, xpReward: 55, status: 'active', completedBy: [], createdAt: new Date(Date.now() - 86400000 * 2) },
        { type: 'lesson', title: 'مخارج الحروف', description: 'درس مخارج الحروف', createdBy: fatima?._id || testUser._id, xpReward: 45, status: 'completed', completedBy: [testUser._id, maryam?._id].filter(Boolean), createdAt: new Date(Date.now() - 86400000 * 7) },
        { type: 'competition', title: 'مسابقة الأسبوع', description: 'مسابقة حفظ سورة الكهف', createdBy: fatima?._id || testUser._id, xpReward: 100, status: 'active', completedBy: [], createdAt: new Date(Date.now() - 86400000) },
      ],
    });
    console.log('   ✅ حلقة التجويد المتقدم (Public, Code: TAJWD1)');

    // HALAQA 3: ahmed is Admin - Public
    const halaqa3 = await Halaqa.create({
      name: 'حلقة الحفاظ الصغار',
      description: 'حلقة للأطفال والمبتدئين',
      creator: ahmed?._id || testUser._id,
      admins: [ahmed?._id || testUser._id],
      members: [
        { user: ahmed?._id || testUser._id, role: 'creator', joinedAt: new Date(Date.now() - 86400000 * 90), stats: { weeklyXP: 800, totalXP: 5000, versesMemorized: 500, activitiesCompleted: 30 } },
        omar && { user: omar._id, role: 'member', joinedAt: new Date(Date.now() - 86400000 * 15), stats: { weeklyXP: 200, totalXP: 1000, versesMemorized: 50, activitiesCompleted: 5 } },
      ].filter(Boolean),
      settings: {
        isPublic: true,
        allowChat: true,
        allowVoice: false,
        dailyGoal: 3,
        activityTypes: ['memorize', 'review', 'recitation', 'quiz', 'achievement'],
      },
      inviteCode: 'KIDS01',
      maxMembers: 30,
      stats: { totalVersesMemorized: 550, weeklyXP: 1000, totalXP: 6000, activitiesCount: 3 },
      activities: [
        { type: 'memorize', title: 'حفظ سورة الإخلاص', description: 'حفظ السورة كاملة', createdBy: ahmed?._id || testUser._id, xpReward: 50, status: 'completed', completedBy: omar ? [omar._id] : [], createdAt: new Date(Date.now() - 86400000 * 10) },
        { type: 'achievement', title: 'إنجاز حفظ 5 سور', description: 'مكافأة حفظ 5 سور', createdBy: ahmed?._id || testUser._id, xpReward: 70, status: 'active', completedBy: [], createdAt: new Date(Date.now() - 86400000 * 5) },
        { type: 'quiz', title: 'اختبار الناس والفلق', description: 'اختبار قصير', createdBy: ahmed?._id || testUser._id, xpReward: 60, status: 'active', completedBy: [], createdAt: new Date(Date.now() - 86400000) },
      ],
    });
    console.log('   ✅ حلقة الحفاظ الصغار (Public, Code: KIDS01)');

    // HALAQA 4: maryam is Admin - Public (for testing join)
    const halaqa4 = await Halaqa.create({
      name: 'حلقة القرآن الكريم',
      description: 'حلقة عامة مفتوحة للجميع',
      creator: maryam?._id || testUser._id,
      admins: [maryam?._id || testUser._id],
      members: [
        { user: maryam?._id || testUser._id, role: 'creator', joinedAt: new Date(), stats: { weeklyXP: 1000, totalXP: 12000, versesMemorized: 2000, activitiesCompleted: 80 } },
      ],
      settings: {
        isPublic: true,
        allowChat: true,
        allowVoice: true,
        dailyGoal: 7,
        activityTypes: ['memorize', 'review', 'tajweed', 'tafseer', 'recitation', 'lesson', 'quiz', 'discussion', 'challenge'],
      },
      inviteCode: 'QURAN1',
      maxMembers: 100,
      stats: { totalVersesMemorized: 2000, weeklyXP: 1000, totalXP: 12000, activitiesCount: 3 },
      activities: [
        { type: 'memorize', title: 'حفظ سورة البقرة', description: 'أول 20 آية', createdBy: maryam?._id || testUser._id, xpReward: 50, status: 'active', completedBy: [], createdAt: new Date(Date.now() - 86400000) },
        { type: 'tafseer', title: 'تفسير آية الكرسي', description: 'دراسة المعاني', createdBy: maryam?._id || testUser._id, xpReward: 35, status: 'active', completedBy: [], createdAt: new Date(Date.now() - 3600000 * 12) },
        { type: 'challenge', title: 'تحدي حفظ 50 آية', description: 'تحدي أسبوعي', createdBy: maryam?._id || testUser._id, xpReward: 80, status: 'active', completedBy: [], createdAt: new Date(Date.now() - 3600000 * 6) },
      ],
    });
    console.log('   ✅ حلقة القرآن الكريم (Public, Code: QURAN1)');

    // HALAQA 5: fatima is Admin - Private
    const halaqa5 = await Halaqa.create({
      name: 'حلقة النخبة',
      description: 'حلقة خاصة للحفاظ المتميزين',
      creator: fatima?._id || testUser._id,
      admins: [fatima?._id || testUser._id, maryam?._id].filter(Boolean),
      members: [
        { user: fatima?._id || testUser._id, role: 'creator', joinedAt: new Date(Date.now() - 86400000 * 120), stats: { weeklyXP: 600, totalXP: 8000, versesMemorized: 1000, activitiesCompleted: 60 } },
        maryam && { user: maryam._id, role: 'admin', joinedAt: new Date(Date.now() - 86400000 * 100), stats: { weeklyXP: 1000, totalXP: 12000, versesMemorized: 2000, activitiesCompleted: 90 } },
      ].filter(Boolean),
      settings: {
        isPublic: false,
        allowChat: true,
        allowVoice: true,
        dailyGoal: 15,
        activityTypes: ['memorize', 'review', 'tajweed', 'tafseer', 'recitation', 'competition', 'lesson', 'quiz', 'discussion', 'challenge', 'workshop', 'achievement'],
      },
      inviteCode: 'ELITE1',
      maxMembers: 10,
      stats: { totalVersesMemorized: 3000, weeklyXP: 1600, totalXP: 20000, activitiesCount: 4 },
      activities: [
        { type: 'competition', title: 'مسابقة جزء تبارك', description: 'حفظ كامل مع التجويد', createdBy: fatima?._id || testUser._id, xpReward: 100, status: 'active', completedBy: [], createdAt: new Date(Date.now() - 86400000 * 3) },
        { type: 'workshop', title: 'ورشة القراءات السبع', description: 'تعريف بالقراءات', createdBy: maryam?._id || testUser._id, xpReward: 55, status: 'active', completedBy: [], createdAt: new Date(Date.now() - 86400000 * 2) },
        { type: 'challenge', title: 'تحدي المراجعة الشهري', description: 'مراجعة 5 أجزاء', createdBy: fatima?._id || testUser._id, xpReward: 80, status: 'active', completedBy: maryam ? [maryam._id] : [], createdAt: new Date(Date.now() - 86400000 * 15) },
        { type: 'achievement', title: 'إنجاز ختم القرآن', description: 'مكافأة ختم القرآن', createdBy: fatima?._id || testUser._id, xpReward: 70, status: 'active', completedBy: [], createdAt: new Date(Date.now() - 86400000 * 30) },
      ],
    });
    console.log('   ✅ حلقة النخبة (Private, Code: ELITE1)');

    // SUMMARY
    console.log('\n🎉 Halaqa seed completed!\n');
    console.log('📊 Summary:');
    console.log(`   - Total Halaqat: ${await Halaqa.countDocuments()}`);
    console.log('   - Public: 3 (TAJWD1, KIDS01, QURAN1)');
    console.log('   - Private: 2 (FAJR01, ELITE1)');
    console.log('   - Total Activities: 19');
    
    console.log('\n🔗 Test Codes:');
    console.log('   FAJR01 - حلقة الفجر (Private)');
    console.log('   TAJWD1 - حلقة التجويد (Public)');
    console.log('   KIDS01 - حلقة الحفاظ الصغار (Public)');
    console.log('   QURAN1 - حلقة القرآن الكريم (Public)');
    console.log('   ELITE1 - حلقة النخبة (Private)');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seedHalaqat();