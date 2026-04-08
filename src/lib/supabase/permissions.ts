export type UserRole = "admin" | "manager" | "user";
export type ApprovalStatus = "pending_approval" | "approved" | "rejected" | "disabled";

export interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  role: UserRole;
  approval_status: ApprovalStatus;
  can_view_financials: boolean;
  created_at: string;
  updated_at: string;
}

export interface PermissionCheck {
  canViewVehicles: boolean;
  canViewFinancials: boolean;
  canManageVehicles: boolean;
  canManageUsers: boolean;
  canViewAllListings: boolean;
  canCreateListings: boolean;
  canManageReservations: boolean;
  canViewAllInquiries: boolean;
  canViewAllChats: boolean;
  canApproveUsers: boolean;
  isApproved: boolean;
}

export function getPermissions(profile: UserProfile | null): PermissionCheck {
  if (!profile) {
    return {
      canViewVehicles: false,
      canViewFinancials: false,
      canManageVehicles: false,
      canManageUsers: false,
      canViewAllListings: false,
      canCreateListings: false,
      canManageReservations: false,
      canViewAllInquiries: false,
      canViewAllChats: false,
      canApproveUsers: false,
      isApproved: false,
    };
  }

  if (profile.approval_status === "disabled") {
    return {
      canViewVehicles: false,
      canViewFinancials: false,
      canManageVehicles: false,
      canManageUsers: false,
      canViewAllListings: false,
      canCreateListings: false,
      canManageReservations: false,
      canViewAllInquiries: false,
      canViewAllChats: false,
      canApproveUsers: false,
      isApproved: false,
    };
  }

  const isAdmin = profile.role === "admin";
  const isManager = profile.role === "manager";
  const isStaff = isAdmin || isManager;
  const isApproved = profile.approval_status === "approved";

  return {
    canViewVehicles: isApproved || isStaff,
    canViewFinancials: isAdmin || (isApproved && profile.can_view_financials),
    canManageVehicles: isStaff,
    canManageUsers: isAdmin,
    canViewAllListings: isStaff,
    canCreateListings: isStaff,
    canManageReservations: isStaff,
    canViewAllInquiries: isStaff,
    canViewAllChats: isStaff,
    canApproveUsers: isAdmin,
    isApproved,
  };
}

export function canUserAccessListing(
  profile: UserProfile | null,
  listingStatus: string
): boolean {
  if (!profile) return false;
  if (profile.approval_status === "disabled") return false;

  const isApproved = profile.approval_status === "approved";
  const isAdminOrManager = profile.role === "admin" || profile.role === "manager";

  if (!isApproved && !isAdminOrManager) return false;
  if (isAdminOrManager) return true;

  return ["published", "reserved", "sold"].includes(listingStatus);
}

export function getFinancialFieldsVisibility(
  profile: UserProfile | null
): "all" | "none" | "partial" {
  if (!profile) return "none";
  if (profile.approval_status === "disabled") return "none";
  if (profile.role === "admin") return "all";
  if (profile.role === "manager") return profile.can_view_financials ? "all" : "none";
  if (profile.can_view_financials && profile.approval_status === "approved") return "partial";
  return "none";
}

export function sanitizeListingForUser(
  profile: UserProfile | null,
  listing: Record<string, unknown>
): Record<string, unknown> {
  const financialFields = [
    "procurement_price",
    "target_selling_price",
    "extra_spend",
    "maintenance_cost",
    "documentation_cost",
    "transport_cost",
    "other_cost",
  ];

  const visibility = getFinancialFieldsVisibility(profile);

  if (visibility === "none") {
    return financialFields.reduce((acc, field) => {
      acc[field] = null;
      return acc;
    }, { ...listing });
  }

  if (visibility === "partial") {
    return {
      ...listing,
      procurement_price: null,
      extra_spend: null,
      maintenance_cost: null,
      documentation_cost: null,
      transport_cost: null,
      other_cost: null,
    };
  }

  return listing;
}
