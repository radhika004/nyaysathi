
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './auth-context';
import { useLanguage } from './language-context';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
  loaded: boolean; // whether messages have been fetched from server
};

type ChatContextType = {
  currentSessionId: string | null;
  messages: Message[];
  sessions: ChatSession[];
  isLoading: boolean;
  isLoadingSession: boolean;
  streamingContent: string;
  isStreaming: boolean;
  addMessage: (content: string) => Promise<void>;
  startNewChat: () => void;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => Promise<void>;
  setIsLoading: (loading: boolean) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSessions = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.map((s: any) => ({
          id: s.id,
          title: s.title,
          updatedAt: new Date(s.updated_at),
          messages: [],
          loaded: false
        })));
      }
    } catch (e) {
      console.error("Failed to fetch sessions", e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchSessions();
  }, [isAuthenticated, token]);

  // Derive messages from current session
  const activeSession = sessions.find(s => s.id === currentSessionId);
  const messages = activeSession?.messages || [];

  const startNewChat = () => {
    // Abort any ongoing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setCurrentSessionId(null);
    setStreamingContent('');
    setIsStreaming(false);
    setIsLoading(false);
  };

  const loadSession = useCallback(async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setStreamingContent('');
    setIsStreaming(false);
    
    // Check if messages are already loaded (cached)
    const existing = sessions.find(s => s.id === sessionId);
    if (existing && existing.loaded && existing.messages.length > 0) {
      return; // Already have the messages
    }
    
    // Fetch full session from backend
    if (!token) return;
    setIsLoadingSession(true);
    try {
      const res = await fetch(`${API_URL}/chat/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const loadedMessages: Message[] = data.messages.map((m: any) => ({
          id: generateId(),
          role: m.role,
          content: m.content,
          timestamp: new Date(m.created_at)
        }));
        
        setSessions(prev => prev.map(s => 
          s.id === sessionId 
            ? { ...s, messages: loadedMessages, title: data.title, loaded: true }
            : s
        ));
      }
    } catch (e) {
      console.error("Failed to load session messages", e);
    } finally {
      setIsLoadingSession(false);
    }
  }, [token, sessions]);

  const deleteSession = async (sessionId: string) => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) startNewChat();
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const addMessage = async (content: string) => {
    if (!token) return;
    
    // Create optimistic user message
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    
    // Add user message optimistically to current session
    setSessions(prev => {
      if (currentSessionId) {
        return prev.map(s => s.id === currentSessionId 
          ? { ...s, messages: [...s.messages, userMsg] }
          : s
        );
      }
      return prev;
    });
    
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingContent('');
    
    // Create abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch(`${API_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: content,
          language: language,
          session_id: currentSessionId
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }
      
      const decoder = new TextDecoder();
      let fullAnswer = '';
      let sessionId = currentSessionId;
      let sessionTitle = '';
      let buffer = '';

      setIsLoading(false); // Stop showing "Consulting..." once stream starts

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'meta') {
              sessionId = data.session_id;
              sessionTitle = data.title;
              
              // If this is a new session, create it in state
              if (!currentSessionId) {
                setCurrentSessionId(sessionId);
                setSessions(prev => {
                  const exists = prev.find(s => s.id === sessionId);
                  if (!exists) {
                    return [{
                      id: sessionId!,
                      title: sessionTitle,
                      messages: [userMsg],
                      updatedAt: new Date(),
                      loaded: true
                    }, ...prev];
                  }
                  return prev;
                });
              }
            } else if (data.type === 'token') {
              fullAnswer += data.content;
              setStreamingContent(fullAnswer);
            } else if (data.type === 'error') {
              fullAnswer = data.content;
              setStreamingContent(fullAnswer);
            } else if (data.type === 'done') {
              // Stream complete — commit the assistant message
              const assistantMsg: Message = {
                id: generateId(),
                role: 'assistant',
                content: data.answer || fullAnswer,
                timestamp: new Date()
              };
              
              const finalSessionId = data.session_id || sessionId;
              const finalTitle = data.title || sessionTitle;
              
              setSessions(prev => prev.map(s => 
                s.id === finalSessionId 
                  ? { 
                      ...s, 
                      messages: [...s.messages, assistantMsg],
                      title: finalTitle,
                      updatedAt: new Date(),
                      loaded: true
                    }
                  : s
              ));
            }
          } catch {
            // Ignore malformed lines
          }
        }
      }
      
    } catch (e: any) {
      if (e.name === 'AbortError') {
        // User cancelled — ignore
        return;
      }
      console.error("Streaming chat error", e);
      
      // Fallback: try non-streaming endpoint
      try {
        const fallbackRes = await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            message: content,
            language: language,
            session_id: currentSessionId
          })
        });

        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          const updatedMessages = data.messages.map((m: any) => ({
            id: generateId(),
            role: m.role,
            content: m.content,
            timestamp: new Date(m.created_at)
          }));

          setSessions(prev => {
            const existing = prev.find(s => s.id === data.session_id);
            if (existing) {
              return prev.map(s => s.id === data.session_id ? {
                ...s,
                messages: updatedMessages,
                title: data.title,
                updatedAt: new Date(data.updated_at),
                loaded: true
              } : s);
            } else {
              return [{
                id: data.session_id,
                title: data.title,
                messages: updatedMessages,
                updatedAt: new Date(data.updated_at),
                loaded: true
              }, ...prev];
            }
          });

          setCurrentSessionId(data.session_id);
        }
      } catch (fallbackError) {
        console.error("Fallback chat error", fallbackError);
        // Add error message to chat
        const errorMsg: Message = {
          id: generateId(),
          role: 'assistant',
          content: 'Sorry, I could not connect to the server. Please make sure the backend is running and try again.',
          timestamp: new Date()
        };
        setSessions(prev => {
          if (currentSessionId) {
            return prev.map(s => s.id === currentSessionId 
              ? { ...s, messages: [...s.messages, errorMsg] }
              : s
            );
          }
          return prev;
        });
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  };

  return (
    <ChatContext.Provider value={{ 
      currentSessionId, 
      messages, 
      sessions, 
      isLoading, 
      isLoadingSession,
      streamingContent,
      isStreaming,
      addMessage, 
      startNewChat, 
      loadSession,
      deleteSession,
      setIsLoading
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) throw new Error('useChat must be used within ChatProvider');
  return context;
}
