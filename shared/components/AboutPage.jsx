import { Link } from 'react-router-dom';
import { Sparkles, BookOpen, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 md:py-28">
      {/* Header */}
      <div className="text-center mb-16">
        <span className="text-[10px] font-sans tracking-[0.25em] text-primary uppercase font-bold block mb-3">
          Our Brand Story
        </span>
        <h1 className="text-4xl md:text-5xl font-serif text-primary uppercase font-bold tracking-widest mb-6">
          The Story of Diya
        </h1>
        <div className="w-16 h-[1px] bg-primary mx-auto mb-6" />
        <p className="text-sm font-sans tracking-widest text-outline uppercase max-w-lg mx-auto">
          Illuminating Modesty & Eternal Radiance
        </p>
      </div>

      {/* Main Story Narrative */}
      <div className="bg-surface-container/20 border border-surface-container/50 p-8 md:p-12 rounded-lg shadow-xs space-y-8 mb-16">
        <p className="text-base font-sans text-on-background leading-relaxed text-justify md:text-center max-w-2xl mx-auto">
          Every journey begins with a spark, and ours is guided by a name that carries the essence of illumination: <strong className="font-serif text-primary font-bold">Diya</strong>. In Arabic, Diya means <span className="italic font-serif">"Light"</span>. We chose this name because it is inspired by Surah An-Nur, the holy Surah where the beauty and modesty of the Hijab were revealed to elevate and protect every woman.
        </p>

        {/* Quran Verse Block */}
        <div className="my-10 p-6 md:p-10 bg-surface-container/40 border-y-2 border-primary/30 text-center relative rounded-sm">
          <p className="text-xs font-serif tracking-widest text-primary uppercase mb-4 font-semibold">
            Surah An-Nur [31]
          </p>
          <div className="font-serif dir-rtl text-xl md:text-2xl text-primary leading-loose mb-4 font-medium px-4">
            <div className="text-sm md:text-base text-outline mb-3 font-normal">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
            ﴿وَقُل لِّلْمُؤْمِنَاتِ يَغْضُضْنَ مِنْ أَبْصَارِهِنَّ وَيَحْفَظْنَ فُرُوجَهُنَّ وَلَا يُبْدِينَ زِينَتَهُنَّ إِلَّا مَا ظَهَرَ مِنْهَا ۖ وَلْيَضْرِبْنَ بِخُمُرِهِنَّ عَلَىٰ جُيُوبِهِنَّ﴾
          </div>
          <p className="text-xs font-serif text-outline uppercase tracking-wider font-semibold">
            صَدَقَ اللهُ العَظِيمُ
          </p>
        </div>

        <p className="text-base font-sans text-on-background leading-relaxed text-justify md:text-center max-w-2xl mx-auto">
          At <strong className="font-serif text-primary">Diya</strong>, we believe that the Hijab is a reflection of that divine inner light. We craft luxurious, premium scarves designed to make you feel radiant, confident, and gracefully connected to your elegance and purpose.
        </p>
      </div>

      {/* Values Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="text-center p-6 bg-surface-container/10 border border-surface-container/30 rounded-lg">
          <div className="flex justify-center mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-sm font-serif font-semibold text-on-background uppercase tracking-wider mb-2">
            Divine Light
          </h3>
          <p className="text-xs text-outline leading-relaxed">
            Inspired by spiritual warmth and dignity, elevating modesty into pure radiance.
          </p>
        </div>

        <div className="text-center p-6 bg-surface-container/10 border border-surface-container/30 rounded-lg">
          <div className="flex justify-center mb-4">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-sm font-serif font-semibold text-on-background uppercase tracking-wider mb-2">
            Sacred Inspiration
          </h3>
          <p className="text-xs text-outline leading-relaxed">
            Rooted in Surah An-Nur to honor the beauty, grace, and strength of every woman.
          </p>
        </div>

        <div className="text-center p-6 bg-surface-container/10 border border-surface-container/30 rounded-lg">
          <div className="flex justify-center mb-4">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-sm font-serif font-semibold text-on-background uppercase tracking-wider mb-2">
            Premium Luxury
          </h3>
          <p className="text-xs text-outline leading-relaxed">
            Crafted with uncompromising quality to empower your confidence every day.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link 
          to="/"
          className="inline-block bg-primary hover:bg-primary-container text-white text-xs font-sans tracking-widest uppercase px-8 py-4 transition-colors font-medium rounded-md shadow-sm"
        >
          Explore the Collection
        </Link>
      </div>
    </div>
  );
}

