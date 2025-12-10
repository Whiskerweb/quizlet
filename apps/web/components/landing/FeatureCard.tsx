'use client';

import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    index: number;
}

export default function FeatureCard({ icon: Icon, title, description, index }: FeatureCardProps) {
    return (
        <motion.div
            className="group p-6 bg-white rounded-2xl border border-gray-200 hover:border-brand-primary/50 hover:shadow-xl transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -5 }}
        >
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-4 group-hover:bg-brand-primary/20 transition-colors">
                <Icon className="w-6 h-6 text-brand-primary" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
                {title}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
                {description}
            </p>
        </motion.div>
    );
}
