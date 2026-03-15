import fs from "node:fs/promises";
import path from "node:path";
import type { MenuData } from "./types";

const DATA_FILE = path.join(process.cwd(), "data", "menu.json");

export async function readMenu(): Promise<MenuData> {
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw) as MenuData;
  return parsed;
}

export async function writeMenu(data: MenuData): Promise<void> {
  validateMenu(data);
  const serialized = JSON.stringify(data, null, 2);
  await fs.writeFile(DATA_FILE, serialized, "utf8");
}

export function validateMenu(data: MenuData): void {
  if (!data || !Array.isArray(data.categories)) {
    throw new Error("Menu must contain categories array.");
  }

  for (const category of data.categories) {
    if (!category.id || !category.name || !category.slug) {
      throw new Error("Each category must have id, name and slug.");
    }
    if (!Array.isArray(category.items)) {
      throw new Error(`Category ${category.name} must contain items array.`);
    }
    for (const item of category.items) {
      if (!item.id || !item.name) {
        throw new Error("Each item must have id and name.");
      }
      if (typeof item.price !== "number" || Number.isNaN(item.price) || item.price <= 0) {
        throw new Error(`Item ${item.name} must have positive numeric price.`);
      }
      if (!item.description) {
        throw new Error(`Item ${item.name} must have description.`);
      }
    }
  }
}

