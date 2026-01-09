import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import { Flex, Text, Spacer } from '@metorial-io/ui';
import { useTenant } from '../api/hooks';

export let Layout = () => {
  let location = useLocation();
  let params = useParams<{ tenantId?: string }>();
  let tenantId = params.tenantId;

  let { data: tenant } = useTenant(tenantId ?? '');

  let isOnTenantPage = location.pathname.startsWith('/tenants') && tenantId;

  let tenantNavItems = [
    { path: `/tenants/${tenantId}/sub-registries`, label: 'Sub-Registries' },
    { path: `/tenants/${tenantId}/workspaces`, label: 'Workspaces' },
    { path: `/tenants/${tenantId}/slates`, label: 'Slates' }
  ];

  return (
    <Flex style={{ minHeight: '100vh' }}>
      <Flex
        direction="column"
        style={{
          width: 260,
          background: '#fafafa',
          borderRight: '1px solid #e8e8e8',
          flexShrink: 0
        }}
      >
        <Flex
          direction="column"
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid #e8e8e8'
          }}
        >
          <Flex align="center" gap={12}>
            <img
              src="https://cdn.brandfetch.io/idgJWIg5cr/theme/dark/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1762738932654"
              alt="Metorial"
              style={{ height: 24 }}
            />
          </Flex>
          <Spacer size={8} />
          <Text size="1" color="gray600">Admin Portal</Text>
        </Flex>

        <Flex direction="column" style={{ flex: 1, padding: '20px 12px' }} gap={4}>
          <Link
            to="/tenants"
            style={{
              display: 'block',
              padding: '10px 12px',
              fontSize: 14,
              fontWeight: 450,
              color: location.pathname === '/tenants' || location.pathname === '/tenants/new' ? '#111' : '#666',
              background: location.pathname === '/tenants' || location.pathname === '/tenants/new' ? '#e8e8e8' : 'transparent',
              borderRadius: 8,
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Tenants
          </Link>

          {isOnTenantPage && tenant && (
            <>
              <Spacer size={16} />
              <Text size="1" color="gray600" weight="medium" transform="uppercase" style={{ letterSpacing: 1, padding: '0 12px', marginBottom: 8 }}>
                {tenant.name}
              </Text>

              <Link
                to={`/tenants/${tenantId}`}
                style={{
                  display: 'block',
                  padding: '10px 12px',
                  fontSize: 14,
                  fontWeight: 450,
                  color: location.pathname === `/tenants/${tenantId}` ? '#111' : '#666',
                  background: location.pathname === `/tenants/${tenantId}` ? '#e8e8e8' : 'transparent',
                  borderRadius: 8,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Overview
              </Link>

              {tenantNavItems.map(item => {
                let isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{
                      display: 'block',
                      padding: '10px 12px',
                      fontSize: 14,
                      fontWeight: 450,
                      color: isActive ? '#111' : '#666',
                      background: isActive ? '#e8e8e8' : 'transparent',
                      borderRadius: 8,
                      textDecoration: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </Flex>
      </Flex>

      <Flex
        direction="column"
        style={{
          flex: 1,
          background: '#fff',
          overflowY: 'auto',
          minHeight: '100vh'
        }}
      >
        <div style={{ padding: '32px 40px', maxWidth: 1200 }}>
          <Outlet />
        </div>
      </Flex>
    </Flex>
  );
}
