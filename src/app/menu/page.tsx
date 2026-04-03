"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMenuQuery } from "../../hooks/useMenuQuery";
import { MenuCategorySection } from "../../components/menu/MenuCategorySection";
import type { MenuCategory, MenuItem } from "../../lib/types";

function itemMatchesSearch(item: MenuItem, q: string): boolean {
  const qn = q.trim().toLowerCase();
  if (!qn) return true;
  const name = item.name.toLowerCase();
  const desc = item.description.toLowerCase();
  return name.includes(qn) || desc.includes(qn);
}

/* Порог для scroll spy: хедер + панель категорий/поиска */
const SCROLL_SPY_OFFSET = 180;

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
          cat.items.some((item) => itemMatchesSearch(item, search)),
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
        items: cat.items.filter((item) => itemMatchesSearch(item, q)),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [data, search]);

  return (
    <div className={`ts-page${data ? " ts-page--menu" : ""}`}>
      {/* Фиксированный блок под основным хедером: категории + поиск */}
      {data && (
        <div className="ts-menu-sticky-wrap">
          <div className="ts-menu-sticky-inner">
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
            <div className="ts-menu-search-wrap">
              <div className="ts-menu-search-field">
                <input
                  type="search"
                  placeholder="Поиск по меню..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="ts-menu-search"
                  aria-label="Поиск по меню"
                  autoComplete="off"
                />
                <span className="ts-menu-search-icon" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
                      stroke="currentColor"
                      strokeWidth="1.75"
                    />
                    <path
                      d="M16.5 16.5L21 21"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
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
