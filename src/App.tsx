import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataSourceProvider } from './context/DataSourceContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/Dashboard';
import { TenantSearchPage } from './pages/TenantSearch';
import { TenantDetailPage } from './pages/TenantDetail';
import { CreateTenantPage } from './pages/CreateTenant';
import { DIDManagementPage } from './pages/DIDManagement';
import { AuditLogPage } from './pages/AuditLog';
import DataSources from './pages/DataSources';
import { UsersPage } from './pages/Users';
import Settings from './pages/Settings';

export default function App() {
  return (
    <ThemeProvider>
      <DataSourceProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/tenants" element={<TenantSearchPage />} />
              <Route path="/tenants/create" element={<CreateTenantPage />} />
              <Route path="/tenants/:tenantId" element={<TenantDetailPage />} />
              <Route path="/dids" element={<DIDManagementPage />} />
              <Route path="/audit" element={<AuditLogPage />} />
              <Route path="/data-sources" element={<DataSources />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </DataSourceProvider>
    </ThemeProvider>
  );
}
