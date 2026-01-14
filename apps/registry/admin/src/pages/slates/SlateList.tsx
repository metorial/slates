import { Link, useNavigate, useParams } from 'react-router-dom';
import { renderWithPagination } from '@metorial-io/data-hooks';
import { Button, Text, Title, Badge, Flex, Spacer, Group } from '@metorial-io/ui';
import { useSlates } from '../../hooks';
import {
  EmptyState,
  ListItemLink,
  TableHeaderRow,
  SlateLogoImage,
  SlateLogoPlaceholder
} from '../../components/styled';

export let SlateList = () => {
  let navigate = useNavigate();
  let { tenantId } = useParams<{ tenantId: string }>();
  let slates = useSlates(tenantId);

  let emptyState = (
    <EmptyState direction="column" align="center">
      <Title size="4" weight="strong">
        No slates found
      </Title>
      <Spacer size={8} />
      <Text size="2" color="gray600">
        This tenant doesn't have any slates yet.
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
            Slates are versioned packages published to this registry. Each slate belongs to a
            scope (user or workspace).
          </Text>
        </div>
        <Button onClick={() => navigate(`/tenants/${tenantId}/slates/new`)}>
          + New Slate
        </Button>
      </Flex>

      <Group.Wrapper>
        <Group.HeaderRow>
          <TableHeaderRow>
            <Flex style={{ flex: 1 }}>Slate</Flex>
            <Flex style={{ width: 140 }}>Version</Flex>
            <Flex style={{ width: 120 }}>Access</Flex>
            <Flex style={{ width: 100 }}>Actions</Flex>
          </TableHeaderRow>
        </Group.HeaderRow>
        {renderWithPagination(slates, { emptyState })(({ data }) => {
          let items = data.items;

          return (
            <>
              {items.map(slate => (
                <ListItemLink key={slate.id} to={`/tenants/${tenantId}/slates/${slate.id}`}>
                  <Group.Row style={{ padding: '16px 20px', cursor: 'pointer' }}>
                    <Flex align="center">
                      <Flex align="center" gap={14} style={{ flex: 1 }}>
                        {slate.logoUrl ? (
                          <SlateLogoImage src={slate.logoUrl} alt="" />
                        ) : (
                          <SlateLogoPlaceholder align="center" justify="center">
                            S
                          </SlateLogoPlaceholder>
                        )}
                        <Flex direction="column">
                          <Text size="2" weight="strong">
                            {slate.name}
                          </Text>
                          <Text size="1" color="gray600">
                            {slate.fullIdentifier}
                          </Text>
                        </Flex>
                      </Flex>
                      <Flex align="center" style={{ width: 140 }}>
                        <Badge color="blue">v{slate.currentVersion?.version ?? '-'}</Badge>
                      </Flex>
                      <Flex align="center" style={{ width: 120 }}>
                        <Badge color={slate.access === 'public' ? 'green' : 'gray'}>
                          {slate.access}
                        </Badge>
                      </Flex>
                      <Flex align="center" style={{ width: 100 }}>
                        <Link to={`/tenants/${tenantId}/slates/${slate.id}/publish`}>
                          <Button as="span">Publish</Button>
                        </Link>
                      </Flex>
                    </Flex>
                  </Group.Row>
                </ListItemLink>
              ))}
            </>
          );
        })}
      </Group.Wrapper>
    </Flex>
  );
};
