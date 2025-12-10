'use client';

import { Check, X } from 'lucide-react';
import { motion } from 'motion/react';

interface Feature {
    name: string;
    cardz: boolean;
    competitors: boolean;
}

const features: Feature[] = [
    { name: 'Mode Apprentissage IA', cardz: true, competitors: false },
    { name: 'Accès hors ligne (PWA)', cardz: true, competitors: false },
    { name: 'Publicités intrusives', cardz: false, competitors: true },
    { name: 'Exportation de données (Anki, CSV)', cardz: true, competitors: false },
    { name: 'Répétition espacée avancée', cardz: true, competitors: false },
    { name: 'Nombre de sets limité', cardz: false, competitors: true },
];

export default function ComparisonTable() {
    return (
        <div className="w-full max-w-4xl mx-auto overflow-x-auto">
            <div className="min-w-[600px] bg-landing-student-bg/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-3 gap-4 p-6 border-b border-white/10">
                    <div className="text-landing-student-text-secondary text-sm font-medium">
                        Fonctionnalité
                    </div>
                    <div className="text-center">
                        <div className="text-landing-student-accent-green text-xl font-bold">
                            Cardz.dev
                        </div>
                        <div className="text-landing-student-text-muted text-xs mt-1">
                            100% Gratuit
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-landing-student-text-secondary text-xl font-bold">
                            Concurrents
                        </div>
                        <div className="text-landing-student-text-muted text-xs mt-1">
                            Abonnement requis
                        </div>
                    </div>
                </div>

                {/* Feature rows */}
                <div className="divide-y divide-white/5">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.name}
                            className="grid grid-cols-3 gap-4 p-6 hover:bg-white/5 transition-colors"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="text-landing-student-text-primary font-medium flex items-center">
                                {feature.name}
                            </div>
                            <div className="flex items-center justify-center">
                                {feature.cardz ? (
                                    <div className="w-10 h-10 rounded-full bg-landing-student-accent-green/20 flex items-center justify-center">
                                        <Check className="w-6 h-6 text-landing-student-accent-green" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                        <X className="w-6 h-6 text-red-400" />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-center">
                                {feature.competitors ? (
                                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                        <X className="w-6 h-6 text-red-400" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-landing-student-text-muted/20 flex items-center justify-center">
                                        <X className="w-6 h-6 text-landing-student-text-muted" />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
