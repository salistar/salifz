/**
 * Subscriptions Screen - Salifz
 * Premium subscription plans
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

const { width } = Dimensions.get('window');

interface Plan {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  currency: string;
  period: string;
  periodAr: string;
  features: string[];
  featuresAr: string[];
  isPopular?: boolean;
  savings?: string;
}

const PLANS: Plan[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    nameAr: 'شهري',
    price: 9.99,
    currency: 'USD',
    period: 'month',
    periodAr: 'شهر',
    features: [
      'Unlimited hearts',
      'No ads',
      'Streak freeze (2/month)',
      'Progress insights',
    ],
    featuresAr: [
      'قلوب غير محدودة',
      'بدون إعلانات',
      'تجميد السلسلة (2/شهر)',
      'تحليلات التقدم',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    nameAr: 'سنوي',
    price: 59.99,
    currency: 'USD',
    period: 'year',
    periodAr: 'سنة',
    features: [
      'Everything in Monthly',
      'Unlimited streak freezes',
      'Priority support',
      'Early access to features',
      'Family sharing (up to 6)',
    ],
    featuresAr: [
      'كل مميزات الشهري',
      'تجميد سلسلة غير محدود',
      'دعم أولوية',
      'وصول مبكر للميزات',
      'مشاركة عائلية (حتى 6)',
    ],
    isPopular: true,
    savings: '50%',
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    nameAr: 'مدى الحياة',
    price: 149.99,
    currency: 'USD',
    period: 'lifetime',
    periodAr: 'دائم',
    features: [
      'Everything in Yearly',
      'One-time payment',
      'All future updates',
      'VIP badge',
      'Exclusive content',
    ],
    featuresAr: [
      'كل مميزات السنوي',
      'دفعة واحدة فقط',
      'كل التحديثات المستقبلية',
      'شارة VIP',
      'محتوى حصري',
    ],
  },
];

const FEATURES_FREE = [
  { icon: '❤️', text: '5 قلوب يومياً', available: true },
  { icon: '📚', text: 'الوصول للدروس', available: true },
  { icon: '🔥', text: 'تتبع السلسلة', available: true },
  { icon: '🏆', text: 'الدوريات', available: true },
  { icon: '❄️', text: 'تجميد السلسلة', available: false },
  { icon: '📊', text: 'التحليلات المتقدمة', available: false },
  { icon: '🚫', text: 'بدون إعلانات', available: false },
  { icon: '👨‍👩‍👧‍👦', text: 'المشاركة العائلية', available: false },
];

const FEATURES_PREMIUM = [
  { icon: '💎', text: 'قلوب غير محدودة', available: true },
  { icon: '📚', text: 'الوصول للدروس', available: true },
  { icon: '🔥', text: 'تتبع السلسلة', available: true },
  { icon: '🏆', text: 'الدوريات', available: true },
  { icon: '❄️', text: 'تجميد السلسلة', available: true },
  { icon: '📊', text: 'التحليلات المتقدمة', available: true },
  { icon: '🚫', text: 'بدون إعلانات', available: true },
  { icon: '👨‍👩‍👧‍👦', text: 'المشاركة العائلية', available: true },
];

export default function SubscriptionsScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<string>('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  const isPremium = user?.subscription?.plan !== 'free' && user?.subscription?.status === 'active';

  useEffect(() => {
    loadCurrentSubscription();
  }, []);

  const loadCurrentSubscription = async () => {
    try {
      const response = await subscriptionsAPI.getCurrentSubscription();
      setCurrentSubscription(response.data.subscription);
    } catch (error) {
      console.error('Load subscription error:', error);
    }
  };

  const handleSubscribe = async (planId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      // In a real app, this would integrate with App Store / Google Play
      Alert.alert(
        'اشتراك',
        'سيتم توجيهك لإتمام الدفع',
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'متابعة',
            onPress: async () => {
              try {
                await subscriptionsAPI.subscribe(planId, 'app_store');
                Alert.alert('تم', 'تم الاشتراك بنجاح!');
                navigation.goBack();
              } catch (error: any) {
                Alert.alert('خطأ', error.error || 'فشل في الاشتراك');
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('خطأ', error.error || 'حدث خطأ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLoading(true);

    try {
      await subscriptionsAPI.restore();
      Alert.alert('تم', 'تم استعادة المشتريات بنجاح');
      await loadCurrentSubscription();
    } catch (error: any) {
      Alert.alert('خطأ', error.error || 'لم يتم العثور على مشتريات سابقة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    Alert.alert(
      'إلغاء الاشتراك',
      'هل أنت متأكد؟ ستفقد جميع المميزات المدفوعة',
      [
        { text: 'لا', style: 'cancel' },
        {
          text: 'نعم، إلغاء',
          style: 'destructive',
          onPress: async () => {
            try {
              await subscriptionsAPI.cancel();
              Alert.alert('تم', 'تم إلغاء الاشتراك');
              await loadCurrentSubscription();
            } catch (error: any) {
              Alert.alert('خطأ', error.error || 'فشل في إلغاء الاشتراك');
            }
          },
        },
      ]
    );
  };

  const renderPlanCard = (plan: Plan) => {
    const isSelected = selectedPlan === plan.id;

    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
          plan.isPopular && styles.planCardPopular,
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedPlan(plan.id);
        }}
      >
        {plan.isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>الأكثر شعبية</Text>
          </View>
        )}

        {plan.savings && (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>وفر {plan.savings}</Text>
          </View>
        )}

        <Text style={styles.planName}>{plan.nameAr}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${plan.price}</Text>
          <Text style={styles.period}>/{plan.periodAr}</Text>
        </View>

        <View style={styles.featuresContainer}>
          {plan.featuresAr.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </TouchableOpacity>
    );
  };

  if (isPremium) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#9C27B0', '#7B1FA2']} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>اشتراكي</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.premiumContent}>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumIcon}>👑</Text>
            <Text style={styles.premiumTitle}>أنت مشترك!</Text>
            <Text style={styles.premiumPlan}>
              {currentSubscription?.plan === 'lifetime' ? 'مدى الحياة' : 
               currentSubscription?.plan === 'yearly' ? 'سنوي' : 'شهري'}
            </Text>
          </View>

          <View style={styles.featuresSection}>
            <Text style={styles.featuresSectionTitle}>المميزات المتاحة</Text>
            {FEATURES_PREMIUM.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={styles.featureLabel}>{feature.text}</Text>
                <Text style={styles.featureStatus}>✓</Text>
              </View>
            ))}
          </View>

          {currentSubscription?.plan !== 'lifetime' && (
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>إلغاء الاشتراك</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sally Plus</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroIcon}>👑</Text>
          <Text style={styles.heroTitle}>احفظ القرآن بدون حدود</Text>
          <Text style={styles.heroSubtitle}>
            اشترك في Sally Plus واحصل على كل المميزات
          </Text>
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {PLANS.map(renderPlanCard)}
        </View>

        {/* Features Comparison */}
        <View style={styles.comparisonSection}>
          <Text style={styles.comparisonTitle}>مقارنة المميزات</Text>
          
          <View style={styles.comparisonHeader}>
            <Text style={styles.comparisonHeaderText}>الميزة</Text>
            <Text style={styles.comparisonHeaderText}>مجاني</Text>
            <Text style={styles.comparisonHeaderText}>Plus</Text>
          </View>

          {FEATURES_FREE.map((feature, index) => (
            <View key={index} style={styles.comparisonRow}>
              <View style={styles.comparisonFeature}>
                <Text style={styles.comparisonIcon}>{feature.icon}</Text>
                <Text style={styles.comparisonText}>{feature.text}</Text>
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
        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={() => handleSubscribe(selectedPlan)}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#9C27B0', '#7B1FA2']}
            style={styles.subscribeButtonGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.subscribeButtonText}>اشترك الآن</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Restore */}
        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
          <Text style={styles.restoreButtonText}>استعادة المشتريات</Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.termsText}>
          بالاشتراك، أنت توافق على شروط الاستخدام وسياسة الخصوصية.
          يتم تجديد الاشتراك تلقائياً ما لم يتم إلغاؤه قبل 24 ساعة من انتهاء الفترة الحالية.
        </Text>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    color: '#fff',
    fontSize: 24,
  },
  headerTitle: {
    color: '#fff',
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
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  plansContainer: {
    marginBottom: 30,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: COLORS.primary,
  },
  planCardPopular: {
    borderColor: '#9C27B0',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#9C27B0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  savingsBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
    color: COLORS.primary,
  },
  period: {
    fontSize: 14,
    color: '#666',
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
    color: COLORS.primary,
    fontSize: 14,
    marginRight: 8,
  },
  featureText: {
    color: '#666',
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
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  comparisonSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  comparisonHeader: {
    flexDirection: 'row',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 10,
  },
  comparisonHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
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
    color: '#333',
  },
  comparisonCheck: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
  },
  comparisonCheckPremium: {
    color: COLORS.primary,
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
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  restoreButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  premiumContent: {
    padding: 20,
  },
  premiumBadge: {
    alignItems: 'center',
    backgroundColor: '#fff',
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
    color: '#9C27B0',
    marginBottom: 5,
  },
  premiumPlan: {
    fontSize: 16,
    color: '#666',
  },
  featuresSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  featuresSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  featureStatus: {
    fontSize: 16,
    color: COLORS.primary,
  },
  cancelButton: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#F44336',
    fontWeight: '600',
  },
});