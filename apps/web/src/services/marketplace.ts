import type {
  MarketplaceCatalogFilters,
  MarketplaceCatalogResponse,
  MarketplaceCategory,
  MarketplaceDifficulty,
  MarketplaceDuration,
  MarketplaceWorkshopItem,
  WorkshopFilterOption,
} from "@/types";

const categoryOptions = [
  { label: "All", value: "all" },
  { label: "Robotics", value: "robotics" },
  { label: "AI", value: "ai" },
  { label: "Coding", value: "coding" },
  { label: "Electronics", value: "electronics" },
  { label: "IoT", value: "iot" },
] as const;

const difficultyOptions: WorkshopFilterOption<MarketplaceDifficulty>[] = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
];

const durationOptions: WorkshopFilterOption<MarketplaceDuration>[] = [
  { label: "Under 2 hours", value: "under-2-hours" },
  { label: "Half day", value: "half-day" },
  { label: "Multi-session", value: "multi-session" },
];

const marketplaceWorkshops: MarketplaceWorkshopItem[] = [
  {
    id: "market-robotics-foundations",
    slug: "robotics-foundations-lab",
    title: "Robotics Foundations Lab",
    category: "robotics",
    difficulty: "beginner",
    durationKey: "under-2-hours",
    duration: "90 minutes",
    classRange: "Class 3-5",
    description:
      "A guided starter workshop introducing motors, movement, and simple robotics logic through tactile classroom kits.",
    image: "/workshops/robotics-workshop.svg",
    imageAlt: "Robotics workshop card artwork",
    price: 14999,
    featured: true,
  },
  {
    id: "market-ai-vision",
    slug: "ai-vision-lab-marketplace",
    title: "AI Vision Lab",
    category: "ai",
    difficulty: "intermediate",
    durationKey: "under-2-hours",
    duration: "2 hours",
    classRange: "Class 6-8",
    description:
      "Students explore classroom-safe image recognition, model behavior, and practical AI use cases with guided demos.",
    image: "/workshops/ai-workshop.svg",
    imageAlt: "AI workshop card artwork",
    price: 18999,
    featured: true,
  },
  {
    id: "market-creative-coding",
    slug: "creative-coding-lab-marketplace",
    title: "Creative Coding Lab",
    category: "coding",
    difficulty: "beginner",
    durationKey: "multi-session",
    duration: "2 sessions",
    classRange: "Class 6-8",
    description:
      "Project-led coding for interactive stories, game logic, and animation basics with high classroom completion rates.",
    image: "/workshops/coding-workshop.svg",
    imageAlt: "Coding workshop card artwork",
    price: 16999,
    subscribed: true,
    featured: true,
  },
  {
    id: "market-circuit-builders",
    slug: "circuit-builders-studio",
    title: "Circuit Builders Studio",
    category: "electronics",
    difficulty: "beginner",
    durationKey: "under-2-hours",
    duration: "100 minutes",
    classRange: "Class 5-8",
    description:
      "Students build safe paper and breadboard circuits while learning current flow, switches, and output components.",
    image: "/workshops/robotics-workshop.svg",
    imageAlt: "Electronics workshop artwork",
    price: 15999,
  },
  {
    id: "market-iot-systems",
    slug: "iot-systems-starter",
    title: "IoT Systems Starter",
    category: "iot",
    difficulty: "intermediate",
    durationKey: "half-day",
    duration: "Half day",
    classRange: "Class 8-10",
    description:
      "A practical IoT session on sensors, connected devices, dashboards, and real-world school automation examples.",
    image: "/workshops/ai-workshop.svg",
    imageAlt: "IoT workshop artwork",
    price: 22999,
  },
  {
    id: "market-advanced-autonomy",
    slug: "advanced-autonomy-lab",
    title: "Advanced Autonomy Lab",
    category: "robotics",
    difficulty: "advanced",
    durationKey: "half-day",
    duration: "Half day",
    classRange: "Class 9-12",
    description:
      "Senior students work through autonomy, control systems, and decision-making tradeoffs in a structured lab format.",
    image: "/workshops/robotics-workshop.svg",
    imageAlt: "Advanced robotics workshop artwork",
    price: 27999,
  },
  {
    id: "market-python-automation",
    slug: "python-automation-sprint-marketplace",
    title: "Python Automation Sprint",
    category: "coding",
    difficulty: "intermediate",
    durationKey: "under-2-hours",
    duration: "2 hours",
    classRange: "Class 9-12",
    description:
      "Hands-on Python scripting for automation workflows, data handling, and practical software thinking for senior learners.",
    image: "/workshops/coding-workshop.svg",
    imageAlt: "Python workshop artwork",
    price: 19999,
    subscribed: true,
  },
  {
    id: "market-ai-careers",
    slug: "ai-career-foundations-marketplace",
    title: "AI Career Foundations",
    category: "ai",
    difficulty: "advanced",
    durationKey: "multi-session",
    duration: "3 sessions",
    classRange: "Class 9-12",
    description:
      "A career-focused series connecting AI fundamentals to college pathways, job roles, and future-ready skill planning.",
    image: "/workshops/ai-workshop.svg",
    imageAlt: "AI careers workshop artwork",
    price: 24999,
  },
  {
    id: "market-smart-home",
    slug: "smart-home-iot-lab",
    title: "Smart Home IoT Lab",
    category: "iot",
    difficulty: "advanced",
    durationKey: "multi-session",
    duration: "4 sessions",
    classRange: "Class 9-12",
    description:
      "Students prototype connected automation ideas with sensors, logic flows, and dashboard-based monitoring concepts.",
    image: "/workshops/coding-workshop.svg",
    imageAlt: "Smart home IoT workshop artwork",
    price: 29999,
  },
];

const categorySet = new Set(
  categoryOptions.filter((option) => option.value !== "all").map((option) => option.value)
);
const difficultySet = new Set(difficultyOptions.map((option) => option.value));
const durationSet = new Set(durationOptions.map((option) => option.value));

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function sanitizeFilters(
  filters: Record<string, string | string[] | undefined>
): MarketplaceCatalogFilters {
  const category = firstValue(filters.category);
  const difficulty = firstValue(filters.difficulty);
  const duration = firstValue(filters.duration);

  return {
    category:
      category && categorySet.has(category as MarketplaceCategory)
        ? (category as MarketplaceCategory)
        : undefined,
    difficulty:
      difficulty && difficultySet.has(difficulty as MarketplaceDifficulty)
        ? (difficulty as MarketplaceDifficulty)
        : undefined,
    duration:
      duration && durationSet.has(duration as MarketplaceDuration)
        ? (duration as MarketplaceDuration)
        : undefined,
  };
}

export function getMarketplaceCatalog(
  rawFilters: Record<string, string | string[] | undefined> = {}
): MarketplaceCatalogResponse {
  const filters = sanitizeFilters(rawFilters);

  const workshops = marketplaceWorkshops.filter((workshop) => {
    if (filters.category && workshop.category !== filters.category) {
      return false;
    }

    if (filters.difficulty && workshop.difficulty !== filters.difficulty) {
      return false;
    }

    if (filters.duration && workshop.durationKey !== filters.duration) {
      return false;
    }

    return true;
  });

  return {
    featuredWorkshops: marketplaceWorkshops.filter((workshop) => workshop.featured).slice(0, 3),
    workshops,
    filters,
    filterOptions: {
      categories: [...categoryOptions],
      difficulties: difficultyOptions,
      durations: durationOptions,
    },
    totalCount: marketplaceWorkshops.length,
    filteredCount: workshops.length,
  };
}
