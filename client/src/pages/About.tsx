import { Link } from "wouter";
import { ArrowLeft, Sparkles, Heart, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function About() {
  const values = [
    {
      icon: Sparkles,
      title: "Curated Discovery",
      description: "Every fragrance in our collection is handpicked for its unique character, ensuring you discover scents that truly resonate with your personality.",
    },
    {
      icon: Heart,
      title: "Personal Expression",
      description: "We believe fragrance is an extension of who you are. Our AI-powered recommendations help you find scents that tell your story.",
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Join a community of fragrance enthusiasts who share their MoodMix collections, inspiring new olfactory journeys for everyone.",
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8" data-testid="link-back-home">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="h-1 w-16 bg-gradient-to-r from-primary to-primary/50 rounded mb-4" />
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="text-about-title">
            About Perfie
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-12">
            Where luxury meets technology in the art of fragrance discovery.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-6 mb-16"
        >
          <h2 className="font-serif text-2xl font-semibold text-foreground">Our Story</h2>
          <p className="text-muted-foreground leading-relaxed">
            Perfie was born from a simple observation: finding the perfect fragrance shouldn't feel overwhelming. With thousands of options available, many people struggle to discover scents that truly match their personality, mood, and lifestyle.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            We created Perfie to bridge that gap — a luxury fragrance discovery platform that combines curated collections with AI-powered recommendations. Our intelligent assistant, Aro, understands the nuances of scent profiles and helps guide you toward fragrances you'll love.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Whether you're a seasoned fragrance connoisseur or just beginning your olfactory journey, Perfie offers a refined experience with real pricing from trusted Indian retailers like Nykaa, Tata CLiQ Luxury, and Myntra.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-8">What We Stand For</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  className="p-6 rounded-md border border-border bg-card"
                  data-testid={`card-value-${index}`}
                >
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
