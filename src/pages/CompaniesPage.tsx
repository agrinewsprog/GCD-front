import { useState, useEffect } from "react";
import { companyService } from "@/services/companyService";
import { Company } from "@/types";
import { Modal } from "@/components/Modal";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export const CompaniesPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    billing_address: "",
    billing_postal_code: "",
    billing_city: "",
    billing_province: "",
    billing_country: "",
    tax_number: "",
    iban: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyService.getAll();
      setCompanies(data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al cargar empresas");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name,
        billing_address: company.billing_address || "",
        billing_postal_code: company.billing_postal_code || "",
        billing_city: company.billing_city || "",
        billing_province: company.billing_province || "",
        billing_country: company.billing_country || "",
        tax_number: company.tax_number || "",
        iban: company.iban || "",
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: "",
        billing_address: "",
        billing_postal_code: "",
        billing_city: "",
        billing_province: "",
        billing_country: "",
        tax_number: "",
        iban: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCompany(null);
    setFormData({
      name: "",
      billing_address: "",
      billing_postal_code: "",
      billing_city: "",
      billing_province: "",
      billing_country: "",
      tax_number: "",
      iban: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingCompany) {
        await companyService.update(editingCompany.id, formData);
      } else {
        await companyService.create(formData);
      }
      await loadCompanies();
      handleCloseModal();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          `Error al ${editingCompany ? "actualizar" : "crear"} empresa`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (company: Company) => {
    setDeletingCompany(company);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCompany) return;

    try {
      await companyService.delete(deletingCompany.id);
      await loadCompanies();
      setIsDeleteDialogOpen(false);
      setDeletingCompany(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al eliminar empresa");
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Empresas</h1>
          <p className="text-gray-600 mt-1">
            Gestiona las empresas del sistema
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>+ Nueva Empresa</Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Cargando empresas...</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-6xl mb-4 block">🏢</span>
          <p className="text-gray-600">No hay empresas registradas</p>
        </div>
      ) : (
        <div className="card">
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
                    Ciudad
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    País
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    CIF/NIF
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Fecha Creación
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr
                    key={company.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-600">{company.id}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {company.name}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {company.billing_city || "-"}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {company.billing_country || "-"}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {company.tax_number || "-"}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(company.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenModal(company)}
                        className="text-primary-600 hover:text-primary-700 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteClick(company)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCompany ? "Editar Empresa" : "Nueva Empresa"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <FormInput
                label="Nombre de la Empresa"
                name="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nombre comercial"
                required
              />
            </div>

            <div className="md:col-span-2">
              <FormInput
                label="Dirección de Facturación"
                name="billing_address"
                value={formData.billing_address}
                onChange={(e) =>
                  setFormData({ ...formData, billing_address: e.target.value })
                }
                placeholder="Calle, número, piso, etc."
              />
            </div>

            <FormInput
              label="Código Postal"
              name="billing_postal_code"
              value={formData.billing_postal_code}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  billing_postal_code: e.target.value,
                })
              }
              placeholder="28001"
            />

            <FormInput
              label="Ciudad"
              name="billing_city"
              value={formData.billing_city}
              onChange={(e) =>
                setFormData({ ...formData, billing_city: e.target.value })
              }
              placeholder="Madrid"
            />

            <FormInput
              label="Provincia"
              name="billing_province"
              value={formData.billing_province}
              onChange={(e) =>
                setFormData({ ...formData, billing_province: e.target.value })
              }
              placeholder="Madrid"
            />

            <FormInput
              label="País"
              name="billing_country"
              value={formData.billing_country}
              onChange={(e) =>
                setFormData({ ...formData, billing_country: e.target.value })
              }
              placeholder="España"
            />

            <FormInput
              label="CIF/NIF"
              name="tax_number"
              value={formData.tax_number}
              onChange={(e) =>
                setFormData({ ...formData, tax_number: e.target.value })
              }
              placeholder="B12345678"
            />

            <FormInput
              label="IBAN"
              name="iban"
              value={formData.iban}
              onChange={(e) =>
                setFormData({ ...formData, iban: e.target.value })
              }
              placeholder="ES00 0000 0000 0000 0000 0000"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Guardando..."
                : editingCompany
                  ? "Actualizar"
                  : "Crear"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Empresa"
        message={`¿Estás seguro de que deseas eliminar la empresa "${deletingCompany?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
      />
    </div>
  );
};
