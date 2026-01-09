import { Link, Outlet, useLocation } from 'react-router-dom';
import { Flex, Text, Spacer } from '@metorial-io/ui';
import { useTenantContext } from '../context/TenantContext';
import { TenantSelector } from './TenantSelector';

let globalNavItems = [
  { path: '/tenants', label: 'Tenants' }
];

let tenantNavItems = [
  { path: '/sub-registries', label: 'Sub-Registries' },
  { path: '/workspaces', label: 'Workspaces' },
  { path: '/slates', label: 'Slates' }
];

export function Layout() {
  let location = useLocation();
  let { selectedTenant } = useTenantContext();

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

        <Flex
          direction="column"
          style={{
            padding: 20,
            borderBottom: '1px solid #e8e8e8'
          }}
        >
          <Text size="1" color="gray600" weight="medium" transform="uppercase" style={{ letterSpacing: 1, marginBottom: 10 }}>
            Active Tenant
          </Text>
          <TenantSelector />
        </Flex>

        <Flex direction="column" style={{ flex: 1, padding: '20px 12px' }} gap={4}>
          <Text size="1" color="gray600" weight="medium" transform="uppercase" style={{ letterSpacing: 1, padding: '0 12px', marginBottom: 8 }}>
            Global
          </Text>
          {globalNavItems.map(item => {
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

          <Spacer size={20} />

          <Text size="1" color="gray600" weight="medium" transform="uppercase" style={{ letterSpacing: 1, padding: '0 12px', marginBottom: 8 }}>
            Tenant Resources
          </Text>
          {tenantNavItems.map(item => {
            let isDisabled = !selectedTenant;
            let isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={isDisabled ? '#' : item.path}
                style={{
                  display: 'block',
                  padding: '10px 12px',
                  fontSize: 14,
                  fontWeight: 450,
                  color: isDisabled ? '#ccc' : isActive ? '#111' : '#666',
                  background: isActive ? '#e8e8e8' : 'transparent',
                  borderRadius: 8,
                  textDecoration: 'none',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  pointerEvents: isDisabled ? 'none' : 'auto',
                  transition: 'all 0.15s ease'
                }}
                title={isDisabled ? 'Select a tenant first' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
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
