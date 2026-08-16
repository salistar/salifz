import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotificationsStore } from '../../stores';
import { COLORS } from '../../config';

export default function NotificationsScreen({ navigation }: any) {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationsStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchNotifications(); }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchNotifications(); setRefreshing(false); };

  const handleNotificationPress = async (notification: any) => {
    if (!notification.isRead) await markAsRead(notification._id);
    if (notification.action?.screen) navigation.navigate(notification.action.screen, notification.action.params);
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
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
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
    return { today, yesterday, older };
  };

  const grouped = groupNotifications();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.header}>
        <Text style={styles.headerIcon}>🔔</Text>
        <Text style={styles.headerTitle}>الإشعارات</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}><Text style={styles.unreadText}>{unreadCount} جديد</Text></View>
        )}
      </LinearGradient>

      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
          <Text style={styles.markAllText}>تحديد الكل كمقروء</Text>
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={styles.listContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>لا توجد إشعارات</Text>
            <Text style={styles.emptySubtitle}>ستظهر هنا الإشعارات الجديدة</Text>
          </View>
        ) : (
          <>
            {grouped.today.length > 0 && (
              <View style={styles.group}>
                <Text style={styles.groupTitle}>اليوم</Text>
                {grouped.today.map((notif: any) => (
                  <TouchableOpacity key={notif._id} style={[styles.notificationItem, !notif.isRead && styles.notificationUnread]} onPress={() => handleNotificationPress(notif)}>
                    <View style={styles.iconContainer}><Text style={styles.notificationIcon}>{getNotificationIcon(notif.type)}</Text></View>
                    <View style={styles.notificationContent}>
                      <Text style={[styles.notificationTitle, !notif.isRead && styles.notificationTitleUnread]}>{notif.title?.ar || notif.title?.en}</Text>
                      <Text style={styles.notificationBody} numberOfLines={2}>{notif.body?.ar || notif.body?.en}</Text>
                      <Text style={styles.notificationTime}>{getTimeAgo(notif.createdAt)}</Text>
                    </View>
                    {!notif.isRead && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {grouped.yesterday.length > 0 && (
              <View style={styles.group}>
                <Text style={styles.groupTitle}>أمس</Text>
                {grouped.yesterday.map((notif: any) => (
                  <TouchableOpacity key={notif._id} style={[styles.notificationItem, !notif.isRead && styles.notificationUnread]} onPress={() => handleNotificationPress(notif)}>
                    <View style={styles.iconContainer}><Text style={styles.notificationIcon}>{getNotificationIcon(notif.type)}</Text></View>
                    <View style={styles.notificationContent}>
                      <Text style={[styles.notificationTitle, !notif.isRead && styles.notificationTitleUnread]}>{notif.title?.ar || notif.title?.en}</Text>
                      <Text style={styles.notificationBody} numberOfLines={2}>{notif.body?.ar || notif.body?.en}</Text>
                      <Text style={styles.notificationTime}>{getTimeAgo(notif.createdAt)}</Text>
                    </View>
                    {!notif.isRead && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {grouped.older.length > 0 && (
              <View style={styles.group}>
                <Text style={styles.groupTitle}>سابقاً</Text>
                {grouped.older.map((notif: any) => (
                  <TouchableOpacity key={notif._id} style={[styles.notificationItem, !notif.isRead && styles.notificationUnread]} onPress={() => handleNotificationPress(notif)}>
                    <View style={styles.iconContainer}><Text style={styles.notificationIcon}>{getNotificationIcon(notif.type)}</Text></View>
                    <View style={styles.notificationContent}>
                      <Text style={[styles.notificationTitle, !notif.isRead && styles.notificationTitleUnread]}>{notif.title?.ar || notif.title?.en}</Text>
                      <Text style={styles.notificationBody} numberOfLines={2}>{notif.body?.ar || notif.body?.en}</Text>
                      <Text style={styles.notificationTime}>{getTimeAgo(notif.createdAt)}</Text>
                    </View>
                    {!notif.isRead && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 50, paddingBottom: 30, alignItems: 'center' },
  headerIcon: { fontSize: 50 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  unreadBadge: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15, marginTop: 10 },
  unreadText: { color: '#fff', fontWeight: '600' },
  markAllButton: { backgroundColor: '#fff', marginHorizontal: 15, marginTop: -15, padding: 12, borderRadius: 10, alignItems: 'center', elevation: 2 },
  markAllText: { color: COLORS.primary, fontWeight: '600' },
  listContainer: { padding: 15 },
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyIcon: { fontSize: 60, marginBottom: 15 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  emptySubtitle: { color: '#999', marginTop: 5 },
  group: { marginBottom: 20 },
  groupTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 10, marginLeft: 5 },
  notificationItem: { backgroundColor: '#fff', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, elevation: 1 },
  notificationUnread: { backgroundColor: '#FFF8E1' },
  iconContainer: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notificationIcon: { fontSize: 22 },
  notificationContent: { flex: 1 },
  notificationTitle: { fontSize: 15, fontWeight: '600', color: '#333', textAlign: 'right' },
  notificationTitleUnread: { fontWeight: 'bold' },
  notificationBody: { color: '#666', marginTop: 4, lineHeight: 20, textAlign: 'right' },
  notificationTime: { color: '#999', fontSize: 12, marginTop: 6, textAlign: 'right' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF9800', marginLeft: 10 }
});