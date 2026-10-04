"use client";
import { Bell, Heart, Home, Search } from "lucide-react";
export default function MobileNavigation({
  settings,
  onHome,
  onSettings,
}: {
  settings: boolean;
  onHome: () => void;
  onSettings: () => void;
}) {
  return (
    <nav className="mobile-nav">
      <button
        className={!settings ? "active" : ""}
        onClick={onHome}
        aria-label="Início"
      >
        <Home size={21} />
      </button>
      <button aria-label="Pesquisar">
        <Search size={21} />
      </button>
      <button aria-label="Memórias">
        <Heart size={21} />
      </button>
      <button aria-label="Notificações">
        <Bell size={21} />
      </button>
      <button
        className={settings ? "active" : ""}
        onClick={onSettings}
        aria-label="Configuração de conta"
      >
        <span className="text-lg">◉</span>
      </button>
    </nav>
  );
}
