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
import { Link, useParams } from 'react-router-dom';
import { deploymentStatusColors } from '../../constants/statusColors.js';
import { useBuildOutput, useSlate, useSlateDeployment } from '../../state/index.js';
import { BackLink } from '../../components/BackLink.js';
import {
  InfoLabel,
  InfoRow,
  InfoValue,
  LogViewer,
  MonoCode,
  TextLink
} from '../../components/styled.js';

export let DeploymentDetail = () => {
  let { slateId, deploymentId } = useParams<{ slateId: string; deploymentId: string }>();
  let slate = useSlate(slateId);
  let deployment = useSlateDeployment(slateId, deploymentId);
  let buildOutput = useBuildOutput(slateId, deploymentId);

  return renderWithLoader({ slate, deployment })(({ slate, deployment }) => {
    let slateData = slate.data!;
    let deploymentData = deployment.data!;

    return (
      <Flex direction="column" gap={24}>
        <BackLink to={`/slates/${slateId}`}>
          Back to {slateData.name || slateData.identifier}
        </BackLink>

        <Group.Wrapper>
          <Group.Header title="Deployment Details" />
          <Group.Content>
            <InfoRow>
              <InfoLabel>Deployment ID</InfoLabel>
              <InfoValue>
                <Flex align="center" gap={6}>
                  <MonoCode>{deploymentData.id}</MonoCode>
                  <InlineCopy value={deploymentData.id} />
                </Flex>
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Status</InfoLabel>
              <InfoValue>
                <Badge color={deploymentStatusColors[deploymentData.status] || 'gray'}>
                  {deploymentData.status}
                </Badge>
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Version</InfoLabel>
              <InfoValue>
                <Flex align="center" gap={8}>
                  {deploymentData.version?.id ? (
                    <Link
                      to={`/slates/${slateId}/versions/${deploymentData.version.id}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <Badge color="blue">v{deploymentData.version?.version ?? '-'}</Badge>
                    </Link>
                  ) : (
                    <Badge color="blue">v{deploymentData.version?.version ?? '-'}</Badge>
                  )}
                  {deploymentData.version?.isCurrent && (
                    <Badge color="green" size="1">
                      Current
                    </Badge>
                  )}
                </Flex>
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
            <InfoRow>
              <InfoLabel>Created</InfoLabel>
              <InfoValue>
                <RenderDate date={deploymentData.createdAt} />
              </InfoValue>
            </InfoRow>
          </Group.Content>
        </Group.Wrapper>

        {deploymentData.error && (
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
                  <Badge color="red">{deploymentData.error.code}</Badge>
                </Flex>
                <Text size="2">{deploymentData.error.message}</Text>
              </Flex>
            </Group.Content>
          </Group.Wrapper>
        )}

        <Group.Wrapper>
          <Flex
            align="center"
            justify="space-between"
            style={{ padding: '12px 20px', borderBottom: '1px solid #e5e7eb' }}
          >
            <Text size="2" weight="medium">
              Build Output
            </Text>
            {buildOutput.data?.output && <InlineCopy value={buildOutput.data.output} />}
          </Flex>
          <Group.Content>
            {buildOutput.isLoading ? (
              <CenteredSpinner />
            ) : buildOutput.error ? (
              <Text size="2" color="gray600">
                Build output not available.
              </Text>
            ) : buildOutput.data?.output ? (
              <LogViewer>{buildOutput.data.output}</LogViewer>
            ) : (
              <Text size="2" color="gray600">
                No build output available yet.
              </Text>
            )}
          </Group.Content>
        </Group.Wrapper>
      </Flex>
    );
  });
};
