'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { useAuthStore } from '@/store/authStore';
import { BookOpen, GraduationCap, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// Step 2: Name
const nameSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
});

type NameFormData = z.infer<typeof nameSchema>;

// Step 3: Study info (optional)
const studySchema = z.object({
  studyLevel: z.string().optional(),
  school: z.string().optional(),
});

type StudyFormData = z.infer<typeof studySchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, setProfile } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<{
    role?: 'student' | 'teacher';
    firstName?: string;
    lastName?: string;
    studyLevel?: string;
    school?: string;
  }>({});

  const supabase = supabaseBrowser;

  // Check if user is authenticated and load profile if needed
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      // Load profile if not in store
      let currentProfile = profile;
      if (!currentProfile || currentProfile.id !== session.user.id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileData) {
          currentProfile = profileData;
          setProfile(profileData);
        }
      }

      // Check if profile already has role and name set (onboarding already completed)
      if (currentProfile?.role && currentProfile.first_name && currentProfile.last_name) {
        router.replace('/dashboard');
        return;
      }

      // Pre-fill onboarding data if profile exists but is incomplete
      if (currentProfile) {
        setOnboardingData({
          role: currentProfile.role || undefined,
          firstName: currentProfile.first_name || undefined,
          lastName: currentProfile.last_name || undefined,
        });
        if (currentProfile.role) {
          setSelectedRole(currentProfile.role);
        }
      }
    };

    checkAuth();
  }, [router, profile, supabase, setProfile]);

  // Step 1: Role selection
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | undefined>(
    onboardingData.role
  );

  const onRoleSelect = (role: 'student' | 'teacher') => {
    setSelectedRole(role);
    setOnboardingData((prev) => ({ ...prev, role }));
    // Auto-advance to next step after selection
    setTimeout(() => setCurrentStep(2), 300);
  };

  // Step 2: Name
  const {
    register: registerName,
    handleSubmit: handleSubmitName,
    formState: { errors: nameErrors },
  } = useForm<NameFormData>({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      firstName: onboardingData.firstName || '',
      lastName: onboardingData.lastName || '',
    },
  });

  const onNameSubmit = (data: NameFormData) => {
    setOnboardingData((prev) => ({
      ...prev,
      firstName: data.firstName,
      lastName: data.lastName,
    }));
    setCurrentStep(3);
  };

  // Step 3: Study info (optional)
  const {
    register: registerStudy,
    handleSubmit: handleSubmitStudy,
  } = useForm<StudyFormData>({
    resolver: zodResolver(studySchema),
    defaultValues: {
      studyLevel: onboardingData.studyLevel || '',
      school: onboardingData.school || '',
    },
  });

  const onStudySubmit = async (data: StudyFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Generate username from first_name + last_name
      const generateUsername = (firstName: string, lastName: string): string => {
        // Remove accents and special characters, convert to lowercase
        const normalize = (str: string) => 
          str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
        
        const first = normalize(firstName);
        const last = normalize(lastName);
        let baseUsername = `${first}_${last}`;
        
        // Ensure minimum length
        if (baseUsername.length < 3) {
          baseUsername = `${first}${last}`.substring(0, 20) || `user_${user.id.substring(0, 8)}`;
        }
        
        return baseUsername.substring(0, 50); // Max length
      };

      const newUsername = generateUsername(
        onboardingData.firstName || '',
        onboardingData.lastName || ''
      );

      // Update profile with all onboarding data including generated username
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: onboardingData.role,
          first_name: onboardingData.firstName,
          last_name: onboardingData.lastName,
          username: newUsername, // Update username based on name
          study_level: data.studyLevel || null,
          school: data.school || null,
        })
        .eq('id', user.id);

      if (updateError) {
        // If username conflict, try with a number suffix
        if (updateError.code === '23505' || updateError.message.includes('unique')) {
          let counter = 1;
          let finalUsername = newUsername;
          
          while (counter < 100) {
            finalUsername = `${newUsername}_${counter}`;
            const { error: retryError } = await supabase
              .from('profiles')
              .update({
                role: onboardingData.role,
                first_name: onboardingData.firstName,
                last_name: onboardingData.lastName,
                username: finalUsername,
                study_level: data.studyLevel || null,
                school: data.school || null,
              })
              .eq('id', user.id);
            
            if (!retryError) {
              break;
            }
            counter++;
          }
          
          if (counter >= 100) {
            throw new Error('Impossible de créer un nom d\'utilisateur unique. Veuillez réessayer.');
          }
        } else {
          throw updateError;
        }
      }

      // Fetch updated profile
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      setProfile(updatedProfile);

      // Redirect to appropriate dashboard
      router.replace('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la finalisation du profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipStudy = () => {
    onStudySubmit({});
  };

  const getStepTitle = () => {
    if (currentStep === 1) return 'Je suis :';
    if (currentStep === 2) return 'Quel est votre nom ?';
    if (currentStep === 3) return 'Informations complémentaires';
    return '';
  };

  const getStepSubtitle = () => {
    if (currentStep === 1) return 'Sélectionnez votre profil pour commencer';
    if (currentStep === 2) return 'Ces informations seront visibles sur votre profil';
    if (currentStep === 3) return 'Ces informations sont optionnelles';
    return '';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Two column layout */}
      <div className="flex min-h-screen">
        {/* Left column - Decorative background (empty for now, can add illustration later) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 items-center justify-center p-12">
          <div className="w-full h-full flex items-center justify-center">
            {/* Empty space for future illustration */}
          </div>
        </div>

        {/* Right column - Questionnaire */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-lg">
            {/* Logo/Icon at top */}
            <div className="flex justify-center mb-8">
              <Image 
                src="/images/logo.png" 
                alt="CARDZ Logo" 
                width={48} 
                height={48}
                className="object-contain"
                priority
              />
            </div>

            {/* Main title */}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-2">
              {getStepTitle()}
            </h1>
            
            {/* Subtitle */}
            <p className="text-base text-gray-600 text-center mb-12">
              {getStepSubtitle()}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-8">
                {error}
              </div>
            )}

            {/* Step 1: Role Selection */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => onRoleSelect('student')}
                    className={cn(
                      'flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-200',
                      selectedRole === 'student'
                        ? 'border-brand-primary bg-blue-50 shadow-lg scale-105'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    )}
                  >
                    <GraduationCap
                      className={cn(
                        'h-12 w-12 mb-4 transition-colors',
                        selectedRole === 'student' ? 'text-brand-primary' : 'text-gray-400'
                      )}
                    />
                    <span
                      className={cn(
                        'font-semibold text-lg',
                        selectedRole === 'student' ? 'text-brand-primary' : 'text-gray-700'
                      )}
                    >
                      Élève
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRoleSelect('teacher')}
                    className={cn(
                      'flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-200',
                      selectedRole === 'teacher'
                        ? 'border-brand-primary bg-blue-50 shadow-lg scale-105'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    )}
                  >
                    <BookOpen
                      className={cn(
                        'h-12 w-12 mb-4 transition-colors',
                        selectedRole === 'teacher' ? 'text-brand-primary' : 'text-gray-400'
                      )}
                    />
                    <span
                      className={cn(
                        'font-semibold text-lg',
                        selectedRole === 'teacher' ? 'text-brand-primary' : 'text-gray-700'
                      )}
                    >
                      Professeur
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Name */}
            {currentStep === 2 && (
              <form onSubmit={handleSubmitName(onNameSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom
                  </label>
                  <Input
                    id="firstName"
                    {...registerName('firstName')}
                    placeholder="Jean"
                    className="h-12 text-base border-gray-200 focus:border-brand-primary focus:ring-brand-primary"
                  />
                  {nameErrors.firstName && (
                    <p className="mt-2 text-sm text-red-600">
                      {nameErrors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  <Input
                    id="lastName"
                    {...registerName('lastName')}
                    placeholder="Dupont"
                    className="h-12 text-base border-gray-200 focus:border-brand-primary focus:ring-brand-primary"
                  />
                  {nameErrors.lastName && (
                    <p className="mt-2 text-sm text-red-600">
                      {nameErrors.lastName.message}
                    </p>
                  )}
                </div>

                {/* Navigation buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 h-12"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go back
                  </Button>
                  <Button type="submit" className="flex-1 h-12 bg-gray-900 hover:bg-gray-800 text-white">
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3: Study Info (Optional) */}
            {currentStep === 3 && (
              <form onSubmit={handleSubmitStudy(onStudySubmit)} className="space-y-6">
                <div>
                  <label htmlFor="studyLevel" className="block text-sm font-medium text-gray-700 mb-2">
                    Niveau d'étude <span className="text-gray-400 font-normal">(optionnel)</span>
                  </label>
                  <Input
                    id="studyLevel"
                    {...registerStudy('studyLevel')}
                    placeholder="Ex: Terminale, Licence, Master..."
                    className="h-12 text-base border-gray-200 focus:border-brand-primary focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-2">
                    École / Université <span className="text-gray-400 font-normal">(optionnel)</span>
                  </label>
                  <Input
                    id="school"
                    {...registerStudy('school')}
                    placeholder="Ex: Lycée Victor Hugo, Université Paris..."
                    className="h-12 text-base border-gray-200 focus:border-brand-primary focus:ring-brand-primary"
                  />
                </div>

                {/* Navigation buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 h-12"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go back
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkipStudy}
                    disabled={isLoading}
                    className="flex-1 h-12"
                  >
                    Skip
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="flex-1 h-12 bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    {isLoading ? 'Finalisation...' : 'Continue'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
