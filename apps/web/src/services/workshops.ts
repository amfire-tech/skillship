import type {
  WorkshopCatalogFilters,
  WorkshopCatalogResponse,
  WorkshopCategory,
  WorkshopClassLevel,
  WorkshopDifficulty,
  WorkshopFilterOption,
  WorkshopItem,
} from "@/types";

const categoryOptions: WorkshopFilterOption<WorkshopCategory>[] = [
  { label: "AI", value: "ai" },
  { label: "Robotics", value: "robotics" },
  { label: "Coding", value: "coding" },
];

const difficultyOptions: WorkshopFilterOption<WorkshopDifficulty>[] = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
];

const classLevelOptions: WorkshopFilterOption<WorkshopClassLevel>[] = [
  { label: "Class 3-5", value: "class-3-5" },
  { label: "Class 6-8", value: "class-6-8" },
  { label: "Class 9-12", value: "class-9-12" },
];

const workshops: WorkshopItem[] = [
  {
    id: "ws-ai-vision-lab",
    slug: "ai-vision-lab",
    title: "AI Vision Lab",
    category: "ai",
    difficulty: "intermediate",
    classLevel: "class-6-8",
    duration: "2 hours",
    classRange: "Class 6-8",
    description:
      "Students learn how image recognition works through guided experiments, model demos, and classroom-safe datasets.",
    overview:
      "A practical AI workshop that introduces computer vision concepts in a highly visual, age-appropriate format for middle school learners.",
    outcomes: [
      "Understand how AI systems detect patterns in images",
      "Compare model predictions with human reasoning",
      "Discuss real school and industry use cases for vision AI",
    ],
    image: "/workshops/ai-workshop.svg",
    imageAlt: "Abstract illustration representing AI vision workshop",
    featured: true,
  },
  {
    id: "ws-robotics-sensor-studio",
    slug: "robotics-sensor-studio",
    title: "Robotics Sensor Studio",
    category: "robotics",
    difficulty: "beginner",
    classLevel: "class-3-5",
    duration: "90 minutes",
    classRange: "Class 3-5",
    description:
      "A highly tactile workshop where students explore motion, light, and proximity sensors using guided robotics kits.",
    overview:
      "Built for younger learners, this session keeps the concepts concrete, playful, and easy for schools to deliver repeatedly.",
    outcomes: [
      "Identify how basic sensors help robots make decisions",
      "Build confidence through structured kit-based activities",
      "Connect physical actions with simple logic rules",
    ],
    image: "/workshops/robotics-workshop.svg",
    imageAlt: "Abstract illustration representing robotics sensor workshop",
  },
  {
    id: "ws-creative-coding-lab",
    slug: "creative-coding-lab",
    title: "Creative Coding Lab",
    category: "coding",
    difficulty: "beginner",
    classLevel: "class-6-8",
    duration: "2 sessions",
    classRange: "Class 6-8",
    description:
      "Students use structured visual coding exercises to build interactive stories, logic games, and animation-based projects.",
    overview:
      "A coding workshop focused on confidence and creativity, with enough structure to work smoothly across classrooms and batches.",
    outcomes: [
      "Build computational thinking through visual programming",
      "Understand loops, conditions, and event triggers",
      "Finish the session with a simple project to showcase",
    ],
    image: "/workshops/coding-workshop.svg",
    imageAlt: "Abstract illustration representing coding workshop",
  },
  {
    id: "ws-ai-career-foundations",
    slug: "ai-career-foundations",
    title: "AI Career Foundations",
    category: "ai",
    difficulty: "advanced",
    classLevel: "class-9-12",
    duration: "Half day",
    classRange: "Class 9-12",
    description:
      "A career-oriented workshop connecting AI concepts to higher education paths, real job families, and practical skill roadmaps.",
    overview:
      "Ideal for senior students, this workshop blends exposure, guidance, and structured reflection so schools can support future planning.",
    outcomes: [
      "Explore how AI roles differ across engineering, research, and product teams",
      "Map workshop learning to real academic and career pathways",
      "Leave with a clearer next-step plan for deeper learning",
    ],
    image: "/workshops/ai-workshop.svg",
    imageAlt: "Abstract illustration representing AI career workshop",
  },
  {
    id: "ws-autonomous-systems-bootcamp",
    slug: "autonomous-systems-bootcamp",
    title: "Autonomous Systems Bootcamp",
    category: "robotics",
    difficulty: "advanced",
    classLevel: "class-9-12",
    duration: "3 hours",
    classRange: "Class 9-12",
    description:
      "An advanced robotics session covering control logic, sensor fusion, and practical design trade-offs in autonomous systems.",
    overview:
      "Designed for senior batches that are ready for deeper problem-solving, experimentation, and structured technical discussion.",
    outcomes: [
      "Understand how sensing and control systems work together",
      "Analyze real trade-offs in robot decision-making",
      "Strengthen systems thinking with hands-on problem prompts",
    ],
    image: "/workshops/robotics-workshop.svg",
    imageAlt: "Abstract illustration representing autonomous robotics workshop",
  },
  {
    id: "ws-python-automation-sprint",
    slug: "python-automation-sprint",
    title: "Python Automation Sprint",
    category: "coding",
    difficulty: "intermediate",
    classLevel: "class-9-12",
    duration: "2 hours",
    classRange: "Class 9-12",
    description:
      "Students build simple automation flows in Python and understand how code can streamline repetitive academic and operational tasks.",
    overview:
      "A modern coding session for senior students that balances practical scripting, logic, and exposure to useful real-world workflows.",
    outcomes: [
      "Write simple scripts that automate repetitive logic",
      "Understand basic data handling and input/output flow",
      "See how automation supports modern AI and software systems",
    ],
    image: "/workshops/coding-workshop.svg",
    imageAlt: "Abstract illustration representing Python coding workshop",
  },
];

const categorySet = new Set(categoryOptions.map((option) => option.value));
const difficultySet = new Set(difficultyOptions.map((option) => option.value));
const classLevelSet = new Set(classLevelOptions.map((option) => option.value));

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function sanitizeFilters(
  filters: Record<string, string | string[] | undefined>
): WorkshopCatalogFilters {
  const category = firstValue(filters.category);
  const difficulty = firstValue(filters.difficulty);
  const classLevel = firstValue(filters.classLevel);

  return {
    category:
      category && categorySet.has(category as WorkshopCategory)
        ? (category as WorkshopCategory)
        : undefined,
    difficulty:
      difficulty && difficultySet.has(difficulty as WorkshopDifficulty)
        ? (difficulty as WorkshopDifficulty)
        : undefined,
    classLevel:
      classLevel && classLevelSet.has(classLevel as WorkshopClassLevel)
        ? (classLevel as WorkshopClassLevel)
        : undefined,
  };
}

export function getWorkshopCatalog(
  rawFilters: Record<string, string | string[] | undefined> = {}
): WorkshopCatalogResponse {
  const filters = sanitizeFilters(rawFilters);

  const filteredWorkshops = workshops.filter((workshop) => {
    if (filters.category && workshop.category !== filters.category) {
      return false;
    }

    if (filters.difficulty && workshop.difficulty !== filters.difficulty) {
      return false;
    }

    if (filters.classLevel && workshop.classLevel !== filters.classLevel) {
      return false;
    }

    return true;
  });

  return {
    featuredWorkshop: workshops.find((workshop) => workshop.featured) ?? workshops[0],
    workshops: filteredWorkshops,
    filters,
    filterOptions: {
      categories: categoryOptions,
      difficulties: difficultyOptions,
      classLevels: classLevelOptions,
    },
    totalCount: workshops.length,
    filteredCount: filteredWorkshops.length,
  };
}

export function getWorkshopBySlug(slug: string) {
  return workshops.find((workshop) => workshop.slug === slug);
}

export function getWorkshopSlugs() {
  return workshops.map((workshop) => ({ slug: workshop.slug }));
}
