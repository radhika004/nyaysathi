
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Redirect to dashboard after animation
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden">
      <div className="animate-in fade-in zoom-in duration-1000 flex flex-col items-center">
        <h1 className="text-white text-7xl md:text-9xl font-black tracking-[0.2em] select-none text-center">
          WELCOME
        </h1>
        <div className="mt-8 h-1 w-24 bg-primary rounded-full animate-in slide-in-from-left duration-1000 delay-500" />
        <p className="mt-12 text-zinc-500 text-sm tracking-widest uppercase font-light animate-pulse">
          Accessing Legal Intelligence...
        </p>
      </div>
    </div>
  );
}
