import { Text, StyleSheet } from 'react-native';

interface FormErrorMessageProps {
  message?: string;
}

export default function FormErrorMessage({ message }: FormErrorMessageProps) {
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
}

const styles = StyleSheet.create({
  error: {
    fontFamily: 'BreeSerif_400Regular',
    color: '#EF4444',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
});
