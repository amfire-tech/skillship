// ============================================================
// Skillship Platform — Expanded Type Contracts
// Keep flexible for parallel backend development.
// All API-facing types use optional fields where backend
// contract is not yet finalized.
// ============================================================

// === Core Enums ===

export type UserRole = "admin" | "subadmin" | "principal" | "teacher" | "student";

// === Domain Models ===

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  schoolId?: string;
  createdAt?: string;
}

export interface School {
  id: string;
  name: string;
  code: string;
  address?: string;
  plan?: "free" | "pro" | "enterprise";
}

// === API Contract Types ===

/**
 * Standard API response envelope.
 * Backend may evolve this — keep loose with optional message.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// === Auth Types ===

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string; // Optional — backend may not send on every response
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RefreshPayload {
  refreshToken: string;
}

// === Navigation Types ===

export interface NavLink {
  label: string;
  href: string;
}

export interface CTALink {
  label: string;
  href: string;
}

// === Component Prop Types ===

export interface StatItem {
  value: string;
  label: string;
}

export interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface StepItem {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface TestimonialItem {
  quote: string;
  name: string;
  role: string;
  school: string;
  city: string;
}

// === Workshop Types ===

export type WorkshopCategory = "ai" | "robotics" | "coding";
export type WorkshopDifficulty = "beginner" | "intermediate" | "advanced";
export type WorkshopClassLevel = "class-3-5" | "class-6-8" | "class-9-12";

export interface WorkshopFilterOption<T extends string = string> {
  label: string;
  value: T;
}

export interface WorkshopItem {
  id: string;
  slug: string;
  title: string;
  category: WorkshopCategory;
  difficulty: WorkshopDifficulty;
  classLevel: WorkshopClassLevel;
  duration: string;
  classRange: string;
  description: string;
  overview: string;
  outcomes: string[];
  image: string;
  imageAlt: string;
  featured?: boolean;
}

export interface WorkshopCatalogFilters {
  category?: WorkshopCategory;
  difficulty?: WorkshopDifficulty;
  classLevel?: WorkshopClassLevel;
}

export interface WorkshopCatalogResponse {
  featuredWorkshop: WorkshopItem;
  workshops: WorkshopItem[];
  filters: WorkshopCatalogFilters;
  filterOptions: {
    categories: WorkshopFilterOption<WorkshopCategory>[];
    difficulties: WorkshopFilterOption<WorkshopDifficulty>[];
    classLevels: WorkshopFilterOption<WorkshopClassLevel>[];
  };
  totalCount: number;
  filteredCount: number;
}

// === Marketplace Types ===

export type MarketplaceCategory =
  | "ai"
  | "robotics"
  | "coding"
  | "electronics"
  | "iot";

export type MarketplaceDifficulty = WorkshopDifficulty;
export type MarketplaceDuration = "under-2-hours" | "half-day" | "multi-session";

export interface MarketplaceWorkshopItem {
  id: string;
  slug: string;
  title: string;
  category: MarketplaceCategory;
  difficulty: MarketplaceDifficulty;
  durationKey: MarketplaceDuration;
  duration: string;
  classRange: string;
  description: string;
  image: string;
  imageAlt: string;
  price: number;
  subscribed?: boolean;
  featured?: boolean;
}

export interface MarketplaceFilterChip<T extends string = string> {
  label: string;
  value: T | "all";
}

export interface MarketplaceCatalogFilters {
  category?: MarketplaceCategory;
  difficulty?: MarketplaceDifficulty;
  duration?: MarketplaceDuration;
}

export interface MarketplaceCatalogResponse {
  featuredWorkshops: MarketplaceWorkshopItem[];
  workshops: MarketplaceWorkshopItem[];
  filters: MarketplaceCatalogFilters;
  filterOptions: {
    categories: MarketplaceFilterChip<MarketplaceCategory>[];
    difficulties: WorkshopFilterOption<MarketplaceDifficulty>[];
    durations: WorkshopFilterOption<MarketplaceDuration>[];
  };
  totalCount: number;
  filteredCount: number;
}
