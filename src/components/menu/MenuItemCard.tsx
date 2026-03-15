import ReactMarkdown from "react-markdown";
import { MenuItem } from "../../lib/types";
import { useCart } from "../../context/CartContext";

type Props = {
  item: MenuItem;
};

export function MenuItemCard({ item }: Props) {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const cartItem = items.find((i) => i.id === item.id);
  const quantity = cartItem?.quantity ?? 0;

  return (
    <article
      style={{
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-subtle)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "var(--background-elevated)",
      }}
    >
      {/* Фото сверху; бейдж количества справа сверху */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1",
          backgroundColor: "var(--border-subtle)",
          overflow: "hidden",
        }}
      >
        <img
          src={item.image}
          alt={item.name}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        {quantity > 0 && (
          <span
            className="ts-card-qty-badge"
            aria-label={`В корзине: ${quantity}`}
          >
            {quantity}
          </span>
        )}
      </div>
      {/* Текст под фото */}
      <div
        style={{
          padding: "0.65rem 0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.35rem",
        }}
      >
        <h3 style={{ fontSize: "0.9rem", fontWeight: 600, margin: 0 }}>
          {item.name}
        </h3>
        <div
          style={{
            fontSize: "0.78rem",
            color: "var(--muted)",
            lineHeight: 1.35,
          }}
        >
          <ReactMarkdown>{item.description}</ReactMarkdown>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "0.25rem",
          }}
        >
          {quantity > 0 ? (
            <div className="ts-card-stepper">
              <button
                type="button"
                className="ts-card-stepper-btn"
                onClick={() =>
                  quantity === 1
                    ? removeItem(item.id)
                    : updateQuantity(item.id, quantity - 1)
                }
                aria-label="Уменьшить"
              >
                −
              </button>
              <span className="ts-card-stepper-price">
                {item.price * quantity} ₽
              </span>
              <button
                type="button"
                className="ts-card-stepper-btn"
                onClick={() => updateQuantity(item.id, quantity + 1)}
                aria-label="Увеличить"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                addItem({ id: item.id, name: item.name, price: item.price })
              }
              style={{
                padding: "0.35rem 0.65rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--primary)",
                background: "var(--primary)",
                color: "#f9fafb",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              В корзину · {item.price} ₽
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
