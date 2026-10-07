export type MaterialCategory = "基礎" | "見た目" | "動き" | "チーム開発";

/** A lecture handout: slides, a doc, a PDF — anything reachable by a link. */
export type Material = {
  id: string;
  title: string;
  description: string;
  url: string;
  category: MaterialCategory;
};

export const materialCategories: MaterialCategory[] = ["基礎", "見た目", "動き", "チーム開発"];

export function materialsInCategory(list: Material[], category: MaterialCategory) {
  return list.filter((material) => material.category === category);
}
