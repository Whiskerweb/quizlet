'use client';

import { Shield, Lock, Eye, Database } from 'lucide-react';
import { motion } from 'motion/react';

const badges = [
    {
        icon: Shield,
        label: 'RGPD',
        description: 'Conforme au règlement européen sur la protection des données',
    },
    {
        icon: Lock,
        label: 'COPPA',
        description: 'Protection de la vie privée des enfants',
    },
    {
        icon: Eye,
        label: 'Zéro Revente',
        description: 'Vos données ne sont jamais vendues à des tiers',
    },
    {
        icon: Database,
        label: 'Hébergement UE',
        description: 'Données stockées dans l\'Union Européenne',
    },
];

export default function TrustBadges() {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {badges.map((badge, index) => {
                const Icon = badge.icon;
                return (
                    <motion.div
                        key={badge.label}
                        className="group relative bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-landing-teacher-accent-green/20 hover:border-landing-teacher-accent-green/50 transition-all hover:shadow-lg hover:shadow-landing-teacher-accent-green/10"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -5 }}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-landing-teacher-accent-green/10 flex items-center justify-center mb-3">
                                <Icon className="w-6 h-6 text-landing-teacher-accent-green" />
                            </div>
                            <h4 className="font-bold text-landing-teacher-text-primary mb-2">
                                {badge.label}
                            </h4>
                            <p className="text-xs text-landing-teacher-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                                {badge.description}
                            </p>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
