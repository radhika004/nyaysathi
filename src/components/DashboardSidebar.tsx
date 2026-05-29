'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { 
  Languages, 
  Search, 
  MessageSquare, 
  Plus, 
  History, 
  User, 
  Settings, 
  LogOut, 
  UserPen,
  ChevronDown,
  Scale,
  Sun,
  Moon,
  Clock,
  MoreVertical,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import { useChat } from "@/context/chat-context";
import { useAuth } from "@/context/auth-context";

export function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const { sessions, currentSessionId, startNewChat, loadSession, deleteSession } = useChat();
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
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

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleNewChatClick = () => {
    startNewChat();
    if (pathname !== '/dashboard') {
      router.push('/dashboard');
    }
  };

  const handleHistoryClick = (sessionId: string) => {
    loadSession(sessionId);
    if (pathname !== '/dashboard') {
      router.push('/dashboard');
    }
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => router.push('/')}>
          <Scale className="size-6 text-primary" />
          <span className="text-xl font-bold tracking-tight">
            {t('brand.first')}<span className="text-primary">{t('brand.second')}</span>
          </span>
        </div>
        
        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-between w-full p-2 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-colors">
              <div className="flex items-center gap-2">
                <Languages className="size-4 text-primary" />
                <span className="text-sm font-medium">{language}</span>
              </div>
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuItem onClick={() => setLanguage("English")}>English</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage("Marathi")}>Marathi</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage("Hindi")}>Hindi</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                tooltip={t('sidebar.searchLawyer')} 
                isActive={pathname === '/lawyers'}
                onClick={() => router.push('/lawyers')}
              >
                <Search className="size-4" />
                <span>{t('sidebar.searchLawyer')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                tooltip={t('sidebar.chat')} 
                isActive={pathname === '/dashboard' && !!currentSessionId}
                onClick={() => router.push('/dashboard')}
              >
                <MessageSquare className="size-4" />
                <span>{t('sidebar.chat')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                tooltip={t('sidebar.newChat')} 
                className="text-primary font-semibold" 
                onClick={handleNewChatClick}
                isActive={pathname === '/dashboard' && !currentSessionId}
              >
                <Plus className="size-4" />
                <span>{t('sidebar.newChat')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <History className="size-3" />
            {t('sidebar.history')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sessions.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs text-muted-foreground font-light">{t('sidebar.noHistory')}</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <SidebarMenuItem key={session.id}>
                    <SidebarMenuButton 
                      onClick={() => handleHistoryClick(session.id)}
                      isActive={currentSessionId === session.id}
                      className="group"
                    >
                      <Clock className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="truncate text-xs font-light">{session.title}</span>
                    </SidebarMenuButton>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction showOnHover>
                          <MoreVertical className="size-3.5" />
                          <span className="sr-only">Toggle menu</span>
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start">
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive gap-2 cursor-pointer"
                          onClick={() => deleteSession(session.id)}
                        >
                          <Trash2 className="size-4" />
                          <span>{t('sidebar.deleteChat')}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="w-full">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="size-4 text-primary" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold">{user?.name || t('sidebar.profile')}</span>
                <span className="text-[10px] text-muted-foreground">{user?.role === 'lawyer' ? 'Lawyer' : t('sidebar.citizen')}</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" side="right" align="end">
            <DropdownMenuLabel>{t('sidebar.profile')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2">
              <UserPen className="size-4" />
              <span>{t('sidebar.edit')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
              <span>{theme === 'dark' ? t('sidebar.lightMode') : t('sidebar.darkMode')}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={handleLogout}>
              <LogOut className="size-4" />
              <span>{t('sidebar.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}