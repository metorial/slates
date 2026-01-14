import { renderWithLoader } from '@metorial-io/data-hooks';
import {
  Badge,
  Button,
  CenteredSpinner,
  Flex,
  Group,
  InlineCopy,
  Text
} from '@metorial-io/ui';
import { Link, useParams } from 'react-router-dom';
import { versionStatusColors } from '../../constants/statusColors.js';
import {
  useSlate,
  useSlateDeployments,
  useSlateDiscoveries,
  useSlateVersion,
  useVersionSpecification
} from '../../state/index.js';
import { BackLink } from '../../components/BackLink.js';
import { InfoLabel, InfoRow, InfoValue, MonoCode, TextLink } from '../../components/styled.js';
import { SpecificationViewer } from '../../components/SpecificationViewer.js';

export let VersionDetail = () => {
  let { slateId, versionId } = useParams<{ slateId: string; versionId: string }>();
  let slate = useSlate(slateId);
  let version = useSlateVersion(slateId, versionId);
  let deployments = useSlateDeployments(slateId, versionId ? [versionId] : undefined);
  let discoveries = useSlateDiscoveries(slateId, versionId ? [versionId] : undefined);

  let successfulDiscovery = discoveries.data?.items?.find(d => d.status === 'succeeded');
  let specification = useVersionSpecification(slateId, versionId, successfulDiscovery?.id);

  return renderWithLoader({ slate, version })(({ slate, version }) => {
    let slateData = slate.data!;
    let versionData = version.data!;

    let latestDeployment = deployments.data?.items?.[0];
    let latestDiscovery = discoveries.data?.items?.[0];

    return (
      <Flex direction="column" gap={24}>
        <BackLink to={`/slates/${slateId}/versions`}>
          Back to {slateData.name || slateData.identifier} versions
        </BackLink>

        <Group.Wrapper>
          <Group.Header title={`Version ${versionData.version}`} />
          <Group.Content>
            <InfoRow>
              <InfoLabel>Version ID</InfoLabel>
              <InfoValue>
                <Flex align="center" gap={6}>
                  <MonoCode>{versionData.id}</MonoCode>
                  <InlineCopy value={versionData.id} />
                </Flex>
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Version</InfoLabel>
              <InfoValue>
                <Flex align="center" gap={8}>
                  <Badge color="blue">v{versionData.version}</Badge>
                  {versionData.isCurrent && (
                    <Badge color="green" size="1">
                      Current
                    </Badge>
                  )}
                </Flex>
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Status</InfoLabel>
              <InfoValue>
                <Badge color={versionStatusColors[versionData.status] || 'gray'}>
                  {versionData.status}
                </Badge>
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Slate</InfoLabel>
              <InfoValue>
                <TextLink to={`/slates/${slateId}`}>
                  {slateData.name || slateData.identifier}
                </TextLink>
              </InfoValue>
            </InfoRow>
          </Group.Content>
        </Group.Wrapper>

        <Flex gap={12}>
          {latestDeployment && (
            <Link to={`/slates/${slateId}/deployments/${latestDeployment.id}`}>
              <Button as="span" variant="outline">
                Latest Deployment
                <Badge
                  color={
                    latestDeployment.status === 'succeeded'
                      ? 'green'
                      : latestDeployment.status === 'failed'
                        ? 'red'
                        : 'blue'
                  }
                  size="1"
                  style={{ marginLeft: 8 }}
                >
                  {latestDeployment.status}
                </Badge>
              </Button>
            </Link>
          )}

          {latestDiscovery && (
            <Link
              to={`/slates/${slateId}/versions/${versionId}/discoveries/${latestDiscovery.id}`}
            >
              <Button as="span" variant="outline">
                Latest Discovery
                <Badge
                  color={latestDiscovery.status === 'succeeded' ? 'green' : 'red'}
                  size="1"
                  style={{ marginLeft: 8 }}
                >
                  {latestDiscovery.status}
                </Badge>
              </Button>
            </Link>
          )}
        </Flex>

        {specification.isLoading ? (
          <Group.Wrapper>
            <Group.Content>
              <CenteredSpinner />
            </Group.Content>
          </Group.Wrapper>
        ) : specification.data ? (
          <SpecificationViewer specification={specification.data} />
        ) : !successfulDiscovery ? (
          <Group.Wrapper>
            <Group.Content>
              <Text size="2" color="gray600">
                No successful discovery found for this version. Tools and capabilities will be
                available after a successful discovery.
              </Text>
            </Group.Content>
          </Group.Wrapper>
        ) : null}
      </Flex>
    );
  });
};
