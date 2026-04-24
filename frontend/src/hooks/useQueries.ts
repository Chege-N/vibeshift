import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi, userApi, billingApi } from "@/utils/api";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

// ── User ─────────────────────────────────────────────────────
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: userApi.me,
    staleTime: 60_000,
  });
}

// ── Jobs ─────────────────────────────────────────────────────
export function useJobs() {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: () => jobsApi.list(),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const hasPending = data.some((j) =>
        ["pending", "transcribing", "processing"].includes(j.status)
      );
      return hasPending ? 3000 : false;
    },
  });
}

export function useJob(id: number) {
  return useQuery({
    queryKey: ["jobs", id],
    queryFn: () => jobsApi.get(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && ["pending", "transcribing", "processing"].includes(status) ? 2000 : false;
    },
  });
}

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: jobsApi.stats,
    staleTime: 30_000,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: jobsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      // Cache the new job immediately so the detail page loads instantly
      queryClient.setQueryData(["jobs", data.id], data);
      toast.success("Job created! Processing your content…");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || "Failed to create job";
      toast.error(msg);
    },
  });
}

export function useUploadJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: jobsApi.upload,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.setQueryData(["jobs", data.id], data);
      toast.success("File uploaded! Transcribing & repurposing…");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || "Upload failed";
      toast.error(msg);
    },
  });
}

// ── Billing ──────────────────────────────────────────────────
export function useCheckout() {
  return useMutation({
    mutationFn: (plan: string) => billingApi.checkout(plan),
    onSuccess: (data) => {
      // Redirect to Paystack payment page
      window.location.href = data.checkout_url;
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || "Failed to start checkout";
      toast.error(msg);
    },
  });
}

export function useBillingPortal() {
  return useMutation({
    mutationFn: billingApi.portal,
    onSuccess: (data) => {
      window.location.href = data.portal_url;
    },
    onError: () => toast.error("Failed to open billing portal"),
  });
}
