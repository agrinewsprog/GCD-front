import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  magazineService,
  EditionWithCampaigns,
  calculateDeadlines,
} from "@/services/magazineService";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { FormInput } from "@/components/FormInput";
import { useAuthStore } from "@/stores/authStore";
import { isAdmin } from "@/utils/permissions";
import { CampaignRow } from "@/components/CampaignRow";

export default function MagazineEditionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<EditionWithCampaigns | null>(null);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newPublicationDate, setNewPublicationDate] = useState("");
  const [completedActions, setCompletedActions] = useState<Set<number>>(
    new Set(),
  );
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [publicationLink, setPublicationLink] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [completing, setCompleting] = useState(false);

  // Handler to update completion status
  const handleCompletionChange = useCallback(
    (campaignActionId: number, isCompleted: boolean) => {
      setCompletedActions((prev) => {
        const newSet = new Set(prev);
        if (isCompleted) {
          newSet.add(campaignActionId);
        } else {
          newSet.delete(campaignActionId);
        }
        return newSet;
      });
    },
    [],
  );

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const editionData = await magazineService.getWithCampaigns(parseInt(id!));
      setData(editionData);
      setNewPublicationDate(editionData.edition.publication_date);
    } catch (error) {
      console.error("Error loading edition:", error);
      alert("Error al cargar edición");
      navigate("/revistas");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDate = async () => {
    if (!data) return;
    try {
      await magazineService.update(data.edition.id, {
        publication_date: newPublicationDate,
      });
      setEditModalOpen(false);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al actualizar fecha");
    }
  };

  const handleCompleteEdition = async () => {
    if (!data) return;
    if (confirmationText !== "COMPLETAR") {
      alert('Debes escribir "COMPLETAR" para confirmar');
      return;
    }
    if (!publicationLink.trim()) {
      alert("El link de publicación es requerido");
      return;
    }

    try {
      setCompleting(true);
      await magazineService.complete(data.edition.id, publicationLink);
      setCompleteModalOpen(false);
      loadData();
      alert("Edición completada exitosamente");
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al completar edición");
    } finally {
      setCompleting(false);
    }
  };

  // Check if all campaign actions are completed
  const allActionsCompleted = useMemo(() => {
    if (!data) return false;
    const totalActions = data.technical_articles.length + data.ads.length;
    const isCompleted =
      totalActions > 0 && completedActions.size === totalActions;
    console.log("All actions completed?", {
      totalActions,
      completedActionsSize: completedActions.size,
      isCompleted,
      editionCompleted: data.edition.is_completed,
    });
    return isCompleted;
  }, [data, completedActions]);

  const getUrgencyColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return "bg-gray-100 text-gray-800"; // Passed
    if (daysRemaining <= 3) return "bg-red-100 text-red-800"; // Urgent
    if (daysRemaining <= 7) return "bg-yellow-100 text-yellow-800"; // Warning
    return "bg-green-100 text-green-800"; // Safe
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // rerender-derived-state: Memoize deadlines calculation
  const deadlines = useMemo(
    () => (data ? calculateDeadlines(data.edition.publication_date) : null),
    [data?.edition.publication_date],
  );

  // Sort articles: incomplete first, completed last
  const sortedTechnicalArticles = useMemo(() => {
    if (!data) return [];
    return [...data.technical_articles].sort((a, b) => {
      const aCompleted = completedActions.has(a.campaign_action_id);
      const bCompleted = completedActions.has(b.campaign_action_id);
      if (aCompleted === bCompleted) return 0;
      return aCompleted ? 1 : -1; // Completed go last
    });
  }, [data?.technical_articles, completedActions]);

  const sortedAds = useMemo(() => {
    if (!data) return [];
    return [...data.ads].sort((a, b) => {
      const aCompleted = completedActions.has(a.campaign_action_id);
      const bCompleted = completedActions.has(b.campaign_action_id);
      if (aCompleted === bCompleted) return 0;
      return aCompleted ? 1 : -1; // Completed go last
    });
  }, [data?.ads, completedActions]);

  if (loading) {
    return <div className="p-6 text-center">Cargando...</div>;
  }

  if (!data) {
    return <div className="p-6 text-center">No se encontró la edición</div>;
  }

  const { edition, technical_articles, ads } = data;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/revistas")}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Volver a revistas
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{edition.medium_name}</h1>
            <p className="text-gray-600 mt-1">
              Publicación: {formatDate(edition.publication_date)}
            </p>
            <span
              className={`inline-flex px-2 py-1 text-xs rounded-full mt-2 ${
                edition.is_completed
                  ? "bg-green-100 text-green-800"
                  : edition.status === "published"
                    ? "bg-green-100 text-green-800"
                    : edition.status === "active"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
              }`}
            >
              {edition.is_completed
                ? "✓ Completada"
                : edition.status === "published"
                  ? "Publicada"
                  : edition.status === "active"
                    ? "Activa"
                    : "Borrador"}
            </span>
            {edition.is_completed && edition.publication_link && (
              <div className="mt-2">
                <a
                  href={edition.publication_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  🔗 Ver publicación →
                </a>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {!edition.is_completed &&
              allActionsCompleted &&
              (isAdmin(user) || user?.roles?.includes("post-venta")) && (
                <Button
                  onClick={() => setCompleteModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  ✓ Completar Edición
                </Button>
              )}
            {isAdmin(user) && !edition.is_completed && (
              <Button onClick={() => setEditModalOpen(true)}>
                Editar Fecha Publicación
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Deadlines Info */}
      {deadlines && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">📅 Calendario de Deadlines</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Cliente inicial:</span>
              <span className="ml-2 font-medium">
                {formatDate(deadlines.technical.clientInitialDeadline)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Edición completa:</span>
              <span className="ml-2 font-medium">
                {formatDate(deadlines.technical.editionEnd)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Cambios cliente:</span>
              <span className="ml-2 font-medium">
                {formatDate(deadlines.technical.clientChangesDeadline)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Montaje libro:</span>
              <span className="ml-2 font-medium">
                {formatDate(deadlines.technical.bookAssemblyEnd)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Technical Articles Table */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h2 className="font-semibold text-lg">📝 Artículos Técnicos</h2>
        </div>
        <div className="overflow-x-auto">
          {technical_articles.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No hay artículos técnicos asignados
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Empresa/Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nombre Artículo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Deadlines
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Comercial
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedTechnicalArticles.map((article) => (
                  <CampaignRow
                    key={article.campaign_action_id}
                    campaign={article}
                    contentType="technical"
                    deadlines={deadlines}
                    formatDate={formatDate}
                    getUrgencyColor={getUrgencyColor}
                    onRefresh={loadData}
                    onCompletionChange={handleCompletionChange}
                    isEditionCompleted={edition.is_completed}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Ads Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h2 className="font-semibold text-lg">📢 Anuncios</h2>
        </div>
        <div className="overflow-x-auto">
          {ads.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No hay anuncios asignados
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Empresa/Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Comercial
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Deadlines
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAds.map((ad) => (
                  <CampaignRow
                    key={ad.campaign_action_id}
                    campaign={ad}
                    contentType="ad"
                    deadlines={deadlines}
                    formatDate={formatDate}
                    getUrgencyColor={getUrgencyColor}
                    onRefresh={loadData}
                    onCompletionChange={handleCompletionChange}
                    isEditionCompleted={edition.is_completed}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Date Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Editar Fecha de Publicación"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Cambiar la fecha de publicación actualizará automáticamente todos
            los deadlines.
          </p>
          <FormInput
            label="Nueva fecha de publicación"
            name="publication_date"
            type="date"
            value={newPublicationDate}
            onChange={(e) => setNewPublicationDate(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateDate}>Actualizar</Button>
          </div>
        </div>
      </Modal>

      {/* Complete Edition Modal */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => {
          if (!completing) {
            setCompleteModalOpen(false);
            setPublicationLink("");
            setConfirmationText("");
          }
        }}
        title="Completar Edición de Revista"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Acción irreversible:</strong> Una vez completada la
              edición, no se podrán realizar más cambios ni confirmaciones. Solo
              el comercial podrá acceder para consultar los datos y el link de
              publicación.
            </p>
          </div>

          <FormInput
            label="Link de publicación"
            name="publication_link"
            type="url"
            value={publicationLink}
            onChange={(e) => setPublicationLink(e.target.value)}
            placeholder="https://..."
          />

          <div>
            <label className="block text-sm font-medium mb-2">
              Para confirmar, escribe <strong>"COMPLETAR"</strong>
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
              placeholder="COMPLETAR"
              disabled={completing}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setCompleteModalOpen(false);
                setPublicationLink("");
                setConfirmationText("");
              }}
              disabled={completing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCompleteEdition}
              disabled={completing || confirmationText !== "COMPLETAR"}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
            >
              {completing ? "Completando..." : "Completar Edición"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
