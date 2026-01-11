import { useNavigate, useParams } from 'react-router-dom';
import { renderWithPagination } from '@metorial-io/data-hooks';
import { Button, Text, Title, Badge, Flex, Spacer, Group } from '@metorial-io/ui';
import { styled } from 'styled-components';
import { useSlates } from '../../api/hooks';
import { EmptyState, ListItemLink, TableHeaderRow, SlateLogoImage, SlateLogoPlaceholder, ActionLink } from '../../components/styled';

let SlateRow = styled(Group.Row)`
  padding: 16px 20px;
  cursor: pointer;
`;

let SlateColumn = styled(Flex)<{ $width?: number }>`
  ${p => p.$width && `width: ${p.$width}px;`}
  ${p => !p.$width && `flex: 1;`}
`;

export let SlateList = () => {
  let navigate = useNavigate();
  let { tenantId } = useParams<{ tenantId: string }>();
  let slates = useSlates(tenantId);

  let emptyState = (
    <EmptyState direction="column" align="center">
      <Title size="4" weight="strong">No slates found</Title>
      <Spacer size={8} />
      <Text size="2" color="gray600">This tenant doesn't have any slates yet.</Text>
    </EmptyState>
  );

  return renderWithPagination(slates, { emptyState })(({ data }) => {
    let items = data.items;

    return (
      <Flex direction="column" gap={32}>
        <Flex justify="space-between" align="center">
          <div>
            <Title size="6" weight="strong">Slates</Title>
            <Spacer size={4} />
            <Text size="2" color="gray600">Slates are versioned packages published to this registry. Each slate belongs to a scope (user or workspace).</Text>
          </div>
          <Button onClick={() => navigate(`/tenants/${tenantId}/slates/new`)}>
            + New Slate
          </Button>
        </Flex>

        <Group.Wrapper>
          <Group.HeaderRow>
            <TableHeaderRow>
              <SlateColumn>Slate</SlateColumn>
              <SlateColumn $width={140}>Version</SlateColumn>
              <SlateColumn $width={120}>Access</SlateColumn>
              <SlateColumn $width={100}>Actions</SlateColumn>
            </TableHeaderRow>
          </Group.HeaderRow>
          {items.map(slate => (
            <ListItemLink key={slate.id} to={`/tenants/${tenantId}/slates/${slate.id}`}>
              <SlateRow>
                <Flex align="center">
                  <SlateColumn align="center" gap={14}>
                    {slate.logoUrl ? (
                      <SlateLogoImage src={slate.logoUrl} alt="" />
                    ) : (
                      <SlateLogoPlaceholder align="center" justify="center">
                        S
                      </SlateLogoPlaceholder>
                    )}
                    <Flex direction="column">
                      <Text size="2" weight="strong">{slate.name}</Text>
                      <Text size="1" color="gray600">{slate.fullIdentifier}</Text>
                    </Flex>
                  </SlateColumn>
                  <SlateColumn align="center" $width={140}>
                    <Badge color="blue">v{slate.currentVersion?.version ?? '-'}</Badge>
                  </SlateColumn>
                  <SlateColumn align="center" $width={120}>
                    <Badge color={slate.access === 'public' ? 'green' : 'gray'}>
                      {slate.access}
                    </Badge>
                  </SlateColumn>
                  <SlateColumn align="center" $width={100}>
                    <ActionLink
                      to={`/tenants/${tenantId}/slates/${slate.id}/publish`}
                      onClick={e => e.stopPropagation()}
                    >
                      Publish
                    </ActionLink>
                  </SlateColumn>
                </Flex>
              </SlateRow>
            </ListItemLink>
          ))}
        </Group.Wrapper>
      </Flex>
    );
  });
}
