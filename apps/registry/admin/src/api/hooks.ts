import { createLoader } from '@metorial-io/data-hooks';
import { useMemo, useState } from 'react';
import { adminClient } from './client';

export let tenantsLoader = createLoader({
  name: 'tenants',
  fetch: (params: { after?: string; before?: string }) => adminClient.tenant.list(params),
  hash: params => `${params.after ?? ''}:${params.before ?? ''}`,
  mutators: {}
});

export let useTenants = () => {
  let [cursor, setCursor] = useState<{ after?: string; before?: string }>({});

  let loader = tenantsLoader.use(cursor);

  let transformedData = useMemo(() => {
    if (!loader.data) return null;
    return {
      ...loader.data,
      pagination: {
        hasMoreAfter: loader.data.pagination.has_more_after,
        hasMoreBefore: loader.data.pagination.has_more_before
      }
    };
  }, [loader.data]);

  return {
    ...loader,
    data: transformedData,
    next: () => {
      let items = loader.data?.items;
      if (items?.length) {
        setCursor({ after: items[items.length - 1].id });
      }
    },
    previous: () => {
      let items = loader.data?.items;
      if (items?.length) {
        setCursor({ before: items[0].id });
      }
    }
  };
};

export let tenantLoader = createLoader({
  name: 'tenant',
  fetch: (tenantId: string) => adminClient.tenant.get({ tenantId }),
  hash: tenantId => tenantId,
  mutators: {},
  parents: [tenantsLoader]
});

export let useTenant = (tenantId: string) => tenantLoader.use(tenantId || null);

export let useCreateTenant = tenantsLoader.createExternalMutator(
  (data: { name: string; identifier: string }) => adminClient.tenant.upsert(data)
);

export let useUpdateTenant = tenantsLoader.createExternalMutator(
  (data: { tenantId: string; name?: string }) => adminClient.tenant.update(data)
);

export let subRegistriesLoader = createLoader({
  name: 'subRegistries',
  fetch: (params: { tenantId: string; after?: string; before?: string }) =>
    adminClient.subRegistry.list(params),
  hash: params => `${params.tenantId}:${params.after ?? ''}:${params.before ?? ''}`,
  mutators: {}
});

export let useSubRegistries = (tenantId: string | undefined) => {
  let [cursor, setCursor] = useState<{ after?: string; before?: string }>({});

  let loader = subRegistriesLoader.use(tenantId ? { tenantId, ...cursor } : null);

  let transformedData = useMemo(() => {
    if (!loader.data) return null;
    return {
      ...loader.data,
      pagination: {
        hasMoreAfter: loader.data.pagination.has_more_after,
        hasMoreBefore: loader.data.pagination.has_more_before
      }
    };
  }, [loader.data]);

  return {
    ...loader,
    data: transformedData,
    next: () => {
      let items = loader.data?.items;
      if (items?.length) {
        setCursor({ after: items[items.length - 1].id });
      }
    },
    previous: () => {
      let items = loader.data?.items;
      if (items?.length) {
        setCursor({ before: items[0].id });
      }
    }
  };
};

export let subRegistryLoader = createLoader({
  name: 'subRegistry',
  fetch: (params: { tenantId: string; subRegistryId: string }) =>
    adminClient.subRegistry.get(params),
  hash: params => `${params.tenantId}:${params.subRegistryId}`,
  mutators: {},
  parents: [subRegistriesLoader]
});

export let useSubRegistry = (tenantId: string | undefined, subRegistryId: string) =>
  subRegistryLoader.use(tenantId && subRegistryId ? { tenantId, subRegistryId } : null);

export let useCreateSubRegistry = subRegistriesLoader.createExternalMutator(
  (data: { tenantId: string; name: string; identifier: string }) =>
    adminClient.subRegistry.create(data)
);

export let useSetSubRegistryFilters = subRegistryLoader.createExternalMutator(
  (data: {
    tenantId: string;
    subRegistryId: string;
    filters: Array<{ type: 'scope' | 'prefix' | 'package'; value: string }>;
  }) => adminClient.subRegistry.setFilters(data)
);

export let useAddSubRegistryFilter = subRegistryLoader.createExternalMutator(
  (data: {
    tenantId: string;
    subRegistryId: string;
    type: 'scope' | 'prefix' | 'package';
    value: string;
  }) => adminClient.subRegistry.addFilter(data)
);

export let useRemoveSubRegistryFilter = subRegistryLoader.createExternalMutator(
  (data: { tenantId: string; subRegistryId: string; filterId: string }) =>
    adminClient.subRegistry.removeFilter(data)
);

export let workspacesLoader = createLoader({
  name: 'workspaces',
  fetch: (params: { tenantId: string; after?: string; before?: string }) =>
    adminClient.workspace.list(params),
  hash: params => `${params.tenantId}:${params.after ?? ''}:${params.before ?? ''}`,
  mutators: {}
});

export let useWorkspaces = (tenantId: string | undefined) => {
  let [cursor, setCursor] = useState<{ after?: string; before?: string }>({});

  let loader = workspacesLoader.use(tenantId ? { tenantId, ...cursor } : null);

  let transformedData = useMemo(() => {
    if (!loader.data) return null;
    return {
      ...loader.data,
      pagination: {
        hasMoreAfter: loader.data.pagination.has_more_after,
        hasMoreBefore: loader.data.pagination.has_more_before
      }
    };
  }, [loader.data]);

  return {
    ...loader,
    data: transformedData,
    next: () => {
      let items = loader.data?.items;
      if (items?.length) {
        setCursor({ after: items[items.length - 1].id });
      }
    },
    previous: () => {
      let items = loader.data?.items;
      if (items?.length) {
        setCursor({ before: items[0].id });
      }
    }
  };
};

export let workspaceLoader = createLoader({
  name: 'workspace',
  fetch: (params: { tenantId: string; workspaceId: string }) =>
    adminClient.workspace.get(params),
  hash: params => `${params.tenantId}:${params.workspaceId}`,
  mutators: {},
  parents: [workspacesLoader]
});

export let useWorkspace = (tenantId: string | undefined, workspaceId: string) =>
  workspaceLoader.use(tenantId && workspaceId ? { tenantId, workspaceId } : null);

export let useCreateWorkspace = workspacesLoader.createExternalMutator(
  (data: { tenantId: string; name: string; identifier: string; description?: string }) =>
    adminClient.workspace.create(data)
);

export let useUpdateWorkspace = workspaceLoader.createExternalMutator(
  (data: { tenantId: string; workspaceId: string; name?: string; description?: string }) =>
    adminClient.workspace.update(data)
);

export let slatesLoader = createLoader({
  name: 'slates',
  fetch: (params: { tenantId: string; after?: string; before?: string }) =>
    adminClient.slate.list(params),
  hash: params => `${params.tenantId}:${params.after ?? ''}:${params.before ?? ''}`,
  mutators: {}
});

export let useSlates = (tenantId: string | undefined) => {
  let [cursor, setCursor] = useState<{ after?: string; before?: string }>({});

  let loader = slatesLoader.use(tenantId ? { tenantId, ...cursor } : null);

  let transformedData = useMemo(() => {
    if (!loader.data) return null;
    return {
      ...loader.data,
      pagination: {
        hasMoreAfter: loader.data.pagination.has_more_after,
        hasMoreBefore: loader.data.pagination.has_more_before
      }
    };
  }, [loader.data]);

  return {
    ...loader,
    data: transformedData,
    next: () => {
      let items = loader.data?.items;
      if (items?.length) {
        setCursor({ after: items[items.length - 1].id });
      }
    },
    previous: () => {
      let items = loader.data?.items;
      if (items?.length) {
        setCursor({ before: items[0].id });
      }
    }
  };
};

export let slateLoader = createLoader({
  name: 'slate',
  fetch: (params: { tenantId: string; slateId: string }) => adminClient.slate.get(params),
  hash: params => `${params.tenantId}:${params.slateId}`,
  mutators: {},
  parents: [slatesLoader]
});

export let useSlate = (tenantId: string | undefined, slateId: string) =>
  slateLoader.use(tenantId && slateId ? { tenantId, slateId } : null);

export let slateVersionsLoader = createLoader({
  name: 'slateVersions',
  fetch: (params: { tenantId: string; slateId: string; after?: string; before?: string }) =>
    adminClient.slate.version.list(params),
  hash: params => `${params.tenantId}:${params.slateId}:${params.after ?? ''}:${params.before ?? ''}`,
  mutators: {},
  parents: [slateLoader]
});

export let useSlateVersions = (tenantId: string | undefined, slateId: string) => {
  let [cursor, setCursor] = useState<{ after?: string; before?: string }>({});

  let loader = slateVersionsLoader.use(
    tenantId && slateId ? { tenantId, slateId, ...cursor } : null
  );

  let transformedData = useMemo(() => {
    if (!loader.data) return null;
    return {
      ...loader.data,
      pagination: {
        hasMoreAfter: loader.data.pagination.has_more_after,
        hasMoreBefore: loader.data.pagination.has_more_before
      }
    };
  }, [loader.data]);

  return {
    ...loader,
    data: transformedData,
    next: () => {
      let items = loader.data?.items;
      if (items?.length) {
        setCursor({ after: items[items.length - 1].id });
      }
    },
    previous: () => {
      let items = loader.data?.items;
      if (items?.length) {
        setCursor({ before: items[0].id });
      }
    }
  };
};

export let usePublishSlate = slatesLoader.createExternalMutator(
  (data: {
    tenantId: string;
    slateId: string;
    scopeIdentifier: string;
    slateIdentifier: string;
    contentBase64: string;
    access: 'public' | 'private';
  }) => adminClient.slate.version.create(data)
);

export let usersLoader = createLoader({
  name: 'users',
  fetch: (params: { tenantId: string; after?: string; before?: string }) =>
    adminClient.user.list(params),
  hash: params => `${params.tenantId}:${params.after ?? ''}:${params.before ?? ''}`,
  mutators: {}
});

export let useUsers = (tenantId: string | undefined) => {
  let [cursor, setCursor] = useState<{ after?: string; before?: string }>({});

  let loader = usersLoader.use(tenantId ? { tenantId, ...cursor } : null);

  let transformedData = useMemo(() => {
    if (!loader.data) return null;
    return {
      ...loader.data,
      pagination: {
        hasMoreAfter: loader.data.pagination.has_more_after,
        hasMoreBefore: loader.data.pagination.has_more_before
      }
    };
  }, [loader.data]);

  return {
    ...loader,
    data: transformedData,
    next: () => {
      let items = loader.data?.items;
      if (items?.length) {
        setCursor({ after: items[items.length - 1].id });
      }
    },
    previous: () => {
      let items = loader.data?.items;
      if (items?.length) {
        setCursor({ before: items[0].id });
      }
    }
  };
};

export let useCreateUser = usersLoader.createExternalMutator(
  (data: { tenantId: string; name: string; identifier: string }) =>
    adminClient.user.create(data)
);

export let userLoader = createLoader({
  name: 'user',
  fetch: (params: { tenantId: string; userId: string }) => adminClient.user.get(params),
  hash: params => `${params.tenantId}:${params.userId}`,
  mutators: {},
  parents: [usersLoader]
});

export let useUser = (tenantId: string | undefined, userId: string | undefined) =>
  userLoader.use(tenantId && userId ? { tenantId, userId } : null);

export let userTokensLoader = createLoader({
  name: 'userTokens',
  fetch: (params: { tenantId: string; userId: string; after?: string; before?: string }) =>
    adminClient.user.token.list(params),
  hash: params => `${params.tenantId}:${params.userId}:${params.after ?? ''}:${params.before ?? ''}`,
  mutators: {},
  parents: [userLoader]
});

export let useUserTokens = (tenantId: string | undefined, userId: string | undefined) => {
  let [cursor, setCursor] = useState<{ after?: string; before?: string }>({});

  let loader = userTokensLoader.use(
    tenantId && userId ? { tenantId, userId, ...cursor } : null
  );

  let transformedData = useMemo(() => {
    if (!loader.data) return null;
    return {
      ...loader.data,
      pagination: {
        hasMoreAfter: loader.data.pagination.has_more_after,
        hasMoreBefore: loader.data.pagination.has_more_before
      }
    };
  }, [loader.data]);

  return {
    ...loader,
    data: transformedData,
    next: () => {
      let items = loader.data?.items;
      if (items?.length) {
        setCursor({ after: items[items.length - 1].id });
      }
    },
    previous: () => {
      let items = loader.data?.items;
      if (items?.length) {
        setCursor({ before: items[0].id });
      }
    }
  };
};

export let useCreateUserToken = userTokensLoader.createExternalMutator(
  (data: { tenantId: string; userId: string; name: string; expiresAt?: string }) =>
    adminClient.user.token.create(data)
);

export let useRevokeUserToken = userTokensLoader.createExternalMutator(
  (data: { tenantId: string; userId: string; tokenId: string }) =>
    adminClient.user.token.delete(data)
);

export let usePublishNewSlate = slatesLoader.createExternalMutator(
  (data: {
    tenantId: string;
    scopeIdentifier: string;
    slateIdentifier: string;
    contentBase64: string;
    access: 'public' | 'private';
  }) => adminClient.slate.version.create({ ...data, slateId: '' })
);
