import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/hooks/useFonts';
import { getFullImageUrl } from '@/constants/api';
import { useTheme } from '@/context/ThemeContext';

const isWeb = Platform.OS === 'web';

const RankMedal = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Ionicons name="trophy" size={24} color="#fbbf24" />;
  if (rank === 2) return <Ionicons name="medal" size={24} color="#9ca3af" />;
  if (rank === 3) return <Ionicons name="medal" size={24} color="#d97706" />;
  return <Text style={{ color: '#71717a', fontSize: 14, fontFamily: Fonts.headingXBold }}>#{rank}</Text>;
};

const LeaderboardCard = ({ user, index, router, isDark }: any) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, delay: index * 100, useNativeDriver: false }),
      Animated.spring(slide, { toValue: 0, friction: 8, tension: 40, delay: index * 100, useNativeDriver: false })
    ]).start();
  }, []);

  const hoverIn = () => {
    Animated.spring(scale, { toValue: 1.03, friction: 6, tension: 50, useNativeDriver: false }).start();
  };

  const hoverOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: false }).start();
  };

  const darkColors = index === 0 ? ['#fbbf2420', '#f59e0b10', '#18181b'] : 
                 index === 1 ? ['#9ca3af20', '#6b728010', '#18181b'] : 
                 index === 2 ? ['#d9770620', '#b4530910', '#18181b'] : 
                 ['#27272a', '#18181b', '#18181b'];
  const lightColors = ['#FFFFFF', '#FFFFFF', '#FFFFFF'];
  const colors = isDark ? darkColors : lightColors;
                 
  const borderColor = index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#d97706' : (isDark ? '#27272a' : '#E2E8F0');

  const completedVisits = user.visits || 0;
  const reportsSub = user.reports || 0;
  const productivity = user.productivity || 0;
  const streak = user.streak || 0;
  const trendUp = user.trendUp ?? true;

  return (
    <View
      style={{ cursor: 'pointer', marginRight: 20 } as any}
      {...{
        onMouseEnter: hoverIn,
        onMouseLeave: hoverOut
      } as any}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`/admin/merchandisers/${user.user_id}`)}>
        <Animated.View style={[
          styles.cardContainer,
          { 
            opacity,
            transform: [{ scale }, { translateY: slide }],
            borderColor: isDark ? borderColor + '50' : borderColor,
            backgroundColor: isDark ? '#18181b' : '#FFFFFF',
            ...(!isDark && Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(0,0,0,0.05)' } : {})
          }
        ]}>
          <LinearGradient colors={colors as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardGradient}>
            
            {/* Header Section */}
            <View style={styles.cardHeader}>
              <View style={styles.profileSection}>
                <View style={[styles.avatarContainer, { borderColor }]}>
                  {user.profile_image ? (
                    <Image source={{ uri: getFullImageUrl(user.profile_image) || '' }} style={styles.avatar} />
                  ) : (
                    <Text style={styles.avatarText}>{user.name?.[0] || '?'}</Text>
                  )}
                  <View style={styles.statusDot} />
                </View>
                <View style={styles.nameContainer}>
                  <Text style={[styles.name, !isDark && { color: '#0F172A', fontFamily: 'Inter' }]} numberOfLines={1}>{user.name}</Text>
                  <View style={[styles.roleContainer, !isDark && { backgroundColor: '#F8FAFC' }]}>
                    <Ionicons name="star" size={10} color={isDark ? "#a1a1aa" : "#F59E0B"} />
                    <Text style={[styles.roleText, !isDark && { color: '#64748B', fontFamily: 'Inter' }]}>Score: {user.score || 0}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.rankContainer}>
                <RankMedal rank={index + 1} />
              </View>
            </View>

            {/* Metrics Grid */}
            <View style={[styles.metricsGrid, !isDark && { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }]}>
              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, !isDark && { color: '#64748B', fontFamily: 'Inter' }]}>Visits</Text>
                <Text style={[styles.metricValue, !isDark && { color: '#0F172A', fontFamily: 'Inter' }]}>{completedVisits}</Text>
              </View>
              <View style={[styles.metricDivider, !isDark && { backgroundColor: '#E2E8F0' }]} />
              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, !isDark && { color: '#64748B', fontFamily: 'Inter' }]}>Reports</Text>
                <Text style={[styles.metricValue, !isDark && { color: '#0F172A', fontFamily: 'Inter' }]}>{reportsSub}</Text>
              </View>
              <View style={[styles.metricDivider, !isDark && { backgroundColor: '#E2E8F0' }]} />
              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, !isDark && { color: '#64748B', fontFamily: 'Inter' }]}>Prod.</Text>
                <Text style={[styles.metricValue, !isDark && { color: '#0F172A', fontFamily: 'Inter' }, productivity >= 90 && { color: '#10B981' }]}>{productivity}%</Text>
              </View>
            </View>

            {/* Streak & Trend */}
            <View style={styles.trendSection}>
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={12} color="#f97316" />
                <Text style={styles.streakText}>{streak} Day Streak</Text>
              </View>
              <View style={[styles.trendBadge, { backgroundColor: trendUp ? '#10b98120' : '#ef444420' }]}>
                <Ionicons name={trendUp ? "trending-up" : "trending-down"} size={12} color={trendUp ? "#10b981" : "#ef4444"} />
                <Text style={[styles.trendText, { color: trendUp ? "#10b981" : "#ef4444" }]}>{trendUp ? "+2.4%" : "-1.1%"}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={[styles.actionBtn, !isDark && { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }]}
                onPress={(e) => { e.stopPropagation(); router.push(`/admin/merchandisers/${user.user_id}`); }}
              >
                <Ionicons name="person-outline" size={14} color={isDark ? "#a1a1aa" : "#64748B"} />
                <Text style={[styles.actionBtnText, !isDark && { color: '#64748B', fontFamily: 'Inter' }]}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, !isDark && { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }]}
                onPress={(e) => { e.stopPropagation(); router.push(`/admin/before-after?user_id=${user.user_id}`); }}
              >
                <Ionicons name="document-text-outline" size={14} color={isDark ? "#a1a1aa" : "#64748B"} />
                <Text style={[styles.actionBtnText, !isDark && { color: '#64748B', fontFamily: 'Inter' }]}>Reports</Text>
              </TouchableOpacity>
            </View>

          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

export default function PerformanceLeaderboard({ stats, router }: { stats: any, router: any }) {
  const users = stats?.performance_ranking?.slice(0, 5) || [];
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <View style={[styles.container, !isDark && { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="podium" size={20} color={isDark ? "#60a5fa" : "#3B82F6"} />
          <Text style={[styles.title, !isDark && { color: '#0F172A', fontFamily: 'Inter' }]}>AI Performance Leaderboard</Text>
          <View style={[styles.liveBadge, !isDark && { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        <Text style={[styles.subtitle, !isDark && { color: '#64748B', fontFamily: 'Inter' }]}>Top 5 Merchandisers • Global Ranking</Text>
      </View>
      
      {users.length > 0 ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.scrollContainer}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {users.map((user: any, idx: number) => (
            <LeaderboardCard key={user.user_id} user={user} index={idx} router={router} isDark={isDark} />
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.emptyState, !isDark && { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
          <Ionicons name="bar-chart-outline" size={32} color={isDark ? "#3f3f46" : "#94A3B8"} />
          <Text style={[styles.emptyText, !isDark && { color: '#64748B', fontFamily: 'Inter' }]}>Intelligence gathering in progress...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    backgroundColor: '#121214', // Slightly darker to make cards pop
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#27272a',
    ...Platform.select({
      web: { boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' } as any,
    })
  },
  header: {
    flexDirection: isWeb ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: isWeb ? 'center' : 'flex-start',
    marginBottom: 20,
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.headingXBold,
    color: '#fff',
    letterSpacing: 0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef444420',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef444450',
    marginLeft: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginRight: 6,
  },
  liveText: {
    color: '#ef4444',
    fontSize: 10,
    fontFamily: Fonts.headingXBold,
    letterSpacing: 1,
  },
  subtitle: {
    color: '#a1a1aa',
    fontSize: 13,
    fontFamily: Fonts.body,
  },
  scrollContainer: {
    paddingVertical: 10,
  },
  cardContainer: {
    width: 280,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#18181b',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 8px 24px -8px rgba(0,0,0,0.4)' } as any,
    })
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#27272a',
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
  },
  avatarText: {
    color: '#fff',
    fontFamily: Fonts.headingXBold,
    fontSize: 18,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#18181b',
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts.headingXBold,
    marginBottom: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff10',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#d4d4d8',
    fontSize: 11,
    fontFamily: Fonts.headingSemiBold,
    marginLeft: 4,
  },
  rankContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    color: '#a1a1aa',
    fontSize: 11,
    fontFamily: Fonts.body,
    marginBottom: 4,
  },
  metricValue: {
    color: '#fff',
    fontSize: 15,
    fontFamily: Fonts.headingXBold,
  },
  metricDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 8,
  },
  trendSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9731615',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f9731630',
  },
  streakText: {
    color: '#f97316',
    fontSize: 11,
    fontFamily: Fonts.headingSemiBold,
    marginLeft: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 11,
    fontFamily: Fonts.headingXBold,
    marginLeft: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 6,
  },
  actionBtnText: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: Fonts.headingSemiBold,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  emptyText: {
    color: '#71717a',
    marginTop: 12,
    fontFamily: Fonts.headingSemiBold,
  }
});
