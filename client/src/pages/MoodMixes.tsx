import { useMoodMixes, useCreateMoodMix } from "@/hooks/use-mood-mix";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Sparkles, Lock, ArrowRight, Moon, Sun, Heart } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const PRESET_MOODS = [
  {
    id: "date-night",
    name: "Date Night",
    icon: Heart,
    description: "Sophisticated and alluring"
  },
  {
    id: "fresh-morning",
    name: "Fresh Morning",
    icon: Sun,
    description: "Bright and energizing"
  },
  {
    id: "cozy-evening",
    name: "Cozy Evening",
    icon: Moon,
    description: "Warm and comforting"
  }
];

export default function MoodMixes() {
  const { user } = useAuth();
  const { data: moodMixes, isLoading } = useMoodMixes();
  const { mutate: createMix, isPending } = useCreateMoodMix();
  const [isOpen, setIsOpen] = useState(false);
  const [newMixName, setNewMixName] = useState("");
  const [newMixDescription, setNewMixDescription] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMixName.trim()) return;
    createMix(
      { 
        name: newMixName, 
        description: newMixDescription || "My custom scent collection"
      }, 
      { 
        onSuccess: () => { 
          setIsOpen(false); 
          setNewMixName(""); 
          setNewMixDescription("");
        }
      }
    );
  };

  // Sign-in gate view
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        {/* Decorative icon area */}
        <div className="mb-12 relative">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
        </div>

        {/* Headline */}
        <h1 className="font-serif text-5xl font-bold mb-4 text-foreground max-w-2xl">
          Your Personal Scent Studio
        </h1>

        {/* Subtext */}
        <p className="text-muted-foreground text-lg mb-12 max-w-md">
          Curate collections of fragrances for every mood, season, and occasion. Sign in to create your first MoodMix.
        </p>

        {/* Preset mood suggestion cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-2xl w-full">
          {PRESET_MOODS.map((mood) => {
            const IconComponent = mood.icon;
            return (
              <motion.div
                key={mood.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card border border-border rounded-lg p-4 text-center"
              >
                <div className="flex justify-center mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <h3 className="font-serif font-semibold text-foreground mb-1">{mood.name}</h3>
                <p className="text-xs text-muted-foreground">{mood.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Sign in CTA button */}
        <a href="/api/login" data-testid="button-sign-in-moodmix">
          <Button className="rounded-full" size="lg">
            Sign In to Create Mixes
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-2 text-foreground">
              Your MoodMixes
            </h1>
            <p className="text-muted-foreground text-lg">
              Curated collections for every mood and moment.
            </p>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button 
                data-testid="button-new-mix" 
                className="flex items-center gap-2 min-h-9"
              >
                <Plus className="w-4 h-4" /> 
                <span>New Mix</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Create a New MoodMix</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-5 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Name</label>
                  <Input
                    placeholder="e.g. Summer Date Night"
                    value={newMixName}
                    onChange={(e) => setNewMixName(e.target.value)}
                    data-testid="input-mix-name"
                    className="border-border"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Description</label>
                  <Textarea
                    placeholder="Describe the mood, occasion, or vibe of this collection..."
                    value={newMixDescription}
                    onChange={(e) => setNewMixDescription(e.target.value)}
                    className="border-border resize-none min-h-24"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isPending}
                  data-testid="button-create-mix"
                  className="w-full min-h-9"
                >
                  {isPending ? "Creating..." : "Create Mix"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Main content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(n => (
              <div 
                key={n} 
                className="h-48 bg-muted/50 rounded-lg animate-pulse" 
              />
            ))}
          </div>
        ) : moodMixes?.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="w-16 h-16 text-primary/20 mx-auto mb-6" />
            <h3 className="font-serif text-2xl font-bold mb-2 text-foreground">
              No MoodMixes yet
            </h3>
            <p className="text-muted-foreground mb-10 max-w-md mx-auto">
              Need inspiration? Try creating one of these:
            </p>

            {/* Inspiration cards in empty state */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto">
              {PRESET_MOODS.map((mood) => {
                const IconComponent = mood.icon;
                return (
                  <motion.div
                    key={mood.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-lg p-4 text-center"
                  >
                    <div className="flex justify-center mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <h3 className="font-serif font-semibold text-foreground mb-1">{mood.name}</h3>
                    <p className="text-xs text-muted-foreground">{mood.description}</p>
                  </motion.div>
                );
              })}
            </div>

            <Button
              onClick={() => setIsOpen(true)}
              className="min-h-9"
            >
              Create your first mix
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {moodMixes?.map((mix) => (
              <Link key={mix.id} href={`/mood-mixes/${mix.id}`} data-testid={`link-mix-${mix.id}`}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col bg-card border border-border rounded-lg overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer h-full"
                >
                  <div 
                    className="h-1 bg-gradient-to-r from-primary via-primary to-primary/70"
                    role="presentation"
                  />
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="font-serif text-2xl font-bold mb-2 text-foreground">
                      {mix.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 flex-1">
                      {mix.description}
                    </p>
                    <div className="flex items-center text-sm font-semibold text-primary hover:gap-1 transition-all">
                      View Collection
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
