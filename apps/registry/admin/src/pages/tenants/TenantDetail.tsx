import { Link, useParams } from 'react-router-dom';
import { renderWithLoader } from '@metorial-io/data-hooks';
import { Flex, Text, Group, Badge as UiBadge } from '@metorial-io/ui';
import { useTenant } from '../../api/hooks';

export let TenantDetail = () => {
  let { tenantId } = useParams<{ tenantId: string }>();
  let tenant = useTenant(tenantId!);

  return renderWithLoader({ tenant })(({ tenant }) => (
    <Flex direction="column" gap={24}>
      <Link to="/tenants" style={{ color: '#64748b', fontSize: 14 }}>
        ← Back to Tenants
      </Link>

      <Group.Wrapper>
        <Group.Header
          title={tenant.data!.name}
          description={
            <UiBadge color="gray" size="1" style={{ fontFamily: 'monospace' }}>
              {tenant.data!.identifier}
            </UiBadge>
          }
        />
        <Group.Content>
          <Flex direction="column" gap={16}>
            <Flex justify="space-between" align="center" style={{ paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <Text size="2" color="gray600">ID</Text>
              <Text size="1" style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '4px 8px', borderRadius: 4 }}>
                {tenant.data!.id}
              </Text>
            </Flex>
            <Flex justify="space-between" align="center" style={{ paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <Text size="2" color="gray600">Identifier</Text>
              <Text size="2" weight="medium">{tenant.data!.identifier}</Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text size="2" color="gray600">Created</Text>
              <Text size="2" weight="medium">{new Date(tenant.data!.createdAt).toLocaleString()}</Text>
            </Flex>
          </Flex>
        </Group.Content>
      </Group.Wrapper>
    </Flex>
  ));
}
