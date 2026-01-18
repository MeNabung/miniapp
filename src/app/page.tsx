"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { useFarcaster } from "./providers";
import { Wallet, ConnectWallet } from "@coinbase/onchainkit/wallet";

// Floating particle component for background ambiance
function FloatingParticle({ delay, duration, x, y, size }: {
  delay: number;
  duration: number;
  x: number;
  y: number;
  size: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full bg-gold/20"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.6, 0.3, 0.6, 0],
        scale: [0.5, 1, 0.8, 1, 0.5],
        y: [0, -30, -15, -45, -60],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// Generate random particles
const particles = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  delay: Math.random() * 3,
  duration: 4 + Math.random() * 3,
  x: 10 + Math.random() * 80,
  y: 20 + Math.random() * 60,
  size: 4 + Math.random() * 8,
}));

type Phase = 'branding' | 'tap-prompt' | 'connect' | 'redirecting';

export default function Home() {
  const router = useRouter();
  const { isReady } = useFarcaster();
  const { isConnected } = useAccount();

  // Phase tracking for Netflix-like flow
  const [phase, setPhase] = useState<Phase>('branding');

  // Animation stage for branding phase
  const [animationStage, setAnimationStage] = useState(0);
  // 0: Initial (logo fade in)
  // 1: Logo pulse/glow
  // 2: Title appears
  // 3: Tagline appears

  // Handle tap to continue
  const handleTapToContinue = useCallback(() => {
    if (phase === 'tap-prompt') {
      setPhase('connect');
    }
  }, [phase]);

  // Redirect to dashboard once SDK is ready AND wallet is connected
  useEffect(() => {
    if (isReady && isConnected) {
      // Use setTimeout to avoid synchronous setState within effect
      const phaseTimer = setTimeout(() => setPhase('redirecting'), 0);
      // Small delay to show the redirecting state
      const redirectTimer = setTimeout(() => {
        router.replace("/dashboard");
      }, 800);
      return () => {
        clearTimeout(phaseTimer);
        clearTimeout(redirectTimer);
      };
    }
  }, [isReady, isConnected, router]);

  // Animation sequence timing for branding phase
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    // Stage 1: Logo pulse (after 0.5s)
    timers.push(setTimeout(() => setAnimationStage(1), 500));

    // Stage 2: Title appears (after 1s)
    timers.push(setTimeout(() => setAnimationStage(2), 1000));

    // Stage 3: Tagline appears (after 1.5s)
    timers.push(setTimeout(() => setAnimationStage(3), 1500));

    // After 3s, show tap prompt (Phase 2)
    timers.push(setTimeout(() => {
      setPhase('tap-prompt');
    }, 3000));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-cream"
      onClick={handleTapToContinue}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleTapToContinue();
        }
      }}
    >
      {/* Floating particles background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((particle) => (
          <FloatingParticle key={particle.id} {...particle} />
        ))}
      </div>

      {/* Subtle gradient overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 40%, rgba(13, 79, 79, 0.03) 0%, transparent 70%)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      />

      {/* Main content */}
      <AnimatePresence mode="wait">
        {(phase === 'branding' || phase === 'tap-prompt') && (
          <motion.div
            key="branding"
            className="relative z-10 flex flex-col items-center justify-center px-6"
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {/* Logo with Netflix-style animation */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              {/* Logo glow effect */}
              <motion.div
                className="absolute inset-0 rounded-full blur-xl"
                style={{ backgroundColor: "rgba(196, 163, 90, 0.3)" }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={animationStage >= 1 ? {
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.1, 1],
                } : { opacity: 0 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Logo pulse animation */}
              <motion.div
                className="relative"
                animate={animationStage >= 1 ? {
                  scale: [1, 1.02, 1],
                } : {}}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Image
                  src="/icon.png"
                  alt="MeNabung"
                  width={120}
                  height={120}
                  className="relative z-10 bg-transparent"
                  priority
                />
              </motion.div>
            </motion.div>

            {/* App name with fade-in */}
            <AnimatePresence>
              {animationStage >= 2 && (
                <motion.h1
                  className="mt-6 text-3xl font-bold text-teal tracking-tight"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  MeNabung
                </motion.h1>
              )}
            </AnimatePresence>

            {/* Tagline with staggered fade-in */}
            <AnimatePresence>
              {animationStage >= 3 && (
                <motion.p
                  className="mt-2 text-base text-teal/70 font-medium"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  AI-Powered DeFi Savings
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {phase === 'connect' && (
          <motion.div
            key="connect"
            className="relative z-10 flex flex-col items-center justify-center px-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Logo - smaller in connect phase */}
            <motion.div
              className="relative"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Image
                src="/icon.png"
                alt="MeNabung"
                width={100}
                height={100}
                className="bg-transparent"
                priority
              />
            </motion.div>

            {/* App name */}
            <motion.h1
              className="mt-4 text-2xl font-bold text-teal tracking-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              MeNabung
            </motion.h1>

            {/* Connect section */}
            <motion.div
              className="mt-2 flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: 0.15,
              }}
            >
              {!isReady ? (
                // Loading state
                <motion.div
                  className="flex flex-col items-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="w-8 h-8 border-2 border-teal/30 border-t-teal rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <p className="text-sm text-teal/60">Initializing...</p>
                </motion.div>
              ) : (
                // Connect wallet state
                <>
                  <p className="text-sm text-teal/60 text-center mb-5">
                    Connect your wallet to start saving
                  </p>

                  {/* Styled wallet button container */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                      delay: 0.25,
                    }}
                  >
                    {/* Button glow effect */}
                    <motion.div
                      className="absolute inset-0 rounded-xl blur-md"
                      style={{ backgroundColor: "rgba(13, 79, 79, 0.3)" }}
                      animate={{
                        opacity: [0.5, 0.8, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />

                    <Wallet>
                      <ConnectWallet
                        className="relative bg-teal! hover:bg-teal/90! text-cream! font-medium! px-6! py-2.5! rounded-lg! text-sm! shadow-md! transition-colors!"
                      />
                    </Wallet>
                  </motion.div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}

        {phase === 'redirecting' && (
          <motion.div
            key="redirecting"
            className="relative z-10 flex flex-col items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Logo */}
            <motion.div className="relative">
              <motion.div
                className="absolute inset-0 rounded-full blur-xl"
                style={{ backgroundColor: "rgba(196, 163, 90, 0.4)" }}
                animate={{
                  opacity: [0.4, 0.7, 0.4],
                  scale: [1, 1.15, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <Image
                src="/icon.png"
                alt="MeNabung"
                width={100}
                height={100}
                className="relative z-10 bg-transparent"
                priority
              />
            </motion.div>

            <motion.div
              className="mt-8 flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div
                className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <p className="text-sm text-teal/60">Opening MeNabung...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap to continue prompt */}
      <AnimatePresence>
        {phase === 'tap-prompt' && (
          <motion.div
            className="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.p
              className="text-sm text-teal/50 font-medium"
              animate={{
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              Tap anywhere to continue
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom decorative element - only show during branding/tap-prompt */}
      <AnimatePresence>
        {(phase === 'branding' || phase === 'tap-prompt') && animationStage >= 3 && (
          <motion.div
            className="absolute bottom-8 flex gap-1 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-teal/40"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
