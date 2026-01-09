import { Link } from 'react-router-dom';
import { Spinner, Text, Title, Badge, Flex, Spacer, Callout, Group } from '@metorial-io/ui';
import { useSlates } from '../../api/hooks';
import { useSelectedTenantId, useTenantContext } from '../../context/TenantContext';

export function SlateList() {
  let tenantId = useSelectedTenantId();
  let { selectedTenant } = useTenantContext();
  let { data, isLoading, error } = useSlates(tenantId);

  if (!selectedTenant) {
    return (
      <Flex direction="column" gap={32}>
        <div>
          <Title size="6" weight="strong">Slates</Title>
          <Spacer size={4} />
          <Text size="2" color="gray600">View and manage your slates</Text>
        </div>
        <Callout color="yellow" size="3">
          Please select a tenant first to view slates.
        </Callout>
      </Flex>
    );
  }

  if (isLoading) {
    return (
      <Flex justify="center" align="center" style={{ padding: 80 }}>
        <Spinner size={32} />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex
        style={{
          padding: '16px 20px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 8,
          color: '#dc2626',
          fontSize: 14
        }}
      >
        Error loading slates: {String(error)}
      </Flex>
    );
  }

  let slates = data?.items ?? [];

  return (
    <Flex direction="column" gap={32}>
      <div>
        <Title size="6" weight="strong">Slates</Title>
        <Spacer size={4} />
        <Text size="2" color="gray600">Tenant: {selectedTenant.name}</Text>
      </div>

      {slates.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          style={{
            padding: '80px 40px',
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}
        >
          <Title size="4" weight="strong">No slates found</Title>
          <Spacer size={8} />
          <Text size="2" color="gray600">This tenant doesn't have any slates yet.</Text>
        </Flex>
      ) : (
        <Group.Wrapper>
          <Group.HeaderRow>
            <Flex style={{ fontWeight: 600, fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <div style={{ flex: 1 }}>Slate</div>
              <div style={{ width: 140 }}>Version</div>
              <div style={{ width: 120 }}>Access</div>
              <div style={{ width: 100 }}>Actions</div>
            </Flex>
          </Group.HeaderRow>
          {slates.map(slate => (
            <Link
              key={slate.id}
              to={`/slates/${slate.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Group.Row style={{ padding: '16px 20px', cursor: 'pointer' }}>
                <Flex align="center">
                  <Flex align="center" gap={14} style={{ flex: 1 }}>
                    {slate.logoUrl ? (
                      <img
                        src={slate.logoUrl}
                        alt=""
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          objectFit: 'cover',
                          background: '#f1f5f9'
                        }}
                      />
                    ) : (
                      <Flex
                        align="center"
                        justify="center"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                          fontSize: 16,
                          color: '#94a3b8'
                        }}
                      >
                        S
                      </Flex>
                    )}
                    <Flex direction="column">
                      <Text size="2" weight="strong">{slate.name}</Text>
                      <Text size="1" color="gray600">{slate.fullIdentifier}</Text>
                    </Flex>
                  </Flex>
                  <Flex align="center" style={{ width: 140 }}>
                    <Badge color="blue">v{slate.currentVersion?.version ?? '-'}</Badge>
                  </Flex>
                  <Flex align="center" style={{ width: 120 }}>
                    <Badge color={slate.access === 'public' ? 'green' : 'gray'}>
                      {slate.access}
                    </Badge>
                  </Flex>
                  <Flex align="center" style={{ width: 100 }}>
                    <Link
                      to={`/slates/${slate.id}/publish`}
                      onClick={e => e.stopPropagation()}
                      style={{
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#3b82f6',
                        background: '#eff6ff',
                        borderRadius: 6,
                        textDecoration: 'none'
                      }}
                    >
                      Publish
                    </Link>
                  </Flex>
                </Flex>
              </Group.Row>
            </Link>
          ))}
        </Group.Wrapper>
      )}
    </Flex>
  );
}
