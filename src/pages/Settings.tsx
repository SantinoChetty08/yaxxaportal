import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Palette,
  Sun,
  Moon,
  RotateCcw,
  Building2,
  Image,
  Type,
  Globe,
  Upload,
  X,
  Save,
  Shield,
} from 'lucide-react';
import { useTheme, ThemeColors, BrandingConfig } from '../context/ThemeContext';

const presetThemes = [
  { name: 'Ocean Blue', colors: { primary: '#3B82F6', primaryLight: '#60A5FA', primaryDark: '#2563EB', accent: '#8B5CF6', sidebar: '#0F172A', header: '#1E293B' } },
  { name: 'Emerald', colors: { primary: '#10B981', primaryLight: '#34D399', primaryDark: '#059669', accent: '#14B8A6', sidebar: '#022C22', header: '#064E3B' } },
  { name: 'Purple Haze', colors: { primary: '#8B5CF6', primaryLight: '#A78BFA', primaryDark: '#7C3AED', accent: '#EC4899', sidebar: '#1E1B4B', header: '#312E81' } },
  { name: 'Sunset', colors: { primary: '#F97316', primaryLight: '#FB923C', primaryDark: '#EA580C', accent: '#EF4444', sidebar: '#1C1917', header: '#292524' } },
  { name: 'Rose', colors: { primary: '#EC4899', primaryLight: '#F472B6', primaryDark: '#DB2777', accent: '#F43F5E', sidebar: '#1C1917', header: '#292524' } },
  { name: 'Teal', colors: { primary: '#14B8A6', primaryLight: '#2DD4BF', primaryDark: '#0D9488', accent: '#06B6D4', sidebar: '#042F2E', header: '#134E4A' } },
  { name: 'Slate', colors: { primary: '#64748B', primaryLight: '#94A3B8', primaryDark: '#475569', accent: '#6366F1', sidebar: '#0F172A', header: '#1E293B' } },
  { name: 'Midnight', colors: { primary: '#6366F1', primaryLight: '#818CF8', primaryDark: '#4F46E5', accent: '#A855F7', sidebar: '#020617', header: '#0F172A' } },
];

const lightThemes = [
  { name: 'Clean White', colors: { primary: '#3B82F6', primaryLight: '#60A5FA', primaryDark: '#2563EB', accent: '#8B5CF6', sidebar: '#FFFFFF', header: '#F8FAFC' } },
  { name: 'Warm Cream', colors: { primary: '#D97706', primaryLight: '#F59E0B', primaryDark: '#B45309', accent: '#EA580C', sidebar: '#FFFBEB', header: '#FEF3C7' } },
  { name: 'Soft Gray', colors: { primary: '#4B5563', primaryLight: '#6B7280', primaryDark: '#374151', accent: '#6366F1', sidebar: '#F9FAFB', header: '#F3F4F6' } },
];

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-slate-400">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-24 px-2 py-1 text-xs rounded bg-slate-700 border border-slate-600 text-white font-mono"
        />
      </div>
    </div>
  );
}

export default function Settings() {
  const { theme, isDarkMode, toggleDarkMode, setColors, setBranding, resetTheme, resetBranding } = useTheme();
  const [activeTab, setActiveTab] = useState<'appearance' | 'branding'>('appearance');
  const [saved, setSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(theme.branding.logo);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setColors({ [key]: value });
  };

  const handlePresetTheme = (colors: ThemeColors) => {
    setColors(colors);
  };

  const handleBrandingChange = (key: keyof BrandingConfig, value: string) => {
    setBranding({ [key]: value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setLogoPreview(result);
        setBranding({ logo: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setBranding({ logo: null });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            Settings
          </h1>
          <p className="text-slate-400 mt-1">Configure appearance, branding, and portal settings</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm">
            <Save className="w-4 h-4" />
            Settings saved
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'appearance'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Appearance
            </span>
          </button>
          <button
            onClick={() => setActiveTab('branding')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'branding'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Branding & White Labeling
              <Shield className="w-3 h-3 text-amber-400" />
            </span>
          </button>
        </nav>
      </div>

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Theme Mode */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Theme Mode</h3>
            <div className="flex gap-4">
              <button
                onClick={() => { if (!isDarkMode) toggleDarkMode(); }}
                className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  isDarkMode
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                }`}
              >
                <Moon className="w-5 h-5" />
                <span className="font-medium">Dark Mode</span>
              </button>
              <button
                onClick={() => { if (isDarkMode) toggleDarkMode(); }}
                className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  !isDarkMode
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                }`}
              >
                <Sun className="w-5 h-5" />
                <span className="font-medium">Light Mode</span>
              </button>
            </div>
          </div>

          {/* Custom Colors */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Custom Colors</h3>
              <button
                onClick={resetTheme}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>
            <div className="space-y-3">
              <ColorInput label="Primary" value={theme.colors.primary} onChange={v => handleColorChange('primary', v)} />
              <ColorInput label="Primary Light" value={theme.colors.primaryLight} onChange={v => handleColorChange('primaryLight', v)} />
              <ColorInput label="Primary Dark" value={theme.colors.primaryDark} onChange={v => handleColorChange('primaryDark', v)} />
              <ColorInput label="Accent" value={theme.colors.accent} onChange={v => handleColorChange('accent', v)} />
              <ColorInput label="Sidebar" value={theme.colors.sidebar} onChange={v => handleColorChange('sidebar', v)} />
              <ColorInput label="Header" value={theme.colors.header} onChange={v => handleColorChange('header', v)} />
            </div>
          </div>

          {/* Dark Presets */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Dark Presets</h3>
            <div className="grid grid-cols-2 gap-3">
              {presetThemes.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetTheme(preset.colors)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 transition-colors"
                >
                  <div className="flex -space-x-1">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-800" style={{ background: preset.colors.primary }} />
                    <div className="w-5 h-5 rounded-full border-2 border-slate-800" style={{ background: preset.colors.accent }} />
                    <div className="w-5 h-5 rounded-full border-2 border-slate-800" style={{ background: preset.colors.sidebar }} />
                  </div>
                  <span className="text-sm text-slate-300">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Light Presets */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Light Presets</h3>
            <div className="grid grid-cols-1 gap-3">
              {lightThemes.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => { handlePresetTheme(preset.colors); if (isDarkMode) toggleDarkMode(); }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 transition-colors"
                >
                  <div className="flex -space-x-1">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-800" style={{ background: preset.colors.primary }} />
                    <div className="w-5 h-5 rounded-full border-2 border-slate-800" style={{ background: preset.colors.accent }} />
                    <div className="w-5 h-5 rounded-full border-2 border-slate-800" style={{ background: preset.colors.sidebar }} />
                  </div>
                  <span className="text-sm text-slate-300">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2 bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Live Preview</h3>
            <div className="rounded-xl overflow-hidden border border-slate-600">
              <div className="h-10 flex items-center px-4" style={{ background: theme.colors.header }}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded" style={{ background: theme.colors.primary }} />
                  <span className="text-xs font-medium text-white">{theme.branding.portalName}</span>
                </div>
                <div className="ml-auto flex gap-2">
                  <div className="w-16 h-4 rounded bg-white/10" />
                  <div className="w-4 h-4 rounded-full bg-white/10" />
                </div>
              </div>
              <div className="flex">
                <div className="w-16 p-2 space-y-2" style={{ background: theme.colors.sidebar }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-full h-4 rounded" style={{ background: i === 1 ? `${theme.colors.primary}40` : 'transparent' }} />
                  ))}
                </div>
                <div className="flex-1 p-4 bg-slate-900">
                  <div className="flex gap-2 mb-3">
                    <div className="px-3 py-1 rounded text-xs text-white font-medium" style={{ background: theme.colors.primary }}>Button</div>
                    <div className="px-3 py-1 rounded text-xs text-white font-medium" style={{ background: theme.colors.accent }}>Accent</div>
                    <div className="px-3 py-1 rounded text-xs border border-slate-600 text-slate-300">Outline</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-12 rounded bg-slate-800 border border-slate-700" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Super Admin Notice */}
          <div className="lg:col-span-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 font-medium text-sm">Super Admin Only</p>
              <p className="text-amber-300/70 text-sm mt-1">
                Branding and white labeling settings are restricted to Super Admins. Changes will apply globally to all users.
              </p>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Image className="w-5 h-5" />
              Company Logo
            </h3>
            <div className="space-y-4">
              {logoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="max-h-20 max-w-[200px] rounded-lg bg-slate-700 p-2"
                  />
                  <button
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-slate-500 hover:bg-slate-700/30 transition-colors"
                >
                  <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Click to upload logo</p>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG, SVG up to 2MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <div>
                <label className="block text-sm text-slate-400 mb-1">Or paste logo URL</label>
                <input
                  type="text"
                  value={theme.branding.logoUrl}
                  onChange={e => handleBrandingChange('logoUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Company Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Company Name</label>
                <input
                  type="text"
                  value={theme.branding.companyName}
                  onChange={e => handleBrandingChange('companyName', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Portal Name</label>
                <input
                  type="text"
                  value={theme.branding.portalName}
                  onChange={e => handleBrandingChange('portalName', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Tagline</label>
                <input
                  type="text"
                  value={theme.branding.tagline}
                  onChange={e => handleBrandingChange('tagline', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Text Customization */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Type className="w-5 h-5" />
              Text & Footer
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Login Page Title</label>
                <input
                  type="text"
                  value={theme.branding.portalName}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-400 text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">Uses Portal Name above</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Powered By Text</label>
                <input
                  type="text"
                  value={theme.branding.poweredByText}
                  onChange={e => handleBrandingChange('poweredByText', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Footer Text</label>
                <input
                  type="text"
                  value={theme.branding.footerText}
                  onChange={e => handleBrandingChange('footerText', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Favicon URL</label>
                <input
                  type="text"
                  value={theme.branding.favicon}
                  onChange={e => handleBrandingChange('favicon', e.target.value)}
                  placeholder="/favicon.ico"
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Reset & Actions */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => { resetBranding(); setLogoPreview(null); showSaved(); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Branding to Default
              </button>
              <button
                onClick={() => { resetTheme(); showSaved(); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
              >
                <Palette className="w-4 h-4" />
                Reset Theme to Default
              </button>
              <button
                onClick={() => { localStorage.clear(); window.location.reload(); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-colors"
              >
                <X className="w-4 h-4" />
                Clear All Saved Settings
              </button>
            </div>
          </div>

          {/* Login Preview */}
          <div className="lg:col-span-2 bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Login Page Preview
            </h3>
            <div className="rounded-xl overflow-hidden border border-slate-600 bg-gradient-to-br from-slate-900 to-slate-800 max-w-sm mx-auto">
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: `${theme.colors.primary}20` }}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-12 h-12 object-contain" />
                  ) : (
                    <Shield className="w-8 h-8" style={{ color: theme.colors.primary }} />
                  )}
                </div>
                <h2 className="text-lg font-bold text-white">{theme.branding.portalName}</h2>
                <p className="text-xs text-slate-400 mt-1">{theme.branding.companyName} {theme.branding.tagline}</p>
                <div className="mt-6 space-y-3">
                  <div className="h-9 rounded-lg bg-slate-700/50 border border-slate-600" />
                  <div className="h-9 rounded-lg bg-slate-700/50 border border-slate-600" />
                  <div className="h-9 rounded-lg text-white text-sm font-medium flex items-center justify-center" style={{ background: theme.colors.primary }}>
                    Sign In
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-4">{theme.branding.poweredByText}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
