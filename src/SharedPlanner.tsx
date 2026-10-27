import { useContext } from "react";
import { PlannerContext } from "./plannerContext";
import Planner from "./MealPlanner";
export default function SharedPlanner() {
  const data = useContext(PlannerContext);
  if (!data) return <p>Open this page in your journal to use the linked planner.</p>;
  return <Planner {...data} />;
}
