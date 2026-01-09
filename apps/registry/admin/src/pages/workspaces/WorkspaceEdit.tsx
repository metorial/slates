import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { renderWithLoader } from '@metorial-io/data-hooks';
import { styled } from 'styled-components';
import { useUpdateWorkspace, useWorkspace } from '../../api/hooks';

let BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 24px;
  color: #64748b;
  font-size: 14px;
  transition: color 0.15s;

  &:hover {
    color: #3b82f6;
  }
`;

let FormCard = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  max-width: 480px;
`;

let CardHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

let CardTitle = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
`;

let Badge = styled.code`
  display: inline-block;
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 6px;
`;

let CardContent = styled.div`
  padding: 24px;
`;

let Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

let FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

let Label = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: #374151;
`;

let Input = styled.input`
  padding: 10px 14px;
  font-size: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.15s;

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

let ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
`;

let Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;

  ${p =>
    p.$variant === 'secondary'
      ? `
    color: #64748b;
    background: #fff;
    border: 1px solid #e2e8f0;

    &:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }
  `
      : `
    color: #fff;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border: none;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  `}
`;

let ErrorMessage = styled.div`
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 13px;
`;

export let WorkspaceEdit = () => {
  let { tenantId, workspaceId } = useParams<{ tenantId: string; workspaceId: string }>();
  let navigate = useNavigate();
  let workspace = useWorkspace(tenantId, workspaceId!);
  let updateWorkspace = useUpdateWorkspace();

  let [name, setName] = useState('');
  let [description, setDescription] = useState('');
  let [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (workspace.data && !initialized) {
      setName(workspace.data.name);
      setDescription(workspace.data.scope?.description ?? '');
      setInitialized(true);
    }
  }, [workspace.data, initialized]);

  return renderWithLoader({ workspace })(({ workspace }) => {
    let workspaceData = workspace.data!;

    let handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      if (!tenantId) return;
      let [, error] = await updateWorkspace.mutate({
        tenantId,
        workspaceId: workspaceId!,
        name,
        description
      });
      if (!error) {
        navigate(`/tenants/${tenantId}/workspaces`);
      }
    };

    return (
      <div>
        <BackLink to={`/tenants/${tenantId}/workspaces`}>← Back to Workspaces</BackLink>

        <FormCard>
          <CardHeader>
            <CardTitle>Edit Workspace</CardTitle>
            <Badge>{workspaceData.identifier}</Badge>
          </CardHeader>
          <CardContent>
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>Name</Label>
                <Input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Optional description"
                />
              </FormGroup>

              {updateWorkspace.error && (
                <ErrorMessage>Error: {String(updateWorkspace.error)}</ErrorMessage>
              )}

              <ButtonGroup>
                <Button type="submit" disabled={updateWorkspace.isLoading}>
                  {updateWorkspace.isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" $variant="secondary" onClick={() => navigate(`/tenants/${tenantId}/workspaces`)}>
                  Cancel
                </Button>
              </ButtonGroup>
            </Form>
          </CardContent>
        </FormCard>
      </div>
    );
  });
}
