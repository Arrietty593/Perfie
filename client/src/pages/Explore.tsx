import { useState } from "react";
import { useProducts } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { ProductCard } from "@/components/ProductCard";
import { Search, Filter, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, string> = {
  floral: "F",
  woody: "W",
  fresh: "R",
  oriental: "O",
};

const GENDER_OPTIONS = [
  { value: "female", label: "For Her" },
  { value: "male", label: "For Him" },
  { value: "unisex", label: "Unisex" },
];

const PRICE_RANGES = [
  { label: "Under \u20b95,000", minPrice: undefined, maxPrice: "5000" },
  { label: "\u20b95,000 - \u20b910,000", minPrice: "5000", maxPrice: "10000" },
  { label: "\u20b910,000 - \u20b915,000", minPrice: "10000", maxPrice: "15000" },
  { label: "Above \u20b915,000", minPrice: "15000", maxPrice: undefined },
];

export default function Explore() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const priceFilter = selectedPriceRange !== null ? PRICE_RANGES[selectedPriceRange] : null;

  const { data: products, isLoading } = useProducts({ 
    search, 
    category: selectedCategory,
    gender: selectedGender,
    minPrice: priceFilter?.minPrice,
    maxPrice: priceFilter?.maxPrice,
  });
  const { data: categories } = useCategories();

  const hasActiveFilters = selectedCategory || selectedGender || selectedPriceRange !== null;

  const clearAllFilters = () => {
    setSelectedCategory("");
    setSelectedGender("");
    setSelectedPriceRange(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative Header Section */}
      <div className="relative pt-24 pb-16 px-4 bg-gradient-to-b from-muted/40 to-background overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium tracking-widest text-primary uppercase">Fragrance Discovery</span>
              </div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold mb-3 text-foreground">Explore Scents</h1>
              <p className="text-muted-foreground text-lg">Find the perfect fragrance from our curated collection.</p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search perfumes, brands, notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "p-2.5 rounded-xl border transition-colors",
                  showFilters ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50"
                )}
                data-testid="button-filter-toggle"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 bg-card/60 backdrop-blur-sm rounded-2xl border border-border space-y-6">
                  {/* Clear All */}
                  {hasActiveFilters && (
                    <div className="flex justify-end">
                      <button 
                        onClick={clearAllFilters}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                        data-testid="button-clear-all-filters"
                      >
                        Clear all filters <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Scent Family */}
                  <div>
                    <h3 className="font-semibold text-sm tracking-wider uppercase text-muted-foreground mb-3" data-testid="text-filter-category-heading">Scent Family</h3>
                    <div className="flex flex-wrap gap-3">
                      {categories?.map((cat) => {
                        const icon = CATEGORY_ICONS[cat.slug.toLowerCase()] || cat.name[0];
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.slug === selectedCategory ? "" : cat.slug)}
                            className={cn(
                              "px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 border",
                              selectedCategory === cat.slug
                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                : "bg-muted/50 border-border hover:border-primary/50 text-foreground hover:bg-muted"
                            )}
                            data-testid={`button-category-${cat.slug}`}
                          >
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                              selectedCategory === cat.slug
                                ? "bg-primary-foreground text-primary"
                                : "bg-primary/20 text-primary"
                            )}>
                              {icon}
                            </div>
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <h3 className="font-semibold text-sm tracking-wider uppercase text-muted-foreground mb-3" data-testid="text-filter-gender-heading">For</h3>
                    <div className="flex flex-wrap gap-3">
                      {GENDER_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setSelectedGender(selectedGender === opt.value ? "" : opt.value)}
                          className={cn(
                            "px-5 py-2.5 rounded-full text-sm font-medium transition-all border",
                            selectedGender === opt.value
                              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                              : "bg-muted/50 border-border hover:border-primary/50 text-foreground hover:bg-muted"
                          )}
                          data-testid={`button-gender-${opt.value}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <h3 className="font-semibold text-sm tracking-wider uppercase text-muted-foreground mb-3" data-testid="text-filter-price-heading">Price Range</h3>
                    <div className="flex flex-wrap gap-3">
                      {PRICE_RANGES.map((range, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedPriceRange(selectedPriceRange === idx ? null : idx)}
                          className={cn(
                            "px-5 py-2.5 rounded-full text-sm font-medium transition-all border",
                            selectedPriceRange === idx
                              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                              : "bg-muted/50 border-border hover:border-primary/50 text-foreground hover:bg-muted"
                          )}
                          data-testid={`button-price-${idx}`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Decorative Divider */}
      <div className="px-4">
        <div className="max-w-7xl mx-auto">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-8" />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Results Count */}
          {!isLoading && products && (
            <div className="mb-8 flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground" data-testid="text-results-count">
                Showing {products.length} {products.length === 1 ? "fragrance" : "fragrances"}
              </p>
              {hasActiveFilters && (
                <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                  <span>Filtered by:</span>
                  {selectedCategory && <span className="font-semibold text-foreground capitalize">{selectedCategory}</span>}
                  {selectedGender && <span className="font-semibold text-foreground">{GENDER_OPTIONS.find(g => g.value === selectedGender)?.label}</span>}
                  {selectedPriceRange !== null && <span className="font-semibold text-foreground">{PRICE_RANGES[selectedPriceRange].label}</span>}
                </div>
              )}
            </div>
          )}

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="space-y-4">
                  <div className="aspect-[3/4] bg-muted animate-pulse rounded-2xl" />
                  <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : products?.length === 0 ? (
            <div className="text-center py-24">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/40 mb-6">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-2xl font-bold mb-3 text-foreground">No fragrances found</h3>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                {search ? `We couldn't find any fragrances matching "${search}". Try adjusting your search or filters.` : "Try adjusting your search or filters to discover your next signature scent."}
              </p>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {products?.map((product) => (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
