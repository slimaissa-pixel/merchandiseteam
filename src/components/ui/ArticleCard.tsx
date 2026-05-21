import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, Platform, TouchableOpacity } from 'react-native';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';
import { Article } from '@/services/article.service';
import { Badge } from './Badge';
import { Card } from './Card';
import { Fonts } from '@/hooks/useFonts';
import { Image } from 'react-native';

const PRODUCT_IMAGES: any = {
    'Beverage': require('@/assets/images/products/coca.png'),
    'Dairy': require('@/assets/images/products/milk.png'),
    'Snacks': require('@/assets/images/products/brownies.jpg'),
    'Frozen': require('@/assets/images/products/yaourt.png'),
    'Bakery': require('@/assets/images/products/brownies.jpg'),
    'Hygiene': require('@/assets/images/products/water.png'),
    'Other': require('@/assets/images/products/harissa.jpg'),
};

const getProductImage = (category: string, name: string) => {
    const cat = category || 'Other';
    const n = name.toLowerCase();
    
    // Keyword based matching
    if (n.includes('coca') || n.includes('soda') || n.includes('fanta')) return require('@/assets/images/products/coca.png');
    if (n.includes('water') || n.includes('eau') || n.includes('safia') || n.includes('sabrine')) return require('@/assets/images/products/water.png');
    if (n.includes('milk') || n.includes('lait') || n.includes('delice')) return require('@/assets/images/products/milk.png');
    if (n.includes('yaourt') || n.includes('yogurt') || n.includes('danup')) return require('@/assets/images/products/yaourt.png');
    if (n.includes('tomato') || n.includes('tomate')) return require('@/assets/images/products/tomato.png');
    if (n.includes('jben') || n.includes('cheese') || n.includes('fromage')) return require('@/assets/images/products/jben.png');
    if (n.includes('lben')) return require('@/assets/images/products/lben.jpg');
    if (n.includes('brownie') || n.includes('cake') || n.includes('biscuit') || n.includes('muffin')) return require('@/assets/images/products/brownies.jpg');
    if (n.includes('harissa') || n.includes('piment')) return require('@/assets/images/products/harissa.jpg');
    if (n.includes('tartiner') || n.includes('choco') || n.includes('nutella')) return require('@/assets/images/products/tartiner.jpg');
    
    // Category based fallback
    return PRODUCT_IMAGES[cat] || PRODUCT_IMAGES['Other'];
};

interface ArticleCardProps {
    article: Article;
    onEdit?: () => void;
    onDelete?: () => void;
    onPress?: () => void;
    style?: any;
    selected?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
    article,
    onEdit,
    onDelete,
    onPress,
    style,
    selected,
}) => {
    const { theme } = useTheme();
    const colors = getColors(theme);
    
    // Fallback values for visual consistency if data is missing
    const price = article.price || '€ 1.99';
    const facing = article.facing || '8 unités';
    const stock = article.stock !== undefined ? article.stock : 120;
    const stockMax = article.stock_max || 200;
    const storeName = article.store_name || 'Carrefour Paris 15';
    
    const stockPercent = Math.min(Math.max((stock / stockMax) * 100, 0), 100);
    const productImg = getProductImage(article.category || '', article.name);

    return (
        <Card 
            style={[
                styles.card, 
                style, 
                selected && { borderColor: colors.primary, borderWidth: 2 }
            ]} 
            onPress={onPress}
        >
            {/* Image at Top Center */}
            <View style={styles.imageContainer}>
                <Image source={productImg} style={styles.productImage} resizeMode="contain" />
            </View>

            {/* Header: Name + Category */}
            <View style={styles.header}>
                <View style={styles.headerInfo}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{article.name}</Text>
                        {selected && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                    </View>
                    <Badge 
                        label={article.category || 'Boissons'} 
                        variant="neutral" 
                        size="sm" 
                        style={styles.badge} 
                    />
                </View>
            </View>

            {/* Reference / Barcode */}
            <View style={styles.infoRow}>
                <Ionicons name="barcode-outline" size={16} color={colors.textMuted} />
                <Text style={[styles.infoText, { color: colors.textMuted }]}>{article.reference || '5449000000996'}</Text>
            </View>

            {/* Store */}
            <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>Magasin: {storeName}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Price & Facing Grid */}
            <View style={styles.grid}>
                <View style={styles.gridItem}>
                    <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Prix</Text>
                    <Text style={[styles.gridValue, { color: colors.text }]}>{price}</Text>
                </View>
                <View style={styles.gridItem}>
                    <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Facing</Text>
                    <Text style={[styles.gridValue, { color: colors.text }]}>{facing}</Text>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Stock Progress */}
            <View style={styles.stockSection}>
                <Text style={[styles.gridLabel, { color: colors.textSecondary, marginBottom: 8 }]}>Stock</Text>
                <View style={styles.progressRow}>
                    <View style={[styles.progressBg, { backgroundColor: theme === 'light' ? '#F1F5F9' : '#1E293B' }]}>
                        <View style={[styles.progressFill, { width: `${stockPercent}%`, backgroundColor: '#22C55E' }]} />
                    </View>
                    <Text style={[styles.stockValue, { color: '#22C55E' }]}>{stock}</Text>
                </View>
            </View>

            {/* Actions */}
            {(onEdit || onDelete) && (
                <View style={styles.actions}>
                    {onEdit && (
                        <TouchableOpacity 
                            onPress={onEdit}
                            style={[styles.editBtn, { borderColor: colors.border, backgroundColor: theme === 'dark' ? '#1e1b4b10' : 'transparent' }]}
                        >
                            <Ionicons name="create-outline" size={18} color={theme === 'dark' ? colors.primary : colors.text} />
                            <Text style={[styles.editBtnText, { color: theme === 'dark' ? colors.primary : colors.text }]}>Modifier</Text>
                        </TouchableOpacity>
                    )}
                    {onDelete && (
                        <TouchableOpacity 
                            onPress={onDelete}
                            style={[styles.deleteBtn, { borderColor: colors.danger + '40' }]}
                        >
                            <Ionicons name="trash-outline" size={18} color={colors.danger} />
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
        ...Platform.select({
            web: {
                transition: 'all 0.2s ease-in-out',
            }
        })
    },
    imageContainer: {
        width: '100%',
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    productImage: {
        width: 90,
        height: 90,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    headerInfo: {
        flex: 1,
        gap: 2,
    },
    name: {
        fontSize: 15,
        fontFamily: Fonts.headingSemiBold,
    },
    badge: {
        marginTop: 0,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    infoText: {
        fontSize: 12,
        fontFamily: Fonts.body,
    },
    divider: {
        height: 1,
        width: '100%',
        marginVertical: 10,
        opacity: 0.4,
    },
    grid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    gridItem: {
        flex: 1,
        gap: 2,
    },
    gridLabel: {
        fontSize: 10,
        fontFamily: Fonts.body,
    },
    gridValue: {
        fontSize: 13,
        fontFamily: Fonts.headingXBold,
    },
    stockSection: {
        marginTop: 2,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    progressBg: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    stockValue: {
        fontSize: 12,
        fontFamily: Fonts.headingXBold,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    editBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 38,
        borderRadius: 10,
        borderWidth: 1,
    },
    editBtnText: {
        fontSize: 12,
        fontFamily: Fonts.headingSemiBold,
    },
    deleteBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
