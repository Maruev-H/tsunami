"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMenuQuery } from "../../hooks/useMenuQuery";
import { MenuCategorySection } from "../../components/menu/MenuCategorySection";
import type { MenuCategory } from "../../lib/types";

const SCROLL_SPY_OFFSET = 200;

export default function MenuPage() {
  const { data, isLoading, isError } = useMenuQuery();
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (data?.categories.length && activeCategoryId === null) {
      setActiveCategoryId(data.categories[0].id);
    }
  }, [data, activeCategoryId]);

  const updateActiveFromScroll = useCallback(() => {
    if (!data?.categories.length) return;
    const categories = search.trim()
      ? data.categories.filter((cat) =>
          cat.items.some((item) =>
            item.name.toLowerCase().includes(search.trim().toLowerCase()),
          ),
        )
      : data.categories;
    let nextActive: string | null = null;
    for (const category of categories) {
      const el = document.getElementById(`category-${category.id}`);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (rect.top <= SCROLL_SPY_OFFSET) {
        nextActive = category.id;
      }
    }
    if (nextActive === null && categories.length > 0) {
      nextActive = categories[0].id;
    }
    if (nextActive !== null) {
      setActiveCategoryId((prev) => (prev === nextActive ? prev : nextActive));
    }
  }, [data, search]);

  useEffect(() => {
    updateActiveFromScroll();
    window.addEventListener("scroll", updateActiveFromScroll, {
      passive: true,
    });
    return () => window.removeEventListener("scroll", updateActiveFromScroll);
  }, [updateActiveFromScroll]);

  function scrollToCategory(categoryId: string) {
    setActiveCategoryId(categoryId);
    const el = document.getElementById(`category-${categoryId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const filteredCategories = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.categories;
    return data.categories
      .map((cat: MenuCategory) => ({
        ...cat,
        items: cat.items.filter((item) => item.name.toLowerCase().includes(q)),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [data, search]);

  return (
    <div className="ts-page">
      {/* Навбар категорий — стики под хедером */}
      {data && (
        <>
          <div className="ts-menu-bar">
            <div className="ts-menu-categories" role="tablist">
              {data.categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className="ts-menu-category-btn"
                  data-active={
                    activeCategoryId === category.id ? "true" : "false"
                  }
                  onClick={() => scrollToCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          {/* Поиск под навбаром */}
          <div className="ts-menu-search-wrap">
            <input
              type="search"
              placeholder="Поиск по меню..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ts-menu-search"
              aria-label="Поиск по меню"
            />
          </div>
        </>
      )}

      {isLoading && (
        <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
          Загружаем меню…
        </p>
      )}
      {isError && (
        <p style={{ fontSize: "0.9rem", color: "var(--danger)" }}>
          Не удалось загрузить меню. Попробуйте обновить страницу.
        </p>
      )}

      {data && (
        <div className="ts-grid" style={{ gap: "1rem" }}>
          {filteredCategories.map((category) => (
            <MenuCategorySection
              key={category.id}
              category={category}
              sectionId={`category-${category.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
