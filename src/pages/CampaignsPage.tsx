import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { campaignService } from "@/services/campaignService";
import { companyService } from "@/services/companyService";
import { contactService } from "@/services/contactService";
import { mediumService } from "@/services/mediumService";
import { actionService } from "@/services/actionService";
import {
  Campaign,
  Company,
  Contact,
  Medium,
  Action,
  CampaignWithActions,
} from "@/types";
import { Modal } from "@/components/Modal";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MultiSelect } from "@/components/MultiSelect";
import { InstallmentsModal } from "@/components/InstallmentsModal";
import { HierarchicalActionsModal } from "@/components/HierarchicalActionsModal";
import { useAuthStore } from "@/stores/authStore";
import {
  canEditCampaign,
  canDeleteCampaign,
  canCreateCampaigns,
  isAdmin,
} from "@/utils/permissions";

export const CampaignsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [isInstallmentsModalOpen, setIsInstallmentsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(
    null,
  );
  const [selectedCampaign, setSelectedCampaign] =
    useState<CampaignWithActions | null>(null);
  const [selectedMediumIds, setSelectedMediumIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    company_id: "",
    contact_id: "",
    total_amount: "",
    number_of_installments: "",
    currency: "EUR",
    billing_zone: "",
    comments: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    // Load all data in parallel for better performance
    Promise.all([
      loadCampaigns(),
      loadCompanies(),
      loadContacts(),
      loadMediums(),
      loadActions(),
    ]).catch(console.error);
  }, []);

  // Check for edit query param and open modal
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && campaigns.length > 0) {
      const campaignToEdit = campaigns.find((c) => c.id === Number(editId));
      if (campaignToEdit) {
        handleOpenModal(campaignToEdit);
        // Remove the query param
        searchParams.delete("edit");
        setSearchParams(searchParams);
      }
    }
  }, [searchParams, campaigns]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await campaignService.getAll();
      setCampaigns(data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al cargar campañas");
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const data = await companyService.getAll();
      setCompanies(data);
    } catch (err: any) {
      console.error("Error al cargar empresas:", err);
    }
  };

  const loadContacts = async () => {
    try {
      const data = await contactService.getAll();
      setContacts(data);
    } catch (err: any) {
      console.error("Error al cargar contactos:", err);
    }
  };

  const loadMediums = async () => {
    try {
      const data = await mediumService.getAll();
      setMediums(data);
    } catch (err: any) {
      console.error("Error al cargar medios:", err);
    }
  };

  const loadActions = async () => {
    try {
      const data = await actionService.getAll();
      setActions(data);
    } catch (err: any) {
      console.error("Error al cargar acciones:", err);
    }
  };

  const handleOpenModal = async (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        name: campaign.name,
        description: campaign.description || "",
        company_id: campaign.company_id.toString(),
        contact_id: campaign.contact_id.toString(),
        total_amount: campaign.total_amount?.toString() || "",
        number_of_installments:
          campaign.number_of_installments?.toString() || "",
        currency: campaign.currency || "EUR",
        billing_zone: campaign.billing_zone || "",
        comments: campaign.comments || "",
      });

      // Load mediums for this campaign
      try {
        const campaignData = await campaignService.getById(campaign.id);
        const mediumIds =
          campaignData.mediums?.map((m: any) => m.medium_id) || [];
        setSelectedMediumIds(mediumIds);
      } catch (err) {
        console.error("Error loading campaign mediums:", err);
        setSelectedMediumIds([]);
      }
    } else {
      setEditingCampaign(null);
      setFormData({
        name: "",
        description: "",
        company_id: "",
        contact_id: "",
        total_amount: "",
        number_of_installments: "",
        currency: "EUR",
        billing_zone: "",
        comments: "",
      });
      setSelectedMediumIds([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCampaign(null);
    setSelectedMediumIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...formData,
        company_id: parseInt(formData.company_id),
        contact_id: parseInt(formData.contact_id),
        medium_ids: selectedMediumIds,
        total_amount: formData.total_amount
          ? parseFloat(formData.total_amount)
          : undefined,
        number_of_installments: formData.number_of_installments
          ? parseInt(formData.number_of_installments)
          : undefined,
      };

      if (editingCampaign) {
        await campaignService.update(editingCampaign.id, payload);
        setSuccess("Campaña actualizada correctamente");
      } else {
        await campaignService.create(payload);
        setSuccess("Campaña creada correctamente");
      }
      await loadCampaigns();
      handleCloseModal();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          `Error al ${editingCampaign ? "actualizar" : "crear"} campaña`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (campaign: Campaign) => {
    setDeletingCampaign(campaign);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCampaign) return;
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await campaignService.delete(deletingCampaign.id);
      await loadCampaigns();
      setSuccess("Campaña eliminada correctamente");
      setIsDeleteDialogOpen(false);
      setDeletingCampaign(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al eliminar campaña");
    } finally {
      setSubmitting(false);
    }
  };

  const handleManageActions = async (campaign: Campaign) => {
    try {
      const campaignData = await campaignService.getById(campaign.id);
      setSelectedCampaign(campaignData);
      setIsActionsModalOpen(true);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Error al cargar acciones de la campaña",
      );
    }
  };

  const handleManageInstallments = (campaign: Campaign) => {
    setSelectedCampaign(campaign as CampaignWithActions);
    setIsInstallmentsModalOpen(true);
  };

  const handleSaveActions = async (
    actions: Array<{
      medium_id: number;
      channel_id: number;
      action_id: number;
      start_date?: string;
      end_date?: string;
    }>,
  ) => {
    if (!selectedCampaign) return;
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await campaignService.assignActions(selectedCampaign.id, actions);
      // Reload campaign data to get updated actions with dates
      const updatedCampaign = await campaignService.getById(
        selectedCampaign.id,
      );
      setSelectedCampaign(updatedCampaign);
      await loadCampaigns();
      setSuccess("Acciones guardadas correctamente");
      setIsActionsModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al asignar acciones");
    } finally {
      setSubmitting(false);
    }
  };

  // rerender-derived-state: Memoize expensive filtering
  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter((campaign) => {
        const matchesSearch = campaign.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesStatus =
          !statusFilter ||
          (statusFilter === "completed" && campaign.completed) ||
          (statusFilter === "active" && !campaign.completed);
        const matchesCompany =
          !companyFilter || campaign.company_id === parseInt(companyFilter);
        return matchesSearch && matchesStatus && matchesCompany;
      }),
    [campaigns, searchTerm, statusFilter, companyFilter],
  );

  // rerender-derived-state: Memoize contact filtering
  const availableContacts = useMemo(
    () =>
      formData.company_id
        ? contacts.filter((c) => c.company_id === parseInt(formData.company_id))
        : contacts,
    [formData.company_id, contacts],
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campañas</h1>
          <p className="text-gray-600 mt-1">
            Gestiona las campañas de marketing
          </p>
        </div>
        {canCreateCampaigns(user) && (
          <Button onClick={() => handleOpenModal()}>+ Nueva Campaña</Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Cargando campañas...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-6xl mb-4 block">📊</span>
          <p className="text-gray-600">No hay campañas registradas</p>
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar campañas..."
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="completed">Completadas</option>
            </select>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todas las empresas</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div className="card">
            {filteredCampaigns.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No se encontraron campañas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        ID
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Nombre
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Empresa
                      </th>
                      {isAdmin(user) && (
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Creado por
                        </th>
                      )}
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Estado
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Fecha
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.map((campaign) => (
                      <tr
                        key={campaign.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 text-gray-600">
                          {campaign.id}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {campaign.name}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {campaign.company_name}
                        </td>
                        {isAdmin(user) && (
                          <td className="py-3 px-4 text-gray-600">
                            {campaign.created_by_name || "—"}
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              campaign.completed
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {campaign.completed ? "Completada" : "Activa"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(campaign.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() =>
                              navigate(`/campaigns/${campaign.id}`)
                            }
                            className="text-gray-600 hover:text-gray-700 mr-3 font-medium"
                          >
                            👁️ Ver
                          </button>
                          <button
                            onClick={() => handleManageActions(campaign)}
                            className="text-blue-600 hover:text-blue-700 mr-3"
                          >
                            Acciones
                          </button>
                          <button
                            onClick={() => handleManageInstallments(campaign)}
                            className="text-purple-600 hover:text-purple-700 mr-3"
                          >
                            Cuotas
                          </button>
                          {canEditCampaign(user, campaign.created_by) && (
                            <button
                              onClick={() => handleOpenModal(campaign)}
                              className="text-primary-600 hover:text-primary-700 mr-3"
                            >
                              Editar
                            </button>
                          )}
                          {canDeleteCampaign(user, campaign.created_by) && (
                            <button
                              onClick={() => handleDeleteClick(campaign)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Eliminar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCampaign ? "Editar Campaña" : "Nueva Campaña"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormInput
                label="Nombre"
                name="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nombre de la campaña"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descripción de la campaña"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa *
              </label>
              <select
                value={formData.company_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    company_id: e.target.value,
                    contact_id: "",
                  })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Seleccionar empresa</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contacto *
              </label>
              <select
                value={formData.contact_id}
                onChange={(e) =>
                  setFormData({ ...formData, contact_id: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={!formData.company_id}
              >
                <option value="">Seleccionar contacto</option>
                {availableContacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} {contact.surname}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <MultiSelect
                label="Medios"
                options={mediums.map((medium) => ({
                  value: medium.id,
                  label: medium.name,
                }))}
                selected={selectedMediumIds}
                onChange={setSelectedMediumIds}
                placeholder="Seleccionar medios..."
              />
            </div>

            <FormInput
              label="Importe Total"
              name="total_amount"
              type="number"
              step="0.01"
              value={formData.total_amount}
              onChange={(e) =>
                setFormData({ ...formData, total_amount: e.target.value })
              }
              placeholder="0.00"
            />

            <FormInput
              label="Número de Cuotas"
              name="number_of_installments"
              type="number"
              value={formData.number_of_installments}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  number_of_installments: e.target.value,
                })
              }
              placeholder="1"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moneda
              </label>
              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="BRL">BRL</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zona de Facturación
              </label>
              <select
                value={formData.billing_zone}
                onChange={(e) =>
                  setFormData({ ...formData, billing_zone: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar...</option>
                <option value="Spain">España</option>
                <option value="Global">Global</option>
                <option value="Brazil">Brasil</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentarios
              </label>
              <textarea
                value={formData.comments}
                onChange={(e) =>
                  setFormData({ ...formData, comments: e.target.value })
                }
                placeholder="Comentarios adicionales"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Guardando..."
                : editingCampaign
                  ? "Actualizar"
                  : "Crear"}
            </Button>
          </div>
        </form>
      </Modal>

      {selectedCampaign && (
        <HierarchicalActionsModal
          campaignId={selectedCampaign.id}
          campaignName={selectedCampaign.name}
          campaignMediumIds={
            selectedCampaign.mediums?.map((m) => m.medium_id) || []
          }
          isOpen={isActionsModalOpen}
          onClose={() => setIsActionsModalOpen(false)}
          onSave={handleSaveActions}
          initialActions={selectedCampaign.actions || []}
        />
      )}

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Campaña"
        message={`¿Estás seguro de que quieres eliminar la campaña "${deletingCampaign?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isLoading={submitting}
      />

      {selectedCampaign && (
        <InstallmentsModal
          campaign={selectedCampaign}
          isOpen={isInstallmentsModalOpen}
          onClose={() => setIsInstallmentsModalOpen(false)}
        />
      )}
    </div>
  );
};
