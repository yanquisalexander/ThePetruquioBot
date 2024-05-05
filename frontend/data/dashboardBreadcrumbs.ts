/*
    TODO: internationalize breadcrumbs Labels (Maybe a function on the component)
*/

export const DASHBOARD_BREADCRUMBS = [
    {
        path: "/dashboard",
        crumbs: [
            {
                label: "Dashboard",
                icon: "i-mdi-view-dashboard-outline",
                to: "/dashboard"
            }
        ]
    },
    {
        path: "/dashboard/commands",
        crumbs: [
            {
                label: "Dashboard",
                icon: "i-mdi-view-dashboard-outline",
                to: "/dashboard"
            },
            {
                label: "Commands",
                icon: "i-mdi-message-fast-outline"
            }
        ]
    },
    {
        path: "/dashboard/preferences",
        crumbs: [
            {
                label: "Dashboard",
                icon: "i-mdi-view-dashboard-outline",
                to: "/dashboard"
            },
            {
                label: "Configuración",
                icon: "i-mdi-cog-outline",
                to: "/dashboard/preferences"
            }
        ]
    },
    {
        path: "/dashboard/stream-manager",
        crumbs: [
            {
                label: "Dashboard",
                icon: "i-mdi-view-dashboard-outline",
                to: "/dashboard"
            },
            {
                label: "Stream Manager",
                icon: "i-lucide-clapperboard",
                to: "/dashboard/stream-manager"
            }
        ]
    }
];
