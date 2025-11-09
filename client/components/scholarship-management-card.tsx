import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ScholarshipManagementCardProps {
  scholarship_id: string;
  title: string;
  imageUrl?: string;
  sponsorName: string;
  deadline?: string;
  amount: number;
  slots: number;
  applicationsCount?: number;
  criteria: string[];
  documents: string[];
  tags?: string[];
  onPress: () => void;
}

export default function ScholarshipManagementCard({
  scholarship_id,
  title,
  imageUrl,
  sponsorName,
  deadline,
  amount,
  slots,
  applicationsCount,
  criteria,
  documents,
  tags = [],
  onPress,
}: ScholarshipManagementCardProps) {
  const amountPerScholar = slots > 0 ? amount / slots : amount;

  const formatAmount = (value: number) => {
    return `₱ ${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const displayCriteria = criteria.slice(0, 2);
  const moreCriteria = criteria.length > 2 ? criteria.length - 2 : 0;
  
  const displayDocuments = documents.slice(0, 2);
  const moreDocuments = documents.length > 2 ? documents.length - 2 : 0;

  return (
    <View style={styles.container}>
      <Pressable 
        style={styles.card}
        onPress={onPress}
      >
        <LinearGradient
          colors={['#3A52A6', '#3A52A6', '#607EF2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardHeader}
        >
          <Image 
            source={
              imageUrl 
                ? { uri: imageUrl } 
                : require('@/assets/images/iskolar-logo.png')
            }
            style={styles.cardImage}
            defaultSource={require('@/assets/images/iskolar-logo.png')}
          />
          <View style={styles.cardHeaderContent}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {title}
            </Text>
            {tags.length > 0 && (
              <View style={styles.tagContainer}>
                {tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={styles.infoRow}>
              <Ionicons name="person-circle-outline" size={16} color="#F0F7FF" />
              <Text style={styles.infoText} numberOfLines={1}>
                {sponsorName}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#F0F7FF" />
              <Text style={styles.infoText}>
                {formatDate(deadline)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          <View style={styles.detailsContainer}>
            {applicationsCount !== undefined && (
              <View style={styles.detailBox}>
                <View style={styles.detailHeader}>
                  <Ionicons name="people-outline" size={12} color="#FF6B6B" />
                  <Text style={styles.detailLabel}>Applications</Text>
                </View>
                <Text style={styles.applicationsText}>{applicationsCount}</Text>
                <Text style={styles.subText}>applicants</Text>
              </View>
            )}

            <View style={[styles.detailBox, styles.amountBox]}>
              <View style={styles.detailHeader}>
                <Ionicons name="cash-outline" size={12} color="#31D0AA" />
                <Text style={styles.detailLabel}>Amount</Text>
              </View>
              <Text style={styles.amountText}>{formatAmount(amountPerScholar)}</Text>
              <Text style={styles.subText}>per scholar</Text>
            </View>

            <View style={[styles.detailBox, styles.slotsBox]}>
              <View style={styles.detailHeader}>
                <Ionicons name="people-outline" size={12} color="#607EF2" />
                <Text style={styles.detailLabel}>Slots</Text>
              </View>
              <Text style={styles.slotsText}>{slots}</Text>
              <Text style={styles.subText}>scholars</Text>
            </View>
          </View>

          {criteria.length > 0 && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Criteria</Text>
              <View style={styles.chipsContainer}>
                {displayCriteria.map((item, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{item}</Text>
                  </View>
                ))}
                {moreCriteria > 0 && (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>+ {moreCriteria} more</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {documents.length > 0 && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Required Documents</Text>
              <View style={styles.chipsContainer}>
                {displayDocuments.map((doc, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{doc}</Text>
                  </View>
                ))}
                {moreDocuments > 0 && (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>+ {moreDocuments} more</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: '#F0F7FF',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
  },
  cardImage: {
    width: 120,
    height: 120,
    borderTopLeftRadius: 8,
    backgroundColor: '#F0F7FF',
    resizeMode: 'cover',
  },
  cardHeaderContent: {
    flex: 1,
    marginLeft: 16,
    paddingTop: 8,
    paddingRight: 12,
  },
  cardTitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 20,
    color: '#F0F7FF',
    marginBottom: 4,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tagText: {
    fontFamily: 'BreeSerif_400Regular',
    color: '#F0F7FF',
    fontSize: 9,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    fontFamily: 'BreeSerif_400Regular',
    color: '#F0F7FF',
    fontSize: 12,
    flex: 1,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  detailsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  detailBox: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderRadius: 12,
    padding: 8,
  },
  amountBox: {
    borderColor: '#31D0AA',
  },
  slotsBox: {
    borderColor: '#607EF2',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  detailLabel: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 10.5,
    color: '#5D6673',
  },
  applicationsText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#FF6B6B',
    marginBottom: 2,
  },
  amountText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#31D0AA',
    marginBottom: 2,
  },
  slotsText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#607EF2',
    marginBottom: 2,
  },
  subText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 9,
    color: '#666',
  },
  infoSection: {
    marginBottom: 11,
  },
  sectionTitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#5D6673',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#eaeafeff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chipText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 10,
    color: '#5D6673',
  },
});