import { useParams } from 'react-router-dom';
import { renderWithLoader } from '@metorial-io/data-hooks';
import { Flex, Text, Group, Badge as UiBadge } from '@metorial-io/ui';
import { useTenant } from '../../api/hooks';
import { BackLink } from '../../components/BackLink';
import { DataRow, MonoCode } from '../../components/styled';

export let TenantDetail = () => {
  let { tenantId } = useParams<{ tenantId: string }>();
  let tenant = useTenant(tenantId!);

  return renderWithLoader({ tenant })(({ tenant }) => (
    <Flex direction="column" gap={24}>
      <BackLink to="/tenants">Back to Tenants</BackLink>

      <Group.Wrapper>
        <Group.Header
          title={tenant.data!.name}
          description={
            <UiBadge color="gray" size="1">
              <code>{tenant.data!.identifier}</code>
            </UiBadge>
          }
        />
        <Group.Content>
          <Flex direction="column" gap={16}>
            <DataRow justify="space-between" align="center">
              <Text size="2" color="gray600">ID</Text>
              <MonoCode>{tenant.data!.id}</MonoCode>
            </DataRow>
            <DataRow justify="space-between" align="center">
              <Text size="2" color="gray600">Identifier</Text>
              <Text size="2" weight="medium">{tenant.data!.identifier}</Text>
            </DataRow>
            <DataRow justify="space-between" align="center">
              <Text size="2" color="gray600">Created</Text>
              <Text size="2" weight="medium">{new Date(tenant.data!.createdAt).toLocaleString()}</Text>
            </DataRow>
          </Flex>
        </Group.Content>
      </Group.Wrapper>
    </Flex>
  ));
}
