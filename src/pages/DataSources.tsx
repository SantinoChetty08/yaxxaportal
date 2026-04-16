import React, { useState } from 'react';
import { 
  Database, 
  Globe, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Server,
  Zap,
  Settings,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';
import { useDataSource } from '../context/DataSourceContext';
import { DataSource, DataSourceType, DataSourceAuth, DataSourceEndpoint } from '../types';
import { Card, Badge, Button, Input, Select } from '../components/UI';

// Default endpoints for new REST API sources
const defaultEndpoints: DataSourceEndpoint[] = [
  { id: '1', name: 'Dashboard Summary', path: '/dashboard/summary/', method: 'GET', description: 'Get KPI summary', entity: 'dashboard', isEnabled: true },
  { id: '2', name: 'List Tenants', path: '/tenants/', method: 'GET', description: 'Search/list tenants', entity: 'tenants', isEnabled: true },
  { id: '3', name: 'Get Tenant', path: '/tenants/{tenant_id}/', method: 'GET', description: 'Get tenant details', entity: 'tenants', isEnabled: true },
  { id: '4', name: 'Create Tenant', path: '/tenants/', method: 'POST', description: 'Create new tenant', entity: 'tenants', isEnabled: true },
  { id: '5', name: 'List DIDs', path: '/dids/', method: 'GET', description: 'Search/list DIDs', entity: 'dids', isEnabled: true },
  { id: '6', name: 'Assign DID', path: '/dids/assign/', method: 'POST', description: 'Assign DID to tenant', entity: 'dids', isEnabled: true },
  { id: '7', name: 'Unassign DID', path: '/dids/unassign/', method: 'POST', description: 'Unassign DID from tenant', entity: 'dids', isEnabled: true },
  { id: '8', name: 'Audit Log', path: '/audit-log/', method: 'GET', description: 'Get audit logs', entity: 'audit', isEnabled: true },
];

interface DataSourceFormProps {
  initial?: Partial<DataSource>;
  onSave: (ds: Omit<DataSource, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  onCancel: () => void;
}

function DataSourceForm({ initial, onSave, onCancel }: DataSourceFormProps) {
  const [name, setName] = useState(initial?.name || '');
  const [type, setType] = useState<DataSourceType>(initial?.type || 'rest_api');
  const [description, setDescription] = useState(initial?.description || '');
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl || '');
  const [auth, setAuth] = useState<DataSourceAuth>(initial?.auth || { type: 'none' });
  const [headers, setHeaders] = useState(initial?.headers ? Object.entries(initial.headers).map(([k, v]) => `${k}: ${v}`).join('\n') : 'Content-Type: application/json');
  const [timeout, setTimeoutVal] = useState(initial?.timeout || 30000);
  const [endpoints, setEndpoints] = useState<DataSourceEndpoint[]>(initial?.endpoints || defaultEndpoints);
  
  // Database fields
  const [dbType, setDbType] = useState<'postgresql' | 'mysql' | 'mssql'>(initial?.database?.type || 'postgresql');
  const [dbHost, setDbHost] = useState(initial?.database?.host || '');
  const [dbPort, setDbPort] = useState(initial?.database?.port || 5432);
  const [dbName, setDbName] = useState(initial?.database?.database || '');
  const [dbUser, setDbUser] = useState(initial?.database?.username || '');
  const [dbPass, setDbPass] = useState(initial?.database?.password || '');
  const [dbSsl, setDbSsl] = useState(initial?.database?.ssl ?? true);
  const [dbSchema, setDbSchema] = useState(initial?.database?.schema || 'public');

  const [showEndpoints, setShowEndpoints] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedHeaders: Record<string, string> = {};
    headers.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length) {
        parsedHeaders[key.trim()] = valueParts.join(':').trim();
      }
    });

    onSave({
      name,
      type,
      description,
      baseUrl: type !== 'database' ? baseUrl : undefined,
      auth,
      headers: parsedHeaders,
      timeout,
      endpoints: type === 'rest_api' ? endpoints : [],
      database: type === 'database' ? {
        type: dbType,
        host: dbHost,
        port: dbPort,
        database: dbName,
        username: dbUser,
        password: dbPass,
        ssl: dbSsl,
        schema: dbSchema,
        readOnly: true,
      } : undefined,
      isActive: initial?.isActive ?? false,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Basic Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data Source Name *
            </label>
            <Input
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="e.g., HoduCC Production API"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type *
            </label>
            <Select
              value={type}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value as DataSourceType)}
              options={[
                { value: 'rest_api', label: 'REST API' },
                { value: 'graphql', label: 'GraphQL API' },
                { value: 'database', label: 'Database (via Backend Proxy)' },
                { value: 'mock', label: 'Mock Data' },
              ]}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <Input
            value={description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            placeholder="Brief description of this data source"
          />
        </div>
      </div>

      {/* API Configuration */}
      {(type === 'rest_api' || type === 'graphql') && (
        <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5" />
            API Configuration
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Base URL *
            </label>
            <Input
              value={baseUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              The base URL for all API requests (e.g., your Django backend)
            </p>
          </div>

          {/* Authentication */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Authentication
            </label>
            <Select
              value={auth.type}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAuth({ ...auth, type: e.target.value as DataSourceAuth['type'] })}
              options={[
                { value: 'none', label: 'No Authentication' },
                { value: 'bearer', label: 'Bearer Token (JWT)' },
                { value: 'basic', label: 'Basic Auth' },
                { value: 'api_key', label: 'API Key' },
              ]}
            />
          </div>

          {auth.type === 'bearer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bearer Token
              </label>
              <Input
                type="password"
                value={auth.token || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuth({ ...auth, token: e.target.value })}
                placeholder="eyJhbGciOiJIUzI1NiIs..."
              />
            </div>
          )}

          {auth.type === 'basic' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <Input
                  value={auth.username || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuth({ ...auth, username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <Input
                  type="password"
                  value={auth.password || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuth({ ...auth, password: e.target.value })}
                />
              </div>
            </div>
          )}

          {auth.type === 'api_key' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Header Name
                </label>
                <Input
                  value={auth.apiKeyHeader || 'X-API-Key'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuth({ ...auth, apiKeyHeader: e.target.value })}
                  placeholder="X-API-Key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <Input
                  type="password"
                  value={auth.apiKey || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuth({ ...auth, apiKey: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Headers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Custom Headers (one per line, format: Header: Value)
            </label>
            <textarea
              value={headers}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setHeaders(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-mono"
              placeholder="Content-Type: application/json&#10;Accept: application/json"
            />
          </div>

          {/* Endpoints */}
          <div>
            <button
              type="button"
              onClick={() => setShowEndpoints(!showEndpoints)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              {showEndpoints ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              API Endpoints ({endpoints.filter(e => e.isEnabled).length} enabled)
            </button>
            
            {showEndpoints && (
              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {endpoints.map((ep, idx) => (
                  <div key={ep.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <input
                      type="checkbox"
                      checked={ep.isEnabled}
                      onChange={() => {
                        const updated = [...endpoints];
                        updated[idx] = { ...ep, isEnabled: !ep.isEnabled };
                        setEndpoints(updated);
                      }}
                      className="rounded border-gray-300"
                    />
                    <Badge variant={ep.method === 'GET' ? 'info' : ep.method === 'POST' ? 'success' : 'warning'}>
                      {ep.method}
                    </Badge>
                    <code className="text-sm text-gray-700 dark:text-gray-300 flex-1">{ep.path}</code>
                    <span className="text-xs text-gray-500">{ep.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Database Configuration */}
      {type === 'database' && (
        <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Configuration
          </h3>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium">Backend Proxy Required</p>
                <p className="mt-1">Direct database access from the browser is not possible. This configuration will be used by your backend API to establish the connection.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Database Type
              </label>
              <Select
                value={dbType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDbType(e.target.value as 'postgresql' | 'mysql' | 'mssql')}
                options={[
                  { value: 'postgresql', label: 'PostgreSQL' },
                  { value: 'mysql', label: 'MySQL' },
                  { value: 'mssql', label: 'SQL Server' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Host *
              </label>
              <Input
                value={dbHost}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDbHost(e.target.value)}
                placeholder="10.0.0.100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Port
              </label>
              <Input
                type="number"
                value={dbPort}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDbPort(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Database Name *
              </label>
              <Input
                value={dbName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDbName(e.target.value)}
                placeholder="hoducc_slave"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Schema
              </label>
              <Input
                value={dbSchema}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDbSchema(e.target.value)}
                placeholder="public"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username *
              </label>
              <Input
                value={dbUser}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDbUser(e.target.value)}
                placeholder="portal_reader"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <Input
                type="password"
                value={dbPass}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDbPass(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={dbSsl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDbSsl(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Use SSL/TLS</span>
            </label>
          </div>
        </div>
      )}

      {/* Timeout */}
      {(type === 'rest_api' || type === 'graphql') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Request Timeout (ms)
          </label>
          <Input
            type="number"
            value={timeout}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimeoutVal(parseInt(e.target.value))}
            placeholder="30000"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {initial?.id ? 'Update Data Source' : 'Add Data Source'}
        </Button>
      </div>
    </form>
  );
}

export default function DataSources() {
  const { 
    dataSources, 
    activeDataSource, 
    setActiveDataSource, 
    addDataSource, 
    updateDataSource, 
    deleteDataSource,
    testConnection 
  } = useDataSource();
  
  const [showForm, setShowForm] = useState(false);
  const [editingSource, setEditingSource] = useState<DataSource | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; latency?: number }>>({});

  const handleTest = async (ds: DataSource) => {
    setTesting(ds.id);
    const result = await testConnection(ds);
    setTestResults(prev => ({ ...prev, [ds.id]: result }));
    setTesting(null);
    
    // Update status
    updateDataSource(ds.id, { 
      status: result.success ? 'connected' : 'error',
      lastTested: result.timestamp,
      lastError: result.success ? undefined : result.message,
    });
  };

  const handleActivate = (ds: DataSource) => {
    setActiveDataSource(ds);
  };

  const handleDelete = (ds: DataSource) => {
    if (ds.id === 'mock-default') return;
    if (confirm(`Delete "${ds.name}"? This cannot be undone.`)) {
      deleteDataSource(ds.id);
    }
  };

  const getTypeIcon = (type: DataSourceType) => {
    switch (type) {
      case 'rest_api': return <Globe className="w-5 h-5" />;
      case 'graphql': return <Zap className="w-5 h-5" />;
      case 'database': return <Database className="w-5 h-5" />;
      case 'mock': return <Server className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: DataSourceType) => {
    switch (type) {
      case 'rest_api': return 'REST API';
      case 'graphql': return 'GraphQL';
      case 'database': return 'Database';
      case 'mock': return 'Mock Data';
    }
  };

  const getStatusBadge = (ds: DataSource) => {
    if (testing === ds.id) {
      return <Badge variant="warning"><RefreshCw className="w-3 h-3 animate-spin mr-1" /> Testing...</Badge>;
    }
    if (ds.status === 'connected') {
      return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" /> Connected</Badge>;
    }
    if (ds.status === 'error') {
      return <Badge variant="danger"><XCircle className="w-3 h-3 mr-1" /> Error</Badge>;
    }
    return <Badge variant="default">Not Tested</Badge>;
  };

  if (!activeDataSource) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Sources</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Configure connections to your backend APIs and databases
          </p>
        </div>
        <Button variant="primary" onClick={() => { setEditingSource(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Data Source
        </Button>
      </div>

      {/* Active Source Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-300">
              {getTypeIcon(activeDataSource.type)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Active Data Source</span>
                {getStatusBadge(activeDataSource)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{activeDataSource.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activeDataSource.type === 'mock' 
                  ? 'Using built-in mock data for testing' 
                  : activeDataSource.baseUrl || 'Database connection'}
              </p>
            </div>
          </div>
          <Button 
            variant="secondary" 
            onClick={() => handleTest(activeDataSource)}
            disabled={testing === activeDataSource.id}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${testing === activeDataSource.id ? 'animate-spin' : ''}`} />
            Test Connection
          </Button>
        </div>
      </Card>

      {/* Data Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dataSources.map(ds => (
          <Card 
            key={ds.id} 
            className={`relative ${ds.id === activeDataSource.id ? 'ring-2 ring-blue-500' : ''}`}
          >
            {ds.id === activeDataSource.id && (
              <div className="absolute top-3 right-3">
                <Badge variant="info">Active</Badge>
              </div>
            )}
            
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                ds.type === 'mock' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' :
                ds.status === 'connected' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                ds.status === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                {getTypeIcon(ds.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{ds.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{getTypeLabel(ds.type)}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {ds.description || 'No description'}
            </p>

            {ds.baseUrl && (
              <div className="mb-4">
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-700 dark:text-gray-300 truncate block">
                  {ds.baseUrl}
                </code>
              </div>
            )}

            {ds.database && (
              <div className="mb-4">
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-700 dark:text-gray-300 truncate block">
                  {ds.database.type}://{ds.database.host}:{ds.database.port}/{ds.database.database}
                </code>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              {getStatusBadge(ds)}
              {ds.lastTested && (
                <span className="text-xs text-gray-500">
                  Tested: {new Date(ds.lastTested).toLocaleString()}
                </span>
              )}
            </div>

            {testResults[ds.id] && !testResults[ds.id].success && (
              <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-300">
                {testResults[ds.id].message}
              </div>
            )}

            <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              {ds.id !== activeDataSource.id && (
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => handleActivate(ds)}
                  className="flex-1"
                >
                  Activate
                </Button>
              )}
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => handleTest(ds)}
                disabled={testing === ds.id}
              >
                <RefreshCw className={`w-4 h-4 ${testing === ds.id ? 'animate-spin' : ''}`} />
              </Button>
              {ds.type !== 'mock' && (
                <>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => { setEditingSource(ds); setShowForm(true); }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={() => handleDelete(ds)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Setup Guide */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Setup Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">1</div>
              <h4 className="font-medium text-gray-900 dark:text-white">Build Your Backend</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-10">
              Create a Django/DRF backend following the API spec. The starter code includes all models and endpoints.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">2</div>
              <h4 className="font-medium text-gray-900 dark:text-white">Configure Connection</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-10">
              Add your API endpoint URL and authentication. Test the connection to verify it's working.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">3</div>
              <h4 className="font-medium text-gray-900 dark:text-white">Activate & Go</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-10">
              Set your API as the active data source. The portal will automatically switch from mock to live data.
            </p>
          </div>
        </div>
      </Card>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowForm(false)} />
            <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {editingSource ? 'Edit Data Source' : 'Add New Data Source'}
              </h2>
              <DataSourceForm
                initial={editingSource || undefined}
                onSave={(ds) => {
                  if (editingSource) {
                    updateDataSource(editingSource.id, ds);
                  } else {
                    addDataSource(ds);
                  }
                  setShowForm(false);
                  setEditingSource(null);
                }}
                onCancel={() => {
                  setShowForm(false);
                  setEditingSource(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
