/**
 * ============================================
 * 📱 SubscriptionsScreen.tsx - Salifz
 * ============================================
 * Premium subscription plans
 * ✅ CONVERTED: i18n integration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { subscriptionsAPI } from '../../services/api';
import { useAuthStore } from '../../stores';
import { COLORS } from '../../config';
// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

const LOG_PREFIX = '[SubscriptionsScreen.tsx]';
const { width } = Dimensions.get('window');

console.log(`${LOG_PREFIX} 📁 File loaded`);

interface Plan {
  id: string;
  nameKey: string;        // ✅ Clé i18n
  price: number;
  currency: string;
  periodKey: string;      // ✅ Clé i18n
  featuresKeys: string[]; // ✅ Clés i18n
  isPopular?: boolean;
  savings?: string;
}

interface Feature {
  icon: string;
  textKey: string;        // ✅ Clé i18n
  available: boolean;
}

// ✅ Plans avec clés i18n
const PLANS: Plan[] = [
  {
    id: 'monthly',
    nameKey: 'subscriptions.plans.monthly.name',
    price: 9.99,
    currency: 'USD',
    periodKey: 'subscriptions.plans.monthly.period',
    featuresKeys: [
      'subscriptions.features.unlimitedHearts',
      'subscriptions.features.noAds',
      'subscriptions.features.streakFreeze2',
      'subscriptions.features.progressInsights',
    ],
  },
  {
    id: 'yearly',
    nameKey: 'subscriptions.plans.yearly.name',
    price: 59.99,
    currency: 'USD',
    periodKey: 'subscriptions.plans.yearly.period',
    featuresKeys: [
      'subscriptions.features.everythingMonthly',
      'subscriptions.features.unlimitedStreakFreeze',
      'subscriptions.features.prioritySupport',
      'subscriptions.features.earlyAccess',
      'subscriptions.features.familySharing',
    ],
    isPopular: true,
    savings: '50%',
  },
  {
    id: 'lifetime',
    nameKey: 'subscriptions.plans.lifetime.name',
    price: 149.99,
    currency: 'USD',
    periodKey: 'subscriptions.plans.lifetime.period',
    featuresKeys: [
      'subscriptions.features.everythingYearly',
      'subscriptions.features.oneTimePayment',
      'subscriptions.features.allFutureUpdates',
      'subscriptions.features.vipBadge',
      'subscriptions.features.exclusiveContent',
    ],
  },
];

// ✅ Features avec clés i18n
const FEATURES_FREE: Feature[] = [
  { icon: '❤️', textKey: 'subscriptions.comparison.hearts5Daily', available: true },
  { icon: '📚', textKey: 'subscriptions.comparison.lessonAccess', available: true },
  { icon: '🔥', textKey: 'subscriptions.comparison.streakTracking', available: true },
  { icon: '🏆', textKey: 'subscriptions.comparison.leagues', available: true },
  { icon: '❄️', textKey: 'subscriptions.comparison.streakFreeze', available: false },
  { icon: '📊', textKey: 'subscriptions.comparison.advancedAnalytics', available: false },
  { icon: '🚫', textKey: 'subscriptions.comparison.noAds', available: false },
  { icon: '👨‍👩‍👧‍👦', textKey: 'subscriptions.comparison.familySharing', available: false },
];

const FEATURES_PREMIUM: Feature[] = [
  { icon: '💎', textKey: 'subscriptions.comparison.unlimitedHearts', available: true },
  { icon: '📚', textKey: 'subscriptions.comparison.lessonAccess', available: true },
  { icon: '🔥', textKey: 'subscriptions.comparison.streakTracking', available: true },
  { icon: '🏆', textKey: 'subscriptions.comparison.leagues', available: true },
  { icon: '❄️', textKey: 'subscriptions.comparison.streakFreeze', available: true },
  { icon: '📊', textKey: 'subscriptions.comparison.advancedAnalytics', available: true },
  { icon: '🚫', textKey: 'subscriptions.comparison.noAds', available: true },
  { icon: '👨‍👩‍👧‍👦', textKey: 'subscriptions.comparison.familySharing', available: true },
];

export default function SubscriptionsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component rendering`);
  
  const { user } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<string>('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  const isPremium = user?.subscription?.plan !== 'free' && user?.subscription?.status === 'active';

  useEffect(() => {
    console.log(`${LOG_PREFIX} ⚡ useEffect - Loading subscription`);
    loadCurrentSubscription();
  }, []);

  const loadCurrentSubscription = async () => {
    console.log(`${LOG_PREFIX} 📥 loadCurrentSubscription()`);
    try {
      const response = await subscriptionsAPI.getCurrentSubscription();
      setCurrentSubscription(response.data.subscription);
      console.log(`${LOG_PREFIX} ✅ Subscription loaded:`, response.data.subscription?.plan);
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Load subscription error:`, error);
    }
  };

  const handleSubscribe = async (planId: string) => {
    console.log(`${LOG_PREFIX} 💳 handleSubscribe() - plan: ${planId}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      Alert.alert(
        t('subscriptions.alerts.subscribe'),
        t('subscriptions.alerts.redirectPayment'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.continue'),
            onPress: async () => {
              try {
                console.log(`${LOG_PREFIX} 🌐 API CALL - subscriptionsAPI.subscribe()`);
                await subscriptionsAPI.subscribe(planId, 'app_store');
                Alert.alert(t('common.done'), t('subscriptions.alerts.subscribeSuccess'));
                navigation.goBack();
              } catch (error: any) {
                console.error(`${LOG_PREFIX} ❌ Subscribe error:`, error);
                Alert.alert(t('common.error'), error.error || t('subscriptions.alerts.subscribeFailed'));
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error(`${LOG_PREFIX} ❌ Error:`, error);
      Alert.alert(t('common.error'), error.error || t('common.errorOccurred'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    console.log(`${LOG_PREFIX} 🔄 handleRestore()`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLoading(true);

    try {
      await subscriptionsAPI.restore();
      Alert.alert(t('common.done'), t('subscriptions.alerts.restoreSuccess'));
      await loadCurrentSubscription();
    } catch (error: any) {
      console.error(`${LOG_PREFIX} ❌ Restore error:`, error);
      Alert.alert(t('common.error'), error.error || t('subscriptions.alerts.restoreFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    console.log(`${LOG_PREFIX} ❌ handleCancel()`);
    Alert.alert(
      t('subscriptions.alerts.cancelTitle'),
      t('subscriptions.alerts.cancelConfirm'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('subscriptions.alerts.yesCancel'),
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`${LOG_PREFIX} 🌐 API CALL - subscriptionsAPI.cancel()`);
              await subscriptionsAPI.cancel();
              Alert.alert(t('common.done'), t('subscriptions.alerts.cancelSuccess'));
              await loadCurrentSubscription();
            } catch (error: any) {
              console.error(`${LOG_PREFIX} ❌ Cancel error:`, error);
              Alert.alert(t('common.error'), error.error || t('subscriptions.alerts.cancelFailed'));
            }
          },
        },
      ]
    );
  };

  // ✅ Helper pour obtenir le nom du plan traduit
  const getPlanDisplayName = (planId: string): string => {
    switch (planId) {
      case 'lifetime': return t('subscriptions.plans.lifetime.name');
      case 'yearly': return t('subscriptions.plans.yearly.name');
      case 'monthly': return t('subscriptions.plans.monthly.name');
      default: return planId;
    }
  };

  const renderPlanCard = (plan: Plan) => {
    const isSelected = selectedPlan === plan.id;

    return (
      <TouchableOpacity accessible accessibilityRole="button"
        key={plan.id}
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
          plan.isPopular && styles.planCardPopular,
        ]}
        onPress={() => {
          console.log(`${LOG_PREFIX} 👆 Plan selected: ${plan.id}`);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedPlan(plan.id);
        }}
      >
        {plan.isPopular && (
          <View style={styles.popularBadge}>
            {/* ✅ AVANT: 'الأكثر شعبية' */}
            <Text style={styles.popularText}>{t('subscriptions.mostPopular')}</Text>
          </View>
        )}

        {plan.savings && (
          <View style={styles.savingsBadge}>
            {/* ✅ AVANT: 'وفر {X}%' */}
            <Text style={styles.savingsText}>
              {t('subscriptions.save', { percent: plan.savings })}
            </Text>
          </View>
        )}

        {/* ✅ AVANT: plan.nameAr */}
        <Text style={styles.planName}>{t(plan.nameKey)}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${plan.price}</Text>
          {/* ✅ AVANT: /{plan.periodAr} */}
          <Text style={styles.period}>/{t(plan.periodKey)}</Text>
        </View>

        <View style={styles.featuresContainer}>
          {plan.featuresKeys.map((featureKey, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              {/* ✅ AVANT: feature hardcodé */}
              <Text style={styles.featureText}>{t(featureKey)}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </TouchableOpacity>
    );
  };

  // ✅ Vue Premium (utilisateur déjà abonné)
  if (isPremium) {
    console.log(`${LOG_PREFIX} 🎨 Rendering Premium view`);
    return (
      <View style={styles.container}>
        <LinearGradient colors={[colors.accentDeep, colors.accentDeep]} style={styles.header}>
          <TouchableOpacity accessible accessibilityRole="button" style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          {/* ✅ AVANT: 'اشتراكي' */}
          <Text style={styles.headerTitle}>{t('subscriptions.mySubscription')}</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.premiumContent}>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumIcon}>👑</Text>
            {/* ✅ AVANT: 'أنت مشترك!' */}
            <Text style={styles.premiumTitle}>{t('subscriptions.youAreSubscribed')}</Text>
            <Text style={styles.premiumPlan}>
              {getPlanDisplayName(currentSubscription?.plan)}
            </Text>
          </View>

          <View style={styles.featuresSection}>
            {/* ✅ AVANT: 'المميزات المتاحة' */}
            <Text style={styles.featuresSectionTitle}>
              {t('subscriptions.availableFeatures')}
            </Text>
            {FEATURES_PREMIUM.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                {/* ✅ AVANT: feature.text */}
                <Text style={styles.featureLabel}>{t(feature.textKey)}</Text>
                <Text style={styles.featureStatus}>✓</Text>
              </View>
            ))}
          </View>

          {currentSubscription?.plan !== 'lifetime' && (
            <TouchableOpacity accessible accessibilityRole="button" style={styles.cancelButton} onPress={handleCancel}>
              {/* ✅ AVANT: 'إلغاء الاشتراك' */}
              <Text style={styles.cancelButtonText}>
                {t('subscriptions.cancelSubscription')}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  }

  // ✅ Vue normale (non abonné)
  console.log(`${LOG_PREFIX} 🎨 Rendering Free view`);
  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <TouchableOpacity accessible accessibilityRole="button" style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Salifz Plus</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroIcon}>👑</Text>
          {/* ✅ AVANT: 'احفظ القرآن بدون حدود' */}
          <Text style={styles.heroTitle}>{t('subscriptions.hero.title')}</Text>
          {/* ✅ AVANT: 'اشترك في Salifz Plus واحصل على كل المميزات' */}
          <Text style={styles.heroSubtitle}>{t('subscriptions.hero.subtitle')}</Text>
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {PLANS.map(renderPlanCard)}
        </View>

        {/* Features Comparison */}
        <View style={styles.comparisonSection}>
          {/* ✅ AVANT: 'مقارنة المميزات' */}
          <Text style={styles.comparisonTitle}>{t('subscriptions.comparison.title')}</Text>
          
          <View style={styles.comparisonHeader}>
            {/* ✅ AVANT: 'الميزة' / 'مجاني' / 'Plus' */}
            <Text style={styles.comparisonHeaderText}>{t('subscriptions.comparison.feature')}</Text>
            <Text style={styles.comparisonHeaderText}>{t('subscriptions.comparison.free')}</Text>
            <Text style={styles.comparisonHeaderText}>Plus</Text>
          </View>

          {FEATURES_FREE.map((feature, index) => (
            <View key={index} style={styles.comparisonRow}>
              <View style={styles.comparisonFeature}>
                <Text style={styles.comparisonIcon}>{feature.icon}</Text>
                {/* ✅ AVANT: feature.text */}
                <Text style={styles.comparisonText}>{t(feature.textKey)}</Text>
              </View>
              <Text style={styles.comparisonCheck}>
                {feature.available ? '✓' : '✗'}
              </Text>
              <Text style={[styles.comparisonCheck, styles.comparisonCheckPremium]}>
                ✓
              </Text>
            </View>
          ))}
        </View>

        {/* Subscribe Button */}
        <TouchableOpacity accessible accessibilityRole="button"
          style={styles.subscribeButton}
          onPress={() => handleSubscribe(selectedPlan)}
          disabled={isLoading}
        >
          <LinearGradient
            colors={[colors.accentDeep, colors.accentDeep]}
            style={styles.subscribeButtonGradient}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.onDeep} />
            ) : (
              // ✅ AVANT: 'اشترك الآن'
              <Text style={styles.subscribeButtonText}>
                {t('subscriptions.subscribeNow')}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Restore */}
        <TouchableOpacity accessible accessibilityRole="button" style={styles.restoreButton} onPress={handleRestore}>
          {/* ✅ AVANT: 'استعادة المشتريات' */}
          <Text style={styles.restoreButtonText}>
            {t('subscriptions.restorePurchases')}
          </Text>
        </TouchableOpacity>

        {/* Terms */}
        {/* ✅ AVANT: Texte hardcodé */}
        <Text style={styles.termsText}>{t('subscriptions.terms')}</Text>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: c.onDeep,
    fontSize: 24,
  },
  headerTitle: {
    color: c.onDeep,
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  heroIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: c.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: c.textSecondary,
    textAlign: 'center',
  },
  plansContainer: {
    marginBottom: 30,
  },
  planCard: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: c.border,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: c.primary,
  },
  planCardPopular: {
    borderColor: c.accentDeep,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: c.accentDeep,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: c.onDeep,
    fontSize: 12,
    fontWeight: 'bold',
  },
  savingsBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: c.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    color: c.onDeep,
    fontSize: 12,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: c.text,
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 15,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: c.primary,
  },
  period: {
    fontSize: 14,
    color: c.textSecondary,
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureCheck: {
    color: c.primary,
    fontSize: 14,
    marginRight: 8,
  },
  featureText: {
    color: c.textSecondary,
    fontSize: 13,
  },
  radioOuter: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: c.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: c.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: c.primary,
  },
  comparisonSection: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: c.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  comparisonHeader: {
    flexDirection: 'row',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    marginBottom: 10,
  },
  comparisonHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    color: c.textSecondary,
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: c.background,
  },
  comparisonFeature: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  comparisonText: {
    fontSize: 12,
    color: c.text,
  },
  comparisonCheck: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: c.textMuted,
  },
  comparisonCheckPremium: {
    color: c.primary,
  },
  subscribeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 15,
  },
  subscribeButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: c.onDeep,
    fontSize: 18,
    fontWeight: 'bold',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  restoreButtonText: {
    color: c.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 11,
    color: c.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  premiumContent: {
    padding: 20,
  },
  premiumBadge: {
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: 20,
    padding: 30,
    marginBottom: 20,
  },
  premiumIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: c.accentDeep,
    marginBottom: 5,
  },
  premiumPlan: {
    fontSize: 16,
    color: c.textSecondary,
  },
  featuresSection: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  featuresSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: c.text,
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.background,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureLabel: {
    flex: 1,
    fontSize: 14,
    color: c.text,
  },
  featureStatus: {
    fontSize: 16,
    color: c.primary,
  },
  cancelButton: {
    backgroundColor: c.errorSoft,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: c.error,
    fontWeight: '600',
  },
});