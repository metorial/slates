import { useNavigate, useParams } from 'react-router-dom';
import { renderWithLoader } from '@metorial-io/data-hooks';
import { Button, Text, Title, Badge, Flex, Spacer, Group } from '@metorial-io/ui';
import { useWorkspaces } from '../../api/hooks';
import { EmptyState, ListItemLink, ListItemRow, Avatar, MonoText } from '../../components/styled';

export let WorkspaceList = () => {
  let navigate = useNavigate();
  let { tenantId } = useParams<{ tenantId: string }>();
  let workspaces = useWorkspaces(tenantId);

  return renderWithLoader({ workspaces })(({ workspaces }) => {
    let items = workspaces.data?.items ?? [];

    return (
      <Flex direction="column" gap={24}>
        <Flex justify="space-between" align="center">
          <div>
            <Title size="6" weight="strong">Workspaces</Title>
            <Spacer size={4} />
            <Text size="2" color="gray600">Workspaces are shared scopes for teams. Slates published under a workspace (@workspace-name) can be managed by multiple users.</Text>
          </div>
          <Button onClick={() => navigate(`/tenants/${tenantId}/workspaces/new`)}>
            + Create Workspace
          </Button>
        </Flex>

        {items.length === 0 ? (
          <EmptyState direction="column" align="center">
            <Title size="4" weight="strong">No workspaces yet</Title>
            <Spacer size={8} />
            <Text size="2" color="gray600">
              Create your first workspace to organize slates.
            </Text>
            <Spacer size={24} />
            <Button onClick={() => navigate(`/tenants/${tenantId}/workspaces/new`)}>
              + Create Workspace
            </Button>
          </EmptyState>
        ) : (
          <Group.Wrapper>
            {items.map(workspace => (
              <ListItemLink key={workspace.id} to={`/tenants/${tenantId}/workspaces/${workspace.id}/edit`}>
                <ListItemRow align="center" justify="space-between">
                  <Flex align="center" gap={14}>
                    <Avatar align="center" justify="center">
                      {workspace.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                      <Flex align="center" gap={8}>
                        <Text size="2" weight="medium">{workspace.name}</Text>
                        <Badge color={workspace.status === 'active' ? 'green' : 'gray'} size="1">
                          {workspace.status}
                        </Badge>
                      </Flex>
                      <Text size="1" color="gray600">
                        <MonoText>{workspace.identifier}</MonoText>
                      </Text>
                    </div>
                  </Flex>
                  <Text size="1" color="gray500">
                    {new Date(workspace.createdAt).toLocaleDateString()}
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
