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

export default function WebPerformanceChart({ data }: { data: any[] }) {
  if (Platform.OS !== 'web' || !Recharts) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#888' }}>Chart available on web only</Text>
      </View>
    );
  }

  const { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } = Recharts;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorObj" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff15" />
        <XAxis 
          dataKey="label" 
          stroke="#ffffff50" 
          fontSize={11} 
          tickLine={false} 
          axisLine={false}
          dy={10}
        />
        <YAxis 
          stroke="#ffffff50" 
          fontSize={11} 
          tickLine={false} 
          axisLine={false} 
          dx={-10}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: 8, color: '#fff' }}
          itemStyle={{ color: '#fff' }}
        />
        <Area 
          type="monotone" 
          dataKey="visits" 
          name="Visits"
          stroke="#818cf8" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorVisits)" 
          activeDot={{ r: 6, fill: '#818cf8', stroke: '#fff', strokeWidth: 2 }}
        />
        <Area 
          type="monotone" 
          dataKey="objectives" 
          name="Objectives"
          stroke="#22c55e" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorObj)" 
          activeDot={{ r: 6, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
