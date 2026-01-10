import { Link, useNavigate, useParams } from 'react-router-dom';
import { renderWithLoader } from '@metorial-io/data-hooks';
import { Button, Text, Title, Badge, Flex, Spacer, Group } from '@metorial-io/ui';
import { useUsers } from '../../api/hooks';

export let UserList = () => {
  let navigate = useNavigate();
  let { tenantId } = useParams<{ tenantId: string }>();
  let users = useUsers(tenantId);

  return renderWithLoader({ users })(({ users }) => {
    let items = users.data?.items ?? [];

    return (
      <Flex direction="column" gap={24}>
        <Flex justify="space-between" align="center">
          <div>
            <Title size="6" weight="strong">Users</Title>
            <Spacer size={4} />
            <Text size="2" color="gray600">Users can publish slates and access the registry API. Each user has their own scope (@username) for publishing.</Text>
          </div>
          <Button onClick={() => navigate(`/tenants/${tenantId}/users/new`)}>
            + Create User
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
            <Title size="4" weight="strong">No users yet</Title>
            <Spacer size={8} />
            <Text size="2" color="gray600">
              Create your first user to enable slate publishing.
            </Text>
            <Spacer size={24} />
            <Button onClick={() => navigate(`/tenants/${tenantId}/users/new`)}>
              + Create User
            </Button>
          </Flex>
        ) : (
          <Group.Wrapper>
            {items.map(user => (
              <Link
                key={user.id}
                to={`/tenants/${tenantId}/users/${user.id}`}
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
                      {user.name.charAt(0).toUpperCase()}
                    </Flex>
                    <div>
                      <Flex align="center" gap={8}>
                        <Text size="2" weight="medium">{user.name}</Text>
                        <Badge color={user.status === 'active' ? 'green' : 'gray'} size="1">
                          {user.status}
                        </Badge>
                      </Flex>
                      <Text size="1" color="gray600" style={{ fontFamily: 'monospace' }}>
                        {user.identifier}
                      </Text>
                    </div>
                  </Flex>
                  <Text size="1" color="gray500">
                    {new Date(user.createdAt).toLocaleDateString()}
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
