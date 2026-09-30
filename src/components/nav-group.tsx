import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { SidebarNavGroup } from './app-shared';

/** Efferd App Shell 3 navigation, connected to the real AEVORI workspace. */
export function NavGroup({ label, items, defaultOpen = true }: SidebarNavGroup) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const active = items.some((item) => item.isActive);
  const [open, setOpen] = useState(defaultOpen || active);
  const compact = state === 'collapsed' && !isMobile;
  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);
  const menu = (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton
            tooltip={item.title}
            aria-label={item.title}
            isActive={item.isActive}
            aria-current={item.isActive ? 'page' : undefined}
            onClick={() => {
              setOpenMobile(false);
              item.onSelect();
            }}
          >
            {item.icon}
            <span>{item.title}</span>
            {!!item.badge && <small className="shell-nav-count">{item.badge}</small>}
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
  if (!label) return <SidebarGroup>{menu}</SidebarGroup>;
  return (
    <SidebarGroup>
      <Collapsible open={compact || open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="shell-group-heading">
          <span>{label}</span>
          <ChevronDown size={13} />
        </CollapsibleTrigger>
        <CollapsibleContent className="shell-group-content">{menu}</CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}
