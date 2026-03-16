import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { Menu, X, Home, Search, Heart, Sparkles, User, LogIn, LogOut, ShoppingBag } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Search },
    { href: "/mood-mixes", label: "MoodMix", icon: Sparkles },
    { href: "/wishlist", label: "Wishlist", icon: Heart },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2" data-testid="link-home-logo">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-lg group-hover:scale-105 transition-transform duration-300">
              P
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors duration-300">
              Perfie
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} data-testid={`link-nav-${link.label.toLowerCase()}`}>
                <span className={cn(
                  "relative text-sm font-medium transition-colors hover:text-primary cursor-pointer py-2",
                  location === link.href ? "text-primary" : "text-muted-foreground"
                )}>
                  {link.label}
                  {location === link.href && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary"
                    />
                  )}
                </span>
              </Link>
            ))}
          </div>

          {/* Auth / Mobile Toggle */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-3 relative" ref={profileRef}>
                <span className="text-sm text-muted-foreground">
                  Hello, {user?.firstName || 'User'}
                </span>
                <button 
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                  onClick={() => setProfileOpen(!profileOpen)}
                  data-testid="button-profile-menu"
                >
                  {user?.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt="Profile" className="w-8 h-8 rounded-full" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium text-foreground">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <a
                      href="/api/logout"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-muted transition-colors w-full"
                      data-testid="button-sign-out"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <a 
                href="/api/login"
                className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                data-testid="button-sign-in"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </a>
            )}

            <button 
              className="md:hidden p-2 text-foreground"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div 
        initial={false}
        animate={isOpen ? "open" : "closed"}
        variants={{
          open: { height: "auto", opacity: 1 },
          closed: { height: 0, opacity: 0 }
        }}
        className="md:hidden overflow-hidden bg-background border-b border-border/40"
      >
        <div className="px-4 py-6 space-y-4">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => { setIsOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              <div className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-colors",
                location === link.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}>
                <link.icon className="w-5 h-5" />
                <span className="font-medium">{link.label}</span>
              </div>
            </Link>
          ))}
          {isAuthenticated ? (
            <a 
              href="/api/logout"
              className="flex items-center gap-3 p-3 rounded-xl text-destructive font-medium bg-destructive/5 hover:bg-destructive/10"
              data-testid="button-mobile-sign-out"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </a>
          ) : (
            <a 
              href="/api/login"
              className="flex items-center gap-3 p-3 rounded-xl text-primary font-medium bg-primary/5 hover:bg-primary/10"
            >
              <LogIn className="w-5 h-5" />
              Sign In to Perfie
            </a>
          )}
        </div>
      </motion.div>
    </nav>
  );
}
