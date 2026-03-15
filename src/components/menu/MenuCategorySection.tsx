import { MenuCategory } from "../../lib/types";
import { MenuItemCard } from "./MenuItemCard";

type Props = {
  category: MenuCategory;
  sectionId?: string;
};

export function MenuCategorySection({ category, sectionId }: Props) {
  return (
    <section
      id={sectionId}
      style={{ marginBottom: "1.5rem", scrollMarginTop: "0.5rem" }}
    >
      <h2
        style={{
          fontSize: "1.1rem",
          fontWeight: 600,
          marginBottom: "0.75rem",
          letterSpacing: "-0.03em",
        }}
      >
        {category.name}
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "1rem",
        }}
      >
        {category.items.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
