import { Heart, Sparkles, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DonationPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      {/* Header Badge */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-sans tracking-widest uppercase mb-4">
          <Heart className="w-4 h-4 fill-primary" />
          <span>Charitable Giving & Social Impact</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-on-background tracking-tight mb-4">
          Every Scarf Tells a Story of Hope
        </h1>
        <div className="w-16 h-0.5 bg-primary mx-auto mb-6"></div>
        <p className="text-sm md:text-base text-outline font-sans max-w-2xl mx-auto leading-relaxed">
          At Diya, elegance goes hand in hand with empathy. Discover how your purchase directly contributes to healing children and supporting communities.
        </p>
      </div>

      {/* Primary Highlight Note */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-6 md:p-8 text-center mb-12 shadow-xs">
        <Sparkles className="w-6 h-6 text-primary mx-auto mb-3" />
        <p className="text-lg md:text-xl font-serif font-semibold text-primary dir-rtl" dir="rtl">
          مع كل سكارف هتطلع.. بنخصص جزء من الأرباح للجمعيات الخيرية ومستشفى 57357 🌸
        </p>
        <p className="text-xs md:text-sm font-sans text-outline mt-2 tracking-wide uppercase">
          With every scarf delivered, a portion of profits supports 57357 Children's Hospital & local charities.
        </p>
      </div>

      {/* Main Content Card - Single Block */}
      <div className="bg-white border border-surface-container/80 rounded-2xl p-6 sm:p-8 shadow-xs mb-12 space-y-8">
        {/* Arabic Version (Top) */}
        <div dir="rtl">
          <div className="flex items-center gap-2 text-primary font-bold text-sm mb-4">
            <Gift className="w-4 h-4" />
            <span>رسالتنا باللغة العربية</span>
          </div>
          <p className="text-base md:text-lg font-serif text-on-background leading-loose text-justify font-medium">
            "السكارف اللي هتوصلك.. مش مجرد شياكة وخامة تحبيها، دي شايلة معاها ثواب وضحكة طفل! 💖
            <br /><br />
            حبينا نشاركك الخير، وعشان كده خصصنا جزء من أرباح كل أوردر لصالحة مستشفى 57357 والجمعيات الخيرية.
            <br /><br />
            يعني كل مرة هتلبسي فيها السكارف بتاعك، افتكري إنك كنتي سبب في رسم أمل ودعم بطل صغير.
            <br /><br />
            شكراً إنك جزء من عيلتنا.. وشريكة معانا في الخير. 🌸"
          </p>
        </div>

        <div className="border-t border-surface-container/60 my-6"></div>

        {/* English Version (Bottom) */}
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-sm mb-4">
            <Gift className="w-4 h-4" />
            <span>Our Message in English</span>
          </div>
          <p className="text-base md:text-lg font-serif text-on-background leading-relaxed text-left font-medium">
            "The scarf you receive isn’t just about style and high quality—it carries a continuous reward and a child's bright smile! 💖
            <br /><br />
            We wanted to share the goodness with you, which is why a portion of every order’s profit goes directly to support 57357 Children’s Cancer Hospital and local charities.
            <br /><br />
            This means every time you wear your scarf, you’ll remember that you were the reason behind bringing hope and supporting a brave little hero.
            <br /><br />
            Thank you for being part of our family—and our partner in doing good. 🌸"
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-surface-container/20 rounded-2xl p-8 border border-surface-container/60">
        <h3 className="text-xl font-serif font-bold text-on-background mb-3">Be Part of the Goodness</h3>
        <p className="text-xs md:text-sm font-sans text-outline mb-6 max-w-md mx-auto">
          Explore our collection today and wear your elegance with pride and purpose.
        </p>
        <Link 
          to="/" 
          className="inline-block bg-primary text-white text-xs font-sans tracking-widest uppercase font-bold px-8 py-3.5 hover:bg-primary-container transition-colors shadow-xs"
        >
          Explore Collections
        </Link>
      </div>
    </div>
  );
}
