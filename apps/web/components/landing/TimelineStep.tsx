'use client';

import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface TimelineStepProps {
    number: string;
    title: string;
    description: string;
    icon: LucideIcon;
    index: number;
    isLast?: boolean;
}

export default function TimelineStep({
    number,
    title,
    description,
    icon: Icon,
    index,
    isLast = false
}: TimelineStepProps) {
    return (
        <motion.div
            className="relative flex items-start gap-6"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2, duration: 0.5 }}
        >
            {/* Number Circle */}
            <div className="flex-shrink-0 relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondaryTeal flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {number}
                </div>
                {/* Connecting Line */}
                {!isLast && (
                    <div className="absolute top-14 left-1/2 -translate-x-1/2 w-0.5 h-16 bg-gradient-to-b from-brand-primary/30 to-transparent" />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-12">
                <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-5 h-5 text-brand-primary" />
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                    {description}
                </p>
            </div>
        </motion.div>
    );
}
