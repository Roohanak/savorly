import type { Sticker } from "./stickers";
import { newId } from "./id.ts";
import type { Recipe } from "./model";
export type InkPoint = { x: number; y: number; pressure: number };
export type InkStroke = {
  id: string;
  color: string;
  width: number;
  points: InkPoint[];
  style?: "ballpoint" | "pencil" | "highlighter";
  region?: "pad";
};
export type PhotoPlacement = {
  rotation?: number;
  x: number;
  y: number;
  width: number;
  height: number;
};
export type NotebookPage = {
  stickers?: Sticker[];
  photoLayout?: Record<string, PhotoPlacement>;
  id: string;
  title: string;
  text: string;
  template: string;
  paper: "lined" | "dots" | "plain";
  strokes: InkStroke[];
  photoIds?: string[];
  color?: string;
  fields?: Record<string, string>;
};

export const templates = [
  { id: "toddler", title: "Toddler day planner", description: "Meals, naps, playtime and little moments worth keeping.", icon: "☁", paper: "lined", text: "" },
  { id: "toddler-notes", title: "Toddler memory notes", description: "Funny words, new discoveries and notes for tomorrow.", icon: "♡", paper: "lined", text: "" },
  { id: "toddler-sketch", title: "Toddler sketchbook", description: "Doodle, add photos and decorate with baby stickers.", icon: "✎", paper: "dots", text: "" },
  {
    id: "blank",
    title: "A blank page",
    description: "No rules. Just a little room to think.",
    icon: "◻",
    paper: "plain",
    text: "",
  },
  {
    id: "experiment",
    title: "Recipe experiment",
    description: "An idea, a few ingredients, and a first try.",
    icon: "♧",
    paper: "lined",
    text: "THE IDEA\nWhat am I trying to make?\n\nINGREDIENTS & ROUGH AMOUNTS\n\n\nWHAT I TRIED\n\n\nHOW IT TURNED OUT\n\n\nNEXT TIME\n",
  },
  {
    id: "tasting",
    title: "Taste & texture",
    description: "Capture the things a recipe cannot measure.",
    icon: "◉",
    paper: "lined",
    text: "TODAY I MADE\n\nFLAVOR\nSweet / salty / sour / bitter / umami\n\nTEXTURE\n\nAROMA & APPEARANCE\n\nWHAT I WOULD CHANGE\n",
  },
  {
    id: "comparison",
    title: "This time / next time",
    description: "Notice the little changes between attempts.",
    icon: "⇄",
    paper: "dots",
    text: "LAST TIME\n\n\nTHIS TIME I CHANGED\n\n\nWHAT HAPPENED\n\n\nKEEP / CHANGE NEXT TIME\n",
  },
  {
    id: "baking",
    title: "Baking notes",
    description: "Ratios, timing, temperatures, and happy accidents.",
    icon: "♨",
    paper: "lined",
    text: "BAKE & DATE\n\nINGREDIENT WEIGHTS\n\nOVEN TEMPERATURE & TIME\n\nDOUGH / BATTER NOTES\n\nCRUMB, CRUST & FLAVOR\n\nNEXT BAKE\n",
  },
  {
    id: "ideas",
    title: "Kitchen sketchbook",
    description: "Sketch a plate or collect your next big idea.",
    icon: "✳",
    paper: "dots",
    text: "",
  },
  {
    id: "weekly",
    title: "Weekly kitchen planner",
    description: "A week of meals, ideas, and a little shopping list.",
    icon: "▦",
    paper: "plain",
    text: "",
  },
] as const;

export function newNotebookPage(templateId = "blank"): NotebookPage {
  const template = templates.find((t) => t.id === templateId) ?? templates.find(t => t.id === "blank")!;
  return {
    id: newId(),
    title: template.id === "blank" ? "Untitled page" : template.title,
    text: templateDesign(template.id).fields.length ? "" : template.text,
    template: template.id,
    paper: template.paper,
    strokes: [],
    color: templateDesign(template.id).color,
    fields: {},
  };
}

export type TemplateField = {
  id: string;
  label: string;
  placeholder: string;
  wide?: boolean;
  short?: boolean;
};
export type TemplateDesign = {
  color: string;
  accent: string;
  format: string;
  fields: TemplateField[];
};
export function templateDesign(id: string): TemplateDesign {
  const designs: Record<string, TemplateDesign> = {
    toddler: {
      color: "#fff8ed", accent: "#9672ad", format: "Little days · Daily planner",
      fields: [
        {id:"date",label:"Date",placeholder:"Our day…",short:true},
        {id:"name",label:"Little one's name",placeholder:"Name / age",short:true},
        {id:"meals",label:"Meals & snacks",placeholder:"Breakfast, lunch, dinner and little snacks…"},
        {id:"sleep",label:"Naps & bedtime",placeholder:"Nap times, bedtime and how we slept…"},
        {id:"play",label:"Play & adventures",placeholder:"Stories, outdoor time, games and discoveries…"},
        {id:"mood",label:"Mood & little wins",placeholder:"What made them smile today?"},
        {id:"tomorrow",label:"For tomorrow",placeholder:"Things to pack, remember or try…",wide:true}
      ]
    },
    "toddler-notes": {
      color:"#fff0f5",accent:"#a76f94",format:"Little days · Memory notes",
      fields:[
        {id:"date",label:"Date",placeholder:"A day to remember…",short:true},
        {id:"words",label:"Something they said",placeholder:"Their funny little words…"},
        {id:"milestone",label:"A new discovery",placeholder:"Something they tried, learned or noticed…"},
        {id:"memory",label:"Today's little story",placeholder:"The moment I want to keep…",wide:true}
      ]
    },
    "toddler-sketch": {color:"#f4efff",accent:"#9672ad",format:"Little days · Doodles & keepsakes",fields:[]},
    blank: {
      color: "#ffffff",
      accent: "#778579",
      format: "Freeform notebook",
      fields: [],
    },
    experiment: {
      color: "#fff0e7",
      accent: "#be7351",
      format: "Recipe card",
      fields: [
        {
          id: "date",
          label: "Date",
          placeholder: "When did you make it?",
          short: true,
        },
        {
          id: "servings",
          label: "Servings",
          placeholder: "Makes…",
          short: true,
        },
        {
          id: "ingredients",
          label: "Ingredients",
          placeholder: "A handful of this, a pinch of that…",
        },
        {
          id: "method",
          label: "What I did",
          placeholder: "The steps, even the improvised ones…",
        },
        {
          id: "result",
          label: "How it turned out",
          placeholder: "What worked? What would you change?",
          wide: true,
        },
      ],
    },
    tasting: {
      color: "#fff0f4",
      accent: "#b45d7d",
      format: "Tasting grid",
      fields: [
        {
          id: "dish",
          label: "What’s on the plate?",
          placeholder: "Dish, date, occasion…",
          wide: true,
          short: true,
        },
        {
          id: "flavor",
          label: "Flavor",
          placeholder: "Sweet, sour, salty, spicy…",
        },
        {
          id: "texture",
          label: "Texture",
          placeholder: "Crisp edges? Soft middle?",
        },
        {
          id: "aroma",
          label: "Aroma & appearance",
          placeholder: "What did you notice first?",
        },
        {
          id: "verdict",
          label: "The verdict",
          placeholder: "My favorite part was…",
        },
      ],
    },
    comparison: {
      color: "#eef0ff",
      accent: "#7875b7",
      format: "Side-by-side comparison",
      fields: [
        {
          id: "before",
          label: "Last time",
          placeholder: "Ingredients, amounts, method…",
        },
        { id: "after", label: "This time", placeholder: "What did I change?" },
        {
          id: "learned",
          label: "What I learned",
          placeholder: "Better, worse, or just different?",
          wide: true,
        },
        {
          id: "next",
          label: "My next experiment",
          placeholder: "One thing to try next…",
          wide: true,
        },
      ],
    },
    baking: {
      color: "#fff8dc",
      accent: "#a98a36",
      format: "Baking worksheet",
      fields: [
        {
          id: "temperature",
          label: "Oven temperature",
          placeholder: "°C / °F",
          short: true,
        },
        { id: "time", label: "Bake time", placeholder: "Minutes", short: true },
        {
          id: "weights",
          label: "Ingredient weights",
          placeholder: "Flour…\nWater…\nButter…",
        },
        {
          id: "process",
          label: "Mix / rest / bake",
          placeholder: "Timing, folds, proofing…",
        },
        {
          id: "crumb",
          label: "Crumb & crust",
          placeholder: "Sketch or describe the result.",
          wide: true,
        },
      ],
    },
    ideas: {
      color: "#eaf7ef",
      accent: "#66967c",
      format: "Plating & sketch board",
      fields: [
        {
          id: "concept",
          label: "The idea",
          placeholder: "A dish I want to try…",
          wide: true,
          short: true,
        },
      ],
    },
    weekly: {
      color: "#eaf5ff",
      accent: "#6291b1",
      format: "Weekly kitchen planner",
      fields: [
        ...[
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ].map((day) => ({
          id: day.toLowerCase(),
          label: day,
          placeholder: "What’s cooking?",
          short: true,
        })),
        {
          id: "shopping",
          label: "Pick up at the market",
          placeholder: "Ingredients to buy…",
          wide: true,
        },
      ],
    },
  };
  return designs[id] ?? designs.blank;
}

// Distance to a segment lets the eraser hit the line between sampled points.
export function touchesStroke(stroke: InkStroke, point: InkPoint, radius = 14) {
  return stroke.points.some((end, i, points) => {
    const start = points[Math.max(0, i - 1)];
    const dx = end.x - start.x,
      dy = end.y - start.y;
    const fraction = Math.max(
      0,
      Math.min(
        1,
        ((point.x - start.x) * dx + (point.y - start.y) * dy) /
          (dx * dx + dy * dy || 1),
      ),
    );
    return (
      Math.hypot(
        point.x - start.x - fraction * dx,
        point.y - start.y - fraction * dy,
      ) <=
      radius + stroke.width / 2
    );
  });
}

export function pagesFor(recipe: Recipe): NotebookPage[] {
  return (
    recipe.journalPages ?? [
      {
        id: "original-notes",
        title: "Kitchen notes",
        text: recipe.notes,
        template: "blank",
        paper: "lined",
        strokes: [],
      },
    ]
  );
}
