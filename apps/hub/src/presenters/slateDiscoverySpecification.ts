import type {
  SlateAction,
  SlateAuthMethod,
  SlateConfigSchema,
  SlateSpecification,
  SlateSpecificationAction,
  SlateSpecificationAuthMethod,
  SlateSpecificationConfigSchema
} from '../../prisma/generated/client';

export let slateDiscoverySpecificationPresenter = (
  spec: SlateSpecification & {
    slateAuthMethods: (SlateSpecificationAuthMethod & { authMethod: SlateAuthMethod })[];
    slateActions: (SlateSpecificationAction & { action: SlateAction })[];
    slateConfigSchemas: (SlateSpecificationConfigSchema & { configSchema: SlateConfigSchema })[];
  }
) => ({
  object: 'slate.discovery.specification',
  provider: {
    name: spec.name,
    key: spec.key,
    protocolVersion: spec.protocolVersion
  },
  tools: spec.slateActions
    .map(sa => sa.action)
    .filter(a => a.type === 'tool')
    .map(a => ({
      key: a.key,
      name: a.name,
      description: (a.spec as any)?.description,
      inputSchema: (a.spec as any)?.inputSchema,
      outputSchema: (a.spec as any)?.outputSchema
    })),
  triggers: spec.slateActions
    .map(sa => sa.action)
    .filter(a => a.type === 'trigger')
    .map(a => ({
      key: a.key,
      name: a.name,
      description: (a.spec as any)?.description,
      inputSchema: (a.spec as any)?.inputSchema,
      outputSchema: (a.spec as any)?.outputSchema
    })),
  authMethods: spec.slateAuthMethods.map(sam => sam.authMethod).map(am => ({
    key: am.key,
    name: am.name,
    type: am.type,
    scopes: (am.spec as any)?.scopes,
    capabilities: (am.spec as any)?.capabilities,
    inputSchema: (am.spec as any)?.inputSchema,
    outputSchema: (am.spec as any)?.outputSchema
  })),
  configSchema: spec.slateConfigSchemas[0]?.configSchema?.schema ?? null
});
