"use client";

type AdminFooterProps = {
  onLogout: () => void;
};

export const AdminFooter = ({ onLogout }: AdminFooterProps) => {
  return (
    <footer className="mx-auto mt-12 flex w-full max-w-4xl flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/70 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:text-left">
      <p className="text-xs uppercase tracking-[0.3em] text-white/40">Cabaguide Admin</p>
      <button
        onClick={onLogout}
        className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
      >
        ログアウト
      </button>
    </footer>
  );
};
