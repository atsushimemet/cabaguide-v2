"use client";

type AdminFooterProps = {
  onLogout: () => void;
};

export const AdminFooter = ({ onLogout }: AdminFooterProps) => {
  return (
    <footer className="mx-auto mt-12 flex w-full max-w-4xl flex-col gap-3 border-t border-white/15 pt-6 text-center text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between sm:text-left">
      <p className="text-xs uppercase tracking-[0.3em] text-white/40">Cabaguide Admin</p>
      <button
        onClick={onLogout}
        className="inline-flex items-center justify-center border-b border-white/30 px-1 pb-1 text-sm font-semibold text-white/90 transition hover:border-fuchsia-400/60"
      >
        ログアウト
      </button>
    </footer>
  );
};
