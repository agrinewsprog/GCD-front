import { useState, useEffect } from "react";
import { actionService } from "@/services/actionService";
import { channelService } from "@/services/channelService";
import { Action, ActionWithChannels, Channel } from "@/types";
import { Modal } from "@/components/Modal";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export const ActionsPage = () => {
  const [actions, setActions] = useState<ActionWithChannels[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [deletingAction, setDeletingAction] = useState<Action | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    magazine_content_type?: "technical" | "ad" | null;
  }>({ name: "", magazine_content_type: null });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChannelFilter, setSelectedChannelFilter] =
    useState<string>("");

  useEffect(() => {
    loadActions();
    loadChannels();
  }, []);

  const loadActions = async () => {
    try {
      setLoading(true);
      const data = await actionService.getAll();
      setActions(data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al cargar acciones");
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

  const filteredActions = actions.filter((action) => {
    const matchesSearch = action.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesChannel =
      !selectedChannelFilter ||
      action.channels?.some((c) => c.id === parseInt(selectedChannelFilter));
    return matchesSearch && matchesChannel;
  });

  const handleOpenModal = (action?: Action) => {
    if (action) {
      setEditingAction(action);
      setFormData({
        name: action.name,
        magazine_content_type: action.magazine_content_type || null,
      });
    } else {
      setEditingAction(null);
      setFormData({ name: "", magazine_content_type: null });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAction(null);
    setFormData({ name: "", magazine_content_type: null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingAction) {
        await actionService.update(editingAction.id, formData);
      } else {
        await actionService.create(formData);
      }
      await loadActions();
      handleCloseModal();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          `Error al ${editingAction ? "actualizar" : "crear"} acción`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (action: Action) => {
    setDeletingAction(action);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAction) return;

    try {
      await actionService.delete(deletingAction.id);
      await loadActions();
      setIsDeleteDialogOpen(false);
      setDeletingAction(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al eliminar acción");
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Acciones</h1>
          <p className="text-gray-600 mt-1">
            Gestiona las acciones de marketing
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>+ Nueva Acción</Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Cargando acciones...</p>
        </div>
      ) : actions.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-6xl mb-4 block">⚡</span>
          <p className="text-gray-600">No hay acciones registradas</p>
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar acciones..."
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={selectedChannelFilter}
              onChange={(e) => setSelectedChannelFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los canales</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.name}
                </option>
              ))}
            </select>
          </div>
          <div className="card">
            {filteredActions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No se encontraron acciones</p>
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
                        Tipo
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Canales
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
                    {filteredActions.map((action) => (
                      <tr
                        key={action.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 text-gray-600">{action.id}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {action.name}
                        </td>
                        <td className="py-3 px-4">
                          {action.magazine_content_type ? (
                            <span
                              className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                                action.magazine_content_type === "technical"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-purple-100 text-purple-700"
                              }`}
                            >
                              {action.magazine_content_type === "technical"
                                ? "📄 Técnico"
                                : "📰 Anuncio"}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <div
                            className="max-w-xs truncate"
                            title={
                              action.channels?.map((c) => c.name).join(", ") ||
                              "Sin asignar"
                            }
                          >
                            {action.channels && action.channels.length > 0
                              ? action.channels.map((c) => c.name).join(", ")
                              : "Sin asignar"}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(action.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenModal(action)}
                            className="text-primary-600 hover:text-primary-700 mr-3"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteClick(action)}
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
        title={editingAction ? "Editar Acción" : "Nueva Acción"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Nombre"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nombre de la acción"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Contenido (Solo para Revista Impresa)
            </label>
            <select
              value={formData.magazine_content_type || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  magazine_content_type:
                    e.target.value === ""
                      ? null
                      : (e.target.value as "technical" | "ad"),
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Sin especificar</option>
              <option value="technical">Artículo Técnico</option>
              <option value="ad">Anuncio</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Si esta acción se usará en revistas impresas, selecciona el tipo
              de contenido
            </p>
          </div>

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
                : editingAction
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
        title="Eliminar Acción"
        message={`¿Estás seguro de que deseas eliminar la acción "${deletingAction?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
      />
    </div>
  );
};
