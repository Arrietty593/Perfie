import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export Auth and Chat models from integrations
export * from "./models/auth";
export * from "./models/chat";

import { users } from "./models/auth";

// === FRAGRANCE DATA MODELS ===

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  slug: text("slug").unique().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  description: text("description").notNull(),
  notes: jsonb("notes").$type<string[]>(), // Top/Middle/Base notes
  image: text("image").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  gender: text("gender").default("unisex"), // male, female, unisex
  concentration: text("concentration"), // EDP, EDT, etc.
});

export const prices = pgTable("prices", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  vendor: text("vendor").notNull(),
  url: text("url").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// === USER FEATURES ===

export const moodMixes = pgTable("mood_mixes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id), // Auth uses string IDs
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#000000"), // For UI customization
  createdAt: timestamp("created_at").defaultNow(),
});

export const moodMixItems = pgTable("mood_mix_items", {
  id: serial("id").primaryKey(),
  moodMixId: integer("mood_mix_id").notNull().references(() => moodMixes.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
});

export const wishlistItems = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  prices: many(prices),
  wishlistItems: many(wishlistItems),
  moodMixItems: many(moodMixItems),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const moodMixesRelations = relations(moodMixes, ({ many }) => ({
  items: many(moodMixItems),
}));

export const moodMixItemsRelations = relations(moodMixItems, ({ one }) => ({
  moodMix: one(moodMixes, {
    fields: [moodMixItems.moodMixId],
    references: [moodMixes.id],
  }),
  product: one(products, {
    fields: [moodMixItems.productId],
    references: [products.id],
  }),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  product: one(products, {
    fields: [wishlistItems.productId],
    references: [products.id],
  }),
}));

// === ZOD SCHEMAS ===

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertPriceSchema = createInsertSchema(prices).omit({ id: true, lastUpdated: true });
export const insertMoodMixSchema = createInsertSchema(moodMixes).omit({ id: true, createdAt: true });
export const insertMoodMixItemSchema = createInsertSchema(moodMixItems).omit({ id: true });
export const insertWishlistItemSchema = createInsertSchema(wishlistItems).omit({ id: true, createdAt: true });

// === TYPES ===

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Category = typeof categories.$inferSelect;
export type Price = typeof prices.$inferSelect;
export type MoodMix = typeof moodMixes.$inferSelect;
export type InsertMoodMix = z.infer<typeof insertMoodMixSchema>;
export type WishlistItem = typeof wishlistItems.$inferSelect;

export type ProductWithDetails = Product & {
  category: Category | null;
  prices: Price[];
};

export type MoodMixWithItems = MoodMix & {
  items: (typeof moodMixItems.$inferSelect & {
    product: Product;
  })[];
};

export type WishlistWithProduct = WishlistItem & {
  product: Product;
};
