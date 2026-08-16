/**
 * KhatamScreen.tsx - Salifz
 * ✅ COMPLETE: Khatam Quran feature
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const { width } = Dimensions.get('window');

interface Khatam {
  _id: string;
  title: string;
  description?: string;
  type: 'solo' | 'group';
  readingMode: 'offline' | 'realtime';
  readingConfig: {
    unit: 'eighth' | 'quarter' | 'half' | 'hizb' | 'juz';
    amountPerDay: number;
    targetDays: number;
    isInfinite: boolean;
  };
  progress: {
    currentKhatamProgress: number;
    completedKhatamCount: number;
  };
  stats: {
    totalParticipants: number;
  };
  status: string;
  dashboard?: any;
}

const KhatamScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const isRTL = i18n.language === 'ar';
  
  const [khatams, setKhatams] = useState<Khatam[]>([]);
  const [publicKhatams, setPublicKhatams] = useState<Khatam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'my' | 'discover'>('my');
  
  // Create form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'solo' as 'solo' | 'group',
    readingMode: 'offline' as 'offline' | 'realtime',
    unit: 'hizb' as string,
    amountPerDay: 1,
    isInfinite: false,
  });

  useEffect(() => {
    console.log('[KhatamScreen] 🕌 Component mounted');
    fetchKhatams();
  }, []);

  const fetchKhatams = async () => {
    console.log('[KhatamScreen] 📡 Fetching khatams...');
    try {
      const [myRes, publicRes] = await Promise.all([
        api.get('/khatam/my'),
        api.get('/khatam/discover')
      ]);
      
      setKhatams(myRes.data.data || []);
      setPublicKhatams(publicRes.data.data || []);
      console.log('[KhatamScreen] ✅ Loaded', myRes.data.data?.length, 'personal khatams');
    } catch (error) {
      console.error('[KhatamScreen] ❌ Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchKhatams();
  }, []);

  const handleCreateKhatam = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    
    console.log('[KhatamScreen] 📝 Creating khatam:', formData);
    
    try {
      const response = await api.post('/khatam', {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        readingMode: formData.readingMode,
        readingConfig: {
          unit: formData.unit,
          amountPerDay: formData.amountPerDay,
          isInfinite: formData.isInfinite,
        },
        settings: {
          isPublic: formData.type === 'group',
        }
      });
      
      console.log('[KhatamScreen] ✅ Khatam created:', response.data.data._id);
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        type: 'solo',
        readingMode: 'offline',
        unit: 'hizb',
        amountPerDay: 1,
        isInfinite: false,
      });
      fetchKhatams();
      
      // Navigate to detail
      navigation.navigate('KhatamDetail', { khatamId: response.data.data._id });
    } catch (error: any) {
      console.error('[KhatamScreen] ❌ Create error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to create khatam');
    }
  };

  const renderKhatamCard = ({ item }: { item: Khatam }) => {
    const progress = item.dashboard?.progress?.percentage || item.progress?.currentKhatamProgress || 0;
    
    return (
      <TouchableOpacity
        style={styles.khatamCard}
        onPress={() => navigation.navigate('KhatamDetail', { khatamId: item._id })}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={item.type === 'group' ? ['#667eea', '#764ba2'] : ['#11998e', '#38ef7d']}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons 
                name={item.type === 'group' ? 'people' : 'person'} 
                size={20} 
                color="#fff" 
              />
              <Text style={[styles.cardTitle, isRTL && styles.rtlText]}>{item.title}</Text>
            </View>
            <View style={styles.modeBadge}>
              <Ionicons 
                name={item.readingMode === 'realtime' ? 'videocam' : 'book'} 
                size={14} 
                color="#fff" 
              />
              <Text style={styles.modeText}>
                {item.readingMode === 'realtime' ? 'Live' : 'Offline'}
              </Text>
            </View>
          </View>
          
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
          
          <View style={styles.cardFooter}>
            <View style={styles.statItem}>
              <Ionicons name="book-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.statText}>
                {item.readingConfig?.amountPerDay || 1} {item.readingConfig?.unit || 'hizb'}/day
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.statText}>
                {item.stats?.totalParticipants || 1} {item.type === 'group' ? 'participants' : ''}
              </Text>
            </View>
            {item.readingConfig?.isInfinite && (
              <View style={styles.infiniteBadge}>
                <Ionicons name="infinite" size={14} color="#fff" />
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderUnitOption = (unit: string, label: string, labelAr: string) => (
    <TouchableOpacity
      key={unit}
      style={[
        styles.unitOption,
        formData.unit === unit && styles.unitOptionActive
      ]}
      onPress={() => setFormData({ ...formData, unit })}
    >
      <Text style={[
        styles.unitOptionText,
        formData.unit === unit && styles.unitOptionTextActive
      ]}>
        {isRTL ? labelAr : label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading Khatams...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isRTL ? 'ختم القرآن' : 'Khatam Quran'}
        </Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.tabActive]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
            {isRTL ? 'ختماتي' : 'My Khatams'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && styles.tabActive]}
          onPress={() => setActiveTab('discover')}
        >
          <Text style={[styles.tabText, activeTab === 'discover' && styles.tabTextActive]}>
            {isRTL ? 'اكتشف' : 'Discover'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={activeTab === 'my' ? khatams : publicKhatams}
        renderItem={renderKhatamCard}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {activeTab === 'my' 
                ? (isRTL ? 'لا توجد ختمات بعد' : 'No khatams yet')
                : (isRTL ? 'لا توجد ختمات عامة' : 'No public khatams')
              }
            </Text>
            {activeTab === 'my' && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.createButtonText}>
                  {isRTL ? 'ابدأ ختمة جديدة' : 'Start New Khatam'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {isRTL ? 'ختمة جديدة' : 'New Khatam'}
              </Text>
              
              {/* Title */}
              <Text style={styles.inputLabel}>{isRTL ? 'العنوان' : 'Title'}</Text>
              <TextInput
                style={[styles.input, isRTL && styles.rtlInput]}
                placeholder={isRTL ? 'مثال: ختمة رمضان' : 'e.g., Ramadan Khatam'}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                textAlign={isRTL ? 'right' : 'left'}
              />
              
              {/* Description */}
              <Text style={styles.inputLabel}>{isRTL ? 'الوصف' : 'Description'}</Text>
              <TextInput
                style={[styles.input, styles.textArea, isRTL && styles.rtlInput]}
                placeholder={isRTL ? 'وصف اختياري...' : 'Optional description...'}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
                textAlign={isRTL ? 'right' : 'left'}
              />
              
              {/* Type */}
              <Text style={styles.inputLabel}>{isRTL ? 'النوع' : 'Type'}</Text>
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[styles.typeButton, formData.type === 'solo' && styles.typeButtonActive]}
                  onPress={() => setFormData({ ...formData, type: 'solo' })}
                >
                  <Ionicons name="person" size={24} color={formData.type === 'solo' ? '#fff' : '#667eea'} />
                  <Text style={[styles.typeButtonText, formData.type === 'solo' && styles.typeButtonTextActive]}>
                    {isRTL ? 'فردي' : 'Solo'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, formData.type === 'group' && styles.typeButtonActive]}
                  onPress={() => setFormData({ ...formData, type: 'group' })}
                >
                  <Ionicons name="people" size={24} color={formData.type === 'group' ? '#fff' : '#667eea'} />
                  <Text style={[styles.typeButtonText, formData.type === 'group' && styles.typeButtonTextActive]}>
                    {isRTL ? 'جماعي' : 'Group'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Reading Mode */}
              <Text style={styles.inputLabel}>{isRTL ? 'طريقة القراءة' : 'Reading Mode'}</Text>
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[styles.typeButton, formData.readingMode === 'offline' && styles.typeButtonActive]}
                  onPress={() => setFormData({ ...formData, readingMode: 'offline' })}
                >
                  <Ionicons name="book" size={24} color={formData.readingMode === 'offline' ? '#fff' : '#667eea'} />
                  <Text style={[styles.typeButtonText, formData.readingMode === 'offline' && styles.typeButtonTextActive]}>
                    {isRTL ? 'ذاتي' : 'Offline'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, formData.readingMode === 'realtime' && styles.typeButtonActive]}
                  onPress={() => setFormData({ ...formData, readingMode: 'realtime' })}
                >
                  <Ionicons name="videocam" size={24} color={formData.readingMode === 'realtime' ? '#fff' : '#667eea'} />
                  <Text style={[styles.typeButtonText, formData.readingMode === 'realtime' && styles.typeButtonTextActive]}>
                    {isRTL ? 'مباشر' : 'Live'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Unit */}
              <Text style={styles.inputLabel}>{isRTL ? 'وحدة القراءة' : 'Reading Unit'}</Text>
              <View style={styles.unitContainer}>
                {renderUnitOption('eighth', '1/8 Hizb', '⅛ حزب')}
                {renderUnitOption('quarter', '1/4 Hizb', '¼ حزب')}
                {renderUnitOption('half', '1/2 Hizb', '½ حزب')}
                {renderUnitOption('hizb', '1 Hizb', 'حزب')}
                {renderUnitOption('juz', '1 Juz', 'جزء')}
              </View>
              
              {/* Amount per day */}
              <Text style={styles.inputLabel}>{isRTL ? 'الكمية اليومية' : 'Amount per Day'}</Text>
              <View style={styles.amountContainer}>
                <TouchableOpacity
                  style={styles.amountButton}
                  onPress={() => setFormData({ ...formData, amountPerDay: Math.max(1, formData.amountPerDay - 1) })}
                >
                  <Ionicons name="remove" size={24} color="#667eea" />
                </TouchableOpacity>
                <Text style={styles.amountText}>{formData.amountPerDay}</Text>
                <TouchableOpacity
                  style={styles.amountButton}
                  onPress={() => setFormData({ ...formData, amountPerDay: formData.amountPerDay + 1 })}
                >
                  <Ionicons name="add" size={24} color="#667eea" />
                </TouchableOpacity>
              </View>
              
              {/* Infinite toggle */}
              <TouchableOpacity
                style={styles.infiniteToggle}
                onPress={() => setFormData({ ...formData, isInfinite: !formData.isInfinite })}
              >
                <View style={[styles.checkbox, formData.isInfinite && styles.checkboxActive]}>
                  {formData.isInfinite && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <Text style={styles.infiniteText}>
                  {isRTL ? 'تكرار لا نهائي (ختمات متعددة)' : 'Infinite repeat (multiple khatams)'}
                </Text>
              </TouchableOpacity>
              
              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.cancelButtonText}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleCreateKhatam}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.submitGradient}
                  >
                    <Text style={styles.submitButtonText}>{isRTL ? 'إنشاء' : 'Create'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 4,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  khatamCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardGradient: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  rtlText: {
    marginLeft: 0,
    marginRight: 8,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modeText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'right',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
  },
  infiniteBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 4,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  rtlInput: {
    textAlign: 'right',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#667eea',
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    backgroundColor: '#667eea',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 8,
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  unitContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  unitOptionActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  unitOptionText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  unitOptionTextActive: {
    color: '#fff',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  amountButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#667eea',
  },
  amountText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 40,
    textAlign: 'center',
  },
  infiniteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: '#667eea',
  },
  infiniteText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default KhatamScreen;