import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#3A52A6', '#3A52A6', '#607EF2']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="keyboard-arrow-left" size={24} color="#F0F7FF" />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.welcomeText}>
          Welcome to iSkolar ("we," "us," or "our"). We are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and protect your information when you use the iSkolar mobile application. This policy is drafted in compliance with the Data Privacy Act of 2012 (RA 10173) of the Philippines.
        </Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.bodyText}>
          We collect the following types of data to facilitate scholarship matching and management:
        </Text>

        <Text style={styles.subTitle}>(a) Personal Information:</Text>
        <Text style={styles.bodyText}>
          Students: Full name, gender, date of birth, contact number, email address, and profile image.{'\n'}
          {'\n'}
          Sponsors: Organization name, organization type, official email, contact number, and representative details.
        </Text>

        <Text style={styles.subTitle}>(b) Sensitive Personal Information & Documents:</Text>
        <Text style={styles.bodyText}>
          To assess scholarship eligibility, students may upload documents such as Certificates of Registration (COR), Report of Grades (ROG), School IDs, Barangay Certificates, and household income information.{'\n'}
          {'\n'}
          Account Credentials. We store your password in a hashed format (using bcrypt) for security. We do not see your actual password.{'\n'}
          {'\n'}
          Usage Data. Information on how you use the app, such as scholarship search history and application status tracking.
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.bodyText}>
          We use your data for the following purposes:{'\n'}
          {'\n'}
          For Students: To create your profile, match you with scholarships, and submit your applications to Sponsors.{'\n'}
          {'\n'}
          For Sponsors: To verify your organization and allow you to review applicants.{'\n'}
          {'\n'}
          For Admins: To monitor platform usage, generate reports, and prevent fraud.{'\n'}
          {'\n'}
          System Operations: To authenticate users (Login/OTP), reset passwords, and display application status updates.
        </Text>

        <Text style={styles.sectionTitle}>3. Data Sharing and Disclosure</Text>
        <Text style={styles.bodyText}>
          When a student applies for a scholarship ("Apply Now"), their profile, application form, and uploaded documents are shared directly with the specific Sponsor of that scholarship.{'\n'}
          {'\n'}
          Service Providers. We use third-party services like Microsoft Azure and PostgreSQL for cloud hosting and database management.{'\n'}
          {'\n'}
          Legal Requirements. We may disclose your information if required by Philippine law or a court order.
        </Text>

        <Text style={styles.sectionTitle}>4. Data Storage and Security</Text>
        <Text style={styles.bodyText}>
          Your data is stored securely on cloud servers (Microsoft Azure). We use industry-standard encryption and password hashing to protect your account. However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
        </Text>

        <Text style={styles.sectionTitle}>5. Retention of Data</Text>
        <Text style={styles.bodyText}>
          We retain your personal data only as long as necessary to provide the iSkolar services or as required by law.{'\n'}
          {'\n'}
          Deactivation. If an Admin deactivates a user, the data is restricted but not immediately permanently deleted to allow for reactivation if needed.
        </Text>

        <Text style={styles.sectionTitle}>6. Your Rights (Data Privacy Act) Under RA 10173</Text>
        <Text style={styles.bodyText}>
          You have the right to:{'\n'}
          {'\n'}
          • Know what data we collect and how it is used.{'\n'}
          • Request a copy of your personal data.{'\n'}
          • Correct any inaccurate data (e.g., editing your profile).{'\n'}
          • Request the deletion of your account and data (subject to administrative policies).{'\n'}
          • Be indemnified for damages due to inaccurate, incomplete, outdated, false, unlawfully obtained, or unauthorized use of personal data.
        </Text>

        <Text style={styles.sectionTitle}>7. Contact Us</Text>
        <Text style={styles.bodyText}>
          If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact our Data Protection Officer at:{'\n'}
          {'\n'}
          University of Makati, J.P. Rizal Ext. West Rembo, Makati City.{'\n'}
          {'\n'}
          Or send an email to:{'\n'}
          lcaday.k12148213@umak.edu.ph
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    height: 175,
    paddingTop: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 28,
    color: '#F0F7FF',
  },
  content: {
    flex: 1,
    backgroundColor: '#F0F7FF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 25,
    paddingBottom: 30,
  },
  welcomeText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#111827',
    lineHeight: 18,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 20,
    marginBottom: 12,
  },
  subTitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    fontWeight: '500',
    color: '#4A5568',
    marginTop: 12,
    marginBottom: 8,
  },
  bodyText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#4A5568',
    lineHeight: 18,
    marginBottom: 12,
  },
});
