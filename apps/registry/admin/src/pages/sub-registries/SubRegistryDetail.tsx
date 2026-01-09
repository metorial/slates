import { Link, useParams } from 'react-router-dom';
import { styled } from 'styled-components';
import { useSubRegistry } from '../../api/hooks';
import { useSelectedTenantId, useTenantContext } from '../../context/TenantContext';

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
  margin-bottom: 24px;
`;

let CardHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid #f1f5f9;
`;

let CardTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 8px;
`;

let CardSubtitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
`;

let Badge = styled.code`
  display: inline-block;
  font-size: 13px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 6px;
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

let FilterList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

let FilterItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
`;

let FilterBadge = styled.span`
  display: inline-flex;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  background: #dbeafe;
  color: #1e40af;
`;

let FilterValue = styled.code`
  font-size: 13px;
  color: #1a1a2e;
  font-weight: 500;
`;

let EmptyText = styled.p`
  font-size: 14px;
  color: #64748b;
  margin: 0;
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

let WarningBanner = styled.div`
  padding: 16px 20px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #fcd34d;
  border-radius: 12px;
  color: #92400e;
  font-size: 14px;
`;

export let SubRegistryDetail = () => {
  let { subRegistryId } = useParams<{ subRegistryId: string }>();
  let tenantId = useSelectedTenantId();
  let { selectedTenant } = useTenantContext();
  let { data: subRegistry, isLoading, error } = useSubRegistry(tenantId, subRegistryId!);

  if (!selectedTenant) {
    return <WarningBanner>Please select a tenant first.</WarningBanner>;
  }

  if (isLoading) {
    return (
      <LoadingWrapper>
        <Spinner />
      </LoadingWrapper>
    );
  }

  if (error || !subRegistry) {
    return <ErrorMessage>Error loading sub-registry: {String(error)}</ErrorMessage>;
  }

  return (
    <div>
      <BackLink to="/sub-registries">← Back to Sub-Registries</BackLink>

      <Card>
        <CardHeader>
          <CardTitle>{subRegistry.name}</CardTitle>
          <Badge>{subRegistry.identifier}</Badge>
        </CardHeader>
        <CardContent>
          <DataList>
            <DataItem>
              <DataLabel>ID</DataLabel>
              <MonoValue>{subRegistry.id}</MonoValue>
            </DataItem>
            <DataItem>
              <DataLabel>Tenant</DataLabel>
              <DataValue>{selectedTenant.name}</DataValue>
            </DataItem>
            <DataItem>
              <DataLabel>Created</DataLabel>
              <DataValue>{new Date(subRegistry.createdAt).toLocaleString()}</DataValue>
            </DataItem>
          </DataList>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardSubtitle>Filters</CardSubtitle>
        </CardHeader>
        <CardContent>
          {!subRegistry.filters || subRegistry.filters.length === 0 ? (
            <EmptyText>No filters configured.</EmptyText>
          ) : (
            <FilterList>
              {subRegistry.filters.map(filter => (
                <FilterItem key={filter.id}>
                  <FilterBadge>{filter.type}</FilterBadge>
                  <FilterValue>{filter.value}</FilterValue>
                </FilterItem>
              ))}
            </FilterList>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
