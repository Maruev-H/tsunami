export type MenuItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
};

export type MenuCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  items: MenuItem[];
};

export type MenuData = {
  categories: MenuCategory[];
};

