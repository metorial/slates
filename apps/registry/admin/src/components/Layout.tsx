import { ExtraHeaderLayout, LargePaneLayout, SidebarPane } from '@metorial-io/layout';
import { Logo } from '@metorial-io/ui';
import {
  RiApps2Line,
  RiBuildingLine,
  RiDashboardLine,
  RiFileList3Line,
  RiStackLine,
  RiUserLine
} from '@remixicon/react';
import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useTenant } from '../api/hooks';

let Breadcrumbs = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
`;

let BreadcrumbLink = styled(Link)`
  color: #64748b;
  text-decoration: none;

  &:hover {
    color: #3b82f6;
  }
`;

let BreadcrumbSeparator = styled.span`
  color: #cbd5e1;
`;

let BreadcrumbCurrent = styled.span`
  font-weight: 600;
  color: #1e293b;
`;

function isExactMatch(pathname: string, to: string): boolean {
  return pathname === to;
}

function isPrefixMatch(pathname: string, to: string): boolean {
  return pathname === to || pathname.startsWith(to + '/');
}

export let Layout = () => {
  let { pathname } = useLocation();
  let { tenantId } = useParams<{ tenantId?: string }>();
  let { data: tenant } = useTenant(tenantId ?? '');

  let isOnTenantPage = pathname.startsWith('/tenants') && tenantId;

  let mainItems = [
    {
      icon: <RiBuildingLine />,
      label: 'Tenants',
      to: '/tenants',
      isActive: pathname === '/tenants' || pathname === '/tenants/new'
    }
  ];

  let tenantItems = tenantId
    ? [
        {
          icon: <RiDashboardLine />,
          label: 'Overview',
          to: `/tenants/${tenantId}`,
          isActive: isExactMatch(pathname, `/tenants/${tenantId}`)
        },
        {
          icon: <RiStackLine />,
          label: 'Sub-Registries',
          to: `/tenants/${tenantId}/sub-registries`,
          isActive: isPrefixMatch(pathname, `/tenants/${tenantId}/sub-registries`)
        },
        {
          icon: <RiApps2Line />,
          label: 'Workspaces',
          to: `/tenants/${tenantId}/workspaces`,
          isActive: isPrefixMatch(pathname, `/tenants/${tenantId}/workspaces`)
        },
        {
          icon: <RiUserLine />,
          label: 'Users',
          to: `/tenants/${tenantId}/users`,
          isActive: isPrefixMatch(pathname, `/tenants/${tenantId}/users`)
        },
        {
          icon: <RiFileList3Line />,
          label: 'Slates',
          to: `/tenants/${tenantId}/slates`,
          isActive: isPrefixMatch(pathname, `/tenants/${tenantId}/slates`)
        }
      ]
    : [];

  let allItems = [...mainItems, ...tenantItems];
  let currentItem = allItems.find(item => item.isActive);

  let groups = [{ label: 'Navigation', items: mainItems }];

  if (isOnTenantPage && tenant) {
    groups.push({
      label: tenant.name,
      items: tenantItems
    });
  }

  let breadcrumbHeader = (
    <Breadcrumbs>
      <BreadcrumbLink to="/tenants">Tenants</BreadcrumbLink>
      {isOnTenantPage && tenant && (
        <>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbLink to={`/tenants/${tenantId}`}>{tenant.name}</BreadcrumbLink>
          {currentItem && currentItem.label !== 'Overview' && (
            <>
              <BreadcrumbSeparator>/</BreadcrumbSeparator>
              <BreadcrumbCurrent>{currentItem.label}</BreadcrumbCurrent>
            </>
          )}
        </>
      )}
      {!isOnTenantPage && currentItem && (
        <>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbCurrent>{currentItem.label}</BreadcrumbCurrent>
        </>
      )}
    </Breadcrumbs>
  );

  return (
    <LargePaneLayout Nav={AdminNav}>
      <SidebarPane id="main" groups={groups}>
        <ExtraHeaderLayout header={breadcrumbHeader}>
          <div style={{ padding: 20 }}>
            <Outlet />
          </div>
        </ExtraHeaderLayout>
      </SidebarPane>
    </LargePaneLayout>
  );
};

let NavWrapper = styled.header`
  padding: 5px 15px 5px 5px;
`;

let NavContent = styled.nav`
  display: flex;
  align-items: center;
  height: 50px;
  gap: 10px;
  color: #222;

  h1 {
    font-size: 18px;
    margin: 0;
  }
`;

export let AdminNav = () => {
  return (
    <NavWrapper>
      <NavContent>
        <Logo size={30} />
        <h1>Metorial Admin</h1>
      </NavContent>
    </NavWrapper>
  );
};
