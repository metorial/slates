import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Flex, Group, Spacer, Error } from '@metorial-io/ui';
import { useCreateWorkspace } from '../../api/hooks';

export let WorkspaceCreate = () => {
  let navigate = useNavigate();
  let { tenantId } = useParams<{ tenantId: string }>();
  let createWorkspace = useCreateWorkspace();

  let [name, setName] = useState('');
  let [identifier, setIdentifier] = useState('');

  let handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    try {
      await createWorkspace.mutateAsync({ tenantId, name, identifier });
      navigate(`/tenants/${tenantId}/workspaces`);
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  };

  return (
    <Flex direction="column" gap={24}>
      <Link to={`/tenants/${tenantId}/workspaces`} style={{ color: '#64748b', fontSize: 14 }}>
        ← Back to Workspaces
      </Link>

      <div style={{ maxWidth: 480 }}>
        <Group.Wrapper>
          <Group.Header
            title="Create Workspace"
            description="Create a new workspace for this tenant"
          />
          <Group.Content>
            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap={20}>
                <Input
                  label="Name"
                  description="A display name for the workspace"
                  value={name}
                  onInput={setName}
                  placeholder="My Workspace"
                  required
                />

                <Input
                  label="Identifier"
                  description="Lowercase letters, numbers, and hyphens only"
                  value={identifier}
                  onInput={setIdentifier}
                  placeholder="my-workspace"
                  pattern="[a-z0-9-]+"
                  required
                />

                {createWorkspace.error && (
                  <Error>Error: {String(createWorkspace.error)}</Error>
                )}

                <Spacer size={8} />

                <Flex gap={12}>
                  <Button type="submit" loading={createWorkspace.isPending}>
                    Create Workspace
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate(`/tenants/${tenantId}/workspaces`)}>
                    Cancel
                  </Button>
                </Flex>
              </Flex>
            </form>
          </Group.Content>
        </Group.Wrapper>
      </div>
    </Flex>
  );
}
