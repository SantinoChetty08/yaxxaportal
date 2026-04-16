import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../utils/cn';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Search,
  Phone,
  FileText,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Database,
  Users,
  Settings,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Tenant Search', path: '/tenants', icon: <Search className="w-5 h-5" /> },
  { label: 'Create Tenant', path: '/tenants/create', icon: <PlusCircle className="w-5 h-5" /> },
  { label: 'DID Management', path: '/dids', icon: <Phone className="w-5 h-5" /> },
  { label: 'Users & Roles', path: '/users', icon: <Users className="w-5 h-5" /> },
  { label: 'Audit Log', path: '/audit', icon: <FileText className="w-5 h-5" /> },
  { label: 'Data Sources', path: '/data-sources', icon: <Database className="w-5 h-5" /> },
  { label: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" /> },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { theme } = useTheme();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-30 flex flex-col text-white transition-all duration-300 border-r border-slate-700/50',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
      style={{ background: theme.colors.sidebar }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          {theme.branding.logo ? (
            <img src={theme.branding.logo} alt="Logo" className="w-9 h-9 rounded-lg object-contain flex-shrink-0" />
          ) : (
            <div className="flex items-center justify-center w-9 h-9 rounded-lg shadow-lg flex-shrink-0" style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})` }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
          )}
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold tracking-tight">{theme.branding.portalName}</h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">{theme.branding.companyName} {theme.branding.tagline}</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-blue-600/20 text-blue-400 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
            {item.badge && !collapsed && (
              <span className="ml-auto text-xs bg-blue-600 text-white rounded-full px-2 py-0.5">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-slate-700/50">
        <button
          onClick={onToggle}
          className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
