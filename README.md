<div align="center">

<img src="./public/logo.png" alt="ShopSmart Logo" height="80" />

# ShopSmart — Personalized Product Recommendations

### 🌐 Deployed site: [smart-shop-steel.vercel.app](https://smart-shop-steel.vercel.app)

## Demo Video

<div align="center">
https://drive.google.com/file/d/1-ZLrei39lp6f4QmkXjdE8uKB__6tye04/view?usp=sharing
<br/>
<p><em>Complete walkthrough of all features</em></p>
</div>

---

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8?logo=tailwindcss&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?logo=eslint&logoColor=white)
![Better Auth](https://img.shields.io/badge/Auth-Better%20Auth-0ea5e9)
![MongoDB](https://img.shields.io/badge/MongoDB-6-47A248?logo=mongodb&logoColor=white)
![Google Gemini](https://img.shields.io/badge/LLM-Gemini%202.5-8E75B2)
![Node](https://img.shields.io/badge/Node->=18.18-339933?logo=nodedotjs&logoColor=white)
![Status](https://img.shields.io/badge/Project-Interview%20Task-informational)

Elegant Next.js app that showcases AI‑assisted product recommendations, protected routes, onboarding‑driven personalization, and a polished UI component system.
</div>

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server/Route Handlers)
- **Language**: TypeScript
- **UI**: Tailwind CSS v4, Radix UI, custom components in `src/components/ui`
- **State/Forms**: React Hook Form + Zod
- **Auth**: Better Auth (cookies plugin for Next.js)
- **DB**: MongoDB (via `mongodb` driver)
- **LLM**: Google Gemini (server‑side, SSE stream)

---

## Project Structure
```text
src/
  app/
    (auth)/                 # Auth-only wrapper; redirects based on profile
      signin/               # Sign in form
      signup/               # Sign up form
    (protected)/            # Requires session; checks onboarding
      products/             # Full product catalog + filters
      recommended/          # AI recommendations UI
      onboarding/           # Profile onboarding
      profile/              # Profile page
    api/
      auth/[...all]/        # Better Auth handler (GET/POST)
      profile/              # GET/POST/PATCH profile data
      recommendations/      # POST → SSE stream of AI recs
        product/            # POST → content-based similar items
  components/               # UI kit, filters, cards, layout, loaders
  data/                     # products.json (catalog), sample-recommendations.json
  lib/                      # auth, db connection, utils
  types/                    # TS types for profile/recommendation
```

---

# Features & Screenshots

1. **Test AI Recommendations Without Login**  
   Paste products JSON and user preferences to instantly preview LLM-powered suggestions.  
   <div align="center">
     <img src="./example-images/s8.png" alt="Test LLM" width="800" />
   </div>

2. **Authentication**  
   Secure login and signup with Better Auth.  
   <div align="center">
     <img src="./example-images/s1.png" alt="Sign In" width="800" />
   </div>

3. **Onboarding Flow**  
   Capture preferences: categories, price range, lifestyle, and interests.  
   <div align="center">
     <img src="./example-images/s2.png" alt="Onboarding" width="800" />
   </div>

4. **Profile Dashboard**  
   View saved preferences and activity history.  
   <div align="center">
     <img src="./example-images/s9.png" alt="Profile" width="800" />
     <img src="./example-images/s3.png" alt="Profile" width="800" />
   </div>

5. **Product Catalog**  
   Browse with rich filters and responsive layout.  
   <div align="center">
     <img src="./example-images/s7.png" alt="Products" width="800" />
     <img src="./example-images/s10.png" alt="Products" width="800" />
   </div>

6. **Product Details**  
   Full description with content-based similar items.  
   <div align="center">
     <img src="./example-images/s11.png" alt="Product Details" width="800" />
   </div>

7. **Search Behavior Patterns**  
   Shows previous searches and personalized suggestions based on interactions.  
   <div align="center">
     <img src="./example-images/s4.png" alt="Search Behavior" width="800" />
   </div>

8. **AI Recommendations with LLM Explanations**  
   Click "Get Recommendations" to trigger SSE streaming with relevance scores and "Why this product?" justifications.  
   <div align="center">
     <img src="./example-images/s14.png" alt="AI Recommendations" width="800" />
     <img src="./example-images/s13.png" alt="AI Recommendations" width="800" />
   </div>

9. **Interaction API**  
   Clicking "Add to Cart" triggers POST request — check network tab for 200 OK response with payload.  
   <div align="center">
     <img src="./example-images/s12.png" alt="Interaction API" width="800" />
   </div>

---

## Evaluation Metrics

### Recommendation Accuracy Evaluation

| Algorithm Component | Weight (%) | Method | Description |
|---------------------|------------|--------|-------------|
| **Profile-Based Filtering** | 30% | Preference Matching | User's favorite categories, lifestyle, interests from onboarding data |
| **Search History Analysis** | 20% | Query Pattern Matching | Relevance based on past search terms and semantic similarity |
| **Interaction-Based Scoring** | 20% | Behavioral Signals | Weight from viewed products, cart additions, wishlist items |
| **Price Range Compliance** | 15% | Budget Filtering | Products within user's specified min-max price range |
| **Content-Based Similarity** | 10% | Attribute Matching | Category, brand, and product attribute alignment |
| **LLM Contextual Reasoning** | 5% | Gemini Enhancement | AI-driven relevance refinement and edge case handling |
| **Total Recommendation Engine** | **100%** | **Hybrid Algorithm** | **Weighted combination of all components** |

### Explanation Quality Evaluation

| Metric | Method | Description |
|--------|--------|-------------|
| **Match Reasons Specificity** | Structured Output | Clear category, price, lifestyle alignment reasons from LLM |
| **Profile Reference Accuracy** | Context Validation | Correct use of user's stated preferences and interests |
| **Search Context Integration** | Query Awareness | Links recommendations to recent search patterns |
| **Relevance Score Transparency** | Score Justification | Explains why relevance score (0-1) was assigned |
| **Natural Language Quality** | LLM Fluency | Readability and coherence of Gemini-generated text |

**Algorithm Infusion Notes:**
- **Collaborative Filtering** (70%): Profile (30%) + Search History (20%) + Interactions (20%)
- **Content-Based Filtering** (10%): Category and attribute matching for similar products
- **Hybrid LLM Enhancement** (20%): Search context + Gemini reasoning for final ranking
- Real-time weight adjustment based on data availability (e.g., cold start users rely more on profile)
- Explanation generation uses structured prompt with user context for personalized reasoning

---

## App Architecture

### Overall System Architecture
```mermaid
graph TD
  A[User] --> B[Next.js App Router]
  B --> C[Pages & Layouts]
  C --> D[UI Components]
  C --> E[Filters/Search]
  B --> F["/api/profile"]
  B --> G["/api/recommendations"]
  B --> H["/api/recommendations/product"]
  B --> I["/api/auth/...all"]
  F --> J[(MongoDB)]
  G --> J
  H --> K["products.json"]
  G --> L["Google Gemini"]
```

### Collaborative Filtering Flow (Profile + History Based)
```mermaid
sequenceDiagram
  participant U as User
  participant FE as Next.js UI
  participant RH as /api/recommendations
  participant DB as MongoDB
  participant LLM as Google Gemini

  U->>FE: Click "Get AI Recommendations"
  FE->>RH: POST /api/recommendations
  RH->>DB: Fetch user profile
  Note over DB: Profile: preferences, price range,<br/>lifestyle, favorite categories
  RH->>DB: Fetch search history
  Note over DB: Search terms, timestamps
  RH->>DB: Fetch interaction history
  Note over DB: Viewed products, cart additions,<br/>wishlist items
  RH->>LLM: Stream prompt with user context
  Note over LLM: Collaborative filtering:<br/>Profile + Search + Interactions
  LLM-->>RH: Token stream
  loop As chunks arrive
    RH-->>FE: SSE data: metadata | recommendation | [DONE]
  end
  FE-->>U: Render AI recommendations with explanations
```

### Content-Based Filtering + Search Behavior Pattern
```mermaid
sequenceDiagram
  participant U as User
  participant FE as Next.js UI
  participant RH_CB as /api/recommendations/product
  participant RH_PROF as /api/profile
  participant DB as MongoDB
  participant PJ as products.json

  %% Content-Based Flow
  U->>FE: Click on a product card
  FE->>RH_CB: POST /api/recommendations/product { productId }
  RH_CB->>PJ: Fetch product details
  Note over PJ: Name, category, price,<br/>brand, attributes
  RH_CB->>PJ: Find similar products
  Note over PJ: Match by category, price range,<br/>brand, attributes (Content-Based)
  PJ-->>RH_CB: Return product + similar items
  RH_CB-->>FE: Send product details + related products
  FE-->>U: Display product page with similar items

  %% Search Behavior Pattern Tracking
  U->>FE: Search for "wireless headphones"
  FE->>RH_PROF: PATCH /api/profile
  Note over RH_PROF: action: "addSearchHistory"<br/>searchTerm: "wireless headphones"
  RH_PROF->>DB: Update user profile
  Note over DB: Append to searchHistory array<br/>with timestamp
  DB-->>RH_PROF: Confirm update
  RH_PROF-->>FE: Success response
  
  U->>FE: View profile page
  FE->>RH_PROF: GET /api/profile
  RH_PROF->>DB: Fetch user profile
  DB-->>RH_PROF: Return profile with searchHistory
  RH_PROF-->>FE: Send profile data
  FE-->>U: Display search behavior patterns
  Note over FE: Shows recent searches,<br/>trending patterns, suggestions
```

---

## API (Frontend Route Handlers)

### Auth
- `GET | POST /api/auth/[...all]` – Better Auth handler (email/password enabled)

### Profile
- `GET /api/profile` – returns `{ profile }`, requires session
- `POST /api/profile` – create/update onboarding payload; sets `onboardingCompleted: true`
- `PATCH /api/profile` – partial updates and actions
  - `{ action: "addSearchHistory", searchTerm: string }`
  - or profile fields (gender, address, favoriteCategories, priceRange, interests, lifestyle, etc.)

### Recommendations (AI, SSE)
- `POST /api/recommendations` – requires session
  - Streams `text/event-stream` with events shaped as:
    - `{"type":"metadata","totalFiltered":number,"totalProducts":number}`
    - `{"type":"recommendation","data":{ product, explanation, relevanceScore, matchReasons }}`
    - `[DONE]` when finished

### Product‑similar Recommendations (content‑based)
- `POST /api/recommendations/product`
  - Body: `{ productId: string, limit?: number }`
  - Returns: `{ data: Product[] }`

---

## Evaluation Metrics

### Recommendation Accuracy Evaluation

| Algorithm Component | Weight (%) | Method | Description |
|---------------------|------------|--------|-------------|
| **Profile-Based Filtering** | 30% | Preference Matching | User's favorite categories, lifestyle, interests from onboarding data |
| **Price Range Compliance** | 15% | Budget Filtering | Products within user's specified min-max price range |
| **Search History Analysis** | 20% | Query Pattern Matching | Relevance based on past search terms and semantic similarity |
| **Interaction-Based Scoring** | 20% | Behavioral Signals | Weight from viewed products, cart additions, wishlist items |
| **Content-Based Similarity** | 10% | Attribute Matching | Category, brand, and product attribute alignment |
| **LLM Contextual Reasoning** | 5% | Gemini Enhancement | AI-driven relevance refinement and edge case handling |
| **Total Recommendation Engine** | **100%** | **Hybrid Algorithm** | **Weighted combination of all components** |

### Explanation Quality Evaluation

| Metric | Weight (%) | Method | Description |
|--------|------------|--------|-------------|
| **Match Reasons Specificity** | 25% | Structured Output | Clear category, price, lifestyle alignment reasons |
| **Profile Reference Accuracy** | 25% | Context Validation | Correct use of user's stated preferences and interests |
| **Search Context Integration** | 20% | Query Awareness | Links recommendations to recent search patterns |
| **Relevance Score Transparency** | 15% | Score Justification | Explains why relevance score (0-1) was assigned |
| **Natural Language Quality** | 15% | LLM Fluency | Readability and coherence of Gemini-generated text |
| **Total Explanation Quality** | **100%** | **Gemini 2.5 Prompt** | **Weighted explanation generation** |

**Algorithm Infusion Notes:**
- **Collaborative Filtering** (70%): Profile (30%) + Search History (20%) + Interactions (20%)
- **Content-Based Filtering** (10%): Category and attribute matching for similar products
- **Hybrid LLM Enhancement** (20%): Search context + Gemini reasoning for final ranking
- Real-time weight adjustment based on data availability (e.g., cold start users rely more on profile)
- Explanation generation uses structured prompt with user context for personalized reasoning

---

## Environment Variables

Create a `.env.local` at the project root:
```bash
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Quickstart

1. Install dependencies: `npm install`
2. Add `.env.local` (see above)
3. Start dev server: `npm run dev`
4. Visit `http://localhost:3000`

---

## License

This project is part of an interview task and is for demonstration purposes.

---

<div align="center">
  Made by Mohamed Asif M 22BCE1634
</div>
