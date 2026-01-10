import { ExtraHeaderLayout, LargePaneLayout, SidebarPane } from '@metorial-io/layout';
import { Logo } from '@metorial-io/ui';
import {
  RiApps2Line,
  RiBuildingLine,
  RiDashboardLine,
  RiFileList3Line,
  RiStackLine
} from '@remixicon/react';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useTenant } from '../api/hooks';

let getProps = ({ pathname, to }: { pathname: string; to: string }) => ({
  isActive: pathname === to || pathname.startsWith(to + '/')
});

export let Layout = () => {
  let { pathname } = useLocation();
  let params = useParams<{ tenantId?: string }>();
  let tenantId = params.tenantId;

  let { data: tenant } = useTenant(tenantId ?? '');

  let isOnTenantPage = pathname.startsWith('/tenants') && tenantId;

  let mainItems = [
    {
      icon: <RiBuildingLine />,
      label: 'Tenants',
      to: '/tenants',
      getProps: ({ pathname }: { pathname: string; to: string }) => ({
        isActive: pathname === '/tenants' || pathname === '/tenants/new'
      })
    }
  ];

  let tenantItems = tenantId
    ? [
        {
          icon: <RiDashboardLine />,
          label: 'Overview',
          to: `/tenants/${tenantId}`,
          getProps: ({ pathname }: { pathname: string; to: string }) => ({
            isActive: pathname === `/tenants/${tenantId}`
          })
        },
        {
          icon: <RiStackLine />,
          label: 'Sub-Registries',
          to: `/tenants/${tenantId}/sub-registries`,
          getProps
        },
        {
          icon: <RiApps2Line />,
          label: 'Workspaces',
          to: `/tenants/${tenantId}/workspaces`,
          getProps
        },
        {
          icon: <RiFileList3Line />,
          label: 'Slates',
          to: `/tenants/${tenantId}/slates`,
          getProps
        }
      ]
    : [];

  let allItems = [...mainItems, ...tenantItems];
  let currentItem = allItems.find(
    item => item.getProps({ pathname, to: item.to }).isActive
  );

  let groups = [{ label: 'Navigation', items: mainItems }];

  if (isOnTenantPage && tenant) {
    groups.push({
      label: tenant.name,
      items: tenantItems
    });
  }

  return (
    <LargePaneLayout Nav={AdminNav}>
      <SidebarPane id="main" groups={groups}>
        <ExtraHeaderLayout
          header={
            <div style={{ fontWeight: 'bold' }}>
              {currentItem?.label ?? 'Metorial Admin'}
            </div>
          }
        >
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
