import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { companyService } from "@/services/companyService";
import { contactService } from "@/services/contactService";
import { mediumService } from "@/services/mediumService";
import { channelService } from "@/services/channelService";
import { actionService } from "@/services/actionService";
import { campaignService } from "@/services/campaignService";

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState({
    companies: 0,
    contacts: 0,
    mediums: 0,
    channels: 0,
    actions: 0,
    campaigns: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [companies, contacts, mediums, channels, actions, campaigns] =
        await Promise.all([
          companyService.getAll(),
          contactService.getAll(),
          mediumService.getAll(),
          channelService.getAll(),
          actionService.getAll(),
          campaignService.getAll(),
        ]);

      setStats({
        companies: companies.length,
        contacts: contacts.length,
        mediums: mediums.length,
        channels: channels.length,
        actions: actions.length,
        campaigns: campaigns.length,
      });
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-8">Bienvenido, {user?.name}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/companies"
          className="card hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Empresas</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? "..." : stats.companies}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏢</span>
            </div>
          </div>
        </Link>

        <Link to="/contacts" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Contactos</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? "..." : stats.contacts}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </Link>

        <Link to="/mediums" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Medios</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? "..." : stats.mediums}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📺</span>
            </div>
          </div>
        </Link>

        <Link to="/channels" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Canales</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? "..." : stats.channels}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📡</span>
            </div>
          </div>
        </Link>

        <Link to="/actions" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Acciones</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? "..." : stats.actions}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
          </div>
        </Link>

        <Link
          to="/campaigns"
          className="card hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Campañas</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? "..." : stats.campaigns}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-8 card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Información del Sistema
        </h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <span className="font-medium">Usuario:</span> {user?.name} (
            {user?.email})
          </p>
          <p>
            <span className="font-medium">Rol:</span> {user?.role_name}
          </p>
          <p>
            <span className="font-medium">Última actualización:</span>{" "}
            {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};
