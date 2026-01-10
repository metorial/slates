import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { renderWithLoader } from '@metorial-io/data-hooks';
import { Button, Flex, Group, Input, Spacer, Text, Error } from '@metorial-io/ui';
import { usePublishNewSlate, useUsers, useWorkspaces } from '../../api/hooks';
import { BackLink } from '../../components/BackLink';
import { FormWrapper, Select, FileInput } from '../../components/styled';

export let SlateCreate = () => {
  let { tenantId } = useParams<{ tenantId: string }>();
  let navigate = useNavigate();
  let users = useUsers(tenantId);
  let workspaces = useWorkspaces(tenantId);
  let publishNewSlate = usePublishNewSlate();

  let [scopeIdentifier, setScopeIdentifier] = useState('');
  let [slateIdentifier, setSlateIdentifier] = useState('');
  let [file, setFile] = useState<File | null>(null);
  let [access, setAccess] = useState<'public' | 'private'>('private');

  let handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    let selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  return renderWithLoader({ users, workspaces })(({ users, workspaces }) => {
    let userItems = users.data?.items ?? [];
    let workspaceItems = workspaces.data?.items ?? [];

    let handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      if (!file || !tenantId || !scopeIdentifier || !slateIdentifier) return;

      let buffer = await file.arrayBuffer();
      let base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      let [result, error] = await publishNewSlate.mutate({
        tenantId,
        scopeIdentifier,
        slateIdentifier,
        contentBase64: base64,
        access
      });

      if (!error && result?.slateId) {
        navigate(`/tenants/${tenantId}/slates/${result.slateId}`);
      } else if (!error) {
        navigate(`/tenants/${tenantId}/slates`);
      }
    };

    return (
      <Flex direction="column" gap={24}>
        <BackLink to={`/tenants/${tenantId}/slates`}>Back to Slates</BackLink>

        <FormWrapper>
          <Group.Wrapper>
            <Group.Header
              title="Create New Slate"
              description="Publish a new slate to the registry. The ZIP must contain a slate.json at the root with a name field matching @scope/identifier."
            />
            <Group.Content>
              <form onSubmit={handleSubmit}>
                <Flex direction="column" gap={20}>
                  <Flex direction="column" gap={6}>
                    <Text size="2" weight="medium">Scope</Text>
                    <Select value={scopeIdentifier} onChange={e => setScopeIdentifier(e.target.value)} required>
                      <option value="">Select a scope...</option>
                      {userItems.length > 0 && (
                        <optgroup label="Users">
                          {userItems.map(user => (
                            <option key={user.id} value={user.scope?.identifier ?? user.identifier}>
                              @{user.scope?.identifier ?? user.identifier} (User: {user.name})
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {workspaceItems.length > 0 && (
                        <optgroup label="Workspaces">
                          {workspaceItems.map(workspace => (
                            <option key={workspace.id} value={workspace.scope?.identifier ?? workspace.identifier}>
                              @{workspace.scope?.identifier ?? workspace.identifier} (Workspace: {workspace.name})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </Select>
                    <Text size="1" color="gray600">
                      The user or workspace that will own this slate. Must match the scope in your slate.json name field.
                    </Text>
                  </Flex>

                  <Input
                    label="Slate Identifier"
                    description={`The slate name (after the /). Full identifier: @${scopeIdentifier || 'scope'}/${slateIdentifier || 'slate-name'}`}
                    placeholder="my-slate"
                    value={slateIdentifier}
                    onInput={setSlateIdentifier}
                    required
                  />

                  <Flex direction="column" gap={6}>
                    <Text size="2" weight="medium">Slate Package (ZIP)</Text>
                    <FileInput type="file" accept=".zip" onChange={handleFileChange} required />
                    <Text size="1" color="gray600">
                      ZIP file with slate.json at root (not in a subfolder). Create with: cd your-slate && zip -r slate.zip .
                    </Text>
                  </Flex>

                  <Flex direction="column" gap={6}>
                    <Text size="2" weight="medium">Access Level</Text>
                    <Select value={access} onChange={e => setAccess(e.target.value as 'public' | 'private')}>
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                    </Select>
                    <Text size="1" color="gray600">
                      Private slates are only visible to authenticated users. Public slates are discoverable by anyone.
                    </Text>
                  </Flex>

                  {publishNewSlate.error && (
                    <Error>Error: {String(publishNewSlate.error)}</Error>
                  )}

                  <Spacer size={8} />

                  <Flex gap={12}>
                    <Button
                      type="submit"
                      loading={publishNewSlate.isLoading}
                      disabled={!file || !scopeIdentifier || !slateIdentifier}
                    >
                      Create Slate
                    </Button>
                    <Button type="button" variant="outline" onClick={() => navigate(`/tenants/${tenantId}/slates`)}>
                      Cancel
                    </Button>
                  </Flex>
                </Flex>
              </form>
            </Group.Content>
          </Group.Wrapper>
        </FormWrapper>
      </Flex>
    );
  });
};
