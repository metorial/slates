import { useNavigate, useParams } from 'react-router-dom';
import { renderWithLoader, useForm } from '@metorial-io/data-hooks';
import { Button, Flex, Group, Input, Error } from '@metorial-io/ui';
import { useUpdateWorkspace, useWorkspace } from '../../api/hooks';
import { BackLink } from '../../components/BackLink';
import { FormWrapper, MonoCode } from '../../components/styled';
import { styled } from 'styled-components';

let Textarea = styled.textarea`
  padding: 10px 14px;
  font-size: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.15s;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;

  &:hover {
    border-color: #cbd5e1;
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

export let WorkspaceEdit = () => {
  let { tenantId, workspaceId } = useParams<{ tenantId: string; workspaceId: string }>();
  let navigate = useNavigate();
  let workspace = useWorkspace(tenantId, workspaceId!);
  let updateWorkspace = useUpdateWorkspace();

  let form = useForm({
    initialValues: {
      name: workspace.data?.name ?? '',
      description: workspace.data?.scope?.description ?? ''
    },
    updateInitialValues: true,
    onSubmit: async values => {
      if (!tenantId) return;
      let [, error] = await updateWorkspace.mutate({
        tenantId,
        workspaceId: workspaceId!,
        name: values.name,
        description: values.description
      });
      if (!error) {
        navigate(`/tenants/${tenantId}/workspaces`);
      }
    },
    schema: yup =>
      yup.object({
        name: yup.string().required(),
        description: yup.string()
      })
  });

  return renderWithLoader({ workspace })(({ workspace }) => {
    let workspaceData = workspace.data!;

    return (
      <Flex direction="column" gap={24}>
        <BackLink to={`/tenants/${tenantId}/workspaces`}>Back to Workspaces</BackLink>

        <FormWrapper>
          <Group.Wrapper>
            <Group.Header
              title="Edit Workspace"
              description={<MonoCode>{workspaceData.identifier}</MonoCode>}
            />
            <Group.Content>
              <form onSubmit={form.handleSubmit}>
                <Flex direction="column" gap={20}>
                  <Input
                    label="Name"
                    value={form.values.name}
                    onChange={e => form.setFieldValue('name', e.target.value)}
                    required
                  />

                  <Flex direction="column" gap={6}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Description</label>
                    <Textarea
                      value={form.values.description}
                      onChange={e => form.setFieldValue('description', e.target.value)}
                      placeholder="Optional description"
                    />
                  </Flex>

                  {updateWorkspace.error && (
                    <Error>Error: {String(updateWorkspace.error)}</Error>
                  )}

                  <Flex gap={12} style={{ marginTop: 8 }}>
                    <Button type="submit" loading={updateWorkspace.isLoading}>
                      Save Changes
                    </Button>
                    <Button type="button" variant="outline" onClick={() => navigate(`/tenants/${tenantId}/workspaces`)}>
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
}
