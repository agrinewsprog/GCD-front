import { useState, useEffect } from "react";
import { contactService } from "@/services/contactService";
import { companyService } from "@/services/companyService";
import { Contact, Company } from "@/types";
import { Modal } from "@/components/Modal";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export const ContactsPage = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    company_id: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadContacts();
    loadCompanies();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await contactService.getAll();
      setContacts(data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al cargar contactos");
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

  const handleOpenModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name,
        surname: contact.surname,
        email: contact.email || "",
        phone: contact.phone || "",
        company_id: contact.company_id.toString(),
      });
    } else {
      setEditingContact(null);
      setFormData({
        name: "",
        surname: "",
        email: "",
        phone: "",
        company_id: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
    setFormData({
      name: "",
      surname: "",
      email: "",
      phone: "",
      company_id: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        surname: formData.surname,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        company_id: parseInt(formData.company_id),
      };

      if (editingContact) {
        await contactService.update(editingContact.id, payload);
      } else {
        await contactService.create(payload);
      }
      await loadContacts();
      handleCloseModal();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          `Error al ${editingContact ? "actualizar" : "crear"} contacto`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (contact: Contact) => {
    setDeletingContact(contact);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingContact) return;

    try {
      await contactService.delete(deletingContact.id);
      await loadContacts();
      setIsDeleteDialogOpen(false);
      setDeletingContact(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al eliminar contacto");
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contactos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona los contactos del sistema
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>+ Nuevo Contacto</Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Cargando contactos...</p>
        </div>
      ) : contacts.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-6xl mb-4 block">👥</span>
          <p className="text-gray-600">No hay contactos registrados</p>
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
                    Apellidos
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Teléfono
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Empresa
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-600">{contact.id}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {contact.name}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {contact.surname}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {contact.email || "-"}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {contact.phone || "-"}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {contact.company_name}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenModal(contact)}
                        className="text-primary-600 hover:text-primary-700 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteClick(contact)}
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
        title={editingContact ? "Editar Contacto" : "Nuevo Contacto"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Nombre"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nombre"
            required
          />

          <FormInput
            label="Apellidos"
            name="surname"
            value={formData.surname}
            onChange={(e) =>
              setFormData({ ...formData, surname: e.target.value })
            }
            placeholder="Apellidos"
            required
          />

          <FormInput
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="email@ejemplo.com"
          />

          <FormInput
            label="Teléfono"
            name="phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="+34 600 000 000"
          />

          <FormInput
            label="Empresa"
            name="company_id"
            value={formData.company_id}
            onChange={(e) =>
              setFormData({ ...formData, company_id: e.target.value })
            }
            required
            options={companies.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
          />

          <div className="flex justify-end gap-3 mt-6">
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
                : editingContact
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
        title="Eliminar Contacto"
        message={`¿Estás seguro de que deseas eliminar el contacto "${deletingContact?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
      />
    </div>
  );
};
