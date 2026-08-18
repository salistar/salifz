"""Génère le namespace `nav` et complète `common`."""

import io
import json

LANGUES = ('fr', 'ar', 'en')


def ecrire(ns, table, fusionner=False):
    for lg in LANGUES:
        manquantes = [c for c, t in table.items() if not t.get(lg)]
        if manquantes:
            raise SystemExit(f'{ns}/{lg} : sans traduction — {manquantes}')
        chemin = f'locales/{lg}/{ns}.json'
        obj = {}
        if fusionner:
            try:
                obj = json.load(io.open(chemin, encoding='utf-8'))
            except FileNotFoundError:
                pass
        obj.update({c: t[lg] for c, t in table.items()})
        io.open(chemin, 'w', encoding='utf-8').write(
            json.dumps(obj, ensure_ascii=False, indent=2, sort_keys=True) + '\n'
        )


# Les libellés de navigation vivent à part : ils apparaissent dans la barre
# latérale, la barre d'onglets mobile et les fils d'Ariane. Un seul endroit.
ecrire('nav', {
    'home': {'fr': 'Accueil', 'ar': 'الرئيسية', 'en': 'Home'},
    'lessons': {'fr': 'Leçons', 'ar': 'الدروس', 'en': 'Lessons'},
    'review': {'fr': 'Révision', 'ar': 'المراجعة', 'en': 'Review'},
    'mushaf': {'fr': 'Mushaf', 'ar': 'المصحف', 'en': 'Mushaf'},
    'daily': {'fr': 'Verset du jour', 'ar': 'آية اليوم', 'en': 'Verse of the day'},
    'halaqat': {'fr': 'Halaqat', 'ar': 'الحلقات', 'en': 'Halaqat'},
    'khatam': {'fr': 'Khatam', 'ar': 'الختمة', 'en': 'Khatam'},
    'friends': {'fr': 'Amis', 'ar': 'الأصدقاء', 'en': 'Friends'},
    'recitations': {'fr': 'Récitations', 'ar': 'التلاوات', 'en': 'Recitations'},
    'leaderboard': {'fr': 'Classement', 'ar': 'الترتيب', 'en': 'Leaderboard'},
    'challenges': {'fr': 'Défis', 'ar': 'التحديات', 'en': 'Challenges'},
    'streak': {'fr': 'Série', 'ar': 'المواظبة', 'en': 'Streak'},
    'stats': {'fr': 'Statistiques', 'ar': 'الإحصائيات', 'en': 'Statistics'},
    'shop': {'fr': 'Boutique', 'ar': 'المتجر', 'en': 'Shop'},
    'prayer': {'fr': 'Prière & Qibla', 'ar': 'الصلاة والقبلة', 'en': 'Prayer & Qibla'},
    'notifications': {'fr': 'Notifications', 'ar': 'الإشعارات', 'en': 'Notifications'},
    'subscription': {'fr': 'Abonnement', 'ar': 'الاشتراك', 'en': 'Subscription'},
    'profile': {'fr': 'Profil', 'ar': 'الملف الشخصي', 'en': 'Profile'},
    'settings': {'fr': 'Réglages', 'ar': 'الإعدادات', 'en': 'Settings'},
})

# Complète `common` sans écraser ce qui existe.
ecrire('common', {
    'showNavigation': {'fr': 'Afficher la navigation', 'ar': 'إظهار التنقّل', 'en': 'Show navigation'},
    'mainNavigation': {'fr': 'Navigation principale', 'ar': 'التنقّل الرئيسي', 'en': 'Main navigation'},
    'privacy': {'fr': 'Confidentialité', 'ar': 'الخصوصية', 'en': 'Privacy'},
    'empty': {'fr': 'Rien à afficher', 'ar': 'لا شيء لعرضه', 'en': 'Nothing to show'},
    'errorGeneric': {'fr': 'Une erreur est survenue.', 'ar': 'حدث خطأ.', 'en': 'Something went wrong.'},
}, fusionner=True)

print('OK — nav généré, common complété')
