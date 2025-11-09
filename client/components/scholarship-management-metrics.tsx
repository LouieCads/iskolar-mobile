import { View, Text, StyleSheet } from 'react-native';

interface Scholarship {
  status: string;
  total_slot: number;
  total_amount: number;
  applications_count?: number;
}

interface ScholarshipManagementMetricsProps {
  scholarships: Scholarship[];
}

export default function ScholarshipManagementMetrics({ scholarships }: ScholarshipManagementMetricsProps) {
  const metrics = {
    total: scholarships.length,
    active: scholarships.filter(s => s.status === 'active').length,
    applications: scholarships.reduce((sum, s) => sum + (s.applications_count || 0), 0)
  };

  return (
    <View style={styles.metricsContainer}>
      <View style={styles.metItem}>
        <View style={[styles.metDot, { backgroundColor: '#607EF2' }]} />
        <Text style={styles.metLabel}>Total</Text>
        <Text style={styles.metValue}>{metrics.total}</Text>
      </View>
      <View style={styles.metItem}>
        <View style={[styles.metDot, { backgroundColor: '#31D0AA' }]} />
        <Text style={styles.metLabel}>Active</Text>
        <Text style={styles.metValue}>{metrics.active}</Text>
      </View>
      <View style={styles.metItem}>
        <View style={[styles.metDot, { backgroundColor: '#FF6B6B' }]} />
        <Text style={styles.metLabel}>Applications</Text>
        <Text style={styles.metValue}>{metrics.applications}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  metricsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metLabel: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#5D6673',
  },
  metValue: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#111827',
  },
});