import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { canManageMasterData, isAdmin } from "@/utils/permissions";

export const MainLayout = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  // Definir items de navegación con permisos
  const allNavItems = [
    { path: "/", label: "Dashboard", icon: "📊", requiresPermission: null },
    {
      path: "/companies",
      label: "Empresas",
      icon: "🏢",
      requiresPermission: canManageMasterData,
    },
    {
      path: "/contacts",
      label: "Contactos",
      icon: "👥",
      requiresPermission: canManageMasterData,
    },
    {
      path: "/mediums",
      label: "Medios",
      icon: "📺",
      requiresPermission: canManageMasterData,
    },
    {
      path: "/channels",
      label: "Canales",
      icon: "📡",
      requiresPermission: canManageMasterData,
    },
    {
      path: "/actions",
      label: "Acciones",
      icon: "⚡",
      requiresPermission: canManageMasterData,
    },
    {
      path: "/campaigns",
      label: "Campañas",
      icon: "🎯",
      requiresPermission: null,
    },
    {
      path: "/newsletters",
      label: "Newsletters",
      icon: "📧",
      requiresPermission: canManageMasterData,
    },
    {
      path: "/revistas",
      label: "Revistas",
      icon: "📰",
      requiresPermission: null,
    },
    {
      path: "/usuarios",
      label: "Usuarios",
      icon: "👤",
      requiresPermission: isAdmin,
    },
  ];

  // Filtrar items según permisos
  const navItems = allNavItems.filter((item) => {
    if (!item.requiresPermission) return true;
    return item.requiresPermission(user);
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-primary-700">GCD</h1>
          <p className="text-xs text-gray-600 mt-1">Gestión de Campañas</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 font-medium">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.roles?.join(", ") || "Usuario"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
