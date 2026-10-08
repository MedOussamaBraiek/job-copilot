import { toast } from "@/components/ui/toast";

export const notifySuccess = (title: string, description?: string) =>
  toast.add({ type: "success", title, description, timeout: 4000 });

export const notifyError = (title: string, description?: string) =>
  toast.add({ type: "error", title, description, timeout: 6000 });
