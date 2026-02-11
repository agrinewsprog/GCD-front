import { useState, useEffect } from "react";
import { installmentService } from "@/services/installmentService";
import { CampaignInstallment, Campaign } from "@/types";
import { Modal } from "@/components/Modal";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface InstallmentsModalProps {
  campaign: Campaign;
  isOpen: boolean;
  onClose: () => void;
}

export const InstallmentsModal = ({
  campaign,
  isOpen,
  onClose,
}: InstallmentsModalProps) => {
  const [installments, setInstallments] = useState<CampaignInstallment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] =
    useState<CampaignInstallment | null>(null);
  const [deletingInstallment, setDeletingInstallment] =
    useState<CampaignInstallment | null>(null);
  const [formData, setFormData] = useState({
    installment_number: "",
    amount: "",
    due_date: "",
    status: "pending" as "pending" | "paid" | "overdue",
    paid_date: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadInstallments();
    }
  }, [isOpen, campaign.id]);

  const loadInstallments = async () => {
    try {
      setLoading(true);
      const data = await installmentService.getInstallmentsByCampaign(
        campaign.id,
      );
      setInstallments(data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al cargar cuotas");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (
      !confirm(
        "¿Generar cuotas automáticamente? Esto eliminará las cuotas existentes.",
      )
    ) {
      return;
    }

    try {
      setSubmitting(true);
      await installmentService.generateInstallments(campaign.id);
      await loadInstallments();
      setError("");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Error al generar cuotas automáticamente",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setEditingInstallment(null);
    setFormData({
      installment_number: (installments.length + 1).toString(),
      amount: "",
      due_date: "",
      status: "pending",
      paid_date: "",
      notes: "",
    });
    setIsFormOpen(true);
  };

  const openEditModal = (installment: CampaignInstallment) => {
    setEditingInstallment(installment);
    setFormData({
      installment_number: installment.installment_number.toString(),
      amount: installment.amount.toString(),
      due_date: installment.due_date.split("T")[0],
      status: installment.status,
      paid_date: installment.paid_date
        ? installment.paid_date.split("T")[0]
        : "",
      notes: installment.notes || "",
    });
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingInstallment(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.due_date) {
      setError("Por favor, completa los campos obligatorios");
      return;
    }

    try {
      setSubmitting(true);
      const data = {
        installment_number: parseInt(formData.installment_number),
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        status: formData.status,
        paid_date: formData.paid_date || undefined,
        notes: formData.notes || undefined,
      };

      if (editingInstallment) {
        await installmentService.updateInstallment(editingInstallment.id, data);
      } else {
        await installmentService.createInstallment(campaign.id, data);
      }

      await loadInstallments();
      closeFormModal();
      setError("");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          `Error al ${editingInstallment ? "actualizar" : "crear"} la cuota`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = (installment: CampaignInstallment) => {
    setDeletingInstallment(installment);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingInstallment(null);
  };

  const handleDelete = async () => {
    if (!deletingInstallment) return;

    try {
      await installmentService.deleteInstallment(deletingInstallment.id);
      await loadInstallments();
      closeDeleteDialog();
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al eliminar la cuota");
      closeDeleteDialog();
    }
  };

  const totalInstallments = installments.reduce(
    (sum, inst) => sum + Number(inst.amount),
    0,
  );
  const campaignTotal = Number(campaign.total_amount) || 0;
  const isBalanced = Math.abs(totalInstallments - campaignTotal) < 0.01;

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      overdue: "bg-red-100 text-red-800",
    };
    const labels = {
      pending: "Pendiente",
      paid: "Pagado",
      overdue: "Vencido",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Cuotas - ${campaign.name}`}
        size="xl"
      >
        <div className="space-y-4">
          {/* Header with summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Campaña</p>
                <p className="text-xl font-bold">
                  {campaignTotal.toFixed(2)} {campaign.currency || "EUR"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Cuotas</p>
                <p
                  className={`text-xl font-bold ${!isBalanced ? "text-red-600" : ""}`}
                >
                  {totalInstallments.toFixed(2)} {campaign.currency || "EUR"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <p
                  className={`text-sm font-medium ${isBalanced ? "text-green-600" : "text-red-600"}`}
                >
                  {isBalanced ? "✓ Balanceado" : "⚠ Desbalanceado"}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={openCreateModal} disabled={submitting}>
              + Nueva Cuota
            </Button>
            <Button
              onClick={handleGenerate}
              variant="secondary"
              disabled={submitting || !campaign.number_of_installments}
            >
              🔄 Generar Automáticamente
            </Button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Installments table */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Cargando cuotas...</p>
            </div>
          ) : installments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay cuotas registradas
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Importe
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha Vencimiento
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha Pago
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {installments.map((installment) => (
                    <tr key={installment.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        {installment.installment_number}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                        {Number(installment.amount).toFixed(2)}{" "}
                        {campaign.currency || "EUR"}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        {new Date(installment.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {getStatusBadge(installment.status)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        {installment.paid_date
                          ? new Date(installment.paid_date).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => openEditModal(installment)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => openDeleteDialog(installment)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* Create/Edit Installment Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        title={editingInstallment ? "Editar Cuota" : "Nueva Cuota"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Número de Cuota"
              type="number"
              value={formData.installment_number}
              onChange={(e) =>
                setFormData({ ...formData, installment_number: e.target.value })
              }
              required
              min="1"
            />

            <FormInput
              label="Importe"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Fecha de Vencimiento"
              type="date"
              value={formData.due_date}
              onChange={(e) =>
                setFormData({ ...formData, due_date: e.target.value })
              }
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "pending" | "paid" | "overdue",
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pendiente</option>
                <option value="paid">Pagado</option>
                <option value="overdue">Vencido</option>
              </select>
            </div>
          </div>

          {formData.status === "paid" && (
            <FormInput
              label="Fecha de Pago"
              type="date"
              value={formData.paid_date}
              onChange={(e) =>
                setFormData({ ...formData, paid_date: e.target.value })
              }
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={closeFormModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Guardando..."
                : editingInstallment
                  ? "Actualizar"
                  : "Crear"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Eliminar Cuota"
        message={`¿Estás seguro de que quieres eliminar la cuota #${deletingInstallment?.installment_number}?`}
      />
    </>
  );
};
