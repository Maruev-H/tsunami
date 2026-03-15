"use client";

import { FormEvent, useState } from "react";
import { useCart } from "../../context/CartContext";

const WHATSAPP_PHONE = "79991234567"; // без +, только цифры

export default function CartPage() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clear } = useCart();
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasItems = items.length > 0;
  const isAddressValid = address.trim().length >= 8;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasItems) {
      setError("Добавьте хотя бы одно блюдо в корзину.");
      return;
    }
    if (!isAddressValid) {
      setError("Пожалуйста, укажите адрес (минимум несколько слов).");
      return;
    }

    setIsSubmitting(true);

    const lines = [
      "Здравствуйте! Хочу оформить заказ в Tsunami:",
      "",
      ...items.map(
        (item) => `• ${item.name} — ${item.quantity} шт. × ${item.price} ₽ = ${
          item.price * item.quantity
        } ₽`,
      ),
      "",
      `Итого: ${totalPrice} ₽`,
      "",
      `Адрес: ${address.trim()}`,
    ];

    if (note.trim()) {
      lines.push(`Комментарий: ${note.trim()}`);
    }

    const message = encodeURIComponent(lines.join("\n"));
    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${message}`;

    // открываем WhatsApp
    window.open(url, "_blank", "noopener,noreferrer");
    setIsSubmitting(false);
  };

  return (
    <div>
      <div className="ts-page-header">
        <h1 className="ts-page-title">Ваш заказ</h1>
        <p className="ts-page-subtitle">
          Проверьте позиции и укажите адрес. Нажмите «Оформить заказ» — мы получим заявку
          в WhatsApp и подтвердим детали.
        </p>
      </div>

      <div className="ts-grid ts-grid-2" style={{ gap: "1.25rem" }}>
        <section
          className="ts-card"
          style={{ padding: "1rem 1.1rem", minHeight: "160px" }}
        >
          {hasItems ? (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.6rem" }}>
              {items.map((item) => (
                <li
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "0.9rem",
                    borderBottom: "1px solid rgba(30,64,175,0.35)",
                    paddingBottom: "0.55rem",
                  }}
                >
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "0.5rem",
                      }}
                    >
                      <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{item.name}</span>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--accent-strong)",
                        }}
                      >
                        {item.price} ₽
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        fontSize: "0.8rem",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "999px",
                          border: "1px solid var(--border-subtle)",
                          background: "#ffffff",
                          color: "var(--muted)",
                          cursor: "pointer",
                        }}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 8,
                          border: "1px solid #042e59",
                          background: "#042e59",
                          color: "#f9fafb",
                          cursor: "pointer",
                        }}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        style={{
                          marginLeft: "0.4rem",
                          fontSize: "0.75rem",
                          border: "none",
                          background: "transparent",
                          color: "var(--danger)",
                          cursor: "pointer",
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--muted)",
                      minWidth: 70,
                      textAlign: "right",
                    }}
                  >
                    {item.price * item.quantity} ₽
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
              Ваша корзина пуста. Перейдите в раздел «Меню», чтобы добавить блюда.
            </p>
          )}

          {hasItems && (
            <div
              style={{
                marginTop: "0.75rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.75rem",
                fontSize: "0.9rem",
              }}
            >
              <span>
                Позиции:{" "}
                <strong>
                  {totalItems} шт. / {items.length} наим.
                </strong>
              </span>
              <button
                type="button"
                onClick={clear}
                style={{
                  borderRadius: "999px",
                  padding: "0.3rem 0.7rem",
                  border: "1px solid rgba(148,163,184,0.6)",
                  background: "transparent",
                  color: "var(--muted)",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                Очистить корзину
              </button>
            </div>
          )}
        </section>

        <section className="ts-card" style={{ padding: "1rem 1.1rem" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Сумма заказа</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 600 }}>{totalPrice} ₽</span>
            </div>

            <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <span style={{ fontSize: "0.8rem" }}>
                Адрес доставки или самовывоза<span style={{ color: "var(--danger)" }}>*</span>
              </span>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                placeholder="Город, улица, дом, подъезд / отметка о самовывозе"
                style={{
                  resize: "vertical",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  padding: "0.6rem 0.7rem",
                  background: "#ffffff",
                  color: "#111827",
                  fontSize: "0.85rem",
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <span style={{ fontSize: "0.8rem" }}>Комментарий к заказу</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Пожелания по остроте, времени подачи и т.п."
                style={{
                  resize: "vertical",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(30,64,175,0.6)",
                  padding: "0.6rem 0.7rem",
                  background: "#ffffff",
                  color: "#111827",
                  fontSize: "0.85rem",
                }}
              />
            </label>

            {error && (
              <p style={{ fontSize: "0.8rem", color: "var(--danger)" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!hasItems || !isAddressValid || isSubmitting}
              style={{
                marginTop: "0.2rem",
                padding: "0.55rem 1rem",
                borderRadius: 10,
                border: "1px solid #042e59",
                background: "#042e59",
                color: "#f9fafb",
                fontWeight: 500,
                fontSize: "0.9rem",
                cursor: !hasItems || !isAddressValid || isSubmitting ? "not-allowed" : "pointer",
                opacity: !hasItems || !isAddressValid || isSubmitting ? 0.6 : 1,
              }}
            >
              Оформить заказ в WhatsApp
            </button>

            <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
              Нажимая кнопку, вы будете перенаправлены в WhatsApp с автоматически
              сформированным сообщением с составом заказа и адресом.
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}

