import { createContext } from "react";
import type { WeekPlan } from "./planner";
import type { Recipe } from "./model";
export const PlannerContext = createContext<{
  weeks: WeekPlan[]; recipes: Recipe[]; onChange: (weeks: WeekPlan[]) => void;
  openRecipe: (id: string) => void; week: string; setWeek: (week: string) => void;
} | null>(null);
