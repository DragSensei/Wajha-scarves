import { Link } from 'react-router-dom';
import { Compass, Sparkles, BookOpen } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24 md:py-32">
      {/* Editorial Header */}
      <div className="text-center mb-20">
        <span className="text-[10px] font-sans tracking-[0.25em] text-primary uppercase font-bold block mb-3">
          Our Heritage
        </span>
        <h1 className="text-4xl md:text-5xl font-serif text-primary uppercase font-bold tracking-widest mb-6">
          The Story of Diya
        </h1>
        <div className="w-16 h-[1px] bg-primary mx-auto mb-8" />
        <p className="text-sm font-sans tracking-widest text-outline uppercase max-w-lg mx-auto">
          Draped in Light, Woven with Spiritual Calm
        </p>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 mb-20 items-center">
        <div>
          <h2 className="text-xl font-serif text-on-background font-medium mb-6 leading-relaxed">
            Inspired by Surah An-Nur
          </h2>
          <p className="text-sm font-sans text-outline leading-relaxed mb-4 text-justify">
            Diya (Arabic for "luminous light") was founded on a vision to create garments that do not merely cover, but illuminate. We draw deep inspiration from the spiritual essence of <span className="font-serif italic text-primary">Surah An-Nur</span>—the Chapter of Light—celebrating the beauty of modesty as a reflective, pure radiance.
          </p>
          <p className="text-sm font-sans text-outline leading-relaxed text-justify">
            Our scarves are conceived as vessels of peace and dignity. We choose materials that interact softly with natural light, offering each wearer a tangible touch of grace, tranquility, and aesthetic harmony.
          </p>
        </div>

        <div className="aspect-4/5 bg-surface-container/30 border border-surface-container/60 p-8 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl transition-all duration-700 group-hover:scale-150" />
          
          <Compass className="w-10 h-10 text-primary mb-6" />
          
          <div className="space-y-4">
            <blockquote className="text-sm font-serif italic text-primary leading-relaxed">
              "Allah is the Light of the heavens and the earth..."
            </blockquote>
            <cite className="block text-[10px] font-sans tracking-wider uppercase text-outline not-italic">
              — Surah An-Nur, Verse 35
            </cite>
          </div>
        </div>
      </div>

      {/* Philosophy Section */}
      <div className="border-t border-surface-container/60 pt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4 text-center p-6 bg-surface-container/10 border border-surface-container/20 rounded-xs">
            <div className="flex justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-sm font-serif font-semibold text-on-background uppercase tracking-wider">
              Organic Splendor
            </h3>
            <p className="text-xs text-outline leading-relaxed font-sans">
              Crafted from premium organic silks and soft double-loop chiffons that breathe naturally.
            </p>
          </div>

          <div className="space-y-4 text-center p-6 bg-surface-container/10 border border-surface-container/20 rounded-xs">
            <div className="flex justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-sm font-serif font-semibold text-on-background uppercase tracking-wider">
              Modest Precision
            </h3>
            <p className="text-xs text-outline leading-relaxed font-sans">
              Thoughtfully measured drapes designed for elegance, simplicity, and ease of wear.
            </p>
          </div>

          <div className="space-y-4 text-center p-6 bg-surface-container/10 border border-surface-container/20 rounded-xs">
            <div className="flex justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-sm font-serif font-semibold text-on-background uppercase tracking-wider">
              Serene Palette
            </h3>
            <p className="text-xs text-outline leading-relaxed font-sans">
              Colors inspired by natural skies, desert sands, and morning light.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mt-20">
        <Link 
          to="/"
          className="inline-block bg-primary hover:bg-primary-container text-white text-xs font-sans tracking-widest uppercase px-8 py-4 transition-colors font-medium"
        >
          Explore the Luminous Collection
        </Link>
      </div>
    </div>
  );
}
