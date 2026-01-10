import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Flex, Group, Spacer, Error } from '@metorial-io/ui';
import { useCreateWorkspace } from '../../api/hooks';
import { BackLink } from '../../components/BackLink';

export let WorkspaceCreate = () => {
  let navigate = useNavigate();
  let { tenantId } = useParams<{ tenantId: string }>();
  let createWorkspace = useCreateWorkspace();

  let [name, setName] = useState('');
  let [identifier, setIdentifier] = useState('');
  let [description, setDescription] = useState('');

  let handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    let [, error] = await createWorkspace.mutate({
      tenantId,
      name,
      identifier,
      description: description.trim() || undefined
    });
    if (!error) {
      navigate(`/tenants/${tenantId}/workspaces`);
    }
  };

  return (
    <Flex direction="column" gap={24}>
      <BackLink to={`/tenants/${tenantId}/workspaces`}>Back to Workspaces</BackLink>

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

                <Input
                  label="Description"
                  description="Optional description for the workspace"
                  value={description}
                  onInput={setDescription}
                  placeholder="A brief description of this workspace"
                />

                {createWorkspace.error && (
                  <Error>Error: {String(createWorkspace.error)}</Error>
                )}

                <Spacer size={8} />

                <Flex gap={12}>
                  <Button type="submit" loading={createWorkspace.isLoading}>
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
