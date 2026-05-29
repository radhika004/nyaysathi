
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { MapPin, Search, Briefcase, Navigation, Loader2, Phone, Mail, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

const DOMAINS = ["Civil", "Family", "Criminal", "Tax", "IPC"];
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function LawyersPage() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    import('leaflet').then(leaflet => {
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    });
  }, []);

  const handleUseCurrentLocation = () => {
    if (!("geolocation" in navigator)) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
      },
      () => setIsLocating(false)
    );
  };

  const handleSearch = async () => {
    if (!userLocation) {
      alert("Please set your location first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/lawyers/nearby`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          domain: selectedDomain,
          radius_km: 25
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLawyers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <DashboardSidebar />
        <main className="flex-1 relative">
          <div className="absolute inset-0 z-0">
            <MapContainer center={[19.0760, 72.8777]} zoom={11} className="h-full w-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {userLocation && <Marker position={[userLocation.lat, userLocation.lng]}><Popup>You are here</Popup></Marker>}
              {lawyers.map(lawyer => (
                <Marker key={lawyer.id} position={[lawyer.latitude, lawyer.longitude]}>
                  <Popup>
                    <div className="p-2 space-y-2">
                      <h3 className="font-bold">{lawyer.name}</h3>
                      <p className="text-xs text-muted-foreground">{lawyer.domain} Expert</p>
                      {lawyer.phone && <p className="text-xs flex items-center gap-1"><Phone className="size-3" /> {lawyer.phone}</p>}
                      <Button size="sm" className="w-full mt-2">Connect Now</Button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="absolute top-6 left-6 z-10 w-full max-w-sm">
            <div className="bg-background/95 backdrop-blur-md border border-border rounded-3xl p-6 shadow-2xl space-y-6">
              <h2 className="text-xl font-bold tracking-tight">{t('lawyers.title')}</h2>
              <div className="space-y-4">
                <Button onClick={handleUseCurrentLocation} variant="outline" disabled={isLocating} className="w-full h-11 rounded-xl gap-2">
                  {isLocating ? <Loader2 className="size-4 animate-spin" /> : <Navigation className="size-4 text-primary" />}
                  {userLocation ? `Location: ${userLocation.lat.toFixed(2)}, ${userLocation.lng.toFixed(2)}` : t('lawyers.locationButton')}
                </Button>
                <Select onValueChange={setSelectedDomain} defaultValue="all">
                  <SelectTrigger className="h-11 rounded-xl bg-muted/30"><SelectValue placeholder={t('lawyers.allDomains')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('lawyers.allDomains')}</SelectItem>
                    {DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch} disabled={loading} className="w-full h-11 rounded-xl font-bold">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4 mr-2" />}
                  {t('lawyers.searchButton')}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
