import React, { useState, useEffect } from "react";
import {
  newsletterService,
  NewsletterType,
  NewsletterSchedule,
} from "../services/newsletterService";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    newsletterScheduleId: number,
    date: string,
    newsletterName: string,
  ) => void;
  mediumId: number;
  mediumName: string;
}

const NewsletterSelectionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  mediumId,
  mediumName,
}) => {
  const [step, setStep] = useState<"type" | "date">("type");
  const [newsletterTypes, setNewsletterTypes] = useState<NewsletterType[]>([]);
  const [selectedType, setSelectedType] = useState<NewsletterType | null>(null);
  const [schedules, setSchedules] = useState<NewsletterSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] =
    useState<NewsletterSchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load newsletter types on mount
  useEffect(() => {
    if (isOpen) {
      loadNewsletterTypes();
    } else {
      resetState();
    }
  }, [isOpen, mediumId]);

  const resetState = () => {
    setStep("type");
    setNewsletterTypes([]);
    setSelectedType(null);
    setSchedules([]);
    setSelectedSchedule(null);
    setError(null);
  };

  const loadNewsletterTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Loading newsletter types for medium:", mediumId);
      // Load all types for this medium (no region filter)
      const types = await newsletterService.getTypes(mediumId);
      console.log("Newsletter types loaded:", types);
      setNewsletterTypes(types);
      if (types.length === 0) {
        setError("No hay newsletters configurados para este medio");
      }
    } catch (err: any) {
      console.error("Error loading newsletter types:", err);
      setError(err.response?.data?.message || "Error al cargar newsletters");
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelect = (type: NewsletterType) => {
    setSelectedType(type);
    loadSchedules(type);
  };

  const loadSchedules = async (type: NewsletterType) => {
    try {
      setLoading(true);
      setError(null);
      const schedulesData = await newsletterService.getSchedules(type.id, true);
      setSchedules(schedulesData);
      setStep("date");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al cargar fechas");
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSelect = (schedule: NewsletterSchedule) => {
    setSelectedSchedule(schedule);
  };

  const handleConfirm = () => {
    if (selectedSchedule && selectedType) {
      onConfirm(
        selectedSchedule.id,
        selectedSchedule.scheduled_date,
        selectedType.name,
      );
      onClose();
    }
  };

  const handleBack = () => {
    if (step === "date") {
      setStep("type");
      setSelectedType(null);
      setSchedules([]);
      setSelectedSchedule(null);
    }
  };

  const formatDate = (dateStr: string) => {
    // Remove any time or timezone info, work only with YYYY-MM-DD
    const cleanDate = dateStr.split("T")[0];
    const [year, month, day] = cleanDate.split("-").map(Number);

    // Create date using local timezone
    const date = new Date(year, month - 1, day);

    const days = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    return `${date.getDate()} de ${months[date.getMonth()]} ${date.getFullYear()} (${days[date.getDay()]})`;
  };

  const getFrequencyLabel = (type: NewsletterType) => {
    const freq =
      type.frequency === "monthly"
        ? "Mensual"
        : type.frequency === "bimonthly"
          ? "Bimensual"
          : "Trimestral";
    const day =
      type.day_of_week === "Monday"
        ? "Lunes"
        : type.day_of_week === "Tuesday"
          ? "Martes"
          : type.day_of_week === "Wednesday"
            ? "Miércoles"
            : type.day_of_week === "Thursday"
              ? "Jueves"
              : "Viernes";
    return `${day} semana ${type.week_of_month} • ${freq}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Seleccionar Newsletter - ${mediumName}`}
    >
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Cargando...</p>
          </div>
        ) : (
          <>
            {/* STEP 1: Newsletter Type Selection */}
            {step === "type" && (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Selecciona el newsletter:
                </p>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {newsletterTypes.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No hay newsletters disponibles
                    </p>
                  ) : (
                    newsletterTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => handleTypeSelect(type)}
                        className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors"
                      >
                        <div className="font-medium">{type.name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {getFrequencyLabel(type)}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: Date Selection */}
            {step === "date" && selectedType && (
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  Newsletter:{" "}
                  <span className="font-medium">{selectedType.name}</span>
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  {getFrequencyLabel(selectedType)}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  Selecciona la fecha de publicación:
                </p>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {schedules.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No hay fechas disponibles para este newsletter
                    </p>
                  ) : (
                    schedules.map((schedule) => (
                      <button
                        key={schedule.id}
                        onClick={() => handleScheduleSelect(schedule)}
                        className={`w-full text-left px-4 py-3 border rounded-lg transition-colors ${
                          selectedSchedule?.id === schedule.id
                            ? "bg-blue-50 border-blue-500"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="font-medium">
                          {formatDate(schedule.scheduled_date)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {schedule.scheduled_date}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <div>
            {step === "date" && !loading && (
              <Button onClick={handleBack} variant="secondary">
                Atrás
              </Button>
            )}
          </div>
          <div className="space-x-2">
            <Button onClick={onClose} variant="secondary">
              Cancelar
            </Button>
            {step === "date" && (
              <Button
                onClick={handleConfirm}
                disabled={!selectedSchedule || loading}
              >
                Confirmar
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default NewsletterSelectionModal;
