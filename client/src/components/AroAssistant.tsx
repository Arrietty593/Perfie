import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, X, Loader2, ExternalLink } from "lucide-react";
import { useProductRecommendations } from "@/hooks/use-products";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface Recommendation {
  productId: number;
  name: string;
  brand: string;
  reason: string;
  image?: string | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  recommendations?: Recommendation[];
}

export function AroAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hello! I'm Aro. Tell me what kind of scents you love, or a mood you're in, and I'll find your perfect fragrance match." }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { mutate: getRecommendations, isPending } = useProductRecommendations();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput("");

    getRecommendations(userMessage, {
      onSuccess: (data) => {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.intro || "Here are some fragrances you might enjoy:",
            recommendations: data.recommendations || [],
          }
        ]);
      },
      onError: () => {
        setMessages(prev => [...prev, { role: 'assistant', content: "I'm having a bit of trouble connecting to my scent library right now. Please try again." }]);
      }
    });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-24 right-4 md:right-8 w-[90vw] md:w-[450px] h-[600px] max-h-[80vh] bg-background border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-border bg-primary/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg">Aro Assistant</h3>
                  <p className="text-xs text-muted-foreground">AI Scent Guide</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-muted rounded-full" data-testid="button-aro-close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
              {messages.map((msg, idx) => (
                <div key={idx} className={cn("flex w-full flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user'
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-card border border-border shadow-sm rounded-bl-none"
                  )}>
                    {msg.content}
                  </div>

                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="w-full mt-3 space-y-2">
                      {msg.recommendations.map((rec) => (
                        <Link
                          key={rec.productId}
                          href={`/products/${rec.productId}`}
                          onClick={() => setIsOpen(false)}
                          data-testid={`link-aro-product-${rec.productId}`}
                        >
                          <div className="flex items-start gap-3 p-3 bg-card border border-border rounded-xl hover-elevate transition-all cursor-pointer group">
                            {rec.image && (
                              <img
                                src={rec.image}
                                alt={rec.name}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-serif font-semibold text-sm truncate">{rec.name}</span>
                                <ExternalLink className="w-3 h-3 text-primary flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <span className="text-xs text-muted-foreground">{rec.brand}</span>
                              <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">{rec.reason}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isPending && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border p-4 rounded-2xl rounded-bl-none shadow-sm flex gap-2 items-center">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Analysing scent notes...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-background">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe a mood, ingredient, or memory..."
                  data-testid="input-aro-chat"
                  className="w-full pl-4 pr-12 py-3 rounded-xl border border-border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isPending}
                  data-testid="button-aro-send"
                  className="absolute right-2 top-2 p-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Aro Assistant"
        data-testid="button-aro-toggle"
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 flex items-center justify-center z-40 hover:shadow-xl hover:shadow-primary/40 transition-all"
      >
        <Sparkles className="w-7 h-7" />
      </motion.button>
    </>
  );
}
