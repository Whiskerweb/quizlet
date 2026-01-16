'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { useAuthStore } from '@/store/authStore';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { trackLead } from '@/lib/tracking/traaaction';
import { Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Minimum 6 caractères'),
});

const registerSchema = z.object({
    email: z.string().email('Email invalide'),
    username: z.string().min(3, 'Minimum 3 caractères'),
    password: z.string().min(6, 'Minimum 6 caractères'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface CheckoutAuthPanelProps {
    onAuthSuccess?: () => void;
}

export function CheckoutAuthPanel({ onAuthSuccess }: CheckoutAuthPanelProps) {
    const { setUser, setProfile } = useAuthStore();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = supabaseBrowser;

    const loginForm = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const registerForm = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const handleLogin = async (data: LoginFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Erreur de connexion');

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .single();

            setUser(authData.user);
            setProfile(profile);
            onAuthSuccess?.();
        } catch (err: any) {
            setError(err.message || 'Échec de la connexion');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (data: RegisterFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        username: data.username,
                    },
                },
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Erreur lors de l\'inscription');

            // Wait a moment for the trigger to create the profile
            await new Promise(resolve => setTimeout(resolve, 1000));

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .single();

            setUser(authData.user);
            setProfile(profile);

            // Track the signup as a lead for Traaaction attribution
            await trackLead({
                customerExternalId: authData.user.id,
                customerEmail: data.email,
                eventName: 'sign_up',
            });

            onAuthSuccess?.();
        } catch (err: any) {
            setError(err.message || 'Échec de l\'inscription');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-2">
                {mode === 'login' ? 'Connectez-vous pour payer' : 'Créez votre compte'}
            </h2>
            <p className="text-slate-400 text-sm mb-6">
                Votre achat sera lié à votre compte pour toujours.
            </p>

            {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Google OAuth - quickest option */}
            <GoogleLoginButton
                redirectTo="/shop/cart"
                className="mb-4 w-full"
            />

            {/* Separator */}
            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-slate-800 text-slate-400">ou par email</span>
                </div>
            </div>

            {/* Login Form */}
            {mode === 'login' ? (
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            {...loginForm.register('email')}
                            type="email"
                            placeholder="Email"
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                        />
                    </div>
                    {loginForm.formState.errors.email && (
                        <p className="text-red-400 text-xs">{loginForm.formState.errors.email.message}</p>
                    )}

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            {...loginForm.register('password')}
                            type="password"
                            placeholder="Mot de passe"
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                        />
                    </div>
                    {loginForm.formState.errors.password && (
                        <p className="text-red-400 text-xs">{loginForm.formState.errors.password.message}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Se connecter
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>
            ) : (
                /* Register Form */
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            {...registerForm.register('username')}
                            type="text"
                            placeholder="Nom d'utilisateur"
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                        />
                    </div>
                    {registerForm.formState.errors.username && (
                        <p className="text-red-400 text-xs">{registerForm.formState.errors.username.message}</p>
                    )}

                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            {...registerForm.register('email')}
                            type="email"
                            placeholder="Email"
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                        />
                    </div>
                    {registerForm.formState.errors.email && (
                        <p className="text-red-400 text-xs">{registerForm.formState.errors.email.message}</p>
                    )}

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            {...registerForm.register('password')}
                            type="password"
                            placeholder="Mot de passe (min. 6 caractères)"
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                        />
                    </div>
                    {registerForm.formState.errors.password && (
                        <p className="text-red-400 text-xs">{registerForm.formState.errors.password.message}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Créer mon compte
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>
            )}

            {/* Toggle Login/Register */}
            <div className="mt-4 text-center">
                <button
                    type="button"
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                    {mode === 'login' ? (
                        <>Pas encore de compte ? <span className="text-blue-400 font-medium">S'inscrire</span></>
                    ) : (
                        <>Déjà un compte ? <span className="text-blue-400 font-medium">Se connecter</span></>
                    )}
                </button>
            </div>
        </div>
    );
}
