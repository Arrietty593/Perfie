import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useMoodMix, useAddToMoodMix, useRemoveFromMoodMix, useMoodMixSuggestions, useUpdateMoodMix } from "@/hooks/use-mood-mix";
import { useProducts } from "@/hooks/use-products";
import { ArrowLeft, Plus, Trash2, Search, Sparkles, Wand2, Loader2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function MoodMixDetail() {
  const [, params] = useRoute("/mood-mixes/:id");
  const id = parseInt(params?.id || "0");
  const { data: mix, isLoading } = useMoodMix(id);
  const { mutate: addItem, isPending: isAdding } = useAddToMoodMix();
  const { mutate: removeItem } = useRemoveFromMoodMix();
  const { mutate: updateMix, isPending: isUpdating } = useUpdateMoodMix();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const { data: allProducts } = useProducts({ search: searchQuery });

  const currentItems = (mix as any)?.items || [];
  const { data: suggestionsData, isLoading: suggestionsLoading } = useMoodMixSuggestions(id, currentItems.length > 0);
  const suggestions = suggestionsData?.suggestions || [];

  const mixItemIds = new Set(currentItems.map((i: any) => i.product?.id || i.productId));
  const availableProducts = allProducts?.filter(p => !mixItemIds.has(p.id)) || [];

  const handleAdd = (productId: number) => {
    addItem({ id, productId }, {
      onSuccess: () => {
        setSearchQuery("");
      }
    });
  };

  const handleRemove = (productId: number) => {
    removeItem({ id, productId });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
          <div className="h-12 w-64 bg-muted animate-pulse rounded mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-48 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!mix) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-serif text-2xl font-bold mb-4 text-foreground">Collection not found</h2>
          <Link href="/mood-mixes">
            <Button variant="outline" data-testid="button-back-to-mixes">Back to MoodMixes</Button>
          </Link>
        </div>
      </div>
    );
  }

  const items = currentItems;

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/mood-mixes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6" data-testid="link-back-to-mixes">
          <ArrowLeft className="w-4 h-4" />
          Back to MoodMixes
        </Link>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div className="flex-1 min-w-0">
            <div className="h-1 w-16 bg-gradient-to-r from-primary to-primary/50 rounded mb-4" />
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full font-serif text-3xl md:text-4xl font-bold bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                  data-testid="input-edit-name"
                  autoFocus
                />
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Add a description..."
                  className="w-full text-lg bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-muted-foreground"
                  data-testid="input-edit-description"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!editName.trim()) return;
                      updateMix({ id, name: editName.trim(), description: editDescription.trim() }, {
                        onSuccess: () => setIsEditing(false),
                      });
                    }}
                    disabled={isUpdating || !editName.trim()}
                    data-testid="button-save-edit"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isUpdating}
                    data-testid="button-cancel-edit"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="group/header">
                <div className="flex items-start gap-3 flex-wrap">
                  <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-2" data-testid="text-mix-name">
                    {mix.name}
                  </h1>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="mt-2 opacity-0 group-hover/header:opacity-100 transition-opacity"
                    style={{ visibility: "visible" }}
                    onClick={() => {
                      setEditName(mix.name);
                      setEditDescription(mix.description || "");
                      setIsEditing(true);
                    }}
                    data-testid="button-edit-mix"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
                {mix.description && (
                  <p className="text-muted-foreground text-lg" data-testid="text-mix-description">{mix.description}</p>
                )}
              </div>
            )}
          </div>

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 min-h-9" data-testid="button-add-perfume">
                <Plus className="w-4 h-4" />
                Add Perfumes
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Add Perfumes</DialogTitle>
              </DialogHeader>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search perfumes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  data-testid="input-search-perfume"
                />
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                {availableProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchQuery ? "No matching perfumes found" : "All perfumes are already in this collection"}
                    </p>
                  </div>
                ) : (
                  availableProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 transition-colors"
                      data-testid={`add-product-row-${product.id}`}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover bg-muted"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.brand}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAdd(product.id)}
                        disabled={isAdding}
                        data-testid={`button-add-product-${product.id}`}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/40 mb-6">
              <Sparkles className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-serif text-2xl font-bold mb-3 text-foreground">No perfumes yet</h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
              Start building your collection by adding your favorite fragrances.
            </p>
            <Button onClick={() => setAddDialogOpen(true)} className="min-h-9" data-testid="button-add-first-perfume">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Perfume
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {items.map((item: any) => {
                const product = item.product;
                if (!product) return null;
                return (
                  <motion.div
                    key={item.id || product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group relative bg-card border border-border rounded-xl overflow-hidden"
                    data-testid={`mix-item-${product.id}`}
                  >
                    <Link href={`/products/${product.id}`}>
                      <div className="aspect-[3/4] overflow-hidden bg-muted">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link href={`/products/${product.id}`}>
                        <h3 className="font-serif font-bold text-foreground hover:text-primary transition-colors" data-testid={`text-item-name-${product.id}`}>
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground">{product.brand}</p>
                    </div>
                    <button
                      onClick={() => handleRemove(product.id)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`button-remove-item-${product.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-16" data-testid="section-ai-suggestions">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <Wand2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground">Aro Suggests</h2>
                <p className="text-sm text-muted-foreground">AI-curated perfumes that complement your collection</p>
              </div>
            </div>

            {suggestionsLoading ? (
              <div className="flex items-center gap-3 py-12 justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <p className="text-muted-foreground">Aro is analyzing your collection...</p>
              </div>
            ) : suggestions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No suggestions available right now.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {suggestions.map((suggestion) => (
                  <motion.div
                    key={suggestion.productId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group bg-card border border-dashed border-primary/30 rounded-xl overflow-hidden"
                    data-testid={`suggestion-card-${suggestion.productId}`}
                  >
                    <Link href={`/products/${suggestion.productId}`}>
                      <div className="aspect-square overflow-hidden bg-muted">
                        <img
                          src={suggestion.image}
                          alt={suggestion.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link href={`/products/${suggestion.productId}`}>
                        <h3 className="font-serif font-bold text-sm text-foreground hover:text-primary transition-colors" data-testid={`text-suggestion-name-${suggestion.productId}`}>
                          {suggestion.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-muted-foreground mb-2">{suggestion.brand}</p>
                      <p className="text-xs text-muted-foreground/80 italic mb-3 line-clamp-2">{suggestion.reason}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleAdd(suggestion.productId)}
                        disabled={isAdding}
                        data-testid={`button-add-suggestion-${suggestion.productId}`}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add to Collection
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
