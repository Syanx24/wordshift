import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyButton({ text, label = "Copy Link", className = "" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 active:scale-95 ${
        copied
          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/50'
          : 'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/30'
      } ${className}`}
      aria-label="Copy invitation link"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 animate-bounce" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
