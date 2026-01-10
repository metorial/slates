import { useNavigate, useParams } from 'react-router-dom';
import { renderWithLoader } from '@metorial-io/data-hooks';
import { Button, Text, Title, Badge, Flex, Spacer, Group } from '@metorial-io/ui';
import { useUsers } from '../../api/hooks';
import { EmptyState, ListItemLink, ListItemRow, Avatar, MonoText } from '../../components/styled';

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
          <EmptyState direction="column" align="center">
            <Title size="4" weight="strong">No users yet</Title>
            <Spacer size={8} />
            <Text size="2" color="gray600">
              Create your first user to enable slate publishing.
            </Text>
            <Spacer size={24} />
            <Button onClick={() => navigate(`/tenants/${tenantId}/users/new`)}>
              + Create User
            </Button>
          </EmptyState>
        ) : (
          <Group.Wrapper>
            {items.map(user => (
              <ListItemLink key={user.id} to={`/tenants/${tenantId}/users/${user.id}`}>
                <ListItemRow align="center" justify="space-between">
                  <Flex align="center" gap={14}>
                    <Avatar align="center" justify="center">
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                      <Flex align="center" gap={8}>
                        <Text size="2" weight="medium">{user.name}</Text>
                        <Badge color={user.status === 'active' ? 'green' : 'gray'} size="1">
                          {user.status}
                        </Badge>
                      </Flex>
                      <Text size="1" color="gray600">
                        <MonoText>{user.identifier}</MonoText>
                      </Text>
                    </div>
                  </Flex>
                  <Text size="1" color="gray500">
                    {new Date(user.createdAt).toLocaleDateString()}
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
