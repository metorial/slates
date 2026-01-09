import { Link, useParams } from 'react-router-dom';
import { renderWithLoader } from '@metorial-io/data-hooks';
import { Flex, Text, Group, Badge } from '@metorial-io/ui';
import { useSubRegistry, useTenant } from '../../api/hooks';

export let SubRegistryDetail = () => {
  let { tenantId, subRegistryId } = useParams<{ tenantId: string; subRegistryId: string }>();
  let tenant = useTenant(tenantId ?? '');
  let subRegistry = useSubRegistry(tenantId, subRegistryId!);

  return renderWithLoader({ subRegistry })(({ subRegistry }) => (
    <Flex direction="column" gap={24}>
      <Link to={`/tenants/${tenantId}/sub-registries`} style={{ color: '#64748b', fontSize: 14 }}>
        ← Back to Sub-Registries
      </Link>

      <Group.Wrapper>
        <Group.Header
          title={subRegistry.data!.name}
          description={
            <Badge color="gray" size="1" style={{ fontFamily: 'monospace' }}>
              {subRegistry.data!.identifier}
            </Badge>
          }
        />
        <Group.Content>
          <Flex direction="column" gap={16}>
            <Flex justify="space-between" align="center" style={{ paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <Text size="2" color="gray600">ID</Text>
              <Text size="1" style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '4px 8px', borderRadius: 4 }}>
                {subRegistry.data!.id}
              </Text>
            </Flex>
            <Flex justify="space-between" align="center" style={{ paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <Text size="2" color="gray600">Tenant</Text>
              <Text size="2" weight="medium">{tenant.data?.name ?? '-'}</Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text size="2" color="gray600">Created</Text>
              <Text size="2" weight="medium">{new Date(subRegistry.data!.createdAt).toLocaleString()}</Text>
            </Flex>
          </Flex>
        </Group.Content>
      </Group.Wrapper>

      <Group.Wrapper>
        <Group.Header title="Filters" />
        <Group.Content>
          {!subRegistry.data!.filters || subRegistry.data!.filters.length === 0 ? (
            <Text size="2" color="gray600">No filters configured.</Text>
          ) : (
            <Flex direction="column" gap={12}>
              {subRegistry.data!.filters.map(filter => (
                <Flex
                  key={filter.id}
                  align="center"
                  gap={12}
                  style={{
                    padding: '14px 16px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8
                  }}
                >
                  <Badge color="blue" size="1">{filter.type}</Badge>
                  <Text size="2" weight="medium" style={{ fontFamily: 'monospace' }}>{filter.value}</Text>
                </Flex>
              ))}
            </Flex>
          )}
        </Group.Content>
      </Group.Wrapper>
    </Flex>
  ));
}
