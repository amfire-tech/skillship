// ============================================================
// Skillship Platform — Expanded Type Contracts
// Keep flexible for parallel backend development.
// All API-facing types use optional fields where backend
// contract is not yet finalized.
// ============================================================

// === Core Enums ===
// Role values mirror `apps.accounts.models.User.Role` on the backend (uppercase).
// URL slugs stay lowercase — mapping lives in `lib/role-guard.ts`.

export type UserRole = "MAIN_ADMIN" | "SUB_ADMIN" | "PRINCIPAL" | "TEACHER" | "STUDENT";

// === Domain Models ===
// Backend sends first_name/last_name separately; use `displayName(user)` for UI.

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  // For TEACHER only: SCHOOL (home-school) vs SKILLSHIP (roaming, multi-school).
  // Drives skillship-only surfaces (schedule card, daily teaching log). Returned
  // on /auth/me/; absent/SCHOOL for everyone else.
  teacher_type?: "SCHOOL" | "SKILLSHIP";
  school: string | null;
  school_name?: string | null;
  // School logo as a base64 data-URL. Only returned on /auth/me/ (not on the
  // user list) so a school's students/teachers/principal can show their branding.
  school_logo?: string | null;
  phone?: string;
  admission_number?: string;
  // First-login profile lock. Blank-generated student accounts start `false`:
  // the student fills in their own name/roll/class once, then it flips `true`
  // and only the Super Admin can change it. Older accounts may omit the field.
  profile_completed?: boolean;
}

export const displayName = (u: Pick<User, "first_name" | "last_name" | "username">) =>
  [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username;

export interface School {
  id: string;
  name: string;
  slug: string;
  board: "CBSE" | "ICSE" | "STATE";
  city?: string;
  state?: string;
  address?: string;
  is_active: boolean;
  subscription_expires_at?: string;
  logo?: string;
}

// === API Contract Types ===

export interface ApiError {
  code: string;
  message: string;
  errors?: Record<string, string[]>;
}

// DRF PageNumberPagination shape — matches backend StandardPagination.
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// === Auth Types ===
// Refresh token lives in an HttpOnly cookie set by Django — never in the body.

export interface AuthResponse {
  user: User;
  access: string;
}

export interface LoginPayload {
  email: string;
  password: string;
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
