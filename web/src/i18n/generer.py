"""
Génère les fichiers de traduction depuis une table unique.

Une seule source pour les trois langues : c'est la seule façon de repérer une
clé oubliée. Trois fichiers édités séparément divergent en quelques semaines,
et l'écart ne se voit que sur l'écran de l'utilisateur qui parle la langue la
moins testée.

    python generer.py
"""

import io
import json
import os

LANGUES = ('fr', 'ar', 'en')


def ecrire(ns, table):
    for lg in LANGUES:
        manquantes = [c for c, t in table.items() if not t.get(lg)]
        if manquantes:
            raise SystemExit(f'{ns}/{lg} : clés sans traduction — {manquantes}')
        obj = {c: t[lg] for c, t in table.items()}
        os.makedirs(f'locales/{lg}', exist_ok=True)
        io.open(f'locales/{lg}/{ns}.json', 'w', encoding='utf-8').write(
            json.dumps(obj, ensure_ascii=False, indent=2) + '\n'
        )


# --------------------------------------------------------------- lessons
ecrire('lessons', {
    'title': {'fr': 'Leçons', 'ar': 'الدروس', 'en': 'Lessons'},
    'search': {'fr': 'Rechercher une sourate', 'ar': 'ابحث عن سورة', 'en': 'Search a surah'},
    'filterAll': {'fr': 'Toutes', 'ar': 'الكل', 'en': 'All'},
    'filterInProgress': {'fr': 'En cours', 'ar': 'قيد الحفظ', 'en': 'In progress'},
    'filterDone': {'fr': 'Mémorisées', 'ar': 'محفوظة', 'en': 'Memorized'},
    'filterNotStarted': {'fr': 'Non commencées', 'ar': 'لم تبدأ', 'en': 'Not started'},
    'sortMushaf': {'fr': 'Ordre du mushaf', 'ar': 'ترتيب المصحف', 'en': 'Mushaf order'},
    'sortRevelation': {'fr': 'Ordre de révélation', 'ar': 'ترتيب النزول', 'en': 'Revelation order'},
    'verses_one': {'fr': '{{count}} verset', 'ar': 'آية واحدة', 'en': '{{count}} verse'},
    'verses_two': {'fr': '{{count}} versets', 'ar': 'آيتان', 'en': '{{count}} verses'},
    'verses_few': {'fr': '{{count}} versets', 'ar': '{{count}} آيات', 'en': '{{count}} verses'},
    'verses_many': {'fr': '{{count}} versets', 'ar': '{{count}} آية', 'en': '{{count}} verses'},
    'verses_other': {'fr': '{{count}} versets', 'ar': '{{count}} آية', 'en': '{{count}} verses'},
    'meccan': {'fr': 'Mecquoise', 'ar': 'مكية', 'en': 'Meccan'},
    'medinan': {'fr': 'Médinoise', 'ar': 'مدنية', 'en': 'Medinan'},
    'juz': {'fr': 'Juz {{n}}', 'ar': 'الجزء {{n}}', 'en': 'Juz {{n}}'},
    'progress': {'fr': '{{percent}} % mémorisé', 'ar': '{{percent}}٪ محفوظ', 'en': '{{percent}}% memorized'},
    'noResult': {'fr': 'Aucune sourate ne correspond à « {{q}} »', 'ar': 'لا توجد سورة تطابق «{{q}}»', 'en': 'No surah matches "{{q}}"'},
    'clearSearch': {'fr': 'Effacer la recherche', 'ar': 'مسح البحث', 'en': 'Clear search'},
    'study': {'fr': 'Étudier', 'ar': 'ادرس', 'en': 'Study'},
})

# ---------------------------------------------------------------- review
ecrire('review', {
    'title': {'fr': 'Révision', 'ar': 'المراجعة', 'en': 'Review'},
    'dueToday': {'fr': 'À revoir aujourd’hui', 'ar': 'للمراجعة اليوم', 'en': 'Due today'},
    'overdue': {'fr': 'En retard', 'ar': 'متأخرة', 'en': 'Overdue'},
    'nextDue': {'fr': 'Prochaine échéance', 'ar': 'الموعد القادم', 'en': 'Next due'},
    'start': {'fr': 'Commencer la révision', 'ar': 'ابدأ المراجعة', 'en': 'Start review'},
    'estimate': {'fr': 'environ {{minutes}} min', 'ar': 'حوالي {{minutes}} دقيقة', 'en': 'about {{minutes}} min'},
    'emptyTitle': {'fr': 'Rien à réviser aujourd’hui', 'ar': 'لا شيء للمراجعة اليوم', 'en': 'Nothing to review today'},
    'emptyBody': {'fr': 'La file se remplit à mesure que vous mémorisez. Revenez demain, ou apprenez un nouveau passage.', 'ar': 'تمتلئ القائمة كلما حفظت. عد غداً أو احفظ مقطعاً جديداً.', 'en': 'The queue fills as you memorize. Come back tomorrow, or learn a new passage.'},
    'goToLessons': {'fr': 'Aller aux leçons', 'ar': 'إلى الدروس', 'en': 'Go to lessons'},
    'lastReviewed': {'fr': 'Revu {{when}}', 'ar': 'روجعت {{when}}', 'en': 'Reviewed {{when}}'},
    'mastery': {'fr': 'Maîtrise', 'ar': 'الإتقان', 'en': 'Mastery'},
    'reveal': {'fr': 'Afficher le verset', 'ar': 'إظهار الآية', 'en': 'Show the verse'},
    'reciteFirst': {'fr': 'Récitez de mémoire, puis vérifiez.', 'ar': 'اتلُ من حفظك ثم تحقّق.', 'en': 'Recite from memory, then check.'},
    'knewIt': {'fr': 'Je le savais', 'ar': 'كنت أعرفها', 'en': 'I knew it'},
    'reviewSoon': {'fr': 'À revoir bientôt', 'ar': 'تحتاج مراجعة قريبة', 'en': 'Review again soon'},
    'sessionDone': {'fr': 'Série terminée', 'ar': 'انتهت الجلسة', 'en': 'Session complete'},
})

# ---------------------------------------------------------------- mushaf
ecrire('mushaf', {
    'title': {'fr': 'Mushaf', 'ar': 'المصحف', 'en': 'Mushaf'},
    'pageOf': {'fr': 'Page {{page}} · Juz {{juz}} · Hizb {{hizb}}', 'ar': 'الصفحة {{page}} · الجزء {{juz}} · الحزب {{hizb}}', 'en': 'Page {{page}} · Juz {{juz}} · Hizb {{hizb}}'},
    'maskLabel': {'fr': 'Masquage', 'ar': 'الإخفاء', 'en': 'Masking'},
    'maskNone': {'fr': 'Texte complet', 'ar': 'النص كاملاً', 'en': 'Full text'},
    'maskPartial': {'fr': 'Premiers mots', 'ar': 'أوائل الكلمات', 'en': 'First words'},
    'maskFirst': {'fr': 'Premier mot', 'ar': 'الكلمة الأولى', 'en': 'First word'},
    'maskAll': {'fr': 'Masqué', 'ar': 'مخفي', 'en': 'Hidden'},
    'reveal': {'fr': 'Maintenir pour révéler', 'ar': 'اضغط مطولاً للكشف', 'en': 'Hold to reveal'},
    'jumpTo': {'fr': 'Aller à', 'ar': 'الانتقال إلى', 'en': 'Jump to'},
    'listen': {'fr': 'Écouter', 'ar': 'استمع', 'en': 'Listen'},
    'markMemorized': {'fr': 'Marquer comme mémorisé', 'ar': 'تحديد كمحفوظ', 'en': 'Mark as memorized'},
    'addToReview': {'fr': 'Ajouter à la révision', 'ar': 'أضف إلى المراجعة', 'en': 'Add to review'},
    'textSize': {'fr': 'Taille du texte', 'ar': 'حجم النص', 'en': 'Text size'},
    'previousPage': {'fr': 'Page précédente', 'ar': 'الصفحة السابقة', 'en': 'Previous page'},
    'nextPage': {'fr': 'Page suivante', 'ar': 'الصفحة التالية', 'en': 'Next page'},
})

# ----------------------------------------------------------------- daily
ecrire('daily', {
    'title': {'fr': 'Verset du jour', 'ar': 'آية اليوم', 'en': 'Verse of the day'},
    'reference': {'fr': '{{surah}} · {{ayah}}', 'ar': '{{surah}} · {{ayah}}', 'en': '{{surah}} · {{ayah}}'},
    'reciter': {'fr': 'Récitateur', 'ar': 'القارئ', 'en': 'Reciter'},
    'share': {'fr': 'Partager en image', 'ar': 'مشاركة كصورة', 'en': 'Share as image'},
    'addToLessons': {'fr': 'Ajouter à mes leçons', 'ar': 'أضف إلى دروسي', 'en': 'Add to my lessons'},
    'previous': {'fr': 'Versets précédents', 'ar': 'آيات سابقة', 'en': 'Previous verses'},
    'tafsirSoon': {'fr': 'Le commentaire viendra lorsqu’une source d’exégèse validée sera intégrée.', 'ar': 'سيتوفر التفسير عند اعتماد مصدر موثوق.', 'en': 'Commentary will arrive once a verified tafsir source is integrated.'},
    'sources': {'fr': 'Texte et traduction : quran.com · Récitation : islamic.network', 'ar': 'النص والترجمة: quran.com · التلاوة: islamic.network', 'en': 'Text and translation: quran.com · Recitation: islamic.network'},
    'unavailable': {'fr': 'Texte indisponible', 'ar': 'النص غير متاح', 'en': 'Text unavailable'},
    'unavailableBody': {'fr': 'La source du texte coranique ne répond pas. Rien n’est affiché à la place : mieux vaut un écran vide qu’un texte approximatif.', 'ar': 'مصدر النص القرآني لا يستجيب. لا يُعرض بديل: الشاشة الفارغة خير من نص غير دقيق.', 'en': 'The Quran text source is not responding. Nothing is shown instead: an empty screen beats an approximate text.'},
})

# --------------------------------------------------------------- halaqat
ecrire('halaqat', {
    'title': {'fr': 'Halaqat', 'ar': 'الحلقات', 'en': 'Halaqat'},
    'mine': {'fr': 'Mes halaqat', 'ar': 'حلقاتي', 'en': 'My halaqat'},
    'discover': {'fr': 'Découvrir', 'ar': 'استكشاف', 'en': 'Discover'},
    'create': {'fr': 'Créer une halaqa', 'ar': 'إنشاء حلقة', 'en': 'Create a halaqa'},
    'join': {'fr': 'Demander à rejoindre', 'ar': 'طلب الانضمام', 'en': 'Ask to join'},
    'teacher': {'fr': 'Enseignant', 'ar': 'المعلّم', 'en': 'Teacher'},
    'members_one': {'fr': '{{count}} membre', 'ar': 'عضو واحد', 'en': '{{count}} member'},
    'members_other': {'fr': '{{count}} membres', 'ar': '{{count}} أعضاء', 'en': '{{count}} members'},
    'liveNow': {'fr': 'Session en cours', 'ar': 'جلسة جارية', 'en': 'Session in progress'},
    'nextSession': {'fr': 'Prochaine session {{when}}', 'ar': 'الجلسة القادمة {{when}}', 'en': 'Next session {{when}}'},
    'noSession': {'fr': 'Aucune session prévue', 'ar': 'لا توجد جلسة مبرمجة', 'en': 'No session scheduled'},
    'joinSession': {'fr': 'Rejoindre la session', 'ar': 'الانضمام إلى الجلسة', 'en': 'Join session'},
    'collective': {'fr': '{{count}} versets mémorisés ensemble', 'ar': '{{count}} آية محفوظة معاً', 'en': '{{count}} verses memorized together'},
    'emptyTitle': {'fr': 'Vous n’êtes dans aucune halaqa', 'ar': 'لست في أي حلقة', 'en': 'You’re not in a halaqa yet'},
    'emptyBody': {'fr': 'Une halaqa réunit des mémorisateurs autour d’un enseignant qui écoute vos récitations.', 'ar': 'تجمع الحلقة الحفّاظ حول معلّم يستمع إلى تلاواتكم.', 'en': 'A halaqa gathers memorizers around a teacher who listens to your recitations.'},
    'joinByCode': {'fr': 'Rejoindre avec un code', 'ar': 'الانضمام برمز', 'en': 'Join with a code'},
})

# ---------------------------------------------------------------- khatam
ecrire('khatam', {
    'title': {'fr': 'Khatam', 'ar': 'الختمة', 'en': 'Khatam'},
    'intro': {'fr': 'Les 60 hizb répartis entre les membres : le groupe achève le Coran ensemble.', 'ar': 'تُوزَّع الأحزاب الستون بين الأعضاء: تختم المجموعة القرآن معاً.', 'en': 'The 60 hizb split between members: the group completes the Quran together.'},
    'create': {'fr': 'Créer un khatam', 'ar': 'إنشاء ختمة', 'en': 'Create a khatam'},
    'name': {'fr': 'Titre du khatam', 'ar': 'عنوان الختمة', 'en': 'Khatam title'},
    'deadline': {'fr': 'Date d’objectif', 'ar': 'تاريخ الهدف', 'en': 'Target date'},
    'intention': {'fr': 'Intention (facultatif)', 'ar': 'النية (اختياري)', 'en': 'Intention (optional)'},
    'takeHizb': {'fr': 'Prendre un hizb', 'ar': 'اختيار حزب', 'en': 'Take a hizb'},
    'hizbFree': {'fr': 'Libre', 'ar': 'متاح', 'en': 'Available'},
    'hizbTaken': {'fr': 'Pris par {{name}}', 'ar': 'أخذه {{name}}', 'en': 'Taken by {{name}}'},
    'progress': {'fr': '{{done}} / 60 hizb achevés', 'ar': '{{done}} / 60 حزباً مكتملاً', 'en': '{{done}} / 60 hizb complete'},
    'completed': {'fr': 'Khatam achevé', 'ar': 'تمت الختمة', 'en': 'Khatam complete'},
    'emptyTitle': {'fr': 'Aucun khatam en cours', 'ar': 'لا توجد ختمة جارية', 'en': 'No khatam under way'},
    'emptyBody': {'fr': 'Créez-en un pour votre halaqa : chacun prend un hizb, le groupe achève le Coran.', 'ar': 'أنشئ ختمة لحلقتك: يأخذ كل عضو حزباً، وتختم المجموعة القرآن.', 'en': 'Create one for your halaqa: everyone takes a hizb, the group finishes the Quran.'},
})

# --------------------------------------------------------------- friends
ecrire('friends', {
    'title': {'fr': 'Amis', 'ar': 'الأصدقاء', 'en': 'Friends'},
    'mine': {'fr': 'Mes amis', 'ar': 'أصدقائي', 'en': 'My friends'},
    'requests': {'fr': 'Demandes', 'ar': 'الطلبات', 'en': 'Requests'},
    'search': {'fr': 'Rechercher', 'ar': 'بحث', 'en': 'Search'},
    'searchPlaceholder': {'fr': 'Nom d’utilisateur', 'ar': 'اسم المستخدم', 'en': 'Username'},
    'add': {'fr': 'Ajouter', 'ar': 'إضافة', 'en': 'Add'},
    'requestSent': {'fr': 'Demande envoyée', 'ar': 'تم إرسال الطلب', 'en': 'Request sent'},
    'accept': {'fr': 'Accepter', 'ar': 'قبول', 'en': 'Accept'},
    'decline': {'fr': 'Refuser', 'ar': 'رفض', 'en': 'Decline'},
    'remove': {'fr': 'Retirer', 'ar': 'إزالة', 'en': 'Remove'},
    'encourage': {'fr': 'Encourager', 'ar': 'تشجيع', 'en': 'Encourage'},
    'encouraged': {'fr': 'Encouragement envoyé', 'ar': 'تم إرسال التشجيع', 'en': 'Encouragement sent'},
    'online': {'fr': 'En ligne', 'ar': 'متصل', 'en': 'Online'},
    'offline': {'fr': 'Hors ligne', 'ar': 'غير متصل', 'en': 'Offline'},
    'level': {'fr': 'Niveau {{n}}', 'ar': 'المستوى {{n}}', 'en': 'Level {{n}}'},
    'emptyTitle': {'fr': 'Vos amis apparaîtront ici', 'ar': 'سيظهر أصدقاؤك هنا', 'en': 'Your friends will appear here'},
    'emptyBody': {'fr': 'Cherchez quelqu’un par son nom d’utilisateur, ou partagez le vôtre.', 'ar': 'ابحث عن شخص باسم المستخدم، أو شارك اسمك.', 'en': 'Search someone by username, or share yours.'},
    'copyUsername': {'fr': 'Copier mon nom d’utilisateur', 'ar': 'نسخ اسم المستخدم', 'en': 'Copy my username'},
    'noRequests': {'fr': 'Aucune demande en attente.', 'ar': 'لا توجد طلبات معلّقة.', 'en': 'No pending requests.'},
})

print('OK — 7 namespaces générés')
