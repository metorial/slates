import { Link, useNavigate, useParams } from 'react-router-dom';
import { renderWithLoader } from '@metorial-io/data-hooks';
import { Button, Text, Title, Flex, Spacer, Badge, Group } from '@metorial-io/ui';
import { useSubRegistries } from '../../api/hooks';

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
            <Text size="2" color="gray600">Manage sub-registries for this tenant</Text>
          </div>
          <Button onClick={() => navigate(`/tenants/${tenantId}/sub-registries/new`)}>
            + Create Sub-Registry
          </Button>
        </Flex>

        {items.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            style={{
              padding: '80px 40px',
              background: '#fff',
              borderRadius: 8,
              border: '1px solid #e8e8e8',
              textAlign: 'center'
            }}
          >
            <Title size="4" weight="strong">No sub-registries yet</Title>
            <Spacer size={8} />
            <Text size="2" color="gray600">
              Create your first sub-registry to organize slate access.
            </Text>
            <Spacer size={24} />
            <Button onClick={() => navigate(`/tenants/${tenantId}/sub-registries/new`)}>
              + Create Sub-Registry
            </Button>
          </Flex>
        ) : (
          <Group.Wrapper>
            {items.map(subRegistry => (
              <Link
                key={subRegistry.id}
                to={`/tenants/${tenantId}/sub-registries/${subRegistry.id}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <Flex
                  align="center"
                  justify="space-between"
                  style={{ padding: '14px 20px' }}
                >
                  <Flex align="center" gap={14}>
                    <Flex
                      align="center"
                      justify="center"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: '#f0f0f0',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#666'
                      }}
                    >
                      {subRegistry.name.charAt(0).toUpperCase()}
                    </Flex>
                    <div>
                      <Flex align="center" gap={8}>
                        <Text size="2" weight="medium">{subRegistry.name}</Text>
                        <Badge color="blue" size="1">{subRegistry.filters?.length ?? 0} filters</Badge>
                      </Flex>
                      <Text size="1" color="gray600" style={{ fontFamily: 'monospace' }}>
                        {subRegistry.identifier}
                      </Text>
                    </div>
                  </Flex>
                  <Text size="1" color="gray500">
                    {new Date(subRegistry.createdAt).toLocaleDateString()}
                  </Text>
                </Flex>
              </Link>
            ))}
          </Group.Wrapper>
        )}
      </Flex>
    );
  });
}
