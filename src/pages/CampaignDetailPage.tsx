import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { campaignService } from "@/services/campaignService";
import { installmentService } from "@/services/installmentService";
import { companyService } from "@/services/companyService";
import { contactService } from "@/services/contactService";
import { mediumService } from "@/services/mediumService";
import {
  CampaignWithActions,
  CampaignInstallment,
  Company,
  Contact,
  Medium,
} from "@/types";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { FormInput } from "@/components/FormInput";
import { MultiSelect } from "@/components/MultiSelect";
import { HierarchicalActionsModal } from "@/components/HierarchicalActionsModal";
import { InstallmentsModal } from "@/components/InstallmentsModal";
import { useAuthStore } from "@/stores/authStore";
import { canEditCampaign } from "@/utils/permissions";

export const CampaignDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [campaign, setCampaign] = useState<CampaignWithActions | null>(null);
  const [installments, setInstallments] = useState<CampaignInstallment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [isInstallmentsModalOpen, setIsInstallmentsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [selectedMediumIds, setSelectedMediumIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
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

  useEffect(() => {
    if (id) {
      loadCampaignData();
      loadCompanies();
      loadContacts();
      loadMediums();
    }
  }, [id]);

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      const [campaignData, installmentsData] = await Promise.all([
        campaignService.getById(Number(id)),
        installmentService.getInstallmentsByCampaign(Number(id)),
      ]);
      setCampaign(campaignData);
      setInstallments(installmentsData);
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al cargar la campaña");
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

  const handleOpenEditModal = () => {
    if (!campaign) return;

    setFormData({
      name: campaign.name,
      description: campaign.description || "",
      company_id: campaign.company_id.toString(),
      contact_id: campaign.contact_id.toString(),
      total_amount: campaign.total_amount?.toString() || "",
      number_of_installments: campaign.number_of_installments?.toString() || "",
      currency: campaign.currency || "EUR",
      billing_zone: campaign.billing_zone || "",
      comments: campaign.comments || "",
    });

    const mediumIds = campaign.mediums?.map((m: any) => m.medium_id) || [];
    setSelectedMediumIds(mediumIds);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign) return;

    setSubmitting(true);
    setError("");

    try {
      const campaignData = {
        ...formData,
        company_id: Number(formData.company_id),
        contact_id: Number(formData.contact_id),
        total_amount: formData.total_amount
          ? Number(formData.total_amount)
          : undefined,
        number_of_installments: formData.number_of_installments
          ? Number(formData.number_of_installments)
          : undefined,
      };

      await campaignService.update(campaign.id, campaignData);

      if (selectedMediumIds.length > 0) {
        await campaignService.assignMediums(campaign.id, selectedMediumIds);
      }

      await loadCampaignData();
      setIsEditModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al actualizar la campaña");
    } finally {
      setSubmitting(false);
    }
  };

  const handleManageActions = () => {
    setIsActionsModalOpen(true);
  };

  const handleManageInstallments = () => {
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
    if (!campaign) return;

    try {
      await campaignService.assignActions(campaign.id, actions);
      // Reload campaign data
      const updatedCampaign = await campaignService.getById(campaign.id);
      setCampaign(updatedCampaign);
      setIsActionsModalOpen(false);
    } catch (err: any) {
      console.error("Error saving actions:", err);
      throw err;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-gray-100 text-gray-800",
      paid: "bg-green-100 text-green-800",
      overdue: "bg-red-100 text-red-800",
    };
    const labels = {
      pending: "Pendiente",
      in_progress: "En Progreso",
      completed: "Completada",
      cancelled: "Cancelada",
      paid: "Pagada",
      overdue: "Vencida",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: campaign?.currency || "EUR",
    }).format(amount);
  };

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("es-ES");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Cargando campaña...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error || "Campaña no encontrada"}
        </div>
        <Button variant="secondary" onClick={() => navigate("/campaigns")}>
          ← Volver a Campañas
        </Button>
      </div>
    );
  }

  const totalPaid = installments
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const totalInstallments = installments.reduce(
    (sum, i) => sum + Number(i.amount),
    0,
  );

  const completedActions =
    campaign.actions?.filter((a) => a.status === "completed").length || 0;
  const totalActions = campaign.actions?.length || 0;

  const availableContacts = formData.company_id
    ? contacts.filter((c) => c.company_id === parseInt(formData.company_id))
    : contacts;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="secondary"
          onClick={() => navigate("/campaigns")}
          className="mb-4"
        >
          ← Volver a Campañas
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {campaign.name}
            </h1>
            {campaign.description && (
              <p className="text-gray-600 mt-1">{campaign.description}</p>
            )}
          </div>
          {canEditCampaign(user, campaign.created_by) && (
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleOpenEditModal}>
                ✏️ Editar
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">
            Monto Total
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(campaign.total_amount)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Pagado</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalPaid)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {campaign.total_amount
              ? Math.round((totalPaid / campaign.total_amount) * 100)
              : 0}
            % completado
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Cuotas</div>
          <div className="text-2xl font-bold text-gray-900">
            {installments.filter((i) => i.status === "paid").length} /{" "}
            {installments.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">pagadas</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Acciones</div>
          <div className="text-2xl font-bold text-gray-900">
            {completedActions} / {totalActions}
          </div>
          <div className="text-xs text-gray-500 mt-1">completadas</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* General Info */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Información General
              </h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Empresa:</span>
                <span className="font-medium">{campaign.company_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Contacto:</span>
                <span className="font-medium">
                  {campaign.contact_name} {campaign.contact_surname}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Zona de Facturación:</span>
                <span className="font-medium">
                  {campaign.billing_zone || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Moneda:</span>
                <span className="font-medium">{campaign.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Creado por:</span>
                <span className="font-medium">{campaign.created_by_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha de creación:</span>
                <span className="font-medium">
                  {formatDate(campaign.created_at)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                {campaign.completed ? (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    ✓ Completada
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    ⏳ En Progreso
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Mediums */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Medios Asignados
              </h2>
            </div>
            <div className="px-6 py-4">
              {campaign.mediums && campaign.mediums.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {campaign.mediums.map((medium) => (
                    <span
                      key={medium.id}
                      className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium"
                    >
                      📡 {medium.medium_name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No hay medios asignados</p>
              )}
            </div>
          </div>

          {/* Installments */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Cuotas ({installments.length})
              </h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleManageInstallments}
              >
                Gestionar
              </Button>
            </div>
            <div className="px-6 py-4">
              {installments.length > 0 ? (
                <div className="space-y-3">
                  {installments
                    .sort((a, b) => a.installment_number - b.installment_number)
                    .map((installment) => (
                      <div
                        key={installment.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            Cuota #{installment.installment_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            Vence: {formatDate(installment.due_date)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            {formatCurrency(Number(installment.amount))}
                          </div>
                          <div className="mt-1">
                            {getStatusBadge(installment.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">
                  No hay cuotas registradas
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Actions */}
        <div>
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Acciones ({totalActions})
              </h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleManageActions}
              >
                Gestionar
              </Button>
            </div>
            <div className="px-6 py-4">
              {campaign.actions && campaign.actions.length > 0 ? (
                <div className="space-y-4">
                  {/* Group by medium */}
                  {Array.from(
                    new Set(campaign.actions.map((a) => a.medium_id)),
                  ).map((mediumId) => {
                    const mediumActions = campaign.actions!.filter(
                      (a) => a.medium_id === mediumId,
                    );
                    const mediumName =
                      mediumActions[0]?.medium_name || "Sin medio";

                    return (
                      <div key={mediumId} className="border rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">
                          📡 {mediumName}
                        </h3>
                        <div className="space-y-2">
                          {mediumActions.map((action) => (
                            <div
                              key={action.id}
                              className="flex items-start justify-between p-3 bg-gray-50 rounded border border-gray-200"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs text-gray-500">
                                    📺 {action.channel_name}
                                  </span>
                                </div>
                                <div className="font-medium text-sm text-gray-900">
                                  ⚡ {action.action_name}
                                </div>
                                {(action.start_date || action.end_date) && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    {action.start_date &&
                                      `${formatDate(action.start_date)}`}
                                    {action.start_date &&
                                      action.end_date &&
                                      " → "}
                                    {action.end_date &&
                                      `${formatDate(action.end_date)}`}
                                  </div>
                                )}
                                {action.notes && (
                                  <div className="text-xs text-gray-500 mt-1 italic">
                                    {action.notes}
                                  </div>
                                )}
                              </div>
                              <div className="ml-3">
                                {getStatusBadge(action.status)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">
                  No hay acciones asignadas
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {campaign.comments && (
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Comentarios</h2>
          </div>
          <div className="px-6 py-4">
            <p className="text-gray-700 whitespace-pre-wrap">
              {campaign.comments}
            </p>
          </div>
        </div>
      )}

      {/* Modals */}
      {campaign && (
        <>
          <HierarchicalActionsModal
            campaignId={campaign.id}
            campaignName={campaign.name}
            campaignMediumIds={campaign.mediums?.map((m) => m.medium_id) || []}
            isOpen={isActionsModalOpen}
            onClose={() => setIsActionsModalOpen(false)}
            onSave={handleSaveActions}
            initialActions={campaign.actions || []}
          />
          <InstallmentsModal
            campaign={campaign}
            isOpen={isInstallmentsModalOpen}
            onClose={() => {
              setIsInstallmentsModalOpen(false);
              loadCampaignData(); // Reload to get updated installments
            }}
          />
          <Modal
            isOpen={isEditModalOpen}
            onClose={handleCloseEditModal}
            title="Editar Campaña"
            size="lg"
          >
            <form onSubmit={handleSubmitEdit} className="space-y-4">
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
                <Button type="button" onClick={handleCloseEditModal}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Guardando..." : "Actualizar"}
                </Button>
              </div>
            </form>
          </Modal>
        </>
      )}
    </div>
  );
};
