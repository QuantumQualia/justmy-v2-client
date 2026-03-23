"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";

export type ConfirmDeletionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;

  title?: string;
  description: React.ReactNode;
  confirmText?: string;
  /** Shown on the confirm button while `loading` is true (e.g. after click until async work finishes). */
  loadingConfirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

export function ConfirmDeletionModal({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
  title = "Confirm deletion",
  description,
  confirmText = "Delete",
  loadingConfirmText = "Working...",
  cancelText = "Cancel",
  danger = true,
}: ConfirmDeletionModalProps) {
  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      console.error("Delete confirmation failed:", err);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && loading) return;
        onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent className="rounded-2xl rounded-br-none border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/40">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-300">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={loading}
            className="rounded-lg rounded-br-none border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-slate-100"
          >
            {cancelText}
          </AlertDialogCancel>

          <AlertDialogAction
            disabled={loading}
            variant={danger ? "destructive" : "default"}
            onClick={handleConfirm}
            className="rounded-lg rounded-br-none"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loadingConfirmText}
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
