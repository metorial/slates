import { useNavigate, useParams } from 'react-router-dom';
import { renderWithPagination } from '@metorial-io/data-hooks';
import { Avatar, Button, Text, Title, Badge, Flex, Spacer, Group, RenderDate } from '@metorial-io/ui';
import { useUsers } from '../../hooks';
import { EmptyState, ListItemLink, ListItemRow, MonoText } from '../../components/styled';

export let UserList = () => {
  let navigate = useNavigate();
  let { tenantId } = useParams<{ tenantId: string }>();
  let users = useUsers(tenantId);

  let emptyState = (
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
  );

  return renderWithPagination(users, { emptyState })(({ data }) => {
    let items = data.items;

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

        <Group.Wrapper>
          {items.map(user => (
            <ListItemLink key={user.id} to={`/tenants/${tenantId}/users/${user.id}`}>
              <ListItemRow align="center" justify="space-between">
                <Flex align="center" gap={14}>
                  <Avatar entity={{ name: user.name }} size={32} withInitials radius={6} />
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
                <RenderDate date={user.createdAt} />
              </ListItemRow>
            </ListItemLink>
          ))}
        </Group.Wrapper>
      </Flex>
    );
  });
}
