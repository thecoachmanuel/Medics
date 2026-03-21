"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateUserBlockStatus } from "@/actions/admin-actions";
import { Loader2, Ban, CheckCircle } from "lucide-react";

interface BlockUserButtonProps {
  userId: string;
  isBlocked: boolean;
  userRole: "doctor" | "patient";
}

export default function BlockUserButton({ userId, isBlocked, userRole }: BlockUserButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = () => {
    startTransition(async () => {
      const action = isBlocked ? "unblock" : "block";
      try {
        const result = await updateUserBlockStatus(userId, userRole, action);
        
        if (result.success) {
          toast.success(
            isBlocked 
              ? "User unblocked successfully" 
              : "User blocked successfully",
            {
              description: isBlocked 
                ? "The user can now access their account." 
                : "The user has been prevented from logging in."
            }
          );
          router.refresh();
        } else {
          toast.error("Failed to update status", {
            description: result.error || "An unexpected error occurred."
          });
        }
      } catch (error) {
        toast.error("An error occurred", {
          description: "Please try again later."
        });
      }
    });
  };

  return (
    <Button 
      onClick={handleToggle} 
      disabled={isPending}
      variant={isBlocked ? "outline" : "destructive"}
      size="sm"
      className="w-full sm:w-auto"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isBlocked ? "Unblocking..." : "Blocking..."}
        </>
      ) : (
        <>
          {isBlocked ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Unblock Account
            </>
          ) : (
            <>
              <Ban className="mr-2 h-4 w-4" />
              Block Account
            </>
          )}
        </>
      )}
    </Button>
  );
}
