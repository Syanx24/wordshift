import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export default function ShareButton({ title, text, url, className = "" }) {
  const [shared, setShared] = useState(false);
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleShare = async () => {
    if (canShare) {
      try {
        await navigator.share({
          title: title || 'Join my WORDSHIFT Match',
          text: text || 'Can you transform the word before I do? Join my WORDSHIFT room!',
          url: url || window.location.href,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Share failed, fallback to copy', err);
        }
      }
    } else {
      // Fallback to copy
      try {
        await navigator.clipboard.writeText(url || window.location.href);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-dark-surface text-slate-800 dark:text-slate-200 shadow-sm active:scale-95 ${className}`}
      aria-label="Share room invitation"
    >
      {shared ? (
        <>
          <Check className="w-4 h-4 text-emerald-500" />
          <span className="text-emerald-600 dark:text-emerald-400">Shared!</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4 text-brand-500" />
          <span>Share Invite</span>
        </>
      )}
    </button>
  );
}
