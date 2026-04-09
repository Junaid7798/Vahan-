import { isSupabaseConfigured } from "@/lib/auth/session";
import {
  getChatForViewer as getDemoChatForViewer,
  getDashboardData as getDemoDashboardData,
  getInquiriesForViewer as getDemoInquiriesForViewer,
  getRequestsForViewer as getDemoRequestsForViewer,
  getShellNotifications as getDemoShellNotifications,
  getSupportData as getDemoSupportData,
  getVehicleChatThread as getDemoVehicleChatThread,
  getVehicleMeta as getDemoVehicleMeta,
} from "@/lib/demo/portal-operations";
import {
  getChatForViewer as getSupabaseChatForViewer,
  getDashboardData as getSupabaseDashboardData,
  getInquiriesForViewer as getSupabaseInquiriesForViewer,
  getRequestsForViewer as getSupabaseRequestsForViewer,
  getShellNotifications as getSupabaseShellNotifications,
  getSupportData as getSupabaseSupportData,
  getVehicleChatThread as getSupabaseVehicleChatThread,
  getVehicleMeta as getSupabaseVehicleMeta,
} from "@/lib/supabase/portal-operations";

export async function getDashboardData(userId: string, permissions: Parameters<typeof getDemoDashboardData>[1]) {
  return isSupabaseConfigured()
    ? getSupabaseDashboardData(userId, permissions)
    : getDemoDashboardData(userId, permissions);
}

export async function getInquiriesForViewer(userId: string, canViewAll: boolean) {
  return isSupabaseConfigured()
    ? getSupabaseInquiriesForViewer(userId, canViewAll)
    : getDemoInquiriesForViewer(userId, canViewAll);
}

export async function getRequestsForViewer(userId: string) {
  return isSupabaseConfigured()
    ? getSupabaseRequestsForViewer(userId)
    : getDemoRequestsForViewer(userId);
}

export async function getChatForViewer(userId: string, canViewAll: boolean) {
  return isSupabaseConfigured()
    ? getSupabaseChatForViewer(userId, canViewAll)
    : getDemoChatForViewer(userId, canViewAll);
}

export async function getSupportData() {
  return isSupabaseConfigured() ? getSupabaseSupportData() : getDemoSupportData();
}

export async function getShellNotifications(userId: string, permissions: Parameters<typeof getDemoShellNotifications>[1]) {
  return isSupabaseConfigured()
    ? getSupabaseShellNotifications(userId, permissions)
    : getDemoShellNotifications(userId, permissions);
}

export async function getVehicleChatThread(listingId: string, userId: string) {
  return isSupabaseConfigured()
    ? getSupabaseVehicleChatThread(listingId, userId)
    : getDemoVehicleChatThread(listingId, userId);
}

export async function getVehicleMeta(listingId: string) {
  return isSupabaseConfigured() ? getSupabaseVehicleMeta(listingId) : getDemoVehicleMeta(listingId);
}
