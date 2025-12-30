import type { Instance, Scope, Workspace } from '../../prisma/generated/client';
import { scopePresenter } from './scope';

export let workspacePresenter = (
  workspace: Workspace & { scope: Scope; instance: Instance }
) => ({
  object: 'workspace',

  id: workspace.id,
  status: workspace.status,

  identifier: workspace.identifier,
  name: workspace.name,

  scope: scopePresenter({ ...workspace.scope, instance: workspace.instance }),
  instanceId: workspace.instance.id,

  createdAt: workspace.createdAt,
  updatedAt: workspace.updatedAt
});
