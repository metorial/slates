import { useNavigate } from 'react-router-dom';
import { renderWithLoader } from '@metorial-io/data-hooks';
import { Avatar, Button, Text, Title, Flex, Spacer, Group } from '@metorial-io/ui';
import { useTenants } from '../../api/hooks';
import { EmptyState, ListItemLink, ListItemRow, MonoText } from '../../components/styled';

export let TenantList = () => {
  let navigate = useNavigate();
  let tenants = useTenants();

  return renderWithLoader({ tenants })(({ tenants }) => {
    let items = tenants.data?.items ?? [];

    return (
      <Flex direction="column" gap={24}>
        <Flex justify="space-between" align="center">
          <div>
            <Title size="6" weight="strong">Tenants</Title>
            <Spacer size={4} />
            <Text size="2" color="gray600">Manage your organization tenants</Text>
          </div>
          <Button onClick={() => navigate('/tenants/new')}>
            + Create Tenant
          </Button>
        </Flex>

        {items.length === 0 ? (
          <EmptyState direction="column" align="center">
            <Title size="4" weight="strong">No tenants yet</Title>
            <Spacer size={8} />
            <Text size="2" color="gray600">
              Create your first tenant to get started with Slates.
            </Text>
            <Spacer size={24} />
            <Button onClick={() => navigate('/tenants/new')}>
              + Create Tenant
            </Button>
          </EmptyState>
        ) : (
          <Group.Wrapper>
            {items.map(tenant => (
              <ListItemLink key={tenant.id} to={`/tenants/${tenant.id}`}>
                <ListItemRow align="center" justify="space-between">
                  <Flex align="center" gap={14}>
                    <Avatar entity={{ name: tenant.name }} size={32} withInitials radius={6} />
                    <div>
                      <Text size="2" weight="medium">{tenant.name}</Text>
                      <Text size="1" color="gray600">
                        <MonoText>{tenant.identifier}</MonoText>
                      </Text>
                    </div>
                  </Flex>
                  <Text size="1" color="gray500">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </Text>
                </ListItemRow>
              </ListItemLink>
            ))}
          </Group.Wrapper>
        )}
      </Flex>
    );
  });
}
