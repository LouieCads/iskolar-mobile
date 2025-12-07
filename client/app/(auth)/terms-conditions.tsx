import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

export default function TermsConditionsPage() {
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
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionTitle}>Acceptance of Terms</Text>
        <Text style={styles.bodyText}>
          By downloading, installing, or using the iSkolar mobile application, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the app.
        </Text>

        <Text style={styles.sectionTitle}>1. User Accounts</Text>
        <Text style={styles.subTitle}>Registration.</Text>
        <Text style={styles.bodyText}>
          You must provide accurate, current, and complete information during registration (Email, Name, Organization details).
        </Text>

        <Text style={styles.subTitle}>Security.</Text>
        <Text style={styles.bodyText}>
          You are responsible for maintaining the confidentiality of your login credentials. You agree not to share your password or OTP with others.
        </Text>

        <Text style={styles.subTitle}>Eligibility.</Text>
        <Text style={styles.bodyText}>
          You must be a bona fide student or a legitimate representative of a scholarship-providing organization.
        </Text>

        <Text style={styles.sectionTitle}>2. User Roles and Responsibilities</Text>
        <Text style={styles.subTitle}>Students:</Text>
        <Text style={styles.bodyText}>
          You agree to submit authentic documents (grades, IDs, etc.). You may only submit one application per scholarship. Falsification of documents may result in a permanent ban.
        </Text>

        <Text style={styles.subTitle}>Sponsors:</Text>
        <Text style={styles.bodyText}>
          You agree to post only legitimate scholarship programs. You must not use applicant data for any purpose other than evaluating scholarship eligibility. You are responsible for fulfilling the financial obligations of the scholarships you post. iSkolar is not the funding provider.
        </Text>

        <Text style={styles.sectionTitle}>3. Acceptable Use</Text>
        <Text style={styles.bodyText}>
          You agree not to:{'\n'}
          {'\n'}
          • Post false, misleading, or fraudulent scholarship listings.{'\n'}
          • Upload content that is offensive, illegal, or violates the rights of others.{'\n'}
          • Attempt to hack, reverse engineer, or disrupt the iSkolar system.
        </Text>

        <Text style={styles.sectionTitle}>4. Platform Role and Disclaimers</Text>
        <Text style={styles.bodyText}>
          We provide the platform to connect Students and Sponsors. We are not a scholarship provider (unless explicitly stated) and we do not guarantee that a student will receive a scholarship. iSkolar is not liable for any Sponsor failing to disburse funds to a selected scholar. While we allow Admins to flag and remove suspicious posts, we do not guarantee the accuracy of every listing.
        </Text>

        <Text style={styles.sectionTitle}>5. Account Termination</Text>
        <Text style={styles.subTitle}>Admin Rights.</Text>
        <Text style={styles.bodyText}>
          iSkolar Administrators reserve the right to suspend, deactivate, or delete your account if you violate these Terms, particularly regarding fraudulent posts or fake applications. Deactivated accounts are restricted from logging in.
        </Text>

        <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
        <Text style={styles.bodyText}>
          The design, source code, and "iSkolar" branding are the property of the University of Makati / Project Team (Group 5). You retain ownership of the documents and images you upload, but you grant iSkolar a license to display and process them for the purpose of the app's services.
        </Text>

        <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
        <Text style={styles.bodyText}>
          To the fullest extent permitted by law, iSkolar and its developers shall not be liable for any indirect, incidental, or consequential damages arising from your use of the app, including but not limited to loss of data or loss of scholarship opportunities.
        </Text>

        <Text style={styles.sectionTitle}>8. Governing Law</Text>
        <Text style={styles.bodyText}>
          These Terms are governed by the laws of the Republic of the Philippines. Any disputes shall be resolved in the courts of Makati City.
        </Text>

        <Text style={styles.sectionTitle}>9. Changes to Terms</Text>
        <Text style={styles.bodyText}>
          We reserve the right to modify these Terms at any time. Continued use of the app after changes constitutes acceptance of the new Terms.
        </Text>

        <Text style={styles.sectionTitle}>10. Contact Us</Text>
        <Text style={styles.bodyText}>
          If you have questions about these Terms and Conditions, please contact our Data Protection Officer at:{'\n'}
          {'\n'}
          University of Makati, J.P. Rizal Ext. West Rembo, Makati City.{'\n'}
          {'\n'}
          Or send an email to:{'\n'}
          scholarpass23@gmail.com
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
