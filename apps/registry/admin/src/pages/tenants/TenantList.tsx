import { Link, useNavigate } from 'react-router-dom';
import { Button, Spinner, Text, Title, Flex, Spacer, Group } from '@metorial-io/ui';
import { useTenants } from '../../api/hooks';

export let TenantList = () => {
  let navigate = useNavigate();
  let { data, isLoading, error } = useTenants();

  if (isLoading) {
    return (
      <Flex justify="center" align="center" style={{ padding: 80 }}>
        <Spinner size={32} />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex
        style={{
          padding: '16px 20px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 8,
          color: '#dc2626',
          fontSize: 14
        }}
      >
        Error loading tenants: {String(error)}
      </Flex>
    );
  }

  let tenants = data?.items ?? [];

  return (
    <Flex direction="column" gap={24}>
      <Flex justify="space-between" align="center">
        <div>
          <Title size="6" weight="strong">Tenants</Title>
          <Spacer size={4} />
          <Text size="2" color="gray600">Manage your organization tenants</Text>
        </div>
        <Button onClick={() => navigate('/tenants/new')}>
          + Create Tenant
        </Button>
      </Flex>

      {tenants.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          style={{
            padding: '80px 40px',
            background: '#fff',
            borderRadius: 8,
            border: '1px solid #e8e8e8',
            textAlign: 'center'
          }}
        >
          <Title size="4" weight="strong">No tenants yet</Title>
          <Spacer size={8} />
          <Text size="2" color="gray600">
            Create your first tenant to get started with Slates.
          </Text>
          <Spacer size={24} />
          <Button onClick={() => navigate('/tenants/new')}>
            + Create Tenant
          </Button>
        </Flex>
      ) : (
        <Group.Wrapper>
          {tenants.map(tenant => (
            <Link
              key={tenant.id}
              to={`/tenants/${tenant.id}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <Flex
                align="center"
                justify="space-between"
                style={{ padding: '14px 20px' }}
              >
                <Flex align="center" gap={14}>
                  <Flex
                    align="center"
                    justify="center"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: '#f0f0f0',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#666'
                    }}
                  >
                    {tenant.name.charAt(0).toUpperCase()}
                  </Flex>
                  <div>
                    <Text size="2" weight="medium">{tenant.name}</Text>
                    <Text size="1" color="gray600" style={{ fontFamily: 'monospace' }}>
                      {tenant.identifier}
                    </Text>
                  </div>
                </Flex>
                <Text size="1" color="gray500">
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </Text>
              </Flex>
            </Link>
          ))}
        </Group.Wrapper>
      )}
    </Flex>
  );
}
