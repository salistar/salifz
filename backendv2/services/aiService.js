/**
 * AI Service - Salifz
 * Provides AI-powered features using mock data + optional OpenAI
 */

class AIService {
  constructor() {
    this.useOpenAI = process.env.OPENAI_API_KEY ? true : false;
  }

  // Get personalized memorization plan
  async getPersonalizedPlan(user, progress) {
    // Mock AI response based on user data
    const dailyGoal = user.profile?.dailyGoal || 5;
    const level = user.gamification?.level || 1;
    const totalMemorized = user.quranProgress?.totalVersesMemorized || 0;
    
    // Determine difficulty based on progress
    let difficulty = 'beginner';
    if (totalMemorized > 100) difficulty = 'intermediate';
    if (totalMemorized > 500) difficulty = 'advanced';
    if (totalMemorized > 2000) difficulty = 'expert';

    // Suggest next surahs based on memorization path
    const suggestedSurahs = this.getSuggestedSurahs(user, progress);
    
    // Calculate optimal review schedule
    const reviewSchedule = this.calculateReviewSchedule(progress);

    return {
      plan: {
        dailyGoal,
        difficulty,
        estimatedCompletionDate: this.estimateCompletion(totalMemorized, dailyGoal),
        suggestedSurahs,
        reviewSchedule,
        weeklySchedule: this.generateWeeklySchedule(dailyGoal, difficulty),
        tips: this.getPersonalizedTips(user, progress)
      }
    };
  }

  // Get AI insights
  async getInsights(user, progress, streakData) {
    const stats = await this.calculateStats(user, progress);
    
    return {
      insights: {
        // Weekly Overview
        weeklyOverview: {
          versesMemorized: stats.weeklyVerses,
          versesReviewed: stats.weeklyReviews,
          timeSpent: stats.weeklyTime,
          xpEarned: user.gamification?.weeklyXP || 0
        },
        
        // Performance Analysis
        performance: {
          averageAccuracy: stats.averageAccuracy,
          bestTime: this.determineBestTime(stats, progress),
          strongestSurahs: stats.strongestSurahs,
          needsReview: stats.needsReview
        },

        // Permet à l'interface de distinguer « zéro cette semaine » de
        // « pas encore assez de données pour dire quoi que ce soit ».
        hasData: stats.hasData,
        
        // Streaks Analysis
        streakAnalysis: {
          currentStreak: streakData?.current || 0,
          longestStreak: streakData?.longest || 0,
          consistency: this.calculateConsistency(streakData),
          predictedStreakRisk: this.predictStreakRisk(streakData)
        },
        
        // AI Recommendations
        recommendations: this.generateRecommendations(user, stats, streakData),
        
        // Progress Summary
        progressSummary: {
          totalMemorized: user.quranProgress?.totalVersesMemorized || 0,
          percentComplete: ((user.quranProgress?.totalVersesMemorized || 0) / 6236 * 100).toFixed(2),
          rank: this.calculateRank(user),
          nextMilestone: this.getNextMilestone(user)
        }
      }
    };
  }

  // Daily motivation quote
  async getDailyMotivation(user) {
    const quotes = [
      {
        ar: 'خيركم من تعلم القرآن وعلمه',
        en: 'The best among you are those who learn the Quran and teach it',
        source: 'Sahih Bukhari'
      },
      {
        ar: 'إن الله يرفع بهذا الكتاب أقواماً ويضع به آخرين',
        en: 'Allah raises some people by this Book and lowers others by it',
        source: 'Sahih Muslim'
      },
      {
        ar: 'اقرأوا القرآن فإنه يأتي يوم القيامة شفيعاً لأصحابه',
        en: 'Recite the Quran, for it will come as an intercessor for its reciters on the Day of Resurrection',
        source: 'Sahih Muslim'
      },
      {
        ar: 'من قرأ حرفاً من كتاب الله فله به حسنة والحسنة بعشر أمثالها',
        en: 'Whoever recites a letter from the Book of Allah will have a reward, and the reward will be multiplied by ten',
        source: 'Tirmidhi'
      },
      {
        ar: 'الماهر بالقرآن مع السفرة الكرام البررة',
        en: 'The one who is proficient in the Quran will be with the noble and righteous scribes (angels)',
        source: 'Sahih Bukhari'
      },
      {
        ar: 'يقال لصاحب القرآن اقرأ وارتق ورتل كما كنت ترتل في الدنيا',
        en: 'It will be said to the companion of the Quran: Read and ascend and recite as you used to recite in the world',
        source: 'Abu Dawud'
      },
      {
        ar: 'إن الذي ليس في جوفه شيء من القرآن كالبيت الخرب',
        en: 'Verily, the one who does not have the Quran in his heart is like a ruined house',
        source: 'Tirmidhi'
      },
      {
        ar: 'تعاهدوا القرآن فوالذي نفسي بيده لهو أشد تفصياً من الإبل في عقلها',
        en: 'Keep reviewing the Quran, for by the One in Whose Hand is my soul, it escapes faster than camels from their ropes',
        source: 'Sahih Bukhari'
      }
    ];

    // Get quote based on day of year for variety
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const quote = quotes[dayOfYear % quotes.length];

    // Personalized message based on streak
    const streak = user.gamification?.currentStreak || 0;
    let personalMessage = '';
    
    if (streak === 0) {
      personalMessage = {
        ar: 'ابدأ رحلتك اليوم! 🚀',
        en: 'Start your journey today! 🚀'
      };
    } else if (streak < 7) {
      personalMessage = {
        ar: `رائع! أنت في اليوم ${streak} من سلسلتك 🔥`,
        en: `Great! You're on day ${streak} of your streak 🔥`
      };
    } else if (streak < 30) {
      personalMessage = {
        ar: `ممتاز! ${streak} يوم متواصل! استمر 💪`,
        en: `Excellent! ${streak} days in a row! Keep going 💪`
      };
    } else {
      personalMessage = {
        ar: `مذهل! ${streak} يوم! أنت حافظ حقيقي 🏆`,
        en: `Amazing! ${streak} days! You're a true Hafiz 🏆`
      };
    }

    return {
      motivation: {
        quote,
        personalMessage,
        dailyTip: this.getDailyTip(user),
        streakMessage: personalMessage
      }
    };
  }

  // Smart review queue
  async getSmartReview(user, progress) {
    // Get verses that need review based on spaced repetition
    const reviewQueue = [];
    const now = new Date();

    if (progress && progress.length > 0) {
      for (const surahProgress of progress) {
        if (surahProgress.verses) {
          for (const verse of surahProgress.verses) {
            if (verse.status !== 'not_started' && verse.nextReviewAt && new Date(verse.nextReviewAt) <= now) {
              reviewQueue.push({
                surahNumber: surahProgress.surahNumber,
                surahName: surahProgress.surahName,
                ayahNumber: verse.ayahNumber,
                confidence: verse.confidence || 50,
                lastReviewed: verse.lastReviewedAt,
                priority: this.calculateReviewPriority(verse)
              });
            }
          }
        }
      }
    }

    // Sort by priority (lowest confidence first)
    reviewQueue.sort((a, b) => a.priority - b.priority);

    return {
      reviewQueue: reviewQueue.slice(0, 20),
      totalDue: reviewQueue.length,
      recommendedSessionLength: Math.min(20, reviewQueue.length),
      estimatedTime: Math.min(20, reviewQueue.length) * 2 // ~2 min per verse
    };
  }

  /**
   * Tafsir d'un verset, récupéré auprès de quran.com.
   *
   * Cette méthode renvoyait le même texte bouchon — « Brief explanation of the
   * verse » — pour les 6 236 versets du Coran.
   *
   * Sources : Tafsir Muyassar en arabe (id 16, concis et accessible, adapté à
   * une application de mémorisation) et Ibn Kathir abrégé en anglais (id 169).
   * Ce sont des textes savants : ils sont servis tels quels, sans
   * reformulation par un modèle de langue.
   *
   * quran.com ne propose aucun tafsir en français : l'interface francophone
   * affiche l'arabe, avec l'anglais en second.
   */
  async explainAyah(surahNumber, ayahNumber) {
    const verseKey = `${surahNumber}:${ayahNumber}`;
    const cacheKey = `tafsir:${verseKey}`;

    if (this._tafsirCache?.has(cacheKey)) {
      return this._tafsirCache.get(cacheKey);
    }

    const TAFSIR_SOURCES = { ar: 16, en: 169 };
    const explanation = { surah: surahNumber, ayah: ayahNumber, source: 'quran.com' };

    try {
      const fetched = await Promise.all(
        Object.entries(TAFSIR_SOURCES).map(async ([lang, tafsirId]) => {
          const response = await fetch(
            `https://api.quran.com/api/v4/tafsirs/${tafsirId}/by_ayah/${verseKey}`,
            { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) }
          );
          if (!response.ok) return [lang, null];
          const body = await response.json();
          const text = body?.tafsir?.text;
          return [lang, text ? stripHtml(text) : null];
        })
      );

      for (const [lang, text] of fetched) {
        if (text) explanation[lang] = text;
      }

      if (!explanation.ar && !explanation.en) {
        return { explanation: { ...explanation, available: false } };
      }

      explanation.available = true;
      const result = { explanation };

      this._tafsirCache = this._tafsirCache || new Map();
      if (this._tafsirCache.size > 500) this._tafsirCache.clear();
      this._tafsirCache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error(`[TAFSIR] ${verseKey} indisponible :`, error.message);
      // On indique l'indisponibilité au lieu de renvoyer un texte inventé.
      return { explanation: { ...explanation, available: false } };
    }
  }

  // Helper methods
  getSuggestedSurahs(user, progress) {
    const path = user.quranProgress?.memorizationPath || 'juz_amma_first';
    
    // Juz Amma first (surahs 78-114)
    if (path === 'juz_amma_first') {
      const juzAmmaSurahs = [];
      for (let i = 114; i >= 78; i--) {
        juzAmmaSurahs.push(i);
      }
      return juzAmmaSurahs.slice(0, 5);
    }
    
    // Traditional (start from beginning)
    return [1, 2, 3, 4, 5];
  }

  calculateReviewSchedule(progress) {
    return {
      morning: { count: 5, type: 'review' },
      afternoon: { count: 3, type: 'new' },
      evening: { count: 5, type: 'review' }
    };
  }

  estimateCompletion(memorized, dailyGoal) {
    const remaining = 6236 - memorized;
    const daysNeeded = Math.ceil(remaining / dailyGoal);
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + daysNeeded);
    return completionDate.toISOString().split('T')[0];
  }

  generateWeeklySchedule(dailyGoal, difficulty) {
    return {
      saturday: { new: dailyGoal, review: dailyGoal * 2 },
      sunday: { new: dailyGoal, review: dailyGoal * 2 },
      monday: { new: Math.floor(dailyGoal * 0.5), review: dailyGoal * 3 },
      tuesday: { new: dailyGoal, review: dailyGoal * 2 },
      wednesday: { new: dailyGoal, review: dailyGoal * 2 },
      thursday: { new: Math.floor(dailyGoal * 0.5), review: dailyGoal * 3 },
      friday: { new: 0, review: dailyGoal * 4 } // Review day
    };
  }

  getPersonalizedTips(user, progress) {
    const tips = [
      { ar: 'حاول الحفظ في الصباح الباكر لتحصل على أفضل تركيز', en: 'Try memorizing early morning for best focus' },
      { ar: 'راجع ما حفظته قبل النوم لتثبيته', en: 'Review before sleep to consolidate memory' },
      { ar: 'استخدم التكرار المتباعد لتثبيت الحفظ', en: 'Use spaced repetition to strengthen memorization' },
      { ar: 'اربط الآيات بمعانيها لتسهيل الحفظ', en: 'Connect verses with their meanings for easier memorization' }
    ];
    
    return tips.slice(0, 3);
  }

  /**
   * Statistiques réelles de l'utilisateur, calculées à partir de sa
   * progression enregistrée.
   *
   * Cette méthode renvoyait `Math.random()` pour les versets de la semaine, le
   * nombre de révisions, le temps passé et la précision. Ces valeurs étaient
   * affichées à l'utilisateur comme étant *sa* progression : un utilisateur
   * n'ayant rien fait de la semaine voyait « 23 versets mémorisés ».
   */
  async calculateStats(user, progress) {
    const oneWeekAgo = new Date(Date.now() - 7 * 86400000);
    const surahs = Array.isArray(progress) ? progress : [];

    let weeklyVerses = 0;
    let weeklyReviews = 0;
    let tajwidSum = 0;
    let tajwidCount = 0;

    const perSurah = [];

    for (const surah of surahs) {
      const verses = surah.verses || [];
      let memorizedHere = 0;
      let confidenceSum = 0;
      let confidenceCount = 0;
      const weakVerses = [];

      for (const verse of verses) {
        if (verse.memorizedAt && new Date(verse.memorizedAt) >= oneWeekAgo) weeklyVerses++;
        if (verse.lastReviewedAt && new Date(verse.lastReviewedAt) >= oneWeekAgo) weeklyReviews++;

        if (verse.status === 'memorized' || verse.status === 'mastered') memorizedHere++;

        if (typeof verse.confidence === 'number' && verse.confidence > 0) {
          confidenceSum += verse.confidence;
          confidenceCount++;
          if (verse.confidence < 60) weakVerses.push(verse.ayahNumber);
        }

        for (const entry of verse.tajwidScores || []) {
          if (entry.timestamp && new Date(entry.timestamp) >= oneWeekAgo && typeof entry.score === 'number') {
            tajwidSum += entry.score;
            tajwidCount++;
          }
        }
      }

      if (confidenceCount > 0 || memorizedHere > 0) {
        perSurah.push({
          number: surah.surahNumber,
          name: surah.surahName,
          memorized: memorizedHere,
          avgConfidence: confidenceCount > 0 ? Math.round(confidenceSum / confidenceCount) : 0,
          weakVerses: weakVerses.slice(0, 10),
        });
      }
    }

    // Estimation du temps : ~2 min par verset mémorisé, ~30 s par révision.
    // C'est une estimation assumée, pas une mesure — tant que l'application
    // n'instrumente pas la durée réelle des sessions.
    const weeklyTime = Math.round(weeklyVerses * 2 + weeklyReviews * 0.5);

    const strongestSurahs = perSurah
      .filter((s) => s.avgConfidence >= 80)
      .sort((a, b) => b.avgConfidence - a.avgConfidence)
      .slice(0, 3)
      .map((s) => ({ number: s.number, name: s.name, confidence: s.avgConfidence }));

    const needsReview = perSurah
      .filter((s) => s.weakVerses.length > 0)
      .sort((a, b) => a.avgConfidence - b.avgConfidence)
      .slice(0, 3)
      .map((s) => ({ number: s.number, name: s.name, verses: s.weakVerses }));

    return {
      weeklyVerses,
      weeklyReviews,
      weeklyTime,
      // `null` quand aucune récitation n'a été notée : l'interface doit
      // afficher « pas encore de données », pas un score inventé.
      averageAccuracy: tajwidCount > 0 ? Math.round(tajwidSum / tajwidCount) : null,
      strongestSurahs,
      needsReview,
      hasData: weeklyVerses > 0 || weeklyReviews > 0,
    };
  }

  /**
   * Moment de la journée où l'utilisateur révise le plus, déduit de l'heure
   * de ses révisions passées. Renvoie `null` tant qu'il n'y a pas assez
   * d'historique — au lieu de tirer un créneau au hasard.
   */
  determineBestTime(stats, progress) {
    const buckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    let total = 0;

    for (const surah of Array.isArray(progress) ? progress : []) {
      for (const verse of surah.verses || []) {
        if (!verse.lastReviewedAt) continue;
        const hour = new Date(verse.lastReviewedAt).getHours();
        if (hour >= 5 && hour < 12) buckets.morning++;
        else if (hour >= 12 && hour < 17) buckets.afternoon++;
        else if (hour >= 17 && hour < 22) buckets.evening++;
        else buckets.night++;
        total++;
      }
    }

    if (total < 5) return null;

    return Object.entries(buckets).sort((a, b) => b[1] - a[1])[0][0];
  }

  calculateConsistency(streakData) {
    if (!streakData?.history) return 0;
    const last30 = streakData.history.slice(-30);
    const completed = last30.filter(h => h.completed).length;
    return Math.round((completed / 30) * 100);
  }

  predictStreakRisk(streakData) {
    const consistency = this.calculateConsistency(streakData);
    if (consistency > 90) return 'low';
    if (consistency > 70) return 'medium';
    return 'high';
  }

  generateRecommendations(user, stats, streakData) {
    const recommendations = [];
    
    if (stats.averageAccuracy < 80) {
      recommendations.push({
        ar: 'ركز على المراجعة أكثر لتحسين دقتك',
        en: 'Focus more on review to improve your accuracy',
        priority: 'high'
      });
    }
    
    if ((streakData?.current || 0) < 7) {
      recommendations.push({
        ar: 'حاول الوصول لسلسلة 7 أيام هذا الأسبوع',
        en: 'Try to reach a 7-day streak this week',
        priority: 'medium'
      });
    }
    
    recommendations.push({
      ar: 'أضف 5 دقائق لوقت مراجعتك اليومية',
      en: 'Add 5 minutes to your daily review time',
      priority: 'low'
    });
    
    return recommendations;
  }

  calculateRank(user) {
    const xp = user.gamification?.totalXP || 0;
    if (xp < 100) return { ar: 'مبتدئ', en: 'Beginner' };
    if (xp < 500) return { ar: 'طالب', en: 'Student' };
    if (xp < 2000) return { ar: 'متعلم', en: 'Learner' };
    if (xp < 5000) return { ar: 'حافظ مبتدئ', en: 'Novice Hafiz' };
    if (xp < 15000) return { ar: 'حافظ متوسط', en: 'Intermediate Hafiz' };
    return { ar: 'حافظ متقدم', en: 'Advanced Hafiz' };
  }

  getNextMilestone(user) {
    const memorized = user.quranProgress?.totalVersesMemorized || 0;
    const milestones = [10, 50, 100, 250, 500, 1000, 2000, 3000, 4000, 5000, 6236];
    
    for (const milestone of milestones) {
      if (memorized < milestone) {
        return { target: milestone, remaining: milestone - memorized };
      }
    }
    
    return { target: 6236, remaining: 0 };
  }

  getDailyTip(user) {
    const tips = [
      { ar: 'اشرب ماءً كافياً للحفاظ على تركيزك', en: 'Stay hydrated to maintain focus' },
      { ar: 'خذ استراحة قصيرة كل 25 دقيقة', en: 'Take a short break every 25 minutes' },
      { ar: 'استمع للآيات قبل حفظها', en: 'Listen to verses before memorizing' }
    ];
    
    return tips[Math.floor(Math.random() * tips.length)];
  }

  calculateReviewPriority(verse) {
    // Lower score = higher priority
    let priority = verse.confidence || 50;
    
    // Overdue verses get higher priority
    if (verse.nextReviewAt) {
      const overdueDays = Math.floor((Date.now() - new Date(verse.nextReviewAt)) / 86400000);
      if (overdueDays > 0) {
        priority -= overdueDays * 10;
      }
    }
    
    return Math.max(0, priority);
  }
}

/** Les tafsirs de quran.com contiennent du balisage HTML. */
function stripHtml(html) {
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

module.exports = new AIService();