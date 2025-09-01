import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/providers/auth-provider';
import { ArrowLeft, Eye, EyeOff, Check } from 'lucide-react-native';
import { supabase } from '@/src/lib/supabase';

export default function SignupScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [showWaiver, setShowWaiver] = useState(false);
  const { signUp } = useAuth();

  const handleSignup = async () => {
    if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!waiverAccepted) {
      Alert.alert('Error', 'You must accept the liability waiver to continue');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email, password, firstName, lastName, phoneNumber, waiverAccepted);
      
      if (result.session) {
        // Email confirmation is disabled, user is immediately logged in
        router.replace('/(tabs)');
      } else {
        // Email confirmation is required
        Alert.alert(
          'Check Your Email',
          'We sent you a confirmation email. Please check your inbox and click the link to verify your account.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const WaiverModal = () => (
    <Modal
      visible={showWaiver}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Liability Waiver</Text>
          <ScrollView style={styles.waiverText}>
            <Text style={styles.waiverContent}>
              I acknowledge that I am participating in yoga classes, workshops, and/or other activities offered by The Hot Temple. I understand that these activities involve physical movement and may be strenuous and could cause injury. I am voluntarily participating in these activities with knowledge of the risks involved.

              {'\n\n'}I agree to assume full responsibility for any risks, injuries, or damages, known or unknown, which I might incur as a result of participating in the program. I knowingly, voluntarily, and expressly waive any claim I may have against The Hot Temple, its instructors, or staff for injury or damages that I may sustain as a result of participating in the program.

              {'\n\n'}I understand that it is my responsibility to consult with a physician prior to and regarding my participation in any physical fitness program. I represent and warrant that I have no medical condition that would prevent my full participation in these fitness activities.

              {'\n\n'}I understand that The Hot Temple reserves the right to refuse service to anyone for any reason at any time.

              {'\n\n'}By signing this waiver, I acknowledge that I have read and understood the above information and agree to be bound by its terms.
            </Text>
          </ScrollView>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => setShowWaiver(false)}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => {
                setWaiverAccepted(true);
                setShowWaiver(false);
              }}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" hidden />
      <LinearGradient
        colors={['#FF6B35', '#F7931E']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <ArrowLeft size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join our yoga community</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                                     <TextInput
                     style={styles.input}
                     placeholder="First Name"
                     placeholderTextColor="rgba(0, 0, 0, 0.6)"
                     value={firstName}
                     onChangeText={setFirstName}
                   />
                 </View>
                 <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                   <TextInput
                     style={styles.input}
                     placeholder="Last Name"
                     placeholderTextColor="rgba(0, 0, 0, 0.6)"
                     value={lastName}
                     onChangeText={setLastName}
                   />
                 </View>
               </View>

               <View style={styles.inputContainer}>
                 <TextInput
                   style={styles.input}
                   placeholder="Phone Number"
                   placeholderTextColor="rgba(0, 0, 0, 0.6)"
                   value={phoneNumber}
                   onChangeText={setPhoneNumber}
                   keyboardType="phone-pad"
                 />
               </View>

               <View style={styles.inputContainer}>
                 <TextInput
                   style={styles.input}
                   placeholder="Email"
                   placeholderTextColor="rgba(0, 0, 0, 0.6)"
                   value={email}
                   onChangeText={setEmail}
                   keyboardType="email-address"
                   autoCapitalize="none"
                 />
               </View>

               <View style={styles.inputContainer}>
                 <TextInput
                   style={[styles.input, { paddingRight: 50 }]}
                   placeholder="Password"
                   placeholderTextColor="rgba(0, 0, 0, 0.6)"
                   value={password}
                   onChangeText={setPassword}
                   secureTextEntry={!showPassword}
                 />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                                     {showPassword ? (
                     <EyeOff size={20} color="rgba(0, 0, 0, 0.6)" />
                   ) : (
                     <Eye size={20} color="rgba(0, 0, 0, 0.6)" />
                   )}
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                                 <TextInput
                   style={[styles.input, { paddingRight: 50 }]}
                   placeholder="Confirm Password"
                   placeholderTextColor="rgba(0, 0, 0, 0.6)"
                   value={confirmPassword}
                   onChangeText={setConfirmPassword}
                   secureTextEntry={!showConfirmPassword}
                 />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                                     {showConfirmPassword ? (
                     <EyeOff size={20} color="rgba(0, 0, 0, 0.6)" />
                   ) : (
                     <Eye size={20} color="rgba(0, 0, 0, 0.6)" />
                   )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.waiverContainer}
                onPress={() => setShowWaiver(true)}
              >
                <View style={styles.waiverCheckbox}>
                  {waiverAccepted && <Check size={16} color="white" />}
                </View>
                <Text style={styles.waiverText}>
                  I accept the <Text style={styles.waiverLink}>Liability Waiver</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signupButton}
                onPress={handleSignup}
                disabled={loading}
              >
                <Text style={styles.signupButtonText}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => router.push('/(auth)/login')}
              >
                <Text style={styles.loginText}>
                  Already have an account? <Text style={styles.loginBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
      <WaiverModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  form: {
    paddingHorizontal: 20,
    gap: 20,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    elevation: 0,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  signupButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  signupButtonText: {
    color: '#FF6B35',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
  },
  loginBold: {
    fontWeight: 'bold',
    color: 'white',
  },
  waiverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  waiverCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  waiverText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    flexShrink: 1,
  },
  waiverLink: {
    color: 'white',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  waiverText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'left',
    marginBottom: 20,
  },
  waiverContent: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'left',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  declineButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'white',
  },
  declineButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  acceptButton: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
  },
});