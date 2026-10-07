import { lessonCategories, type LessonCategory } from "@/lib/lessons";

/** A lecture handout: slides, a doc, a PDF — anything reachable by a link. */
export type Material = {
  id: string;
  title: string;
  description: string;
  url: string;
  category: LessonCategory;
};

export const materialCategories = lessonCategories;

export function materialsInCategory(list: Material[], category: LessonCategory) {
  return list.filter((material) => material.category === category);
}
