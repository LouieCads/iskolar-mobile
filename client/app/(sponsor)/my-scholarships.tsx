import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback, useMemo } from 'react';
import ScholarshipManagementCard from '@/components/scholarship-management-card';
import ScholarshipManagementMetrics from '@/components/scholarship-management-metrics';
import Header from '@/components/header';
import { scholarshipService } from '@/services/scholarship-creation.service';
import CreateScholarshipButton from '@/components/create-scholarship-button';

interface Sponsor {
  sponsor_id: string;
  organization_name: string;
  logo_url?: string;
  email?: string;
}

interface Scholarship {
  scholarship_id: string;
  sponsor_id: string;
  status: string;
  type?: string;
  purpose?: string;
  title: string;
  description?: string;
  total_amount: number;
  total_slot: number;
  application_deadline?: string;
  criteria: string[];
  required_documents: string[];
  image_url?: string;
  applications_count?: number;
  created_at: string;
  updated_at: string;
  sponsor: Sponsor;
}

export default function MyScholarshipsPage() {
  const router = useRouter();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchScholarships = useCallback(async () => {
    try {
      setError(null);
      const response = await scholarshipService.getSponsorScholarships();
      
      if (response.success && response.scholarships) {
        setScholarships(response.scholarships);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to load your scholarships');
      console.error('Error fetching sponsor scholarships:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchScholarships();
  }, [fetchScholarships]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchScholarships();
  }, [fetchScholarships]);

  const handleScholarshipPress = (scholarshipId: string) => {
    router.push(`/(sponsor)/scholarship/${scholarshipId}` as any);
  };

  const formatText = (text: string): string => {
    return text
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('-');
  };

  const formatArrayText = (text: string): string => {
    return text
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getTags = (scholarship: Scholarship): string[] => {
    const tags: string[] = [];
    
    if (scholarship.type) {
      tags.push(formatText(scholarship.type));
    }
    
    if (scholarship.purpose) {
      tags.push(formatText(scholarship.purpose));
    }
    
    return tags;
  };

  // Search functionality
  const filteredScholarships = useMemo(() => {
    if (!searchQuery.trim()) {
      return scholarships;
    }

    const query = searchQuery.toLowerCase().trim();

    return scholarships.filter((scholarship) => {
      if (scholarship.title?.toLowerCase().includes(query)) {
        return true;
      }

      if (scholarship.status?.toLowerCase().includes(query)) {
        return true;
      }

      if (scholarship.type?.toLowerCase().includes(query)) {
        return true;
      }

      if (scholarship.purpose?.toLowerCase().includes(query)) {
        return true;
      }

      if (scholarship.criteria?.some(c => c.toLowerCase().includes(query))) {
        return true;
      }

      if (scholarship.required_documents?.some(d => d.toLowerCase().includes(query))) {
        return true;
      }

      if (scholarship.total_amount?.toString().includes(query)) {
        return true;
      }

      return false;
    });
  }, [scholarships, searchQuery]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleCreateScholarship = () => {
    router.push('./create-scholarship' as any);
  };

  return (
    <View style={styles.container}>
      <Header 
        title="Scholarships" 
        onSearch={handleSearch}
        showSearch={true}
      />

      <ScholarshipManagementMetrics scholarships={scholarships} />

      {/* My Scholarships */}
      {!loading && !error && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>My Scholarships</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3A52A6" />
          <Text style={styles.loadingText}>Loading your scholarships...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={fetchScholarships}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : filteredScholarships.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="document-outline" size={45} color="#C0C0C0" />
          <Text style={styles.emptyText}>
            {searchQuery 
              ? 'No scholarships match your search' 
              : 'You haven\'t created any scholarships yet'}
          </Text>
          {searchQuery ? (
            <Text style={styles.searchHint}>Try different keywords</Text>
          ) : (
            <Pressable style={styles.createButton} onPress={handleCreateScholarship}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Scholarship</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3A52A6']}
              tintColor="#3A52A6"
            />
          }
        >
          {searchQuery && (
            <View style={styles.searchResultsHeader}>
              <Text style={styles.searchResultsText}>
                Found {filteredScholarships.length} scholarship{filteredScholarships.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          {filteredScholarships.map((scholarship) => (
            <ScholarshipManagementCard
              key={scholarship.scholarship_id}
              scholarship_id={scholarship.scholarship_id}
              title={scholarship.title}
              imageUrl={scholarship.image_url}
              sponsorName={scholarship.sponsor?.organization_name || 'Your Organization'}
              deadline={scholarship.application_deadline}
              amount={scholarship.total_amount}
              slots={scholarship.total_slot}
              applicationsCount={scholarship.applications_count}
              criteria={scholarship.criteria?.map(c => formatArrayText(c)) || []}
              documents={scholarship.required_documents?.map(d => formatArrayText(d)) || []}
              tags={getTags(scholarship)}
              onPress={() => handleScholarshipPress(scholarship.scholarship_id)}
            />
          ))}
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      {/* Floating Create Button */}
      {!loading && !error && (
        <CreateScholarshipButton onPress={handleCreateScholarship} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7FF',
    paddingBottom: 28,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeaderText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 16,
    color: '#5D6673',
    marginTop: 14,
  },
  errorText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 16,
    color: 'rgba(93, 102, 115, 1)',
    marginTop: 14,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#999',
    marginTop: 14,
    textAlign: 'center',
  },
  searchHint: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#C0C0C0',
    marginTop: 6,
  },
  retryButton: {
    backgroundColor: '#3A52A6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 16,
    color: '#F0F7FF',
  },
  createButton: {
    backgroundColor: '#EFA508',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createButtonText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#F0F7FF',
  },
  searchResultsHeader: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  searchResultsText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#5D6673',
  },
  bottomPadding: {
    height: 20,
  },
});