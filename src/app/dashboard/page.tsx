'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { 
  Paperclip, 
  Mic, 
  Send,
  Scale,
  Loader2,
  User,
  Copy,
  Volume2,
  VolumeX,
  Check,
  Shield,
  BookOpen,
  Briefcase,
  Gavel,
  AlertCircle
} from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useChat } from "@/context/chat-context";
import { useAuth } from "@/context/auth-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DashboardPage() {
  const { t, language } = useLanguage();
  const { messages, addMessage, isLoading, isStreaming, streamingContent, isLoadingSession } = useChat();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (mounted && !isAuthenticated) {
      router.push('/');
    }
  }, [mounted, isAuthenticated, router]);

  // Auto-scroll when messages change, streaming content updates, or loading state changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, streamingContent]);

  const handleSendMessage = async () => {
    if (!query.trim() || isLoading || isStreaming) return;
    const userQuery = query.trim();
    setQuery("");
    
    try {
      await addMessage(userQuery);
    } catch {
      toast({ 
        variant: "destructive",
        description: "Failed to send message. Please check your connection." 
      });
    }
  };

  const handleCopy = (text: string, id: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast({ description: "Copied to clipboard" });
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSpeak = (text: string, msgId: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const langMap: Record<string, string> = {
      'English': 'en-IN',
      'Hindi': 'hi-IN',
      'Marathi': 'mr-IN'
    };
    
    utterance.lang = langMap[language] || 'en-IN';
    utterance.onstart = () => setSpeakingMsgId(msgId);
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    
    window.speechSynthesis.speak(utterance);
  };

  if (!mounted || !isAuthenticated) return null;

  const isChatStarted = messages.length > 0 || isStreaming || isLoading;
  const isInputDisabled = isLoading || isStreaming;

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full bg-background text-foreground transition-colors duration-300">
          <DashboardSidebar />
          <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full w-full px-6 md:px-10 py-6" ref={scrollAreaRef}>
                <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
                  
                  {/* Loading session indicator */}
                  {isLoadingSession && (
                    <div className="flex items-center justify-center min-h-[40vh]">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="size-8 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Loading conversation...</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Welcome state */}
                  {!isChatStarted && !isLoadingSession && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                      <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Scale className="size-10 text-primary" />
                      </div>
                      <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                        {t('dashboard.welcome')} <span className="text-primary italic">{user?.name.split(' ')[0]}</span>
                      </h2>
                      <p className="text-muted-foreground text-lg font-light max-w-md mx-auto">
                        {t('dashboard.ready')}
                      </p>
                    </div>
                  )}

                  {/* Chat messages */}
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300", msg.role === 'user' ? "justify-end" : "justify-start")}>
                      <div className={cn("flex gap-3 max-w-[85%] md:max-w-[70%]", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                        <div className={cn("size-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm", msg.role === 'user' ? "bg-primary" : "bg-muted border border-border")}>
                          {msg.role === 'user' ? <User className="size-4 text-white" /> : <Scale className="size-4 text-primary" />}
                        </div>
                        <div className="flex flex-col">
                          <div className={cn("p-4 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap", msg.role === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-muted border border-border rounded-tl-none")}>
                            {msg.content}
                          </div>
                          {msg.role === 'assistant' && (
                            <div className="flex items-center gap-1.5 mt-2 ml-1">
                              <button 
                                onClick={() => handleCopy(msg.content, msg.id)} 
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors group relative"
                              >
                                {copiedId === msg.id ? <Check className="size-4 text-green-500" /> : <Copy className="size-4 hover:text-primary transition-colors" />}
                              </button>
                              <button 
                                onClick={() => handleSpeak(msg.content, msg.id)} 
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors group relative"
                              >
                                {speakingMsgId === msg.id ? <VolumeX className="size-4 text-primary animate-pulse" /> : <Volume2 className="size-4 hover:text-primary transition-colors" />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Streaming response — live typing effect */}
                  {isStreaming && streamingContent && (
                    <div className="flex justify-start animate-in fade-in duration-200">
                      <div className="flex gap-3 max-w-[85%] md:max-w-[70%]">
                        <div className="size-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 mt-1 shadow-sm">
                          <Scale className="size-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <div className="bg-muted border border-border p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed shadow-sm whitespace-pre-wrap">
                            {streamingContent}
                            <span className="inline-block w-[2px] h-[1em] bg-primary ml-0.5 animate-pulse" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Waiting for first token — bouncing dots */}
                  {(isLoading || (isStreaming && !streamingContent)) && (
                    <div className="flex justify-start">
                      <div className="flex gap-3 max-w-[70%]">
                        <div className="size-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                          <Scale className="size-4 text-primary" />
                        </div>
                        <div className="bg-muted border border-border p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                          <span className="flex gap-1">
                            <span className="size-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="size-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="size-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                          <span className="text-xs text-muted-foreground italic ml-2">Consulting legal database...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={scrollRef} className="h-4" />
                </div>
              </ScrollArea>
            </div>

            {/* Input area */}
            <div className="p-6 md:p-10 bg-background/80 backdrop-blur-md border-t border-border/50">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="relative flex items-center bg-muted/30 border border-border rounded-2xl p-2 pl-6 focus-within:border-primary/50 shadow-sm transition-all duration-300">
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={t('dashboard.placeholder')} 
                    disabled={isInputDisabled}
                    className="flex-1 bg-transparent border-none outline-none py-4 text-foreground text-lg placeholder:text-muted-foreground font-light"
                  />
                  <div className="flex items-center gap-3 pr-2">
                    {/* Paperclip — disabled with tooltip */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          className="text-muted-foreground/40 p-2 cursor-not-allowed"
                          disabled
                        >
                          <Paperclip className="size-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">File upload coming soon</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    {/* Mic — disabled with tooltip */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          className="text-muted-foreground/40 p-2 cursor-not-allowed"
                          disabled
                        >
                          <Mic className="size-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Voice input coming soon</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <button 
                      onClick={handleSendMessage}
                      disabled={isInputDisabled || !query.trim()}
                      className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl h-11 w-11 flex items-center justify-center shadow-lg transition-all active:scale-95"
                    >
                      {isInputDisabled ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
                    </button>
                  </div>
                </div>

                {!isChatStarted && (
                  <div className="flex flex-wrap justify-center gap-3 md:gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    {[
                      { name: t('domains.ipc'), icon: Shield },
                      { name: t('domains.family'), icon: Scale },
                      { name: t('domains.tax'), icon: BookOpen },
                      { name: t('domains.civil'), icon: Briefcase },
                      { name: t('domains.criminal'), icon: Gavel }
                    ].map((domain, i) => (
                      <div 
                        key={i} 
                        onClick={() => setQuery(domain.name + ": ")}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border hover:border-primary/40 cursor-pointer group transition-all hover:bg-primary/5 shadow-sm"
                      >
                        <domain.icon className="size-3.5 text-primary group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] md:text-xs text-muted-foreground font-medium group-hover:text-foreground uppercase tracking-wider">
                          {domain.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
