
import { NavItemType } from '@/components/ui/BottomNav';

export const MERCHANDISER_NAV_ITEMS: NavItemType[] = [
    { icon: 'home', label: 'Home', route: '/merchandiser/dashboard' },
    { icon: 'calendar', label: 'Planning', route: '/merchandiser/planning' },
    { icon: 'stats-chart', label: 'Reports', route: '/merchandiser/reports' },
    { icon: 'person', label: 'Profile', route: '/merchandiser/profile' },
];

export const SUPERVISOR_NAV_ITEMS: NavItemType[] = [
    { icon: 'home', label: 'Overview', route: '/supervisor/dashboard' },
    { icon: 'people', label: 'Team', route: '/supervisor/team' },
    { icon: 'map', label: 'Map', route: '/supervisor/map' },
    { icon: 'person', label: 'Profile', route: '/supervisor/profile' },
];

export const ADMIN_NAV_ITEMS: NavItemType[] = [
    { icon: 'flash', label: 'Overview', route: '/admin/dashboard' },
    { icon: 'people', label: 'Users', route: '/admin/users' },
    { icon: 'storefront', label: 'Stores', route: '/admin/gms' },
    { icon: 'calendar', label: 'Planning', route: '/admin/planning' },
    { icon: 'person', label: 'Profile', route: '/admin/profile' },
];
