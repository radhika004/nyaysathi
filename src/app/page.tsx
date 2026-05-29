"use client";

import { useRouter } from 'next/navigation';
import { 
  Scale, 
  Gavel, 
  Shield, 
  Languages, 
  Paperclip,
  Mic,
  Send,
  BookOpen,
  Briefcase,
  Sun,
  Moon,
  ChevronDown,
  CheckCircle2,
  Globe,
  MessageSquare,
  Volume2,
  MapPin,
  Users,
  Search,
  Zap,
  HelpCircle,
  Mail,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useState, useEffect } from "react";
import { AuthModals } from "@/components/AuthModals";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [heroQuery, setHeroQuery] = useState('');

  const handleHeroSearch = () => {
    if (!heroQuery.trim()) return;
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      setIsAuthOpen(true);
    }
  };

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('light', savedTheme === 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('light', newTheme === 'light');
  };

  const heroImage = PlaceHolderImages.find(img => img.id === "hero-legal");

  if (!mounted) {
    return null;
  }

  const aboutCards = [
    {
      title: t('about.card1Title'),
      desc: t('about.card1Desc'),
      icon: Shield,
    },
    {
      title: t('about.card2Title'),
      desc: t('about.card2Desc'),
      icon: Gavel,
    },
    {
      title: t('about.card4Title'),
      desc: t('about.card4Desc'),
      icon: Languages,
    },
    {
      title: t('about.card3Title'),
      desc: t('about.card3Desc'),
      icon: CheckCircle2,
    },
  ];

  const featureCards = [
    {
      title: t('features.card1Title'),
      desc: t('features.card1Desc'),
      icon: MessageSquare,
    },
    {
      title: t('features.card2Title'),
      desc: t('features.card2Desc'),
      icon: Globe,
    },
    {
      title: t('features.card3Title'),
      desc: t('features.card3Desc'),
      icon: Volume2,
    },
    {
      title: t('features.card4Title'),
      desc: t('features.card4Desc'),
      icon: BookOpen,
    },
    {
      title: t('features.card5Title'),
      desc: t('features.card5Desc'),
      icon: MapPin,
    },
    {
      title: t('features.card6Title'),
      desc: t('features.card6Desc'),
      icon: Users,
    },
  ];

  const howItWorksSteps = [
    {
      title: t('howItWorks.step1Title'),
      desc: t('howItWorks.step1Desc'),
      icon: Search,
      number: "01"
    },
    {
      title: t('howItWorks.step2Title'),
      desc: t('howItWorks.step2Desc'),
      icon: Zap,
      number: "02"
    },
    {
      title: t('howItWorks.step3Title'),
      desc: t('howItWorks.step3Desc'),
      icon: HelpCircle,
      number: "03"
    }
  ];

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Fixed Background Image */}
      <div className="fixed inset-0 z-[-1] opacity-20">
        {heroImage && (
          <Image 
            src={heroImage.imageUrl} 
            alt="NyaySathi Legal Background" 
            fill 
            className="object-cover"
            priority
            data-ai-hint="legal justice"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/50 py-4 shadow-2xl">
        <div className="container mx-auto px-8 md:px-32 lg:px-48 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <Scale className="size-8 text-primary group-hover:rotate-12 transition-transform" />
            <h1 className="text-2xl font-bold tracking-tight">
              {t('brand.first')}<span className="text-primary">{t('brand.second')}</span>
            </h1>
          </Link>
          
          <nav className="hidden md:flex items-center gap-10">
            <Link href="#about" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">{t('nav.about')}</Link>
            <Link href="#features" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">{t('nav.features')}</Link>
            <Link href="#how-it-works" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">{t('nav.howItWorks')}</Link>
          </nav>

          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 rounded-xl text-muted-foreground hover:text-primary transition-colors h-10">
                  <Languages className="size-5" />
                  <span className="text-sm font-semibold hidden sm:inline">{language}</span>
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setLanguage("English")}>English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("Marathi")}>Marathi</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("Hindi")}>Hindi</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full hover:bg-muted"
            >
              {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>
            <Button 
              suppressHydrationWarning
              variant="default" 
              className="bg-primary hover:bg-primary/90 text-white shadow-lg px-8 rounded-xl font-bold" 
              onClick={() => setIsAuthOpen(true)}
            >
              {t('nav.login')}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center">
        <section className="container mx-auto px-8 md:px-32 lg:px-48 pt-24 pb-12 flex flex-col items-center">
          <div className="max-w-4xl w-full text-center space-y-12">
            <div className="space-y-6 animate-fade-in-up">
              <h2 className="text-5xl md:text-7xl font-bold leading-tight tracking-tighter">
                {t('hero.title')} <span className="text-primary italic">{t('hero.reach')}</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
                {t('hero.subtitle')}
              </p>
              
              {/* Animated Glowing Query Box */}
              <div className="pt-10 w-full max-w-3xl mx-auto space-y-8">
                <div className="glow-border-wrapper rounded-[2.5rem] shadow-2xl">
                  <div className="glow-content p-4 md:p-6 rounded-[2.5rem]">
                    <div className="relative flex items-center bg-background border border-border rounded-full p-2 pl-6 shadow-inner group transition-all duration-500 overflow-hidden">
                      
                      {/* Animated Light Lines on Focus */}
                      {isFocused && (
                        <>
                          <div className="absolute inset-0 rounded-full border border-zinc-500/30 pointer-events-none z-10 animate-light-1" />
                          <div className="absolute inset-0 rounded-full border border-zinc-500/30 pointer-events-none z-10 animate-light-2" />
                        </>
                      )}

                      <input 
                        type="text" 
                        value={heroQuery}
                        onChange={(e) => setHeroQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleHeroSearch()}
                        placeholder={t('hero.placeholder')}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className="flex-1 bg-transparent border-none outline-none focus:ring-0 py-3 text-foreground text-base md:text-lg placeholder:text-muted-foreground font-light z-20"
                      />
                      
                      <div className="flex items-center gap-3 pr-2 z-20">
                        <button suppressHydrationWarning className="text-muted-foreground hover:text-primary transition-colors">
                          <Paperclip className="size-5 md:size-6" />
                        </button>
                        <button suppressHydrationWarning className="text-muted-foreground hover:text-primary transition-colors">
                          <Mic className="size-5 md:size-6" />
                        </button>
                        <button onClick={handleHeroSearch} className="bg-primary hover:bg-primary/90 text-white rounded-full h-10 w-10 flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95">
                          <Send className="size-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legal Domain Badges */}
                <div className="flex flex-wrap justify-center gap-3 md:gap-4 animate-fade-in-up delay-200">
                  {[
                    { name: t('domains.ipc'), icon: Shield },
                    { name: t('domains.family'), icon: Scale },
                    { name: t('domains.tax'), icon: BookOpen },
                    { name: t('domains.civil'), icon: Briefcase },
                    { name: t('domains.criminal'), icon: Gavel }
                  ].map((domain, i) => (
                    <div 
                      key={i} 
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border hover:border-primary/40 hover:bg-muted/80 transition-all cursor-pointer group shadow-sm"
                    >
                      <domain.icon className="size-3.5 text-primary group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] md:text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors uppercase tracking-wider">
                        {domain.name}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground font-light text-center">
                  {t('hero.footer')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="w-full bg-muted/40 py-24 border-y border-border/50">
          <div className="container mx-auto px-8 md:px-32 lg:px-48 space-y-16">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                {t('about.heading')}
              </h2>
              <p className="text-muted-foreground text-lg font-light leading-relaxed">
                {t('about.subtext')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {aboutCards.map((card, idx) => (
                <Card key={idx} className="bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group cursor-default">
                  <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                    <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <card.icon className="size-7 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg">{card.title}</h3>
                      <p className="text-sm text-muted-foreground font-light">{card.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section 
          id="features" 
          className={cn(
            "w-full py-24 border-b border-border/50",
            theme === 'light' ? "bg-muted/60" : "bg-black text-white"
          )}
        >
          <div className="container mx-auto px-8 md:px-32 lg:px-48 space-y-16">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                {t('features.heading')}
              </h2>
              <p className={cn(
                "text-lg font-light leading-relaxed",
                theme === 'light' ? "text-muted-foreground" : "text-zinc-400"
              )}>
                {t('features.subtext')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featureCards.map((card, idx) => (
                <Card 
                  key={idx} 
                  className={cn(
                    "backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group cursor-default",
                    theme === 'light' ? "bg-card border-border hover:border-primary/50" : "bg-zinc-900/50 border-zinc-800 hover:border-primary/50"
                  )}
                >
                  <CardContent className="p-8 flex flex-col items-start space-y-6">
                    <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <card.icon className="size-6 text-primary" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-bold text-xl">{card.title}</h3>
                      <p className={cn(
                        "text-sm font-light leading-relaxed",
                        theme === 'light' ? "text-muted-foreground" : "text-zinc-400"
                      )}>
                        {card.desc}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full bg-muted/40 py-24 border-b border-border/50">
          <div className="container mx-auto px-8 md:px-32 lg:px-48 space-y-16">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                {t('howItWorks.heading')}
              </h2>
              <p className="text-muted-foreground text-lg font-light leading-relaxed">
                {t('howItWorks.subtext')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {howItWorksSteps.map((step, idx) => (
                <Card key={idx} className="bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group cursor-default relative overflow-hidden">
                  <CardContent className="p-10 flex flex-col items-center text-center space-y-6">
                    <div className="absolute top-4 right-6 text-5xl font-black text-primary/5 select-none group-hover:text-primary/10 transition-colors">
                      {step.number}
                    </div>
                    <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
                      <step.icon className="size-8 text-primary" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-bold text-xl">{step.title}</h3>
                      <p className="text-sm text-muted-foreground font-light leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section 
          className={cn(
            "w-full py-24 border-b border-border/50",
            theme === 'light' ? "bg-muted/60" : "bg-black text-white"
          )}
        >
          <div className="container mx-auto px-8 md:px-32 lg:px-48 text-center space-y-10">
            <div className="space-y-4 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                {t('cta.heading')}
              </h2>
              <p className={cn(
                "text-lg font-light leading-relaxed",
                theme === 'light' ? "text-muted-foreground" : "text-zinc-400"
              )}>
                {t('cta.subtext')}
              </p>
            </div>
            <Button 
              suppressHydrationWarning
              variant="default" 
              className="bg-primary hover:bg-primary/90 text-white shadow-lg px-12 h-14 rounded-xl font-bold text-lg transition-transform hover:scale-105 active:scale-95" 
              onClick={() => setIsAuthOpen(true)}
            >
              {t('cta.button')}
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full bg-muted/40 py-16 border-t border-border/50">
          <div className="container mx-auto px-8 md:px-32 lg:px-48">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 md:gap-8 pb-12">
              {/* Logo Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Scale className="size-8 text-primary" />
                  <span className="text-2xl font-bold">{t('brand.first')}<span className="text-primary">{t('brand.second')}</span></span>
                </div>
                <p className="text-sm text-muted-foreground font-light max-w-xs leading-relaxed">
                  {t('footer.tagline')}
                </p>
              </div>

              {/* Navigate Column */}
              <div className="space-y-4">
                <h4 className="font-bold text-lg">{t('footer.navigate')}</h4>
                <nav className="flex flex-col gap-3">
                  <Link href="#about" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t('nav.about')}</Link>
                  <Link href="#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t('nav.features')}</Link>
                  <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t('nav.howItWorks')}</Link>
                </nav>
              </div>

              {/* Legal Column */}
              <div className="space-y-4">
                <h4 className="font-bold text-lg">{t('footer.legal')}</h4>
                <nav className="flex flex-col gap-3">
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t('footer.privacy')}</Link>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t('footer.terms')}</Link>
                </nav>
              </div>

              {/* Contact Column */}
              <div className="space-y-4">
                <h4 className="font-bold text-lg">{t('footer.contact')}</h4>
                <nav className="flex flex-col gap-3">
                  <a href="mailto:contact@nyaysathi.in" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="size-4" /> contact@nyaysathi.in
                  </a>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="size-4" /> +91 **********
                  </p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4" /> {t('footer.location')}
                  </p>
                  <button className="text-sm text-primary font-semibold hover:underline text-left">
                    {t('footer.chat')}
                  </button>
                </nav>
              </div>
            </div>

            {/* Horizontal Line */}
            <div className="w-full h-px bg-border/40 my-8 px-4 md:px-0" />

            {/* Bottom Section */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground font-light">
                © 2026 NyaySathi. {t('footer.rights')}
              </p>
            </div>
          </div>
        </footer>
      </main>
      
      {/* Auth System */}
      <AuthModals isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} />
    </div>
  );
}
