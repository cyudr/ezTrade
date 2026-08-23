import React, { useState, useRef, useEffect } from 'react';
import {
  TrendingUp,
  BarChart2,
  Share2,
  LineChart,
  Wallet,
  LogOut,
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
  ChevronDown,
  Activity,
  Check,
} from 'lucide-react';
import { ScreenTab, TerminalNotification, ThemeMode } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useTimezone, TIMEZONE_OPTIONS } from '../context/TimezoneContext';

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
  const timezoneMenuRef = useRef<HTMLDivElement>(null);

  const { theme, setTheme } = useTheme();
  const { timezone, setTimezone, activeOption, formatTime, formatDate } = useTimezone();

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close timezone menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timezoneMenuRef.current && !timezoneMenuRef.current.contains(event.target as Node)) {
        setTimezoneMenuOpen(false);
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
      desc: 'Statistical distributions & regression',
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
      desc: 'Active execution & risk parameters',
    },
    {
      id: 'portfolio' as ScreenTab,
      label: 'Portfolio',
      icon: Wallet,
      desc: 'Positions, watchlist & order entry',
    },
  ];

  const themeOptions: { id: ThemeMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'clear', label: 'Clear', icon: Droplets },
    { id: 'custom', label: 'Custom', icon: Palette },
  ];

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <nav
        id="side-navigation"
        className="hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 w-64 select-none transition-colors"
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
          color: 'var(--text-secondary)',
        }}
      >
        {/* User Identity Section */}
        <div className="px-4 py-3 mb-2">
          <div
            className="flex items-center gap-3 p-2.5 rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              className="w-9 h-9 rounded-full overflow-hidden shrink-0 relative"
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
                  className="font-bold text-[13px] font-mono-val truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Opti_Trader_01
                </h2>
              </div>
              <div
                className="flex items-center gap-1 text-[10px] font-mono-val font-semibold uppercase tracking-wider mt-0.5"
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

        {/* Navigation Items */}
        <ul className="flex flex-col flex-grow gap-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <li key={item.id}>
                <button
                  id={`nav-btn-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-mono-val text-[12px] font-semibold tracking-wide transition-all cursor-pointer text-left"
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

        {/* Theme Quick Selector in Sidebar */}
        <div className="px-3 mb-2">
          <div
            className="p-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between text-[10px] font-mono-val uppercase tracking-wider mb-1.5">
              <span style={{ color: 'var(--text-muted)' }}>Theme Mode</span>
              <span style={{ color: 'var(--accent-primary)' }} className="font-bold">
                {theme.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {themeOptions.map((t) => {
                const Icon = t.icon;
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className="flex flex-col items-center justify-center py-1.5 px-1 rounded text-[10px] font-mono-val transition-all cursor-pointer"
                    style={{
                      backgroundColor: isSelected ? 'var(--bg-card)' : 'transparent',
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)',
                      border: isSelected
                        ? '1px solid var(--border-strong)'
                        : '1px solid transparent',
                      boxShadow: isSelected ? 'var(--shadow-subtle)' : 'none',
                    }}
                    title={`${t.label} Theme`}
                  >
                    <Icon className="w-3.5 h-3.5 mb-0.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Real-time Clock & Timezone Selector in Sidebar */}
        <div className="px-3 mb-2">
          <div
            className="p-2.5 rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between text-[10px] font-mono-val uppercase tracking-wider mb-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} />
                <span style={{ color: 'var(--text-muted)' }}>Real-Time Clock</span>
              </div>
              <span
                className="font-bold text-[10px]"
                style={{ color: 'var(--accent-primary)' }}
              >
                {activeOption.code} ({activeOption.offset})
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div
                className="text-[15px] font-mono-val font-bold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {formatTime()}
              </div>
              <div
                className="text-[10px] font-mono-val"
                style={{ color: 'var(--text-muted)' }}
              >
                {formatDate()}
              </div>
            </div>

            {/* Quick timezone selector select */}
            <div className="mt-2 pt-2 border-t flex items-center justify-between gap-1" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-[10px] font-mono-val" style={{ color: 'var(--text-muted)' }}>
                Timezone:
              </span>
              <select
                id="sidebar-timezone-select"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                aria-label="Terminal Timezone Selection"
                className="text-[11px] font-mono-val py-0.5 px-1.5 rounded cursor-pointer focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {TIMEZONE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.flag} {opt.city} ({opt.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Live Engine Stream Controller */}
        <div className="px-3 mb-2">
          <div
            className="p-2 rounded-lg flex items-center justify-between text-[11px] font-mono-val transition-colors"
            style={{
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2">
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

        {/* Bottom Config Action */}
        <div
          className="px-3 py-2 border-t transition-colors"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-mono-val text-[11px] uppercase tracking-wider font-semibold transition-colors cursor-pointer"
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

      {/* Top Header Bar for Desktop & Mobile */}
      <header
        id="top-header"
        className="fixed top-0 right-0 left-0 md:left-64 z-30 h-14 px-4 flex items-center justify-between transition-colors backdrop-blur-md"
        style={{
          backgroundColor: 'var(--bg-header)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-3 flex-1">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Terminal Branding */}
          <div className="flex items-center gap-2">
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
              className="font-bold text-[15px] tracking-tight font-mono-val"
              style={{ color: 'var(--text-primary)' }}
            >
              QUANT_TERMINAL
            </span>
          </div>

          {/* Real-time Clock Widget in Header */}
          <div
            className="hidden md:flex items-center gap-2.5 px-3 py-1 rounded-lg ml-2 transition-colors"
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
                className="text-[13px] font-mono-val font-bold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {formatTime()}
              </span>
            </div>
            <div
              className="text-[11px] font-mono-val"
              style={{ color: 'var(--text-muted)' }}
            >
              {formatDate()}
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center relative ml-2 w-72">
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

        {/* Right Tools, Timezone Dropdown, Theme Toggle & Alerts */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Header Timezone Quick Selector */}
          <div className="relative" ref={timezoneMenuRef}>
            <button
              id="header-timezone-btn"
              onClick={() => setTimezoneMenuOpen(!timezoneMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono-val transition-all cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
              title="Change Timezone"
            >
              <Globe className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
              <span className="font-semibold">{activeOption.flag} {activeOption.code}</span>
              <span className="hidden sm:inline text-[10px]" style={{ color: 'var(--text-muted)' }}>
                ({activeOption.offset})
              </span>
              <ChevronDown className="w-3 h-3 ml-0.5" style={{ color: 'var(--text-muted)' }} />
            </button>

            {/* Timezone Dropdown Menu */}
            {timezoneMenuOpen && (
              <div
                className="absolute right-0 mt-1.5 w-72 rounded-xl shadow-xl z-50 p-2 border transition-all animate-in fade-in slide-in-from-top-2 duration-150 font-mono-val"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-strong)',
                }}
              >
                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b mb-1 flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <span>Select Terminal Timezone</span>
                  <span>Real-Time Sync</span>
                </div>
                <div className="max-h-72 overflow-y-auto space-y-1">
                  {TIMEZONE_OPTIONS.map((opt) => {
                    const isSelected = timezone === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setTimezone(opt.id);
                          setTimezoneMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-[12px] transition-colors cursor-pointer"
                        style={{
                          backgroundColor: isSelected ? 'var(--accent-subtle)' : 'transparent',
                          color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{opt.flag}</span>
                          <div>
                            <div className="font-semibold text-[12px] leading-tight">
                              {opt.city} ({opt.code})
                            </div>
                            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              {opt.offset} • {opt.region}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Theme Switcher Pill in Header */}
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
                  className="px-2 py-1 rounded text-[11px] font-mono-val flex items-center gap-1 transition-all cursor-pointer"
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-card)' : 'transparent',
                    color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)',
                    fontWeight: isSelected ? 600 : 400,
                    boxShadow: isSelected ? 'var(--shadow-subtle)' : 'none',
                  }}
                  title={`Switch to ${t.label} theme`}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              );
            })}
          </div>

          <div
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono-val"
            style={{
              backgroundColor: 'var(--color-positive-bg)',
              color: 'var(--color-positive)',
              border: '1px solid var(--color-positive-border)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'var(--color-positive)' }}
            />
            <span>Engine Ready</span>
          </div>

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

          <button
            id="settings-btn"
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            style={{
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="Terminal Settings & Custom Theme"
          >
            <Settings className="w-4 h-4" />
          </button>

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

            {/* Mobile Timezone Selector */}
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
                <span>Select Timezone</span>
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
                      <span>{opt.flag}</span>
                      <div className="truncate">
                        <div className="font-semibold truncate">{opt.city}</div>
                        <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{opt.code} ({opt.offset})</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Theme Selector */}
            <div
              className="mt-3 p-3 rounded-lg"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                className="text-[11px] font-mono-val font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Select Theme
              </div>
              <div className="grid grid-cols-2 gap-2">
                {themeOptions.map((t) => {
                  const Icon = t.icon;
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className="flex items-center gap-2 p-2 rounded text-[12px] font-mono-val transition-all"
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-subtle)' : 'var(--bg-card-subtle)',
                        color: isSelected ? 'var(--accent-text)' : 'var(--text-secondary)',
                        border: isSelected
                          ? '1px solid var(--accent-primary)'
                          : '1px solid var(--border-subtle)',
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{t.label}</span>
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
