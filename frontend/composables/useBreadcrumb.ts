interface Breadcrumb {
    label: string;
    icon: string;
    to: string;
}

export const DASHBOARD_BREADCRUMBS = [
    {
        id: 'dashboard',
        name: 'Dashboard',
        icon: 'i-lucide-layout-panel-top',
    },
    {
        id: 'commands',
        name: 'Commands',
        icon: 'i-mdi-message-fast-outline',
    },
    {
        id: 'preferences',
        name: 'Configuración',
        icon: 'i-lucide-settings-2',
    },
    {
        id: 'stream-manager',
        name: 'Stream Manager',
        icon: 'i-lucide-clapperboard',
    },
    {
        id: 'custom-widgets',
        name: 'Custom Widgets',
        icon: 'i-lucide-package-open',
    }
];

export const useBreadcrumb = () => {
    const buildBreadcrumb = (path: string): Breadcrumb[] => {
        const breadcrumbs: Breadcrumb[] = [];
        const paths = path.split('/').filter(fragment => fragment !== ''); // Eliminar fragmentos vacíos
        let currentPath = '';

        for (const fragment of paths) {
            currentPath += '/' + fragment;
            const crumb = DASHBOARD_BREADCRUMBS.find(item => item.id === fragment);
            if (crumb) {
                breadcrumbs.push({
                    label: crumb.name,
                    icon: crumb.icon,
                    to: currentPath,
                });
            }
        }

        console.log(breadcrumbs);
        return breadcrumbs;
    }

    return {
        buildBreadcrumb
    }
}
