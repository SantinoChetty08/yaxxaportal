import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DataSource, DataSourceStatus, DataSourceTestResult } from '../types';

interface DataSourceContextType {
  dataSources: DataSource[];
  activeDataSource: DataSource | null;
  setActiveDataSource: (ds: DataSource) => void;
  addDataSource: (ds: Omit<DataSource, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  updateDataSource: (id: string, ds: Partial<DataSource>) => void;
  deleteDataSource: (id: string) => void;
  testConnection: (ds: DataSource) => Promise<DataSourceTestResult>;
  isUsingMockData: boolean;
  connectionStatus: DataSourceStatus;
}

const DataSourceContext = createContext<DataSourceContextType | undefined>(undefined);

const STORAGE_KEY = 'tenant-portal-data-sources';

// Default mock data source
const mockDataSource: DataSource = {
  id: 'mock-default',
  name: 'Mock Data (Built-in)',
  type: 'mock',
  description: 'Built-in mock data for testing and development',
  auth: { type: 'none' },
  endpoints: [],
  isActive: true,
  status: 'connected',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Example API data source template
const exampleApiSource: DataSource = {
  id: 'example-api',
  name: 'HoduCC Portal API',
  type: 'rest_api',
  description: 'Connect to your Django/DRF backend API',
  baseUrl: 'http://localhost:8000/api/v1',
  auth: {
    type: 'bearer',
    token: '',
  },
  endpoints: [
    { id: '1', name: 'Dashboard Summary', path: '/dashboard/summary/', method: 'GET', description: 'Get KPI summary', entity: 'dashboard', isEnabled: true },
    { id: '2', name: 'List Tenants', path: '/tenants/', method: 'GET', description: 'Search/list tenants', entity: 'tenants', isEnabled: true },
    { id: '3', name: 'Get Tenant', path: '/tenants/{tenant_id}/', method: 'GET', description: 'Get tenant details', entity: 'tenants', isEnabled: true },
    { id: '4', name: 'Create Tenant', path: '/tenants/', method: 'POST', description: 'Create new tenant', entity: 'tenants', isEnabled: true },
    { id: '5', name: 'List DIDs', path: '/dids/', method: 'GET', description: 'Search/list DIDs', entity: 'dids', isEnabled: true },
    { id: '6', name: 'Assign DID', path: '/dids/assign/', method: 'POST', description: 'Assign DID to tenant', entity: 'dids', isEnabled: true },
    { id: '7', name: 'Unassign DID', path: '/dids/unassign/', method: 'POST', description: 'Unassign DID from tenant', entity: 'dids', isEnabled: true },
    { id: '8', name: 'Audit Log', path: '/audit-log/', method: 'GET', description: 'Get audit logs', entity: 'audit', isEnabled: true },
    { id: '9', name: 'Tenant Notes', path: '/tenants/{tenant_id}/notes/', method: 'GET', description: 'Get tenant notes', entity: 'tenants', isEnabled: true },
  ],
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  retryAttempts: 3,
  isActive: false,
  status: 'disconnected',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Example Direct DB connection template
const exampleDbSource: DataSource = {
  id: 'example-db',
  name: 'HoduCC Slave DB',
  type: 'database',
  description: 'Direct read-only connection to HoduCC PostgreSQL slave database',
  auth: { type: 'none' },
  endpoints: [],
  database: {
    type: 'postgresql',
    host: '10.0.0.100',
    port: 5432,
    database: 'hoducc_slave',
    username: 'portal_reader',
    password: '',
    ssl: true,
    schema: 'public',
    readOnly: true,
  },
  isActive: false,
  status: 'disconnected',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function DataSourceProvider({ children }: { children: React.ReactNode }) {
  const [dataSources, setDataSources] = useState<DataSource[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return [mockDataSource, ...parsed];
      } catch {
        return [mockDataSource, exampleApiSource, exampleDbSource];
      }
    }
    return [mockDataSource, exampleApiSource, exampleDbSource];
  });

  const [activeDataSource, setActiveDataSourceState] = useState<DataSource>(() => {
    const stored = localStorage.getItem(STORAGE_KEY + '-active');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return mockDataSource;
      }
    }
    return mockDataSource;
  });

  // Persist to localStorage
  useEffect(() => {
    const toStore = dataSources.filter(ds => ds.id !== 'mock-default');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  }, [dataSources]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '-active', JSON.stringify(activeDataSource));
  }, [activeDataSource]);

  const setActiveDataSource = useCallback((ds: DataSource) => {
    setActiveDataSourceState(ds);
    setDataSources(prev => prev.map(d => ({
      ...d,
      isActive: d.id === ds.id,
    })));
  }, []);

  const addDataSource = useCallback((ds: Omit<DataSource, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const newDs: DataSource = {
      ...ds,
      id: `ds-${Date.now()}`,
      status: 'disconnected',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDataSources(prev => [...prev, newDs]);
  }, []);

  const updateDataSource = useCallback((id: string, updates: Partial<DataSource>) => {
    setDataSources(prev => prev.map(ds => 
      ds.id === id 
        ? { ...ds, ...updates, updatedAt: new Date().toISOString() }
        : ds
    ));
    if (activeDataSource.id === id) {
      setActiveDataSourceState(prev => ({ ...prev, ...updates, updatedAt: new Date().toISOString() }));
    }
  }, [activeDataSource.id]);

  const deleteDataSource = useCallback((id: string) => {
    if (id === 'mock-default') return; // Can't delete mock
    setDataSources(prev => prev.filter(ds => ds.id !== id));
    if (activeDataSource.id === id) {
      setActiveDataSourceState(mockDataSource);
    }
  }, [activeDataSource.id]);

  const testConnection = useCallback(async (ds: DataSource): Promise<DataSourceTestResult> => {
    const startTime = Date.now();
    
    if (ds.type === 'mock') {
      return {
        success: true,
        message: 'Mock data source is always available',
        latency: 0,
        timestamp: new Date().toISOString(),
      };
    }

    if (ds.type === 'rest_api' || ds.type === 'graphql') {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), ds.timeout || 10000);

        const headers: Record<string, string> = { ...ds.headers };
        
        // Add auth headers
        if (ds.auth.type === 'bearer' && ds.auth.token) {
          headers['Authorization'] = `Bearer ${ds.auth.token}`;
        } else if (ds.auth.type === 'basic' && ds.auth.username && ds.auth.password) {
          headers['Authorization'] = `Basic ${btoa(`${ds.auth.username}:${ds.auth.password}`)}`;
        } else if (ds.auth.type === 'api_key' && ds.auth.apiKey && ds.auth.apiKeyHeader) {
          headers[ds.auth.apiKeyHeader] = ds.auth.apiKey;
        }

        // Try to hit the base URL or first enabled endpoint
        const testUrl = ds.baseUrl || '';
        const response = await fetch(testUrl, {
          method: 'GET',
          headers,
          signal: controller.signal,
          mode: 'cors',
        });

        clearTimeout(timeout);
        const latency = Date.now() - startTime;

        if (response.ok || response.status === 401 || response.status === 403) {
          // 401/403 means server is reachable but auth might be needed
          return {
            success: true,
            message: response.ok 
              ? 'Connection successful' 
              : `Server reachable (HTTP ${response.status} - check authentication)`,
            latency,
            timestamp: new Date().toISOString(),
            details: { status: response.status, statusText: response.statusText },
          };
        }

        return {
          success: false,
          message: `Server returned HTTP ${response.status}`,
          latency,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        const latency = Date.now() - startTime;
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Connection failed',
          latency,
          timestamp: new Date().toISOString(),
        };
      }
    }

    if (ds.type === 'database') {
      // Database connections require backend proxy - just validate config
      const db = ds.database;
      if (!db?.host || !db?.database || !db?.username) {
        return {
          success: false,
          message: 'Missing required database connection fields',
          timestamp: new Date().toISOString(),
        };
      }
      return {
        success: true,
        message: 'Database configuration valid (actual connection requires backend proxy)',
        timestamp: new Date().toISOString(),
        details: { note: 'Direct DB access from browser is not possible - use backend API' },
      };
    }

    return {
      success: false,
      message: 'Unknown data source type',
      timestamp: new Date().toISOString(),
    };
  }, []);

  const isUsingMockData = activeDataSource.type === 'mock';
  const connectionStatus = activeDataSource.status;

  return (
    <DataSourceContext.Provider value={{
      dataSources,
      activeDataSource,
      setActiveDataSource,
      addDataSource,
      updateDataSource,
      deleteDataSource,
      testConnection,
      isUsingMockData,
      connectionStatus,
    }}>
      {children}
    </DataSourceContext.Provider>
  );
}

export function useDataSource() {
  const context = useContext(DataSourceContext);
  if (!context) {
    throw new Error('useDataSource must be used within a DataSourceProvider');
  }
  return context;
}
