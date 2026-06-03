# Skillship — Public Homepage Design & Build Brief

> **For:** Claude Code, building the new public website for Skillship Edutech.
> **Built by:** amfire (we're the agency; Skillship is the client).
> **Scope:** Plan 01 — Core AI features only. No Multi-Agent or Plan 02 content anywhere.
> **Goal:** A premium, warm, intelligent homepage that *feels* like Skillship — "Where Fun Meets Learning" — and converts school decision-makers into demo bookings.

---

## 0. Design Philosophy (Read This First)

Every decision flows from five principles. If something violates these, it doesn't ship.

1. **One idea per screen.** Each section reveals exactly one big concept. No "feature dump" sections.
2. **Whitespace is the product.** 96–160px vertical breathing room between sections. Restraint > abundance.
3. **Brand colors carry the personality.** We don't need decorative junk — orange and teal already do the heavy lifting.
4. **Premium + warm, never austere.** This is education, not enterprise SaaS. Use rounded shapes, soft shadows, friendly motion. But still confident — schools are paying customers, not children.
5. **Motion with purpose.** Every animation reveals information or guides attention. No decorative motion.

If a section feels busy or generic, it's wrong. Push toward less.

---

## 1. Visual System

### 1.1 Color Tokens — Extracted from the Skillship logo

```css
:root {
  /* Brand primaries — straight from the logo */
  --orange-500: #F39C32;       /* the "SKILL" in the wordmark */
  --orange-400: #F8B660;       /* lighter tint, hover states */
  --orange-600: #D8861F;       /* darker shade, active states */

  --teal-500: #2EB6B5;          /* the "SHIP" in the wordmark */
  --teal-400: #5CC9C8;          /* lighter tint */
  --teal-600: #1F9594;          /* darker shade */

  --cream: #F4EAD3;             /* the badge background */
  --cream-soft: #FAF4E6;        /* a lighter cream for surfaces */

  --green-accent: #4FB956;      /* from the green in the S logo, used sparingly for highlights */

  /* Neutrals */
  --bg-light: #FFFFFF;
  --bg-warm: #FAF7F0;           /* warm off-white, default page background */
  --bg-dark: #0F1419;           /* near-black from the badge inner, with slight warmth */
  --bg-dark-elevated: #1A2128;

  --ink-primary: #0F1419;
  --ink-secondary: #4A5560;
  --ink-tertiary: #8A95A0;
  --ink-inverse: #FAF7F0;

  /* Borders */
  --border-subtle: rgba(15, 20, 25, 0.08);
  --border-dark: rgba(255, 255, 255, 0.10);

  /* Signature gradients */
  --gradient-brand: linear-gradient(135deg, #F39C32 0%, #2EB6B5 100%);  /* THE Skillship gradient — orange to teal, like the wordmark */
  --gradient-warmth: linear-gradient(135deg, #F39C32 0%, #F8B660 100%);
  --gradient-cool: linear-gradient(135deg, #2EB6B5 0%, #5CC9C8 100%);
  --gradient-dawn: linear-gradient(180deg, #FAF7F0 0%, #F4EAD3 100%);    /* hero soft background */
}
```

**Usage rules:**
- Default page background: `--bg-warm` (#FAF7F0) — warmer than pure white, premium and inviting.
- Hero and final CTA can use `--gradient-dawn` for soft warmth.
- The brand gradient (orange → teal) is the signature move. Use it on: the wordmark, primary CTA buttons, key icons, accent borders. **Don't overuse** — once per screen, max.
- Dark sections use `--bg-dark` (#0F1419), not pure black. The badge's inner has warmth — match that.
- Cream (#F4EAD3) is a tertiary surface — use for cards, badges, callout boxes.

### 1.2 Typography

- **Primary font:** Inter Variable (self-host via `next/font`)
- **Mono accent (for AI/code badges):** JetBrains Mono Variable

```css
--text-display-xl: clamp(3rem, 7vw, 6rem);     /* 48–96px — hero headline */
--text-display-l:  clamp(2.25rem, 4.5vw, 4rem); /* 36–64px — section headers */
--text-display-m:  clamp(1.75rem, 3vw, 2.5rem); /* 28–40px — sub-sections */
--text-body-l:     clamp(1.0625rem, 1.3vw, 1.25rem); /* 17–20px — lead paragraphs */
--text-body:       1rem;
--text-caption:    0.8125rem;

/* Weights: 400 body, 500 emphasis, 600 headlines. Skip 700+ (too aggressive). */
/* Display weight: 600 for headlines (gives confidence without austerity). */
/* Letter-spacing: -0.03em on display, -0.01em on body. */
/* Line-height: 1.08 display, 1.55 body, 1.7 long-form. */
```

**Why Inter and not a "fun" font like Poppins or Fredoka?** The brand wordmark already carries the personality (rounded, friendly, bi-color). The site UI needs to feel premium and clean — let the brand colors and animations bring the warmth.

### 1.3 Spacing & Layout

- **Max container:** 1280px (24px horizontal padding mobile, 48px desktop)
- **Section vertical padding:** 80px mobile, 128px desktop, 160px for hero
- **Grid:** 12-col desktop, 4-col mobile
- **Border-radius scale:** 12px (chips/inputs), 20px (cards), 28px (panels), 9999px (pills) — slightly more rounded than typical SaaS, to match the friendly logo

### 1.4 Motion Principles

- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` ("ease-out-expo") for arrivals; `cubic-bezier(0.7, 0, 0.84, 0)` for exits.
- **Durations:** 200ms (micro), 400ms (component), 700ms (section reveal), 1100ms (hero).
- **Stagger:** 70ms between sibling animations.
- **Smooth scroll:** Lenis, 1.2s duration, expo easing.
- **Hover:** scale 1.02 max + shadow lift. Don't be cute with rotation/skew.
- **Reduced motion:** `prefers-reduced-motion: reduce` → all motion becomes 0.01ms opacity fade only. Non-negotiable.

### 1.5 Shadows

```css
--shadow-soft:   0 1px 2px rgba(15, 20, 25, 0.04), 0 4px 12px rgba(15, 20, 25, 0.04);
--shadow-medium: 0 4px 12px rgba(15, 20, 25, 0.06), 0 12px 32px rgba(15, 20, 25, 0.08);
--shadow-strong: 0 8px 24px rgba(15, 20, 25, 0.08), 0 24px 64px rgba(15, 20, 25, 0.12);
--shadow-warm:   0 8px 32px rgba(243, 156, 50, 0.18);  /* orange-tinted glow for primary CTAs */
--shadow-cool:   0 8px 32px rgba(46, 182, 181, 0.18);  /* teal-tinted glow for secondary elements */
```

---

## 2. Page Architecture (13 sections)

| # | Section | One-line purpose |
|---|---------|------------------|
| 1 | Nav | Always-present, blur-on-scroll |
| 2 | Hero | "Where fun meets learning. Now powered by AI." |
| 3 | Trust strip | Real numbers — 50+ schools, 10,000+ students |
| 4 | The Promise | "AI that runs underneath everything." |
| 5 | AI Career Pilot showcase | Sticky cinematic — feature #1 |
| 6 | Adaptive Quiz Engine | Animated SVG showcase — feature #2 |
| 7 | AI Question Generator | PDF → MCQs visualization — feature #3 |
| 8 | Marketplace teaser | Browse courses preview |
| 9 | Built for Every Role | 5 cards (Admin, Sub-Admin, Principal, Teacher, Student) |
| 10 | Why Skillship | 4 reasons (1:1 Doubt, Beginner Friendly, Engaging Quizzes, Certificates) |
| 11 | Social proof | Real testimonials + partner schools |
| 12 | Final CTA | Two paths: For Schools / For Students |
| 13 | Footer | Clean, restrained |

---

## 3. Section-by-Section Specification

### Section 1 — Navigation

**Layout:** Fixed top, 72px height. Logo left, nav center (Platform · For Schools · Courses · About), CTA right ("Book a Demo").

**Behavior:**
- At scroll Y = 0: transparent background, dark ink on warm hero.
- At scroll Y > 40: backdrop-blur(20px) saturate(180%), background `rgba(250, 247, 240, 0.78)`, soft bottom border appears.
- Mobile: hamburger right, slide-down full-screen menu with stagger reveal.

**Copy:**
- Logo: Use the actual Skillship wordmark (orange "SKILL" + teal "SHIP"). SVG, not PNG.
- Nav items: Platform · For Schools · Courses · About
- CTA: `Book a Demo` (filled, brand gradient orange→teal)

---

### Section 2 — Hero

**This is the most important section. Get it right.**

**Layout:**
```
─────────────────────────────────────────────────
                                                
   [eyebrow: small tag in teal]                 
                                                
   Where fun meets                              
   learning.                                    
   Now powered by AI.                           
                                                
   The new Skillship platform makes every       
   quiz adapt, every dashboard intelligent,     
   and every student's path personal.          
                                                
   [Book a Demo]   [Watch how it works →]      
                                                
                                                
      ┌─────────────────────────────────┐       
      │                                 │       
      │   [Floating product mockup +    │       
      │    decorative orbiting cards]   │       
      │                                 │       
      └─────────────────────────────────┘       
                                                
                  ↓ scroll                      
─────────────────────────────────────────────────
```

**Background:** Use `--gradient-dawn` (cream wash) with subtle floating geometric shapes — soft orange and teal circles at 8–12% opacity, drifting slowly. No noisy patterns.

**Copy (exact):**
- Eyebrow (caption-size, uppercase, tracked +0.2em, teal-500): `AI · CODING · ROBOTICS · STEM FOR GRADES 6–12`
- Headline (display-xl, weight 600, line 1 in ink-primary, "Now powered by AI." in brand gradient):
  - Line 1: **Where fun meets learning.**
  - Line 2: **Now powered by AI.** *(this line uses the orange→teal gradient as text fill)*
- Subhead (body-l, ink-secondary, max-width 580px): The new Skillship platform makes every quiz adapt, every dashboard intelligent, and every student's path personal.
- Primary CTA: `Book a Demo` (gradient fill, white text, shadow-warm on hover, scale 1.02)
- Secondary CTA: `Watch how it works →` (ghost, teal-500 text, opens 30-second product video modal)

**Hero visual (the floating product mockup):**

This is the most important AI image of the whole site. Three options, in order of preference:

**Option A (best):** Real screenshot of the actual Skillship platform dashboard, tilted slightly (8–10°), with floating decorative cards around it. Use shadow-strong underneath. This is the most honest and most premium choice.

**Option B:** AI-generated 3D mockup. Use this prompt with Midjourney v6 or Flux Pro:

> *"Ultra-clean 3D render of a floating laptop displaying a colorful education dashboard with progress charts and student cards, warm cream background #FAF7F0, subtle orange and teal glow under the laptop, two smaller floating UI cards beside it (one showing a career path with milestones in teal, one showing a quiz interface with orange accents), photorealistic studio lighting, soft shadows, slight isometric tilt, premium Apple-style product photography, leave screens as colored blocks not real text, no faces, --ar 3:2 --s 250"*

**Option C:** A 2D illustrated dashboard mockup (cleaner, lighter, easier to refresh). Use Figma to design it, export as PNG.

**Decorative orbiting cards (smaller, alongside main mockup):**
- Card 1 (top-right): A tiny "Career Path" mini-card with three milestones plotted on a curve. Teal gradient. Floats with `y: ±10px` over 6s loop.
- Card 2 (bottom-left): A tiny "Quiz Adapted" notification card with a check + difficulty indicator. Orange gradient. Floats opposite phase.
- Both have shadow-medium. Both have a subtle 2° rotation in opposite directions.

**Animations on load (use Framer Motion):**
1. Eyebrow fades + slides up (0ms, 500ms duration)
2. Headline character-by-character mask reveal (200ms delay, 1100ms, use Framer Motion `staggerChildren` with character split)
3. The gradient text on line 2 has a subtle 2s gradient shift loop (the colors slowly rotate through the gradient) — gives life to the brand
4. Subhead fades up (700ms delay, 500ms)
5. CTAs fade up with 80ms stagger (1000ms delay)
6. Hero visual scales from 0.96 → 1 with opacity 0 → 1 (1100ms delay, 1300ms, ease-out-expo)
7. Decorative cards drift in from sides with rotation settling (1500ms delay, staggered 200ms apart)

**Scroll cue:** Small ↓ "scroll" label bottom-center, gentle bounce loop, fades out after first scroll event.

---

### Section 3 — Trust Strip

**Layout:** Full-width band, cream-soft background, 80px vertical padding. Single horizontal row.

**Content — use Skillship's REAL numbers** (these are from their existing site, not invented):

```
   50+ schools          10,000+ students          8,000+ enrolled          5,000+ live learning hours
```

**Display:**
- Each number in display-m, weight 600, ink-primary
- Label below in caption, ink-secondary
- Separator: subtle vertical line in `--border-subtle`
- Numbers count up from 0 on scroll-into-view (use `framer-motion` `useInView` + animated counter), 1.8s duration, ease-out-expo
- Stagger across the four stats with 150ms delay between

---

### Section 4 — The Promise

**Purpose:** One philosophical statement that sets Skillship apart. The "wait, that's different" moment.

**Layout:** Full-width, white background, centered text, generous vertical padding.

```
─────────────────────────────────────────────────
                                                
                                                
                                                
   Most school platforms                        
   added an AI tab.                             
                                                
   We rebuilt the foundation.                  
                                                
                                                
   ─── small teal divider ───                  
                                                
   Skillship runs real intelligence on every    
   quiz attempt, every content view, every     
   dashboard load. It's not a feature.         
   It's how the platform thinks.               
                                                
                                                
─────────────────────────────────────────────────
```

**Copy:**
- Line 1 (display-l, weight 400, ink-tertiary): Most school platforms added an AI tab.
- Line 2 (display-l, weight 600, ink-primary, with the word "rebuilt" in teal-500): **We rebuilt the foundation.**
- Below divider (body-l, max-width 640px, centered, ink-secondary): Skillship runs real intelligence on every quiz attempt, every content view, every dashboard load. It's not a feature. It's how the platform thinks.

**Animation:** Line 1 fades in faded, then line 2 fades in stronger and the word "rebuilt" gets the teal color applied with a 600ms color transition. Creates a punchline reveal.

**No image needed.**

---

### Section 5 — AI Career Pilot Showcase

**First "wow" moment. Cinematic sticky scroll.**

**Layout:** Two-column desktop (sticky left visual, scrolling right content). Stacks on mobile (visual on top, content steps below).

```
┌──────────────────────────┬─────────────────────────┐
│                          │                         │
│                          │  EVERY STUDENT, EVERY   │
│                          │  PLAN                   │
│                          │                         │
│   [Visual that morphs    │  AI Career Pilot.       │
│    through 4 states as   │                         │
│    you scroll]           │  A guidance agent in    │
│                          │  every student's        │
│   sticky-positioned      │  dashboard.             │
│                          │                         │
│                          │  Step 1 — It listens.   │
│                          │  Step 2 — It maps.      │
│                          │  Step 3 — It guides.    │
│                          │  Step 4 — It grows.     │
│                          │                         │
└──────────────────────────┴─────────────────────────┘
```

**Copy:**
- Eyebrow: `EVERY STUDENT, EVERY PLAN` (teal-500)
- Headline (display-l): **AI Career Pilot.**
- Lead: A personalised guidance agent in every student's dashboard. It reads their work, finds their strengths, and builds the path forward.

**Four scroll steps (right column, each ~80vh tall):**

1. **It listens.** Career Pilot analyses every quiz attempt, every content interaction, every subject signal — passively, continuously.
2. **It maps.** It clusters strengths across AI, Coding, Robotics, and STEM into a profile no two students share.
3. **It guides.** It generates an ordered learning sequence — what to learn next, why it fits, how long it takes.
4. **It grows.** As the student grows, the path updates. Milestones unlock. The agent never sleeps.

**Sticky visual — generate 4 AI images, one per state:**

Use this base style block for ALL four (consistency is everything):

> *Base: "Premium 3D render, warm cream background #FAF7F0, soft orange and teal accent glow, photorealistic studio lighting, gentle floating elements, no text, no faces, no logos, Apple product photography style, soft shadows, 8k, --ar 1:1 --s 250"*

- **State 1 (Listening):** "A glowing teal orb pulsing gently in the center, surrounded by floating translucent cream cards showing simple icons (a quiz card, a book card, a chart card), soft light streams flowing from each card toward the central orb"

- **State 2 (Mapping):** "A glowing teal orb in the center with thin orange constellation lines connecting it to four floating clusters arranged in a circle (each cluster a small geometric shape representing AI, Code, Robotics, STEM), clusters glowing at different intensities"

- **State 3 (Guiding):** "A glowing winding path made of orange light flowing through five floating 3D platform milestones arranged like a futuristic learning roadmap in space, each milestone a small luminous cream-colored disc"

- **State 4 (Growing):** "Multiple unlocked milestones glowing brightly in orange along a winding teal path, the path extending into soft warm light at the horizon, suggesting infinite progression"

**Technical implementation:**
- Use GSAP ScrollTrigger with `pin: true` on the left column
- As the user scrolls through each step, crossfade between the 4 images (400ms fade)
- Use the active step's text on the right as the trigger
- The current step's number gets a teal background pill; inactive steps are ink-tertiary

---

### Section 6 — Adaptive Quiz Engine

**Second "wow." Dark section, animated SVG (no AI image).**

**Background:** `--bg-dark` (#0F1419) with very subtle warm noise texture (SVG `feTurbulence` filter at 3% opacity).

**Layout:** Centered, single column.

```
─────────────────────────────────────────────────
                                                
   ADAPTIVE QUIZ ENGINE                         
   ────────────────────                         
                                                
   The quiz that meets every                    
   student where they are.                      
                                                
   Difficulty adjusts in real time             
   based on past performance.                  
                                                
                                                
   [Animated SVG: difficulty curve              
    being drawn left-to-right, with             
    glowing dot moving along the line,         
    tooltips appearing at key points]          
                                                
                                                
   Strong students stay challenged.             
   Struggling students stay supported.         
   Everyone gets calibrated growth.            
                                                
─────────────────────────────────────────────────
```

**Copy:**
- Eyebrow (orange-500): `ADAPTIVE QUIZ ENGINE`
- Headline (display-l, ink-inverse, weight 600): **The quiz that meets every student where they are.**
- Lead (body-l, ink-inverse with 70% opacity): Difficulty adjusts in real time based on past performance.

**The visual — build as SVG, animate on scroll:**

- An SVG line chart, ~700px wide × 320px tall
- X-axis: questions 1–10 (subtle ink-tertiary ticks)
- Y-axis: difficulty from Easy → Medium → Hard
- A line drawn left-to-right as user scrolls into view (tied to `useScroll` + `useTransform` from Framer Motion)
- The line color uses the brand gradient (orange→teal) via `stroke="url(#grad)"`
- A glowing orange dot moves along the line as it draws (4px radius, with a 12px blurred glow)
- At 4 key points along the line, small tooltips appear:
  - Question 2: "✓ Correct → harder"
  - Question 4: "✗ Wrong → softer"
  - Question 6: "✓ Correct → harder"
  - Question 8: "✓ Correct → max difficulty"
- Tooltips: small cream cards (12px border-radius, 8px padding, caption text), fade in/out with the dot's progress
- Below: three short lines fade in sequentially (strong/struggling/everyone)

**No AI image. Pure SVG + Framer Motion.**

---

### Section 7 — AI Question Generator

**Third "wow." Show the magic moment: teacher uploads a PDF, AI generates questions.**

**Layout:** Two-column desktop. Left: visual demonstration. Right: explanation.

```
┌──────────────────────────┬─────────────────────────┐
│                          │                         │
│                          │  FOR TEACHERS           │
│   [Animated visual:      │                         │
│    PDF document on       │  Upload a PDF.          │
│    left, "AI processing" │  Get a quiz.            │
│    in middle, generated  │                         │
│    MCQ cards on right    │  Skillship reads any    │
│    appearing one by one] │  PDF you upload —       │
│                          │  textbooks, notes,      │
│                          │  worksheets — and       │
│                          │  generates MCQs,        │
│                          │  True/False, and        │
│                          │  short-answer questions │
│                          │  across Easy / Medium / │
│                          │  Hard difficulty.       │
│                          │                         │
│                          │  One click. Imported    │
│                          │  to your question bank. │
│                          │                         │
│                          │  Hours saved. Every     │
│                          │  week.                  │
│                          │                         │
└──────────────────────────┴─────────────────────────┘
```

**Copy:**
- Eyebrow (teal-500): `FOR TEACHERS`
- Headline (display-l): **Upload a PDF. Get a quiz.**
- Lead: Skillship reads any PDF you upload — textbooks, notes, worksheets — and generates MCQs, True/False, and short-answer questions across Easy / Medium / Hard difficulty.
- Follow-up paragraphs as shown above.

**The left visual — build with Framer Motion + SVG/HTML, NOT an AI image:**

This is an animated demonstration that loops on scroll-into-view:

1. **0–1s:** A PDF document icon (a cream rectangle with text-line shapes inside) drops in from above with a slight bounce.
2. **1–2s:** An "AI processing" indicator appears beside it — three orange dots pulsing in sequence + a teal scanning line moving across the PDF.
3. **2–4s:** Three MCQ cards appear one by one on the right side, each with a question line + 4 answer options, each tagged with a difficulty pill (Easy in green, Medium in orange, Hard in red-orange). Stagger 400ms between cards.
4. **4–5s:** A "Imported to question bank ✓" toast slides in at the bottom in teal.
5. **5–7s:** Pause, then loop.

Build this as HTML/CSS/SVG elements animated with Framer Motion. No AI image needed.

---

### Section 8 — Marketplace Teaser

**Purpose:** Show that Skillship has real courses students can browse — the marketplace is a Plan 01 feature.

**Layout:** Full-width section, cream-soft background, horizontal scrolling row of course cards.

```
─────────────────────────────────────────────────
                                                
   MARKETPLACE                                  
                                                
   Browse the catalog.                          
   Enroll in minutes.                           
                                                
   [→ horizontally scrolling row of            
    6 course cards →]                           
                                                
   [Explore all courses →]                      
                                                
─────────────────────────────────────────────────
```

**Copy:**
- Eyebrow (orange-500): `MARKETPLACE`
- Headline (display-l): **Browse the catalog. Enroll in minutes.**
- Lead (body-l, max-width 540px): Every Skillship course — AI, coding, robotics, STEM — available to schools and individual learners. Aligned to grade levels. Built for India.

**Course cards (6 cards, horizontally scrolling):**

Each card: 320px wide × 420px tall, 20px border-radius, white background, shadow-soft → shadow-medium on hover, scale 1.02 lift.

Card structure:
- Top: gradient header band (each card has its own color combination from the brand palette) with a category icon (Lucide)
- Middle: course title (display-m, weight 600), grade range (caption, ink-tertiary)
- Description (body, 3 lines max, ink-secondary)
- Bottom: a tag pill ("12 weeks · ₹X,XXX") + an arrow icon

**Six courses to feature (from their existing catalog + reasonable extensions):**

1. **Beginner's Python for AI** — Grade 6–8 — orange gradient
2. **Advanced Python for AI** — Grade 9–10 — teal gradient
3. **Complete Artificial Intelligence** — Grade 11–12 — orange→teal gradient
4. **Robotics with Hardware Kit** — Grade 6–10 — green accent
5. **Web Development Fundamentals** — Grade 8–12 — teal gradient
6. **AI Internship Program** — Grade 10–12 — orange→teal gradient (featured/highlighted)

**Animation:** Cards fade up with 80ms stagger on scroll-into-view. Horizontal scroll is native CSS (`overflow-x: auto` with `scroll-snap-type: x mandatory`). Add scrollbar styling — a subtle teal scrollbar thumb.

**No AI image. Cards are the visual.**

---

### Section 9 — Built for Every Role

**Layout:** Centered eyebrow + headline, then 5 cards (5-col grid desktop, horizontal-scroll on mobile).

**Copy:**
- Eyebrow: `FIVE STAKEHOLDERS, FIVE EXPERIENCES`
- Headline (display-l): **One platform. Built for everyone in the school.**

**Card spec (each):**
- 240px wide × 360px tall, 20px border-radius, white background
- Top 40%: a soft gradient band (each role has a unique combination from the brand palette)
- Middle: role icon (Lucide, 48px) in white circle
- Role name (display-m, weight 600)
- One-line description (body, ink-secondary)
- Bottom: a "→" link "See dashboard" that opens a modal with the dashboard mockup
- Hover: card lifts (translateY -8px), shadow-medium → shadow-strong, smooth 300ms

**Five roles:**

| Role | Tagline | Gradient | Icon |
|------|---------|----------|------|
| **Admin** | Full platform control. School onboarding. AI tuning. | orange→amber | `ShieldCheck` |
| **Sub-Admin** | Question banks, content workflows, school-level reports. | orange→teal | `Layers` |
| **Principal** | School-wide analytics. Benchmarking. PDF + Excel exports. | teal→cyan | `LineChart` |
| **Teacher** | Class management. Quiz assignment. Per-student learning paths. | teal→green | `Users` |
| **Student** | Adaptive quizzes. Career Pilot. Badges. Certificates. | green→orange | `Sparkles` |

**For the dashboard preview inside each modal — AI image prompt template:**

> *"Ultra-clean UI mockup of an education dashboard, light theme, lots of whitespace, orange #F39C32 and teal #2EB6B5 accent colors, cream background, showing [ROLE-SPECIFIC CONTENT], rendered as flat 2D screenshot, no real text just colored blocks and shapes representing UI elements, soft drop shadow, slight isometric 8° tilt, premium SaaS design, --ar 4:3 --v 6"*

Role-specific content to substitute:
- Admin: "a list of school cards with toggle switches and an AI configuration panel on the right"
- Sub-Admin: "a question bank table with filter pills and a content upload zone with drag-and-drop indicator"
- Principal: "a school-wide analytics dashboard with three line charts, a benchmark gauge, and a downloadable reports section"
- Teacher: "a class roster grid with student progress bars and an assigned quiz panel showing recent assignments"
- Student: "a personal career path with milestones plotted on a curve, a daily quiz card with adaptive difficulty indicator, and a learning streak counter"

---

### Section 10 — Why Skillship

**Purpose:** The four reasons Skillship is different — refined from their existing site's "Why Choose Us" but redesigned premium.

**Layout:** 2×2 grid desktop, single column mobile. Each cell is a large card.

**Copy:**
- Eyebrow: `WHY SKILLSHIP`
- Headline (display-l): **Built for how kids actually learn.**

**Four cards:**

| # | Title | Description | Icon |
|---|-------|-------------|------|
| 1 | **Live 1:1 Doubt Resolution** | Personalised sessions with expert instructors. Real human teaching alongside AI guidance. | `MessageCircle` |
| 2 | **Beginner-Friendly Content** | Carefully scaffolded curriculum that makes coding feel like play, not pressure. | `Sparkles` |
| 3 | **Learn at Your Own Pace** | Self-paced content alongside live classes. Students choose the rhythm that works for them. | `Clock` |
| 4 | **Certificates That Matter** | Industry-aligned certifications and internship opportunities for top students. | `Award` |

**Card spec:**
- Background: cream (`--cream-soft`)
- 28px border-radius
- 40px padding
- Icon in top-left, 56px size, in a 80px white circle with shadow-soft
- Title (display-m, weight 600) below icon
- Description (body, ink-secondary)
- Hover: subtle scale 1.02 + shadow-medium, 300ms ease-out-expo

**No images needed.** Icons + typography carry it.

---

### Section 11 — Social Proof (Testimonials + Partners)

**Two parts in one section, separated by a thin divider.**

**Part A: Testimonials**

**Layout:** Headline at top, then a horizontally scrolling row of 4 testimonial cards.

**Copy:**
- Eyebrow: `WHAT STUDENTS SAY`
- Headline (display-l): **Loved by students across India.**

**Testimonial cards (use Skillship's REAL testimonials from their existing site):**

Each card: 380px wide × 280px tall, 24px border-radius, white background, shadow-soft.

```
┌─────────────────────────────────┐
│                                 │
│   "Quote text here, kept        │
│    short — max 3 lines."        │
│                                 │
│                                 │
│   ┌──┐                          │
│   │👤│  Name                    │
│   └──┘  Location                │
│                                 │
└─────────────────────────────────┘
```

**The 4 real testimonials:**

1. **Rishi, Lucknow:** "Skillship is taking care of my skills with its web development course. The best part is that I can easily learn using mobile only, which helps in my studies anytime, anywhere."

2. **Shinaya, Gurugram:** "Amazing class! Looking forward to working on my own game. Thank you so much for teaching me Python. The best part is the quizzes for better understanding."

3. **Jay Prakash, Agra:** "Mind-blowing course. The instructor's explanation was nice, and the best part about Skillship is the interactive animated content — easy understanding of concepts."

4. **Ansh, Mumbai:** "Really super, the way our instructor explained was great. The best part is Skillship's instant doubt resolution — gives me a smooth flow in studies."

**Card details:**
- Quote in body-l, ink-primary, line-height 1.5, weight 400
- Below quote: a small avatar (use real photos if available, else a stylized initial in a teal gradient circle)
- Name in body, weight 500
- Location in caption, ink-tertiary

**Animation:** Cards fade up with 100ms stagger. Native horizontal scroll with scroll-snap.

**Part B: Partner Schools**

A thin band below the testimonials.

**Copy:**
- Small line above (caption, ink-tertiary, centered): `In partnership with India's top schools`

**Logos:** Use their real partner school logos in a single horizontal row. Desaturated to 40% opacity by default, hover → 100% color + scale 1.05. 6–8 logos visible at once on desktop, marquee-scrolling slowly to the left (infinite loop, 30s per cycle).

**No AI images. Use real logos.**

---

### Section 12 — Final CTA

**Layout:** Full-bleed, dark gradient background, 160px vertical padding, centered. Two-path CTA.

**Background:** `--bg-dark` (#0F1419) with a large radial gradient in the center using the brand gradient (orange→teal) at 25% opacity, drifting slowly (30s loop). Scatter 20–30 tiny cream dots (varying opacity 0.2–0.6) animated with subtle twinkling effect.

```
─────────────────────────────────────────────────
                                                
                                                
   Bring Skillship                              
   to your school.                              
                                                
   Or start learning today.                     
                                                
                                                
   [I'm a school →]      [I'm a student →]     
                                                
                                                
─────────────────────────────────────────────────
```

**Copy:**
- Headline (display-xl, weight 600, white): Bring Skillship to your school.
- Sub-headline (display-m, weight 400, ink-inverse with 70% opacity): Or start learning today.
- Two CTAs side by side, equal weight:
  - `I'm a school →` (orange gradient fill, white text, leads to demo booking)
  - `I'm a student →` (teal gradient fill, white text, leads to course marketplace)

**Hover:** Both CTAs lift 4px and gain the relevant tinted shadow (shadow-warm for orange, shadow-cool for teal). Scale 1.02.

---

### Section 13 — Footer

**Layout:** Cream background, four columns desktop, stacked on mobile, 80px vertical padding.

- **Column 1:** Skillship logo + tagline "Where fun meets learning." + small line "Built by amfire" (with link to amfire.in)
- **Column 2:** Platform — Features, For Schools, For Students, Pricing
- **Column 3:** Courses — Beginner's Python for AI, Advanced Python for AI, Complete AI, Robotics, View all
- **Column 4:** Get in touch — info@skillship.in, +91 93684 08577, Agra, UP (282006), social icons (FB, IG, LinkedIn, Twitter)

**Bottom strip:** "© 2026 Skillship Edutech. All rights reserved." + Privacy · Terms · Refund Policy links, centered, caption size, ink-tertiary.

---

## 4. Technical Implementation Stack

```json
{
  "framework": "Next.js 14 (App Router)",
  "styling": "Tailwind CSS + CSS custom properties for tokens",
  "animation": {
    "primary": "Framer Motion (component animations, layout, gestures)",
    "scroll": "GSAP + ScrollTrigger (sticky scroll in Section 5)",
    "smooth-scroll": "Lenis"
  },
  "fonts": "next/font with Inter Variable (self-hosted)",
  "icons": "lucide-react",
  "image-optimization": "next/image with priority on hero, lazy elsewhere",
  "image-format": "AVIF first, WebP fallback",
  "form-handling": "react-hook-form + zod validation for demo booking"
}
```

**Performance targets (non-negotiable):**
- Lighthouse Performance ≥ 95
- LCP < 2.0s
- CLS < 0.05
- Total page weight < 1.5 MB excluding hero image; hero < 800 KB

**Accessibility:**
- WCAG 2.1 AA
- Focus rings: 2px teal outline + 2px offset on all interactives
- All animations respect `prefers-reduced-motion: reduce`
- Descriptive alt text on every image
- Keyboard navigable end-to-end
- Color contrast: all text ≥ 4.5:1, large text ≥ 3:1

---

## 5. AI Image Generation Workflow

For each AI image needed:

1. **Tool:** Midjourney v6 (best for cinematic 3D renders) or Flux Pro on fal.ai (best for UI mockups)
2. **Aspect ratios:** `--ar 3:2` for hero, `--ar 1:1` for Career Pilot states, `--ar 4:3` for dashboard mockups
3. **Stylize:** `--s 250` for premium feel (Midjourney)
4. **Always include in prompt:** "no text, no logos, no watermarks, no real human faces, no children, no stock photo style, warm cream background #FAF7F0"
5. **Color palette mention in every prompt:** "orange #F39C32 and teal #2EB6B5 accent colors"
6. **Post-process:** If you need transparent backgrounds, run through remove.bg before compositing

**Generation discipline:**
- Generate 4 variants of each prompt
- Pick the best one
- Generate 4 more variations of THAT one
- Never settle for the first acceptable result

**Total AI images needed:** ~10
- 1 hero (or skip if using real screenshot)
- 4 Career Pilot states
- 5 role dashboard mockups (one per modal)

Everything else is SVG, HTML/CSS, or real assets (testimonial photos, school logos, brand wordmark).

---

## 6. The Claude Code Brief (Paste this exactly when handing off)

```
I'm rebuilding the public homepage for Skillship Edutech, an AI-powered school 
management platform for grades 6–12 in India. I have attached a complete design 
brief (skillship_homepage_brief.md). I built the platform backend and dashboard 
already — this is only the public marketing homepage.

Build the homepage as a single Next.js 14 App Router page (app/page.tsx) with 
these constraints:

1. Read the brief end-to-end before writing any code.
2. Use the exact color tokens, typography scale, and spacing from Section 1.
3. Build all 13 sections from Section 3 in the order specified.
4. Use Framer Motion for component animations, GSAP ScrollTrigger only for the 
   Career Pilot sticky scroll (Section 5), Lenis for smooth scrolling.
5. Mobile-first responsive. Test at 375px, 768px, 1280px, 1920px.
6. Performance must hit Lighthouse ≥ 95. Don't import what you don't use.
7. Honor prefers-reduced-motion everywhere.
8. Use placeholder images named per section (e.g., /public/hero-mockup.png, 
   /public/career-pilot-state-1.png). I'll replace with real images later.
9. All copy must match the brief exactly. Don't paraphrase headlines.
10. The site must feel premium AND warm — restraint over abundance, but never 
    austere. Skillship's tagline is "Where Fun Meets Learning" — that warmth 
    must come through. If a section feels generic or cold, redesign it.
11. The brand colors are extracted directly from the Skillship logo: orange 
    #F39C32 and teal #2EB6B5. The brand gradient (orange → teal) is the 
    signature move — use it once per screen max.

Split into components:
- components/Nav.tsx
- components/Hero.tsx
- components/TrustStrip.tsx
- components/ThePromise.tsx
- components/CareerPilot.tsx       (sticky scroll, GSAP)
- components/AdaptiveQuiz.tsx      (animated SVG chart)
- components/QuestionGenerator.tsx (animated PDF→MCQs demo)
- components/Marketplace.tsx
- components/RoleCards.tsx
- components/WhySkillship.tsx
- components/SocialProof.tsx       (testimonials + partner logos)
- components/FinalCTA.tsx
- components/Footer.tsx

Plus:
- lib/motion.ts            (shared animation variants)
- lib/colors.ts            (color token exports for TS use)
- app/globals.css          (token definitions, base styles, font loading)
- app/page.tsx             (composes all sections)

Build incrementally:
Round 1: Nav + Hero. Show me before continuing.
Round 2: TrustStrip + ThePromise + WhySkillship (the simpler sections).
Round 3: CareerPilot (sticky scroll — the hardest).
Round 4: AdaptiveQuiz + QuestionGenerator (animated demos).
Round 5: Marketplace + RoleCards.
Round 6: SocialProof + FinalCTA + Footer.
Round 7: Polish pass — motion timing, micro-interactions, performance audit.

Constraints I'll be checking against:
- Is there enough whitespace? (If sections feel tight, add 32–64px more padding.)
- Does each section have ONE idea? (Not three.)
- Are animations purposeful? (No animation just because it's possible.)
- Does it feel like Skillship's brand? (Orange + teal + warm cream, not generic SaaS purple-and-blue.)
- Is it fast? (Lighthouse must hit 95+.)
```

---

## 7. What NOT to Do (Common Pitfalls)

- ❌ **Don't use pure white as the page background.** Use `--bg-warm` (#FAF7F0). The warmth is the brand.
- ❌ **Don't use violet, indigo, blue, or any color outside the brand palette.** Orange, teal, cream, near-black, occasional green accent. That's it.
- ❌ **Don't add a generic "Features" grid of 6–12 cards.** We picked 3 AI features and made them cinematic instead.
- ❌ **Don't use stock photos of smiling kids at laptops.** Either AI-generated 3D renders, real product UI, or pure SVG/CSS visuals. Never stock.
- ❌ **Don't use more than 2 fonts.** Inter Variable for everything except optional JetBrains Mono for tiny accent labels.
- ❌ **Don't use hover effects that shift layout.** Only opacity, scale (max 1.05), shadow, and color changes.
- ❌ **Don't put a video in the hero.** Performance kills the premium feel on Indian mobile networks.
- ❌ **Don't use heavy parallax.** Subtle (10–20px translate range) or skip it.
- ❌ **Don't use strong borders around sections.** Sections separate via background color + whitespace alone.
- ❌ **Don't write headlines with "Empower" / "Unleash" / "Revolutionize".** Plain, confident, real language.
- ❌ **Don't include Plan 02 features anywhere.** No mention of: Multi-Agent Orchestration, AI Doubt Solver, AI Risk Alerts, Custom School AI Agents, Conversational AI Tutor, WhatsApp Agent, AI School Recommender, Autonomous Content Tagging, AI-based follow-ups, Automated weekly insight reports. If it's marked "Plan 02 only" in the proposal, it doesn't go on this site.
- ❌ **Don't auto-open popups.** The current Skillship site auto-opens an enquiry popup — that's the opposite of premium. Use embedded CTAs and a single clean modal only when explicitly triggered.
- ❌ **Don't use WhatsApp chat widget that floats over content.** If you want WhatsApp contact, put it in the footer or a quiet bottom-right corner with brand colors.

---

## 8. Final Checklist Before Launch

- [ ] All 13 sections built and copy matches brief exactly
- [ ] Brand colors used correctly — orange/teal everywhere, no foreign palette
- [ ] Skillship wordmark (real SVG, "SKILL" orange + "SHIP" teal) in nav and footer
- [ ] Hero loads in < 2 seconds on 4G
- [ ] Career Pilot sticky scroll works on all screen sizes
- [ ] Animated SVG quiz chart draws correctly on scroll
- [ ] All testimonial copy matches real testimonials (Rishi/Shinaya/Jay Prakash/Ansh)
- [ ] Partner school logos real (not placeholders)
- [ ] Reduced motion mode disables all animations
- [ ] Keyboard navigation works end-to-end (Tab through everything)
- [ ] Lighthouse score ≥ 95 across Performance/Accessibility/Best Practices/SEO
- [ ] Open Graph meta tags + Twitter card tags set
- [ ] Sitemap.xml + robots.txt generated
- [ ] Demo booking form connects to your CRM/email
- [ ] No Plan 02 features mentioned anywhere

---

## End of brief

*Prepared by amfire · For Skillship Edutech · Plan 01 (Core AI) build*
