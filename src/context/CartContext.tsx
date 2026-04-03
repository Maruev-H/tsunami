"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useMenuQuery } from "../hooks/useMenuQuery";
import type { MenuData } from "../lib/types";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type StoredCartPayload = {
  v: number;
  items: { id: string; quantity: number }[];
};

const STORAGE_KEY = "tsunami-cart";
const STORAGE_VERSION = 1;

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

function flattenMenuById(menu: MenuData): Map<string, { name: string; price: number }> {
  const map = new Map<string, { name: string; price: number }>();
  for (const cat of menu.categories) {
    for (const item of cat.items) {
      map.set(item.id, { name: item.name, price: item.price });
    }
  }
  return map;
}

function readStoredCart(): { id: string; quantity: number }[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCartPayload;
    if (parsed?.v !== STORAGE_VERSION || !Array.isArray(parsed.items)) return null;
    return parsed.items.filter(
      (it) => typeof it.id === "string" && typeof it.quantity === "number" && it.quantity > 0,
    );
  } catch {
    return null;
  }
}

function writeStoredCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  const payload: StoredCartPayload = {
    v: STORAGE_VERSION,
    items: items.map(({ id, quantity }) => ({ id, quantity })),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

/** Оставляет только позиции, id которых есть в меню; имя и цена — с бэка. */
function intersectWithMenu(
  source: { id: string; quantity: number }[],
  menu: MenuData,
): CartItem[] {
  const byId = flattenMenuById(menu);
  const qtyById = new Map<string, number>();
  for (const row of source) {
    const q = Math.floor(row.quantity);
    if (q < 1) continue;
    qtyById.set(row.id, (qtyById.get(row.id) ?? 0) + q);
  }
  const out: CartItem[] = [];
  for (const [id, quantity] of qtyById) {
    const meta = byId.get(id);
    if (!meta) continue;
    out.push({
      id,
      name: meta.name,
      price: meta.price,
      quantity,
    });
  }
  return out;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const hydrated = useRef(false);
  const { data: menu, isSuccess } = useMenuQuery();

  useEffect(() => {
    if (!isSuccess || !menu?.categories) return;
    setItems((prev) => {
      const fromStorage = readStoredCart();
      const base: { id: string; quantity: number }[] =
        prev.length > 0
          ? prev.map(({ id, quantity }) => ({ id, quantity }))
          : (fromStorage ?? []);
      return intersectWithMenu(base, menu);
    });
    hydrated.current = true;
  }, [menu, isSuccess]);

  useEffect(() => {
    if (!hydrated.current) return;
    writeStoredCart(items);
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((it) => it.id === item.id);
      if (existing) {
        return prev.map((it) =>
          it.id === item.id ? { ...it, quantity: it.quantity + 1 } : it,
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((it) => (it.id === id ? { ...it, quantity } : it))
        .filter((it) => it.quantity > 0),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, it) => {
          acc.totalItems += it.quantity;
          acc.totalPrice += it.price * it.quantity;
          return acc;
        },
        { totalItems: 0, totalPrice: 0 },
      ),
    [items],
  );

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clear,
    totalItems: totals.totalItems,
    totalPrice: totals.totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
