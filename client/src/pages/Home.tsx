import { motion } from "framer-motion";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { ArrowRight, Star, Sparkles, Shield, Wand2, Music, Heart, Sun, Moon } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMoodMixes } from "@/hooks/use-mood-mix";

const moodIcons = [Star, Sparkles, Shield, Wand2, Music, Heart, Sun, Moon];

export default function Home() {
  const { data: featuredProducts } = useProducts();
  const { user } = useAuth();
  const { data: userMixes } = useMoodMixes();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=2000&auto=format&fit=crop" 
            alt="Luxury Abstract" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="relative z-10 text-center max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <p className="text-amber-300/80 uppercase tracking-[0.3em] text-sm font-medium mb-6" data-testid="text-hero-label">
              Luxury Fragrance Discovery
            </p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
              Discover Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400">
                Signature Scent
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
              Explore a curated world of luxury fragrances. Let our AI assistant Aro guide you to the perfect olfactory experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/explore">
                <Button 
                  variant="default" 
                  className="bg-gradient-to-r from-amber-500 to-yellow-600 border-amber-400 text-white rounded-full shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-amber-400/40 hover:brightness-110 hover:scale-105"
                  size="lg"
                  data-testid="button-explore-collection"
                >
                  Explore Collection
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  const aroBtn = document.querySelector('[data-testid="button-aro-toggle"]') as HTMLElement;
                  if (aroBtn) aroBtn.click();
                }}
                className="border-amber-400/50 text-amber-100 backdrop-blur-sm rounded-full transition-all duration-300 hover:border-amber-300 hover:text-white hover:shadow-lg hover:shadow-amber-400/20 hover:scale-105"
                data-testid="button-ask-aro"
              >
                <Star className="w-4 h-4" />
                Ask Aro AI
              </Button>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10" />
      </section>

      {/* Why Perfie Section */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-primary font-bold tracking-widest uppercase text-sm mb-3">Why Perfie</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">The Art of Discovery</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Finding your perfect fragrance should be an experience, not a chore.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Wand2,
                title: "AI-Powered Matching",
                description: "Our AI assistant Aro learns your preferences and recommends scents tailored to your unique taste and lifestyle."
              },
              {
                icon: Sparkles,
                title: "MoodMix Collections",
                description: "Create curated scent collections for every occasion, from date nights to fresh morning routines."
              },
              {
                icon: Shield,
                title: "Verified Pricing",
                description: "Compare prices across trusted retailers to find the best deals on your favorite luxury fragrances."
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="text-center p-8"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-5">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured / Trending Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-between items-end gap-4 mb-12">
            <div>
              <p className="text-primary font-bold tracking-widest uppercase text-sm mb-2">Curated Selection</p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground">Trending Now</h2>
            </div>
            <Link href="/explore">
              <span className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer group" data-testid="link-view-all">
                View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts?.slice(0, 4).map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
            {!featuredProducts && (
              [1, 2, 3, 4].map(n => (
                <div key={n} className="space-y-4">
                  <div className="aspect-[3/4] bg-muted animate-pulse rounded-lg" />
                  <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                </div>
              ))
            )}
          </div>

          <div className="text-center mt-12 md:hidden">
            <Link href="/explore">
              <Button variant="outline" className="rounded-full" data-testid="button-view-all-mobile">
                View All Fragrances
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* MoodMix Promo */}
      <section className="py-24 bg-secondary text-secondary-foreground overflow-hidden relative">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-primary blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-primary blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <p className="text-primary font-bold tracking-widest uppercase text-sm mb-4">Personalized Collections</p>
            <h2 className="font-serif text-4xl md:text-6xl font-bold mb-6">
              Create Your <br/><span className="text-primary">MoodMix</span>
            </h2>
            <p className="text-secondary-foreground/60 text-lg mb-8 leading-relaxed">
              Curate collections of scents for every occasion, season, or feeling. Share your mood mixes with the world or keep them as your secret scent diary.
            </p>
            <Link href="/mood-mixes">
              <Button className="rounded-full px-8 py-6 text-base" data-testid="button-start-creating">
                Start Creating
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="relative hidden lg:block">
            {user ? (
              userMixes && userMixes.length > 0 ? (
                <div className="grid grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-6 translate-y-8"
                  >
                    {userMixes.filter((_, i) => i % 2 === 0).slice(0, 2).map((mix, idx) => {
                      const Icon = moodIcons[idx % moodIcons.length];
                      return (
                        <Link href={`/mood-mixes/${mix.id}`} key={mix.id} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                          <div className="bg-secondary-foreground/5 border border-secondary-foreground/10 rounded-lg p-5 hover-elevate cursor-pointer" data-testid={`card-home-mix-${mix.id}`}>
                            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mb-3">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <h4 className="font-serif font-bold text-secondary-foreground mb-1">{mix.name}</h4>
                            {mix.description && <p className="text-secondary-foreground/50 text-sm">{mix.description}</p>}
                          </div>
                        </Link>
                      );
                    })}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 }}
                    className="space-y-6"
                  >
                    {userMixes.filter((_, i) => i % 2 === 1).slice(0, 2).map((mix, idx) => {
                      const Icon = moodIcons[(idx + 2) % moodIcons.length];
                      return (
                        <Link href={`/mood-mixes/${mix.id}`} key={mix.id} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                          <div className="bg-secondary-foreground/5 border border-secondary-foreground/10 rounded-lg p-5 hover-elevate cursor-pointer" data-testid={`card-home-mix-${mix.id}`}>
                            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mb-3">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <h4 className="font-serif font-bold text-secondary-foreground mb-1">{mix.name}</h4>
                            {mix.description && <p className="text-secondary-foreground/50 text-sm">{mix.description}</p>}
                          </div>
                        </Link>
                      );
                    })}
                  </motion.div>
                </div>
              ) : !userMixes ? (
                <div className="grid grid-cols-2 gap-6">
                  {[0, 1, 2, 3].map(n => (
                    <div key={n} className="bg-secondary-foreground/5 border border-secondary-foreground/10 rounded-lg p-5 animate-pulse">
                      <div className="w-10 h-10 bg-secondary-foreground/10 rounded-full mb-3" />
                      <div className="h-5 w-24 bg-secondary-foreground/10 rounded mb-2" />
                      <div className="h-4 w-16 bg-secondary-foreground/10 rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-secondary-foreground/60 text-lg font-serif">No collections yet</p>
                    <p className="text-secondary-foreground/40 text-sm mt-1">Create your first MoodMix to see it here</p>
                  </div>
                </div>
              )
            ) : (
              <div className="grid grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6 translate-y-8"
                >
                  <div className="bg-secondary-foreground/5 border border-secondary-foreground/10 rounded-lg p-5">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mb-3">
                      <Star className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="font-serif font-bold text-secondary-foreground mb-1">Date Night</h4>
                    <p className="text-secondary-foreground/50 text-sm">3 fragrances</p>
                  </div>
                  <div className="bg-secondary-foreground/5 border border-secondary-foreground/10 rounded-lg p-5">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mb-3">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="font-serif font-bold text-secondary-foreground mb-1">Fresh Morning</h4>
                    <p className="text-secondary-foreground/50 text-sm">4 fragrances</p>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 }}
                  className="space-y-6"
                >
                  <div className="bg-secondary-foreground/5 border border-secondary-foreground/10 rounded-lg p-5">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mb-3">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="font-serif font-bold text-secondary-foreground mb-1">Office Ready</h4>
                    <p className="text-secondary-foreground/50 text-sm">5 fragrances</p>
                  </div>
                  <div className="bg-secondary-foreground/5 border border-secondary-foreground/10 rounded-lg p-5">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mb-3">
                      <Wand2 className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="font-serif font-bold text-secondary-foreground mb-1">Cozy Evening</h4>
                    <p className="text-secondary-foreground/50 text-sm">2 fragrances</p>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
