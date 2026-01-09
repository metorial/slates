import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SlateDetail } from './pages/slates/SlateDetail';
import { SlateList } from './pages/slates/SlateList';
import { SlatePublish } from './pages/slates/SlatePublish';
import { SubRegistryCreate } from './pages/sub-registries/SubRegistryCreate';
import { SubRegistryDetail } from './pages/sub-registries/SubRegistryDetail';
import { SubRegistryList } from './pages/sub-registries/SubRegistryList';
import { TenantCreate } from './pages/tenants/TenantCreate';
import { TenantDetail } from './pages/tenants/TenantDetail';
import { TenantList } from './pages/tenants/TenantList';
import { WorkspaceCreate } from './pages/workspaces/WorkspaceCreate';
import { WorkspaceEdit } from './pages/workspaces/WorkspaceEdit';
import { WorkspaceList } from './pages/workspaces/WorkspaceList';

export let App = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/tenants" replace />} />

        {/* Tenants (global) */}
        <Route path="/tenants" element={<TenantList />} />
        <Route path="/tenants/new" element={<TenantCreate />} />
        <Route path="/tenants/:tenantId" element={<TenantDetail />} />

        {/* Sub-registries (tenant-scoped) */}
        <Route path="/sub-registries" element={<SubRegistryList />} />
        <Route path="/sub-registries/new" element={<SubRegistryCreate />} />
        <Route path="/sub-registries/:subRegistryId" element={<SubRegistryDetail />} />

        {/* Workspaces (tenant-scoped) */}
        <Route path="/workspaces" element={<WorkspaceList />} />
        <Route path="/workspaces/new" element={<WorkspaceCreate />} />
        <Route path="/workspaces/:workspaceId/edit" element={<WorkspaceEdit />} />

        {/* Slates (tenant-scoped) */}
        <Route path="/slates" element={<SlateList />} />
        <Route path="/slates/:slateId" element={<SlateDetail />} />
        <Route path="/slates/:slateId/publish" element={<SlatePublish />} />
      </Route>
    </Routes>
  );
}
