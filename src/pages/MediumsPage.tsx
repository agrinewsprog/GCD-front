import { useState, useEffect } from "react";
import { mediumService } from "@/services/mediumService";
import { channelService } from "@/services/channelService";
import { Medium, Channel, MediumWithChannels } from "@/types";
import { Modal } from "@/components/Modal";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MultiSelect } from "@/components/MultiSelect";

export const MediumsPage = () => {
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isChannelsModalOpen, setIsChannelsModalOpen] = useState(false);
  const [editingMedium, setEditingMedium] = useState<Medium | null>(null);
  const [deletingMedium, setDeletingMedium] = useState<Medium | null>(null);
  const [selectedMedium, setSelectedMedium] =
    useState<MediumWithChannels | null>(null);
  const [selectedChannelIds, setSelectedChannelIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({ name: "" });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadMediums();
    loadChannels();
  }, []);

  const loadMediums = async () => {
    try {
      setLoading(true);
      const data = await mediumService.getAll();
      setMediums(data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al cargar medios");
    } finally {
      setLoading(false);
    }
  };

  const loadChannels = async () => {
    try {
      const data = await channelService.getAll();
      setChannels(data);
    } catch (err: any) {
      console.error("Error al cargar canales:", err);
    }
  };

  const handleOpenModal = (medium?: Medium) => {
    if (medium) {
      setEditingMedium(medium);
      setFormData({ name: medium.name });
    } else {
      setEditingMedium(null);
      setFormData({ name: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMedium(null);
    setFormData({ name: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingMedium) {
        await mediumService.update(editingMedium.id, formData);
      } else {
        await mediumService.create(formData);
      }
      await loadMediums();
      handleCloseModal();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          `Error al ${editingMedium ? "actualizar" : "crear"} medio`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (medium: Medium) => {
    setDeletingMedium(medium);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMedium) return;

    try {
      await mediumService.delete(deletingMedium.id);
      await loadMediums();
      setIsDeleteDialogOpen(false);
      setDeletingMedium(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al eliminar medio");
      setIsDeleteDialogOpen(false);
    }
  };

  const handleManageChannels = async (medium: Medium) => {
    try {
      const mediumData = await mediumService.getById(medium.id);
      setSelectedMedium(mediumData);
      // Si no tiene canales asignados, seleccionar todos por defecto
      const assignedChannelIds = mediumData.channels?.map((c) => c.id) || [];
      setSelectedChannelIds(
        assignedChannelIds.length > 0
          ? assignedChannelIds
          : channels.map((c) => c.id),
      );
      setIsChannelsModalOpen(true);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Error al cargar canales del medio",
      );
    }
  };

  const handleSaveChannels = async () => {
    if (!selectedMedium) return;
    setSubmitting(true);

    try {
      await mediumService.assignChannels(selectedMedium.id, selectedChannelIds);
      await loadMediums();
      setIsChannelsModalOpen(false);
      setSelectedMedium(null);
      setSelectedChannelIds([]);
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al asignar canales");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMediums = mediums.filter((medium) =>
    medium.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medios</h1>
          <p className="text-gray-600 mt-1">
            Gestiona los medios de comunicación
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>+ Nuevo Medio</Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Cargando medios...</p>
        </div>
      ) : mediums.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-6xl mb-4 block">📺</span>
          <p className="text-gray-600">No hay medios registrados</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar medios..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="card">
            {filteredMediums.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No se encontraron medios</p>
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
                        Fecha Creación
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMediums.map((medium) => (
                      <tr
                        key={medium.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 text-gray-600">{medium.id}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {medium.name}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(medium.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleManageChannels(medium)}
                            className="text-blue-600 hover:text-blue-700 mr-3"
                          >
                            Canales
                          </button>
                          <button
                            onClick={() => handleOpenModal(medium)}
                            className="text-primary-600 hover:text-primary-700 mr-3"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteClick(medium)}
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
            )}
          </div>
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingMedium ? "Editar Medio" : "Nuevo Medio"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Nombre"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nombre del medio"
            required
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
                : editingMedium
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
        title="Eliminar Medio"
        message={`¿Estás seguro de que deseas eliminar el medio "${deletingMedium?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
      />

      <Modal
        isOpen={isChannelsModalOpen}
        onClose={() => {
          setIsChannelsModalOpen(false);
          setSelectedMedium(null);
          setSelectedChannelIds([]);
        }}
        title={`Gestionar Canales - ${selectedMedium?.name}`}
      >
        <div className="space-y-4">
          <MultiSelect
            label="Selecciona los canales para este medio"
            options={channels.map((c) => ({ value: c.id, label: c.name }))}
            selected={selectedChannelIds}
            onChange={setSelectedChannelIds}
          />

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsChannelsModalOpen(false);
                setSelectedMedium(null);
                setSelectedChannelIds([]);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveChannels} disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
