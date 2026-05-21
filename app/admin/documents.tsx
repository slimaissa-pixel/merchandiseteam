import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View, ScrollView, TextInput, Switch } from 'react-native';
import { AdminWebLayout } from '@/components/admin/WebLayout';
import { Badge } from '@/components/ui/Badge';
import { WebCard, WebButton } from '@/components/ui/WebPrimitives';
import { useWebTheme } from '@/hooks/useWebTheme';
import { Fonts } from '@/hooks/useFonts';
import { DocumentService } from '@/services/document.service';
import { StorageKeys, StorageService } from '@/services/storage.service';
import { UserService } from '@/services/user.service';

import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

const documentTypes = ['Guide', 'Instructions', 'Training'];
const categories = ['All', 'Guide', 'Instructions', 'Training'];

export default function DocumentsPage() {
    const router = useRouter();
    const { T, isDark } = useWebTheme();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [title, setTitle] = useState('');
    const [type, setType] = useState('Guide');
    const [description, setDescription] = useState('');
    const [targetAudience, setTargetAudience] = useState<string[]>(['merchandiser']);
    const [sendNotification, setSendNotification] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

    const [users, setUsers] = useState<any[]>([]);
    const [specificMerchandisers, setSpecificMerchandisers] = useState<number[]>([]);
    const [specificSupervisors, setSpecificSupervisors] = useState<number[]>([]);

    const fetchDocuments = useCallback(async () => {
        try {
            setLoading(true);
            const token = await StorageService.getItem(StorageKeys.USER_TOKEN);
            const m = await import('@/services/apiClient');
            const res = await m.default.get('/api/documents/', { params: { limit: 100 } });
            setDocuments(res.data || []);
        } catch (error) {
            console.error('Failed to load documents:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
        UserService.getAll({ limit: 1000 }).then(setUsers);
    }, [fetchDocuments]);

    const handlePickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                setFile(result.assets[0]);
            }
        } catch (e) {
            console.error('Pick file error:', e);
        }
    };

    const handleUpload = async () => {
        if (!title || !description || !file) {
            alert('Please provide title, description and select a file');
            return;
        }
        setIsUploading(true);
        try {
            const formData = new FormData();
            if (Platform.OS === 'web') {
                const res = await fetch(file.uri);
                const blob = await res.blob();
                formData.append('file', blob, file.name);
            } else {
                formData.append('file', {
                    uri: file.uri,
                    name: file.name,
                    type: file.mimeType || 'application/pdf',
                } as any);
            }

            const m = await import('@/services/apiClient');
            const uploadRes = await m.default.post('/api/upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 120000, // 2 minutes for large documents
            });
            const fileUrl = uploadRes.data.url;

            let targetArr: string[] = [];
            if (targetAudience.includes('merchandiser')) {
                if (specificMerchandisers.length === 0) targetArr.push('merchandiser');
                else targetArr.push(...specificMerchandisers.map(id => `user:${id}`));
            }
            if (targetAudience.includes('supervisor')) {
                if (specificSupervisors.length === 0) targetArr.push('supervisor');
                else targetArr.push(...specificSupervisors.map(id => `user:${id}`));
            }
            const targetString = targetArr.join(',');

            await m.default.post('/api/documents/', {
                name: title,
                category: type,
                size: file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
                type: file.name.split('.').pop()?.toUpperCase() || 'PDF',
                url: fileUrl,
                target: targetString,
                send_notification: sendNotification
            }, { timeout: 30000 });
            
            setTitle('');
            setDescription('');
            setFile(null);
            setSpecificMerchandisers([]);
            setSpecificSupervisors([]);
            alert('Document uploaded and shared successfully!');
            fetchDocuments();
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload document');
        } finally {
            setIsUploading(false);
        }
    };

    const toggleAudience = (role: string) => {
        if (targetAudience.includes(role)) {
            setTargetAudience(targetAudience.filter(r => r !== role));
        } else {
            setTargetAudience([...targetAudience, role]);
        }
    };

    const filteredDocs = documents.filter(doc =>
        selectedCategory === 'All' || doc.category === selectedCategory
    );

    return (
        <AdminWebLayout title="Document Management">
            {/* 1. Share Resources Form */}
            <WebCard style={{ marginBottom: 32, padding: 32 }}>
                <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 24, fontFamily: Fonts.headingXBold, color: T.text }}>Share Resources</Text>
                    <Text style={{ fontSize: 14, fontFamily: Fonts.body, color: T.textMuted, marginTop: 4 }}>
                        Share guides, training materials or instructions with your global team.
                    </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 24, marginBottom: 20 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontFamily: Fonts.headingBold, color: T.text, marginBottom: 8, letterSpacing: 0.5 }}>DOCUMENT TITLE</Text>
                        <TextInput
                            style={{ backgroundColor: T.bg, color: T.text, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: T.border, fontSize: 14, fontFamily: Fonts.body } as any}
                            placeholder="e.g. Q4 Visual Merchandising Guide"
                            placeholderTextColor={T.textMuted}
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>
                    <View style={{ width: 300 }}>
                        <Text style={{ fontSize: 13, fontFamily: Fonts.headingBold, color: T.text, marginBottom: 8, letterSpacing: 0.5 }}>DOCUMENT TYPE</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {documentTypes.map(t => (
                                <TouchableOpacity
                                    key={t}
                                    onPress={() => setType(t)}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 10,
                                        borderRadius: 10,
                                        backgroundColor: type === t ? T.primary : T.bg,
                                        borderWidth: 1,
                                        borderColor: type === t ? T.primary : T.border
                                    }}
                                >
                                    <Text style={{ color: type === t ? '#fff' : T.text, fontSize: 13, fontFamily: Fonts.headingSemiBold }}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 13, fontFamily: Fonts.headingBold, color: T.text, marginBottom: 8, letterSpacing: 0.5 }}>DESCRIPTION</Text>
                    <TextInput
                        style={{ backgroundColor: T.bg, color: T.text, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: T.border, fontSize: 14, fontFamily: Fonts.body, minHeight: 80 } as any}
                        placeholder="Briefly describe the purpose of this document..."
                        placeholderTextColor={T.textMuted}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 13, fontFamily: Fonts.headingBold, color: T.text, marginBottom: 8, letterSpacing: 0.5 }}>FILE ATTACHMENT</Text>
                    <TouchableOpacity 
                        onPress={handlePickFile}
                        // @ts-ignore
                        onDragOver={(e: any) => {
                            if (Platform.OS === 'web') e.preventDefault();
                        }}
                        onDrop={(e: any) => {
                            if (Platform.OS === 'web') {
                                e.preventDefault();
                                if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
                                    const droppedFile = e.dataTransfer.files[0];
                                    setFile({
                                        uri: URL.createObjectURL(droppedFile),
                                        name: droppedFile.name,
                                        size: droppedFile.size,
                                        mimeType: droppedFile.type,
                                    } as any);
                                }
                            }
                        }}
                        style={{ height: 120, borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, borderColor: file ? T.primary : T.border, justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: file ? T.primary + '10' : T.bg }}
                    >
                        {file ? (
                            <>
                                <Ionicons name="document-text" size={32} color={T.primary} />
                                <Text style={{ fontSize: 14, fontFamily: Fonts.headingSemiBold, color: T.text }}>{file.name}</Text>
                                <Text style={{ fontSize: 11, fontFamily: Fonts.body, color: T.textMuted }}>{(file.size ? (file.size / 1024 / 1024).toFixed(2) : 0)} MB • Tap to change</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="cloud-upload-outline" size={32} color={T.primary} />
                                <Text style={{ fontSize: 14, fontFamily: Fonts.headingSemiBold, color: T.text }}>Click to upload or drag and drop</Text>
                                <Text style={{ fontSize: 11, fontFamily: Fonts.body, color: T.textMuted }}>PDF, DOC, Max. 10MB</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: T.border, paddingTop: 24 }}>
                    <View style={{ flexDirection: 'row', gap: 40 }}>
                        <View>
                            <Text style={{ fontSize: 11, fontFamily: Fonts.headingBold, color: T.textMuted, marginBottom: 12, letterSpacing: 1 }}>TARGET AUDIENCE</Text>
                            <View style={{ flexDirection: 'row', gap: 24 }}>
                                {['merchandiser', 'supervisor'].map(role => (
                                    <View key={role}>
                                        <TouchableOpacity 
                                            onPress={() => toggleAudience(role)}
                                            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: targetAudience.includes(role) ? T.primary + '15' : 'transparent', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: targetAudience.includes(role) ? T.primary : T.border }}
                                        >
                                            <View style={{ width: 16, height: 16, borderRadius: 4, borderWidth: 2, borderColor: targetAudience.includes(role) ? T.primary : T.textMuted, backgroundColor: targetAudience.includes(role) ? T.primary : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
                                                {targetAudience.includes(role) && <Ionicons name="checkmark" size={12} color="#fff" />}
                                            </View>
                                            <Text style={{ fontSize: 13, fontFamily: Fonts.headingSemiBold, color: targetAudience.includes(role) ? T.primary : T.text, textTransform: 'capitalize' }}>{role}</Text>
                                        </TouchableOpacity>

                                        {targetAudience.includes(role) && (
                                            <View style={{ marginTop: 12 }}>
                                                <Text style={{ fontSize: 10, fontFamily: Fonts.bodyBold, color: T.textMuted, marginBottom: 6, textTransform: 'uppercase' }}>Select specific (leave empty for all):</Text>
                                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, maxWidth: 280 }}>
                                                    {users.filter(u => u.role === role).map(u => {
                                                        const isSelected = role === 'merchandiser' ? specificMerchandisers.includes(u.id) : specificSupervisors.includes(u.id);
                                                        return (
                                                            <TouchableOpacity
                                                                key={u.id}
                                                                onPress={() => {
                                                                    if (role === 'merchandiser') {
                                                                        setSpecificMerchandisers(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]);
                                                                    } else {
                                                                        setSpecificSupervisors(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]);
                                                                    }
                                                                }}
                                                                style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: isSelected ? T.primary : T.bg, borderWidth: 1, borderColor: isSelected ? T.primary : T.border }}
                                                            >
                                                                <Text style={{ fontSize: 11, fontFamily: Fonts.bodySemiBold, color: isSelected ? '#fff' : T.text }}>{u.first_name} {u.last_name}</Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                        <View>
                            <Text style={{ fontSize: 11, fontFamily: Fonts.headingBold, color: T.textMuted, marginBottom: 12, letterSpacing: 1 }}>NOTIFICATIONS</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <Switch value={sendNotification} onValueChange={setSendNotification} trackColor={{ false: T.border, true: T.primary }} />
                                <Text style={{ fontSize: 13, fontFamily: Fonts.bodySemiBold, color: T.text }}>Send notification to selected audience</Text>
                            </View>
                        </View>
                    </View>

                    <WebButton
                        label={isUploading ? "Uploading..." : "Upload and Share"}
                        onPress={handleUpload}
                        disabled={isUploading}
                        loading={isUploading}
                        icon={<Ionicons name="send" size={18} color="#fff" />}
                    />
                </View>
            </WebCard>

            {/* 2. Existing Documents List */}
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <Text style={{ fontSize: 20, fontFamily: Fonts.headingXBold, color: T.text }}>Published Resources</Text>
                    <View style={{ flexDirection: 'row', backgroundColor: T.surface, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: T.border }}>
                        {categories.map(category => (
                            <TouchableOpacity
                                key={category}
                                onPress={() => setSelectedCategory(category)}
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 8,
                                    borderRadius: 8,
                                    backgroundColor: selectedCategory === category ? T.surface : 'transparent',
                                } as any}
                            >
                                <Text style={{ color: selectedCategory === category ? T.primary : T.textMuted, fontFamily: Fonts.headingSemiBold, fontSize: 13 }}>
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={T.primary} style={{ marginTop: 40 }} />
                ) : (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
                        {filteredDocs.map(doc => (
                            <WebCard key={doc.id} style={{ width: '31.5%' } as any}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                                        <Ionicons name="document-text" size={20} color={T.primary} />
                                    </View>
                                    <Badge label={doc.category} variant="primary" />
                                </View>
                                <Text style={{ fontSize: 15, fontFamily: Fonts.headingSemiBold, color: T.text, marginBottom: 4 }} numberOfLines={1}>{doc.name}</Text>
                                <Text style={{ fontSize: 12, color: T.textMuted, fontFamily: Fonts.body, marginBottom: 16 }}>Shared with: {doc.target || 'All Roles'}</Text>
                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8, borderRadius: 8, backgroundColor: T.bg, borderWidth: 1, borderColor: T.border }}
                                >
                                    <Ionicons name="eye-outline" size={16} color={T.text} />
                                    <Text style={{ color: T.text, fontFamily: Fonts.bodySemiBold, fontSize: 13 }}>View Document</Text>
                                </TouchableOpacity>
                            </WebCard>
                        ))}
                    </View>
                )}
            </View>
        </AdminWebLayout>
    );
}
