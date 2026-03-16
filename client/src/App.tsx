import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AroAssistant } from "@/components/AroAssistant";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import Explore from "@/pages/Explore";
import ProductDetails from "@/pages/ProductDetails";
import MoodMixes from "@/pages/MoodMixes";
import MoodMixDetail from "@/pages/MoodMixDetail";
import Wishlist from "@/pages/Wishlist";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Privacy from "@/pages/Privacy";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/explore" component={Explore} />
      <Route path="/products/:id" component={ProductDetails} />
      <Route path="/mood-mixes" component={MoodMixes} />
      <Route path="/mood-mixes/:id" component={MoodMixDetail} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy" component={Privacy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Navigation />
        <main>
          <Router />
        </main>
        <Footer />
        <AroAssistant />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
