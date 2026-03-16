import { z } from 'zod';
import { 
  insertProductSchema, 
  insertMoodMixSchema, 
  products, 
  categories, 
  moodMixes, 
  wishlistItems 
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products' as const,
      input: z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        brand: z.string().optional(),
        gender: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/products/:id' as const,
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    recommend: {
      method: 'POST' as const,
      path: '/api/products/recommend' as const,
      input: z.object({
        prompt: z.string(),
      }),
      responses: {
        200: z.object({
          intro: z.string(),
          recommendations: z.array(z.object({
            productId: z.number(),
            name: z.string(),
            brand: z.string(),
            reason: z.string(),
            image: z.string().nullable().optional(),
          })),
        }),
      },
    },
  },
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/categories' as const,
      responses: {
        200: z.array(z.custom<typeof categories.$inferSelect>()),
      },
    },
  },
  moodMix: {
    list: {
      method: 'GET' as const,
      path: '/api/mood-mixes' as const,
      responses: {
        200: z.array(z.custom<typeof moodMixes.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/mood-mixes' as const,
      input: insertMoodMixSchema.pick({ name: true, description: true, color: true }),
      responses: {
        201: z.custom<typeof moodMixes.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/mood-mixes/:id' as const,
      responses: {
        200: z.custom<typeof moodMixes.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    addItem: {
      method: 'POST' as const,
      path: '/api/mood-mixes/:id/items' as const,
      input: z.object({ productId: z.number() }),
      responses: {
        201: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    removeItem: {
      method: 'DELETE' as const,
      path: '/api/mood-mixes/:id/items/:productId' as const,
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  wishlist: {
    list: {
      method: 'GET' as const,
      path: '/api/wishlist' as const,
      responses: {
        200: z.array(z.custom<typeof wishlistItems.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    toggle: {
      method: 'POST' as const,
      path: '/api/wishlist' as const,
      input: z.object({ productId: z.number() }),
      responses: {
        200: z.object({ added: z.boolean() }), // true if added, false if removed
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
