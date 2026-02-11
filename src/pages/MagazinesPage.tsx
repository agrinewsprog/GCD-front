import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  magazineService,
  MagazineEdition,
  calculateFirstMonday,
} from "@/services/magazineService";
import { mediumService } from "@/services/mediumService";
import { Medium } from "@/types";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { FormInput } from "@/components/FormInput";
import { useAuthStore } from "@/stores/authStore";
import { isAdmin } from "@/utils/permissions";

export default function MagazinesPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [editions, setEditions] = useState<MagazineEdition[]>([]);
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMediumId, setSelectedMediumId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    medium_id: "",
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString(),
    publication_date: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  // rerender-derived-state: Memoize filtered editions
  const filteredEditions = useMemo(
    () =>
      selectedMediumId
        ? editions.filter((e) => e.medium_id === selectedMediumId)
        : editions,
    [editions, selectedMediumId],
  );

  // rerender-derived-state: Memoize grouped editions
  const groupedEditions = useMemo(() => {
    const grouped: Record<string, MagazineEdition[]> = {};

    filteredEditions.forEach((edition) => {
      const date = new Date(edition.publication_date);
      const key = `${date.getFullYear()}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(edition);
    });

    // Sort by year descending
    return Object.keys(grouped)
      .sort((a, b) => parseInt(b) - parseInt(a))
      .reduce(
        (acc, key) => {
          acc[key] = grouped[key].sort(
            (a, b) =>
              new Date(b.publication_date).getTime() -
              new Date(a.publication_date).getTime(),
          );
          return acc;
        },
        {} as Record<string, MagazineEdition[]>,
      );
  }, [filteredEditions]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [editionsData, mediumsData] = await Promise.all([
        magazineService.getAll(),
        mediumService.getAll(),
      ]);
      setEditions(editionsData);
      setMediums(mediumsData);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      medium_id: selectedMediumId?.toString() || "",
      year: new Date().getFullYear().toString(),
      month: (new Date().getMonth() + 1).toString(),
      publication_date: "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.medium_id) {
        alert("Selecciona un medio");
        return;
      }

      await magazineService.create({
        medium_id: parseInt(formData.medium_id),
        year: parseInt(formData.year),
        month: parseInt(formData.month),
        publication_date: formData.publication_date || undefined,
      });

      setModalOpen(false);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al crear edición");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta edición?")) return;
    try {
      await magazineService.delete(id);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al eliminar");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      active: "bg-blue-100 text-blue-800",
      published: "bg-green-100 text-green-800",
    };
    const labels = {
      draft: "Borrador",
      active: "Activa",
      published: "Publicada",
    };
    return (
      <span
        className={`inline-flex px-2 py-1 text-xs rounded-full ${colors[status as keyof typeof colors]}`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  // Update calculated publication date when year/month changes
  useEffect(() => {
    if (formData.year && formData.month && !formData.publication_date) {
      const calculatedDate = calculateFirstMonday(
        parseInt(formData.year),
        parseInt(formData.month),
      );
      setFormData((prev) => ({ ...prev, publication_date: calculatedDate }));
    }
  }, [formData.year, formData.month]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Revistas</h1>
        {isAdmin(user) && (
          <Button onClick={handleOpenModal}>+ Nueva Edición</Button>
        )}
      </div>

      {/* Medium selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filtrar por medio
        </label>
        <select
          value={selectedMediumId || ""}
          onChange={(e) =>
            setSelectedMediumId(
              e.target.value ? parseInt(e.target.value) : null,
            )
          }
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todos los medios</option>
          {mediums.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : Object.keys(groupedEditions).length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-6xl mb-4 block">📰</span>
          <p className="text-gray-600">No hay ediciones de revista</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEditions).map(([year, yearEditions]) => (
            <div key={year} className="bg-white rounded-lg shadow">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h2 className="font-semibold text-lg">{year}</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {yearEditions.map((edition) => (
                  <div
                    key={edition.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                    onClick={() => navigate(`/revistas/${edition.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{edition.medium_name}</h3>
                        {getStatusBadge(edition.status)}
                        {edition.is_completed && (
                          <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-green-500 text-white font-semibold">
                            ✓ Completada
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Publicación: {formatDate(edition.publication_date)}
                      </p>
                      {edition.is_completed && edition.publication_link && (
                        <div className="mt-2">
                          <a
                            href={edition.publication_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            🔗 Ver publicación
                          </a>
                        </div>
                      )}
                    </div>
                    {isAdmin(user) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(edition.id);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm px-3 py-1"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nueva Edición de Revista"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medio
            </label>
            <select
              value={formData.medium_id}
              onChange={(e) =>
                setFormData({ ...formData, medium_id: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Seleccionar medio...</option>
              {mediums.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Año"
              type="number"
              value={formData.year}
              onChange={(e) =>
                setFormData({ ...formData, year: e.target.value })
              }
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mes
              </label>
              <select
                value={formData.month}
                onChange={(e) =>
                  setFormData({ ...formData, month: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1).toLocaleString("es-ES", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <FormInput
            label="Fecha de publicación (1er lunes calculado)"
            type="date"
            value={formData.publication_date}
            onChange={(e) =>
              setFormData({ ...formData, publication_date: e.target.value })
            }
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Crear Edición</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
