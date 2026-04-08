"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Loader2 } from "lucide-react";

interface WaitlistButtonProps {
  listingId: string;
  onClick?: (listingId: string) => void;
}

export function WaitlistButton({ listingId, onClick }: WaitlistButtonProps) {
  return (
    <Button type="button" variant="outline" onClick={() => onClick?.(listingId)}>
      <Users className="mr-2 h-4 w-4" />
      Join Waitlist
    </Button>
  );
}

interface WaitlistDialogProps {
  listingId: string;
  vehicleInfo?: string;
  currentPosition?: number;
  totalInLine?: number;
  onSubmit?: (listingId: string) => Promise<void>;
  trigger?: React.ReactNode;
}

export function WaitlistDialog({ 
  listingId, 
  vehicleInfo,
  currentPosition,
  totalInLine,
  onSubmit,
  trigger 
}: WaitlistDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleJoin = async () => {
    if (!onSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(listingId);
      setOpen(false);
    } catch (error) {
      console.error("Error joining waitlist:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button type="button" variant="outline">
      <Users className="mr-2 h-4 w-4" />
      Join Waitlist
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Waitlist</DialogTitle>
          <DialogDescription>
            {vehicleInfo 
              ? `Join the waitlist for ${vehicleInfo}`
              : "Join the waitlist for this vehicle"}
          </DialogDescription>
        </DialogHeader>
        
        {currentPosition !== undefined ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">Your position in line</p>
              <p className="text-4xl font-bold text-primary">
                #{currentPosition}
              </p>
              {totalInLine && (
                <p className="text-sm text-muted-foreground mt-2">
                  of {totalInLine} people
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This vehicle is currently reserved. Join the waitlist to be notified if it becomes available.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleJoin} disabled={isSubmitting || !onSubmit}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Join Waitlist
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface WaitlistStatusBadgeProps {
  position: number;
}

export function WaitlistStatusBadge({ position }: WaitlistStatusBadgeProps) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      Position #{position}
    </span>
  );
}

interface WaitlistEntryCardProps {
  entry: {
    id: string;
    listing_id: string;
    position: number;
    status: string;
    created_at: string;
  };
  vehicleInfo?: string;
  onLeave?: (id: string) => void;
}

export function WaitlistEntryCard({ entry, vehicleInfo, onLeave }: WaitlistEntryCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          {vehicleInfo && <p className="font-medium">{vehicleInfo}</p>}
          <p className="text-sm text-muted-foreground">
            Joined: {formatDate(entry.created_at)}
          </p>
        </div>
        <WaitlistStatusBadge position={entry.position} />
      </div>
      {entry.status === "waiting" && onLeave && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onLeave(entry.id)}
        >
          Leave Waitlist
        </Button>
      )}
    </div>
  );
}
