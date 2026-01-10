import { useNavigate, useParams } from 'react-router-dom';
import { renderWithLoader } from '@metorial-io/data-hooks';
import { Button, Text, Title, Flex, Spacer, Badge, Group } from '@metorial-io/ui';
import { useSubRegistries } from '../../api/hooks';
import { EmptyState, ListItemLink, ListItemRow, Avatar, MonoText } from '../../components/styled';

export let SubRegistryList = () => {
  let navigate = useNavigate();
  let { tenantId } = useParams<{ tenantId: string }>();
  let subRegistries = useSubRegistries(tenantId);

  return renderWithLoader({ subRegistries })(({ subRegistries }) => {
    let items = subRegistries.data?.items ?? [];

    return (
      <Flex direction="column" gap={24}>
        <Flex justify="space-between" align="center">
          <div>
            <Title size="6" weight="strong">Sub-Registries</Title>
            <Spacer size={4} />
            <Text size="2" color="gray600">Sub-registries are filtered views of slates. Use filters to control which slates are visible to different audiences.</Text>
          </div>
          <Button onClick={() => navigate(`/tenants/${tenantId}/sub-registries/new`)}>
            + Create Sub-Registry
          </Button>
        </Flex>

        {items.length === 0 ? (
          <EmptyState direction="column" align="center">
            <Title size="4" weight="strong">No sub-registries yet</Title>
            <Spacer size={8} />
            <Text size="2" color="gray600">
              Create your first sub-registry to organize slate access.
            </Text>
            <Spacer size={24} />
            <Button onClick={() => navigate(`/tenants/${tenantId}/sub-registries/new`)}>
              + Create Sub-Registry
            </Button>
          </EmptyState>
        ) : (
          <Group.Wrapper>
            {items.map(subRegistry => (
              <ListItemLink key={subRegistry.id} to={`/tenants/${tenantId}/sub-registries/${subRegistry.id}`}>
                <ListItemRow align="center" justify="space-between">
                  <Flex align="center" gap={14}>
                    <Avatar align="center" justify="center">
                      {subRegistry.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                      <Flex align="center" gap={8}>
                        <Text size="2" weight="medium">{subRegistry.name}</Text>
                        <Badge color="blue" size="1">{subRegistry.filters?.length ?? 0} filters</Badge>
                      </Flex>
                      <Text size="1" color="gray600">
                        <MonoText>{subRegistry.identifier}</MonoText>
                      </Text>
                    </div>
                  </Flex>
                  <Text size="1" color="gray500">
                    {new Date(subRegistry.createdAt).toLocaleDateString()}
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
