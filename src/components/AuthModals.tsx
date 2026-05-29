
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Briefcase, Mail, Lock, MapPin, UserCheck, ShieldCheck, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';

type AuthView = 'login' | 'type-selection' | 'citizen-signup' | 'lawyer-signup';

interface AuthModalsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: AuthView;
}

export function AuthModals({ isOpen, onOpenChange, defaultView = 'login' }: AuthModalsProps) {
  const { t } = useLanguage();
  const { login, signup } = useAuth();
  const [view, setView] = useState<AuthView>(defaultView);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user',
    domain: '',
    latitude: 0,
    longitude: 0,
    phone: ''
  });

  useEffect(() => {
    if (isOpen) setView(defaultView);
  }, [isOpen, defaultView]);

  useEffect(() => {
    if ((view === 'lawyer-signup' || view === 'type-selection') && typeof window !== 'undefined' && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
        }
      );
    }
  }, [view]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      onOpenChange(false);
      router.push('/dashboard');
    } catch (e) {
      alert("Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(formData);
      onOpenChange(false);
      router.push('/dashboard');
    } catch (e) {
      alert("Signup failed. Email might already be registered.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (view === 'type-selection') setView('login');
    else setView('type-selection');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "p-0 overflow-hidden border-border bg-background shadow-2xl",
        view === 'lawyer-signup' ? "sm:max-w-[650px]" : "sm:max-w-[450px]"
      )}>
        <div className="p-8 relative">
          {view !== 'login' && (
            <button onClick={handleBack} className="absolute left-6 top-6 p-2 rounded-full hover:bg-muted text-muted-foreground">
              <ArrowLeft className="size-5" />
            </button>
          )}

          {view === 'login' && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="text-3xl font-bold tracking-tight">{t('auth.login')}</DialogTitle>
                <DialogDescription className="text-muted-foreground">{t('auth.welcomeBack')}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} id="email" type="email" placeholder="name@example.com" className="pl-10 h-12 rounded-xl" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    <Input value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} id="password" type="password" className="pl-10 h-12 rounded-xl" required />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-primary text-white font-bold text-lg shadow-lg">
                  {loading ? 'Logging in...' : t('auth.login')}
                </Button>
              </form>
              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                  {t('auth.noAccount')} <button onClick={() => setView('type-selection')} className="text-primary font-semibold hover:underline">{t('auth.createHere')}</button>
                </p>
              </div>
            </div>
          )}

          {view === 'type-selection' && (
            <div className="space-y-8 pt-8">
              <DialogHeader>
                <DialogTitle className="text-3xl font-bold tracking-tight text-center">{t('auth.whoAreYou')}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setView('citizen-signup'); setFormData({...formData, role: 'user'}); }} className="group flex flex-col items-center gap-4 p-8 rounded-2xl border bg-card hover:bg-primary/5 transition-all">
                  <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center"><User className="size-8 text-primary" /></div>
                  <span className="font-bold text-lg">{t('auth.citizen')}</span>
                </button>
                <button onClick={() => { setView('lawyer-signup'); setFormData({...formData, role: 'lawyer'}); }} className="group flex flex-col items-center gap-4 p-8 rounded-2xl border bg-card hover:bg-primary/5 transition-all">
                  <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center"><Briefcase className="size-8 text-primary" /></div>
                  <span className="font-bold text-lg">{t('auth.lawyer')}</span>
                </button>
              </div>
            </div>
          )}

          {(view === 'citizen-signup' || view === 'lawyer-signup') && (
            <div className="space-y-6 pt-8">
              <DialogHeader>
                <DialogTitle className="text-3xl font-bold tracking-tight">{view === 'citizen-signup' ? t('auth.createCitizen') : t('auth.createLawyer')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('auth.fullName')}</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} id="name" placeholder="John Doe" className="h-12 rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} id="email" type="email" placeholder="name@example.com" className="h-12 rounded-xl" required />
                </div>
                {view === 'lawyer-signup' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="domain">{t('auth.domain')}</Label>
                      <Input value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})} id="domain" placeholder="Criminal" className="h-12 rounded-xl" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">{t('auth.location')}</Label>
                      <Input readOnly value={location} className="h-12 rounded-xl bg-muted" />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Input value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} id="password" type="password" className="h-12 rounded-xl" required />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-primary text-white font-bold text-lg">
                  {loading ? 'Creating Account...' : t('auth.createAccount')}
                </Button>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
