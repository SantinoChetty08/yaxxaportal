import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { AdminRoute, ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { AccessManagementPage } from "@/pages/AccessManagementPage";
import { CreateTenantPage } from "@/pages/CreateTenantPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DidManagementPage } from "@/pages/DidManagementPage";
import { SignInPage } from "@/pages/SignInPage";
import { TenantAuditPage } from "@/pages/TenantAuditPage";
import { TenantCampaignsPage } from "@/pages/TenantCampaignsPage";
import { TenantDetailLayout } from "@/pages/TenantDetailLayout";
import { TenantDidsPage } from "@/pages/TenantDidsPage";
import { TenantIntegrationsPage } from "@/pages/TenantIntegrationsPage";
import { TenantLicensingPage } from "@/pages/TenantLicensingPage";
import { TenantListPage } from "@/pages/TenantListPage";
import { TenantOverviewPage } from "@/pages/TenantOverviewPage";
import { TenantUsersPage } from "@/pages/TenantUsersPage";

export default function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tenants" element={<TenantListPage />} />
          <Route path="/tenants/:id" element={<TenantDetailLayout />}>
            <Route index element={<TenantOverviewPage />} />
            <Route path="users" element={<TenantUsersPage />} />
            <Route path="campaigns" element={<TenantCampaignsPage />} />
            <Route path="dids" element={<TenantDidsPage />} />
            <Route path="licensing" element={<TenantLicensingPage />} />
            <Route path="integrations" element={<TenantIntegrationsPage />} />
            <Route path="audit" element={<TenantAuditPage />} />
          </Route>
          <Route path="/dids" element={<DidManagementPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/tenants/new" element={<CreateTenantPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/access" element={<AccessManagementPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/sign-in" replace />} />
    </Routes>
  );
}
