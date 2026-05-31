import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, parseISO, addMonths, subMonths } from 'date-fns';
import { useTheme } from '@/context/ThemeContext';
import { getColors } from '@/constants/designSystem';

type Assignment = {
  id: number;
  user?: { id?: number; first_name?: string; last_name?: string } | null;
  gms?: { name?: string } | null;
  scheduled_date?: string | null;
  status?: string;
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#E9D5FF', // light purple
  completed: '#D1FAE5', // light green
  pending: '#FEF3C7', // light yellow
  cancelled: '#FECACA', // light red
};

export const VisitCalendar: React.FC<{ assignments: Assignment[] }> = ({ assignments }) => {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const isDark = theme === 'dark';

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Build weeks matrix (array of weeks, each week is array of Date | null)
  const weeks = useMemo(() => {
    const matrix: (Date | null)[][] = [];
    let week: (Date | null)[] = new Array(7).fill(null);
    days.forEach(day => {
      const weekday = getDay(day); // 0 = Sunday
      week[weekday] = day;
      if (weekday === 6) {
        matrix.push(week);
        week = new Array(7).fill(null);
      }
    });
    if (week.some(d => d !== null)) matrix.push(week);
    // Pad weeks to ensure each has 7 elements
    matrix.forEach(w => {
      while (w.length < 7) w.push(null);
    });
    return matrix;
  }, [days]);

  // Map assignments by date string (yyyy-MM-dd)
  const visitsByDate = useMemo(() => {
    const map: Record<string, Assignment[]> = {};
    assignments.forEach(a => {
      if (a.scheduled_date) {
        const key = format(parseISO(a.scheduled_date), 'yyyy-MM-dd');
        if (!map[key]) map[key] = [];
        map[key].push(a);
      }
    });
    return map;
  }, [assignments]);

  // Generate a deterministic pastel color per merchandiser ID
  const merchColors = useMemo(() => {
    const colorsMap: Record<number, string> = {};
    assignments.forEach(a => {
      if (a.user?.id != null) {
        // Simple hash to hue (0-360) using golden angle approx 137.5°
        const hue = (a.user.id * 137) % 360;
        colorsMap[a.user.id] = `hsl(${hue}, 65%, 70%)`;
      }
    });
    return colorsMap;
  }, [assignments]);

  const handlePrev = () => {
    const prev = subMonths(currentMonth, 1);
    setCurrentMonth(prev);
  };
  const handleNext = () => {
    const next = addMonths(currentMonth, 1);
    setCurrentMonth(next);
  };

  const monthLabel = format(currentMonth, 'MMMM yyyy');
  const totalVisits = assignments.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrev} style={styles.navBtn}>
          <Ionicons name="chevron-back-outline" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.monthTitle, { color: colors.text }]}>{monthLabel}</Text>
        <TouchableOpacity onPress={handleNext} style={styles.navBtn}>
          <Ionicons name="chevron-forward-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.subTitle, { color: colors.textMuted }]}>{totalVisits} scheduled visits</Text>
      {/* Weekday headers */}
      <View style={styles.weekRow}>
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
          <Text key={d} style={[styles.weekDay, { color: colors.textMuted }]}>{d}</Text>
        ))}
      </View>
      {/* Calendar grid */}
      <ScrollView contentContainerStyle={styles.grid}>
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.weekRow}>
            {week.map((day, di) => {
              const dateKey = day ? format(day, 'yyyy-MM-dd') : null;
              const visits = dateKey ? visitsByDate[dateKey] || [] : [];
              return (
                <View key={di} style={styles.dayCell}>
                  {day && (
                    <Text style={[styles.dayNumber, { color: colors.text }]}>{format(day, 'd')}</Text>
                  )}
                  {day && visits.slice(0, 3).map(v => (
                    <View key={v.id} style={[styles.visitCard, { backgroundColor: merchColors[v.user?.id] || STATUS_COLORS[v.status || 'scheduled'] }]}>
                      <Text style={styles.visitMerch}>{v.user?.first_name} {v.user?.last_name}</Text>
                      <Text style={styles.visitStore}>{v.gms?.name}</Text>
                    </View>
                  ))}
                  {day && visits.length > 3 && (
                    <Text style={styles.moreText}>+{visits.length - 3} more</Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 24,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  navBtn: { padding: 4 },
  monthTitle: { fontSize: 18, fontWeight: '600' },
  subTitle: { fontSize: 12, marginBottom: 12 },
  weekRow: { flexDirection: 'row' },
  weekDay: { flex: 1, textAlign: 'center', fontWeight: '600', fontSize: 12 },
  grid: { flexDirection: 'column' },
  dayCell: { flex: 1, minHeight: 80, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 4, padding: 4 },
  dayNumber: { fontSize: 12, fontWeight: '600' },
  visitCard: { borderRadius: 6, paddingVertical: 2, paddingHorizontal: 4, marginTop: 2 },
  visitMerch: { fontSize: 10, fontWeight: '600' },
  visitStore: { fontSize: 9, color: '#555' },
  moreText: { fontSize: 9, color: '#888', marginTop: 2 },
});
