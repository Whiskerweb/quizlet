'use client';

import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    value: string;
    label: string;
    icon: LucideIcon;
    delay?: number;
}

export default function StatCard({ value, label, icon: Icon, delay = 0 }: StatCardProps) {
    return (
        <motion.div
            className="flex flex-col items-center p-6 bg-white rounded-xl border border-gray-200 hover:border-brand-primary/50 transition-all hover:shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
        >
            <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-brand-primary" />
            </div>
            <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {value}
            </div>
            <div className="text-sm text-gray-600 text-center">
                {label}
            </div>
        </motion.div>
    );
}
