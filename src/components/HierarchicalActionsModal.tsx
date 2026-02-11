import { useState, useEffect } from "react";
import { mediumService } from "@/services/mediumService";
import { channelService } from "@/services/channelService";
import { actionService } from "@/services/actionService";
import { magazineService, MagazineEdition } from "@/services/magazineService";
import { Medium, ChannelWithMediums, ActionWithChannels } from "@/types";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import NewsletterSelectionModal from "@/components/NewsletterSelectionModal";

interface HierarchicalActionsModalProps {
  campaignId: number;
  campaignName: string;
  campaignMediumIds: number[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    actions: Array<{
      medium_id: number;
      channel_id: number;
      action_id: number;
      start_date?: string;
      end_date?: string;
      newsletter_schedule_id?: number;
      magazine_edition_id?: number;
    }>,
  ) => void;
  initialActions?: Array<{
    medium_id: number;
    channel_id: number;
    action_id: number;
    start_date?: string;
    end_date?: string;
    newsletter_schedule_id?: number;
    magazine_edition_id?: number;
  }>;
}

interface MediumData {
  medium: Medium;
  channels: ChannelData[];
}

interface ChannelData {
  channel: ChannelWithMediums;
  actions: ActionWithChannels[];
  selectedActionIds: number[];
}

export const HierarchicalActionsModal = ({
  campaignId,
  campaignName,
  campaignMediumIds,
  isOpen,
  onClose,
  onSave,
  initialActions = [],
}: HierarchicalActionsModalProps) => {
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [allChannels, setAllChannels] = useState<ChannelWithMediums[]>([]);
  const [allActions, setAllActions] = useState<ActionWithChannels[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedMediums, setExpandedMediums] = useState<Set<number>>(
    new Set(),
  );
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(
    new Set(),
  );

  // Structure: { mediumId: { channelId: [actionIds] } }
  const [selectedActions, setSelectedActions] = useState<
    Record<number, Record<number, number[]>>
  >({});

  // Structure: { "mediumId-channelId-actionId": { start_date, end_date } }
  const [actionDates, setActionDates] = useState<
    Record<string, { start_date: string; end_date: string }>
  >({});

  // Newsletter state
  const [newsletterModalOpen, setNewsletterModalOpen] = useState(false);
  const [currentNewsletterAction, setCurrentNewsletterAction] = useState<{
    mediumId: number;
    channelId: number;
    actionId: number;
  } | null>(null);

  // Store newsletter_schedule_id for each action: { "mediumId-channelId-actionId": scheduleId }
  const [actionNewsletterIds, setActionNewsletterIds] = useState<
    Record<string, number>
  >({});

  // Magazine editions state
  const [magazineEditions, setMagazineEditions] = useState<MagazineEdition[]>(
    [],
  );
  const [magazineModalOpen, setMagazineModalOpen] = useState(false);
  const [currentMagazineAction, setCurrentMagazineAction] = useState<{
    mediumId: number;
    channelId: number;
    actionId: number;
  } | null>(null);

  // Store magazine_edition_id for each action: { "mediumId-channelId-actionId": editionId }
  const [actionMagazineIds, setActionMagazineIds] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    if (isOpen) {
      loadData();

      // Reset and initialize from initialActions when modal opens
      if (initialActions.length > 0) {
        const structure: Record<number, Record<number, number[]>> = {};
        const dates: Record<string, { start_date: string; end_date: string }> =
          {};

        const newsletterIds: Record<string, number> = {};
        const magazineIds: Record<string, number> = {};

        initialActions.forEach(
          ({
            medium_id,
            channel_id,
            action_id,
            start_date,
            end_date,
            newsletter_schedule_id,
            magazine_edition_id,
          }) => {
            if (!structure[medium_id]) structure[medium_id] = {};
            if (!structure[medium_id][channel_id])
              structure[medium_id][channel_id] = [];
            structure[medium_id][channel_id].push(action_id);

            // Store dates if they exist - convert to YYYY-MM-DD format
            const key = `${medium_id}-${channel_id}-${action_id}`;
            dates[key] = {
              start_date: start_date ? start_date.split("T")[0] : "",
              end_date: end_date ? end_date.split("T")[0] : "",
            };

            // Store newsletter_schedule_id if exists
            if (newsletter_schedule_id) {
              newsletterIds[key] = newsletter_schedule_id;
            }

            // Store magazine_edition_id if exists
            if (magazine_edition_id) {
              magazineIds[key] = magazine_edition_id;
            }
          },
        );

        setSelectedActions(structure);
        setActionDates(dates);
        setActionNewsletterIds(newsletterIds);
        setActionMagazineIds(magazineIds);

        // Expand all mediums and channels with data
        const mediumIds = Object.keys(structure).map(Number);
        setExpandedMediums(new Set(mediumIds));

        const channelKeys: string[] = [];
        mediumIds.forEach((mid) => {
          Object.keys(structure[mid]).forEach((cid) => {
            channelKeys.push(`${mid}-${cid}`);
          });
        });
        setExpandedChannels(new Set(channelKeys));
      } else {
        // Reset if no initial actions
        setSelectedActions({});
        setActionDates({});
        setActionNewsletterIds({});
        setActionMagazineIds({});
        setExpandedMediums(new Set());
        setExpandedChannels(new Set());
      }
    }
  }, [isOpen, initialActions]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mediumsData, channelsData, actionsData, editionsData] =
        await Promise.all([
          mediumService.getAll(),
          channelService.getAll(),
          actionService.getAll(),
          magazineService.getAll(),
        ]);
      setMediums(mediumsData);
      setAllChannels(channelsData);
      setAllActions(actionsData);
      setMagazineEditions(editionsData);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMedium = (mediumId: number) => {
    const newExpanded = new Set(expandedMediums);
    if (newExpanded.has(mediumId)) {
      newExpanded.delete(mediumId);
    } else {
      newExpanded.add(mediumId);
    }
    setExpandedMediums(newExpanded);
  };

  const toggleChannel = (mediumId: number, channelId: number) => {
    const key = `${mediumId}-${channelId}`;
    const newExpanded = new Set(expandedChannels);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedChannels(newExpanded);
  };

  const toggleAction = (
    mediumId: number,
    channelId: number,
    actionId: number,
  ) => {
    const newSelected = { ...selectedActions };
    if (!newSelected[mediumId]) newSelected[mediumId] = {};
    if (!newSelected[mediumId][channelId])
      newSelected[mediumId][channelId] = [];

    const actions = newSelected[mediumId][channelId];
    const index = actions.indexOf(actionId);

    if (index > -1) {
      actions.splice(index, 1);
      // Clean up empty structures
      if (actions.length === 0) {
        delete newSelected[mediumId][channelId];
        if (Object.keys(newSelected[mediumId]).length === 0) {
          delete newSelected[mediumId];
        }
      }
      // Remove dates and newsletter ID when unchecking
      const key = `${mediumId}-${channelId}-${actionId}`;
      const newDates = { ...actionDates };
      delete newDates[key];
      setActionDates(newDates);

      const newNewsletterIds = { ...actionNewsletterIds };
      delete newNewsletterIds[key];
      setActionNewsletterIds(newNewsletterIds);
    } else {
      actions.push(actionId);
      // Initialize dates when checking
      const key = `${mediumId}-${channelId}-${actionId}`;
      setActionDates((prev) => ({
        ...prev,
        [key]: { start_date: "", end_date: "" },
      }));
    }

    setSelectedActions(newSelected);
  };

  const toggleAllChannelActions = (mediumId: number, channelId: number) => {
    const channelActions = getActionsForChannel(channelId);
    const currentActions = selectedActions[mediumId]?.[channelId] || [];

    const newSelected = { ...selectedActions };
    if (!newSelected[mediumId]) newSelected[mediumId] = {};

    if (currentActions.length === channelActions.length) {
      // Deselect all
      delete newSelected[mediumId][channelId];
      if (Object.keys(newSelected[mediumId]).length === 0) {
        delete newSelected[mediumId];
      }
    } else {
      // Select all
      newSelected[mediumId][channelId] = channelActions.map((a) => a.id);
    }

    setSelectedActions(newSelected);
  };

  const getChannelsForMedium = (mediumId: number): ChannelWithMediums[] => {
    return allChannels.filter((channel) =>
      channel.mediums?.some((m) => m.id === mediumId),
    );
  };

  const getActionsForChannel = (channelId: number): ActionWithChannels[] => {
    return allActions.filter((action) =>
      action.channels?.some((c) => c.id === channelId),
    );
  };

  const isActionSelected = (
    mediumId: number,
    channelId: number,
    actionId: number,
  ): boolean => {
    return selectedActions[mediumId]?.[channelId]?.includes(actionId) || false;
  };

  const isNewsletterChannel = (channelId: number): boolean => {
    const channel = allChannels.find((c) => c.id === channelId);
    return channel?.name.toLowerCase().includes("newsletter") || false;
  };

  const isMagazineChannel = (channelId: number): boolean => {
    const channel = allChannels.find((c) => c.id === channelId);
    return (
      channel?.name.toLowerCase().includes("revista") ||
      channel?.name.toLowerCase().includes("magazine") ||
      false
    );
  };

  const openNewsletterModal = (
    mediumId: number,
    channelId: number,
    actionId: number,
  ) => {
    setCurrentNewsletterAction({ mediumId, channelId, actionId });
    setNewsletterModalOpen(true);
  };

  const handleNewsletterConfirm = (
    scheduleId: number,
    date: string,
    newsletterName: string,
  ) => {
    if (!currentNewsletterAction) return;

    const { mediumId, channelId, actionId } = currentNewsletterAction;
    const key = `${mediumId}-${channelId}-${actionId}`;

    // Store the schedule ID
    setActionNewsletterIds((prev) => ({ ...prev, [key]: scheduleId }));

    // Store the date in both start_date and end_date (newsletters are single-day)
    setActionDates((prev) => ({
      ...prev,
      [key]: { start_date: date, end_date: date },
    }));

    setNewsletterModalOpen(false);
    setCurrentNewsletterAction(null);
  };

  const openMagazineModal = (
    mediumId: number,
    channelId: number,
    actionId: number,
  ) => {
    setCurrentMagazineAction({ mediumId, channelId, actionId });
    setMagazineModalOpen(true);
  };

  const handleMagazineConfirm = (
    editionId: number,
    publicationDate: string,
  ) => {
    if (!currentMagazineAction) return;

    const { mediumId, channelId, actionId } = currentMagazineAction;
    const key = `${mediumId}-${channelId}-${actionId}`;

    // Store the edition ID
    setActionMagazineIds((prev) => ({ ...prev, [key]: editionId }));

    // Store the publication date in both start_date and end_date
    setActionDates((prev) => ({
      ...prev,
      [key]: { start_date: publicationDate, end_date: publicationDate },
    }));

    setMagazineModalOpen(false);
    setCurrentMagazineAction(null);
  };

  const updateActionDate = (
    mediumId: number,
    channelId: number,
    actionId: number,
    field: "start_date" | "end_date",
    value: string,
  ) => {
    const key = `${mediumId}-${channelId}-${actionId}`;
    // Ensure only YYYY-MM-DD format is stored (no time component)
    const cleanValue = value ? value.split("T")[0] : "";
    setActionDates((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: cleanValue,
      },
    }));
  };

  const handleSave = () => {
    const actions: Array<{
      medium_id: number;
      channel_id: number;
      action_id: number;
      start_date?: string;
      end_date?: string;
      newsletter_schedule_id?: number;
      magazine_edition_id?: number;
    }> = [];

    Object.entries(selectedActions).forEach(([mediumId, channels]) => {
      Object.entries(channels).forEach(([channelId, actionIds]) => {
        actionIds.forEach((actionId) => {
          const key = `${mediumId}-${channelId}-${actionId}`;
          const dates = actionDates[key] || { start_date: "", end_date: "" };
          const newsletterScheduleId = actionNewsletterIds[key];
          const magazineEditionId = actionMagazineIds[key];

          // Ensure dates are in YYYY-MM-DD format (no time component)
          const startDate = dates.start_date
            ? dates.start_date.split("T")[0]
            : undefined;
          const endDate = dates.end_date
            ? dates.end_date.split("T")[0]
            : undefined;

          actions.push({
            medium_id: Number(mediumId),
            channel_id: Number(channelId),
            action_id: actionId,
            start_date: startDate,
            end_date: endDate,
            newsletter_schedule_id: newsletterScheduleId,
            magazine_edition_id: magazineEditionId,
          });
        });
      });
    });

    onSave(actions);
    onClose();
  };

  const getSelectedCount = () => {
    let count = 0;
    Object.values(selectedActions).forEach((channels) => {
      Object.values(channels).forEach((actions) => {
        count += actions.length;
      });
    });
    return count;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Gestionar Acciones - ${campaignName}`}
      size="xl"
    >
      <div className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
          <p className="font-medium">Selección Jerárquica con Fechas</p>
          <p className="text-xs mt-1">
            Expande Medio → Canal → Selecciona Acciones y define sus fechas de
            ejecución
          </p>
          <p className="text-xs font-medium mt-2">
            Total seleccionadas: {getSelectedCount()} acciones
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Cargando...</p>
          </div>
        ) : campaignMediumIds.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="font-medium">
              No hay medios asignados a esta campaña
            </p>
            <p className="text-sm mt-2">
              Edita la campaña y selecciona medios primero
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {mediums
              .filter((medium) => campaignMediumIds.includes(medium.id))
              .map((medium) => {
                const channels = getChannelsForMedium(medium.id);
                const isExpanded = expandedMediums.has(medium.id);

                return (
                  <div key={medium.id} className="border rounded-lg">
                    {/* Medium Header */}
                    <button
                      onClick={() => toggleMedium(medium.id)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {isExpanded ? "▼" : "▶"}
                        </span>
                        <span className="font-medium text-gray-900">
                          📡 {medium.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({channels.length} canales)
                        </span>
                      </div>
                    </button>

                    {/* Channels */}
                    {isExpanded && (
                      <div className="pl-6 pr-3 pb-3 space-y-2">
                        {channels.map((channel) => {
                          const actions = getActionsForChannel(channel.id);
                          const channelKey = `${medium.id}-${channel.id}`;
                          const isChannelExpanded =
                            expandedChannels.has(channelKey);
                          const selectedCount =
                            selectedActions[medium.id]?.[channel.id]?.length ||
                            0;

                          return (
                            <div
                              key={channel.id}
                              className="border-l-2 border-gray-300 ml-2"
                            >
                              {/* Channel Header */}
                              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <button
                                  onClick={() =>
                                    toggleChannel(medium.id, channel.id)
                                  }
                                  className="flex items-center gap-2 flex-1 hover:bg-gray-100 rounded px-2 py-1"
                                >
                                  <span className="text-sm">
                                    {isChannelExpanded ? "▼" : "▶"}
                                  </span>
                                  <span className="font-medium text-gray-800">
                                    📺 {channel.name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    ({actions.length} acciones)
                                  </span>
                                  {selectedCount > 0 && (
                                    <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                                      {selectedCount}
                                    </span>
                                  )}
                                </button>
                                <button
                                  onClick={() =>
                                    toggleAllChannelActions(
                                      medium.id,
                                      channel.id,
                                    )
                                  }
                                  className="text-xs text-blue-600 hover:text-blue-800 px-2"
                                >
                                  {selectedCount === actions.length
                                    ? "Desmarcar todas"
                                    : "Marcar todas"}
                                </button>
                              </div>

                              {/* Actions */}
                              {isChannelExpanded && (
                                <div className="ml-8 mt-2 space-y-2">
                                  {actions.map((action) => {
                                    const isSelected = isActionSelected(
                                      medium.id,
                                      channel.id,
                                      action.id,
                                    );
                                    const key = `${medium.id}-${channel.id}-${action.id}`;
                                    const dates = actionDates[key] || {
                                      start_date: "",
                                      end_date: "",
                                    };

                                    return (
                                      <div
                                        key={action.id}
                                        className={`border rounded p-3 ${isSelected ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200"}`}
                                      >
                                        <div className="flex items-start gap-3">
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() =>
                                              toggleAction(
                                                medium.id,
                                                channel.id,
                                                action.id,
                                              )
                                            }
                                            className="w-4 h-4 text-blue-600 rounded mt-1"
                                          />
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                              <span className="text-sm font-medium text-gray-700">
                                                ⚡ {action.name}
                                              </span>
                                            </div>
                                            {isSelected && (
                                              <div>
                                                {isNewsletterChannel(
                                                  channel.id,
                                                ) ? (
                                                  // Newsletter action: show special button
                                                  <div>
                                                    <Button
                                                      type="button"
                                                      onClick={() =>
                                                        openNewsletterModal(
                                                          medium.id,
                                                          channel.id,
                                                          action.id,
                                                        )
                                                      }
                                                      variant="secondary"
                                                      className="w-full"
                                                    >
                                                      📧{" "}
                                                      {dates.start_date
                                                        ? `Fecha: ${dates.start_date}`
                                                        : "Seleccionar Newsletter"}
                                                    </Button>
                                                  </div>
                                                ) : isMagazineChannel(
                                                    channel.id,
                                                  ) ? (
                                                  // Magazine action: show special button
                                                  <div>
                                                    <Button
                                                      type="button"
                                                      onClick={() =>
                                                        openMagazineModal(
                                                          medium.id,
                                                          channel.id,
                                                          action.id,
                                                        )
                                                      }
                                                      variant="secondary"
                                                      className="w-full"
                                                    >
                                                      📰{" "}
                                                      {dates.start_date
                                                        ? `Fecha: ${dates.start_date}`
                                                        : "Seleccionar Edición"}
                                                    </Button>
                                                  </div>
                                                ) : (
                                                  // Regular action: show date pickers
                                                  <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                                        Fecha Inicio
                                                      </label>
                                                      <input
                                                        type="date"
                                                        value={dates.start_date}
                                                        onChange={(e) =>
                                                          updateActionDate(
                                                            medium.id,
                                                            channel.id,
                                                            action.id,
                                                            "start_date",
                                                            e.target.value,
                                                          )
                                                        }
                                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                                        Fecha Fin
                                                      </label>
                                                      <input
                                                        type="date"
                                                        value={dates.end_date}
                                                        onChange={(e) =>
                                                          updateActionDate(
                                                            medium.id,
                                                            channel.id,
                                                            action.id,
                                                            "end_date",
                                                            e.target.value,
                                                          )
                                                        }
                                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                      />
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {actions.length === 0 && (
                                    <p className="text-xs text-gray-400 p-2">
                                      No hay acciones para este canal
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {channels.length === 0 && (
                          <p className="text-sm text-gray-400 p-2">
                            No hay canales para este medio
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={getSelectedCount() === 0}
          >
            Guardar ({getSelectedCount()} acciones)
          </Button>
        </div>
      </div>

      {/* Newsletter Selection Modal */}
      {currentNewsletterAction && (
        <NewsletterSelectionModal
          isOpen={newsletterModalOpen}
          onClose={() => {
            setNewsletterModalOpen(false);
            setCurrentNewsletterAction(null);
          }}
          onConfirm={handleNewsletterConfirm}
          mediumId={currentNewsletterAction.mediumId}
          mediumName={
            mediums.find((m) => m.id === currentNewsletterAction.mediumId)
              ?.name || ""
          }
        />
      )}

      {/* Magazine Edition Selection Modal */}
      {currentMagazineAction && (
        <Modal
          isOpen={magazineModalOpen}
          onClose={() => {
            setMagazineModalOpen(false);
            setCurrentMagazineAction(null);
          }}
          title="Seleccionar Edición de Revista"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Selecciona la edición de revista para esta acción
            </p>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {magazineEditions
                .filter((e) => e.medium_id === currentMagazineAction.mediumId)
                .sort(
                  (a, b) =>
                    new Date(b.publication_date).getTime() -
                    new Date(a.publication_date).getTime(),
                )
                .map((edition) => {
                  const date = new Date(edition.publication_date);
                  const formattedDate = date.toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  });
                  return (
                    <button
                      key={edition.id}
                      onClick={() =>
                        handleMagazineConfirm(
                          edition.id,
                          edition.publication_date,
                        )
                      }
                      className="w-full text-left p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors"
                    >
                      <div className="font-medium">{formattedDate}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Estado:{" "}
                        {edition.status === "published"
                          ? "Publicada"
                          : edition.status === "active"
                            ? "Activa"
                            : "Borrador"}
                      </div>
                    </button>
                  );
                })}
              {magazineEditions.filter(
                (e) => e.medium_id === currentMagazineAction.mediumId,
              ).length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No hay ediciones disponibles para este medio
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};
