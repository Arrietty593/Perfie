import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
      <div className="mb-8 p-6 bg-red-50 rounded-full">
        <AlertCircle className="h-16 w-16 text-red-500 opacity-80" />
      </div>
      <h1 className="font-serif text-5xl font-bold text-foreground mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">Page not found</p>
      <Link href="/">
        <button className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary/90 transition-all shadow-lg">
          Return Home
        </button>
      </Link>
    </div>
  );
}
