import { Link } from "wouter";
import { Facebook } from "lucide-react";

export function Footer() {
  const quickLinks = [
    { label: "Home", href: "/" },
    { label: "Explore", href: "/explore" },
    { label: "MoodMix", href: "/mood-mixes" },
    { label: "Wishlist", href: "/wishlist" },
  ];

  const companyLinks = [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy", href: "/privacy" },
  ];

  const socialLinks = [
    { icon: Facebook, label: "Facebook", href: "#", testid: "link-facebook" },
  ];

  return (
    <footer className="bg-secondary text-secondary-foreground" data-testid="footer">
      {/* Main Footer Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand Column */}
          <div className="flex flex-col">
            <Link href="/" className="mb-4 inline-flex items-center gap-2 group w-fit">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-lg group-hover:scale-105 transition-transform duration-300">
                P
              </div>
              <span className="font-serif text-xl font-bold tracking-tight group-hover:text-primary transition-colors duration-300">
                Perfie
              </span>
            </Link>
            <p className="text-secondary-foreground/80 text-sm leading-relaxed">
              Discover fragrances that match your mood and elevate your senses with personalized fragrance journeys.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="flex flex-col sm:pl-16">
            <h3 className="font-serif text-lg font-semibold mb-4 text-secondary-foreground">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} data-testid={`link-footer-${link.label.toLowerCase()}`}>
                    <span className="text-secondary-foreground/80 text-sm hover:text-primary transition-colors duration-200">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div className="flex flex-col sm:pl-16">
            <h3 className="font-serif text-lg font-semibold mb-4 text-secondary-foreground">
              Company
            </h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} data-testid={`link-footer-${link.label.toLowerCase()}`}>
                    <span className="text-secondary-foreground/80 text-sm hover:text-primary transition-colors duration-200">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-primary/30 mx-4 sm:mx-6 lg:mx-8"></div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          {/* Copyright */}
          <p className="text-secondary-foreground/70 text-xs sm:text-sm">
            2026 Perfie. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  data-testid={social.testid}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-secondary-foreground/10 text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                  aria-label={social.label}
                >
                  <Icon className="w-4 h-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
