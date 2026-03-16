# Perfie - Luxury Fragrance Discovery Platform

## Overview
Perfie is a luxury perfume discovery web application featuring AI-powered scent recommendations, wishlists, and curated MoodMix collections. Built with a gold & black luxury aesthetic.

## Tech Stack
- **Frontend**: React + Vite + TypeScript, TailwindCSS, Shadcn/UI, Framer Motion, Wouter (routing), TanStack Query
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (Neon-backed via Replit)
- **ORM**: Drizzle
- **Auth**: Replit Auth (OIDC)
- **AI**: OpenAI (via Replit AI integrations) for Aro scent recommendations

## Project Structure
```
client/src/
  pages/        - Home, Explore, ProductDetails, MoodMixes, Wishlist
  components/   - Navigation, Footer, ProductCard, AroAssistant
  hooks/        - use-auth, use-products, use-categories, use-wishlist, use-mood-mix
server/
  routes.ts     - API routes + seed data
  storage.ts    - Database storage interface
  db.ts         - Drizzle database connection
shared/
  schema.ts     - Drizzle schema + Zod schemas + types
  routes.ts     - API contract definitions
```

## Key Features
- Product catalog with category filtering, search
- Product details with real pricing from database
- AI assistant "Aro" for scent recommendations
- Wishlist (requires auth)
- MoodMix collections (requires auth)
- Replit Auth sign-in (supports email, Google, GitHub, Apple)

## Database Schema
- `products` - Fragrances with name, brand, notes, image, category, gender, concentration
- `categories` - Floral, Woody, Fresh, Oriental
- `prices` - Vendor prices for products (Nykaa, Tata CLiQ Luxury, Myntra) in INR
- `wishlist_items` - User wishlists
- `mood_mixes` / `mood_mix_items` - User-curated collections

## Design
- Luxury gold & black palette (primary: metallic gold #D9B310)
- Playfair Display serif headings, DM Sans body
- Dark mode support via CSS variables
- Uses bg-card/bg-background tokens (not hardcoded bg-white)

## Recent Changes
- Added AI-powered MoodMix suggestions: "Aro Suggests" section on collection detail page recommends 3-5 complementary fragrances based on existing items using OpenAI
- Added MoodMix detail page (/mood-mixes/:id) with add/remove perfumes, searchable dialog, and AI suggestions
- Added professional Footer component (brand, links, newsletter, social)
- Redesigned Home page with "Why Perfie" section, fixed MoodMix promo with decorative cards
- Redesigned Explore page with decorative header, results count, improved category chips (3-col grid)
- Redesigned MoodMixes page with elegant sign-in gate, preset mood suggestions, polished create dialog
- Redesigned Wishlist page with polished sign-in/empty/populated states (3-col grid)
- Fixed all LSP type errors (mutate alias, type casts for joined relations)
- Fixed ProductDetails to display real prices from database
- Fixed category filtering by slug
- Fixed dark mode compatibility (replaced bg-white with bg-card)
- Added data-testid attributes to all interactive elements
- Added About, Contact, Privacy pages with proper routing from footer
- Expanded product catalog to 100 luxury fragrances available in India (brands include: Chanel, Dior, Tom Ford, Jo Malone, Gucci, Prada, Burberry, Bvlgari, Creed, Hermes, Carolina Herrera, YSL, Versace, Armani, Paco Rabanne, Ralph Lauren, Coach, Azzaro, Guerlain, Rasasi, Ajmal, Forest Essentials, Tommy Hilfiger, DKNY, Kenzo, Diesel, Moschino, Tiffany, Fogg, Yardley, and more)
- Prices displayed in INR from Indian retailers (Nykaa, Tata CLiQ Luxury, Myntra) with "Prices may vary" disclaimer
- Price links redirect to retailer search pages for each specific perfume
