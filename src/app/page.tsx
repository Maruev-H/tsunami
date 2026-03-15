"use client";

import Link from "next/link";
import { useMenuQuery } from "../hooks/useMenuQuery";

export default function Home() {
  const { data, isLoading, isError } = useMenuQuery();

  const popularItems = data?.categories.flatMap((c) => c.items).slice(0, 3) ?? [];

  return (
    <div className="ts-grid ts-grid-2 ts-card" style={{ padding: "1.5rem 1.4rem" }}>
      <section className="ts-page-header">
        <h1 className="ts-page-title">Современная азиатская кухня на волне вкуса.</h1>
        <p className="ts-page-subtitle">
          Tsunami — атмосферный ресторан у воды с акцентом на авторские роллы, рамен и
          боулы. Закажите любимые блюда онлайн, а мы подготовим всё к вашему приезду.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
          <Link href="/menu" className="ts-cart-button">
            Смотреть меню
          </Link>
          <span className="ts-pill">Заказ и бронь через WhatsApp</span>
        </div>
      </section>

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.9rem",
          padding: "0.4rem 0 0.2rem",
        }}
      >
        {isLoading && (
          <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Загружаем меню…</p>
        )}
        {isError && (
          <p style={{ fontSize: "0.9rem", color: "var(--danger)" }}>
            Не удалось загрузить меню. Попробуйте обновить страницу.
          </p>
        )}

        {!isLoading && !isError && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
              gap: "0.7rem",
            }}
          >
            {popularItems.map((item) => (
              <div
                key={item.id}
                style={{
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  padding: "0.7rem 0.75rem",
                  background: "var(--background-elevated)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.4rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{item.name}</span>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--accent-strong)",
                      fontWeight: 500,
                    }}
                  >
                    {item.price} ₽
                  </span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                  {item.description.replace(/\*\*|_/g, "").slice(0, 80)}…
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
