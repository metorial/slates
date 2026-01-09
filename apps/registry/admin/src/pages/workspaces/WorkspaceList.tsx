import { Link, useNavigate } from 'react-router-dom';
import { Button, Spinner, Text, Title, Badge, Flex, Spacer, Callout, Group } from '@metorial-io/ui';
import { useWorkspaces } from '../../api/hooks';
import { useSelectedTenantId, useTenantContext } from '../../context/TenantContext';

export function WorkspaceList() {
  let navigate = useNavigate();
  let tenantId = useSelectedTenantId();
  let { selectedTenant } = useTenantContext();
  let { data, isLoading, error } = useWorkspaces(tenantId);

  if (!selectedTenant) {
    return (
      <Flex direction="column" gap={24}>
        <div>
          <Title size="6" weight="strong">Workspaces</Title>
          <Spacer size={4} />
          <Text size="2" color="gray600">View and manage workspaces</Text>
        </div>
        <Callout color="yellow" size="3">
          Please select a tenant first to view workspaces.
        </Callout>
      </Flex>
    );
  }

  if (isLoading) {
    return (
      <Flex justify="center" align="center" style={{ padding: 80 }}>
        <Spinner size={32} />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex
        style={{
          padding: '16px 20px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 8,
          color: '#dc2626',
          fontSize: 14
        }}
      >
        Error loading workspaces: {String(error)}
      </Flex>
    );
  }

  let workspaces = data?.items ?? [];

  return (
    <Flex direction="column" gap={24}>
      <Flex justify="space-between" align="center">
        <div>
          <Title size="6" weight="strong">Workspaces</Title>
          <Spacer size={4} />
          <Text size="2" color="gray600">Tenant: {selectedTenant.name}</Text>
        </div>
        <Button onClick={() => navigate('/workspaces/new')}>
          + Create Workspace
        </Button>
      </Flex>

      {workspaces.length === 0 ? (
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
          <Button onClick={() => navigate('/workspaces/new')}>
            + Create Workspace
          </Button>
        </Flex>
      ) : (
        <Group.Wrapper>
          {workspaces.map(workspace => (
            <Link
              key={workspace.id}
              to={`/workspaces/${workspace.id}/edit`}
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
}
