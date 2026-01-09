import { Link, useParams } from 'react-router-dom';
import { styled } from 'styled-components';
import { useTenant } from '../../api/hooks';
import { useTenantContext } from '../../context/TenantContext';

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

let Card = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
`;

let CardHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
`;

let CardHeaderInfo = styled.div``;

let CardTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 8px;
`;

let Badge = styled.code`
  display: inline-block;
  font-size: 13px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 6px;
`;

let SelectButton = styled.button`
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
  }
`;

let CardContent = styled.div`
  padding: 24px;
`;

let DataList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

let DataItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

let DataLabel = styled.span`
  font-size: 14px;
  color: #64748b;
`;

let DataValue = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
`;

let MonoValue = styled.code`
  font-size: 12px;
  color: #475569;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 4px;
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
  padding: 16px 20px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
`;

export function TenantDetail() {
  let { tenantId } = useParams<{ tenantId: string }>();
  let { data: tenant, isLoading, error } = useTenant(tenantId!);
  let { setSelectedTenant } = useTenantContext();

  if (isLoading) {
    return (
      <LoadingWrapper>
        <Spinner />
      </LoadingWrapper>
    );
  }

  if (error || !tenant) {
    return <ErrorMessage>Error loading tenant: {String(error)}</ErrorMessage>;
  }

  let handleSelectTenant = () => {
    setSelectedTenant({
      id: tenant.id,
      identifier: tenant.identifier,
      name: tenant.name
    });
  };

  return (
    <div>
      <BackLink to="/tenants">← Back to Tenants</BackLink>

      <Card>
        <CardHeader>
          <CardHeaderInfo>
            <CardTitle>{tenant.name}</CardTitle>
            <Badge>{tenant.identifier}</Badge>
          </CardHeaderInfo>
          <SelectButton onClick={handleSelectTenant}>Select as Current Tenant</SelectButton>
        </CardHeader>
        <CardContent>
          <DataList>
            <DataItem>
              <DataLabel>ID</DataLabel>
              <MonoValue>{tenant.id}</MonoValue>
            </DataItem>
            <DataItem>
              <DataLabel>Identifier</DataLabel>
              <DataValue>{tenant.identifier}</DataValue>
            </DataItem>
            <DataItem>
              <DataLabel>Created</DataLabel>
              <DataValue>{new Date(tenant.createdAt).toLocaleString()}</DataValue>
            </DataItem>
          </DataList>
        </CardContent>
      </Card>
    </div>
  );
}
