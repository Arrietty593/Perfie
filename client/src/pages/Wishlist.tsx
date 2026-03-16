import { useWishlist, useToggleWishlist } from "@/hooks/use-wishlist";
import { useAuth } from "@/hooks/use-auth";
import { ProductCard } from "@/components/ProductCard";
import { Heart, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Wishlist() {
  const { user } = useAuth();
  const { data: wishlist, isLoading } = useWishlist();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center max-w-md"
        >
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-8">
            <Heart className="w-12 h-12 text-primary fill-primary" />
          </div>
          
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Your Scent Wishlist
          </h1>
          
          <p className="text-muted-foreground text-lg mb-8">
            Save your favorite fragrances and never lose track of the scents you love.
          </p>
          
          <a href="/api/login" data-testid="button-sign-in-wishlist">
            <Button className="rounded-full" size="lg">
              Sign In
            </Button>
          </a>
        </motion.div>
      </div>
    );
  }

  const itemCount = wishlist?.length || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="h-80 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-8">
            <Heart className="w-10 h-10 text-primary fill-primary" />
          </div>
          
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Your wishlist is waiting
          </h2>
          
          <p className="text-muted-foreground text-base mb-8">
            Browse our collection and tap the heart on any fragrance to save it here.
          </p>
          
          <Link href="/explore">
            <Button className="gap-2">
              Explore Fragrances
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-2">
            <Heart className="w-8 h-8 text-primary fill-primary" />
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground">
              Your Wishlist
            </h1>
          </div>
          <p className="text-muted-foreground text-lg ml-12">
            {itemCount} saved fragrance{itemCount !== 1 ? 's' : ''}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {wishlist.map((item) => {
            const product = (item as any).product;
            return product ? (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
}
