import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, User, LogOut, Menu, Database, Globe, Server, Settings } from 'lucide-react';
import { useDataSource } from '../context/DataSourceContext';
import { useTheme } from '../context/ThemeContext';

export function Header({
  onSidebarToggle,
}: {
  onSidebarToggle: () => void;
  sidebarCollapsed?: boolean;
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { activeDataSource, isUsingMockData, connectionStatus } = useDataSource();
  const { theme } = useTheme();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tenants?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getDataSourceIcon = () => {
    switch (activeDataSource?.type) {
      case 'rest_api':
      case 'graphql':
        return <Globe className="w-3.5 h-3.5" />;
      case 'database':
        return <Database className="w-3.5 h-3.5" />;
      default:
        return <Server className="w-3.5 h-3.5" />;
    }
  };

  const getStatusColor = () => {
    if (connectionStatus === 'connected') return 'bg-emerald-500';
    if (connectionStatus === 'error') return 'bg-red-500';
    return 'bg-yellow-500';
  };

  const getStatusBg = () => {
    if (connectionStatus === 'connected') return 'bg-emerald-50 border-emerald-200';
    if (connectionStatus === 'error') return 'bg-red-50 border-red-200';
    return 'bg-yellow-50 border-yellow-200';
  };

  const getStatusText = () => {
    if (connectionStatus === 'connected') return 'text-emerald-700';
    if (connectionStatus === 'error') return 'text-red-700';
    return 'text-yellow-700';
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={onSidebarToggle}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tenants, DIDs, campaigns…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full sm:w-80 md:w-96 pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-slate-400"
          />
          <kbd className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-white border border-slate-200 rounded">
            ↵
          </kbd>
        </form>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Data Source indicator */}
        <button 
          onClick={() => navigate('/data-sources')}
          className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80 ${getStatusBg()}`}
          title={`Data Source: ${activeDataSource?.name || 'None'}`}
        >
          <span className={`w-2 h-2 rounded-full ${getStatusColor()} ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`} />
          <span className={`flex items-center gap-1.5 text-xs font-medium ${getStatusText()}`}>
            {getDataSourceIcon()}
            {isUsingMockData ? 'Mock Data' : connectionStatus === 'connected' ? 'Live' : connectionStatus === 'error' ? 'Error' : 'Unknown'}
          </span>
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
              SM
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-700">Sarah M.</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-900">Sarah Mitchell</p>
                <p className="text-xs text-slate-500">sarah@company.com</p>
                <span className="mt-1 inline-block text-[10px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  Super Admin
                </span>
              </div>
              <div className="py-1">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                  <User className="w-4 h-4" /> Profile
                </button>
                <button 
                  onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  <Settings className="w-4 h-4" /> Settings
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
