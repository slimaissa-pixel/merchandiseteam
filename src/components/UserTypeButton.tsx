import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { UserTypeButtonProps } from '@/types';

export default function UserTypeButton({
  title,
  icon,
  color,
  isSelected,
  onPress
}: UserTypeButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        isSelected && styles.buttonSelected,
        isSelected && { borderColor: color }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={24} color="white" />
      </View>
      <Text style={styles.buttonText}>{title}</Text>
      {isSelected && (
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={color}
          style={styles.checkIcon}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    width: '30%',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  buttonSelected: {
    borderWidth: 2,
    elevation: 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  checkIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
});