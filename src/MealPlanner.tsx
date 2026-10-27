import { useState } from "react";
import type { Recipe } from "./model";
import type { Meal, WeekPlan } from "./planner";
import {
  groceryGroups,
  groceryGroup,
  monday,
  shiftDate,
  shoppingFor,
} from "./planner";
import { newId } from "./id";

export default function Planner({
  weeks,
  recipes,
  onChange,
  openRecipe,
  week,
  setWeek,
}: {
  week: string;
  setWeek: (week: string) => void;
  weeks: WeekPlan[];
  recipes: Recipe[];
  onChange: (plans: WeekPlan[]) => void;
  openRecipe: (id: string) => void;
}) {
  const [editing, setEditing] = useState<Meal | null>(null);
  const [shopping, setShopping] = useState("");
  const [remaining, setRemaining] = useState(true);
  const [removed, setRemoved] = useState<Meal | null>(null);
  const plan = weeks.find((w) => w.week === week) ?? {
    week,
    meals: [],
    notes: "",
    customShopping: [],
    shoppingChecked: [],
  };
  const days = Array.from({ length: 7 }, (_, i) => shiftDate(week, i));
  function update(patch: Partial<WeekPlan>) {
    const next = { ...plan, ...patch };
    onChange(
      weeks.some((w) => w.week === week)
        ? weeks.map((w) => (w.week === week ? next : w))
        : [...weeks, next],
    );
  }
  function checked(id: string) {
    return plan.shoppingChecked.includes(id);
  }
  function toggle(id: string) {
    update({
      shoppingChecked: checked(id)
        ? plan.shoppingChecked.filter((s) => s !== id)
        : [...plan.shoppingChecked, id],
    });
  }
  function add(date: string) {
    setEditing({
      id: newId(),
      date,
      slot: "Dinner",
      label: "",
      servings: 2,
      cooked: false,
    });
  }
  function changeWeek(offset: number) {
    setWeek(shiftDate(week, offset));
    setEditing(null);
    setRemoved(null);
  }
  const groceries = [
    ...shoppingFor(plan, recipes, remaining),
    ...plan.customShopping.map((label, i) => ({
      id: "custom:" + i + ":" + label,
      label,
    })),
  ];
  return (
    <div className="planner-layout">
      <div className="planner-main">
        <div className="week-toolbar">
          <button onClick={() => changeWeek(-7)} aria-label="Previous week">
            ←
          </button>
          <label>
            Week starting
            <input
              type="date"
              value={week}
              onChange={(e) => {
                if (e.target.value) {
                  const [y, m, d] = e.target.value.split("-").map(Number);
                  setWeek(monday(new Date(y, m - 1, d, 12)));
                  setEditing(null);
                }
              }}
            />
          </label>
          <button onClick={() => changeWeek(7)} aria-label="Next week">
            →
          </button>
          <button
            onClick={() => {
              setWeek(monday());
              setEditing(null);
            }}
          >
            This week
          </button>
        </div>
        <div className="planner-summary">
          <strong>{plan.meals.length} meals planned</strong>
          <span>{plan.meals.filter((m) => m.cooked).length} cooked</span>
          <span>{groceries.length} shopping items</span>
        </div>
        {editing && (
          <form
            className="meal-editor card"
            onSubmit={(e) => {
              e.preventDefault();
              const meal = { ...editing, label: editing.label.trim() };
              if (!meal.label) return;
              update({
                meals: plan.meals.some((m) => m.id === meal.id)
                  ? plan.meals.map((m) => (m.id === meal.id ? meal : m))
                  : [...plan.meals, meal],
              });
              setEditing(null);
            }}
          >
            <div className="meal-editor-heading">
              <h2>
                {plan.meals.some((m) => m.id === editing.id)
                  ? "Edit meal"
                  : "Plan a meal"}
              </h2>
              <button type="button" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
            <div className="meal-form-grid">
              <label>
                Date
                <input
                  type="date"
                  min={week}
                  max={shiftDate(week, 6)}
                  required
                  value={editing.date}
                  onChange={(e) =>
                    setEditing({ ...editing, date: e.target.value })
                  }
                />
              </label>
              <label>
                Meal
                <select
                  value={editing.slot}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      slot: e.target.value as Meal["slot"],
                    })
                  }
                >
                  {["Breakfast", "Lunch", "Dinner", "Snack"].map((slot) => (
                    <option key={slot}>{slot}</option>
                  ))}
                </select>
              </label>
              <label>
                Choose from Recipe Book
                <select
                  value={editing.recipeId ?? ""}
                  onChange={(e) => {
                    const recipe = recipes.find((r) => r.id === e.target.value);
                    setEditing({
                      ...editing,
                      recipeId: recipe?.id,
                      label: recipe?.title ?? editing.label,
                      servings: recipe?.servings ?? editing.servings,
                    });
                  }}
                >
                  <option value="">Custom meal</option>
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Meal name
                <input
                  required
                  value={editing.label}
                  onChange={(e) =>
                    setEditing({ ...editing, label: e.target.value })
                  }
                  placeholder="Soup, leftovers, dinner out…"
                />
              </label>
              <label>
                Servings
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editing.servings}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      servings: Math.max(
                        1,
                        Math.min(100, Number(e.target.value) || 1),
                      ),
                    })
                  }
                />
              </label>
            </div>
            <button className="primary">Save meal</button>
          </form>
        )}
        {removed && (
          <div className="undo-banner">
            Meal removed.
            <button
              onClick={() => {
                update({ meals: [...plan.meals, removed] });
                setRemoved(null);
              }}
            >
              Undo
            </button>
          </div>
        )}
        <div className="week-days">
          {days.map((date) => (
            <section className="day-card card" key={date}>
              <header>
                <div>
                  <h2>
                    {new Date(date + "T12:00:00").toLocaleDateString(
                      undefined,
                      { weekday: "long" },
                    )}
                  </h2>
                  <span>
                    {new Date(date + "T12:00:00").toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric" },
                    )}
                  </span>
                </div>
                <button
                  onClick={() => add(date)}
                  aria-label={"Add meal on " + date}
                >
                  ＋ Add meal
                </button>
              </header>
              {plan.meals
                .filter((m) => m.date === date)
                .map((meal) => (
                  <article
                    className={"meal-card " + (meal.cooked ? "is-cooked" : "")}
                    key={meal.id}
                  >
                    <label className="meal-done">
                      <input
                        type="checkbox"
                        checked={meal.cooked}
                        onChange={() =>
                          update({
                            meals: plan.meals.map((m) =>
                              m.id === meal.id
                                ? { ...m, cooked: !m.cooked }
                                : m,
                            ),
                          })
                        }
                      />
                      <span>
                        <small>
                          {meal.slot} · {meal.servings} servings
                        </small>
                        <strong>{meal.label}</strong>
                      </span>
                    </label>
                    <div className="meal-actions">
                      {meal.recipeId &&
                        recipes.some((r) => r.id === meal.recipeId) && (
                          <button onClick={() => openRecipe(meal.recipeId!)}>
                            Recipe
                          </button>
                        )}
                      <button onClick={() => setEditing({ ...meal })}>
                        Edit
                      </button>
                      <button
                        className="danger"
                        onClick={() => {
                          update({
                            meals: plan.meals.filter((m) => m.id !== meal.id),
                          });
                          setRemoved(meal);
                        }}
                        aria-label={"Remove meal " + meal.label}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              {!plan.meals.some((m) => m.date === date) && (
                <p className="day-empty">Room for something good.</p>
              )}
            </section>
          ))}
        </div>
        <label className="week-notes">
          Notes for the week
          <textarea
            rows={4}
            placeholder="Prep on Sunday, use up the spinach…"
            value={plan.notes}
            onChange={(e) => update({ notes: e.target.value })}
          />
        </label>
      </div>
      <aside className="shopping-panel card">
        <p className="eyebrow">A LITTLE LIST, A GOOD WEEK</p>
        <h2>Grocery shopping</h2>
        <p>Ingredients from your planned recipes, scaled to servings.</p>
        <label className="shopping-filter">
          <input
            type="checkbox"
            checked={remaining}
            onChange={(e) => setRemaining(e.target.checked)}
          />
          Only meals left to cook
        </label>
        <div className="shopping-notes">
          {groceryGroups.map((group, index) => (
            <section
              className={`grocery-sticky sticky-${index}`}
              key={group}
              aria-label={group + " groceries"}
            >
              <h3>{group}</h3>
              <ul>
                {groceries
                  .filter((item) => groceryGroup(item.label) === group)
                  .map((item) => (
                    <li key={item.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={checked(item.id)}
                          onChange={() => toggle(item.id)}
                        />
                        <span
                          className={checked(item.id) ? "checked-item" : ""}
                        >
                          {item.label}
                        </span>
                      </label>
                      {item.id.startsWith("custom:") && (
                        <button
                          aria-label={"Remove shopping item " + item.label}
                          onClick={() =>
                            update({
                              customShopping: plan.customShopping.filter(
                                (_, i) =>
                                  item.id !==
                                  "custom:" + i + ":" + plan.customShopping[i],
                              ),
                            })
                          }
                        >
                          ×
                        </button>
                      )}
                    </li>
                  ))}
              </ul>
              {!groceries.some(
                (item) => groceryGroup(item.label) === group,
              ) && (
                <p className="sticky-empty">A little room for what you need.</p>
              )}
              <label className="sticky-writing-label">
                <span>Write on this note</span>
                <textarea
                  aria-label={group + " sticky note"}
                  rows={4}
                  maxLength={10000}
                  placeholder="Tap here and write your list…"
                  value={plan.stickyNotes?.[group] ?? ""}
                  onChange={(e) =>
                    update({
                      stickyNotes: {
                        ...plan.stickyNotes,
                        [group]: e.target.value,
                      },
                    })
                  }
                />
              </label>
            </section>
          ))}
        </div>
        {!groceries.length && (
          <p>Add a recipe to your plan, or write an item below.</p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (shopping.trim()) {
              update({
                customShopping: [...plan.customShopping, shopping.trim()],
              });
              setShopping("");
            }
          }}
        >
          <label>
            Add a shopping item
            <input
              value={shopping}
              onChange={(e) => setShopping(e.target.value)}
              placeholder="Milk, fruit, pantry staples…"
            />
          </label>
          <button>Add item</button>
        </form>
        <small>
          Check your pantry and confirm quantities before shopping. Custom meals
          need their ingredients added manually.
        </small>
      </aside>
    </div>
  );
}
