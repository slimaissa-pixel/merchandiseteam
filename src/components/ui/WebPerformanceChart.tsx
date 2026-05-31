import React from 'react';
import { Platform, View, Text } from 'react-native';

let Recharts: any = null;
if (Platform.OS === 'web') {
  try {
    Recharts = require('recharts');
  } catch (e) {
    console.warn('Recharts not available', e);
  }
}

export default function WebPerformanceChart({ data, isDark = true }: { data: any[]; isDark?: boolean }) {
  if (Platform.OS !== 'web' || !Recharts) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#888' }}>Chart available on web only</Text>
      </View>
    );
  }

  const { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = Recharts;

  const visitColor   = isDark ? '#818cf8' : '#3B82F6';
  const objColor     = isDark ? '#22c55e' : '#10B981';
  const gridStroke   = isDark ? '#ffffff15' : '#E2E8F0';
  const axisStroke   = isDark ? '#ffffff50' : '#94A3B8';
  const tooltipBg    = isDark ? '#18181b' : '#FFFFFF';
  const tooltipBd    = isDark ? '#27272a' : '#E2E8F0';
  const tooltipColor = isDark ? '#fff'    : '#0F172A';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="cvL" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={visitColor} stopOpacity={isDark ? 0.3 : 0.12} />
            <stop offset="95%" stopColor={visitColor} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="coL" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={objColor} stopOpacity={isDark ? 0.3 : 0.12} />
            <stop offset="95%" stopColor={objColor} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
        <XAxis dataKey="label" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} dy={10} />
        <YAxis stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} dx={-10} />
        <Tooltip
          contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBd, borderRadius: 10, color: tooltipColor, fontSize: 12, boxShadow: isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.08)' }}
          itemStyle={{ color: tooltipColor }}
          cursor={{ stroke: isDark ? '#ffffff20' : '#E2E8F0', strokeWidth: 1 }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ paddingTop: 12, fontSize: 12, color: isDark ? '#a1a1aa' : '#64748B' }}
        />
        <Area
          type="monotone"
          dataKey="visits"
          name="Visits"
          stroke={visitColor}
          strokeWidth={2.5}
          fillOpacity={1}
          fill="url(#cvL)"
          dot={false}
          activeDot={{ r: 5, fill: visitColor, stroke: isDark ? '#18181b' : '#FFFFFF', strokeWidth: 2 }}
        />
        <Area
          type="monotone"
          dataKey="objectives"
          name="Objectives"
          stroke={objColor}
          strokeWidth={2.5}
          fillOpacity={1}
          fill="url(#coL)"
          dot={false}
          activeDot={{ r: 5, fill: objColor, stroke: isDark ? '#18181b' : '#FFFFFF', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
