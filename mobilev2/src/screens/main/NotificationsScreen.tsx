/**
 * ============================================
 * 📱 NotificationsScreen.tsx - Salifz
 * ============================================
 * ✅ CONVERTED: i18n integration
 * ✅ ENHANCED: More detailed console.log
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotificationsStore } from '../../stores';
import { COLORS } from '../../config';
import { t } from '../../services/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { MihrabArch } from '../../components/common/Ornements';
import { IconeNotifications } from '../../components/common/Icones';

const LOG_PREFIX = '[NotificationsScreen.tsx]';

export default function NotificationsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component mounting...`);

  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationsStore();
  const [refreshing, setRefreshing] = useState(false);

  console.log(`${LOG_PREFIX} 🔔 Notifications: ${notifications.length}, Unread: ${unreadCount}`);

  useEffect(() => {
    console.log(`${LOG_PREFIX} 🔄 useEffect: Fetching notifications...`);
    fetchNotifications();
  }, []);

  const onRefresh = async () => {
    console.log(`${LOG_PREFIX} 🔄 Pull to refresh triggered`);
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: any) => {
    console.log(`${LOG_PREFIX} 📬 Notification pressed: ${notification._id}, type: ${notification.type}`);
    if (!notification.isRead) {
      console.log(`${LOG_PREFIX} ✅ Marking notification as read: ${notification._id}`);
      await markAsRead(notification._id);
    }
    if (notification.action?.screen) {
      console.log(`${LOG_PREFIX} 🔀 Navigating to: ${notification.action.screen}`);
      navigation.navigate(notification.action.screen, notification.action.params);
    }
  };

  const handleMarkAllAsRead = () => {
    console.log(`${LOG_PREFIX} ✅ Marking all notifications as read`);
    markAllAsRead();
  };

  const getNotificationIcon = (type: string) => {
    const icons: any = {
      streak_reminder: '🔥', streak_at_risk: '⚠️', streak_milestone: '🎉',
      daily_goal_complete: '✅', lesson_complete: '📖', level_up: '⬆️',
      challenge_available: '🎯', challenge_complete: '🏆',
      league_promoted: '📈', league_relegated: '📉',
      friend_request: '👋', friend_accepted: '🤝',
      achievement_unlocked: '🏅', badge_earned: '🎖️',
      review_reminder: '🔄', daily_verse: '📜'
    };
    return icons[type] || '📬';
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('notifications.timeAgo.now');
    if (diffMins < 60) return t('notifications.timeAgo.minutes', { count: diffMins });
    if (diffHours < 24) return t('notifications.timeAgo.hours', { count: diffHours });
    if (diffDays < 7) return t('notifications.timeAgo.days', { count: diffDays });
    return notifDate.toLocaleDateString('ar');
  };

  const groupNotifications = () => {
    const today: any[] = [], yesterday: any[] = [], older: any[] = [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);

    notifications.forEach((notif: any) => {
      const notifDate = new Date(notif.createdAt);
      if (notifDate >= todayStart) today.push(notif);
      else if (notifDate >= yesterdayStart) yesterday.push(notif);
      else older.push(notif);
    });

    console.log(`${LOG_PREFIX} 📊 Grouped: today=${today.length}, yesterday=${yesterday.length}, older=${older.length}`);
    return { today, yesterday, older };
  };

  const grouped = groupNotifications();

  const renderNotificationItem = (notif: any) => (
    <TouchableOpacity accessible accessibilityRole="button"
      key={notif._id}
      style={[styles.notificationItem, !notif.isRead && styles.notificationUnread]}
      onPress={() => handleNotificationPress(notif)}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.notificationIcon}>{getNotificationIcon(notif.type)}</Text>
      </View>
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, !notif.isRead && styles.notificationTitleUnread]}>
          {notif.title?.ar || notif.title?.en}
        </Text>
        <Text style={styles.notificationBody} numberOfLines={2}>
          {notif.body?.ar || notif.body?.en}
        </Text>
        <Text style={styles.notificationTime}>{getTimeAgo(notif.createdAt)}</Text>
      </View>
      {!notif.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  console.log(`${LOG_PREFIX} 🎨 Rendering UI (total: ${notifications.length}, unread: ${unreadCount})...`);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[colors.warning, colors.warningStrong]} style={styles.header}>
        <IconeNotifications size={40} color={colors.onDeep} />
        <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{t('notifications.newCount', { count: unreadCount })}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Mark All as Read Button */}
      {unreadCount > 0 && (
        <TouchableOpacity accessible accessibilityRole="button" style={styles.markAllButton} onPress={handleMarkAllAsRead}>
          <Text style={styles.markAllText}>{t('notifications.markAllAsRead')}</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <MihrabArch width={70} color={colors.border} />
            <Text style={styles.emptyTitle}>{t('notifications.empty')}</Text>
            <Text style={styles.emptySubtitle}>{t('notifications.emptySubtitle')}</Text>
          </View>
        ) : (
          <>
            {/* Today */}
            {grouped.today.length > 0 && (
              <View style={styles.group}>
                <Text style={styles.groupTitle}>{t('notifications.groups.today')}</Text>
                {grouped.today.map(renderNotificationItem)}
              </View>
            )}

            {/* Yesterday */}
            {grouped.yesterday.length > 0 && (
              <View style={styles.group}>
                <Text style={styles.groupTitle}>{t('notifications.groups.yesterday')}</Text>
                {grouped.yesterday.map(renderNotificationItem)}
              </View>
            )}

            {/* Older */}
            {grouped.older.length > 0 && (
              <View style={styles.group}>
                <Text style={styles.groupTitle}>{t('notifications.groups.older')}</Text>
                {grouped.older.map(renderNotificationItem)}
              </View>
            )}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { paddingTop: 50, paddingBottom: 30, alignItems: 'center' },
  headerIcon: {},
  headerTitle: { color: c.onDeep, fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  unreadBadge: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15, marginTop: 10 },
  unreadText: { color: c.onDeep, fontWeight: '600' },
  markAllButton: { backgroundColor: c.surface, marginHorizontal: 15, marginTop: -15, padding: 12, borderRadius: 10, alignItems: 'center', elevation: 2 },
  markAllText: { color: c.primary, fontWeight: '600' },
  listContainer: { padding: 15 },
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyIcon: { marginBottom: 15 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: c.text },
  emptySubtitle: { color: c.textMuted, marginTop: 5 },
  group: { marginBottom: 20 },
  groupTitle: { fontSize: 14, fontWeight: '600', color: c.textSecondary, marginBottom: 10, marginLeft: 5 },
  notificationItem: { backgroundColor: c.surface, padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, elevation: 1 },
  notificationUnread: { backgroundColor: '#FFF8E1' },
  iconContainer: { width: 45, height: 45, borderRadius: 12, backgroundColor: c.infoSoft, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notificationIcon: { fontSize: 22 },
  notificationContent: { flex: 1 },
  notificationTitle: { fontSize: 15, fontWeight: '600', color: c.text, textAlign: 'right' },
  notificationTitleUnread: { fontWeight: 'bold' },
  notificationBody: { color: c.textSecondary, marginTop: 4, lineHeight: 20, textAlign: 'right' },
  notificationTime: { color: c.textMuted, fontSize: 12, marginTop: 6, textAlign: 'right' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.warning, marginLeft: 10 }
});