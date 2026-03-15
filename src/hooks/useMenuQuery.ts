import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { MenuData } from "../lib/types";

async function fetchMenu(): Promise<MenuData> {
  const { data } = await api.get<MenuData>("/api/menu", {
    headers: { "Cache-Control": "no-store" },
  });
  return data;
}

export function useMenuQuery() {
  return useQuery<MenuData, Error>({
    queryKey: ["menu"],
    queryFn: fetchMenu,
  });
}

