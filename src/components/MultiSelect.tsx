import { useState, useMemo } from "react";

interface MultiSelectProps {
  label: string;
  options: { value: number; label: string }[];
  selected: number[];
  onChange: (selected: number[]) => void;
  placeholder?: string;
}

export const MultiSelect = ({
  label,
  options,
  selected,
  onChange,
  placeholder = "Buscar...",
}: MultiSelectProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [options, searchTerm]);

  const handleToggle = (value: number) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleToggleAll = () => {
    if (selected.length === options.length) {
      // Si todos están seleccionados, deseleccionar todos
      onChange([]);
    } else {
      // Seleccionar todos
      onChange(options.map((o) => o.value));
    }
  };

  const allSelected = selected.length === options.length && options.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        {options.length > 0 && (
          <button
            type="button"
            onClick={handleToggleAll}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {allSelected ? "Deseleccionar todo" : "Seleccionar todo"}
          </button>
        )}
      </div>

      {options.length > 0 && (
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border rounded-lg mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      )}

      <div className="border rounded-lg p-3 max-h-96 overflow-y-auto bg-white">
        {options.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">
            No hay opciones disponibles
          </p>
        ) : filteredOptions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">
            No se encontraron resultados
          </p>
        ) : (
          <div className="space-y-2">
            {filteredOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => handleToggle(option.value)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          {selected.length} seleccionado(s)
        </p>
      )}
    </div>
  );
};
