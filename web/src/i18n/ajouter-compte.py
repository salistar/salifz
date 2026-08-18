# -*- coding: utf-8 -*-
"""Cles du lot Compte : profil, reglages, abonnement, boutique, notifications.

Meme regle que les autres generateurs : les trois langues ou rien. Une cle
presente en francais et absente en arabe ne casse rien a la compilation, elle
fait juste apparaitre une phrase francaise au milieu d'une page arabe.
"""
import io
import json
import os
import sys

LOTS = {
    'profile': {
        'fr': {
            'gems': u"Gemmes",
            'hearts': u"Coeurs",
            'verses': u"Versets",
            'streak': u"Serie",
            'noHalaqat': u"Vous n'appartenez a aucun cercle pour l'instant.",
            'noAchievements': u"Vos premiers succes apparaitront apres quelques jours de pratique.",
            'goToSettings': u"Reglages",
            'joined': u"Inscrit le {{date}}",
            'progression': u"Progression",
            'community': u"Communaute",
            'ofQuran': u"du Coran memorise",
        },
        'en': {
            'gems': u"Gems",
            'hearts': u"Hearts",
            'verses': u"Verses",
            'streak': u"Streak",
            'noHalaqat': u"You are not in any circle yet.",
            'noAchievements': u"Your first achievements appear after a few days of practice.",
            'goToSettings': u"Settings",
            'joined': u"Joined {{date}}",
            'progression': u"Progress",
            'community': u"Community",
            'ofQuran': u"of the Quran memorised",
        },
        'ar': {
            'gems': u"جواهر",
            'hearts': u"قلوب",
            'verses': u"آيات",
            'streak': u"السلسلة",
            'noHalaqat': u"لست في أي حلقة بعد.",
            'noAchievements': u"تظهر إنجازاتك الأولى بعد أيام من الممارسة.",
            'goToSettings': u"الإعدادات",
            'joined': u"انضم في {{date}}",
            'progression': u"التقدم",
            'community': u"المجتمع",
            'ofQuran': u"من القرآن محفوظ",
        },
    },
    'settings': {
        'fr': {
            'interfaceLanguage': u"Langue de l'interface",
            'saveError': u"Enregistrement impossible",
            'resetDone': u"Reglages reinitialises",
            'exportError': u"Export impossible",
            'deleteWarning': u"Cette action est definitive : compte, progression et recitations sont effaces.",
            'deleteFinal': u"Supprimer definitivement",
            'passwordPlaceholder': u"Confirmez avec votre mot de passe",
            'deleteError': u"Suppression impossible",
            'sizeSmall': u"Petite",
            'sizeMedium': u"Moyenne",
            'sizeLarge': u"Grande",
            'reviewSpaced': u"Repetition espacee",
            'reviewSequential': u"Sequentiel",
            'reviewRandom': u"Aleatoire",
            'translationLanguage': u"Langue de traduction",
            'hintTheme': u"Partage avec l'application mobile.",
            'hintAutoPlay': u"Enchainer le verset suivant.",
            'hintRepeat': u"Nombre d'ecoutes par verset (1 a 20).",
            'hintGoal': u"Versets par jour (1 a 50).",
            'hintReview': u"Le mode espace suit l'oubli plutot que l'ordre.",
            'hintStreak': u"Prevenir avant de perdre la serie.",
            'hintLanguage': u"L'arabe fait passer l'interface de droite a gauche.",
        },
        'en': {
            'interfaceLanguage': u"Interface language",
            'saveError': u"Could not save",
            'resetDone': u"Settings reset",
            'exportError': u"Export failed",
            'deleteWarning': u"This is permanent: account, progress and recitations are erased.",
            'deleteFinal': u"Delete permanently",
            'passwordPlaceholder': u"Confirm with your password",
            'deleteError': u"Could not delete",
            'sizeSmall': u"Small",
            'sizeMedium': u"Medium",
            'sizeLarge': u"Large",
            'reviewSpaced': u"Spaced repetition",
            'reviewSequential': u"Sequential",
            'reviewRandom': u"Random",
            'translationLanguage': u"Translation language",
            'hintTheme': u"Shared with the mobile app.",
            'hintAutoPlay': u"Continue to the next verse.",
            'hintRepeat': u"Listens per verse (1 to 20).",
            'hintGoal': u"Verses per day (1 to 50).",
            'hintReview': u"Spaced mode follows forgetting rather than order.",
            'hintStreak': u"Warn before the streak is lost.",
            'hintLanguage': u"Arabic switches the interface to right-to-left.",
        },
        'ar': {
            'interfaceLanguage': u"لغة الواجهة",
            'saveError': u"تعذر الحفظ",
            'resetDone': u"تمت إعادة ضبط الإعدادات",
            'exportError': u"تعذر التصدير",
            'deleteWarning': u"هذا الإجراء نهائي: يُمحى الحساب والتقدم والتلاوات.",
            'deleteFinal': u"حذف نهائي",
            'passwordPlaceholder': u"أكّد بكلمة المرور",
            'deleteError': u"تعذر الحذف",
            'sizeSmall': u"صغير",
            'sizeMedium': u"متوسط",
            'sizeLarge': u"كبير",
            'reviewSpaced': u"تكرار متباعد",
            'reviewSequential': u"متسلسل",
            'reviewRandom': u"عشوائي",
            'translationLanguage': u"لغة الترجمة",
            'hintTheme': u"مشترك مع تطبيق الهاتف.",
            'hintAutoPlay': u"الانتقال إلى الآية التالية.",
            'hintRepeat': u"عدد مرات الاستماع لكل آية (1 إلى 20).",
            'hintGoal': u"آيات في اليوم (1 إلى 50).",
            'hintReview': u"الوضع المتباعد يتبع النسيان لا الترتيب.",
            'hintStreak': u"التنبيه قبل فقدان السلسلة.",
            'hintLanguage': u"العربية تجعل الواجهة من اليمين إلى اليسار.",
        },
    },
    'subscription': {
        'fr': {
            'benefits': u"Ce que la formule apporte",
            'plan': u"Formule",
            'whyNoPayment': u"Aucun paiement ne part de cette page : les deux boutiques exigent que les contenus numeriques passent par leur facturation, et le serveur n'accorde une formule qu'apres avoir valide le recu.",
        },
        'en': {
            'benefits': u"What the plan includes",
            'plan': u"Plan",
            'whyNoPayment': u"No payment leaves this page: both stores require digital content to go through their billing, and the server grants a plan only after validating the receipt.",
        },
        'ar': {
            'benefits': u"ما توفره الخطة",
            'plan': u"الخطة",
            'whyNoPayment': u"لا يتم أي دفع من هذه الصفحة: يشترط المتجران مرور المحتوى الرقمي عبر نظام الفوترة لديهما، ولا يمنح الخادم الخطة إلا بعد التحقق من الإيصال.",
        },
    },
    'shop': {
        'fr': {
            'all': u"Tout",
            'item': u"Article",
            'buying': u"Achat",
            'purchased': u"{{item}} achete",
            'rewardClaimed': u"Recompense quotidienne recuperee",
            'buyError': u"Achat impossible",
            'earnHint': u"Les gemmes se gagnent par la pratique : objectifs du jour, jalons de serie et defis.",
            'balanceLabel': u"Solde",
        },
        'en': {
            'all': u"All",
            'item': u"Item",
            'buying': u"Buying",
            'purchased': u"{{item}} purchased",
            'rewardClaimed': u"Daily reward claimed",
            'buyError': u"Purchase failed",
            'earnHint': u"Gems are earned through practice: daily goals, streak milestones and challenges.",
            'balanceLabel': u"Balance",
        },
        'ar': {
            'all': u"الكل",
            'item': u"عنصر",
            'buying': u"جارٍ الشراء",
            'purchased': u"تم شراء {{item}}",
            'rewardClaimed': u"تم استلام المكافأة اليومية",
            'buyError': u"تعذر الشراء",
            'earnHint': u"تُكتسب الجواهر بالممارسة: أهداف اليوم ومراحل السلسلة والتحديات.",
            'balanceLabel': u"الرصيد",
        },
    },
    'notifications': {
        'fr': {
            'notification': u"Notification",
            'thisWeek': u"Cette semaine",
            'unread': u"{{count}} non lues",
        },
        'en': {
            'notification': u"Notification",
            'thisWeek': u"This week",
            'unread': u"{{count}} unread",
        },
        'ar': {
            'notification': u"إشعار",
            'thisWeek': u"هذا الأسبوع",
            'unread': u"{{count}} غير مقروء",
        },
    },
}


def main():
    for ns, langues in LOTS.items():
        base = set(langues['fr'])
        for lg, d in langues.items():
            if set(d) != base:
                sys.exit(u"cles divergentes : %s / %s -> %s" % (ns, lg, base ^ set(d)))

        for lg, ajout in langues.items():
            chemin = os.path.join('locales', lg, ns + '.json')
            with io.open(chemin, encoding='utf-8') as f:
                data = json.load(f)
            data.update(ajout)
            with io.open(chemin, 'w', encoding='utf-8') as f:
                f.write(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True))
                f.write(u'\n')

        print(u'%-14s : %d cles ajoutees dans fr, en et ar' % (ns, len(base)))


if __name__ == '__main__':
    main()
