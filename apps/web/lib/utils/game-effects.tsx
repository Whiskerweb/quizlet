'use client';

/**
 * Game Effects Utility
 * Provides visual and audio feedback for game modes
 */

// ============================================================================
// CONFETTI ANIMATION
// ============================================================================

export function triggerConfetti() {
    // Create confetti container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    document.body.appendChild(container);

    // Generate confetti pieces
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'absolute';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        confetti.style.opacity = '1';
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;

        container.appendChild(confetti);

        // Animate confetti falling
        const duration = 2000 + Math.random() * 1000;
        const xMovement = (Math.random() - 0.5) * 200;

        confetti.animate([
            {
                transform: `translateY(0) translateX(0) rotate(0deg)`,
                opacity: 1
            },
            {
                transform: `translateY(${window.innerHeight}px) translateX(${xMovement}px) rotate(${Math.random() * 720}deg)`,
                opacity: 0
            }
        ], {
            duration,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        });
    }

    // Remove container after animation
    setTimeout(() => {
        document.body.removeChild(container);
    }, 3500);
}

// ============================================================================
// SHAKE ANIMATION
// ============================================================================

export function triggerShake(element: HTMLElement | null) {
    if (!element) return;

    // Add shake class
    element.classList.add('game-shake');

    // Remove class after animation
    setTimeout(() => {
        element.classList.remove('game-shake');
    }, 500);
}

// ============================================================================
// CELEBRATION ANIMATION
// ============================================================================

export function triggerCelebration(element: HTMLElement | null) {
    if (!element) return;

    // Add celebration class
    element.classList.add('game-celebration');

    // Remove class after animation
    setTimeout(() => {
        element.classList.remove('game-celebration');
    }, 600);
}

// ============================================================================
// GLOW EFFECT
// ============================================================================

export function triggerGlow(element: HTMLElement | null, color: 'green' | 'red') {
    if (!element) return;

    const glowClass = color === 'green' ? 'game-glow-green' : 'game-glow-red';
    element.classList.add(glowClass);

    // Remove class after animation
    setTimeout(() => {
        element.classList.remove(glowClass);
    }, 1500);
}

// ============================================================================
// AUDIO EFFECTS
// ============================================================================

// Audio context for generating sounds
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
}

/**
 * Play a correct answer sound (cheerful, uplifting)
 */
export function playCorrectSound() {
    try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Cheerful ascending notes
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5

        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
    } catch (error) {
        console.warn('Could not play correct sound:', error);
    }
}

/**
 * Play an incorrect answer sound (low, disappointing)
 */
export function playIncorrectSound() {
    try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Descending notes (disappointing sound)
        oscillator.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
        oscillator.frequency.setValueAtTime(261.63, ctx.currentTime + 0.15); // C4

        oscillator.type = 'triangle';

        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    } catch (error) {
        console.warn('Could not play incorrect sound:', error);
    }
}

/**
 * Play a match success sound (satisfying click)
 */
export function playMatchSound() {
    try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Quick pleasant note
        oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
    } catch (error) {
        console.warn('Could not play match sound:', error);
    }
}

// ============================================================================
// COMBINED EFFECTS
// ============================================================================

/**
 * Trigger all correct answer effects
 */
export function triggerCorrectEffect(element?: HTMLElement | null) {
    playCorrectSound();
    triggerConfetti();
    if (element) {
        triggerCelebration(element);
        triggerGlow(element, 'green');
    }
}

/**
 * Trigger all incorrect answer effects
 */
export function triggerIncorrectEffect(element?: HTMLElement | null) {
    playIncorrectSound();
    if (element) {
        triggerShake(element);
        triggerGlow(element, 'red');
    }
}

/**
 * Trigger match success effect (sound + celebration, no confetti for less distraction)
 */
export function triggerMatchEffect(element?: HTMLElement | null) {
    playMatchSound();
    if (element) {
        triggerCelebration(element);
        triggerGlow(element, 'green');
    }
}
