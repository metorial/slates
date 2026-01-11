import { useNavigate, useParams } from 'react-router-dom';
import { renderWithLoader, useForm } from '@metorial-io/data-hooks';
import { Button, Flex, Group, Input, Spacer, Text, Select } from '@metorial-io/ui';
import { usePublishNewSlate, useUsers, useWorkspaces } from '../../api/hooks';
import { BackLink } from '../../components/BackLink';
import { FormWrapper, FileInput } from '../../components/styled';

export let SlateCreate = () => {
  let { tenantId } = useParams<{ tenantId: string }>();
  let navigate = useNavigate();
  let users = useUsers(tenantId);
  let workspaces = useWorkspaces(tenantId);
  let publishNewSlate = usePublishNewSlate();

  let form = useForm({
    initialValues: {
      scopeIdentifier: '',
      slateIdentifier: '',
      file: null as File | null,
      access: 'private' as 'public' | 'private'
    },
    onSubmit: async values => {
      if (!values.file || !tenantId || !values.scopeIdentifier || !values.slateIdentifier) return;

      let buffer = await values.file.arrayBuffer();
      let base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      let [result, error] = await publishNewSlate.mutate({
        tenantId,
        scopeIdentifier: values.scopeIdentifier,
        slateIdentifier: values.slateIdentifier,
        contentBase64: base64,
        access: values.access
      });

      if (!error && result?.slateId) {
        navigate(`/tenants/${tenantId}/slates/${result.slateId}`);
      } else if (!error) {
        navigate(`/tenants/${tenantId}/slates`);
      }
    },
    schema: yup =>
      yup.object({
        scopeIdentifier: yup.string().required(),
        slateIdentifier: yup.string().required(),
        file: yup.mixed<File>().nullable().defined(),
        access: yup.string().oneOf(['public', 'private']).required()
      })
  });

  return renderWithLoader({ users, workspaces })(({ users, workspaces }) => {
    let userItems = users.data?.items ?? [];
    let workspaceItems = workspaces.data?.items ?? [];

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
              <form onSubmit={form.handleSubmit}>
                <Flex direction="column" gap={20}>
                  <Select
                    label="Scope"
                    description="The user or workspace that will own this slate. Must match the scope in your slate.json name field."
                    placeholder="Select a scope..."
                    value={form.values.scopeIdentifier}
                    onChange={value => form.setFieldValue('scopeIdentifier', value)}
                    items={[
                      ...userItems.map(user => ({
                        id: user.scope?.identifier ?? user.identifier,
                        label: `@${user.scope?.identifier ?? user.identifier} (User: ${user.name})`
                      })),
                      ...(userItems.length > 0 && workspaceItems.length > 0 ? [{ type: 'separator' as const }] : []),
                      ...workspaceItems.map(workspace => ({
                        id: workspace.scope?.identifier ?? workspace.identifier,
                        label: `@${workspace.scope?.identifier ?? workspace.identifier} (Workspace: ${workspace.name})`
                      }))
                    ]}
                  />
                  <form.RenderError field="scopeIdentifier" />

                  <Input
                    label="Slate Identifier"
                    description={`The slate name (after the /). Full identifier: @${form.values.scopeIdentifier || 'scope'}/${form.values.slateIdentifier || 'slate-name'}`}
                    placeholder="my-slate"
                    value={form.values.slateIdentifier}
                    onInput={v => form.setFieldValue('slateIdentifier', v)}
                    required
                  />
                  <form.RenderError field="slateIdentifier" />

                  <Flex direction="column" gap={6}>
                    <Text size="2" weight="medium">Slate Package (ZIP)</Text>
                    <FileInput type="file" accept=".zip" onChange={e => form.setFieldValue('file', e.target.files?.[0] ?? null)} required />
                    <form.RenderError field="file" />
                    <Text size="1" color="gray600">
                      ZIP file with slate.json at root (not in a subfolder). Create with: cd your-slate && zip -r slate.zip .
                    </Text>
                  </Flex>

                  <Select
                    label="Access Level"
                    description="Private slates are only visible to authenticated users. Public slates are discoverable by anyone."
                    value={form.values.access}
                    onChange={value => form.setFieldValue('access', value as 'public' | 'private')}
                    items={[
                      { id: 'private', label: 'Private' },
                      { id: 'public', label: 'Public' }
                    ]}
                  />
                  <form.RenderError field="access" />

                  <publishNewSlate.RenderError />

                  <Spacer size={8} />

                  <Flex gap={12}>
                    <Button
                      type="submit"
                      loading={publishNewSlate.isLoading}
                      disabled={!form.values.file || !form.values.scopeIdentifier || !form.values.slateIdentifier}
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
