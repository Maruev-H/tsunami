"use client";

import { FormEvent, useMemo, useState } from "react";
import { useCart } from "../../context/CartContext";

const WHATSAPP_PHONE = "79389979790"; // без +, только цифры

type FulfillmentType = "delivery" | "pickup" | "dine_in";
type PaymentType = "cash" | "card";

const FULFILLMENT_LABEL: Record<FulfillmentType, string> = {
  delivery: "Доставка",
  pickup: "Самовывоз",
  dine_in: "В зале",
};

const PAYMENT_LABEL: Record<PaymentType, string> = {
  cash: "Наличные",
  card: "Безнал (карта)",
};

function isDetailsValidForFulfillment(
  details: string,
  fulfillment: FulfillmentType,
): boolean {
  if (fulfillment !== "delivery") return true;
  return details.trim().length >= 8;
}

export default function CartPage() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clear } =
    useCart();
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("delivery");
  const [payment, setPayment] = useState<PaymentType>("cash");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasItems = items.length > 0;
  const isAddressValid = isDetailsValidForFulfillment(address, fulfillment);

  const addressField = useMemo(() => {
    if (fulfillment !== "delivery") return null;
    return {
      label: (
        <>
          Адрес доставки<span style={{ color: "var(--danger)" }}>*</span>
        </>
      ),
      placeholder: "Город, улица, дом, подъезд, домофон",
      hint: "Не менее 8 символов",
    };
  }, [fulfillment]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasItems) {
      setError("Добавьте хотя бы одно блюдо в корзину.");
      return;
    }
    if (!isAddressValid) {
      setError("Укажите полный адрес доставки (не менее 8 символов).");
      return;
    }

    setIsSubmitting(true);

    const lines = [
      "Здравствуйте! Хочу оформить заказ в Tsunami:",
      "",
      `Способ получения: ${FULFILLMENT_LABEL[fulfillment]}`,
      `Оплата: ${PAYMENT_LABEL[payment]}`,
      "",
      ...items.map(
        (item) =>
          `• ${item.name} — ${item.quantity} шт. × ${item.price} ₽ = ${
            item.price * item.quantity
          } ₽`,
      ),
      "",
      `Итого: ${totalPrice} ₽`,
    ];

    if (fulfillment === "delivery") {
      lines.push("", `Адрес: ${address.trim()}`);
    }

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
          Проверьте позиции, выберите способ получения и оплату. Адрес
          указывается только при доставке; для самовывоза и заказа в зале при
          необходимости напишите детали в комментарии. Нажмите «Оформить заказ»
          — заявка уйдёт в WhatsApp.
        </p>
      </div>

      <div className="ts-grid ts-grid-2" style={{ gap: "1.25rem" }}>
        <section
          className="ts-card"
          style={{ padding: "1rem 1.1rem", minHeight: "160px" }}
        >
          {hasItems ? (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "grid",
                gap: "0.6rem",
              }}
            >
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
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "0.5rem",
                      }}
                    >
                      <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>
                        {item.name}
                      </span>
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
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            Math.max(1, item.quantity - 1),
                          )
                        }
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
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
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
              Ваша корзина пуста. Перейдите в раздел «Меню», чтобы добавить
              блюда.
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
                onClick={() => {
                  if (
                    !window.confirm(
                      "Очистить корзину? Все выбранные позиции будут удалены.",
                    )
                  ) {
                    return;
                  }
                  clear();
                  window.alert("Корзина очищена.");
                }}
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
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
                Сумма заказа
              </span>
              <span style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                {totalPrice} ₽
              </span>
            </div>

            <fieldset
              style={{
                border: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.45rem",
              }}
            >
              <legend style={{ fontSize: "0.8rem", marginBottom: "0.15rem" }}>
                Способ получения
                <span style={{ color: "var(--danger)" }}>*</span>
              </legend>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {(["delivery", "pickup", "dine_in"] as const).map((key) => (
                  <label
                    key={key}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="fulfillment"
                      checked={fulfillment === key}
                      onChange={() => {
                        setFulfillment(key);
                        if (key === "pickup" || key === "dine_in")
                          setAddress("");
                      }}
                    />
                    {FULFILLMENT_LABEL[key]}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset
              style={{
                border: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.45rem",
              }}
            >
              <legend style={{ fontSize: "0.8rem", marginBottom: "0.15rem" }}>
                Тип оплаты<span style={{ color: "var(--danger)" }}>*</span>
              </legend>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {(["cash", "card"] as const).map((key) => (
                  <label
                    key={key}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={payment === key}
                      onChange={() => setPayment(key)}
                    />
                    {PAYMENT_LABEL[key]}
                  </label>
                ))}
              </div>
            </fieldset>

            {addressField && (
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem",
                }}
              >
                <span style={{ fontSize: "0.8rem" }}>{addressField.label}</span>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  placeholder={addressField.placeholder}
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
                <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                  {addressField.hint}
                </span>
              </label>
            )}

            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
              }}
            >
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
                cursor:
                  !hasItems || !isAddressValid || isSubmitting
                    ? "not-allowed"
                    : "pointer",
                opacity: !hasItems || !isAddressValid || isSubmitting ? 0.6 : 1,
              }}
            >
              Оформить заказ в WhatsApp
            </button>

            <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
              Нажимая кнопку, вы откроете WhatsApp с сообщением: состав заказа,
              способ получения, оплата и при необходимости адрес или
              комментарий.
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
