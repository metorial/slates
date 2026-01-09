import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminClient } from './client';

// Tenant hooks
export let useTenants = () =>
  useQuery({
    queryKey: ['tenants'],
    queryFn: () => adminClient.tenant.list({})
  });

export let useTenant = (tenantId: string) =>
  useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => adminClient.tenant.get({ tenantId }),
    enabled: !!tenantId
  });

export let useCreateTenant = () => {
  let queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; identifier: string }) => adminClient.tenant.upsert(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants'] })
  });
};

// Sub-registry hooks
export let useSubRegistries = (tenantId: string | undefined) =>
  useQuery({
    queryKey: ['subRegistries', tenantId],
    queryFn: () => adminClient.subRegistry.list({ tenantId: tenantId! }),
    enabled: !!tenantId
  });

export let useSubRegistry = (tenantId: string | undefined, subRegistryId: string) =>
  useQuery({
    queryKey: ['subRegistry', tenantId, subRegistryId],
    queryFn: () => adminClient.subRegistry.get({ tenantId: tenantId!, subRegistryId }),
    enabled: !!tenantId && !!subRegistryId
  });

export let useCreateSubRegistry = () => {
  let queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tenantId: string; name: string; identifier: string }) =>
      adminClient.subRegistry.create(data),
    onSuccess: (_, vars) =>
      queryClient.invalidateQueries({ queryKey: ['subRegistries', vars.tenantId] })
  });
};

// Workspace hooks
export let useWorkspaces = (tenantId: string | undefined) =>
  useQuery({
    queryKey: ['workspaces', tenantId],
    queryFn: () => adminClient.workspace.list({ tenantId: tenantId! }),
    enabled: !!tenantId
  });

export let useWorkspace = (tenantId: string | undefined, workspaceId: string) =>
  useQuery({
    queryKey: ['workspace', tenantId, workspaceId],
    queryFn: () => adminClient.workspace.get({ tenantId: tenantId!, workspaceId }),
    enabled: !!tenantId && !!workspaceId
  });

export let useUpdateWorkspace = () => {
  let queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      tenantId: string;
      workspaceId: string;
      name?: string;
      description?: string;
    }) => adminClient.workspace.update(data),
    onSuccess: (_, vars) =>
      queryClient.invalidateQueries({ queryKey: ['workspaces', vars.tenantId] })
  });
};

// Slate hooks
export let useSlates = (tenantId: string | undefined) =>
  useQuery({
    queryKey: ['slates', tenantId],
    queryFn: () => adminClient.slate.list({ tenantId: tenantId! }),
    enabled: !!tenantId
  });

export let useSlate = (tenantId: string | undefined, slateId: string) =>
  useQuery({
    queryKey: ['slate', tenantId, slateId],
    queryFn: () => adminClient.slate.get({ tenantId: tenantId!, slateId }),
    enabled: !!tenantId && !!slateId
  });

export let useSlateVersions = (tenantId: string | undefined, slateId: string) =>
  useQuery({
    queryKey: ['slateVersions', tenantId, slateId],
    queryFn: () => adminClient.slate.version.list({ tenantId: tenantId!, slateId }),
    enabled: !!tenantId && !!slateId
  });

export let usePublishSlate = () => {
  let queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      tenantId: string;
      slateId: string;
      scopeIdentifier: string;
      slateIdentifier: string;
      contentBase64: string;
      access: 'public' | 'private';
    }) => adminClient.slate.version.create(data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['slates', vars.tenantId] });
      queryClient.invalidateQueries({ queryKey: ['slateVersions', vars.tenantId, vars.slateId] });
    }
  });
};

// User hooks
export let useUsers = (tenantId: string | undefined) =>
  useQuery({
    queryKey: ['users', tenantId],
    queryFn: () => adminClient.user.list({ tenantId: tenantId! }),
    enabled: !!tenantId
  });

export let useCreateUser = () => {
  let queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tenantId: string; name: string; identifier: string }) =>
      adminClient.user.create(data),
    onSuccess: (_, vars) => queryClient.invalidateQueries({ queryKey: ['users', vars.tenantId] })
  });
};

// Tenant update hook
export let useUpdateTenant = () => {
  let queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tenantId: string; name?: string }) => adminClient.tenant.update(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants'] })
  });
};

// Workspace create hook
export let useCreateWorkspace = () => {
  let queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tenantId: string; name: string; identifier: string }) =>
      adminClient.workspace.create(data),
    onSuccess: (_, vars) => queryClient.invalidateQueries({ queryKey: ['workspaces', vars.tenantId] })
  });
};

// SubRegistry filter hooks
export let useSetSubRegistryFilters = () => {
  let queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      tenantId: string;
      subRegistryId: string;
      filters: Array<{ type: 'scope_type' | 'prefix' | 'package'; value: string }>;
    }) => adminClient.subRegistry.setFilters(data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['subRegistries', vars.tenantId] });
      queryClient.invalidateQueries({ queryKey: ['subRegistry', vars.tenantId, vars.subRegistryId] });
    }
  });
};

export let useAddSubRegistryFilter = () => {
  let queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      tenantId: string;
      subRegistryId: string;
      type: 'scope_type' | 'prefix' | 'package';
      value: string;
    }) => adminClient.subRegistry.addFilter(data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['subRegistries', vars.tenantId] });
      queryClient.invalidateQueries({ queryKey: ['subRegistry', vars.tenantId, vars.subRegistryId] });
    }
  });
};

export let useRemoveSubRegistryFilter = () => {
  let queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tenantId: string; subRegistryId: string; filterId: string }) =>
      adminClient.subRegistry.removeFilter(data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['subRegistries', vars.tenantId] });
      queryClient.invalidateQueries({ queryKey: ['subRegistry', vars.tenantId, vars.subRegistryId] });
    }
  });
};
