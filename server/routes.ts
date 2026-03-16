import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { z } from "zod";
import { openai } from "./replit_integrations/image"; // Use shared client

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 1. Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // 2. Setup Chat
  registerChatRoutes(app);

  // 3. API Routes

  // Products
  app.get(api.products.list.path, async (req, res) => {
    try {
      const filters = req.query; // Simple mapping, could be robustified
      const products = await storage.getProducts(filters as any);
      res.json(products);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.products.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const product = await storage.getProduct(id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  // AI Recommendation
  app.post(api.products.recommend.path, async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ message: "Prompt required" });

      // Fetch all products to give context to AI (for MVP - for prod use vector search)
      const allProducts = await storage.getProducts();
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are Aro, a warm and knowledgeable luxury fragrance expert. The user will describe a mood, memory, occasion, or scent preference. Your job is to recommend 2-4 fragrances from the catalog below that best match.

IMPORTANT: You MUST always recommend at least 2 fragrances. Even if the match isn't perfect, find the closest options and explain the connection.

Return a JSON object with this exact structure:
{
  "intro": "A brief, warm 1-2 sentence introduction to your recommendations",
  "recommendations": [
    {
      "productId": <number>,
      "name": "<product name>",
      "brand": "<brand>",
      "reason": "A short, evocative 1-2 sentence explanation of why this fragrance matches their request"
    }
  ]
}

Available Products:
${JSON.stringify(allProducts.map(p => ({ id: p.id, name: p.name, brand: p.brand, notes: p.notes, description: p.description, category: p.category, gender: p.gender })))}`
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      const recommendations = result.recommendations || [];

      if (!Array.isArray(recommendations) || recommendations.length === 0) {
        return res.json({ intro: "I couldn't find specific matches, but tell me more about what you like!", recommendations: [] });
      }

      const ids = recommendations.map((r: any) => r.productId);
      const products = await storage.getProductsByIds(ids);

      const enrichedRecommendations = recommendations.map((r: any) => {
        const product = products.find((p: any) => p.id === r.productId);
        return {
          ...r,
          image: product?.image || null,
        };
      }).filter((r: any) => products.some((p: any) => p.id === r.productId));

      res.json({ intro: result.intro, recommendations: enrichedRecommendations });

    } catch (error) {
      console.error("AI Recommendation error:", error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  // Categories
  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  // MoodMix (Protected)
  app.get(api.moodMix.list.path, isAuthenticated, async (req: any, res) => {
    const mixes = await storage.getMoodMixes(req.user!.claims.sub);
    res.json(mixes);
  });

  app.post(api.moodMix.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.moodMix.create.input.parse(req.body);
      const mix = await storage.createMoodMix(req.user!.claims.sub, input);
      res.status(201).json(mix);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json(e);
      throw e;
    }
  });

  app.get(api.moodMix.get.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const mix = await storage.getMoodMix(id);
    if (!mix) return res.status(404).json({ message: "Not found" });
    res.json(mix);
  });

  app.patch("/api/mood-mixes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const mix = await storage.getMoodMix(id);
      if (!mix) return res.status(404).json({ message: "Not found" });
      if (mix.userId !== req.user!.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const { name, description } = req.body;
      if (!name && description === undefined) {
        return res.status(400).json({ message: "Provide name or description" });
      }
      const data: { name?: string; description?: string } = {};
      if (name) data.name = name;
      if (description !== undefined) data.description = description;
      const updated = await storage.updateMoodMix(id, data);
      res.json(updated);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Failed to update mood mix" });
    }
  });

  app.post(api.moodMix.addItem.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const { productId } = req.body;
    await storage.addMoodMixItem(id, productId);
    res.status(201).json({ success: true });
  });

  app.delete(api.moodMix.removeItem.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const productId = parseInt(req.params.productId);
    await storage.removeMoodMixItem(id, productId);
    res.status(204).send();
  });

  app.get("/api/mood-mixes/:id/suggestions", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mix = await storage.getMoodMix(id);
      if (!mix) return res.status(404).json({ message: "Not found" });

      const items = (mix as any).items || [];
      if (items.length === 0) {
        return res.json({ suggestions: [] });
      }

      const existingProducts = items.map((i: any) => i.product).filter(Boolean);
      const existingIds = new Set(existingProducts.map((p: any) => p.id));

      const allProducts = await storage.getProducts();
      const availableProducts = allProducts.filter(p => !existingIds.has(p.id));

      if (availableProducts.length === 0) {
        return res.json({ suggestions: [] });
      }

      const collectionSummary = existingProducts.map((p: any) =>
        `${p.name} by ${p.brand} (${p.category || ""}, notes: ${p.topNotes || ""}, ${p.middleNotes || ""}, ${p.baseNotes || ""}, gender: ${p.gender || "unisex"})`
      ).join("\n");

      const catalogSummary = availableProducts.slice(0, 40).map(p =>
        `ID:${p.id} | ${p.name} by ${p.brand} (${(p as any).category || ""}, notes: ${p.topNotes || ""}, ${p.middleNotes || ""}, ${p.baseNotes || ""}, gender: ${p.gender || "unisex"})`
      ).join("\n");

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are Aro, a luxury fragrance expert. Given the perfumes already in a user's MoodMix collection, suggest 3-5 complementary fragrances from the available catalog that share similar scent families, notes, moods, or occasions.

Return a JSON object:
{
  "suggestions": [
    {
      "productId": <number>,
      "name": "<name>",
      "brand": "<brand>",
      "reason": "A brief 1-sentence reason why this complements the collection"
    }
  ]
}

IMPORTANT: Only use product IDs from the available catalog below. Suggest 3-5 perfumes.`
          },
          {
            role: "user",
            content: `Collection already has:\n${collectionSummary}\n\nAvailable perfumes to suggest from:\n${catalogSummary}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const result = JSON.parse(content);
      const suggestions = result.suggestions || [];

      const enriched = suggestions
        .map((s: any) => {
          const product = availableProducts.find(p => p.id === s.productId);
          if (!product) return null;
          return {
            productId: product.id,
            name: product.name,
            brand: product.brand,
            image: product.image,
            reason: s.reason,
          };
        })
        .filter(Boolean);

      res.json({ suggestions: enriched });
    } catch (error) {
      console.error("MoodMix suggestion error:", error);
      res.status(500).json({ message: "Failed to get suggestions" });
    }
  });

  // Wishlist (Protected)
  app.get(api.wishlist.list.path, isAuthenticated, async (req: any, res) => {
    const items = await storage.getWishlist(req.user!.claims.sub);
    res.json(items);
  });

  app.post(api.wishlist.toggle.path, isAuthenticated, async (req: any, res) => {
    const { productId } = req.body;
    const userId = req.user!.claims.sub;
    
    const exists = await storage.isInWishlist(userId, productId);
    if (exists) {
      await storage.removeFromWishlist(userId, productId);
      res.json({ added: false });
    } else {
      await storage.addToWishlist(userId, productId);
      res.json({ added: true });
    }
  });

  // Seed data function
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const categories = await storage.getCategories();
  if (categories.length === 0) {
    const cats = [
      { name: "Floral", slug: "floral", description: "Fresh flower scents like rose, jasmine, and lily." },
      { name: "Woody", slug: "woody", description: "Warm, earthy scents like sandalwood, cedar, and vetiver." },
      { name: "Fresh", slug: "fresh", description: "Citrus, aquatic, and green notes." },
      { name: "Oriental", slug: "oriental", description: "Spicy, warm, and exotic notes like vanilla and amber." },
    ];
    
    const createdCats = [];
    for (const c of cats) {
      createdCats.push(await storage.createCategory(c as any));
    }

    const products = [
      {
        name: "Chanel No. 5",
        brand: "Chanel",
        description: "The essence of femininity. A powder floral bouquet housed in an iconic bottle.",
        notes: ["Aldehydes", "Jasmine", "Neroli", "Sandalwood"],
        image: "/images/chanel-no5.png",
        categoryId: createdCats[0].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "Santal 33",
        brand: "Le Labo",
        description: "An intoxicating scent of spicy, leathery, musky notes that gives this perfume its signature addiction.",
        notes: ["Sandalwood", "Cedar", "Cardamom", "Violet", "Papyrus", "Leather"],
        image: "/images/santal-33.png",
        categoryId: createdCats[1].id,
        gender: "unisex",
        concentration: "EDP"
      },
      {
        name: "Acqua di Gio",
        brand: "Giorgio Armani",
        description: "A fresh and aquatic fragrance, capturing the full power of the sea.",
        notes: ["Marine Notes", "Bergamot", "Cedar", "Musk"],
        image: "/images/acqua-di-gio.png",
        categoryId: createdCats[2].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Black Orchid",
        brand: "Tom Ford",
        description: "A luxurious and sensual fragrance of rich, dark accords and an alluring potion of black orchids and spice.",
        notes: ["Black Truffle", "Black Orchid", "Patchouli", "Plum"],
        image: "/images/black-orchid.png",
        categoryId: createdCats[3].id,
        gender: "unisex",
        concentration: "EDP"
      },
      {
        name: "Miss Dior Blooming Bouquet",
        brand: "Dior",
        description: "A tender couture fragrance for the woman who dares to dream, with a luminous peony and rose accord.",
        notes: ["Peony", "Damascus Rose", "White Musk", "Apricot"],
        image: "/images/miss-dior.png",
        categoryId: createdCats[0].id,
        gender: "female",
        concentration: "EDT"
      },
      {
        name: "Bleu de Chanel",
        brand: "Chanel",
        description: "A bold, aromatic-woody fragrance that embodies freedom and determination.",
        notes: ["Grapefruit", "Mint", "Cedar", "Incense", "Ginger"],
        image: "/images/bleu-de-chanel.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDP"
      },
      {
        name: "Light Blue",
        brand: "Dolce & Gabbana",
        description: "A refreshing and sparkling scent that captures the spirit of Mediterranean summer.",
        notes: ["Sicilian Lemon", "Apple", "Cedarwood", "Bamboo", "White Rose"],
        image: "/images/light-blue.png",
        categoryId: createdCats[2].id,
        gender: "female",
        concentration: "EDT"
      },
      {
        name: "Spicebomb",
        brand: "Viktor & Rolf",
        description: "An explosive cocktail of spices fused with a seductive tobacco accord.",
        notes: ["Chili", "Saffron", "Tobacco", "Leather", "Vetiver"],
        image: "/images/spicebomb.png",
        categoryId: createdCats[3].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "La Vie Est Belle",
        brand: "Lancome",
        description: "A declaration of happiness and freedom. A sweet iris perfume for women who choose their own path.",
        notes: ["Iris", "Patchouli", "Praline", "Vanilla", "Tonka Bean"],
        image: "/images/la-vie-est-belle.png",
        categoryId: createdCats[0].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "Oud Wood",
        brand: "Tom Ford",
        description: "A composition of exotic, smoky woods and distinctive oud for the bold and confident.",
        notes: ["Oud", "Rosewood", "Cardamom", "Sandalwood", "Tonka Bean"],
        image: "/images/oud-wood.png",
        categoryId: createdCats[1].id,
        gender: "unisex",
        concentration: "EDP"
      },
      {
        name: "Versace Pour Homme",
        brand: "Versace",
        description: "A fresh, clean, Mediterranean fragrance with a modern edge.",
        notes: ["Neroli", "Citron", "Amber", "Musk", "Sage"],
        image: "/images/versace-pour-homme.png",
        categoryId: createdCats[2].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Opium",
        brand: "Yves Saint Laurent",
        description: "An iconic oriental fragrance with mysterious spicy and amber notes.",
        notes: ["Mandarin", "Carnation", "Myrrh", "Opopanax", "Vanilla"],
        image: "/images/opium.png",
        categoryId: createdCats[3].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "English Pear & Freesia",
        brand: "Jo Malone",
        description: "A luscious golden pear wrapped in a bouquet of white freesias, with a subtle warmth of patchouli and amber lingering like an autumn afternoon.",
        notes: ["Pear", "Freesia", "Patchouli", "Amber"],
        image: "/images/english-pear-freesia.png",
        categoryId: createdCats[0].id,
        gender: "female",
        concentration: "EDC"
      },
      {
        name: "Wood Sage & Sea Salt",
        brand: "Jo Malone",
        description: "The windswept essence of a rugged coastline — mineral sea salt meets earthy sage, evoking crashing waves on sun-warmed driftwood.",
        notes: ["Sea Salt", "Sage", "Grapefruit", "Ambrette"],
        image: "/images/wood-sage-sea-salt.png",
        categoryId: createdCats[2].id,
        gender: "unisex",
        concentration: "EDC"
      },
      {
        name: "Gucci Bloom",
        brand: "Gucci",
        description: "A rich white floral that blooms on the skin like a secret garden, where tuberose and jasmine intertwine with the mysterious Rangoon creeper.",
        notes: ["Tuberose", "Jasmine", "Rangoon Creeper"],
        image: "/images/gucci-bloom.png",
        categoryId: createdCats[0].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "Gucci Guilty",
        brand: "Gucci",
        description: "A daring and contemporary scent where zesty mandarin collides with pink pepper and deep patchouli, wrapped in a veil of golden amber.",
        notes: ["Mandarin", "Pink Pepper", "Patchouli", "Amber"],
        image: "/images/gucci-guilty.png",
        categoryId: createdCats[3].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "Luna Rossa",
        brand: "Prada",
        description: "A pulse-quickening rush of lavender and bitter orange fused with cool spearmint, like the adrenaline of a midnight sailing race.",
        notes: ["Lavender", "Bitter Orange", "Spearmint", "Ambroxan"],
        image: "/images/luna-rossa.png",
        categoryId: createdCats[2].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Prada Candy",
        brand: "Prada",
        description: "An irresistible confection of molten caramel and creamy benzoin, warmed by a whisper of vanilla and soft musk that clings like a sweet embrace.",
        notes: ["Caramel", "Musk", "Benzoin", "Vanilla"],
        image: "/images/prada-candy.png",
        categoryId: createdCats[3].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "Burberry Her",
        brand: "Burberry",
        description: "A vibrant burst of dark berries — blackberry and raspberry — softened by violet petals and the delicate trail of jasmine and musk.",
        notes: ["Blackberry", "Raspberry", "Violet", "Musk", "Jasmine"],
        image: "/images/burberry-her.png",
        categoryId: createdCats[0].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "Man In Black",
        brand: "Bvlgari",
        description: "A bold and enigmatic elixir where dark rum and supple leather meet the unexpected softness of tuberose and iris, sealed with rich tonka bean.",
        notes: ["Rum", "Leather", "Tuberose", "Iris", "Tonka Bean"],
        image: "/images/bvlgari-man-in-black.png",
        categoryId: createdCats[3].id,
        gender: "male",
        concentration: "EDP"
      },
      {
        name: "Omnia Crystalline",
        brand: "Bvlgari",
        description: "Crystal-clear and luminous, like morning dew on bamboo leaves — nashi pear and lotus float above a whisper of balsa wood.",
        notes: ["Bamboo", "Nashi Pear", "Lotus", "Balsa Wood"],
        image: "/images/omnia-crystalline.png",
        categoryId: createdCats[2].id,
        gender: "female",
        concentration: "EDT"
      },
      {
        name: "Aventus",
        brand: "Creed",
        description: "A masterpiece of power and sophistication — juicy pineapple and smoky birch over a bed of oak moss, crafted for those who conquer.",
        notes: ["Pineapple", "Birch", "Oak Moss", "Bergamot", "Musk"],
        image: "/images/creed-aventus.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDP"
      },
      {
        name: "Terre d'Hermes",
        brand: "Hermes",
        description: "An odyssey from sky to earth — sun-drenched orange and grapefruit descend through peppery heart notes into a grounding base of vetiver and cedar.",
        notes: ["Orange", "Grapefruit", "Pepper", "Vetiver", "Cedar"],
        image: "/images/terre-dhermes.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Good Girl",
        brand: "Carolina Herrera",
        description: "A seductive duality of light and dark — luminous tuberose and jasmine wrapped in velvety cocoa, tonka bean, and creamy sandalwood.",
        notes: ["Tuberose", "Jasmine", "Cocoa", "Tonka Bean", "Sandalwood"],
        image: "/images/good-girl.png",
        categoryId: createdCats[3].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "Daisy",
        brand: "Marc Jacobs",
        description: "A sun-kissed bouquet of wild strawberries and gardenia petals, finished with a playful softness of vanilla and white musk.",
        notes: ["Strawberry", "Violet", "Gardenia", "Jasmine", "Vanilla", "Musk"],
        image: "/images/marc-jacobs-daisy.png",
        categoryId: createdCats[2].id,
        gender: "female",
        concentration: "EDT"
      },
      {
        name: "By the Fireplace",
        brand: "Maison Margiela",
        description: "The crackling warmth of a winter hearth — roasted chestnuts and guaiac wood smoke drift into a comforting haze of vanilla and cashmeran.",
        notes: ["Chestnut", "Guaiac Wood", "Vanilla", "Cashmeran"],
        image: "/images/by-the-fireplace.png",
        categoryId: createdCats[1].id,
        gender: "unisex",
        concentration: "EDT"
      },
      {
        name: "Cool Water",
        brand: "Davidoff",
        description: "A deep plunge into oceanic freshness — sea water and lavender cut through with bracing mint, leaving a trail of cedar and sandalwood on sun-dried skin.",
        notes: ["Sea Water", "Lavender", "Mint", "Cedar", "Sandalwood", "Musk"],
        image: "/images/cool-water.png",
        categoryId: createdCats[2].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Happy",
        brand: "Clinique",
        description: "A radiant smile captured in a bottle — crisp apple and plum blossom meet magnolia and lily, kissed by a shimmer of amber warmth.",
        notes: ["Apple", "Plum", "Magnolia", "Lily", "Amber", "Musk"],
        image: "/images/clinique-happy.png",
        categoryId: createdCats[2].id,
        gender: "female",
        concentration: "Perfume Spray"
      },
      {
        name: "Boss Bottled",
        brand: "Hugo Boss",
        description: "A refined composition of crisp apple and warm cinnamon over a noble heart of geranium, grounded in the quiet confidence of cedar, sandalwood, and vanilla.",
        notes: ["Apple", "Plum", "Cinnamon", "Geranium", "Cedar", "Sandalwood", "Vanilla"],
        image: "/images/hugo-boss-bottled.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Eternity",
        brand: "Calvin Klein",
        description: "Timeless and luminous — sparkling freesia and mandarin open to a heart of lily and marigold, resting on a serene base of sandalwood and amber.",
        notes: ["Freesia", "Mandarin", "Lily", "Marigold", "Sandalwood", "Amber"],
        image: "/images/ck-eternity.png",
        categoryId: createdCats[2].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "Gentleman",
        brand: "Givenchy",
        description: "An elegant iris accord meets aromatic lavender and black pepper, deepening into a sophisticated trail of patchouli and supple leather.",
        notes: ["Iris", "Lavender", "Pepper", "Patchouli", "Leather"],
        image: "/images/givenchy-gentleman.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDP"
      },
      {
        name: "For Her",
        brand: "Narciso Rodriguez",
        description: "An intimate whisper of rose and peach blossom enveloped in sensual musk, with the quiet depth of patchouli and amber glowing beneath.",
        notes: ["Rose", "Peach Blossom", "Musk", "Patchouli", "Amber"],
        image: "/images/narciso-for-her.png",
        categoryId: createdCats[0].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "Explorer",
        brand: "Montblanc",
        description: "A spirit of adventure distilled — bright bergamot and earthy vetiver pave a path through patchouli and leather into a warm amber horizon.",
        notes: ["Bergamot", "Vetiver", "Patchouli", "Leather", "Amber"],
        image: "/images/montblanc-explorer.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDP"
      },
      {
        name: "L'Eau d'Issey",
        brand: "Issey Miyake",
        description: "Pure as a drop of water on a petal — lotus and freesia cascade through cyclamen and rose water into the delicate warmth of osmanthus and tuberose.",
        notes: ["Lotus", "Freesia", "Cyclamen", "Rose Water", "Osmanthus", "Tuberose"],
        image: "/images/leau-dissey.png",
        categoryId: createdCats[2].id,
        gender: "female",
        concentration: "EDT"
      },
      {
        name: "Angel",
        brand: "Mugler",
        description: "A celestial indulgence — cotton candy and rich chocolate swirl with caramel and patchouli, leaving a heavenly trail of warm vanilla stardust.",
        notes: ["Cotton Candy", "Chocolate", "Caramel", "Patchouli", "Vanilla"],
        image: "/images/angel.png",
        categoryId: createdCats[3].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "Le Male",
        brand: "Jean Paul Gaultier",
        description: "A provocative blend of cool lavender and fresh mint warmed by vanilla, cinnamon, and tonka bean — seduction in its purest aromatic form.",
        notes: ["Lavender", "Mint", "Vanilla", "Cinnamon", "Tonka Bean", "Amber"],
        image: "/images/le-male.png",
        categoryId: createdCats[3].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Aqva Pour Homme",
        brand: "Bvlgari",
        description: "The spirit of the Mediterranean distilled — bright mandarin and oceanic seaweed glide into a warm embrace of amber and earthy patchouli.",
        notes: ["Mandarin", "Seaweed", "Amber", "Patchouli"],
        image: "/images/bvlgari-aqva.png",
        categoryId: createdCats[2].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Halfeti",
        brand: "Penhaligon's",
        description: "A midnight voyage along the Silk Road — saffron and rose intertwine with precious oud and leather, crowned by bergamot and anchored in sandalwood.",
        notes: ["Bergamot", "Grapefruit", "Saffron", "Rose", "Oud", "Leather", "Sandalwood"],
        image: "/images/penhaligons-halfeti.png",
        categoryId: createdCats[3].id,
        gender: "unisex",
        concentration: "EDP"
      },
      {
        name: "The One",
        brand: "Dolce & Gabbana",
        description: "Understated charisma in a bottle — warm grapefruit and aromatic basil settle into smoky cedar and labdanum, finished with a golden amber glow.",
        notes: ["Grapefruit", "Basil", "Cedar", "Labdanum", "Amber"],
        image: "/images/dg-the-one.png",
        categoryId: createdCats[3].id,
        gender: "male",
        concentration: "EDP"
      },
      {
        name: "Born in Roma",
        brand: "Valentino",
        description: "Modern Roman spirit — mineral sage and vibrant green ginger unfold over smoky vetiver and the enveloping softness of cashmeran.",
        notes: ["Mineral Sage", "Green Ginger", "Vetiver", "Cashmeran"],
        image: "/images/born-in-roma.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Sauvage",
        brand: "Dior",
        description: "Raw, noble, and magnetic — sparkling bergamot and fiery pepper ignite a heart of lavender and ambroxan, trailing into warm cedar and vanilla.",
        notes: ["Bergamot", "Pepper", "Lavender", "Ambroxan", "Cedar", "Vanilla"],
        image: "/images/dior-sauvage.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDP"
      },
      {
        name: "Jimmy Choo Man",
        brand: "Jimmy Choo",
        description: "A modern man's signature — aromatic lavender and honeydew melon meet pink pepper and patchouli, wrapped in a luxurious veil of suede.",
        notes: ["Lavender", "Honeydew Melon", "Pink Pepper", "Patchouli", "Suede"],
        image: "/images/jimmy-choo-man.png",
        categoryId: createdCats[2].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Versace Eros",
        brand: "Versace",
        description: "A bold declaration of masculine power — fresh mint and green apple ignite over a molten core of tonka bean, vanilla, and cedarwood.",
        notes: ["Mint", "Green Apple", "Tonka Bean", "Vanilla", "Cedarwood"],
        image: "/images/versace-eros.png",
        categoryId: createdCats[3].id,
        gender: "male",
        concentration: "EDP"
      },
      {
        name: "Bright Crystal",
        brand: "Versace",
        description: "A radiant jewel of frosted femininity — icy pomegranate and yuzu shimmer over magnolia petals, settling into a warm amber and mahogany embrace.",
        notes: ["Pomegranate", "Yuzu", "Magnolia", "Lotus", "Amber", "Mahogany"],
        image: "/images/versace-bright-crystal.png",
        categoryId: createdCats[2].id,
        gender: "female",
        concentration: "EDT"
      },
      {
        name: "Libre",
        brand: "Yves Saint Laurent",
        description: "A daring fusion of cool lavender and sun-drenched orange blossom, anchored by the sultry warmth of vanilla and musk — freedom bottled.",
        notes: ["Lavender", "Orange Blossom", "Vanilla", "Musk", "Cedar"],
        image: "/images/ysl-libre.png",
        categoryId: createdCats[3].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "La Nuit de L'Homme",
        brand: "Yves Saint Laurent",
        description: "A seductive nocturnal elixir — spicy cardamom and bergamot weave through lavender into a magnetic trail of cedar and coumarin.",
        notes: ["Cardamom", "Bergamot", "Lavender", "Cedar", "Coumarin"],
        image: "/images/ysl-la-nuit-de-lhomme.png",
        categoryId: createdCats[3].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "1 Million",
        brand: "Paco Rabanne",
        description: "Liquid gold extravagance — blood mandarin and peppermint collide with rose absolute, cinnamon, and a decadent leather-amber base.",
        notes: ["Blood Mandarin", "Peppermint", "Rose", "Cinnamon", "Leather", "Amber"],
        image: "/images/paco-rabanne-1-million.png",
        categoryId: createdCats[3].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Invictus",
        brand: "Paco Rabanne",
        description: "A champion's victory cry — electrifying grapefruit and marine accord surge through jasmine and guaiac wood, leaving a trail of ambergris glory.",
        notes: ["Grapefruit", "Marine Accord", "Jasmine", "Guaiac Wood", "Ambergris"],
        image: "/images/paco-rabanne-invictus.png",
        categoryId: createdCats[2].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Si",
        brand: "Giorgio Armani",
        description: "Irresistible elegance — luminous blackcurrant nectar and May rose bloom over a chypre base of patchouli, vanilla, and musky blond wood.",
        notes: ["Blackcurrant", "May Rose", "Patchouli", "Vanilla", "Blond Wood"],
        image: "/images/armani-si.png",
        categoryId: createdCats[0].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "Armani Code",
        brand: "Giorgio Armani",
        description: "Midnight sophistication — star anise and bergamot give way to an intoxicating heart of olive blossom, deepening into guaiac wood and tonka bean.",
        notes: ["Star Anise", "Bergamot", "Olive Blossom", "Guaiac Wood", "Tonka Bean"],
        image: "/images/armani-code.png",
        categoryId: createdCats[3].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "The Only One",
        brand: "Dolce & Gabbana",
        description: "A mesmerizing declaration of uniqueness — violet and coffee bean intertwine over a heart of red rose, anchored by warm patchouli and cedarwood.",
        notes: ["Violet", "Coffee", "Red Rose", "Patchouli", "Cedarwood"],
        image: "/images/dg-the-only-one.png",
        categoryId: createdCats[3].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "Polo Blue",
        brand: "Ralph Lauren",
        description: "An invigorating plunge into azure waters — crisp melon and cucumber glide through washed suede, basil, and a soft musk horizon.",
        notes: ["Melon", "Cucumber", "Basil", "Washed Suede", "Musk"],
        image: "/images/ralph-lauren-polo-blue.png",
        categoryId: createdCats[2].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Rose Goldea",
        brand: "Bvlgari",
        description: "A golden goddess draped in rose — damascena and musk intertwine with olibanum and sandalwood, creating a radiant aura of feminine opulence.",
        notes: ["Damascena Rose", "Musk", "Olibanum", "Sandalwood", "Pomegranate"],
        image: "/images/bvlgari-rose-goldea.png",
        categoryId: createdCats[0].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "Burberry London",
        brand: "Burberry",
        description: "A gentlemanly stroll through London in autumn — warm cinnamon and honeyed tobacco leaf over port wine, leather, and guaiac wood.",
        notes: ["Cinnamon", "Tobacco Leaf", "Port Wine", "Leather", "Guaiac Wood"],
        image: "/images/burberry-london.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Burberry Brit",
        brand: "Burberry",
        description: "A softly provocative blend — Italian lime and icy pear dissolve into almond milk and vanilla, wrapped in amber and mahogany warmth.",
        notes: ["Lime", "Pear", "Almond", "Vanilla", "Amber", "Mahogany"],
        image: "/images/burberry-brit.png",
        categoryId: createdCats[3].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "Coach Floral",
        brand: "Coach",
        description: "A sun-dappled garden in full bloom — delicate pineapple and pink pepper dance over tea rose and gardenia, resting on a creamy sandalwood base.",
        notes: ["Pineapple", "Pink Pepper", "Tea Rose", "Gardenia", "Sandalwood"],
        image: "/images/coach-floral.png",
        categoryId: createdCats[0].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "Coach For Men",
        brand: "Coach",
        description: "Effortless American cool — kumquat and green nashi pear cut through aromatic vetiver and suede, grounded in warm amberwood and musk.",
        notes: ["Kumquat", "Nashi Pear", "Vetiver", "Suede", "Amberwood"],
        image: "/images/coach-for-men.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Wanted",
        brand: "Azzaro",
        description: "An irresistible trail of warm ginger and lemon fuse with aromatic juniper, vetiver, and tonka bean — the most wanted man in the room.",
        notes: ["Ginger", "Lemon", "Juniper", "Vetiver", "Tonka Bean"],
        image: "/images/azzaro-wanted.png",
        categoryId: createdCats[2].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "The Most Wanted",
        brand: "Azzaro",
        description: "An amplified addictive intensity — fiery habanero chili and cardamom crash into Indonesian patchouli, woody cedar, and crystallized amber.",
        notes: ["Habanero", "Cardamom", "Patchouli", "Cedar", "Amber"],
        image: "/images/azzaro-the-most-wanted.png",
        categoryId: createdCats[3].id,
        gender: "male",
        concentration: "EDP"
      },
      {
        name: "Cool Water Woman",
        brand: "Davidoff",
        description: "A crystal-clear cascade of oceanic femininity — fresh quince and watermelon glide through lily and jasmine into a serene vetiver and sandalwood base.",
        notes: ["Quince", "Watermelon", "Lily", "Jasmine", "Vetiver", "Sandalwood"],
        image: "/images/davidoff-cool-water-woman.png",
        categoryId: createdCats[2].id,
        gender: "female",
        concentration: "EDT"
      },
      {
        name: "Red Door",
        brand: "Elizabeth Arden",
        description: "A timeless floral masterpiece — voluptuous red rose and wild violet open to a heart of jasmine and orchid, sealed with honey and sandalwood.",
        notes: ["Red Rose", "Wild Violet", "Jasmine", "Orchid", "Honey", "Sandalwood"],
        image: "/images/elizabeth-arden-red-door.png",
        categoryId: createdCats[0].id,
        gender: "female",
        concentration: "EDT"
      },
      {
        name: "Uomo",
        brand: "Salvatore Ferragamo",
        description: "Italian craftsmanship in scent — zesty bergamot and crisp pepper meet a woody heart of cypress and cashmere wood, finished with smoky tonka.",
        notes: ["Bergamot", "Pepper", "Cypress", "Cashmere Wood", "Tonka Bean"],
        image: "/images/ferragamo-uomo.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Shalimar",
        brand: "Guerlain",
        description: "The grande dame of oriental perfumery — luminous bergamot and iris cascade into a legendary trail of vanilla, opopanax, and benzoin.",
        notes: ["Bergamot", "Iris", "Vanilla", "Opopanax", "Benzoin"],
        image: "/images/guerlain-shalimar.png",
        categoryId: createdCats[3].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "L'Homme Ideal",
        brand: "Guerlain",
        description: "The ideal gentleman distilled — smoky almond and leather merge with Bulgarian rose and cherry over a refined cedar and sandalwood foundation.",
        notes: ["Almond", "Leather", "Bulgarian Rose", "Cherry", "Cedar", "Sandalwood"],
        image: "/images/guerlain-lhomme-ideal.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDP"
      },
      {
        name: "Classic Black",
        brand: "Jaguar",
        description: "Understated masculine allure — bright mandarin and apple meet a dark heart of cedar and bay leaf, grounded in sandalwood and musk.",
        notes: ["Mandarin", "Apple", "Cedar", "Bay Leaf", "Sandalwood", "Musk"],
        image: "/images/jaguar-classic-black.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Classic Red",
        brand: "Jaguar",
        description: "An energetic oriental drive — spicy pink pepper and saffron rev through tonka bean and vanilla, leaving a warm amber and patchouli trail.",
        notes: ["Pink Pepper", "Saffron", "Tonka Bean", "Vanilla", "Amber", "Patchouli"],
        image: "/images/jaguar-classic-red.png",
        categoryId: createdCats[3].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Mankind",
        brand: "Kenneth Cole",
        description: "A refined woody composition — fresh pineapple and ginger open to a warm heart of suede and cardamom, resting on oak moss and vetiver.",
        notes: ["Pineapple", "Ginger", "Suede", "Cardamom", "Oak Moss", "Vetiver"],
        image: "/images/kenneth-cole-mankind.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "L.12.12 Blanc",
        brand: "Lacoste",
        description: "Crisp white cotton brought to life — sparkling grapefruit and rosemary float over a clean heart of tuberose and cardamom, finishing in cedarwood.",
        notes: ["Grapefruit", "Rosemary", "Tuberose", "Cardamom", "Cedarwood"],
        image: "/images/lacoste-l1212-blanc.png",
        categoryId: createdCats[2].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Tresor",
        brand: "Lancome",
        description: "A legendary love letter in perfume — apricot blossom and rose absolute embrace a powdery iris heart, deepened by sandalwood, amber, and vanilla.",
        notes: ["Apricot Blossom", "Rose", "Iris", "Sandalwood", "Amber", "Vanilla"],
        image: "/images/lancome-tresor.png",
        categoryId: createdCats[3].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "Voyage",
        brand: "Nautica",
        description: "A bracing sail across open seas — cool green leaf and apple cut through a heart of mimosa and lotus, drying down to cedarwood, musk, and moss.",
        notes: ["Green Leaf", "Apple", "Mimosa", "Lotus", "Cedarwood", "Musk"],
        image: "/images/nautica-voyage.png",
        categoryId: createdCats[2].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Up or Down",
        brand: "Nike",
        description: "An energetic burst of citrus vitality — zesty lemon and bergamot rush through green tea and lavender, settling into a clean musk and cedarwood finish.",
        notes: ["Lemon", "Bergamot", "Green Tea", "Lavender", "Musk", "Cedarwood"],
        image: "/images/nike-up-or-down.png",
        categoryId: createdCats[2].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "To Be",
        brand: "Police",
        description: "Rebellious sophistication — aromatic coriander and black pepper clash with iris and lavender, melting into a warm embrace of tonka bean and patchouli.",
        notes: ["Coriander", "Black Pepper", "Iris", "Lavender", "Tonka Bean", "Patchouli"],
        image: "/images/police-to-be.png",
        categoryId: createdCats[3].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Hawas",
        brand: "Rasasi",
        description: "A Middle Eastern gem for modern adventurers — sparkling bergamot and apple cascade through ambergris and marine notes into a warm base of musk and cedar.",
        notes: ["Bergamot", "Apple", "Ambergris", "Marine Notes", "Musk", "Cedar"],
        image: "/images/rasasi-hawas.png",
        categoryId: createdCats[2].id,
        gender: "male",
        concentration: "EDP"
      },
      {
        name: "La Yuqawam",
        brand: "Rasasi",
        description: "A rich Arabian oud masterpiece — smoky incense and saffron entwine with Turkish rose and oud, grounded in a deep leather and patchouli base.",
        notes: ["Incense", "Saffron", "Turkish Rose", "Oud", "Leather", "Patchouli"],
        image: "/images/rasasi-la-yuqawam.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDP"
      },
      {
        name: "United Dreams",
        brand: "United Colors of Benetton",
        description: "A dreamy pastel bouquet — soft peach and wild rose float over gardenia and jasmine, finished with a delicate veil of sandalwood and musk.",
        notes: ["Peach", "Wild Rose", "Gardenia", "Jasmine", "Sandalwood", "Musk"],
        image: "/images/benetton-united-dreams.png",
        categoryId: createdCats[0].id,
        gender: "female",
        concentration: "EDT"
      },
      {
        name: "Evoke",
        brand: "Ajmal",
        description: "A commanding masculine presence — crisp bergamot and pink pepper give way to a regal heart of iris and cedar, settling into a warm amber and leather base.",
        notes: ["Bergamot", "Pink Pepper", "Iris", "Cedar", "Amber", "Leather"],
        image: "/images/ajmal-evoke.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDP"
      },
      {
        name: "Sacrifice",
        brand: "Ajmal",
        description: "An offering of pure floral devotion — Bulgarian rose and ylang-ylang envelop a creamy jasmine heart, crowned with soft musk and a whisper of amber.",
        notes: ["Bulgarian Rose", "Ylang-Ylang", "Jasmine", "Musk", "Amber"],
        image: "/images/ajmal-sacrifice.png",
        categoryId: createdCats[0].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "Nargis",
        brand: "Forest Essentials",
        description: "An Ayurvedic floral treasure — rare Indian nargis and tuberose bloom over jasmine sambac and rose attar, evoking moonlit temple gardens.",
        notes: ["Nargis", "Tuberose", "Jasmine Sambac", "Rose Attar", "Sandalwood"],
        image: "/images/forest-essentials-nargis.png",
        categoryId: createdCats[0].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "Tommy Girl",
        brand: "Tommy Hilfiger",
        description: "A breezy American classic — juicy apple blossom and tangerine skip through camellia and violet, settling into a warm cedar and sandalwood trail.",
        notes: ["Apple Blossom", "Tangerine", "Camellia", "Violet", "Cedar", "Sandalwood"],
        image: "/images/tommy-hilfiger-tommy-girl.png",
        categoryId: createdCats[2].id,
        gender: "female",
        concentration: "EDT"
      },
      {
        name: "Tommy",
        brand: "Tommy Hilfiger",
        description: "A preppy burst of fresh confidence — bright lavender and green apple blend with cranberry and mint, anchored by clean cotton and musk.",
        notes: ["Lavender", "Green Apple", "Cranberry", "Mint", "Cotton", "Musk"],
        image: "/images/tommy-hilfiger-tommy.png",
        categoryId: createdCats[2].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Desire Blue",
        brand: "Dunhill",
        description: "A suave rush of oceanic cool — bergamot and blue cypress cascade over tonka bean and musk, capturing the sleek energy of a coastal drive.",
        notes: ["Bergamot", "Blue Cypress", "Tonka Bean", "Musk", "Amber"],
        image: "/images/dunhill-desire-blue.png",
        categoryId: createdCats[2].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Icon",
        brand: "Dunhill",
        description: "A distinguished icon of modern luxury — Italian bergamot and neroli fuse with lavender and cardamom over a refined base of agarwood, vetiver, and black pepper.",
        notes: ["Bergamot", "Neroli", "Lavender", "Cardamom", "Agarwood", "Vetiver"],
        image: "/images/dunhill-icon.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDP"
      },
      {
        name: "Stronger With You",
        brand: "Emporio Armani",
        description: "A warm, addictive embrace — spicy pink pepper and violet leaves meet a gourmand heart of chestnut and vanilla, wrapped in suede and amber.",
        notes: ["Pink Pepper", "Violet Leaves", "Chestnut", "Vanilla", "Suede", "Amber"],
        image: "/images/emporio-armani-stronger-with-you.png",
        categoryId: createdCats[3].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Legend",
        brand: "Mont Blanc",
        description: "A modern legend written in wood — aromatic lavender and pineapple leaf open into a heart of coumarin, rose, and apple, resting on warm sandalwood and tonka.",
        notes: ["Lavender", "Pineapple Leaf", "Coumarin", "Rose", "Sandalwood", "Tonka Bean"],
        image: "/images/mont-blanc-legend.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "CK One",
        brand: "Calvin Klein",
        description: "The original shared fragrance revolution — sparkling bergamot and cardamom blend with jasmine, violet, and green tea into a clean, universal musk finish.",
        notes: ["Bergamot", "Cardamom", "Jasmine", "Violet", "Green Tea", "Musk"],
        image: "/images/ck-one.png",
        categoryId: createdCats[2].id,
        gender: "unisex",
        concentration: "EDT"
      },
      {
        name: "Obsession",
        brand: "Calvin Klein",
        description: "A brooding oriental obsession — mandarin and bergamot plunge into spicy coriander and myrrh, deepening through amber, musk, and a velvety vanilla trail.",
        notes: ["Mandarin", "Bergamot", "Coriander", "Myrrh", "Amber", "Vanilla"],
        image: "/images/ck-obsession.png",
        categoryId: createdCats[3].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Seductive",
        brand: "Guess",
        description: "A shimmering temptation — dewy pear and cassia intertwine with night-blooming jasmine and orris root, trailing a velvet mist of vanilla and musk.",
        notes: ["Pear", "Cassia", "Jasmine", "Orris Root", "Vanilla", "Musk"],
        image: "/images/guess-seductive.png",
        categoryId: createdCats[3].id,
        gender: "female",
        concentration: "EDT"
      },
      {
        name: "Be Delicious",
        brand: "DKNY",
        description: "A crisp bite of New York energy — juicy green apple and cucumber meet magnolia and rose, layered over a vibrant blend of amber and sandalwood.",
        notes: ["Green Apple", "Cucumber", "Magnolia", "Rose", "Amber", "Sandalwood"],
        image: "/images/dkny-be-delicious.png",
        categoryId: createdCats[2].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "212 VIP",
        brand: "Carolina Herrera",
        description: "The scent of exclusivity — iced passion fruit and king vodka blend with a magnetic heart of tonka bean, amber, and precious woods.",
        notes: ["Passion Fruit", "Vodka", "Tonka Bean", "Amber", "Precious Woods"],
        image: "/images/carolina-herrera-212-vip.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDP"
      },
      {
        name: "Pour Homme",
        brand: "Bottega Veneta",
        description: "Italian artisanal elegance — aromatic juniper and labdanum resin intertwine with patchouli and cedar, finished with the quiet warmth of leather and amber.",
        notes: ["Juniper", "Labdanum", "Patchouli", "Cedar", "Leather", "Amber"],
        image: "/images/bottega-veneta-pour-homme.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "L'Eau d'Issey Pour Homme",
        brand: "Issey Miyake",
        description: "A zen cascade of crystalline freshness — yuzu and bergamot flow through water lily and nutmeg into a meditative base of vetiver, musk, and cedarwood.",
        notes: ["Yuzu", "Bergamot", "Water Lily", "Nutmeg", "Vetiver", "Cedarwood"],
        image: "/images/issey-miyake-pour-homme.png",
        categoryId: createdCats[2].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Flower by Kenzo",
        brand: "Kenzo",
        description: "A single poppy standing tall in a concrete garden — powdery Bulgarian rose and violet embrace a warm base of white musk, vanilla, and hawthorn.",
        notes: ["Bulgarian Rose", "Violet", "White Musk", "Vanilla", "Hawthorn"],
        image: "/images/kenzo-flower.png",
        categoryId: createdCats[0].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "Roberto Cavalli Uomo",
        brand: "Roberto Cavalli",
        description: "Italian panache unleashed — spicy cinnamon and cardamom meet rich hazelnut and tonka bean, wrapped in an amber and cedarwood overcoat.",
        notes: ["Cinnamon", "Cardamom", "Hazelnut", "Tonka Bean", "Amber", "Cedarwood"],
        image: "/images/roberto-cavalli-uomo.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Toy Boy",
        brand: "Moschino",
        description: "A playful provocation — spicy pink pepper and clove ignite over a floral rose and magnolia heart, grounded in smooth cashmeran, sandalwood, and amber.",
        notes: ["Pink Pepper", "Clove", "Rose", "Magnolia", "Cashmeran", "Sandalwood"],
        image: "/images/moschino-toy-boy.png",
        categoryId: createdCats[3].id,
        gender: "male",
        concentration: "EDP"
      },
      {
        name: "Only The Brave",
        brand: "Diesel",
        description: "Raw courage forged in stone — sharp lemon and mandarin crash through violet leaf and coriander, anchored by a muscular base of cedar, amber, and leather.",
        notes: ["Lemon", "Mandarin", "Violet Leaf", "Coriander", "Cedar", "Amber"],
        image: "/images/diesel-only-the-brave.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Prada L'Homme",
        brand: "Prada",
        description: "Refined minimalism in fragrance — iris root and neroli meet a heart of amber, cedarwood, and patchouli, creating an effortlessly sophisticated signature.",
        notes: ["Iris", "Neroli", "Amber", "Cedarwood", "Patchouli"],
        image: "/images/prada-lhomme.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Gorgeous",
        brand: "Michael Kors",
        description: "A glamorous floral declaration — luminous white flowers and jasmine sambac envelop a heart of tuberose and smoky cashmeran, finished with creamy sandalwood.",
        notes: ["White Flowers", "Jasmine Sambac", "Tuberose", "Cashmeran", "Sandalwood"],
        image: "/images/michael-kors-gorgeous.png",
        categoryId: createdCats[0].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "Tiffany & Co EDP",
        brand: "Tiffany & Co",
        description: "A sparkling tribute to New York elegance — iris flower and green musks dance over a luminous base of patchouli, vetiver, and a sheer veil of peach skin.",
        notes: ["Iris", "Green Musks", "Patchouli", "Vetiver", "Peach Skin"],
        image: "/images/tiffany-co-edp.png",
        categoryId: createdCats[0].id,
        gender: "female",
        concentration: "EDP"
      },
      {
        name: "Gentleman Classic",
        brand: "Yardley London",
        description: "Timeless British gentility — crisp bergamot and apple accord meet lavender and geranium, settling into a warm base of cedar, tonka bean, and musk.",
        notes: ["Bergamot", "Apple", "Lavender", "Geranium", "Cedar", "Tonka Bean"],
        image: "/images/yardley-gentleman-classic.png",
        categoryId: createdCats[1].id,
        gender: "male",
        concentration: "EDT"
      },
      {
        name: "Scent Xtremo",
        brand: "Fogg",
        description: "An adrenaline-charged freshness — vibrant citrus and aquatic notes burst through a cool lavender and mint heart, finishing in a clean woody musk trail.",
        notes: ["Citrus", "Aquatic Notes", "Lavender", "Mint", "Woody Musk"],
        image: "/images/fogg-scent-xtremo.png",
        categoryId: createdCats[2].id,
        gender: "male",
        concentration: "EDP"
      },
    ];

    const priceMap: Record<string, { nykaa: string; tatacliq: string; myntra: string }> = {
      "Chanel No. 5": { nykaa: "10499.00", tatacliq: "10899.00", myntra: "10699.00" },
      "Santal 33": { nykaa: "16299.00", tatacliq: "16499.00", myntra: "16399.00" },
      "Acqua di Gio": { nykaa: "7699.00", tatacliq: "7999.00", myntra: "7849.00" },
      "Black Orchid": { nykaa: "12599.00", tatacliq: "12999.00", myntra: "12799.00" },
      "Miss Dior Blooming Bouquet": { nykaa: "9199.00", tatacliq: "9599.00", myntra: "9399.00" },
      "Bleu de Chanel": { nykaa: "12999.00", tatacliq: "13299.00", myntra: "13099.00" },
      "Light Blue": { nykaa: "7999.00", tatacliq: "8299.00", myntra: "8099.00" },
      "Spicebomb": { nykaa: "8299.00", tatacliq: "8599.00", myntra: "8399.00" },
      "La Vie Est Belle": { nykaa: "11299.00", tatacliq: "11699.00", myntra: "11499.00" },
      "Oud Wood": { nykaa: "24299.00", tatacliq: "24499.00", myntra: "24399.00" },
      "Versace Pour Homme": { nykaa: "7099.00", tatacliq: "7399.00", myntra: "7199.00" },
      "Opium": { nykaa: "9999.00", tatacliq: "10399.00", myntra: "10199.00" },
      "English Pear & Freesia": { nykaa: "11500.00", tatacliq: "11800.00", myntra: "11600.00" },
      "Wood Sage & Sea Salt": { nykaa: "11500.00", tatacliq: "11800.00", myntra: "11600.00" },
      "Gucci Bloom": { nykaa: "8999.00", tatacliq: "9299.00", myntra: "9099.00" },
      "Gucci Guilty": { nykaa: "8499.00", tatacliq: "8799.00", myntra: "8599.00" },
      "Luna Rossa": { nykaa: "7999.00", tatacliq: "8299.00", myntra: "8099.00" },
      "Prada Candy": { nykaa: "8699.00", tatacliq: "8999.00", myntra: "8799.00" },
      "Burberry Her": { nykaa: "7499.00", tatacliq: "7799.00", myntra: "7599.00" },
      "Man In Black": { nykaa: "7199.00", tatacliq: "7499.00", myntra: "7299.00" },
      "Omnia Crystalline": { nykaa: "6499.00", tatacliq: "6799.00", myntra: "6599.00" },
      "Aventus": { nykaa: "32999.00", tatacliq: "33499.00", myntra: "33199.00" },
      "Terre d'Hermes": { nykaa: "9699.00", tatacliq: "9999.00", myntra: "9799.00" },
      "Good Girl": { nykaa: "9199.00", tatacliq: "9499.00", myntra: "9299.00" },
      "Daisy": { nykaa: "6999.00", tatacliq: "7299.00", myntra: "7099.00" },
      "By the Fireplace": { nykaa: "12499.00", tatacliq: "12799.00", myntra: "12599.00" },
      "Cool Water": { nykaa: "3299.00", tatacliq: "3499.00", myntra: "3399.00" },
      "Happy": { nykaa: "4299.00", tatacliq: "4499.00", myntra: "4399.00" },
      "Boss Bottled": { nykaa: "5499.00", tatacliq: "5799.00", myntra: "5599.00" },
      "Eternity": { nykaa: "5999.00", tatacliq: "6299.00", myntra: "6099.00" },
      "Gentleman": { nykaa: "7699.00", tatacliq: "7999.00", myntra: "7799.00" },
      "For Her": { nykaa: "8499.00", tatacliq: "8799.00", myntra: "8599.00" },
      "Explorer": { nykaa: "4999.00", tatacliq: "5299.00", myntra: "5099.00" },
      "L'Eau d'Issey": { nykaa: "6299.00", tatacliq: "6599.00", myntra: "6399.00" },
      "Angel": { nykaa: "8999.00", tatacliq: "9299.00", myntra: "9099.00" },
      "Le Male": { nykaa: "6999.00", tatacliq: "7299.00", myntra: "7099.00" },
      "Aqva Pour Homme": { nykaa: "6199.00", tatacliq: "6499.00", myntra: "6299.00" },
      "Halfeti": { nykaa: "22999.00", tatacliq: "23499.00", myntra: "23099.00" },
      "The One": { nykaa: "7499.00", tatacliq: "7799.00", myntra: "7599.00" },
      "Born in Roma": { nykaa: "8299.00", tatacliq: "8599.00", myntra: "8399.00" },
      "Sauvage": { nykaa: "9999.00", tatacliq: "10299.00", myntra: "10099.00" },
      "Jimmy Choo Man": { nykaa: "4799.00", tatacliq: "4999.00", myntra: "4899.00" },
      "Versace Eros": { nykaa: "7999.00", tatacliq: "8299.00", myntra: "8099.00" },
      "Bright Crystal": { nykaa: "6999.00", tatacliq: "7299.00", myntra: "7099.00" },
      "Libre": { nykaa: "9799.00", tatacliq: "10099.00", myntra: "9899.00" },
      "La Nuit de L'Homme": { nykaa: "8499.00", tatacliq: "8799.00", myntra: "8599.00" },
      "1 Million": { nykaa: "7499.00", tatacliq: "7799.00", myntra: "7599.00" },
      "Invictus": { nykaa: "6999.00", tatacliq: "7299.00", myntra: "7099.00" },
      "Si": { nykaa: "8999.00", tatacliq: "9299.00", myntra: "9099.00" },
      "Armani Code": { nykaa: "7699.00", tatacliq: "7999.00", myntra: "7799.00" },
      "The Only One": { nykaa: "7999.00", tatacliq: "8299.00", myntra: "8099.00" },
      "Polo Blue": { nykaa: "6499.00", tatacliq: "6799.00", myntra: "6599.00" },
      "Rose Goldea": { nykaa: "7499.00", tatacliq: "7799.00", myntra: "7599.00" },
      "Burberry London": { nykaa: "4999.00", tatacliq: "5299.00", myntra: "5099.00" },
      "Burberry Brit": { nykaa: "5499.00", tatacliq: "5799.00", myntra: "5599.00" },
      "Coach Floral": { nykaa: "5999.00", tatacliq: "6299.00", myntra: "6099.00" },
      "Coach For Men": { nykaa: "5499.00", tatacliq: "5799.00", myntra: "5599.00" },
      "Wanted": { nykaa: "4999.00", tatacliq: "5299.00", myntra: "5099.00" },
      "The Most Wanted": { nykaa: "5999.00", tatacliq: "6299.00", myntra: "6099.00" },
      "Cool Water Woman": { nykaa: "3499.00", tatacliq: "3699.00", myntra: "3599.00" },
      "Red Door": { nykaa: "4799.00", tatacliq: "4999.00", myntra: "4899.00" },
      "Uomo": { nykaa: "5299.00", tatacliq: "5499.00", myntra: "5399.00" },
      "Shalimar": { nykaa: "9499.00", tatacliq: "9799.00", myntra: "9599.00" },
      "L'Homme Ideal": { nykaa: "7999.00", tatacliq: "8299.00", myntra: "8099.00" },
      "Classic Black": { nykaa: "1999.00", tatacliq: "2199.00", myntra: "2099.00" },
      "Classic Red": { nykaa: "1999.00", tatacliq: "2199.00", myntra: "2099.00" },
      "Mankind": { nykaa: "3999.00", tatacliq: "4199.00", myntra: "4099.00" },
      "L.12.12 Blanc": { nykaa: "4299.00", tatacliq: "4499.00", myntra: "4399.00" },
      "Tresor": { nykaa: "8999.00", tatacliq: "9299.00", myntra: "9099.00" },
      "Voyage": { nykaa: "2499.00", tatacliq: "2699.00", myntra: "2599.00" },
      "Up or Down": { nykaa: "1299.00", tatacliq: "1499.00", myntra: "1399.00" },
      "To Be": { nykaa: "2999.00", tatacliq: "3199.00", myntra: "3099.00" },
      "Hawas": { nykaa: "4999.00", tatacliq: "5299.00", myntra: "5099.00" },
      "La Yuqawam": { nykaa: "5999.00", tatacliq: "6299.00", myntra: "6099.00" },
      "United Dreams": { nykaa: "1999.00", tatacliq: "2199.00", myntra: "2099.00" },
      "Evoke": { nykaa: "3499.00", tatacliq: "3699.00", myntra: "3599.00" },
      "Sacrifice": { nykaa: "2999.00", tatacliq: "3199.00", myntra: "3099.00" },
      "Nargis": { nykaa: "6499.00", tatacliq: "6799.00", myntra: "6599.00" },
      "Tommy Girl": { nykaa: "3999.00", tatacliq: "4199.00", myntra: "4099.00" },
      "Tommy": { nykaa: "3799.00", tatacliq: "3999.00", myntra: "3899.00" },
      "Desire Blue": { nykaa: "3499.00", tatacliq: "3699.00", myntra: "3599.00" },
      "Icon": { nykaa: "6499.00", tatacliq: "6799.00", myntra: "6599.00" },
      "Stronger With You": { nykaa: "6999.00", tatacliq: "7299.00", myntra: "7099.00" },
      "Legend": { nykaa: "4499.00", tatacliq: "4699.00", myntra: "4599.00" },
      "CK One": { nykaa: "3999.00", tatacliq: "4199.00", myntra: "4099.00" },
      "Obsession": { nykaa: "4499.00", tatacliq: "4699.00", myntra: "4599.00" },
      "Seductive": { nykaa: "3499.00", tatacliq: "3699.00", myntra: "3599.00" },
      "Be Delicious": { nykaa: "5499.00", tatacliq: "5799.00", myntra: "5599.00" },
      "212 VIP": { nykaa: "7999.00", tatacliq: "8299.00", myntra: "8099.00" },
      "Pour Homme": { nykaa: "8499.00", tatacliq: "8799.00", myntra: "8599.00" },
      "L'Eau d'Issey Pour Homme": { nykaa: "5999.00", tatacliq: "6299.00", myntra: "6099.00" },
      "Flower by Kenzo": { nykaa: "6499.00", tatacliq: "6799.00", myntra: "6599.00" },
      "Roberto Cavalli Uomo": { nykaa: "4999.00", tatacliq: "5299.00", myntra: "5099.00" },
      "Toy Boy": { nykaa: "5499.00", tatacliq: "5799.00", myntra: "5599.00" },
      "Only The Brave": { nykaa: "4999.00", tatacliq: "5299.00", myntra: "5099.00" },
      "Prada L'Homme": { nykaa: "8999.00", tatacliq: "9299.00", myntra: "9099.00" },
      "Gorgeous": { nykaa: "7499.00", tatacliq: "7799.00", myntra: "7599.00" },
      "Tiffany & Co EDP": { nykaa: "9999.00", tatacliq: "10299.00", myntra: "10099.00" },
      "Gentleman Classic": { nykaa: "1499.00", tatacliq: "1699.00", myntra: "1599.00" },
      "Scent Xtremo": { nykaa: "1299.00", tatacliq: "1499.00", myntra: "1399.00" },
    };

    for (const p of products) {
      const created = await storage.createProduct(p as any);
      const pricing = priceMap[p.name] || { nykaa: "8499.00", tatacliq: "8799.00", myntra: "8599.00" };
      const searchTerm = encodeURIComponent(`${p.name} ${p.brand}`);
      const slugTerm = `${p.name}-${p.brand}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      await storage.createPrice({
        productId: created.id,
        vendor: "Nykaa",
        url: `https://www.nykaa.com/search/result/?q=${searchTerm}`,
        price: pricing.nykaa,
        currency: "INR"
      } as any);
      await storage.createPrice({
        productId: created.id,
        vendor: "Tata CLiQ Luxury",
        url: `https://luxury.tatacliq.com/search/?searchCategory=all&text=${searchTerm}`,
        price: pricing.tatacliq,
        currency: "INR"
      } as any);
      await storage.createPrice({
        productId: created.id,
        vendor: "Myntra",
        url: `https://www.myntra.com/${slugTerm}`,
        price: pricing.myntra,
        currency: "INR"
      } as any);
    }
    
    console.log("Database seeded!");
  }
}
