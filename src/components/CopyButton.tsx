'use client';

import { useState } from "react";

type CopyButtonProps = {
  text: string;
  className?: string;
};

export const CopyButton = ({ text, className }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Clipboard copy failed", error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-fuchsia-400/60 ${className ?? ""}`}
      aria-label="テンプレートをコピー"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4 text-fuchsia-200"
      >
        <path d="M16 1H4c-1.103 0-2 .897-2 2v14h2V3h12V1z" />
        <path d="M19 5H8c-1.103 0-2 .897-2 2v16h13c1.103 0 2-.897 2-2V7c0-1.103-.897-2-2-2zm0 18H8V7h11l.002 16z" />
      </svg>
      {copied ? "コピー済み" : "テンプレートをコピー"}
    </button>
  );
};
