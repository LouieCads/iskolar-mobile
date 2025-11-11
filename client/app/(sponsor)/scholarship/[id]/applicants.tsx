import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Animated, Image, Modal, Linking, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Header from '@/components/header';
import Toast from '@/components/toast';
import { scholarshipService } from '@/services/scholarship-creation.service';
import { scholarshipApplicationService } from '@/services/scholarship-application.service';

interface Applicant {
  scholarship_application_id: string;
  student_id: string;
  status: 'pending' | 'approved' | 'denied';
  custom_form_response: Array<{ label: string; value: any }>; 
  applied_at: string;
  remarks?: string;
  student?: {
    student_id: string;
    full_name: string;
    gender?: string;
    date_of_birth: string;
    contact_number: string;
    user: {
      email: string;
      profile_url?: string;
    };
  };
}

export default function ApplicantsListPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [scholarship, setScholarship] = useState<any>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastTitle, setToastTitle] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'approve' | 'deny'; applicationId: string } | null>(null);
  const [denialRemarks, setDenialRemarks] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    setToastType(type);
    setToastTitle(title);
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const animateIn = useCallback(() => {
    Animated.timing(fadeAnim, { 
      toValue: 1, 
      duration: 300, 
      useNativeDriver: true 
    }).start();
  }, [fadeAnim]);

  const fetchApplicants = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      setLoading(true);
      
      // Fetch scholarship details
      const scholarshipRes = await scholarshipService.getScholarshipById(String(id));
      if (scholarshipRes.success && scholarshipRes.scholarship) {
        setScholarship(scholarshipRes.scholarship);
      }

      // Fetch applicants
      const response = await scholarshipApplicationService.getScholarshipApplications(String(id));
      if (response.success && response.applications) {
        setApplicants(response.applications);
      } else {
        setError(response.message);
      }
    } catch (e) {
      setError('Failed to load applicants');
      console.error(e);
    } finally {
      setLoading(false);
      animateIn();
    }
  }, [id, animateIn]);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#31D0AA';
      case 'denied': return '#EF4444';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return 'checkmark-circle';
      case 'denied': return 'close-circle';
      case 'pending': return 'time';
      default: return 'help-circle';
    }
  };

  const handleUpdateStatus = async (applicationId: string, newStatus: 'approved' | 'denied', remarks?: string) => {
    try {
      const response = await scholarshipApplicationService.updateApplicationStatus(
        applicationId,
        newStatus,
        remarks
      );

      if (response.success) {
        showToast('success', 'Success', `Application ${newStatus} successfully`);
        setModalVisible(false);
        fetchApplicants(); // Refresh list
      } else {
        showToast('error', 'Error', response.message);
      }
    } catch (error) {
      showToast('error', 'Error', 'Failed to update application status');
    }
  };

  const openApplicantModal = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFileOpen = async (url: string, fileName: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showToast('error', 'Error', 'Cannot open this file type');
      }
    } catch (error) {
      console.error('Error opening file:', error);
      showToast('error', 'Error', 'Failed to open file');
    }
  };

  const filteredApplicants = applicants.filter(app => 
    filterStatus === 'all' ? true : app.status === filterStatus
  );

  const statusCounts = {
    all: applicants.length,
    pending: applicants.filter(a => a.status === 'pending').length,
    approved: applicants.filter(a => a.status === 'approved').length,
    denied: applicants.filter(a => a.status === 'denied').length,
  };

  return (
    <View style={styles.container}>
      <Header 
        title="Applicants"
        showSearch={false}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3A52A6" />
          <Text style={styles.loadingText}>Loading applicants…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={fetchApplicants}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Scholarship Info Header with Filter */}
          <View style={styles.scholarshipHeader}>
            <View style={styles.scholarshipTitleContainer}>
              <View style={styles.scholarshipInfo}>
                <Text style={styles.scholarshipTitle}>{scholarship?.title}</Text>
                <Text style={styles.scholarshipSubtitle}>
                  {applicants.length} {applicants.length === 1 ? 'Applicant' : 'Applicants'}
                </Text>
              </View>
              
              {/* Filter Dropdown */}
              <View style={styles.filterDropdownContainer}>
                <Pressable 
                  style={styles.dropdownButton}
                  onPress={() => setShowDropdown(!showDropdown)}
                >
                  <Text style={styles.dropdownButtonText}>
                    {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                  </Text>
                  <View style={styles.dropdownBadge}>
                    <Text style={styles.dropdownBadgeText}>
                      {statusCounts[filterStatus]}
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
                    {(['all', 'pending', 'approved', 'denied'] as const).map((status) => (
                      <Pressable
                        key={status}
                        style={[
                          styles.dropdownItem,
                          filterStatus === status && styles.dropdownItemActive
                        ]}
                        onPress={() => {
                          setFilterStatus(status);
                          setShowDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          filterStatus === status && styles.dropdownItemTextActive
                        ]}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                        <View style={[
                          styles.filterBadge,
                          filterStatus === status && styles.filterBadgeActive
                        ]}>
                          <Text style={[
                            styles.filterBadgeText,
                            filterStatus === status && styles.filterBadgeTextActive
                          ]}>
                            {statusCounts[status]}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Applicants List */}
          <ScrollView 
            style={styles.listContainer}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredApplicants.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="person-outline" size={60} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>No applicants found</Text>
              </View>
            ) : (
              filteredApplicants.map((applicant) => {
                if (!applicant.student) return null; 
                
                return (
                <Pressable
                  key={applicant.scholarship_application_id}
                  style={styles.applicantCard}
                  onPress={() => openApplicantModal(applicant)}
                >
                  {/* Profile Image & Basic Info */}
                  <View style={styles.applicantHeader}>
                    <Image
                      source={
                        applicant.student.user.profile_url
                          ? { uri: applicant.student.user.profile_url }
                          : require('@/assets/images/iskolar.png')
                      }
                      style={styles.avatar}
                    />
                    <View style={styles.applicantInfo}>
                      <Text style={styles.applicantName}>
                        {applicant.student.full_name}
                        <Ionicons 
                          name={getStatusIcon(applicant.status) as any} 
                          size={16} 
                          color={getStatusColor(applicant.status)} 
                        />
                      </Text>
                      <Text style={styles.applicantEmail}>
                        {applicant.student.user.email}
                      </Text>
                    </View>
                  </View>

                  {/* Applied Date */}
                  <View style={styles.applicantFooter}>
                    <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                    <Text style={styles.appliedDate}>
                      {formatDate(applicant.applied_at)}
                    </Text>
                  </View>
                </Pressable>
              )})
            )}
          </ScrollView>
        </Animated.View>
      )}

      {/* Applicant Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedApplicant && selectedApplicant.student && (
                <>
                  {/* Modal Header */}
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Application Details</Text>
                    <Pressable onPress={() => setModalVisible(false)}>
                      <Ionicons name="close" size={24} color="#111827" />
                    </Pressable>
                  </View>

                  {/* Student Profile */}
                  <View style={styles.modalSection}>
                    <View style={styles.profileHeader}>
                      <Image
                        source={
                          selectedApplicant.student.user.profile_url
                            ? { uri: selectedApplicant.student.user.profile_url }
                            : require('@/assets/images/iskolar.png')
                        }
                        style={styles.modalAvatar}
                      />
                      <View>
                        <Text style={styles.modalName}>{selectedApplicant.student.full_name}</Text>
                        <Text style={styles.modalEmail}>{selectedApplicant.student.user.email}</Text>
                      </View>
                    </View>

                    <View style={styles.infoGrid}>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Gender</Text>
                        <Text style={styles.infoValue}>
                          {selectedApplicant.student.gender 
                            ? selectedApplicant.student.gender.charAt(0).toUpperCase() + selectedApplicant.student.gender.slice(1)
                            : 'Not specified'}
                        </Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Contact Number</Text>
                        <Text style={styles.infoValue}>
                          {selectedApplicant.student.contact_number}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Custom Form Response */}
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Application Response</Text>
                    {Array.isArray(selectedApplicant.custom_form_response) ? (
                      selectedApplicant.custom_form_response.map((item, index) => (
                        <View key={index} style={styles.responseItem}>
                          <Text style={styles.responseLabel}>{item.label}</Text>
                          {Array.isArray(item.value) && item.value.length > 0 && typeof item.value[0] === 'string' && item.value[0].startsWith('http') ? (
                            <View style={styles.fileList}>
                              {item.value.map((url: string, idx: number) => (
                                <Pressable 
                                  key={idx} 
                                  style={styles.fileItem}
                                  onPress={() => handleFileOpen(url, `${item.label}_file_${idx + 1}`)}
                                >
                                  <Ionicons name="document-attach" size={16} color="#3A52A6" />
                                  <Text style={styles.fileText}>
                                    File {idx + 1}
                                  </Text>
                                  <Ionicons name="open-outline" size={14} color="#3A52A6" style={{ marginLeft: 4 }} />
                                </Pressable>
                              ))}
                            </View>
                          ) : item.value === null || item.value === '' ? (
                            <Text style={[styles.responseValue, { fontStyle: 'italic', color: '#9CA3AF' }]}>
                              No response provided
                            </Text>
                          ) : (
                            <Text style={styles.responseValue}>
                              {Array.isArray(item.value) ? item.value.join(', ') : String(item.value)}
                            </Text>
                          )}
                        </View>
                      ))
                    ) : (
                      // Fallback for old format (object-based responses)
                      Object.entries(selectedApplicant.custom_form_response || {}).map(([key, value]) => (
                        <View key={key} style={styles.responseItem}>
                          <Text style={styles.responseLabel}>{key}</Text>
                          {Array.isArray(value) && value.length > 0 && typeof value[0] === 'string' && value[0].startsWith('http') ? (
                            <View style={styles.fileList}>
                              {value.map((url: string, idx: number) => (
                                <Pressable 
                                  key={idx} 
                                  style={styles.fileItem}
                                  onPress={() => handleFileOpen(url, `file_${idx + 1}`)}
                                >
                                  <Ionicons name="document-attach" size={16} color="#3A52A6" />
                                  <Text style={styles.fileText}>File {idx + 1}</Text>
                                  <Ionicons name="open-outline" size={14} color="#3A52A6" style={{ marginLeft: 4 }} />
                                </Pressable>
                              ))}
                            </View>
                          ) : (
                            <Text style={styles.responseValue}>
                              {Array.isArray(value) ? value.join(', ') : String(value)}
                            </Text>
                          )}
                        </View>
                      ))
                    )}
                  </View>

                  {/* Status & Remarks */}
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Status</Text>
                    <View style={[styles.currentStatusBadge, { backgroundColor: getStatusColor(selectedApplicant.status) + '20' }]}>
                      <Ionicons 
                        name={getStatusIcon(selectedApplicant.status) as any} 
                        size={20} 
                        color={getStatusColor(selectedApplicant.status)} 
                      />
                      <Text style={[styles.currentStatusText, { color: getStatusColor(selectedApplicant.status) }]}>
                        {selectedApplicant.status.charAt(0).toUpperCase() + selectedApplicant.status.slice(1)}
                      </Text>
                    </View>
                    {selectedApplicant.remarks && (
                      <View style={styles.remarksBox}>
                        <Text style={styles.remarksLabel}>Remarks</Text>
                        <Text style={styles.remarksText}>{selectedApplicant.remarks}</Text>
                      </View>
                    )}
                  </View>

                  {/* Action Buttons */}
                  {selectedApplicant.status === 'pending' && (
                    <View style={styles.actionButtons}>
                      <Pressable
                        style={[styles.actionButton, styles.denyButton]}
                        onPress={() => {
                          setPendingAction({ type: 'deny', applicationId: selectedApplicant.scholarship_application_id });
                          setConfirmationModal(true);
                        }}
                      >
                        <Ionicons name="close-circle" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Deny</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => {
                          setPendingAction({ type: 'approve', applicationId: selectedApplicant.scholarship_application_id });
                          setConfirmationModal(true);
                        }}
                      >
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Approve</Text>
                      </Pressable>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setConfirmationModal(false);
          setDenialRemarks('');
        }}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <Text style={styles.confirmModalTitle}>
              {pendingAction?.type === 'approve' ? 'Approve Application' : 'Deny Application'}
            </Text>

            <Text style={styles.confirmModalMessage}>
              {pendingAction?.type === 'approve' 
                ? 'Are you sure you want to approve this application?'
                : 'Are you sure you want to deny this application?'}
            </Text>

            {/* Remarks Input */}
            {pendingAction?.type === 'deny' && (
              <View style={styles.remarksInputContainer}>
                <TextInput
                  style={styles.remarksInput}
                  placeholder="Enter reason for denial..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  value={denialRemarks}
                  onChangeText={setDenialRemarks}
                  textAlignVertical="top"
                />
                <Text style={styles.remarksInputHint}>
                  This will be visible to the applicant (optional).
                </Text>
              </View>
            )}

            <View style={styles.confirmModalButtons}>
              <TouchableOpacity 
                style={styles.confirmModalCancelButton}
                onPress={() => {
                  setConfirmationModal(false);
                  setDenialRemarks('');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmModalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.confirmModalConfirmButton,
                  { backgroundColor: pendingAction?.type === 'approve' ? '#31D0AA' : '#EF4444' }
                ]}
                onPress={() => {
                  if (pendingAction) {
                    const statusValue = pendingAction.type === 'approve' ? 'approved' : 'denied';
                    const remarks = pendingAction.type === 'deny' ? denialRemarks.trim() : undefined;
                    handleUpdateStatus(
                      pendingAction.applicationId,
                      statusValue,
                      remarks
                    );
                    setConfirmationModal(false);
                    setDenialRemarks('');
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmModalConfirmButtonText}>
                  {pendingAction?.type === 'approve' ? 'Approve' : 'Deny'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      <Toast
        visible={toastVisible}
        type={toastType}
        title={toastTitle}
        message={toastMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7FF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    flex: 1,
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
    color: '#5D6673',
    marginTop: 14,
    textAlign: 'center',
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
  scholarshipHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  scholarshipTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  scholarshipInfo: {
    flex: 1,
    marginRight: 12,
  },
  scholarshipTitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 20,
    color: '#111827',
    marginBottom: 4,
  },
  scholarshipSubtitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  filterDropdownContainer: {
    minWidth: 110,
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dropdownButtonText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#111827',
    marginRight: 6,
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
    fontSize: 11,
    color: '#fff',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    minWidth: 140,
    zIndex: 1000,
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
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemActive: {
    backgroundColor: '#EFF6FF',
  },
  dropdownItemText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  dropdownItemTextActive: {
    color: '#3A52A6',
    fontWeight: '600',
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
    backgroundColor: '#fff',
  },
  filterBadgeText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  filterBadgeTextActive: {
    color: '#3A52A6',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 75,
  },
  emptyStateText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 14,
  },
  applicantCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  applicantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E0ECFF',
  },
  applicantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  applicantName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 16,
    color: '#111827',
    marginBottom: 2,
  },
  applicantEmail: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  applicantFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appliedDate: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 20,
    color: '#111827',
  },
  modalSection: {
    marginBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E0ECFF',
    marginRight: 16,
  },
  modalName: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 18,
    color: '#111827',
    marginBottom: 4,
  },
  modalEmail: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  modalContact: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  infoLabel: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#111827',
  },
  sectionTitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 16,
    color: '#111827',
    marginBottom: 12,
  },
  responseItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  responseLabel: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  responseValue: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#111827',
  },
  fileList: {
    gap: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#3A52A6',
  },
  currentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  currentStatusText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    fontWeight: '600',
  },
  remarksBox: {
    marginTop: 12,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
  },
  remarksLabel: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#92400E',
    marginBottom: 4,
  },
  remarksText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#78350F',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#31D0AA',
  },
  denyButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  confirmModalContent: {
    backgroundColor: '#F0F7FF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmModalTitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 16,
    color: '#111827',
    marginBottom: 6,
    fontWeight: '600',
  },
  confirmModalMessage: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  confirmModalCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(202, 205, 210, 1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmModalCancelButtonText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },
  confirmModalConfirmButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmModalConfirmButtonText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  remarksInputContainer: {
    width: '100%',
    marginBottom: 24,
    borderRadius: 10,
  },
  remarksInput: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 100,
    maxHeight: 140,
  },
  remarksInputHint: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },
});