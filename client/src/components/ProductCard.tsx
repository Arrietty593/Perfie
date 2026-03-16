import { Product } from "@shared/schema";
import { Link } from "wouter";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useToggleWishlist, useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { mutate: toggle, isPending } = useToggleWishlist();
  const { data: wishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const isWishlisted = wishlist?.some((item) => item.productId === product.id);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to details
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to your wishlist",
        variant: "destructive",
      });
      return;
    }

    toggle(product.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/5 border border-border/50 transition-all duration-300"
    >
      <Link href={`/products/${product.id}`} data-testid={`link-product-${product.id}`}>
        <div className="aspect-[3/4] overflow-hidden bg-muted/30 relative">
          <img
            src={product.image || "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1000&auto=format&fit=crop"}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <button
            onClick={handleWishlist}
            disabled={isPending}
            data-testid={`button-wishlist-${product.id}`}
            className={cn(
              "absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md transition-all duration-300",
              isWishlisted 
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30" 
                : "bg-card/80 text-muted-foreground hover:bg-card hover:text-red-500"
            )}
          >
            <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
          </button>
        </div>

        <div className="p-5">
          <p className="text-xs font-bold tracking-widest text-primary uppercase mb-2">
            {product.brand}
          </p>
          <h3 className="font-serif text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
