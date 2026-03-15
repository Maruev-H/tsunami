"use client";

import { FormEvent, MouseEvent, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession, signIn, signOut } from "next-auth/react";
import type { MenuCategory, MenuData, MenuItem } from "../../lib/types";
import { api } from "../../lib/api";

type AdminState = {
  categoryId: string;
  name: string;
  price: string;
  description: string;
  image: string;
};

async function fetchMenu(): Promise<MenuData> {
  const { data } = await api.get<MenuData>("/api/menu");
  return data;
}

async function saveMenu(data: MenuData): Promise<void> {
  await api.put("/api/menu", data);
}

function validateItemDraft(state: AdminState): string | null {
  if (!state.categoryId) return "Выберите категорию.";
  if (!state.name.trim()) return "Укажите название блюда.";
  const priceNumber = Number(state.price.replace(",", "."));
  if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
    return "Цена должна быть положительным числом.";
  }
  if (!state.description.trim()) return "Добавьте описание блюда.";
  return null;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);
    const result = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });
    setIsSubmitting(false);
    if (result?.error) {
      setAuthError(result.error || "Ошибка авторизации");
    }
  };

  const isAdmin = session?.user && (session.user as any).role === "admin";

  if (status === "loading") {
    return (
      <div className="ts-card" style={{ padding: "1.4rem 1.5rem", maxWidth: 420, marginInline: "auto" }}>
        <p style={{ fontSize: "0.9rem" }}>Проверяем сессию…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="ts-card" style={{ padding: "1.4rem 1.5rem", maxWidth: 420, marginInline: "auto" }}>
        <div className="ts-page-header" style={{ marginBottom: "0.9rem" }}>
          <h1 className="ts-page-title">Admin · Tsunami</h1>
          <p className="ts-page-subtitle">
            Вход только для сотрудников ресторана. Используйте выданные логин и пароль.
          </p>
        </div>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <span style={{ fontSize: "0.8rem" }}>Логин</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              style={{
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                padding: "0.55rem 0.7rem",
                background: "#ffffff",
                color: "#111827",
                fontSize: "0.85rem",
              }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <span style={{ fontSize: "0.8rem" }}>Пароль</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                padding: "0.55rem 0.7rem",
                background: "#ffffff",
                color: "#111827",
                fontSize: "0.85rem",
              }}
            />
          </label>
          {authError && (
            <p style={{ fontSize: "0.8rem", color: "var(--danger)" }}>{authError}</p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: "0.2rem",
              padding: "0.5rem 0.9rem",
              borderRadius: 10,
              border: "1px solid #042e59",
              background: "#042e59",
              color: "#f9fafb",
              fontWeight: 500,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            Войти
          </button>
        </form>
      </div>
    );
  }

  return <AdminPanel onSignOut={() => signOut()} />;
}

function AdminPanel({ onSignOut }: { onSignOut: () => void }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery<MenuData, Error>({
    queryKey: ["menu"],
    queryFn: fetchMenu,
  });

  const [draft, setDraft] = useState<AdminState>({
    categoryId: "",
    name: "",
    price: "",
    description: "",
    image: "",
  });
  const [categoryName, setCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [itemError, setItemError] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: saveMenu,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
  });

  const categories = data?.categories ?? [];

  const draftError = useMemo(() => validateItemDraft(draft), [draft]);

  const handleAddCategory = (e: FormEvent) => {
    e.preventDefault();
    setCategoryError(null);
    if (!categoryName.trim()) {
      setCategoryError("Название категории не может быть пустым.");
      return;
    }
    if (!data) return;

    const id = categoryName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const newCategory: MenuCategory = {
      id,
      slug: id,
      name: categoryName.trim(),
      description: "",
      items: [],
    };

    const next: MenuData = {
      ...data,
      categories: [...data.categories, newCategory],
    };

    mutation.mutate(next);
    setCategoryName("");
  };

  const handleAddItem = (e: FormEvent) => {
    e.preventDefault();
    setItemError(null);
    const validationError = validateItemDraft(draft);
    if (validationError) {
      setItemError(validationError);
      return;
    }
    if (!data) return;

    const priceNumber = Number(draft.price.replace(",", "."));

    const categoryIndex = data.categories.findIndex(
      (c) => c.id === draft.categoryId,
    );
    if (categoryIndex === -1) {
      setItemError("Выбранная категория не найдена.");
      return;
    }

    const idBase = draft.name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const id = `${idBase}-${Date.now().toString(36)}`;

    const nextCategories = [...data.categories];

    if (editingItemId) {
      nextCategories[categoryIndex] = {
        ...nextCategories[categoryIndex],
        items: nextCategories[categoryIndex].items.map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                name: draft.name.trim(),
                price: priceNumber,
                description: draft.description.trim(),
                image: draft.image || item.image,
              }
            : item,
        ),
      };
    } else {
      const newItem: MenuItem = {
        id,
        name: draft.name.trim(),
        price: priceNumber,
        image: draft.image || "/images/placeholder-dish.svg",
        description: draft.description.trim(),
      };

      nextCategories[categoryIndex] = {
        ...nextCategories[categoryIndex],
        items: [...nextCategories[categoryIndex].items, newItem],
      };
    }

    const next: MenuData = { ...data, categories: nextCategories };
    mutation.mutate(next);
    setDraft((prev) => ({
      ...prev,
      name: "",
      price: "",
      description: "",
      image: "",
    }));
    setEditingItemId(null);
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    if (!data) return;
    const next: MenuData = {
      ...data,
      categories: data.categories.map((c) =>
        c.id === categoryId
          ? { ...c, items: c.items.filter((i) => i.id !== itemId) }
          : c,
      ),
    };
    mutation.mutate(next);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (!data) return;
    const next: MenuData = {
      ...data,
      categories: data.categories.filter((c) => c.id !== categoryId),
    };
    mutation.mutate(next);
    if (draft.categoryId === categoryId) {
      setDraft((prev) => ({ ...prev, categoryId: "" }));
    }
  };

  const handleEditClick = (categoryId: string, item: MenuItem, e: MouseEvent) => {
    e.preventDefault();
    setDraft({
      categoryId,
      name: item.name,
      price: String(item.price),
      description: item.description,
      image: item.image,
    });
    setEditingItemId(item.id);
    setItemError(null);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setDraft((prev) => ({
      ...prev,
      name: "",
      price: "",
      description: "",
      image: "",
    }));
    setItemError(null);
  };

  const handleUploadImage = async (e: MouseEvent) => {
    e.preventDefault();
    setImageError(null);

    if (!draft.image.trim()) {
      setImageError("Укажите URL изображения для загрузки.");
      return;
    }

    try {
      setIsUploadingImage(true);
      const response = await api.post<{ link: string; shortLink: string | null }>(
        "/api/images",
        {
          url: draft.image.trim(),
        },
      );
      setDraft((prev) => ({ ...prev, image: response.data.link }));
    } catch (error: any) {
      setImageError(
        error?.response?.data?.message ??
          error?.message ??
          "Не удалось загрузить изображение. Проверьте URL.",
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="ts-grid ts-grid-2" style={{ gap: "1.2rem" }}>
      <section className="ts-card" style={{ padding: "1rem 1.1rem" }}>
        <div className="ts-page-header" style={{ marginBottom: "0.9rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center" }}>
            <div>
              <h1 className="ts-page-title">Админ-панель</h1>
              <p className="ts-page-subtitle">
                Управляйте категориями и блюдами. Все изменения сохраняются в JSON-файл и
                мгновенно доступны на сайте.
              </p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              style={{
                borderRadius: "999px",
                padding: "0.3rem 0.8rem",
                border: "1px solid rgba(148,163,184,0.8)",
                background: "transparent",
                color: "var(--muted)",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              Выйти
            </button>
          </div>
        </div>

        {isLoading && (
          <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Загружаем меню…</p>
        )}
        {isError && (
          <p style={{ fontSize: "0.9rem", color: "var(--danger)" }}>
            {error?.message ?? "Ошибка загрузки меню"}
          </p>
        )}

        {data && (
          <div style={{ display: "grid", gap: "0.85rem" }}>
            {data.categories.map((category) => (
              <div
                key={category.id}
                style={{
                  padding: "0.7rem 0.8rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  background: "#ffffff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    alignItems: "baseline",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                    <strong style={{ fontSize: "0.9rem" }}>{category.name}</strong>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--muted)",
                      }}
                    >
                      id: {category.id} · {category.items.length} позиций
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(category.id)}
                    style={{
                      borderRadius: "999px",
                      padding: "0.25rem 0.55rem",
                      border: "1px solid rgba(239,68,68,0.8)",
                      background: "transparent",
                      color: "var(--danger)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    Удалить категорию
                  </button>
                </div>

                {category.items.length > 0 && (
                  <ul
                    style={{
                      listStyle: "none",
                      margin: "0.6rem 0 0",
                      padding: 0,
                      display: "grid",
                      gap: "0.35rem",
                    }}
                  >
                    {category.items.map((item) => (
                      <li
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "0.75rem",
                          fontSize: "0.8rem",
                        }}
                      >
                        <button
                          type="button"
                          onClick={(e) => handleEditClick(category.id, item, e)}
                          style={{
                            border: "none",
                            padding: 0,
                            background: "transparent",
                            color: "var(--foreground)",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          {item.name} · {item.price} ₽
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(category.id, item.id)}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "var(--danger)",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                          }}
                        >
                          Удалить
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="ts-card" style={{ padding: "1rem 1.1rem" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div>
            <h2 style={{ fontSize: "0.95rem", marginBottom: "0.25rem" }}>
              Новая категория
            </h2>
            <form
              onSubmit={handleAddCategory}
              style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
            >
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Название категории (например, Роллы)"
                style={{
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  padding: "0.5rem 0.7rem",
                  background: "#ffffff",
                  color: "#111827",
                  fontSize: "0.85rem",
                }}
              />
              {categoryError && (
                <p style={{ fontSize: "0.8rem", color: "var(--danger)" }}>
                  {categoryError}
                </p>
              )}
              <button
                type="submit"
                style={{
                  alignSelf: "flex-start",
                  padding: "0.4rem 0.85rem",
                  borderRadius: "999px",
                  border: "1px solid rgba(148,163,184,0.8)",
                  background: "transparent",
                  color: "var(--muted)",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                Добавить категорию
              </button>
            </form>
          </div>

          <div
            style={{
              height: 1,
              background:
                "linear-gradient(to right,transparent,rgba(148,163,184,0.4),transparent)",
              margin: "0.2rem 0",
            }}
          />

          <div>
            <h2 style={{ fontSize: "0.95rem", marginBottom: "0.25rem" }}>
              {editingItemId ? "Редактирование блюда" : "Новое блюдо"}
            </h2>
            <form
              onSubmit={handleAddItem}
              style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
            >
              <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.8rem" }}>Категория</span>
                <select
                  value={draft.categoryId}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, categoryId: e.target.value }))
                  }
                  style={{
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                    padding: "0.5rem 0.7rem",
                    background: "#ffffff",
                    color: "#111827",
                    fontSize: "0.85rem",
                  }}
                >
                  <option value="">Выберите категорию…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.8rem" }}>Название блюда</span>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Например, Tsunami Signature"
                  style={{
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                    padding: "0.5rem 0.7rem",
                    background: "#ffffff",
                    color: "#111827",
                    fontSize: "0.85rem",
                  }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.8rem" }}>Цена, ₽</span>
                <input
                  type="text"
                  value={draft.price}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, price: e.target.value }))
                  }
                  placeholder="Например, 890"
                  style={{
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                    padding: "0.5rem 0.7rem",
                    background: "rgba(15,23,42,0.9)",
                    color: "var(--foreground)",
                    fontSize: "0.85rem",
                  }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.8rem" }}>
                  Изображение (URL, загрузка в ImageBan)
                </span>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <input
                    type="text"
                    value={draft.image}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, image: e.target.value }))
                    }
                    placeholder="https://пример.ру/изображение.jpg"
                    style={{
                      flex: 1,
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-subtle)",
                      padding: "0.5rem 0.7rem",
                      background: "#ffffff",
                      color: "#111827",
                      fontSize: "0.85rem",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleUploadImage}
                    disabled={isUploadingImage}
                    style={{
                      borderRadius: 10,
                      padding: "0.4rem 0.8rem",
                      border: "1px solid #042e59",
                      background: "#042e59",
                      color: "#f9fafb",
                      fontSize: "0.8rem",
                      cursor: isUploadingImage ? "not-allowed" : "pointer",
                      opacity: isUploadingImage ? 0.7 : 1,
                    }}
                  >
                    Загрузить
                  </button>
                </div>
                {imageError && (
                  <p style={{ fontSize: "0.8rem", color: "var(--danger)" }}>{imageError}</p>
                )}
                {draft.image && (
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                    Текущее изображение: {draft.image}
                  </span>
                )}
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.8rem" }}>
                  Описание (Markdown поддерживается)
                </span>
                <textarea
                  value={draft.description}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={4}
                  placeholder="Краткое, но аппетитное описание. Можно выделять **жирный** и _курсив_."
                  style={{
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                    padding: "0.55rem 0.7rem",
                    background: "#ffffff",
                    color: "#111827",
                    fontSize: "0.85rem",
                    resize: "vertical",
                  }}
                />
              </label>

              {itemError && (
                <p style={{ fontSize: "0.8rem", color: "var(--danger)" }}>{itemError}</p>
              )}
              {mutation.isError && (
                <p style={{ fontSize: "0.8rem", color: "var(--danger)" }}>
                  {(mutation.error as Error)?.message ??
                    "Ошибка при сохранении меню."}
                </p>
              )}

              <button
                type="submit"
                disabled={Boolean(draftError) || mutation.isPending}
                style={{
                  alignSelf: "flex-start",
                  padding: "0.45rem 0.95rem",
                  borderRadius: 10,
                  border: "1px solid #042e59",
                  background: "#042e59",
                  color: "#f9fafb",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  cursor: draftError || mutation.isPending ? "not-allowed" : "pointer",
                  opacity: draftError || mutation.isPending ? 0.6 : 1,
                }}
              >
                {editingItemId ? "Сохранить изменения" : "Добавить блюдо"}
              </button>
              {editingItemId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    alignSelf: "flex-start",
                    marginTop: "0.15rem",
                    padding: "0.35rem 0.85rem",
                    borderRadius: "999px",
                    border: "1px solid rgba(148,163,184,0.7)",
                    background: "transparent",
                    color: "var(--muted)",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  Отменить редактирование
                </button>
              )}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

