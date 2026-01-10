import { Link, useNavigate, useParams } from 'react-router-dom';
import { renderWithLoader } from '@metorial-io/data-hooks';
import { Button, Text, Title, Badge, Flex, Spacer, Group } from '@metorial-io/ui';
import { useSlates } from '../../api/hooks';

export let SlateList = () => {
  let navigate = useNavigate();
  let { tenantId } = useParams<{ tenantId: string }>();
  let slates = useSlates(tenantId);

  return renderWithLoader({ slates })(({ slates }) => {
    let items = slates.data?.items ?? [];

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

        {items.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            style={{
              padding: '80px 40px',
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}
          >
            <Title size="4" weight="strong">No slates found</Title>
            <Spacer size={8} />
            <Text size="2" color="gray600">This tenant doesn't have any slates yet.</Text>
          </Flex>
        ) : (
          <Group.Wrapper>
            <Group.HeaderRow>
              <Flex style={{ fontWeight: 600, fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                <div style={{ flex: 1 }}>Slate</div>
                <div style={{ width: 140 }}>Version</div>
                <div style={{ width: 120 }}>Access</div>
                <div style={{ width: 100 }}>Actions</div>
              </Flex>
            </Group.HeaderRow>
            {items.map(slate => (
              <Link
                key={slate.id}
                to={`/tenants/${tenantId}/slates/${slate.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Group.Row style={{ padding: '16px 20px', cursor: 'pointer' }}>
                  <Flex align="center">
                    <Flex align="center" gap={14} style={{ flex: 1 }}>
                      {slate.logoUrl ? (
                        <img
                          src={slate.logoUrl}
                          alt=""
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            objectFit: 'cover',
                            background: '#f1f5f9'
                          }}
                        />
                      ) : (
                        <Flex
                          align="center"
                          justify="center"
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                            fontSize: 16,
                            color: '#94a3b8'
                          }}
                        >
                          S
                        </Flex>
                      )}
                      <Flex direction="column">
                        <Text size="2" weight="strong">{slate.name}</Text>
                        <Text size="1" color="gray600">{slate.fullIdentifier}</Text>
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
                      <Link
                        to={`/tenants/${tenantId}/slates/${slate.id}/publish`}
                        onClick={e => e.stopPropagation()}
                        style={{
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 500,
                          color: '#3b82f6',
                          background: '#eff6ff',
                          borderRadius: 6,
                          textDecoration: 'none'
                        }}
                      >
                        Publish
                      </Link>
                    </Flex>
                  </Flex>
                </Group.Row>
              </Link>
            ))}
          </Group.Wrapper>
        )}
      </Flex>
    );
  });
}
