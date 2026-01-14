import { renderWithPagination } from '@metorial-io/data-hooks';
import { Badge, Flex, Group, Spacer, Text, Title } from '@metorial-io/ui';
import { styled } from 'styled-components';
import { versionStatusColors } from '../../constants/statusColors.js';
import { useSlates } from '../../state/index.js';
import {
  EmptyState,
  ListItemLink,
  SlateLogoPlaceholder,
  TableHeaderRow
} from '../../components/styled.js';

let SlateIcon = styled(SlateLogoPlaceholder)`
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  font-weight: 600;
`;

export let SlateList = () => {
  let slates = useSlates();

  let emptyState = (
    <EmptyState direction="column" align="center">
      <Title size="4" weight="strong">
        No slates found
      </Title>
      <Spacer size={8} />
      <Text size="2" color="gray600">
        No slates have been registered in the hub yet.
      </Text>
    </EmptyState>
  );

  return (
    <Flex direction="column" gap={32}>
      <Flex justify="space-between" align="center">
        <div>
          <Title size="6" weight="strong">
            Slates
          </Title>
          <Spacer size={4} />
          <Text size="2" color="gray600">
            All slates registered in the hub. View versions, deployments, and events.
          </Text>
        </div>
      </Flex>

      {renderWithPagination(slates, { emptyState })(({ data }) => {
        let items = data.items;

        return (
          <Group.Wrapper>
            <Group.HeaderRow>
              <TableHeaderRow>
                <Flex style={{ flex: 1 }}>Slate</Flex>
                <Flex style={{ width: 120 }}>Version</Flex>
                <Flex style={{ width: 120 }}>Status</Flex>
              </TableHeaderRow>
            </Group.HeaderRow>
            {items.map(slate => {
              let displayName = slate.name || slate.identifier;
              let initial = displayName.charAt(0).toUpperCase();

              return (
                <ListItemLink key={slate.id} to={`/slates/${slate.id}`}>
                  <Group.Row style={{ padding: '16px 20px', cursor: 'pointer' }}>
                    <Flex align="center">
                      <Flex align="center" gap={14} style={{ flex: 1 }}>
                        <SlateIcon align="center" justify="center">
                          {initial}
                        </SlateIcon>
                        <Flex direction="column">
                          <Text size="2" weight="strong">
                            {displayName}
                          </Text>
                          <Text size="1" color="gray600">
                            {slate.slate?.fullIdentifier || slate.identifier}
                          </Text>
                        </Flex>
                      </Flex>
                      <Flex style={{ width: 120 }}>
                        {slate.currentVersion ? (
                          <Badge color="blue">v{slate.currentVersion.version}</Badge>
                        ) : (
                          <Text size="2" color="gray500">
                            -
                          </Text>
                        )}
                      </Flex>
                      <Flex style={{ width: 120 }}>
                        <Badge
                          color={
                            slate.currentVersion?.status
                              ? versionStatusColors[slate.currentVersion.status] || 'gray'
                              : 'gray'
                          }
                        >
                          {slate.currentVersion?.status ?? 'no version'}
                        </Badge>
                      </Flex>
                    </Flex>
                  </Group.Row>
                </ListItemLink>
              );
            })}
          </Group.Wrapper>
        );
      })}
    </Flex>
  );
};
