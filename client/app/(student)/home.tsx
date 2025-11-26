// app/(student)/home.tsx
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Pressable, 
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/header';
import ScholarshipApplicationCard from '@/components/scholarship-application-card';
import { scholarshipApplicationService } from '@/services/scholarship-application.service';

type FilterType = 'all' | 'applied' | 'past';

interface Application {
  scholarship_application_id: string;
  student_id: string;
  scholarship_id: string;
  status: 'pending' | 'shortlisted' | 'approved' | 'denied';
  remarks?: string;
  custom_form_response: Array<{ label: string; value: any }>;
  applied_at: string;
  updated_at: string;
  scholarship?: {
    scholarship_id: string;
    title: string;
    description: string;
    type?: string;
    purpose?: string;
    total_amount: number; 
    total_slot: number;
    application_deadline?: string;
    criteria: string[];
    required_documents: string[]; 
    tags: string[];
    image_url?: string; 
    sponsor: {
      sponsor_id: string;
      organization_name: string;
      user_id: string; 
      user: {                   
        profile_url?: string;
      };
    };
  };
}

// Internal state will only store applications that include scholarship data.
type ApplicationWithScholarship = Application & { scholarship: NonNullable<Application['scholarship']> };


export default function StudentHomePage() {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationWithScholarship[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationWithScholarship[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchApplications = async () => {
    try {
      const result = await scholarshipApplicationService.getMyApplications();
      
      if (result.success && result.applications) {
        // Filter out any applications that don't have scholarship data
        const appsWithScholarship = result.applications.filter(a => a.scholarship) as ApplicationWithScholarship[];

        if (appsWithScholarship.length !== result.applications.length) {
          console.warn(
            `Filtered out ${result.applications.length - appsWithScholarship.length} application(s) missing scholarship data`
          );
        }

        setApplications(appsWithScholarship);
        setFilteredApplications(appsWithScholarship);
      } else {
        console.error('Failed to fetch applications:', result.message);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [selectedFilter, searchQuery, applications]);

  const filterApplications = () => {
    let filtered = [...applications];

    // Filter by status
    if (selectedFilter === 'applied') {
      filtered = filtered.filter(app => app.status === 'pending' || app.status === 'shortlisted');
    } else if (selectedFilter === 'past') {
      filtered = filtered.filter(app => app.status === 'approved' || app.status === 'denied');
    }

    // Filter by search 
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.scholarship.title.toLowerCase().includes(query) ||
        app.scholarship.sponsor.organization_name.toLowerCase().includes(query) ||
        (app.scholarship.tags || []).some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredApplications(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchApplications();
  }, []);

  // const getFilterCount = (filter: FilterType): number => {
  //   if (filter === 'all') return applications.length;
  //   if (filter === 'applied') return applications.filter(app => app.status === 'pending').length;
  //   if (filter === 'past') return applications.filter(app => 
  //     app.status === 'approved' || app.status === 'denied'
  //   ).length;
  //   return 0;
  // };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCardPress = (applicationId: string) => {
    router.push({
      pathname: '/(student)/application/[id]',
      params: { id: applicationId },
    } as any);
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

  const getTags = (scholarship: NonNullable<Application['scholarship']>): string[] => {
    const tags: string[] = [];
    
    if (scholarship.type) {
      tags.push(formatText(scholarship.type));
    }
    
    if (scholarship.purpose) {
      tags.push(formatText(scholarship.purpose));
    }
    
    // Add original tags if they exist
    if (scholarship.tags && scholarship.tags.length > 0) {
      tags.push(...scholarship.tags);
    }
    
    return tags;
  };

  const statusCounts = {
    all: applications.length,
    applied: applications.filter(a => a.status === 'pending' || a.status === 'shortlisted').length,
    past: applications.filter(a => a.status === 'approved' || a.status === 'denied').length,
  };

  return (
    <View style={styles.container}>
      <Header title="Home" onSearch={handleSearch} showSearch={true} />
      
      {/* Header with Filter Dropdown */}
      <View style={styles.headerContainer}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>My Applications</Text>
          <Text style={styles.headerSubtitle}>
            {filteredApplications.length} {filteredApplications.length === 1 ? 'Application' : 'Applications'}
          </Text>
        </View>

        {/* Filter Dropdown */}
        <View style={styles.filterDropdownContainer}>
          <Pressable 
            style={styles.dropdownButton}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.dropdownButtonText}>
              {selectedFilter === 'all' ? 'All' : selectedFilter === 'applied' ? 'Applied' : 'Past'}
            </Text>
            <View style={styles.dropdownBadge}>
              <Text style={styles.dropdownBadgeText}>
                {statusCounts[selectedFilter]}
              </Text>
            </View>
            <Ionicons 
              name={showDropdown ? "chevron-up" : "chevron-down"} 
              size={18} 
              color="#6B7280" 
            />
          </Pressable>
          
          {showDropdown && (
            <View style={styles.dropdownMenu}>
              {(['all', 'applied', 'past'] as const).map((filter) => (
                <Pressable
                  key={filter}
                  style={[
                    styles.dropdownItem,
                    selectedFilter === filter && styles.dropdownItemActive
                  ]}
                  onPress={() => {
                    setSelectedFilter(filter);
                    setShowDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedFilter === filter && styles.dropdownItemTextActive
                  ]}>
                    {filter === 'all' ? 'All' : filter === 'applied' ? 'Applied' : 'Past'}
                  </Text>
                  <View style={[
                    styles.filterBadge,
                    selectedFilter === filter && styles.filterBadgeActive
                  ]}>
                    <Text style={[
                      styles.filterBadgeText,
                      selectedFilter === filter && styles.filterBadgeTextActive
                    ]}>
                      {statusCounts[filter]}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Applications List */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#3A52A6"
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3A52A6" />
            <Text style={styles.loadingText}>Loading applications...</Text>
          </View>
        ) : filteredApplications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No Applications Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : selectedFilter === 'applied'
                ? 'You have no applied applications'
                : selectedFilter === 'past'
                ? 'You have no past applications'
                : 'Start applying to scholarships to see them here'}
            </Text>
          </View>
        ) : (
          filteredApplications.map((application, idx) => (
            <View key={application.scholarship_application_id} style={styles.timelineRow}>
              {/* Timeline visual */}
              <View style={styles.timelineColumn}>
                {/* Dashed vertical line */}
                <View style={[
                  styles.timelineLine,
                  idx === filteredApplications.length - 1 && styles.timelineLineLast
                ]} />
                {/* Dot */}
                <View style={styles.timelineDot} />
              </View>
              {/* Card and date */}
              <View style={styles.timelineCardContainer}>
                <View style={styles.applicationDateRow}>
                  <Text style={styles.applicationDateTextTimeline}>
                    {formatDate(application.applied_at)}
                  </Text>
                </View>
                <ScholarshipApplicationCard
                  scholarship_id={application.scholarship.scholarship_id}
                  title={application.scholarship.title}
                  imageUrl={application.scholarship.image_url}
                  profileUrl={application.scholarship.sponsor.user?.profile_url}
                  sponsorName={application.scholarship.sponsor.organization_name}
                  deadline={application.scholarship.application_deadline}
                  amount={application.scholarship.total_amount || 0}
                  slots={application.scholarship.total_slot || 0}
                  criteria={application.scholarship.criteria?.map(c => formatArrayText(c)) || []}
                  documents={application.scholarship.required_documents?.map(d => formatArrayText(d)) || []}
                  tags={getTags(application.scholarship)}
                  status={application.status}
                  onPress={() => handleCardPress(application.scholarship_application_id)}
                />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F0F7FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 16,
    color: '#111827',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  filterDropdownContainer: {
    minWidth: 110,
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  dropdownButtonText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#111827',
  },
  dropdownBadge: {
    backgroundColor: '#3A52A6',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 18,
    alignItems: 'center',
  },
  dropdownBadgeText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 10,
    color: '#F8F9FC',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#F8F9FC',
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    minWidth: 140,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  dropdownItemActive: {
    backgroundColor: '#EFF6FF',
  },
  dropdownItemText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  dropdownItemTextActive: {
    color: '#3A52A6',
  },
  filterBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: '#DBEAFE',
  },
  filterBadgeText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  filterBadgeTextActive: {
    color: '#3A52A6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 45,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 18,
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 170,
  },
  timelineColumn: {
    width: 16,
    alignItems: 'center',
    position: 'relative',
    height: '100%',
  },
  timelineLine: {
    position: 'absolute',
    top: 2,
    left: 0,
    width: 2,
    height: '100%',
    borderStyle: 'dashed',
    borderColor: '#3A52A6',
    opacity: 0.5,
    borderWidth: 0,
    borderLeftWidth: 1,
    zIndex: 0,
  },
  timelineLineLast: {
    height: '91%',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 10,
    backgroundColor: '#3A52A6',
    position: 'absolute',
    top: 2.2,
    left: -5.7,
    zIndex: 2,
    shadowColor: '#607EF2',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  timelineCardContainer: {
    flex: 1,
  },
  applicationDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applicationDateTextTimeline: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#111827',
  },
});