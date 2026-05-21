export * from './auth';

export interface UserTypeButtonProps {
  title: string;
  icon: string;
  color: string;
  isSelected: boolean;
  onPress: () => void;
}