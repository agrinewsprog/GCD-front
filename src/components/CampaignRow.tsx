import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  magazineDeadlineService,
  DeadlineConfirmation,
} from "@/services/magazineDeadlineService";
import {
  EditionCampaign,
  magazineService,
  MagazineEdition,
} from "@/services/magazineService";
import { campaignService } from "@/services/campaignService";
import { useAuthStore } from "@/stores/authStore";
import { isAdmin } from "@/utils/permissions";

interface CampaignRowProps {
  campaign: EditionCampaign;
  contentType: "technical" | "ad";
  deadlines: any; // Keeping for backward compatibility but will calculate per campaign
  formatDate: (date: string) => string;
  getUrgencyColor: (days: number) => string;
  onRefresh: () => void;
  onCompletionChange?: (campaignActionId: number, isCompleted: boolean) => void;
  isEditionCompleted?: boolean;
}

const DEADLINE_CONFIG = {
  technical: [
    {
      type: "client",
      label: "Cliente inicial",
      responsible: "comercial",
      requiresLink: false,
      dateKey: "clientInitialDeadline",
    },
    {
      type: "send_to_edition",
      label: "Envío a edición",
      responsible: "post-venta",
      requiresLink: true,
      dateKey: "sendToEditionDeadline",
    },
    {
      type: "edition",
      label: "Edición",
      responsible: "post-venta",
      requiresLink: false,
      dateKey: "editionEnd",
    },
    {
      type: "changes_commercial",
      label: "Cambios cliente - Comercial",
      responsible: "comercial",
      requiresLink: false,
      dateKey: "clientChangesDeadline",
    },
    {
      type: "changes_post_sale",
      label: "Link publicación Web",
      responsible: "post-venta",
      requiresLink: true,
      dateKey: "clientChangesDeadline",
    },
  ],
  ad: [
    {
      type: "client",
      label: "Cliente - Comercial",
      responsible: "comercial",
      requiresLink: false,
      dateKey: "clientDeadline",
    },
    {
      type: "client_post_sale",
      label: "Cliente - Post-venta",
      responsible: "post-venta",
      requiresLink: false,
      dateKey: "clientDeadline",
      dependsOn: "client", // Requires previous deadline to be confirmed
    },
  ],
};

export const CampaignRow = ({
  campaign,
  contentType,
  deadlines,
  formatDate,
  getUrgencyColor,
  onRefresh,
  onCompletionChange,
  isEditionCompleted = false,
}: CampaignRowProps) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [expanded, setExpanded] = useState(false);
  const [confirmations, setConfirmations] = useState<DeadlineConfirmation[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [confirmingDeadline, setConfirmingDeadline] = useState<string | null>(
    null,
  );
  const [linkInput, setLinkInput] = useState("");
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [availableEditions, setAvailableEditions] = useState<MagazineEdition[]>(
    [],
  );
  const [selectedEditionId, setSelectedEditionId] = useState<number | null>(
    null,
  );
  const [movingAction, setMovingAction] = useState(false);

  const config = DEADLINE_CONFIG[contentType];

  const loadConfirmations = async () => {
    try {
      setLoading(true);
      const data = await magazineDeadlineService.getConfirmations(
        campaign.campaign_action_id,
      );
      setConfirmations(data);
    } catch (error) {
      console.error("Error loading confirmations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load confirmations on mount to know which deadlines are confirmed
    loadConfirmations();
  }, []);

  useEffect(() => {
    if (expanded) {
      loadConfirmations();
    }
  }, [expanded]);

  // Notify parent when completion status changes
  useEffect(() => {
    if (onCompletionChange) {
      const allCompleted = config.every((deadline) =>
        isConfirmed(deadline.type),
      );
      onCompletionChange(campaign.campaign_action_id, allCompleted);
    }
  }, [confirmations, onCompletionChange, campaign.campaign_action_id]);

  // Early return after hooks to comply with React rules
  const deadlinesKey = contentType === "technical" ? "technical" : "ads";
  if (!deadlines || !deadlines[deadlinesKey]) {
    return null;
  }

  const handleConfirm = async (deadlineType: string, requiresLink: boolean) => {
    if (requiresLink && !linkInput.trim()) {
      alert("Por favor ingresa un link");
      return;
    }

    try {
      await magazineDeadlineService.confirmDeadline(
        campaign.campaign_action_id,
        deadlineType,
        requiresLink ? linkInput : undefined,
      );
      setLinkInput("");
      setConfirmingDeadline(null);
      await loadConfirmations();
      onRefresh();
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al confirmar deadline");
    }
  };

  const handleRevert = async (confirmationId: number) => {
    let confirmMessage = "¿Estás seguro de revertir esta confirmación?";

    if (isEditionCompleted) {
      confirmMessage =
        "⚠️ ATENCIÓN: Al revertir esta confirmación, la revista volverá a estado NO PUBLICADA y se eliminará el link de publicación.\n\n¿Estás seguro de continuar?";
    }

    if (!confirm(confirmMessage)) return;

    try {
      await magazineDeadlineService.revertConfirmation(confirmationId);
      await loadConfirmations();
      onRefresh();

      if (isEditionCompleted) {
        alert("✓ Confirmación revertida. La revista ya NO está publicada.");
      }
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al revertir confirmación");
    }
  };

  const isConfirmed = (deadlineType: string) => {
    return confirmations.some(
      (c) => c.deadline_type === deadlineType && !c.reverted,
    );
  };
  const allDeadlinesConfirmed = () => {
    return config.every((deadline) => isConfirmed(deadline.type));
  };
  const getConfirmation = (deadlineType: string) => {
    return confirmations.find(
      (c) => c.deadline_type === deadlineType && !c.reverted,
    );
  };

  const canConfirm = (deadlineResponsible?: string, deadlineType?: string) => {
    // Admin can confirm everything
    if (isAdmin(user)) return true;

    // If no specific responsible provided, only admin can confirm
    if (!deadlineResponsible) return false;

    // Check dependencies - if this deadline depends on another, verify it's confirmed
    if (deadlineType) {
      const deadlineConfig = config.find((d) => d.type === deadlineType);
      if (deadlineConfig && (deadlineConfig as any).dependsOn) {
        const dependsOn = (deadlineConfig as any).dependsOn;
        if (!isConfirmed(dependsOn)) {
          return false; // Cannot confirm until dependency is confirmed
        }
      }
    }

    // Check if user has the required role for this deadline
    if (deadlineResponsible === "comercial") {
      return user?.roles?.includes("comercial");
    }
    if (deadlineResponsible === "post-venta") {
      return user?.roles?.includes("post-venta");
    }

    return false;
  };

  const canMoveAction = () => {
    // Only comercial and admin can move actions
    return isAdmin(user) || user?.roles?.includes("comercial");
  };

  const handleOpenMoveModal = async () => {
    try {
      setMovingAction(true);
      const editions = await magazineService.getAllEditions();
      // Filter out completed editions
      const availableEditions = editions.filter((e) => !e.is_completed);
      setAvailableEditions(availableEditions);
      setShowMoveModal(true);
    } catch (error) {
      console.error("Error loading editions:", error);
      alert("Error al cargar las ediciones disponibles");
    } finally {
      setMovingAction(false);
    }
  };

  const handleMoveAction = async () => {
    if (!selectedEditionId) {
      alert("Por favor selecciona una edición de destino");
      return;
    }

    if (!confirm("¿Estás seguro de mover esta acción a otra edición?")) return;

    try {
      setMovingAction(true);
      await campaignService.moveActionToEdition(
        campaign.campaign_action_id,
        selectedEditionId,
      );
      setShowMoveModal(false);
      setSelectedEditionId(null);
      onRefresh();
      alert("Acción movida exitosamente");
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al mover la acción");
    } finally {
      setMovingAction(false);
    }
  };

  const daysRemaining = (dateKey: string) => {
    const deadlinesKey = contentType === "technical" ? "technical" : "ads";
    if (
      !deadlines ||
      !deadlines[deadlinesKey] ||
      !deadlines[deadlinesKey][dateKey]
    ) {
      return 0;
    }
    const deadlineDate = deadlines[deadlinesKey][dateKey];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(deadlineDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getBarColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return "bg-gray-400"; // Passed
    if (daysRemaining <= 3) return "bg-red-500"; // Urgent
    if (daysRemaining <= 7) return "bg-yellow-500"; // Warning
    return "bg-green-500"; // Safe
  };

  // Get current (next unconfirmed) deadline
  const getCurrentDeadline = () => {
    // Simply return the first deadline that is not confirmed
    for (const deadline of config) {
      if (!isConfirmed(deadline.type)) {
        return deadline;
      }
    }
    // All confirmed, return last one
    return config[config.length - 1];
  };

  const currentDeadline = getCurrentDeadline();
  const days = daysRemaining(currentDeadline.dateKey);
  const isCurrentConfirmed = isConfirmed(currentDeadline.type);
  const isConfirming = confirmingDeadline === currentDeadline.type;

  const handleRowClick = (e: React.MouseEvent) => {
    // Navigation disabled - only interactive elements work
    return;
  };

  const allCompleted = allDeadlinesConfirmed();

  return (
    <>
      <tr
        className={
          allCompleted ? "bg-green-50 hover:bg-green-100" : "hover:bg-gray-50"
        }
        onClick={handleRowClick}
      >
        {/* Empresa/Cliente - ambas tablas */}
        <td className="px-4 py-3 text-sm">{campaign.company_name}</td>

        {/* Nombre Artículo - solo technical */}
        {contentType === "technical" && (
          <td className="px-4 py-3 text-sm font-medium">
            {campaign.campaign_name}
          </td>
        )}

        {/* Acción - ambas tablas */}
        <td className="px-4 py-3 text-sm text-gray-600">
          {campaign.action_name}
        </td>

        {/* Comercial - solo ads (antes de deadlines) */}
        {contentType === "ad" && (
          <td className="px-4 py-3 text-sm">{campaign.user_name}</td>
        )}

        {/* Deadlines - ambas tablas */}
        <td className="px-4 py-3 text-sm">
          {allCompleted ? (
            <div className="space-y-2">
              <div className="px-3 py-2 rounded text-white font-semibold text-center bg-green-500">
                ✓ Completado
              </div>
              <div className="text-xs text-green-600 text-center font-medium">
                Todos los deadlines confirmados
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div
                className={`px-3 py-2 rounded text-white font-semibold text-center ${
                  isCurrentConfirmed
                    ? "bg-green-500"
                    : days < 0
                      ? "bg-red-500"
                      : "bg-green-500"
                }`}
              >
                {Math.abs(days)} días
              </div>
              <div className="text-xs text-gray-600 text-center">
                {days < 0 ? "Vencido hace" : `Quedan para el próximo deadline`}
              </div>
              <div className="text-xs text-gray-700 text-center font-medium">
                {currentDeadline.label}
              </div>
              {canConfirm(currentDeadline.responsible, currentDeadline.type) &&
                !isCurrentConfirmed &&
                !isConfirming &&
                !isEditionCompleted && (
                  <div className="flex justify-center gap-1">
                    {currentDeadline.requiresLink ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmingDeadline(currentDeadline.type);
                        }}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      >
                        Confirmar
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirm(currentDeadline.type, false);
                        }}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                )}
              {isConfirming && (
                <div
                  className="flex gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="url"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="Link..."
                    className="px-2 py-1 border rounded text-xs w-32"
                    autoFocus
                  />
                  <button
                    onClick={() => handleConfirm(currentDeadline.type, true)}
                    className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => {
                      setConfirmingDeadline(null);
                      setLinkInput("");
                    }}
                    className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}
        </td>

        {/* Comercial - solo technical (después de deadlines) */}
        {contentType === "technical" && (
          <td className="px-4 py-3 text-sm">{campaign.user_name}</td>
        )}

        {/* Dropdown - ambas tablas */}
        <td className="px-4 py-3 text-sm prevent-navigation">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="text-gray-600 hover:text-gray-800"
          >
            {expanded ? "▼" : "▶"}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td
            colSpan={contentType === "technical" ? 6 : 5}
            className="bg-gray-50 px-4 py-4"
          >
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">
                Historial de Confirmaciones
              </h4>
              {loading ? (
                <p className="text-sm text-gray-600">Cargando...</p>
              ) : confirmations.filter((c) => !c.reverted).length === 0 ? (
                <p className="text-sm text-gray-600">
                  No hay confirmaciones aún
                </p>
              ) : (
                <div className="space-y-2">
                  {config.map((deadline) => {
                    const confirmation = getConfirmation(deadline.type);
                    if (!confirmation) return null;

                    return (
                      <div
                        key={deadline.type}
                        className="border rounded-lg p-3 bg-white"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-green-800">
                              ✓ {deadline.label}
                              <span className="ml-2 text-xs text-gray-500">
                                ({deadline.responsible})
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Confirmado por: {confirmation.confirmed_by_name}
                            </div>
                            <div className="text-xs text-gray-600">
                              Fecha:{" "}
                              {new Date(
                                confirmation.confirmed_at,
                              ).toLocaleString("es-ES")}
                            </div>
                            {confirmation.link && (
                              <div className="text-xs text-gray-600 mt-1">
                                Link:{" "}
                                <a
                                  href={confirmation.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {confirmation.link}
                                </a>
                              </div>
                            )}
                          </div>
                          {isAdmin(user) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRevert(confirmation.id);
                              }}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              Revertir
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Botón para mover acción a otra edición */}
            {canMoveAction() && !isEditionCompleted && (
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenMoveModal();
                  }}
                  disabled={movingAction}
                  className="bg-orange-600 text-white px-3 py-2 rounded text-sm hover:bg-orange-700 disabled:opacity-50"
                >
                  {movingAction ? "Cargando..." : "↻ Mover a otra edición"}
                </button>
              </div>
            )}
          </td>
        </tr>
      )}

      {/* Modal para mover acción */}
      {showMoveModal && (
        <tr>
          <td colSpan={contentType === "technical" ? 6 : 5}>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setShowMoveModal(false)}
            >
              <div
                className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-4">
                  Mover acción a otra edición
                </h3>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Empresa:</strong> {campaign.company_name}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Campaña:</strong> {campaign.campaign_name}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Acción:</strong> {campaign.action_name}
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Selecciona la edición de destino:
                  </label>
                  <select
                    value={selectedEditionId || ""}
                    onChange={(e) =>
                      setSelectedEditionId(Number(e.target.value))
                    }
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">-- Selecciona una edición --</option>
                    {availableEditions.map((edition) => (
                      <option key={edition.id} value={edition.id}>
                        {edition.medium_name} -{" "}
                        {new Date(edition.publication_date).toLocaleDateString(
                          "es-ES",
                        )}{" "}
                        ({edition.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowMoveModal(false);
                      setSelectedEditionId(null);
                    }}
                    className="px-4 py-2 border rounded hover:bg-gray-100"
                    disabled={movingAction}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleMoveAction}
                    disabled={movingAction || !selectedEditionId}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                  >
                    {movingAction ? "Moviendo..." : "Mover"}
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
