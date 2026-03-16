import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useProducts(filters?: {
  search?: string;
  category?: string;
  brand?: string;
  gender?: string;
  minPrice?: string;
  maxPrice?: string;
}) {
  return useQuery({
    queryKey: [api.products.list.path, filters],
    queryFn: async () => {
      // Remove undefined filters
      const cleanFilters = filters ? Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v != null && v !== "")
      ) : undefined;
      
      const url = cleanFilters 
        ? `${api.products.list.path}?${new URLSearchParams(cleanFilters as Record<string, string>).toString()}`
        : api.products.list.path;

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch products");
      return api.products.list.responses[200].parse(await res.json());
    },
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: [api.products.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.products.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch product");
      return api.products.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useProductRecommendations() {
  return useMutation({
    mutationFn: async (prompt: string) => {
      const res = await fetch(api.products.recommend.path, {
        method: api.products.recommend.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to get recommendations");
      return res.json() as Promise<{
        intro: string;
        recommendations: Array<{
          productId: number;
          name: string;
          brand: string;
          reason: string;
          image?: string | null;
        }>;
      }>;
    },
  });
}
