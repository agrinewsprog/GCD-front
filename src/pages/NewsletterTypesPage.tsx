import { useState, useEffect, useMemo } from "react";
import {
  newsletterService,
  NewsletterType,
} from "../services/newsletterService";
import { mediumService } from "../services/mediumService";
import { Medium } from "../types";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { FormInput } from "../components/FormInput";

// js-cache-function-results: Cache translations outside component
const DAY_TRANSLATIONS: Record<string, string> = {
  Monday: "Lunes",
  Tuesday: "Martes",
  Wednesday: "Miércoles",
  Thursday: "Jueves",
  Friday: "Viernes",
};

const FREQUENCY_TRANSLATIONS: Record<string, string> = {
  monthly: "Mensual",
  bimonthly: "Bimensual",
  quarterly: "Trimestral",
};

export default function NewsletterTypesPage() {
  const [types, setTypes] = useState<NewsletterType[]>([]);
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<NewsletterType | null>(null);
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [regenerateYear, setRegenerateYear] = useState(
    new Date().getFullYear(),
  );

  const [formData, setFormData] = useState({
    medium_id: "",
    region: "",
    name: "",
    day_of_week: "Monday",
    week_of_month: "1",
    frequency: "monthly",
    frequency_offset: 0,
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // async-parallel: Load data in parallel for better performance
      const [typesData, mediumsData] = await Promise.all([
        newsletterService.getAllTypes(),
        mediumService.getAll(),
      ]);
      setTypes(typesData);
      setMediums(mediumsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type?: NewsletterType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        medium_id: type.medium_id.toString(),
        region: type.region,
        name: type.name,
        day_of_week: type.day_of_week,
        week_of_month: type.week_of_month,
        frequency: type.frequency,
        frequency_offset: type.frequency_offset,
        is_active: type.is_active,
      });
    } else {
      setEditingType(null);
      setFormData({
        medium_id: "",
        region: "",
        name: "",
        day_of_week: "Monday",
        week_of_month: "1",
        frequency: "monthly",
        frequency_offset: 0,
        is_active: true,
      });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingType) {
        await newsletterService.updateType(editingType.id, {
          ...formData,
          medium_id: parseInt(formData.medium_id),
        });
      } else {
        await newsletterService.createType({
          ...formData,
          medium_id: parseInt(formData.medium_id),
        });
      }
      setModalOpen(false);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al guardar");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este newsletter type?")) return;
    try {
      await newsletterService.deleteType(id);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al eliminar");
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await newsletterService.toggleTypeStatus(id);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al cambiar estado");
    }
  };

  const handleRegenerate = async () => {
    if (
      !confirm(`¿Regenerar todos los schedules para el año ${regenerateYear}?`)
    )
      return;
    try {
      await newsletterService.regenerateSchedules(regenerateYear);
      alert("Schedules regenerados exitosamente");
      setRegenerateModalOpen(false);
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al regenerar");
    }
  };

  // rerender-derived-state: Memoize expensive grouping calculation
  const groupedTypes = useMemo(
    () =>
      types.reduce(
        (acc, type) => {
          const key = `${type.medium_name} - ${type.region}`;
          if (!acc[key]) acc[key] = [];
          acc[key].push(type);
          return acc;
        },
        {} as Record<string, NewsletterType[]>,
      ),
    [types],
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Newsletters</h1>
        <div className="space-x-2">
          <Button
            onClick={() => setRegenerateModalOpen(true)}
            variant="secondary"
          >
            🔄 Regenerar Schedules
          </Button>
          <Button onClick={() => handleOpenModal()}>
            + Nuevo Newsletter Type
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTypes).map(([group, groupTypes]) => (
            <div key={group} className="bg-white rounded-lg shadow">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h2 className="font-semibold text-lg">{group}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Día
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Semana
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Frecuencia
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groupTypes.map((type) => (
                      <tr key={type.id}>
                        <td className="px-4 py-3 text-sm">{type.name}</td>
                        <td className="px-4 py-3 text-sm">
                          {DAY_TRANSLATIONS[type.day_of_week] ||
                            type.day_of_week}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {type.week_of_month}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {FREQUENCY_TRANSLATIONS[type.frequency] ||
                            type.frequency}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              type.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {type.is_active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleOpenModal(type)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggleStatus(type.id)}
                            className="text-yellow-600 hover:text-yellow-800 text-sm"
                          >
                            {type.is_active ? "Desactivar" : "Activar"}
                          </button>
                          <button
                            onClick={() => handleDelete(type.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
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
          ))}
        </div>
      )}

      {/* Modal Create/Edit */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingType ? "Editar Newsletter Type" : "Nuevo Newsletter Type"}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar medio</option>
              {mediums.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <FormInput
            label="Región"
            value={formData.region}
            onChange={(e) =>
              setFormData({ ...formData, region: e.target.value })
            }
            placeholder="Spain, International, Latam, etc."
          />

          <FormInput
            label="Nombre"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="News aviNews España"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Día de la semana
            </label>
            <select
              value={formData.day_of_week}
              onChange={(e) =>
                setFormData({ ...formData, day_of_week: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Monday">Lunes</option>
              <option value="Tuesday">Martes</option>
              <option value="Wednesday">Miércoles</option>
              <option value="Thursday">Jueves</option>
              <option value="Friday">Viernes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semana del mes
            </label>
            <select
              value={formData.week_of_month}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  week_of_month: e.target.value as any,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">Semana 1</option>
              <option value="2">Semana 2</option>
              <option value="3">Semana 3</option>
              <option value="4">Semana 4</option>
              <option value="5">Semana 5</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frecuencia
            </label>
            <select
              value={formData.frequency}
              onChange={(e) =>
                setFormData({ ...formData, frequency: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="monthly">Mensual</option>
              <option value="bimonthly">Bimensual</option>
              <option value="quarterly">Trimestral</option>
            </select>
          </div>

          {formData.frequency === "bimonthly" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Offset (0 = meses pares, 1 = meses impares)
              </label>
              <input
                type="number"
                min="0"
                max="1"
                value={formData.frequency_offset}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    frequency_offset: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Activo
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button onClick={() => setModalOpen(false)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingType ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Regenerate */}
      <Modal
        isOpen={regenerateModalOpen}
        onClose={() => setRegenerateModalOpen(false)}
        title="Regenerar Schedules"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Esto eliminará todos los schedules del año seleccionado y los
            regenerará según las reglas actuales.
          </p>
          <FormInput
            label="Año"
            type="number"
            value={regenerateYear.toString()}
            onChange={(e) => setRegenerateYear(parseInt(e.target.value))}
          />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              onClick={() => setRegenerateModalOpen(false)}
              variant="secondary"
            >
              Cancelar
            </Button>
            <Button onClick={handleRegenerate} variant="danger">
              Regenerar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
