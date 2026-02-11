import { useState, useEffect } from "react";
import userService, { User, Role } from "../services/userService";
import { Modal } from "../components/Modal";
import { FormInput } from "../components/FormInput";
import { Button } from "../components/Button";
import { ConfirmDialog } from "../components/ConfirmDialog";

export const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    role_ids: [] as number[],
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await userService.getRoles();
      setRoles(data);
    } catch (err) {
      console.error("Error loading roles:", err);
    }
  };

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        surname: user.surname,
        email: user.email,
        password: "",
        role_ids: user.role_ids || [],
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        surname: "",
        email: "",
        password: "",
        role_ids: [],
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingUser) {
        await userService.update(editingUser.id, formData);
        setSuccess("Usuario actualizado correctamente");
      } else {
        await userService.create(formData);
        setSuccess("Usuario creado correctamente");
      }
      await loadUsers();
      closeModal();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          `Error al ${editingUser ? "actualizar" : "crear"} usuario`,
      );
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    setSaving(true);
    setError("");

    try {
      await userService.delete(userToDelete.id);
      await loadUsers();
      setSuccess("Usuario eliminado correctamente");
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al eliminar usuario");
      setShowDeleteModal(false);
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (roleId: number) => {
    setFormData((prev) => ({
      ...prev,
      role_ids: prev.role_ids.includes(roleId)
        ? prev.role_ids.filter((id) => id !== roleId)
        : [...prev.role_ids, roleId],
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600 mt-1">
            Gestiona los usuarios del sistema
          </p>
        </div>
        <Button onClick={() => openModal()}>+ Nuevo Usuario</Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-6xl mb-4 block">👥</span>
          <p className="text-gray-600">No hay usuarios registrados</p>
        </div>
      ) : (
        <div className="card">
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
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Roles
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
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-600">{user.id}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {user.name} {user.surname}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              role === "admin"
                                ? "bg-purple-100 text-purple-700"
                                : role === "comercial"
                                  ? "bg-blue-100 text-blue-700"
                                  : role === "post-venta"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openModal(user)}
                        className="text-primary-600 hover:text-primary-700 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => openDeleteModal(user)}
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
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Nombre"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nombre"
            required
          />

          <FormInput
            label="Apellidos"
            name="surname"
            value={formData.surname}
            onChange={(e) =>
              setFormData({ ...formData, surname: e.target.value })
            }
            placeholder="Apellidos"
            required
          />

          <FormInput
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="email@ejemplo.com"
            required
          />

          <FormInput
            label={
              editingUser
                ? "Contraseña (dejar vacío para no cambiar)"
                : "Contraseña"
            }
            name="password"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            placeholder="••••••••"
            required={!editingUser}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roles *
            </label>
            <div className="space-y-2">
              {roles.map((role) => (
                <label
                  key={role.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.role_ids.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {role.name}
                  </span>
                </label>
              ))}
            </div>
            {formData.role_ids.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                Selecciona al menos un rol
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || formData.role_ids.length === 0}
            >
              {saving ? "Guardando..." : editingUser ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Eliminar Usuario"
        message={`¿Estás seguro de que deseas eliminar el usuario "${userToDelete?.name} ${userToDelete?.surname}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isLoading={saving}
      />
    </div>
  );
};
