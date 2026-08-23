import React, { useState, useRef, useEffect } from 'react';
import {
  TrendingUp,
  BarChart2,
  Share2,
  LineChart,
  Wallet,
  Search,
  Bell,
  Settings,
  HelpCircle,
  Menu,
  Terminal,
  X,
  Sparkles,
  Sun,
  Moon,
  Droplets,
  Palette,
  Clock,
  Globe,
  DollarSign,
  Check,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ScreenTab, TerminalNotification, ThemeMode } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useTimezone, TIMEZONE_OPTIONS } from '../context/TimezoneContext';
import { useCurrency, CURRENCY_OPTIONS } from '../context/CurrencyContext';

interface NavigationProps {
  currentTab: ScreenTab;
  onSelectTab: (tab: ScreenTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  notifications: TerminalNotification[];
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  isLiveTicking: boolean;
  onToggleLiveTicking: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  notifications,
  onOpenNotifications,
  onOpenSettings,
  onOpenHelp,
  isLiveTicking,
  onToggleLiveTicking,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [timezoneMenuOpen, setTimezoneMenuOpen] = useState(false);
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const timezoneMenuRef = useRef<HTMLDivElement>(null);
  const currencyMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const { theme, setTheme } = useTheme();
  const { timezone, setTimezone, activeOption, formatTime, formatDate } = useTimezone();
  const { currency, setCurrency, activeCurrencyOption } = useCurrency();

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timezoneMenuRef.current && !timezoneMenuRef.current.contains(event.target as Node)) {
        setTimezoneMenuOpen(false);
      }
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(event.target as Node)) {
        setCurrencyMenuOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    {
      id: 'market' as ScreenTab,
      label: 'Market',
      icon: TrendingUp,
      desc: 'Live ticker & correlations',
    },
    {
      id: 'research' as ScreenTab,
      label: 'Research',
      icon: BarChart2,
      desc: 'Distributions & statistics',
    },
    {
      id: 'signals' as ScreenTab,
      label: 'Signals',
      icon: Share2,
      desc: 'Backtesting & signal heatmaps',
    },
    {
      id: 'strategy' as ScreenTab,
      label: 'Strategy',
      icon: LineChart,
      desc: 'DMA execution & risk parameters',
    },
    {
      id: 'portfolio' as ScreenTab,
      label: 'Portfolio',
      icon: Wallet,
      desc: 'Positions, watchlist & orders',
    },
  ];

  const themeOptions: { id: ThemeMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'clear', label: 'Clear', icon: Droplets },
    { id: 'custom', label: 'Custom', icon: Palette },
  ];

  const activeThemeObj = themeOptions.find((t) => t.id === theme) || themeOptions[0];
  const ActiveThemeIcon = activeThemeObj.icon;

  return (
    <>
      {/* Desktop Persistent Sidebar - Streamlined, Non-Duplicated, Width w-56 (224px) */}
      <nav
        id="side-navigation"
        className="hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 w-56 select-none transition-colors"
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
          color: 'var(--text-secondary)',
        }}
      >
        {/* User Identity Section */}
        <div className="px-3 py-3 mb-1">
          <div
            className="flex items-center gap-2.5 p-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              className="w-8 h-8 rounded-full overflow-hidden shrink-0 relative"
              style={{ border: '1px solid var(--border-strong)' }}
            >
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDg8kQvJm6NJDKfvBBljQawVVmfl8d9z3r8STyw6tzhUS-0jsb9QLXOc3v93pwWWXUoTSHapCgIFJJ1EWQ_wFNvddAEa3xYANBntylKKX5Wom9KgOY3pi8mD9TuFj5sVIGPGjMrGKLXe20b7M49wjkHSUegTT8Apdow6vZG0wWK8PtlzkmoCW6kFGNzU3h3Ah0d4vk8xN1BxEqgdtrW3XX-kUOuQ2cD03iTlN2kT2Pt-53U-A9Q5qAY"
                alt="user_profile"
                className="w-full h-full object-cover"
              />
              <span
                className="absolute bottom-0 right-0 w-2 h-2 rounded-full"
                style={{
                  backgroundColor: isLiveTicking ? 'var(--color-positive)' : 'var(--text-muted)',
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h2
                  className="font-bold text-[12px] font-mono-val truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Opti_Trader_01
                </h2>
              </div>
              <div
                className="flex items-center gap-1 text-[9px] font-mono-val font-semibold uppercase tracking-wider mt-0.5"
                style={{ color: 'var(--color-positive)' }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--color-positive)' }}
                />
                Session Active
              </div>
            </div>
          </div>
        </div>

        {/* Core Navigation Items */}
        <ul className="flex flex-col flex-grow gap-1 px-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <li key={item.id}>
                <button
                  id={`nav-btn-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-mono-val text-[12px] font-semibold tracking-wide transition-all cursor-pointer text-left"
                  style={{
                    backgroundColor: isActive ? 'var(--accent-subtle)' : 'transparent',
                    color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                    borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  }}
                >
                  <Icon
                    className="w-4 h-4 shrink-0"
                    style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                  />
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Engine Stream Controller */}
        <div className="px-2.5 mb-2">
          <div
            className="p-2 rounded-lg flex items-center justify-between text-[11px] font-mono-val transition-colors"
            style={{
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Market Feed</span>
            </div>
            <button
              onClick={onToggleLiveTicking}
              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
              style={{
                backgroundColor: isLiveTicking
                  ? 'var(--color-positive-bg)'
                  : 'var(--color-neutral-badge-bg)',
                color: isLiveTicking
                  ? 'var(--color-positive)'
                  : 'var(--color-neutral-badge-text)',
                border: isLiveTicking
                  ? '1px solid var(--color-positive-border)'
                  : '1px solid var(--border-subtle)',
              }}
            >
              {isLiveTicking ? 'LIVE' : 'PAUSED'}
            </button>
          </div>
        </div>

        {/* System Telemetry Badge */}
        <div className="px-2.5 mb-2">
          <div
            className="p-2 rounded-lg flex items-center justify-between text-[10px] font-mono-val"
            style={{
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--color-positive)' }} />
              <span>DMA v4.2.0</span>
            </div>
            <div className="flex items-center gap-1 font-semibold" style={{ color: 'var(--color-positive)' }}>
              <Zap className="w-3 h-3" />
              <span>11ms</span>
            </div>
          </div>
        </div>

        {/* Bottom Config Action */}
        <div
          className="px-2.5 py-2 border-t transition-colors"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono-val text-[11px] uppercase tracking-wider font-semibold transition-colors cursor-pointer"
            style={{
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Settings className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            <span>Terminal Config</span>
          </button>
        </div>
      </nav>

      {/* Top Header Bar - Authoritative Real-Time Widget, Global Search, and Icon-Only Tools (left-0 md:left-56) */}
      <header
        id="top-header"
        className="fixed top-0 right-0 left-0 md:left-56 z-30 h-14 px-3 sm:px-4 flex items-center justify-between transition-colors backdrop-blur-md"
        style={{
          backgroundColor: 'var(--bg-header)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Terminal Branding */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="p-1 rounded"
              style={{
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent-primary)',
              }}
            >
              <Terminal className="w-4 h-4" />
            </div>
            <span
              className="font-bold text-[14px] sm:text-[15px] tracking-tight font-mono-val hidden sm:inline"
              style={{ color: 'var(--text-primary)' }}
            >
              QUANT_TERMINAL
            </span>
          </div>

          {/* Authoritative Real-time Clock & Date Widget (Top Bar Only) */}
          <div
            className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg transition-colors shrink-0"
            style={{
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: isLiveTicking ? 'var(--color-positive)' : 'var(--text-muted)' }}
              />
              <span
                className="text-[12px] font-mono-val font-bold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {formatTime()}
              </span>
            </div>
            <div
              className="text-[10px] font-mono-val hidden md:inline"
              style={{ color: 'var(--text-muted)' }}
            >
              {formatDate()}
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="hidden lg:flex items-center relative flex-1 max-w-xs">
            <Search
              className="w-3.5 h-3.5 absolute left-3 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter ticker, strategy, asset..."
              className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded-lg font-mono-val focus:outline-none transition-all"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 text-[11px] cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Tools: Icon-Only Timezone, Icon-Only Currency, Theme Selector, Notifications & Help */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Header Timezone Selector (Icon Only Trigger) */}
          <div className="relative" ref={timezoneMenuRef}>
            <button
              id="header-timezone-btn"
              onClick={() => {
                setTimezoneMenuOpen(!timezoneMenuOpen);
                setCurrencyMenuOpen(false);
                setThemeMenuOpen(false);
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
              style={{
                backgroundColor: timezoneMenuOpen ? 'var(--accent-subtle)' : 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                color: timezoneMenuOpen ? 'var(--accent-primary)' : 'var(--text-primary)',
              }}
              title={`Active Timezone: ${activeOption.code} (${activeOption.offset})`}
              aria-label="Timezone Selection"
            >
              <Globe className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </button>

            {/* Timezone Dropdown Menu (Short Letters Only) */}
            {timezoneMenuOpen && (
              <div
                className="absolute right-0 mt-1.5 w-56 rounded-xl shadow-xl z-50 p-2 border transition-all animate-in fade-in slide-in-from-top-2 duration-150 font-mono-val"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-strong)',
                }}
              >
                <div
                  className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider border-b mb-1 flex items-center justify-between"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                >
                  <span>TIMEZONE</span>
                  <span style={{ color: 'var(--accent-primary)' }}>{activeOption.code}</span>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-0.5">
                  {TIMEZONE_OPTIONS.map((opt) => {
                    const isSelected = timezone === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setTimezone(opt.id);
                          setTimezoneMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-left text-[11px] transition-colors cursor-pointer"
                        style={{
                          backgroundColor: isSelected ? 'var(--accent-subtle)' : 'transparent',
                          color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)',
                        }}
                      >
                        <span className="font-semibold">
                          {opt.shortLabel || `${opt.code} (${opt.offset})`}
                        </span>
                        {isSelected && (
                          <Check
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: 'var(--accent-primary)' }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Header Currency Selector (Icon Only Trigger) */}
          <div className="relative" ref={currencyMenuRef}>
            <button
              id="header-currency-btn"
              onClick={() => {
                setCurrencyMenuOpen(!currencyMenuOpen);
                setTimezoneMenuOpen(false);
                setThemeMenuOpen(false);
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
              style={{
                backgroundColor: currencyMenuOpen ? 'var(--accent-subtle)' : 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                color: currencyMenuOpen ? 'var(--accent-primary)' : 'var(--text-primary)',
              }}
              title={`Base Currency: ${currency} (${activeCurrencyOption.symbol})`}
              aria-label="Currency Selection"
            >
              <DollarSign className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </button>

            {/* Currency Dropdown Menu (Short Letters Only) */}
            {currencyMenuOpen && (
              <div
                className="absolute right-0 mt-1.5 w-48 rounded-xl shadow-xl z-50 p-2 border transition-all animate-in fade-in slide-in-from-top-2 duration-150 font-mono-val"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-strong)',
                }}
              >
                <div
                  className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider border-b mb-1 flex items-center justify-between"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                >
                  <span>BASE CURRENCY</span>
                  <span style={{ color: 'var(--accent-primary)' }}>{currency}</span>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-0.5">
                  {CURRENCY_OPTIONS.map((c) => {
                    const isSelected = currency === c.code;
                    return (
                      <button
                        key={c.code}
                        onClick={() => {
                          setCurrency(c.code);
                          setCurrencyMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-left text-[11px] transition-colors cursor-pointer"
                        style={{
                          backgroundColor: isSelected ? 'var(--accent-subtle)' : 'transparent',
                          color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)',
                        }}
                      >
                        <span className="font-semibold">
                          {c.code} ({c.symbol})
                        </span>
                        {isSelected && (
                          <Check
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: 'var(--accent-primary)' }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Theme Switcher in Header */}
          <div
            className="flex items-center p-0.5 rounded-lg"
            style={{
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {themeOptions.map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className="px-1.5 sm:px-2 py-1 rounded text-[10px] font-mono-val flex items-center gap-1 transition-all cursor-pointer"
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-card)' : 'transparent',
                    color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)',
                    fontWeight: isSelected ? 600 : 400,
                    boxShadow: isSelected ? 'var(--shadow-subtle)' : 'none',
                  }}
                  title={`Switch to ${t.label} theme`}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden lg:inline">{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Notifications Trigger */}
          <button
            id="notifications-btn"
            onClick={onOpenNotifications}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative cursor-pointer"
            style={{
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{
                  backgroundColor: 'var(--color-negative)',
                  boxShadow: '0 0 0 2px var(--bg-card)',
                }}
              />
            )}
          </button>

          {/* Settings Trigger */}
          <button
            id="settings-btn"
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            style={{
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="Terminal Settings & Custom Themes"
            aria-label="Terminal Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Help & Shortcuts Trigger */}
          <button
            id="help-btn"
            onClick={onOpenHelp}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            style={{
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="Help & Shortcuts"
            aria-label="Help and Shortcuts"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-sm flex flex-col animate-in fade-in duration-150">
          <div
            className="p-4 border-b flex items-center justify-between"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              <span
                className="font-bold text-[15px] font-mono-val"
                style={{ color: 'var(--text-primary)' }}
              >
                QUANT_TERMINAL
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            className="flex-1 overflow-y-auto p-4 space-y-2"
            style={{ backgroundColor: 'var(--bg-app)' }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left font-mono-val text-[13px] font-semibold transition-all"
                  style={{
                    backgroundColor: isActive ? 'var(--accent-subtle)' : 'var(--bg-card)',
                    color: isActive ? 'var(--accent-text)' : 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                  />
                  <div>
                    <div>{item.label}</div>
                    <div className="text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Mobile Timezone Selector (Short Letters Only) */}
            <div
              className="mt-3 p-3 rounded-lg"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                className="text-[11px] font-mono-val font-semibold uppercase tracking-wider mb-2 flex items-center justify-between"
                style={{ color: 'var(--text-muted)' }}
              >
                <span>Timezone</span>
                <span style={{ color: 'var(--accent-primary)' }}>{formatTime()}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {TIMEZONE_OPTIONS.map((opt) => {
                  const isSelected = timezone === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setTimezone(opt.id)}
                      className="flex items-center gap-2 p-2 rounded text-[11px] font-mono-val transition-all text-left"
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-subtle)' : 'var(--bg-card-subtle)',
                        color: isSelected ? 'var(--accent-text)' : 'var(--text-secondary)',
                        border: isSelected
                          ? '1px solid var(--accent-primary)'
                          : '1px solid var(--border-subtle)',
                      }}
                    >
                      <span className="font-semibold">{opt.shortLabel || `${opt.code}`}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Currency Selector (Short Letters Only) */}
            <div
              className="mt-3 p-3 rounded-lg"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                className="text-[11px] font-mono-val font-semibold uppercase tracking-wider mb-2 flex items-center justify-between"
                style={{ color: 'var(--text-muted)' }}
              >
                <span>Currency</span>
                <span style={{ color: 'var(--accent-primary)' }}>{currency}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CURRENCY_OPTIONS.map((c) => {
                  const isSelected = currency === c.code;
                  return (
                    <button
                      key={c.code}
                      onClick={() => setCurrency(c.code)}
                      className="flex items-center justify-between p-2 rounded text-[11px] font-mono-val transition-all"
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-subtle)' : 'var(--bg-card-subtle)',
                        color: isSelected ? 'var(--accent-text)' : 'var(--text-secondary)',
                        border: isSelected
                          ? '1px solid var(--accent-primary)'
                          : '1px solid var(--border-subtle)',
                      }}
                    >
                      <span className="font-semibold">{c.code} ({c.symbol})</span>
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-15 flex items-center justify-around px-2 backdrop-blur-md transition-colors"
        style={{
          backgroundColor: 'var(--bg-header)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className="flex flex-col items-center justify-center w-full h-full py-1 font-mono-val text-[10px] font-medium uppercase transition-all"
              style={{
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'scale-110' : ''}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
