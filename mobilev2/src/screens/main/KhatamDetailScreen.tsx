/**
 * KhatamDetailScreen.tsx - Salifz
 * ✅ COMPLETE: Khatam detail with hizb grid tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
// react-i18next n'a JAMAIS été initialisé dans ce projet : son t()
// renvoyait la clé brute et son i18n.language restait indéfini — d'où
// les ternaires anglais/arabe qui ont valu à ces écrans d'ignorer le
// français. Le t() du projet (services/i18n) est importé plus bas.
import api from '../../services/api';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors, fixedColors } from '../../contexts/ThemeContext';
import { getLocale, t } from '../../services/i18n';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 48) / 10; // 10 items per row

interface HizbItem {
  number: number;
  juz: number;
  status: 'available' | 'assigned' | 'in_progress' | 'completed' | 'verified';
  assignedTo?: any;
  completedBy?: any;
}

interface Participant {
  user: any;
  isAdmin: boolean;
  totalAssigned: number;
  totalCompleted: number;
  progress: number;
}

const KhatamDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isRTL = getLocale() === 'ar';
  
  const { khatamId } = route.params;
  
  const [khatam, setKhatam] = useState<any>(null);
  const [hizbGrid, setHizbGrid] = useState<HizbItem[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'grid' | 'participants'>('grid');
  const [selectedHizb, setSelectedHizb] = useState<HizbItem | null>(null);
  const [showHizbModal, setShowHizbModal] = useState(false);

  useEffect(() => {
    console.log('[KhatamDetail] 🕌 Loading khatam:', khatamId);
    fetchKhatamData();
  }, [khatamId]);

  const fetchKhatamData = async () => {
    try {
      const [khatamRes, gridRes, participantsRes] = await Promise.all([
        api.get(`/khatam/${khatamId}`),
        api.get(`/khatam/${khatamId}/grid`),
        api.get(`/khatam/${khatamId}/participants`)
      ]);
      
      setKhatam(khatamRes.data.data);
      setHizbGrid(gridRes.data.data || []);
      setParticipants(participantsRes.data.data || []);
      
      console.log('[KhatamDetail] ✅ Data loaded');
    } catch (error) {
      console.error('[KhatamDetail] ❌ Error:', error);
      Alert.alert('Error', 'Failed to load khatam data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchKhatamData();
  }, []);

  const handleAssignHizb = async (hizbNumber: number) => {
    console.log('[KhatamDetail] 📌 Assigning hizb:', hizbNumber);
    
    try {
      const response = await api.post(`/khatam/${khatamId}/assign`, {
        hizbNumber,
        unit: khatam.readingConfig?.unit || 'hizb'
      });
      
      Alert.alert('Success', 'Hizb assigned to you!');
      setShowHizbModal(false);
      fetchKhatamData();
    } catch (error: any) {
      console.error('[KhatamDetail] ❌ Assign error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to assign');
    }
  };

  const handleCompleteHizb = async (hizbNumber: number) => {
    console.log('[KhatamDetail] ✅ Completing hizb:', hizbNumber);
    
    try {
      const response = await api.post(`/khatam/${khatamId}/complete`, {
        hizbNumber,
        unit: khatam.readingConfig?.unit || 'hizb'
      });
      
      Alert.alert(
        'Congratulations! 🎉',
        `Hizb ${hizbNumber} completed! +${response.data.xpEarned} XP`
      );
      setShowHizbModal(false);
      fetchKhatamData();
    } catch (error: any) {
      console.error('[KhatamDetail] ❌ Complete error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to complete');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return colors.border;
      case 'assigned': return fixedColors.gold;
      case 'in_progress': return colors.primaryLight;
      case 'completed': return colors.info;
      case 'verified': return colors.primaryLight;
      default: return colors.border;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return null;
      case 'assigned': return 'time-outline';
      case 'in_progress': return 'play';
      case 'completed': return 'checkmark';
      case 'verified': return 'checkmark-done';
      default: return null;
    }
  };

  const renderHizbItem = ({ item }: { item: HizbItem }) => {
    const statusColor = getStatusColor(item.status);
    const icon = getStatusIcon(item.status);
    
    return (
      <TouchableOpacity accessible accessibilityRole="button"
        style={[styles.hizbItem, { backgroundColor: statusColor }]}
        onPress={() => {
          setSelectedHizb(item);
          setShowHizbModal(true);
        }}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.hizbNumber,
          item.status !== 'available' && styles.hizbNumberDark
        ]}>
          {item.number}
        </Text>
        {icon && (
          <Ionicons
            name={icon as any}
            size={10}
            color={item.status === 'verified' ? colors.surface : colors.text}
            style={styles.hizbIcon}
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderParticipant = ({ item }: { item: Participant }) => (
    <View style={styles.participantCard}>
      <View style={styles.participantInfo}>
        <View style={styles.participantAvatar}>
          <Text style={styles.avatarText}>
            {item.user?.displayName?.[0] || item.user?.username?.[0] || '?'}
          </Text>
        </View>
        <View style={styles.participantDetails}>
          <Text style={styles.participantName}>
            {item.user?.displayName || item.user?.username}
          </Text>
          <Text style={styles.participantStats}>
            {item.totalCompleted}/{item.totalAssigned} completed
          </Text>
        </View>
        {item.isAdmin && (
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={14} color={colors.accent} />
          </View>
        )}
      </View>
      <View style={styles.participantProgress}>
        <View style={styles.progressBarSmall}>
          <View style={[styles.progressFillSmall, { width: `${item.progress}%` }]} />
        </View>
        <Text style={styles.progressTextSmall}>{item.progress}%</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const dashboard = khatam?.dashboard;
  const progress = dashboard?.progress;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.accent, colors.accentDeep]}
        style={styles.header}
      >
        <TouchableOpacity accessible accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.onDeep} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{khatam?.title}</Text>
          <Text style={styles.headerSubtitle}>
            {khatam?.readingMode === 'realtime' ? '🎥 Live' : '📖 Offline'} • 
            {khatam?.type === 'group' ? ' 👥 Group' : ' 👤 Solo'}
          </Text>
        </View>
        <TouchableOpacity accessible accessibilityRole="button" style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={colors.onDeep} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Progress Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewTitle}>
              {t('khatam.progression')}
            </Text>
            <Text style={styles.khatamCount}>
              Khatam #{khatam?.progress?.currentKhatamNumber || 1}
              {khatam?.readingConfig?.isInfinite && ' ∞'}
            </Text>
          </View>
          
          <View style={styles.progressCircle}>
            <Text style={styles.progressPercent}>{progress?.percentage || 0}%</Text>
            <Text style={styles.progressLabel}>
              {progress?.completed || 0}/60 {t('khatam.hizb')}
            </Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{progress?.verified || 0}</Text>
              <Text style={styles.statLabel}>{t('khatam.verifie')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{progress?.inProgress || 0}</Text>
              <Text style={styles.statLabel}>{t('khatam.enCours')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{progress?.available || 0}</Text>
              <Text style={styles.statLabel}>{t('khatam.disponible')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{participants.length}</Text>
              <Text style={styles.statLabel}>{t('khatam.participants')}</Text>
            </View>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
            <Text style={styles.legendText}>{t('khatam.disponible')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: fixedColors.gold }]} />
            <Text style={styles.legendText}>{t('khatam.reserve')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.info }]} />
            <Text style={styles.legendText}>{t('khatam.termine')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primaryLight }]} />
            <Text style={styles.legendText}>{t('khatam.verifie')}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity accessible accessibilityRole="button"
            style={[styles.tab, activeTab === 'grid' && styles.tabActive]}
            onPress={() => setActiveTab('grid')}
          >
            <Ionicons 
              name="grid" 
              size={18} 
              color={activeTab === 'grid' ? colors.accent : colors.textMuted} 
            />
            <Text style={[styles.tabText, activeTab === 'grid' && styles.tabTextActive]}>
              {t('khatam.grilleHizb')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity accessible accessibilityRole="button"
            style={[styles.tab, activeTab === 'participants' && styles.tabActive]}
            onPress={() => setActiveTab('participants')}
          >
            <Ionicons 
              name="people" 
              size={18} 
              color={activeTab === 'participants' ? colors.accent : colors.textMuted} 
            />
            <Text style={[styles.tabText, activeTab === 'participants' && styles.tabTextActive]}>
              {t('khatam.participants')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'grid' ? (
          <View style={styles.gridContainer}>
            {/* Juz labels */}
            {[...Array(30)].map((_, juzIndex) => {
              const juzHizbs = hizbGrid.filter(h => h.juz === juzIndex + 1);
              if (juzHizbs.length === 0) return null;
              
              return (
                <View key={juzIndex} style={styles.juzSection}>
                  <Text style={styles.juzLabel}>
                    {isRTL ? `الجزء ${juzIndex + 1}` : `Juz ${juzIndex + 1}`}
                  </Text>
                  <View style={styles.hizbRow}>
                    {juzHizbs.map(hizb => (
                      <TouchableOpacity accessible accessibilityRole="button"
                        key={hizb.number}
                        style={[styles.hizbItem, { backgroundColor: getStatusColor(hizb.status) }]}
                        onPress={() => {
                          setSelectedHizb(hizb);
                          setShowHizbModal(true);
                        }}
                      >
                        <Text style={[
                          styles.hizbNumber,
                          hizb.status !== 'available' && styles.hizbNumberDark
                        ]}>
                          {hizb.number}
                        </Text>
                        {getStatusIcon(hizb.status) && (
                          <Ionicons
                            name={getStatusIcon(hizb.status) as any}
                            size={10}
                            color={hizb.status === 'verified' ? colors.surface : colors.text}
                            style={styles.hizbIcon}
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.participantsContainer}>
            {participants.map((p, index) => (
              <View key={index}>
                {renderParticipant({ item: p })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Realtime Session Button */}
      {khatam?.readingMode === 'realtime' && (
        <TouchableOpacity accessible accessibilityRole="button"
          style={styles.liveButton}
          onPress={() => navigation.navigate('KhatamLive', { khatamId })}
        >
          <LinearGradient
            colors={['#ff416c', '#ff4b2b']}
            style={styles.liveButtonGradient}
          >
            <Ionicons name="videocam" size={24} color={colors.onDeep} />
            <Text style={styles.liveButtonText}>
              {t('khatam.sessionDirecte')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Hizb Detail Modal */}
      <Modal
        visible={showHizbModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHizbModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isRTL ? `الحزب ${selectedHizb?.number}` : `Hizb ${selectedHizb?.number}`}
            </Text>
            
            <View style={styles.hizbInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('khatam.juz')}</Text>
                <Text style={styles.infoValue}>{selectedHizb?.juz}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('khatam.statut')}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedHizb?.status || 'available') }]}>
                  <Text style={styles.statusText}>{selectedHizb?.status}</Text>
                </View>
              </View>
              {selectedHizb?.assignedTo && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('khatam.reservePour')}</Text>
                  <Text style={styles.infoValue}>
                    {selectedHizb.assignedTo.displayName || selectedHizb.assignedTo.username}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.modalActions}>
              {selectedHizb?.status === 'available' && (
                <TouchableOpacity accessible accessibilityRole="button"
                  style={[styles.modalButton, styles.assignButton]}
                  onPress={() => handleAssignHizb(selectedHizb.number)}
                >
                  <Ionicons name="hand-left" size={20} color={colors.onDeep} />
                  <Text style={styles.modalButtonText}>
                    {t('khatam.prendreHizb')}
                  </Text>
                </TouchableOpacity>
              )}
              
              {(selectedHizb?.status === 'assigned' || selectedHizb?.status === 'in_progress') && (
                <TouchableOpacity accessible accessibilityRole="button"
                  style={[styles.modalButton, styles.completeButton]}
                  onPress={() => handleCompleteHizb(selectedHizb.number)}
                >
                  <Ionicons name="checkmark-circle" size={20} color={colors.onDeep} />
                  <Text style={styles.modalButtonText}>
                    {t('khatam.marquerTermine')}
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity accessible accessibilityRole="button"
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowHizbModal(false)}
              >
                <Text style={styles.cancelButtonText}>
                  {t('khatam.fermer')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.surfaceAlt,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: c.onDeep,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
  },
  overviewCard: {
    backgroundColor: c.surface,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: c.text,
  },
  khatamCount: {
    fontSize: 14,
    color: c.accent,
    fontWeight: '600',
  },
  progressCircle: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressPercent: {
    fontSize: 48,
    fontWeight: 'bold',
    color: c.accent,
  },
  progressLabel: {
    fontSize: 14,
    color: c.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: c.text,
  },
  statLabel: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: c.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: c.infoSoft,
  },
  tabText: {
    fontSize: 14,
    color: c.textMuted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: c.accent,
    fontWeight: '600',
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  juzSection: {
    marginBottom: 16,
  },
  juzLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: c.accent,
    marginBottom: 8,
  },
  hizbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  hizbItem: {
    width: GRID_ITEM_SIZE - 6,
    height: GRID_ITEM_SIZE - 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  hizbNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: c.textSecondary,
  },
  hizbNumberDark: {
    color: c.text,
  },
  hizbIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  participantsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  participantCard: {
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: c.onDeep,
  },
  participantDetails: {
    flex: 1,
    marginLeft: 12,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
  },
  participantStats: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: c.infoSoft,
    padding: 6,
    borderRadius: 12,
  },
  participantProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarSmall: {
    flex: 1,
    height: 6,
    backgroundColor: c.backgroundAlt,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFillSmall: {
    height: '100%',
    backgroundColor: c.accent,
    borderRadius: 3,
  },
  progressTextSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: c.accent,
    marginLeft: 8,
    width: 40,
  },
  liveButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 25,
    overflow: 'hidden',
  },
  liveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  liveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: c.onDeep,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: c.surface,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: c.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  hizbInfo: {
    backgroundColor: c.surfaceAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: c.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: c.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: c.text,
    textTransform: 'capitalize',
  },
  modalActions: {
    gap: 12,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  assignButton: {
    backgroundColor: c.accent,
  },
  completeButton: {
    backgroundColor: c.primaryLight,
  },
  cancelButton: {
    backgroundColor: c.backgroundAlt,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: c.onDeep,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: c.textSecondary,
  },
});

export default KhatamDetailScreen;