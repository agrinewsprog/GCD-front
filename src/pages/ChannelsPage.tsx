import { useState, useEffect } from "react";
import { channelService } from "@/services/channelService";
import { actionService } from "@/services/actionService";
import { mediumService } from "@/services/mediumService";
import {
  Channel,
  Action,
  ChannelWithActions,
  ChannelWithMediums,
  Medium,
} from "@/types";
import { Modal } from "@/components/Modal";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MultiSelect } from "@/components/MultiSelect";

export const ChannelsPage = () => {
  const [channels, setChannels] = useState<ChannelWithMediums[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [deletingChannel, setDeletingChannel] = useState<Channel | null>(null);
  const [selectedChannel, setSelectedChannel] =
    useState<ChannelWithActions | null>(null);
  const [selectedActionIds, setSelectedActionIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({ name: "" });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMediumFilter, setSelectedMediumFilter] = useState<string>("");

  useEffect(() => {
    loadChannels();
    loadActions();
    loadMediums();
  }, []);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const data = await channelService.getAll();
      setChannels(data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al cargar canales");
    } finally {
      setLoading(false);
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

  const loadMediums = async () => {
    try {
      const data = await mediumService.getAll();
      setMediums(data);
    } catch (err: any) {
      console.error("Error al cargar medios:", err);
    }
  };

  const handleOpenModal = (channel?: Channel) => {
    if (channel) {
      setEditingChannel(channel);
      setFormData({ name: channel.name });
    } else {
      setEditingChannel(null);
      setFormData({ name: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingChannel(null);
    setFormData({ name: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingChannel) {
        await channelService.update(editingChannel.id, formData);
      } else {
        await channelService.create(formData);
      }
      await loadChannels();
      handleCloseModal();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          `Error al ${editingChannel ? "actualizar" : "crear"} canal`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (channel: Channel) => {
    setDeletingChannel(channel);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingChannel) return;

    try {
      await channelService.delete(deletingChannel.id);
      await loadChannels();
      setIsDeleteDialogOpen(false);
      setDeletingChannel(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al eliminar canal");
      setIsDeleteDialogOpen(false);
    }
  };

  const handleManageActions = async (channel: Channel) => {
    try {
      const channelData = await channelService.getById(channel.id);
      setSelectedChannel(channelData);
      // Si no tiene acciones asignadas, seleccionar todas por defecto
      const assignedActionIds = channelData.actions?.map((a) => a.id) || [];
      setSelectedActionIds(
        assignedActionIds.length > 0
          ? assignedActionIds
          : actions.map((a) => a.id),
      );
      setIsActionsModalOpen(true);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Error al cargar acciones del canal",
      );
    }
  };

  const handleSaveActions = async () => {
    if (!selectedChannel) return;
    setSubmitting(true);

    try {
      await channelService.assignActions(selectedChannel.id, selectedActionIds);
      await loadChannels();
      setIsActionsModalOpen(false);
      setSelectedChannel(null);
      setSelectedActionIds([]);
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al asignar acciones");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredChannels = channels.filter((channel) => {
    const matchesSearch = channel.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesMedium =
      !selectedMediumFilter ||
      channel.mediums?.some((m) => m.id === parseInt(selectedMediumFilter));
    return matchesSearch && matchesMedium;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Canales</h1>
          <p className="text-gray-600 mt-1">
            Gestiona los canales de comunicación
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>+ Nuevo Canal</Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Cargando canales...</p>
        </div>
      ) : channels.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-6xl mb-4 block">📡</span>
          <p className="text-gray-600">No hay canales registrados</p>
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar canales..."
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={selectedMediumFilter}
              onChange={(e) => setSelectedMediumFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los medios</option>
              {mediums.map((medium) => (
                <option key={medium.id} value={medium.id}>
                  {medium.name}
                </option>
              ))}
            </select>
          </div>
          <div className="card">
            {filteredChannels.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No se encontraron canales</p>
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
                        Medios
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
                    {filteredChannels.map((channel) => (
                      <tr
                        key={channel.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 text-gray-600">
                          {channel.id}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {channel.name}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <div
                            className="max-w-xs truncate"
                            title={
                              channel.mediums?.map((m) => m.name).join(", ") ||
                              "Sin asignar"
                            }
                          >
                            {channel.mediums && channel.mediums.length > 0
                              ? channel.mediums.map((m) => m.name).join(", ")
                              : "Sin asignar"}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(channel.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleManageActions(channel)}
                            className="text-blue-600 hover:text-blue-700 mr-3"
                          >
                            Acciones
                          </button>
                          <button
                            onClick={() => handleOpenModal(channel)}
                            className="text-primary-600 hover:text-primary-700 mr-3"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteClick(channel)}
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
        title={editingChannel ? "Editar Canal" : "Nuevo Canal"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Nombre"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nombre del canal"
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
                : editingChannel
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
        title="Eliminar Canal"
        message={`¿Estás seguro de que deseas eliminar el canal "${deletingChannel?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
      />

      <Modal
        isOpen={isActionsModalOpen}
        onClose={() => {
          setIsActionsModalOpen(false);
          setSelectedChannel(null);
          setSelectedActionIds([]);
        }}
        title={`Gestionar Acciones - ${selectedChannel?.name}`}
      >
        <div className="space-y-4">
          <MultiSelect
            label="Selecciona las acciones para este canal"
            options={actions.map((a) => ({ value: a.id, label: a.name }))}
            selected={selectedActionIds}
            onChange={setSelectedActionIds}
          />

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsActionsModalOpen(false);
                setSelectedChannel(null);
                setSelectedActionIds([]);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveActions} disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
