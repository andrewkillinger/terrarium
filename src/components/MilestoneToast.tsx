'use client';

import { useEffect, useState } from 'react';
import { Milestone } from '@/lib/types';

interface MilestoneToastProps {
  milestone: Milestone | null;
}

export default function MilestoneToast({ milestone }: MilestoneToastProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!milestone) return;
    setVisible(true);
    setLeaving(false);

    const hideTimer = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => setVisible(false), 300);
    }, 4000);

    return () => clearTimeout(hideTimer);
  }, [milestone]);

  if (!visible || !milestone) return null;

  return (
    <div className={`fixed top-1/3 left-1/2 -translate-x-1/2 z-[60] ${leaving ? 'animate-toast-out' : ''}`}>
      <div className="animate-milestone bg-gradient-to-br from-yellow-900/95 to-amber-900/95 backdrop-blur-sm border border-yellow-500/50 rounded-2xl px-6 py-4 shadow-2xl text-center">
        <div className="text-3xl mb-2">{milestone.icon}</div>
        <div className="text-yellow-300 font-bold text-lg uppercase tracking-wider">Milestone!</div>
        <div className="text-white font-bold text-base mt-1">{milestone.title}</div>
        <div className="text-yellow-200/70 text-sm mt-0.5">{milestone.description}</div>
      </div>
    </div>
  );
}
