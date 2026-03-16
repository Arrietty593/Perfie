import { 
  users, type User, type InsertUser,
  products, type Product, type InsertProduct, type ProductWithDetails,
  categories, type Category,
  moodMixes, type MoodMix, type InsertMoodMix, type MoodMixWithItems,
  moodMixItems,
  wishlistItems, type WishlistItem, type WishlistWithProduct,
  prices, type Price
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, and, desc, sql, gte, lte, inArray } from "drizzle-orm";
import { authStorage, type IAuthStorage } from "./replit_integrations/auth/storage";
import { chatStorage, type IChatStorage } from "./replit_integrations/chat/storage";

export interface IStorage extends IAuthStorage, IChatStorage {
  // Products
  getProducts(filters?: { search?: string; category?: string; brand?: string; gender?: string; minPrice?: string; maxPrice?: string }): Promise<Product[]>;
  getProduct(id: number): Promise<ProductWithDetails | undefined>;
  getProductsByIds(ids: number[]): Promise<Product[]>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;

  // MoodMix
  getMoodMixes(userId: string): Promise<MoodMix[]>;
  getMoodMix(id: number): Promise<MoodMixWithItems | undefined>;
  createMoodMix(userId: string, mix: InsertMoodMix): Promise<MoodMix>;
  updateMoodMix(id: number, data: { name?: string; description?: string }): Promise<MoodMix>;
  addMoodMixItem(moodMixId: number, productId: number): Promise<void>;
  removeMoodMixItem(moodMixId: number, productId: number): Promise<void>;

  // Wishlist
  getWishlist(userId: string): Promise<WishlistWithProduct[]>;
  addToWishlist(userId: string, productId: number): Promise<void>;
  removeFromWishlist(userId: string, productId: number): Promise<void>;
  isInWishlist(userId: string, productId: number): Promise<boolean>;

  // Seeding/Admin
  createProduct(product: InsertProduct): Promise<Product>;
  createCategory(category: Category): Promise<Category>;
  createPrice(price: Price): Promise<Price>;
}

export class DatabaseStorage implements IStorage {
  // Inherit Auth & Chat methods
  getUser = authStorage.getUser.bind(authStorage);
  upsertUser = authStorage.upsertUser.bind(authStorage);
  getConversation = chatStorage.getConversation.bind(chatStorage);
  getAllConversations = chatStorage.getAllConversations.bind(chatStorage);
  createConversation = chatStorage.createConversation.bind(chatStorage);
  deleteConversation = chatStorage.deleteConversation.bind(chatStorage);
  getMessagesByConversation = chatStorage.getMessagesByConversation.bind(chatStorage);
  createMessage = chatStorage.createMessage.bind(chatStorage);

  // Products
  async getProducts(filters?: { search?: string; category?: string; brand?: string; gender?: string; minPrice?: string; maxPrice?: string }): Promise<Product[]> {
    const conditions = [];

    if (filters?.search) {
      conditions.push(or(
        ilike(products.name, `%${filters.search}%`),
        ilike(products.brand, `%${filters.search}%`),
        ilike(products.description, `%${filters.search}%`)
      ));
    }

    if (filters?.category) {
      const [cat] = await db.select().from(categories).where(eq(categories.slug, filters.category));
      if (cat) {
        conditions.push(eq(products.categoryId, cat.id));
      }
    }

    if (filters?.brand) {
      conditions.push(ilike(products.brand, filters.brand));
    }

    if (filters?.gender) {
       conditions.push(eq(products.gender, filters.gender));
    }

    if (filters?.minPrice || filters?.maxPrice) {
      const priceConditions = [];
      if (filters.minPrice) {
        priceConditions.push(gte(prices.price, filters.minPrice));
      }
      if (filters.maxPrice) {
        priceConditions.push(lte(prices.price, filters.maxPrice));
      }
      const matchingProductIds = await db
        .select({ productId: prices.productId })
        .from(prices)
        .where(and(...priceConditions))
        .groupBy(prices.productId);
      
      const ids = matchingProductIds.map(p => p.productId);
      if (ids.length === 0) return [];
      conditions.push(inArray(products.id, ids));
    }

    if (conditions.length > 0) {
      return await db.select().from(products).where(and(...conditions));
    }
    
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<ProductWithDetails | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    if (!product) return undefined;

    const [category] = await db.select().from(categories).where(eq(categories.id, product.categoryId!));
    const productPrices = await db.select().from(prices).where(eq(prices.productId, id));

    return { ...product, category, prices: productPrices };
  }

  async getProductsByIds(ids: number[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    return await db.select().from(products).where(sql`${products.id} IN ${ids}`);
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  // MoodMix
  async getMoodMixes(userId: string): Promise<MoodMix[]> {
    return await db.select().from(moodMixes).where(eq(moodMixes.userId, userId));
  }

  async getMoodMix(id: number): Promise<MoodMixWithItems | undefined> {
    const [mix] = await db.select().from(moodMixes).where(eq(moodMixes.id, id));
    if (!mix) return undefined;

    const items = await db
      .select({
        ...moodMixItems,
        product: products,
      })
      .from(moodMixItems)
      .innerJoin(products, eq(moodMixItems.productId, products.id))
      .where(eq(moodMixItems.moodMixId, id));

    return { ...mix, items: items.map(i => ({ ...i, product: i.product })) };
  }

  async createMoodMix(userId: string, mix: InsertMoodMix): Promise<MoodMix> {
    const [newMix] = await db.insert(moodMixes).values({ ...mix, userId }).returning();
    return newMix;
  }

  async updateMoodMix(id: number, data: { name?: string; description?: string }): Promise<MoodMix> {
    const [updated] = await db.update(moodMixes).set(data).where(eq(moodMixes.id, id)).returning();
    return updated;
  }

  async addMoodMixItem(moodMixId: number, productId: number): Promise<void> {
    await db.insert(moodMixItems).values({ moodMixId, productId }).onConflictDoNothing();
  }

  async removeMoodMixItem(moodMixId: number, productId: number): Promise<void> {
    await db.delete(moodMixItems).where(and(eq(moodMixItems.moodMixId, moodMixId), eq(moodMixItems.productId, productId)));
  }

  // Wishlist
  async getWishlist(userId: string): Promise<WishlistWithProduct[]> {
    const items = await db
      .select({
        ...wishlistItems,
        product: products,
      })
      .from(wishlistItems)
      .innerJoin(products, eq(wishlistItems.productId, products.id))
      .where(eq(wishlistItems.userId, userId));
      
    return items.map(i => ({ ...i, product: i.product }));
  }

  async addToWishlist(userId: string, productId: number): Promise<void> {
    await db.insert(wishlistItems).values({ userId, productId }).onConflictDoNothing();
  }

  async removeFromWishlist(userId: string, productId: number): Promise<void> {
    await db.delete(wishlistItems).where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)));
  }

  async isInWishlist(userId: string, productId: number): Promise<boolean> {
    const [item] = await db.select().from(wishlistItems).where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)));
    return !!item;
  }

  // Seeding
  async createProduct(product: InsertProduct): Promise<Product> {
    const [p] = await db.insert(products).values(product).returning();
    return p;
  }

  async createCategory(category: Category): Promise<Category> {
    const [c] = await db.insert(categories).values(category).returning();
    return c;
  }

  async createPrice(price: Price): Promise<Price> {
    const [p] = await db.insert(prices).values(price).returning();
    return p;
  }
}

export const storage = new DatabaseStorage();
