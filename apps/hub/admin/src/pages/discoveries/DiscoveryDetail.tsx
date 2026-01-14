import { renderWithLoader } from '@metorial-io/data-hooks';
import {
  Badge,
  CenteredSpinner,
  Flex,
  Group,
  InlineCopy,
  RenderDate,
  Text
} from '@metorial-io/ui';
import { useParams } from 'react-router-dom';
import { discoveryStatusColors } from '../../constants/statusColors.js';
import {
  useDiscoveryBuildOutput,
  useDiscoverySpecification,
  useDiscoveryToolCallStats,
  useSlateDiscovery
} from '../../state/index.js';
import { BackLink } from '../../components/BackLink.js';
import { InfoLabel, InfoRow, InfoValue, LogViewer, MonoCode, TextLink } from '../../components/styled.js';
import { SpecificationViewer } from '../../components/SpecificationViewer.js';

let formatBuildOutput = (buildOutput: any): string => {
  if (typeof buildOutput === 'string') {
    return buildOutput;
  }

  let logs = buildOutput.logs ?? buildOutput.output;
  if (Array.isArray(logs)) {
    return logs
      .map((entry: any) => {
        if (typeof entry === 'string') return entry;
        if (entry.message) return entry.message;
        return JSON.stringify(entry);
      })
      .join('\n');
  }

  if (typeof logs === 'string') {
    return logs;
  }

  return JSON.stringify(buildOutput, null, 2);
};

export let DiscoveryDetail = () => {
  let { slateId, versionId, discoveryId } = useParams<{
    slateId: string;
    versionId: string;
    discoveryId: string;
  }>();

  let discovery = useSlateDiscovery(slateId, versionId, discoveryId);
  let buildOutput = useDiscoveryBuildOutput(slateId, versionId, discoveryId);
  let specification = useDiscoverySpecification(slateId, versionId, discoveryId);
  let toolCallStats = useDiscoveryToolCallStats(slateId, versionId, discoveryId);

  return renderWithLoader({ discovery })(({ discovery }) => {
    let discoveryData = discovery.data!;

    return (
      <Flex direction="column" gap={24}>
        <BackLink to="/discoveries">Back to Discoveries</BackLink>

        <Group.Wrapper>
          <Group.Header title="Discovery Details" />
          <Group.Content>
            <InfoRow>
              <InfoLabel>Discovery ID</InfoLabel>
              <InfoValue>
                <Flex align="center" gap={6}>
                  <MonoCode>{discoveryData.id}</MonoCode>
                  <InlineCopy value={discoveryData.id} />
                </Flex>
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Slate</InfoLabel>
              <InfoValue>
                <TextLink to={`/slates/${discoveryData.slate?.id}`}>
                  {discoveryData.slate?.name ?? discoveryData.slate?.identifier ?? '-'}
                </TextLink>
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Status</InfoLabel>
              <InfoValue>
                <Badge color={discoveryStatusColors[discoveryData.status] || 'gray'} size="1">
                  {discoveryData.status}
                </Badge>
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Version</InfoLabel>
              <InfoValue>
                <Badge color="blue" size="1">
                  v{discoveryData.version?.version ?? '-'}
                </Badge>
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Created</InfoLabel>
              <InfoValue>
                <RenderDate date={discoveryData.createdAt} />
              </InfoValue>
            </InfoRow>
          </Group.Content>
        </Group.Wrapper>

        {discoveryData.error && (
          <Group.Wrapper>
            <Group.Header title="Error" />
            <Group.Content>
              <Flex
                direction="column"
                gap={12}
                style={{
                  padding: 16,
                  background: '#fef2f2',
                  borderRadius: 8,
                  border: '1px solid #fecaca'
                }}
              >
                <Flex align="center" gap={8}>
                  <Badge color="red">{discoveryData.error.code}</Badge>
                </Flex>
                <Text size="2" style={{ whiteSpace: 'pre-wrap' }}>
                  {discoveryData.error.message}
                </Text>
              </Flex>
            </Group.Content>
          </Group.Wrapper>
        )}

        {specification.isLoading ? (
          <Group.Wrapper>
            <Group.Content>
              <CenteredSpinner />
            </Group.Content>
          </Group.Wrapper>
        ) : specification.data ? (
          <SpecificationViewer specification={specification.data} toolCallStats={toolCallStats.data} />
        ) : null}

        <Group.Wrapper>
          <Group.Header title="Discovery Logs" />
          <Group.Content>
            {buildOutput.isLoading ? (
              <CenteredSpinner />
            ) : buildOutput.data ? (
              <LogViewer>{formatBuildOutput(buildOutput.data)}</LogViewer>
            ) : (
              <Text size="2" color="gray600">
                No logs available.
              </Text>
            )}
          </Group.Content>
        </Group.Wrapper>
      </Flex>
    );
  });
};
