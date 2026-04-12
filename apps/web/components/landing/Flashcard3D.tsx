'use client';

import { motion } from 'motion/react';
import { useState } from 'react';

interface Flashcard3DProps {
    front: string;
    back: string;
    className?: string;
}

export default function Flashcard3D({ front, back, className = '' }: Flashcard3DProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div
            className={`perspective-1000 cursor-pointer ${className}`}
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <motion.div
                className="relative w-full h-full"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front of card */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-landing-student-accent-blue to-landing-student-accent-green rounded-2xl shadow-2xl p-8 flex items-center justify-center"
                    style={{ backfaceVisibility: 'hidden' }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="text-center">
                        <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-white text-balance">
                            {front}
                        </p>
                        <p className="mt-4 text-sm text-white/70">Cliquer pour révéler</p>
                    </div>
                </motion.div>

                {/* Back of card */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-landing-student-accent-green to-landing-student-accent-blue rounded-2xl shadow-2xl p-8 flex items-center justify-center"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                    }}
                >
                    <div className="text-center">
                        <p className="text-xl md:text-2xl lg:text-3xl text-white text-balance">
                            {back}
                        </p>
                        <p className="mt-4 text-sm text-white/70">Cliquer pour retourner</p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
