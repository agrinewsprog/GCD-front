import { User } from "@/types";

export const hasRole = (user: User | null, role: string): boolean => {
  if (!user || !user.roles) return false;
  return user.roles.includes(role);
};

export const hasAnyRole = (user: User | null, roles: string[]): boolean => {
  if (!user || !user.roles) return false;
  return roles.some((role) => user.roles.includes(role));
};

export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, "admin");
};

export const isComercial = (user: User | null): boolean => {
  return hasRole(user, "comercial");
};

export const isPostVenta = (user: User | null): boolean => {
  return hasRole(user, "post-venta");
};

export const isAnalista = (user: User | null): boolean => {
  return hasRole(user, "analista");
};

// Permisos específicos
export const canManageUsers = (user: User | null): boolean => {
  return isAdmin(user);
};

export const canManageMasterData = (user: User | null): boolean => {
  // Admin puede gestionar empresas, contactos, medios, canales, acciones
  return isAdmin(user);
};

export const canCreateCampaigns = (user: User | null): boolean => {
  // Admin y comercial pueden crear campañas
  return hasAnyRole(user, ["admin", "comercial"]);
};

export const canViewAllCampaigns = (user: User | null): boolean => {
  // Solo admin puede ver todas las campañas
  return isAdmin(user);
};

export const canEditCampaign = (user: User | null, campaignCreatedBy?: number): boolean => {
  if (!user) return false;
  // Admin puede editar todas
  if (isAdmin(user)) return true;
  // Comercial solo puede editar las suyas
  if (isComercial(user) && campaignCreatedBy) {
    return user.id === campaignCreatedBy;
  }
  return false;
};

export const canDeleteCampaign = (user: User | null, campaignCreatedBy?: number): boolean => {
  // Misma lógica que edit
  return canEditCampaign(user, campaignCreatedBy);
};

export const canUpdateActionStatus = (user: User | null): boolean => {
  // Post-venta puede actualizar estados de acciones
  return hasAnyRole(user, ["admin", "post-venta"]);
};
