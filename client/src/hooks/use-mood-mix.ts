import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertMoodMix } from "@shared/schema";

export function useMoodMixes() {
  return useQuery({
    queryKey: [api.moodMix.list.path],
    queryFn: async () => {
      const res = await fetch(api.moodMix.list.path, { credentials: "include" });
      if (res.status === 401) return null; // Handle unauthorized gracefully
      if (!res.ok) throw new Error("Failed to fetch mood mixes");
      return api.moodMix.list.responses[200].parse(await res.json());
    },
  });
}

export function useMoodMix(id: number) {
  return useQuery({
    queryKey: [api.moodMix.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.moodMix.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 401) return null;
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch mood mix");
      return api.moodMix.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateMoodMix() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<InsertMoodMix>) => {
      const res = await fetch(api.moodMix.create.path, {
        method: api.moodMix.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create mood mix");
      return api.moodMix.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.moodMix.list.path] }),
  });
}

export function useUpdateMoodMix() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, description }: { id: number; name?: string; description?: string }) => {
      const res = await fetch(`/api/mood-mixes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update mood mix");
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.moodMix.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.moodMix.list.path] });
    },
  });
}

export function useAddToMoodMix() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, productId }: { id: number; productId: number }) => {
      const url = buildUrl(api.moodMix.addItem.path, { id });
      const res = await fetch(url, {
        method: api.moodMix.addItem.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add item to mood mix");
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.moodMix.get.path, id] });
      queryClient.invalidateQueries({ queryKey: ["/api/mood-mixes", id, "suggestions"] });
    },
  });
}

export function useMoodMixSuggestions(id: number, hasItems: boolean) {
  return useQuery({
    queryKey: ["/api/mood-mixes", id, "suggestions"],
    queryFn: async () => {
      const res = await fetch(`/api/mood-mixes/${id}/suggestions`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch suggestions");
      return res.json() as Promise<{ suggestions: Array<{ productId: number; name: string; brand: string; image: string; reason: string }> }>;
    },
    enabled: !!id && hasItems,
  });
}

export function useRemoveFromMoodMix() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, productId }: { id: number; productId: number }) => {
      const url = buildUrl(api.moodMix.removeItem.path, { id, productId });
      const res = await fetch(url, {
        method: api.moodMix.removeItem.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove item from mood mix");
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.moodMix.get.path, id] });
      queryClient.invalidateQueries({ queryKey: ["/api/mood-mixes", id, "suggestions"] });
    },
  });
}
