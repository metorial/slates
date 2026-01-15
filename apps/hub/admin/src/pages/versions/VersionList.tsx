import { renderWithPagination } from '@metorial-io/data-hooks';
import { Badge, Flex, Group, RenderDate, Spacer, Text, Title } from '@metorial-io/ui';
import { useParams } from 'react-router-dom';
import { versionStatusColors } from '../../constants/statusColors.js';
import { useSlate, useSlateVersions } from '../../state/index.js';
import { BackLink } from '../../components/BackLink.js';
import { EmptyState, ListItemLink, TableHeaderRow } from '../../components/styled.js';

export let VersionList = () => {
  let { slateId } = useParams<{ slateId: string }>();

  let slate = useSlate(slateId);
  let versions = useSlateVersions(slateId);

  let slateName = slate.data?.name || slate.data?.identifier;

  let emptyState = (
    <EmptyState direction="column" align="center">
      <Title size="4" weight="strong">
        No versions found
      </Title>
      <Spacer size={8} />
      <Text size="2" color="gray600">
        No versions have been created for this slate yet.
      </Text>
    </EmptyState>
  );

  return (
    <Flex direction="column" gap={32}>
      {slateId && (
        <BackLink to={`/slates/${slateId}`}>Back to {slateName || 'Slate'}</BackLink>
      )}

      <Flex justify="space-between" align="center">
        <div>
          <Title size="6" weight="strong">
            Versions for {slateName || 'Slate'}
          </Title>
          <Spacer size={4} />
          <Text size="2" color="gray600">
            All versions for this slate.
          </Text>
        </div>
      </Flex>

      {renderWithPagination(versions, { emptyState })(({ data }) => {
        let items = data.items;

        return (
          <Group.Wrapper>
            <Group.HeaderRow>
              <TableHeaderRow>
                <Flex style={{ flex: 1 }}>Version</Flex>
                <Flex style={{ width: 120 }}>Status</Flex>
                <Flex style={{ width: 100 }}>Current</Flex>
                <Flex style={{ width: 180 }}>Created</Flex>
              </TableHeaderRow>
            </Group.HeaderRow>

            {items.map(version => (
              <ListItemLink key={version.id} to={`/slates/${slateId}/versions/${version.id}`}>
                <Group.Row style={{ padding: '16px 20px', cursor: 'pointer' }}>
                  <Flex align="center">
                    <Flex style={{ flex: 1 }}>
                      <Text size="3" weight="bold" style={{ fontFamily: 'monospace' }}>
                        v{version.version}
                      </Text>
                    </Flex>
                    <Flex style={{ width: 120 }}>
                      <Badge color={versionStatusColors[version.status] || 'gray'}>
                        {version.status}
                      </Badge>
                    </Flex>
                    <Flex style={{ width: 100 }}>
                      {version.isCurrent ? (
                        <Badge color="green" size="1">
                          Current
                        </Badge>
                      ) : (
                        <Text size="2" color="gray600">
                          -
                        </Text>
                      )}
                    </Flex>
                    <Flex style={{ width: 180 }}>
                      <RenderDate date={version.createdAt} />
                    </Flex>
                  </Flex>
                </Group.Row>
              </ListItemLink>
            ))}
          </Group.Wrapper>
        );
      })}
    </Flex>
  );
};
