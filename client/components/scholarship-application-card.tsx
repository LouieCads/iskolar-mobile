import { View, Text, Image, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useRef } from 'react';

interface ScholarshipApplicationCardProps {
  scholarship_id: string;
  title: string;
  imageUrl?: string;
  profileUrl?: string;
  sponsorName: string;
  deadline?: string;
  amount: number;
  slots: number;
  criteria: string[];
  documents: string[];
  tags: string[];
  status: 'pending' | 'shortlisted' | 'approved' | 'denied';
  onPress?: () => void;
}

const statusIconMap = {
  pending: { name: 'time-outline', color: '#F7B801', label: 'Pending' },
  shortlisted: { name: 'star', color: '#a91cbfff', label: 'Shortlisted' },
  approved: { name: 'checkmark-circle-outline', color: '#31D0AA', label: 'Approved' },
  denied: { name: 'close-circle-outline', color: '#FF6B6B', label: 'Denied' },
};

export default function ScholarshipApplicationCard({
  scholarship_id,
  title,
  imageUrl,
  profileUrl,
  sponsorName,
  deadline,
  amount,
  slots,
  criteria,
  documents,
  tags,
  status,
  onPress,
}: ScholarshipApplicationCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 6,
      bounciness: 2,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 6,
      bounciness: 2,
    }).start();
  };

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
      day: 'numeric',
    });
  };

  const displayCriteria = criteria.slice(0, 2);
  const moreCriteria = criteria.length > 2 ? criteria.length - 2 : 0;
  const displayDocuments = documents.slice(0, 2);
  const moreDocuments = documents.length > 2 ? documents.length - 2 : 0;

  const statusIcon = statusIconMap[status];

  return (
    <View style={styles.container}>
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
        <Pressable 
          style={({ pressed }) => [
            styles.card,
            isPressed && styles.cardPressed,
          ]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
        <LinearGradient
          colors={['#3A52A6', '#3A52A6', '#607EF2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardHeader}
        >
          <Image
            source={
              imageUrl ? { uri: imageUrl } : require('@/assets/images/iskolar-logo.png')
            }
            style={styles.cardImage}
            defaultSource={require('@/assets/images/iskolar-logo.png')}
          />
          <View style={styles.cardHeaderContent}>
            <View style={styles.headerRow}>
              <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                {title}
              </Text>
              <View style={styles.statusIconBox}>
                <Ionicons
                  name={statusIcon.name as any}
                  size={21}
                  color={statusIcon.color}
                />
              </View>
            </View>
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
              <Image 
                source={
                  profileUrl ? { uri: profileUrl } : require('@/assets/images/iskolar.png')
                }
                style={styles.profileImage}
                defaultSource={require('@/assets/images/iskolar.png')}
              />
              <Text style={styles.infoText} numberOfLines={1}>
                {sponsorName}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#F0F7FF" />
              <Text style={styles.infoText}>{formatDate(deadline)}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          <View style={styles.detailsContainer}>
            <View style={styles.detailBox}>
              <View style={styles.detailHeader}>
                <Ionicons name="cash-outline" size={16} color="#31D0AA" />
                <Text style={styles.detailLabel}>Amount</Text>
              </View>
              <Text style={styles.amountText}>{formatAmount(amountPerScholar)}</Text>
              <Text style={styles.perScholar}>per scholar</Text>
            </View>

            <View style={[styles.detailBox, styles.slotsBox]}>
              <View style={styles.detailHeader}>
                <Ionicons name="people-outline" size={16} color="#607EF2" />
                <Text style={styles.detailLabel}>Slots</Text>
              </View>
              <Text style={styles.slotsText}>{slots}</Text>
              <Text style={styles.scholarsText}>scholars</Text>
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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 21,
    marginHorizontal: 2,
    overflow: 'hidden',
    shadowColor: '#3A52A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  cardPressed: {
    shadowColor: '#3A52A6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    transform: [{ scale: 0.98 }],
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
  profileImage: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F0F7FF',
    resizeMode: 'cover',
  },
  cardHeaderContent: {
    flex: 1,
    paddingTop: 6,
    paddingHorizontal: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 20,
    color: '#F0F7FF',
    flex: 1,
    marginRight: 8,
  },
  statusIconBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    marginLeft: 2,
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
    gap: 12,
    marginBottom: 14,
  },
  detailBox: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#31D0AA',
    borderRadius: 12,
    padding: 8,
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
    fontSize: 13,
    color: '#5D6673',
  },
  amountText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#31D0AA',
    marginBottom: 2,
  },
  perScholar: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 11,
    color: '#666',
  },
  slotsText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#607EF2',
    marginBottom: 2,
  },
  scholarsText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 11,
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
