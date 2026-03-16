import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function Privacy() {
  const sections = [
    {
      title: "Information We Collect",
      content: [
        "When you create an account through our authentication partner, we collect your display name, email address, and profile picture to personalize your experience.",
        "We collect information about your interactions with the platform, including products you view, wishlisted items, and MoodMix collections you create. This data helps us improve our recommendations.",
        "Our AI assistant Aro processes your scent preferences to provide personalized fragrance suggestions. These preferences are not shared with third parties.",
      ],
    },
    {
      title: "How We Use Your Information",
      content: [
        "To provide and maintain our fragrance discovery service, including personalized AI recommendations through Aro.",
        "To manage your account, wishlists, and MoodMix collections across sessions.",
        "To display accurate pricing from our retail partners (Nykaa, Tata CLiQ Luxury, Myntra). We redirect you to these retailers for purchases — we do not process any transactions directly.",
        "To improve and optimize our platform based on usage patterns and feedback.",
      ],
    },
    {
      title: "Data Sharing & Third Parties",
      content: [
        "We do not sell your personal information to third parties.",
        "When you click on a retailer price link, you are redirected to that retailer's website. Their own privacy policy governs your experience on their platform.",
        "We use OpenAI's API to power Aro's fragrance recommendations. Conversation data sent to the AI is not used to train models and is handled in accordance with OpenAI's data usage policies.",
      ],
    },
    {
      title: "Data Security",
      content: [
        "We implement industry-standard security measures to protect your personal data, including encrypted connections and secure authentication.",
        "Your account credentials are managed through our authentication partner and are never stored in plain text on our servers.",
      ],
    },
    {
      title: "Your Rights",
      content: [
        "You can access, update, or delete your account data at any time by contacting us.",
        "You can remove individual items from your wishlist or delete MoodMix collections through the platform interface.",
        "You may request a complete copy of your data or ask for its deletion by reaching out to our support team.",
      ],
    },
    {
      title: "Contact Us",
      content: [
        "If you have questions about this privacy policy or how your data is handled, please reach out to us at hello@perfie.com.",
      ],
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
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="text-privacy-title">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-4">
            Your privacy matters to us. Here's how we handle your information.
          </p>
          <p className="text-muted-foreground text-sm mb-12">
            Last updated: February 2026
          </p>
        </motion.div>

        <div className="space-y-10">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
              data-testid={`section-privacy-${index}`}
            >
              <h2 className="font-serif text-xl font-semibold text-foreground mb-4">{section.title}</h2>
              <div className="space-y-3">
                {section.content.map((paragraph, pIndex) => (
                  <p key={pIndex} className="text-muted-foreground leading-relaxed text-sm">
                    {paragraph}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
