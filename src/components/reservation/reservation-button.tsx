import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

interface ReservationButtonProps {
  listingId: string;
  onClick?: (listingId: string) => void;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ReservationButton({ 
  listingId, 
  onClick,
  variant = "default",
  size = "default"
}: ReservationButtonProps) {
  return (
    <Button 
      type="button"
      variant={variant} 
      size={size}
      onClick={() => onClick?.(listingId)}
    >
      <Calendar className="mr-2 h-4 w-4" />
      Reserve Interest
    </Button>
  );
}

interface ReservationStatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-500" },
  approved: { label: "Approved", className: "bg-green-500" },
  rejected: { label: "Rejected", className: "bg-red-500" },
  cancelled: { label: "Cancelled", className: "bg-gray-500" },
  completed: { label: "Completed", className: "bg-blue-500" },
};

export function ReservationStatusBadge({ status }: ReservationStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: "bg-gray-500" };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${config.className}`}>
      {config.label}
    </span>
  );
}
