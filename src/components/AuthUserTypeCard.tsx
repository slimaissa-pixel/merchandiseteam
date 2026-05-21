import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Fonts } from '@/hooks/useFonts';

type UserType = 'admin' | 'supervisor' | 'merchandiser';

interface AuthUserTypeCardProps {
    type: UserType;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string; // The specific role color (e.g. red, green)
    selectedType: UserType | null;
    onSelect: (type: UserType) => void;
}

const AuthUserTypeCard = ({ type, title, icon, color, selectedType, onSelect }: AuthUserTypeCardProps) => {
    const isSelected = selectedType === type;

    return (
        <TouchableOpacity
            style={[
                styles.typeCard,
                {
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderColor: isSelected ? color : 'rgba(255,255,255,0.1)',
                    borderWidth: isSelected ? 2 : 1,
                },
                isSelected && { backgroundColor: 'rgba(255,255,255,0.1)' }
            ]}
            onPress={() => onSelect(type)}
        >
            <View style={[styles.iconContainer, { backgroundColor: color }]}>
                <Ionicons name={icon} size={24} color="white" />
            </View>
            <Text style={[styles.typeText, { color: color }]}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    typeCard: {
        width: '30%',
        aspectRatio: 1,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    iconContainer: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    typeText: {
        fontSize: 11,
        fontFamily: Fonts.headingSemiBold,
        textAlign: 'center',
    },
});

export default AuthUserTypeCard;
