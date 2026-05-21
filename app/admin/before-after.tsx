import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AdminWebLayout } from '@/components/admin/WebLayout';
import { Badge } from '@/components/ui/Badge';
import { WebCard, WebButton } from '@/components/ui/WebPrimitives';
import { useWebTheme } from '@/hooks/useWebTheme';
import { Fonts } from '@/hooks/useFonts';
import { ReportService, Report } from '@/services/report.service';
import { getFullImageUrl } from '@/constants/api';

export default function ReportsFilterPage() {
  const { T, isDark } = useWebTheme();
  const router = useRouter();
  const { user_id, id } = useLocalSearchParams();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user_id]);

  const loadData = async () => {
    setLoading(true);
    try {
      let allReports = await ReportService.getAll({ skip: 0, limit: 1000 });
      if (user_id) {
        allReports = allReports.filter(r => r.user_id === Number(user_id));
      }
      setReports(allReports);

      // Auto-select based on report ID or just the first one
      if (id) {
        const found = allReports.find(r => String(r.id) === String(id));
        if (found) setSelectedReport(found);
      } else if (allReports.length > 0) {
        setSelectedReport(allReports[0]);
      }
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'shift-summary': return { icon: 'log-in', color: T.success };
      case 'anomaly': return { icon: 'warning', color: T.danger };
      case 'before_after': return { icon: 'camera', color: T.info };
      default: return { icon: 'document-text', color: T.primary };
    }
  };

  const handleDownloadPDF = (reportId: number) => {
    alert(`Generating Detailed PDF Report for #${reportId}... Your download will start shortly.`);
  };

  if (loading) {
    return (
      <AdminWebLayout title="Reports Analysis">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={T.primary} />
          <Text style={{ marginTop: 16, color: T.textMuted, fontFamily: Fonts.body }}>Syncing Intelligence Database...</Text>
        </View>
      </AdminWebLayout>
    );
  }

  return (
    <AdminWebLayout title={user_id ? "Merchandiser Intelligence Reports" : "Global Intelligence Reports"}>
      <View style={{ marginBottom: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: 24, fontFamily: Fonts.headingXBold, color: T.text }}>
            {user_id ? "Filtered Reports" : "All System Reports"}
          </Text>
          <Text style={{ fontSize: 14, fontFamily: Fonts.body, color: T.textMuted, marginTop: 4 }}>
            Monitor events, anomalies, and AI visual intelligence submissions.
          </Text>
        </View>
        {user_id && (
          <WebButton 
            label="Back to Profile" 
            onPress={() => router.push(`/admin/merchandisers/${user_id}`)}
            icon={<Ionicons name="arrow-back" size={18} color="#fff" />}
            variant="secondary"
          />
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 24 }}>
        {/* Left: Reports List */}
        <View style={{ flex: 1.2 }}>
          <WebCard style={{ padding: 24, height: 700 }}>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 18, fontFamily: Fonts.headingBold, color: T.text }}>Inbox ({reports.length})</Text>
             </View>

             <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {reports.map(report => {
                  const iconConfig = getEventIcon(report.type);
                  return (
                    <TouchableOpacity 
                      key={report.id} 
                      onPress={() => setSelectedReport(report)}
                      style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        padding: 16, 
                        borderRadius: 16, 
                        backgroundColor: selectedReport?.id === report.id ? T.primaryLight : T.bg,
                        borderWidth: 1,
                        borderColor: selectedReport?.id === report.id ? T.primary : T.border,
                      } as any}
                    >
                      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: iconConfig.color + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: iconConfig.color + '50' }}>
                        <Ionicons name={iconConfig.icon as any} size={20} color={iconConfig.color} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 16 }}>
                        <Text style={{ fontSize: 15, fontFamily: Fonts.headingSemiBold, color: T.text }} numberOfLines={1}>{report.name || 'Untitled Report'}</Text>
                        <Text style={{ fontSize: 12, color: T.textMuted, fontFamily: Fonts.body }}>{new Date(report.created_at).toLocaleString()}</Text>
                      </View>
                      <Badge 
                          label={report.status.toUpperCase()} 
                          variant={report.status === 'approved' ? 'success' : report.status === 'rejected' ? 'danger' : 'warning'} 
                      />
                    </TouchableOpacity>
                  );
                })}
                {reports.length === 0 && (
                  <Text style={{ textAlign: 'center', color: T.textMuted, marginTop: 40, fontFamily: Fonts.body }}>No reports found.</Text>
                )}
             </ScrollView>
          </WebCard>
        </View>

        {/* Right: Detailed View */}
        <View style={{ flex: 2 }}>
          {selectedReport ? (
            <WebCard style={{ padding: 32, height: 700 }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 28, fontFamily: Fonts.headingXBold, color: T.text, marginBottom: 8 }}>{selectedReport.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: T.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                        <Ionicons name="person" size={14} color={T.primary} />
                        <Text style={{ fontSize: 13, color: T.text, fontFamily: Fonts.headingSemiBold }}>{selectedReport.merchandiser_name}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: T.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                        <Ionicons name="calendar" size={14} color={T.textMuted} />
                        <Text style={{ fontSize: 13, color: T.text, fontFamily: Fonts.body }}>{new Date(selectedReport.created_at).toLocaleString()}</Text>
                      </View>
                    </View>
                  </View>
                  <WebButton 
                    label="Export PDF" 
                    onPress={() => handleDownloadPDF(selectedReport.id)}
                    icon={<Ionicons name="download" size={18} color="#fff" />}
                  />
                </View>

                {selectedReport.notes && (
                  <View style={{ backgroundColor: T.surface, padding: 20, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: T.border }}>
                    <Text style={{ fontSize: 14, color: T.textMuted, fontFamily: Fonts.headingBold, marginBottom: 8 }}>NOTES & DETAILS</Text>
                    <Text style={{ fontSize: 15, color: T.text, fontFamily: Fonts.body, lineHeight: 24 }}>{selectedReport.notes}</Text>
                  </View>
                )}

                {(selectedReport.before_image || selectedReport.after_image || selectedReport.photo) && (
                  <View>
                    <Text style={{ fontSize: 18, fontFamily: Fonts.headingBold, color: T.text, marginBottom: 16 }}>Visual Intelligence Attachments</Text>
                    <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
                      {selectedReport.before_image && (
                        <View style={{ flex: 1, minWidth: 200 }}>
                          <Text style={{ fontSize: 13, color: T.textMuted, fontFamily: Fonts.headingSemiBold, marginBottom: 8 }}>BEFORE INTERVENTION</Text>
                          <Image source={{ uri: getFullImageUrl(selectedReport.before_image) }} style={{ width: '100%', height: 250, borderRadius: 16, backgroundColor: T.surface }} resizeMode="cover" />
                        </View>
                      )}
                      {selectedReport.after_image && (
                        <View style={{ flex: 1, minWidth: 200 }}>
                          <Text style={{ fontSize: 13, color: T.success, fontFamily: Fonts.headingSemiBold, marginBottom: 8 }}>AFTER INTERVENTION</Text>
                          <Image source={{ uri: getFullImageUrl(selectedReport.after_image) }} style={{ width: '100%', height: 250, borderRadius: 16, backgroundColor: T.surface }} resizeMode="cover" />
                        </View>
                      )}
                      {selectedReport.photo && (
                        <View style={{ flex: 1, minWidth: 200 }}>
                          <Text style={{ fontSize: 13, color: T.primary, fontFamily: Fonts.headingSemiBold, marginBottom: 8 }}>CAPTURED EVIDENCE</Text>
                          <Image source={{ uri: getFullImageUrl(selectedReport.photo) }} style={{ width: '100%', height: 250, borderRadius: 16, backgroundColor: T.surface }} resizeMode="cover" />
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </ScrollView>
            </WebCard>
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.surface, borderRadius: 32, borderStyle: 'dashed', borderWidth: 2, borderColor: T.border, padding: 40, height: 700 }}>
               <Ionicons name="search-outline" size={64} color={T.border} />
               <Text style={{ fontSize: 18, fontFamily: Fonts.headingSemiBold, color: T.textSecondary, marginTop: 16 }}>Select an Intelligence Report</Text>
               <Text style={{ fontSize: 14, color: T.textMuted, fontFamily: Fonts.body, marginTop: 8, textAlign: 'center', maxWidth: 400, lineHeight: 22 }}>
                 Choose a report from the inbox to analyze submitted anomalies, before/after visual proofs, and daily summary statistics.
               </Text>
            </View>
          )}
        </View>
      </View>
    </AdminWebLayout>
  );
}
