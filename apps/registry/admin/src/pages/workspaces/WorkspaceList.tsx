import { Link, useNavigate, useParams } from 'react-router-dom';
import { renderWithLoader } from '@metorial-io/data-hooks';
import { Button, Text, Title, Badge, Flex, Spacer, Group } from '@metorial-io/ui';
import { useWorkspaces } from '../../api/hooks';

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
            <Text size="2" color="gray600">Manage workspaces for this tenant</Text>
          </div>
          <Button onClick={() => navigate(`/tenants/${tenantId}/workspaces/new`)}>
            + Create Workspace
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
            <Title size="4" weight="strong">No workspaces yet</Title>
            <Spacer size={8} />
            <Text size="2" color="gray600">
              Create your first workspace to organize slates.
            </Text>
            <Spacer size={24} />
            <Button onClick={() => navigate(`/tenants/${tenantId}/workspaces/new`)}>
              + Create Workspace
            </Button>
          </Flex>
        ) : (
          <Group.Wrapper>
            {items.map(workspace => (
              <Link
                key={workspace.id}
                to={`/tenants/${tenantId}/workspaces/${workspace.id}/edit`}
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
                      {workspace.name.charAt(0).toUpperCase()}
                    </Flex>
                    <div>
                      <Flex align="center" gap={8}>
                        <Text size="2" weight="medium">{workspace.name}</Text>
                        <Badge color={workspace.status === 'active' ? 'green' : 'gray'} size="1">
                          {workspace.status}
                        </Badge>
                      </Flex>
                      <Text size="1" color="gray600" style={{ fontFamily: 'monospace' }}>
                        {workspace.identifier}
                      </Text>
                    </div>
                  </Flex>
                  <Text size="1" color="gray500">
                    {new Date(workspace.createdAt).toLocaleDateString()}
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
