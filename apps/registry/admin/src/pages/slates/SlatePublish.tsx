import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { styled } from 'styled-components';
import { usePublishSlate, useSlate } from '../../api/hooks';

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

let CurrentVersionInfo = styled.div`
  padding: 14px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #475569;
  margin-bottom: 20px;

  strong {
    color: #1a1a2e;
  }
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

let HelpText = styled.p`
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
`;

let FileInputWrapper = styled.div`
  position: relative;
`;

let StyledFileInput = styled.input`
  width: 100%;
  padding: 12px 14px;
  font-size: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  transition: all 0.15s;

  &:hover {
    border-color: #cbd5e1;
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::file-selector-button {
    padding: 6px 12px;
    margin-right: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #fff;
    color: #374151;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      background: #f1f5f9;
    }
  }
`;

let Select = styled.select`
  padding: 10px 14px;
  font-size: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  transition: all 0.15s;
  cursor: pointer;

  &:hover {
    border-color: #cbd5e1;
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

let ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
`;

let Button = styled.button<{ $variant?: 'primary' | 'secondary'; $color?: 'green' | 'blue' }>`
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
      : p.$color === 'green'
        ? `
    color: #fff;
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    border: none;
    box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(34, 197, 94, 0.4);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `
        : `
    color: #fff;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border: none;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `}
`;

let LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 80px;
`;

let Spinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

let ErrorMessage = styled.div`
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 13px;
`;

export let SlatePublish = () => {
  let { tenantId, slateId } = useParams<{ tenantId: string; slateId: string }>();
  let navigate = useNavigate();
  let { data: slate, isLoading } = useSlate(tenantId, slateId!);
  let publishSlate = usePublishSlate();

  let [file, setFile] = useState<File | null>(null);
  let [access, setAccess] = useState<string>('private');

  if (isLoading) {
    return (
      <LoadingWrapper>
        <Spinner />
      </LoadingWrapper>
    );
  }

  if (!slate) {
    return <ErrorMessage>Slate not found.</ErrorMessage>;
  }

  let handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    let selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  let handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !tenantId) return;

    try {
      let buffer = await file.arrayBuffer();
      let base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      let parts = slate.fullIdentifier.split('/');
      let scopeIdentifier = parts[0]!;
      let slateIdentifier = parts[1]!;

      await publishSlate.mutateAsync({
        tenantId,
        slateId: slateId!,
        scopeIdentifier,
        slateIdentifier,
        contentBase64: base64,
        access: access as 'public' | 'private'
      });

      navigate(`/tenants/${tenantId}/slates/${slateId}`);
    } catch (error) {
      console.error('Failed to publish slate:', error);
    }
  };

  return (
    <div>
      <BackLink to={`/tenants/${tenantId}/slates/${slateId}`}>← Back to Slate</BackLink>

      <FormCard>
        <CardHeader>
          <CardTitle>Publish New Version</CardTitle>
          <Badge>{slate.fullIdentifier}</Badge>
        </CardHeader>
        <CardContent>
          {slate.currentVersion && (
            <CurrentVersionInfo>
              Current version: <strong>v{slate.currentVersion.version}</strong>
            </CurrentVersionInfo>
          )}

          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>Slate Package (ZIP)</Label>
              <FileInputWrapper>
                <StyledFileInput type="file" accept=".zip" onChange={handleFileChange} required />
              </FileInputWrapper>
              <HelpText>Upload a ZIP file containing slate.json and other assets</HelpText>
            </FormGroup>

            <FormGroup>
              <Label>Access Level</Label>
              <Select value={access} onChange={e => setAccess(e.target.value)}>
                <option value="private">Private</option>
                <option value="public">Public</option>
              </Select>
            </FormGroup>

            {publishSlate.error && (
              <ErrorMessage>Error: {String(publishSlate.error)}</ErrorMessage>
            )}

            <ButtonGroup>
              <Button type="submit" $color="green" disabled={!file || publishSlate.isPending}>
                {publishSlate.isPending ? 'Publishing...' : 'Publish Version'}
              </Button>
              <Button
                type="button"
                $variant="secondary"
                onClick={() => navigate(`/slates/${slateId}`)}
              >
                Cancel
              </Button>
            </ButtonGroup>
          </Form>
        </CardContent>
      </FormCard>
    </div>
  );
}
