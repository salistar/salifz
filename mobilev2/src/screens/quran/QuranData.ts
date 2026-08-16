/**
 * ============================================
 * 📖 QuranData.ts - Salifz
 * ============================================
 * ✅ COMPLETE: All 114 Surahs with Hizb/Juz mapping
 * ✅ Revision system: 5 ayat → 25 → 75 → 150 → 2 surah → 4 surah → 1/8 hizb → 1/4 hizb → 1/2 hizb → 1 hizb → 1 juz → 3 juz → 15 juz → 30 juz
 * ✅ CONVERTED: i18n integration
 */

// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';

const LOG_PREFIX = '[QuranData.ts]';

console.log(`${LOG_PREFIX} 📁 File loaded`);

// ✅ Complete 114 Surahs Data (Les noms restent en arabe - noms propres coraniques)
export const SURAHS_COMPLETE: Surah[] = [
  { id: 1, name: 'الفاتحة', nameEn: 'Al-Fatiha', ayahs: 7, type: 'meccan', juz: 1, hizb: 1, page: 1 },
  { id: 2, name: 'البقرة', nameEn: 'Al-Baqarah', ayahs: 286, type: 'medinan', juz: 1, hizb: 1, page: 2 },
  { id: 3, name: 'آل عمران', nameEn: 'Aal-Imran', ayahs: 200, type: 'medinan', juz: 3, hizb: 6, page: 50 },
  { id: 4, name: 'النساء', nameEn: 'An-Nisa', ayahs: 176, type: 'medinan', juz: 4, hizb: 8, page: 77 },
  { id: 5, name: 'المائدة', nameEn: 'Al-Ma\'idah', ayahs: 120, type: 'medinan', juz: 6, hizb: 11, page: 106 },
  { id: 6, name: 'الأنعام', nameEn: 'Al-An\'am', ayahs: 165, type: 'meccan', juz: 7, hizb: 13, page: 128 },
  { id: 7, name: 'الأعراف', nameEn: 'Al-A\'raf', ayahs: 206, type: 'meccan', juz: 8, hizb: 15, page: 151 },
  { id: 8, name: 'الأنفال', nameEn: 'Al-Anfal', ayahs: 75, type: 'medinan', juz: 9, hizb: 18, page: 177 },
  { id: 9, name: 'التوبة', nameEn: 'At-Tawbah', ayahs: 129, type: 'medinan', juz: 10, hizb: 19, page: 187 },
  { id: 10, name: 'يونس', nameEn: 'Yunus', ayahs: 109, type: 'meccan', juz: 11, hizb: 21, page: 208 },
  { id: 11, name: 'هود', nameEn: 'Hud', ayahs: 123, type: 'meccan', juz: 11, hizb: 22, page: 221 },
  { id: 12, name: 'يوسف', nameEn: 'Yusuf', ayahs: 111, type: 'meccan', juz: 12, hizb: 24, page: 235 },
  { id: 13, name: 'الرعد', nameEn: 'Ar-Ra\'d', ayahs: 43, type: 'medinan', juz: 13, hizb: 25, page: 249 },
  { id: 14, name: 'إبراهيم', nameEn: 'Ibrahim', ayahs: 52, type: 'meccan', juz: 13, hizb: 26, page: 255 },
  { id: 15, name: 'الحجر', nameEn: 'Al-Hijr', ayahs: 99, type: 'meccan', juz: 14, hizb: 27, page: 262 },
  { id: 16, name: 'النحل', nameEn: 'An-Nahl', ayahs: 128, type: 'meccan', juz: 14, hizb: 27, page: 267 },
  { id: 17, name: 'الإسراء', nameEn: 'Al-Isra', ayahs: 111, type: 'meccan', juz: 15, hizb: 29, page: 282 },
  { id: 18, name: 'الكهف', nameEn: 'Al-Kahf', ayahs: 110, type: 'meccan', juz: 15, hizb: 30, page: 293 },
  { id: 19, name: 'مريم', nameEn: 'Maryam', ayahs: 98, type: 'meccan', juz: 16, hizb: 31, page: 305 },
  { id: 20, name: 'طه', nameEn: 'Ta-Ha', ayahs: 135, type: 'meccan', juz: 16, hizb: 31, page: 312 },
  { id: 21, name: 'الأنبياء', nameEn: 'Al-Anbiya', ayahs: 112, type: 'meccan', juz: 17, hizb: 33, page: 322 },
  { id: 22, name: 'الحج', nameEn: 'Al-Hajj', ayahs: 78, type: 'medinan', juz: 17, hizb: 34, page: 332 },
  { id: 23, name: 'المؤمنون', nameEn: 'Al-Mu\'minun', ayahs: 118, type: 'meccan', juz: 18, hizb: 35, page: 342 },
  { id: 24, name: 'النور', nameEn: 'An-Nur', ayahs: 64, type: 'medinan', juz: 18, hizb: 35, page: 350 },
  { id: 25, name: 'الفرقان', nameEn: 'Al-Furqan', ayahs: 77, type: 'meccan', juz: 18, hizb: 36, page: 359 },
  { id: 26, name: 'الشعراء', nameEn: 'Ash-Shu\'ara', ayahs: 227, type: 'meccan', juz: 19, hizb: 37, page: 367 },
  { id: 27, name: 'النمل', nameEn: 'An-Naml', ayahs: 93, type: 'meccan', juz: 19, hizb: 38, page: 377 },
  { id: 28, name: 'القصص', nameEn: 'Al-Qasas', ayahs: 88, type: 'meccan', juz: 20, hizb: 39, page: 385 },
  { id: 29, name: 'العنكبوت', nameEn: 'Al-Ankabut', ayahs: 69, type: 'meccan', juz: 20, hizb: 40, page: 396 },
  { id: 30, name: 'الروم', nameEn: 'Ar-Rum', ayahs: 60, type: 'meccan', juz: 21, hizb: 41, page: 404 },
  { id: 31, name: 'لقمان', nameEn: 'Luqman', ayahs: 34, type: 'meccan', juz: 21, hizb: 41, page: 411 },
  { id: 32, name: 'السجدة', nameEn: 'As-Sajdah', ayahs: 30, type: 'meccan', juz: 21, hizb: 42, page: 415 },
  { id: 33, name: 'الأحزاب', nameEn: 'Al-Ahzab', ayahs: 73, type: 'medinan', juz: 21, hizb: 42, page: 418 },
  { id: 34, name: 'سبأ', nameEn: 'Saba', ayahs: 54, type: 'meccan', juz: 22, hizb: 43, page: 428 },
  { id: 35, name: 'فاطر', nameEn: 'Fatir', ayahs: 45, type: 'meccan', juz: 22, hizb: 44, page: 434 },
  { id: 36, name: 'يس', nameEn: 'Ya-Sin', ayahs: 83, type: 'meccan', juz: 22, hizb: 44, page: 440 },
  { id: 37, name: 'الصافات', nameEn: 'As-Saffat', ayahs: 182, type: 'meccan', juz: 23, hizb: 45, page: 446 },
  { id: 38, name: 'ص', nameEn: 'Sad', ayahs: 88, type: 'meccan', juz: 23, hizb: 46, page: 453 },
  { id: 39, name: 'الزمر', nameEn: 'Az-Zumar', ayahs: 75, type: 'meccan', juz: 23, hizb: 46, page: 458 },
  { id: 40, name: 'غافر', nameEn: 'Ghafir', ayahs: 85, type: 'meccan', juz: 24, hizb: 47, page: 467 },
  { id: 41, name: 'فصلت', nameEn: 'Fussilat', ayahs: 54, type: 'meccan', juz: 24, hizb: 48, page: 477 },
  { id: 42, name: 'الشورى', nameEn: 'Ash-Shura', ayahs: 53, type: 'meccan', juz: 25, hizb: 49, page: 483 },
  { id: 43, name: 'الزخرف', nameEn: 'Az-Zukhruf', ayahs: 89, type: 'meccan', juz: 25, hizb: 49, page: 489 },
  { id: 44, name: 'الدخان', nameEn: 'Ad-Dukhan', ayahs: 59, type: 'meccan', juz: 25, hizb: 50, page: 496 },
  { id: 45, name: 'الجاثية', nameEn: 'Al-Jathiyah', ayahs: 37, type: 'meccan', juz: 25, hizb: 50, page: 499 },
  { id: 46, name: 'الأحقاف', nameEn: 'Al-Ahqaf', ayahs: 35, type: 'meccan', juz: 26, hizb: 51, page: 502 },
  { id: 47, name: 'محمد', nameEn: 'Muhammad', ayahs: 38, type: 'medinan', juz: 26, hizb: 51, page: 507 },
  { id: 48, name: 'الفتح', nameEn: 'Al-Fath', ayahs: 29, type: 'medinan', juz: 26, hizb: 52, page: 511 },
  { id: 49, name: 'الحجرات', nameEn: 'Al-Hujurat', ayahs: 18, type: 'medinan', juz: 26, hizb: 52, page: 515 },
  { id: 50, name: 'ق', nameEn: 'Qaf', ayahs: 45, type: 'meccan', juz: 26, hizb: 52, page: 518 },
  { id: 51, name: 'الذاريات', nameEn: 'Adh-Dhariyat', ayahs: 60, type: 'meccan', juz: 26, hizb: 52, page: 520 },
  { id: 52, name: 'الطور', nameEn: 'At-Tur', ayahs: 49, type: 'meccan', juz: 27, hizb: 53, page: 523 },
  { id: 53, name: 'النجم', nameEn: 'An-Najm', ayahs: 62, type: 'meccan', juz: 27, hizb: 53, page: 526 },
  { id: 54, name: 'القمر', nameEn: 'Al-Qamar', ayahs: 55, type: 'meccan', juz: 27, hizb: 54, page: 528 },
  { id: 55, name: 'الرحمن', nameEn: 'Ar-Rahman', ayahs: 78, type: 'medinan', juz: 27, hizb: 54, page: 531 },
  { id: 56, name: 'الواقعة', nameEn: 'Al-Waqi\'ah', ayahs: 96, type: 'meccan', juz: 27, hizb: 54, page: 534 },
  { id: 57, name: 'الحديد', nameEn: 'Al-Hadid', ayahs: 29, type: 'medinan', juz: 27, hizb: 54, page: 537 },
  { id: 58, name: 'المجادلة', nameEn: 'Al-Mujadilah', ayahs: 22, type: 'medinan', juz: 28, hizb: 55, page: 542 },
  { id: 59, name: 'الحشر', nameEn: 'Al-Hashr', ayahs: 24, type: 'medinan', juz: 28, hizb: 55, page: 545 },
  { id: 60, name: 'الممتحنة', nameEn: 'Al-Mumtahanah', ayahs: 13, type: 'medinan', juz: 28, hizb: 56, page: 549 },
  { id: 61, name: 'الصف', nameEn: 'As-Saff', ayahs: 14, type: 'medinan', juz: 28, hizb: 56, page: 551 },
  { id: 62, name: 'الجمعة', nameEn: 'Al-Jumu\'ah', ayahs: 11, type: 'medinan', juz: 28, hizb: 56, page: 553 },
  { id: 63, name: 'المنافقون', nameEn: 'Al-Munafiqun', ayahs: 11, type: 'medinan', juz: 28, hizb: 56, page: 554 },
  { id: 64, name: 'التغابن', nameEn: 'At-Taghabun', ayahs: 18, type: 'medinan', juz: 28, hizb: 56, page: 556 },
  { id: 65, name: 'الطلاق', nameEn: 'At-Talaq', ayahs: 12, type: 'medinan', juz: 28, hizb: 56, page: 558 },
  { id: 66, name: 'التحريم', nameEn: 'At-Tahrim', ayahs: 12, type: 'medinan', juz: 28, hizb: 57, page: 560 },
  { id: 67, name: 'الملك', nameEn: 'Al-Mulk', ayahs: 30, type: 'meccan', juz: 29, hizb: 57, page: 562 },
  { id: 68, name: 'القلم', nameEn: 'Al-Qalam', ayahs: 52, type: 'meccan', juz: 29, hizb: 57, page: 564 },
  { id: 69, name: 'الحاقة', nameEn: 'Al-Haqqah', ayahs: 52, type: 'meccan', juz: 29, hizb: 57, page: 566 },
  { id: 70, name: 'المعارج', nameEn: 'Al-Ma\'arij', ayahs: 44, type: 'meccan', juz: 29, hizb: 58, page: 568 },
  { id: 71, name: 'نوح', nameEn: 'Nuh', ayahs: 28, type: 'meccan', juz: 29, hizb: 58, page: 570 },
  { id: 72, name: 'الجن', nameEn: 'Al-Jinn', ayahs: 28, type: 'meccan', juz: 29, hizb: 58, page: 572 },
  { id: 73, name: 'المزمل', nameEn: 'Al-Muzzammil', ayahs: 20, type: 'meccan', juz: 29, hizb: 58, page: 574 },
  { id: 74, name: 'المدثر', nameEn: 'Al-Muddaththir', ayahs: 56, type: 'meccan', juz: 29, hizb: 58, page: 575 },
  { id: 75, name: 'القيامة', nameEn: 'Al-Qiyamah', ayahs: 40, type: 'meccan', juz: 29, hizb: 58, page: 577 },
  { id: 76, name: 'الإنسان', nameEn: 'Al-Insan', ayahs: 31, type: 'medinan', juz: 29, hizb: 58, page: 578 },
  { id: 77, name: 'المرسلات', nameEn: 'Al-Mursalat', ayahs: 50, type: 'meccan', juz: 29, hizb: 58, page: 580 },
  { id: 78, name: 'النبأ', nameEn: 'An-Naba', ayahs: 40, type: 'meccan', juz: 30, hizb: 59, page: 582 },
  { id: 79, name: 'النازعات', nameEn: 'An-Nazi\'at', ayahs: 46, type: 'meccan', juz: 30, hizb: 59, page: 583 },
  { id: 80, name: 'عبس', nameEn: 'Abasa', ayahs: 42, type: 'meccan', juz: 30, hizb: 59, page: 585 },
  { id: 81, name: 'التكوير', nameEn: 'At-Takwir', ayahs: 29, type: 'meccan', juz: 30, hizb: 59, page: 586 },
  { id: 82, name: 'الانفطار', nameEn: 'Al-Infitar', ayahs: 19, type: 'meccan', juz: 30, hizb: 59, page: 587 },
  { id: 83, name: 'المطففين', nameEn: 'Al-Mutaffifin', ayahs: 36, type: 'meccan', juz: 30, hizb: 59, page: 587 },
  { id: 84, name: 'الانشقاق', nameEn: 'Al-Inshiqaq', ayahs: 25, type: 'meccan', juz: 30, hizb: 59, page: 589 },
  { id: 85, name: 'البروج', nameEn: 'Al-Buruj', ayahs: 22, type: 'meccan', juz: 30, hizb: 59, page: 590 },
  { id: 86, name: 'الطارق', nameEn: 'At-Tariq', ayahs: 17, type: 'meccan', juz: 30, hizb: 59, page: 591 },
  { id: 87, name: 'الأعلى', nameEn: 'Al-A\'la', ayahs: 19, type: 'meccan', juz: 30, hizb: 59, page: 591 },
  { id: 88, name: 'الغاشية', nameEn: 'Al-Ghashiyah', ayahs: 26, type: 'meccan', juz: 30, hizb: 59, page: 592 },
  { id: 89, name: 'الفجر', nameEn: 'Al-Fajr', ayahs: 30, type: 'meccan', juz: 30, hizb: 59, page: 593 },
  { id: 90, name: 'البلد', nameEn: 'Al-Balad', ayahs: 20, type: 'meccan', juz: 30, hizb: 59, page: 594 },
  { id: 91, name: 'الشمس', nameEn: 'Ash-Shams', ayahs: 15, type: 'meccan', juz: 30, hizb: 59, page: 595 },
  { id: 92, name: 'الليل', nameEn: 'Al-Layl', ayahs: 21, type: 'meccan', juz: 30, hizb: 59, page: 595 },
  { id: 93, name: 'الضحى', nameEn: 'Ad-Duha', ayahs: 11, type: 'meccan', juz: 30, hizb: 59, page: 596 },
  { id: 94, name: 'الشرح', nameEn: 'Ash-Sharh', ayahs: 8, type: 'meccan', juz: 30, hizb: 59, page: 596 },
  { id: 95, name: 'التين', nameEn: 'At-Tin', ayahs: 8, type: 'meccan', juz: 30, hizb: 59, page: 597 },
  { id: 96, name: 'العلق', nameEn: 'Al-Alaq', ayahs: 19, type: 'meccan', juz: 30, hizb: 59, page: 597 },
  { id: 97, name: 'القدر', nameEn: 'Al-Qadr', ayahs: 5, type: 'meccan', juz: 30, hizb: 59, page: 598 },
  { id: 98, name: 'البينة', nameEn: 'Al-Bayyinah', ayahs: 8, type: 'medinan', juz: 30, hizb: 60, page: 598 },
  { id: 99, name: 'الزلزلة', nameEn: 'Az-Zalzalah', ayahs: 8, type: 'medinan', juz: 30, hizb: 60, page: 599 },
  { id: 100, name: 'العاديات', nameEn: 'Al-Adiyat', ayahs: 11, type: 'meccan', juz: 30, hizb: 60, page: 599 },
  { id: 101, name: 'القارعة', nameEn: 'Al-Qari\'ah', ayahs: 11, type: 'meccan', juz: 30, hizb: 60, page: 600 },
  { id: 102, name: 'التكاثر', nameEn: 'At-Takathur', ayahs: 8, type: 'meccan', juz: 30, hizb: 60, page: 600 },
  { id: 103, name: 'العصر', nameEn: 'Al-Asr', ayahs: 3, type: 'meccan', juz: 30, hizb: 60, page: 601 },
  { id: 104, name: 'الهمزة', nameEn: 'Al-Humazah', ayahs: 9, type: 'meccan', juz: 30, hizb: 60, page: 601 },
  { id: 105, name: 'الفيل', nameEn: 'Al-Fil', ayahs: 5, type: 'meccan', juz: 30, hizb: 60, page: 601 },
  { id: 106, name: 'قريش', nameEn: 'Quraysh', ayahs: 4, type: 'meccan', juz: 30, hizb: 60, page: 602 },
  { id: 107, name: 'الماعون', nameEn: 'Al-Ma\'un', ayahs: 7, type: 'meccan', juz: 30, hizb: 60, page: 602 },
  { id: 108, name: 'الكوثر', nameEn: 'Al-Kawthar', ayahs: 3, type: 'meccan', juz: 30, hizb: 60, page: 602 },
  { id: 109, name: 'الكافرون', nameEn: 'Al-Kafirun', ayahs: 6, type: 'meccan', juz: 30, hizb: 60, page: 603 },
  { id: 110, name: 'النصر', nameEn: 'An-Nasr', ayahs: 3, type: 'medinan', juz: 30, hizb: 60, page: 603 },
  { id: 111, name: 'المسد', nameEn: 'Al-Masad', ayahs: 5, type: 'meccan', juz: 30, hizb: 60, page: 603 },
  { id: 112, name: 'الإخلاص', nameEn: 'Al-Ikhlas', ayahs: 4, type: 'meccan', juz: 30, hizb: 60, page: 604 },
  { id: 113, name: 'الفلق', nameEn: 'Al-Falaq', ayahs: 5, type: 'meccan', juz: 30, hizb: 60, page: 604 },
  { id: 114, name: 'الناس', nameEn: 'An-Nas', ayahs: 6, type: 'meccan', juz: 30, hizb: 60, page: 604 },
];

console.log(`${LOG_PREFIX} 📚 ${SURAHS_COMPLETE.length} Surahs loaded`);

// ✅ Types
export interface Surah {
  id: number;
  name: string;
  nameEn: string;
  ayahs: number;
  type: 'meccan' | 'medinan';
  juz: number;
  hizb: number;
  page: number;
}

export interface LessonBlock {
  id: string;
  surahId: number;
  startAyah: number;
  endAyah: number;
  ayahCount: number;
}

export interface RevisionMilestone {
  id: string;
  type: 'ayat' | 'surah' | 'hizb' | 'juz';
  threshold: number;
  nameKey: string;        // ✅ i18n key
  descriptionKey: string; // ✅ i18n key
}

export interface ExerciseType {
  id: string;
  nameKey: string; // ✅ i18n key
  icon: string;
  xp: number;
}

// ✅ Revision Milestones Configuration (avec clés i18n)
export const REVISION_MILESTONES: RevisionMilestone[] = [
  { id: 'ayat_5', type: 'ayat', threshold: 5, nameKey: 'quranData.milestones.ayat5', descriptionKey: 'quranData.milestones.ayat5Desc' },
  { id: 'ayat_25', type: 'ayat', threshold: 25, nameKey: 'quranData.milestones.ayat25', descriptionKey: 'quranData.milestones.ayat25Desc' },
  { id: 'ayat_75', type: 'ayat', threshold: 75, nameKey: 'quranData.milestones.ayat75', descriptionKey: 'quranData.milestones.ayat75Desc' },
  { id: 'ayat_150', type: 'ayat', threshold: 150, nameKey: 'quranData.milestones.ayat150', descriptionKey: 'quranData.milestones.ayat150Desc' },
  { id: 'surah_2', type: 'surah', threshold: 2, nameKey: 'quranData.milestones.surah2', descriptionKey: 'quranData.milestones.surah2Desc' },
  { id: 'surah_4', type: 'surah', threshold: 4, nameKey: 'quranData.milestones.surah4', descriptionKey: 'quranData.milestones.surah4Desc' },
  { id: 'hizb_0.125', type: 'hizb', threshold: 0.125, nameKey: 'quranData.milestones.hizb8th', descriptionKey: 'quranData.milestones.hizb8thDesc' },
  { id: 'hizb_0.25', type: 'hizb', threshold: 0.25, nameKey: 'quranData.milestones.hizb4th', descriptionKey: 'quranData.milestones.hizb4thDesc' },
  { id: 'hizb_0.5', type: 'hizb', threshold: 0.5, nameKey: 'quranData.milestones.hizbHalf', descriptionKey: 'quranData.milestones.hizbHalfDesc' },
  { id: 'hizb_1', type: 'hizb', threshold: 1, nameKey: 'quranData.milestones.hizb1', descriptionKey: 'quranData.milestones.hizb1Desc' },
  { id: 'juz_1', type: 'juz', threshold: 1, nameKey: 'quranData.milestones.juz1', descriptionKey: 'quranData.milestones.juz1Desc' },
  { id: 'juz_3', type: 'juz', threshold: 3, nameKey: 'quranData.milestones.juz3', descriptionKey: 'quranData.milestones.juz3Desc' },
  { id: 'juz_15', type: 'juz', threshold: 15, nameKey: 'quranData.milestones.juz15', descriptionKey: 'quranData.milestones.juz15Desc' },
  { id: 'juz_30', type: 'juz', threshold: 30, nameKey: 'quranData.milestones.juz30', descriptionKey: 'quranData.milestones.juz30Desc' },
];

console.log(`${LOG_PREFIX} 🔄 ${REVISION_MILESTONES.length} Revision milestones configured`);

// ✅ Exercise Types for each 5-ayat block (avec clés i18n)
export const EXERCISE_TYPES: ExerciseType[] = [
  { id: 'listen_repeat', nameKey: 'quranData.exercises.listenRepeat', icon: '🎧', xp: 10 },
  { id: 'read_aloud', nameKey: 'quranData.exercises.readAloud', icon: '🗣️', xp: 15 },
  { id: 'fill_blank', nameKey: 'quranData.exercises.fillBlank', icon: '✏️', xp: 20 },
  { id: 'arrange_words', nameKey: 'quranData.exercises.arrangeWords', icon: '🔤', xp: 25 },
  { id: 'multiple_choice', nameKey: 'quranData.exercises.multipleChoice', icon: '❓', xp: 15 },
  { id: 'write_from_memory', nameKey: 'quranData.exercises.writeFromMemory', icon: '📝', xp: 30 },
  { id: 'recite_without_text', nameKey: 'quranData.exercises.reciteWithoutText', icon: '🎤', xp: 35 },
  { id: 'identify_surah', nameKey: 'quranData.exercises.identifySurah', icon: '🔍', xp: 20 },
  { id: 'continue_ayah', nameKey: 'quranData.exercises.continueAyah', icon: '➡️', xp: 25 },
  { id: 'previous_ayah', nameKey: 'quranData.exercises.previousAyah', icon: '⬅️', xp: 25 },
];

console.log(`${LOG_PREFIX} 📋 ${EXERCISE_TYPES.length} Exercise types configured`);

// ✅ Helper function to get translated milestone name
export const getMilestoneName = (milestone: RevisionMilestone): string => {
  return t(milestone.nameKey);
};

// ✅ Helper function to get translated milestone description
export const getMilestoneDescription = (milestone: RevisionMilestone): string => {
  return t(milestone.descriptionKey);
};

// ✅ Helper function to get translated exercise name
export const getExerciseName = (exercise: ExerciseType): string => {
  return t(exercise.nameKey);
};

// ✅ Helper Functions

/**
 * Get lesson blocks for a surah (5 ayat per block)
 */
export const getSurahLessonBlocks = (surahId: number): LessonBlock[] => {
  console.log(`${LOG_PREFIX} 📦 getSurahLessonBlocks() - surahId: ${surahId}`);
  
  const surah = SURAHS_COMPLETE.find(s => s.id === surahId);
  if (!surah) {
    console.log(`${LOG_PREFIX} ⚠️ Surah not found: ${surahId}`);
    return [];
  }
  
  const blocks: LessonBlock[] = [];
  const BLOCK_SIZE = 5;
  
  for (let start = 1; start <= surah.ayahs; start += BLOCK_SIZE) {
    const end = Math.min(start + BLOCK_SIZE - 1, surah.ayahs);
    blocks.push({
      id: `${surahId}_${start}_${end}`,
      surahId,
      startAyah: start,
      endAyah: end,
      ayahCount: end - start + 1,
    });
  }
  
  console.log(`${LOG_PREFIX} ✅ Generated ${blocks.length} blocks for surah ${surah.name}`);
  return blocks;
};

/**
 * Get all surahs in a specific Juz
 */
export const getSurahsByJuz = (juzNumber: number): Surah[] => {
  console.log(`${LOG_PREFIX} 📖 getSurahsByJuz() - juz: ${juzNumber}`);
  const surahs = SURAHS_COMPLETE.filter(s => s.juz === juzNumber);
  console.log(`${LOG_PREFIX} ✅ Found ${surahs.length} surahs in Juz ${juzNumber}`);
  return surahs;
};

/**
 * Get all surahs in a specific Hizb
 */
export const getSurahsByHizb = (hizbNumber: number): Surah[] => {
  console.log(`${LOG_PREFIX} 📖 getSurahsByHizb() - hizb: ${hizbNumber}`);
  const surahs = SURAHS_COMPLETE.filter(s => s.hizb === hizbNumber);
  console.log(`${LOG_PREFIX} ✅ Found ${surahs.length} surahs in Hizb ${hizbNumber}`);
  return surahs;
};

/**
 * Calculate total ayahs in Juz
 */
export const getJuzAyahCount = (juzNumber: number): number => {
  const surahs = getSurahsByJuz(juzNumber);
  const count = surahs.reduce((sum, s) => sum + s.ayahs, 0);
  console.log(`${LOG_PREFIX} 📊 Juz ${juzNumber} has ${count} ayahs`);
  return count;
};

/**
 * Check if revision is needed based on progress
 */
export const checkRevisionMilestone = (
  totalAyahsMemorized: number,
  totalSurahsCompleted: number,
  totalHizbCompleted: number,
  totalJuzCompleted: number
): RevisionMilestone | null => {
  console.log(`${LOG_PREFIX} 🔍 checkRevisionMilestone()`);
  console.log(`${LOG_PREFIX} 📊 Progress: ayahs=${totalAyahsMemorized}, surahs=${totalSurahsCompleted}, hizb=${totalHizbCompleted}, juz=${totalJuzCompleted}`);
  
  // Check from largest to smallest milestone
  for (const milestone of [...REVISION_MILESTONES].reverse()) {
    let shouldReview = false;
    
    switch (milestone.type) {
      case 'juz':
        shouldReview = totalJuzCompleted >= milestone.threshold && totalJuzCompleted % milestone.threshold === 0;
        break;
      case 'hizb':
        shouldReview = totalHizbCompleted >= milestone.threshold && totalHizbCompleted % milestone.threshold === 0;
        break;
      case 'surah':
        shouldReview = totalSurahsCompleted >= milestone.threshold && totalSurahsCompleted % milestone.threshold === 0;
        break;
      case 'ayat':
        shouldReview = totalAyahsMemorized >= milestone.threshold && totalAyahsMemorized % milestone.threshold === 0;
        break;
    }
    
    if (shouldReview) {
      console.log(`${LOG_PREFIX} 🔔 Revision milestone reached: ${getMilestoneName(milestone)}`);
      return milestone;
    }
  }
  
  console.log(`${LOG_PREFIX} ℹ️ No revision milestone reached`);
  return null;
};

/**
 * Generate exercises for a 5-ayat block
 */
export const generateBlockExercises = (surahId: number, startAyah: number, endAyah: number): any[] => {
  console.log(`${LOG_PREFIX} 🎯 generateBlockExercises() - surah: ${surahId}, ayahs: ${startAyah}-${endAyah}`);
  
  const exercises: any[] = [];
  
  // For each ayah in the block, generate specific exercises
  for (let ayah = startAyah; ayah <= endAyah; ayah++) {
    // Exercise 1: Listen & Repeat
    exercises.push({
      type: 'listen_repeat',
      surahId,
      ayahNumber: ayah,
      // ✅ AVANT: 'استمع للآية ثم كررها'
      instructionKey: 'quranData.instructions.listenAndRepeat',
      xp: 10,
    });
    
    // Exercise 2: Fill the blank (remove random word)
    exercises.push({
      type: 'fill_blank',
      surahId,
      ayahNumber: ayah,
      // ✅ AVANT: 'أكمل الكلمة الناقصة'
      instructionKey: 'quranData.instructions.fillMissingWord',
      xp: 20,
    });
  }
  
  // Block-level exercises
  exercises.push({
    type: 'arrange_words',
    surahId,
    ayahRange: { start: startAyah, end: endAyah },
    // ✅ AVANT: 'رتب كلمات الآية'
    instructionKey: 'quranData.instructions.arrangeAyahWords',
    xp: 25,
  });
  
  exercises.push({
    type: 'continue_ayah',
    surahId,
    ayahRange: { start: startAyah, end: endAyah },
    // ✅ AVANT: 'أكمل الآية التالية'
    instructionKey: 'quranData.instructions.continueNextAyah',
    xp: 25,
  });
  
  exercises.push({
    type: 'recite_without_text',
    surahId,
    ayahRange: { start: startAyah, end: endAyah },
    // ✅ AVANT: 'اقرأ الآيات من الذاكرة'
    instructionKey: 'quranData.instructions.reciteFromMemory',
    xp: 35,
  });
  
  console.log(`${LOG_PREFIX} ✅ Generated ${exercises.length} exercises for block`);
  return exercises;
};

/**
 * Get instruction text for an exercise (translated)
 */
export const getExerciseInstruction = (exercise: any): string => {
  if (exercise.instructionKey) {
    return t(exercise.instructionKey);
  }
  // Fallback for legacy exercises without i18n keys
  return exercise.instruction || '';
};

/**
 * Get display info for progress
 */
export const getProgressDisplayInfo = (totalAyahs: number): {
  juz: number;
  hizb: number;
  percentage: number;
} => {
  const TOTAL_QURAN_AYAHS = 6236;
  const percentage = (totalAyahs / TOTAL_QURAN_AYAHS) * 100;
  const juz = Math.floor(totalAyahs / 208); // Approximate ayahs per juz
  const hizb = Math.floor(totalAyahs / 104); // Approximate ayahs per hizb
  
  console.log(`${LOG_PREFIX} 📊 Progress: ${totalAyahs}/${TOTAL_QURAN_AYAHS} = ${percentage.toFixed(2)}% (${juz} juz, ${hizb} hizb)`);
  
  return { juz, hizb, percentage };
};

export default {
  SURAHS_COMPLETE,
  REVISION_MILESTONES,
  EXERCISE_TYPES,
  getSurahLessonBlocks,
  getSurahsByJuz,
  getSurahsByHizb,
  getJuzAyahCount,
  checkRevisionMilestone,
  generateBlockExercises,
  getProgressDisplayInfo,
  getMilestoneName,
  getMilestoneDescription,
  getExerciseName,
  getExerciseInstruction,
};