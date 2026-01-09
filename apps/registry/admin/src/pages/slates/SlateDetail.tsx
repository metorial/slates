import { Link, useNavigate, useParams } from 'react-router-dom';
import { styled } from 'styled-components';
import { useSlate, useSlateVersions } from '../../api/hooks';
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

let CardContent = styled.div`
  padding: 24px;
`;

let CardHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid #f1f5f9;
`;

let CardTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
`;

let SlateHeader = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-start;
`;

let SlateLogo = styled.img`
  width: 72px;
  height: 72px;
  border-radius: 12px;
  object-fit: cover;
  background: #f1f5f9;
`;

let SlateLogoPlaceholder = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 12px;
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #94a3b8;
  font-weight: 600;
`;

let SlateInfo = styled.div`
  flex: 1;
`;

let SlateHeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

let SlateName = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
`;

let PublishButton = styled.button`
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(34, 197, 94, 0.4);
  }
`;

let SlateIdentifier = styled.code`
  display: inline-block;
  font-size: 13px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 6px;
  margin-bottom: 12px;
`;

let SlateDescription = styled.p`
  font-size: 14px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
`;

let BadgeRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
`;

let Badge = styled.span<{ $color?: 'gray' | 'green' | 'blue' | 'purple' }>`
  display: inline-flex;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  ${p => {
    switch (p.$color) {
      case 'green':
        return 'background: #dcfce7; color: #166534;';
      case 'blue':
        return 'background: #dbeafe; color: #1e40af;';
      case 'purple':
        return 'background: #f3e8ff; color: #7c3aed;';
      default:
        return 'background: #f1f5f9; color: #475569;';
    }
  }}
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

let SkillsSection = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
`;

let SkillsLabel = styled.div`
  font-size: 13px;
  color: #64748b;
  margin-bottom: 10px;
`;

let VersionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

let VersionItem = styled.div<{ $current?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: ${p => (p.$current ? '#f0fdf4' : '#f8fafc')};
  border: 1px solid ${p => (p.$current ? '#bbf7d0' : '#e2e8f0')};
  border-radius: 8px;
`;

let VersionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

let VersionNumber = styled.span`
  font-family: monospace;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
`;

let VersionMeta = styled.span`
  font-size: 13px;
  color: #64748b;
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

let SmallSpinner = styled(Spinner)`
  width: 20px;
  height: 20px;
  border-width: 2px;
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

export function SlateDetail() {
  let { slateId } = useParams<{ slateId: string }>();
  let navigate = useNavigate();
  let tenantId = useSelectedTenantId();
  let { selectedTenant } = useTenantContext();
  let { data: slate, isLoading, error } = useSlate(tenantId, slateId!);
  let { data: versionsData, isLoading: versionsLoading } = useSlateVersions(tenantId, slateId!);

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

  if (error || !slate) {
    return <ErrorMessage>Error loading slate: {String(error)}</ErrorMessage>;
  }

  let versions = versionsData?.items ?? [];

  return (
    <div>
      <BackLink to="/slates">← Back to Slates</BackLink>

      <Card>
        <CardContent>
          <SlateHeader>
            {slate.logoUrl ? (
              <SlateLogo src={slate.logoUrl} alt="" />
            ) : (
              <SlateLogoPlaceholder>S</SlateLogoPlaceholder>
            )}
            <SlateInfo>
              <SlateHeaderTop>
                <SlateName>{slate.name}</SlateName>
                <PublishButton onClick={() => navigate(`/slates/${slate.id}/publish`)}>
                  Publish New Version
                </PublishButton>
              </SlateHeaderTop>
              <SlateIdentifier>{slate.fullIdentifier}</SlateIdentifier>
              {slate.description && <SlateDescription>{slate.description}</SlateDescription>}
            </SlateInfo>
          </SlateHeader>
        </CardContent>

        <CardContent style={{ borderTop: '1px solid #f1f5f9' }}>
          <BadgeRow>
            <Badge $color={slate.access === 'public' ? 'green' : 'gray'}>{slate.access}</Badge>
            <Badge $color={slate.status === 'active' ? 'green' : 'gray'}>{slate.status}</Badge>
            <Badge $color={slate.scope?.type === 'workspace' ? 'purple' : 'blue'}>
              {slate.scope?.type}: {slate.scope?.name}
            </Badge>
          </BadgeRow>

          <DataList>
            <DataItem>
              <DataLabel>ID</DataLabel>
              <MonoValue>{slate.id}</MonoValue>
            </DataItem>
            <DataItem>
              <DataLabel>Current Version</DataLabel>
              <DataValue>{slate.currentVersion?.version ?? 'No version'}</DataValue>
            </DataItem>
            <DataItem>
              <DataLabel>Created By</DataLabel>
              <DataValue>{slate.createdByUser?.name ?? 'Unknown'}</DataValue>
            </DataItem>
            <DataItem>
              <DataLabel>Created</DataLabel>
              <DataValue>{new Date(slate.createdAt).toLocaleString()}</DataValue>
            </DataItem>
          </DataList>

          {slate.skills && slate.skills.length > 0 && (
            <SkillsSection>
              <SkillsLabel>Skills</SkillsLabel>
              <BadgeRow>
                {slate.skills.map(skill => (
                  <Badge key={skill} $color="blue">
                    {skill}
                  </Badge>
                ))}
              </BadgeRow>
            </SkillsSection>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Versions</CardTitle>
        </CardHeader>
        <CardContent>
          {versionsLoading ? (
            <LoadingWrapper style={{ padding: 24 }}>
              <SmallSpinner />
            </LoadingWrapper>
          ) : versions.length === 0 ? (
            <EmptyText>No versions published yet.</EmptyText>
          ) : (
            <VersionList>
              {versions.map(version => (
                <VersionItem key={version.id} $current={version.isCurrent}>
                  <VersionInfo>
                    <VersionNumber>v{version.version}</VersionNumber>
                    {version.isCurrent && <Badge $color="green">Current</Badge>}
                  </VersionInfo>
                  <VersionMeta>
                    {new Date(version.createdAt).toLocaleString()}
                    {version.createdByUser && <span> by {version.createdByUser.name}</span>}
                  </VersionMeta>
                </VersionItem>
              ))}
            </VersionList>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
