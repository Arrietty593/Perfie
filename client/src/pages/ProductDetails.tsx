import { useProduct } from "@/hooks/use-products";
import { useRoute } from "wouter";
import { Loader2, Heart, ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useToggleWishlist, useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetails() {
  const [, params] = useRoute("/products/:id");
  const id = params ? parseInt(params.id) : 0;
  
  const { data: product, isLoading } = useProduct(id);
  const { mutate: toggle, isPending: isToggling } = useToggleWishlist();
  const { data: wishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-serif">Product not found</h2>
        <Link href="/explore" className="text-primary hover:underline">Back to Explore</Link>
      </div>
    );
  }

  const isWishlisted = wishlist?.some(item => item.productId === product.id);

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Join Perfie to save your favorites!", variant: "destructive" });
      return;
    }
    toggle(product.id);
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <Link href="/explore" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors" data-testid="link-back-explore">
          <ArrowLeft className="w-4 h-4" /> Back to Explore
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image Side */}
          <div className="relative">
            <div className="aspect-[3/4] bg-card rounded-3xl overflow-hidden shadow-2xl relative">
              <img 
                src={product.image || "https://images.unsplash.com/photo-1594035910387-fea4779426e9?auto=format&fit=crop&q=80"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 ring-1 ring-black/5 rounded-3xl" />
            </div>
            {/* Concentration Tag */}
            <div className="absolute top-6 left-6 bg-card/90 backdrop-blur px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase shadow-lg" data-testid="text-concentration">
              {product.concentration || "Eau de Parfum"}
            </div>
          </div>

          {/* Details Side */}
          <div className="flex flex-col justify-center">
            <p className="text-primary font-bold tracking-[0.2em] uppercase mb-4">{product.brand}</p>
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              {product.name}
            </h1>
            
            <p className="text-lg text-muted-foreground leading-relaxed mb-10">
              {product.description}
            </p>

            {/* Notes Visualizer */}
            <div className="mb-12">
              <h3 className="font-serif text-xl font-semibold mb-4 border-b border-border pb-2">Olfactory Notes</h3>
              <div className="flex flex-wrap gap-3">
                {product.notes?.map((note, idx) => (
                  <span key={idx} className="px-4 py-2 bg-muted/50 rounded-lg text-sm font-medium border border-border/50">
                    {note}
                  </span>
                )) || <p className="text-muted-foreground italic">Notes not available</p>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button 
                onClick={handleWishlist}
                disabled={isToggling}
                data-testid="button-wishlist-toggle"
                className={cn(
                  "flex-1 py-4 px-8 rounded-xl font-semibold flex items-center justify-center gap-2 border transition-all duration-300",
                  isWishlisted 
                    ? "bg-red-50 dark:bg-red-950/30 text-red-600 border-red-200 dark:border-red-800" 
                    : "bg-card text-foreground border-border hover:border-red-200 hover:text-red-600"
                )}
              >
                <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
                {isWishlisted ? "Saved to Wishlist" : "Add to Wishlist"}
              </button>
            </div>

            {(product as any).prices && (product as any).prices.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-serif text-lg font-semibold mb-4">Available From</h3>
                <div className="space-y-3">
                  {(product as any).prices.map((price: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between gap-4 p-3 rounded-xl hover-elevate transition-colors" data-testid={`price-row-${idx}`}>
                      <span className="font-medium">{price.vendor}</span>
                      <div className="flex items-center gap-4">
                        <span className="font-bold">{price.currency === "INR" ? "₹" : "$"}{parseFloat(price.price).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                        <a 
                          href={price.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-primary hover:underline uppercase tracking-wider flex items-center gap-1"
                          data-testid={`link-buy-${idx}`}
                        >
                          Visit <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4 italic" data-testid="text-price-disclaimer">Prices are approximate and may vary. Visit the retailer for the latest pricing.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
