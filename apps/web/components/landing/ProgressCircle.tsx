'use client';

import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface ProgressCircleProps {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    label?: string;
    className?: string;
}

export default function ProgressCircle({
    percentage,
    size = 200,
    strokeWidth = 12,
    label = 'Maîtrisé',
    className = ''
}: ProgressCircleProps) {
    const [progress, setProgress] = useState(0);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    useEffect(() => {
        // Animate progress on mount
        const timer = setTimeout(() => {
            setProgress(percentage);
        }, 100);
        return () => clearTimeout(timer);
    }, [percentage]);

    // Dynamic color based on percentage
    const getColor = (pct: number) => {
        if (pct >= 80) return '#00bf7d'; // Neon Green - excellent
        if (pct >= 60) return '#0073e6'; // Electric Blue - good
        if (pct >= 40) return '#FBBF24'; // Yellow - progress
        return '#F87171'; // Red - needs work
    };

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={getColor(percentage)}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                    style={{
                        strokeDasharray: circumference,
                    }}
                />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    className="text-4xl md:text-5xl font-bold text-white"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                >
                    {Math.round(progress)}%
                </motion.span>
                <motion.span
                    className="text-sm text-white/70 mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    {label}
                </motion.span>
            </div>
        </div>
    );
}
