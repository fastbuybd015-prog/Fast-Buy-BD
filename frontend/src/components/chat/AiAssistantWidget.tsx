'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot,
  X,
  Send,
  Sparkles,
  ShoppingBag,
  Package,
  TrendingDown,
  ChevronRight,
  RefreshCw,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { chatApi, type ChatProductCard, type ChatOrderStatus, type ChatSuggestedAction } from '@/lib/api/chat';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/context/toast-context';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  productCards?: ChatProductCard[];
  orderStatus?: ChatOrderStatus;
  suggestedActions?: ChatSuggestedAction[];
}

const STARTER_PROMPTS = [
  '📦 Track my order status',
  '🌾 Cheapest Miniket Rice price?',
  '🥚 Fresh Eggs & Soybean Oil deals',
  '⚡ How does 30-minute delivery work?',
  '💰 Help me plan a ৳1,500 grocery budget',
];

export function AiAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        '👋 Assalamu Alaikum! I am **FastShop AI Assistant**, powered by Gemini. Ask me anything about product prices, live order tracking, or grocery budgeting across Dhaka superstores!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addItem } = useCart();
  const { showToast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.content,
      }));

      const res = await chatApi.sendMessage({
        message: query,
        history: historyPayload,
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        productCards: res.productCards,
        orderStatus: res.orderStatus,
        suggestedActions: res.suggestedActions,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content:
          'Sorry, I could not connect to the assistant right now. Please check if your connection is active or try again in a moment.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: ChatProductCard) => {
    addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.id,
        image:
          product.image ||
          'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60',
        store: product.store,
        storeId: 'fastshop-store',
        unit: product.unit,
        price: product.price,
        originalPrice: product.price,
        category: 'grocery',
        storeSlug: 'store',
        gallery: [],
        discount: 0,
        rating: 4.8,
        reviews: 24,
        description: product.name,
        tags: ['grocery'],
        available: true,
        popular: true,
      },
      1,
    );
    showToast(`Added ${product.name} (৳${product.price}) to cart!`, 'success');
  };

  return (
    <>
      {/* Floating Action Bubble */}
      <div className="fixed bottom-5 right-5 z-40">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white p-3.5 sm:px-4 sm:py-3 shadow-lg shadow-brand-500/25 transition-all duration-200 hover:scale-105 active:scale-95 focus-ring"
            aria-label="Open AI Assistant"
          >
            <div className="relative flex h-6 w-6 items-center justify-center">
              <Bot className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <span className="hidden sm:inline font-bold text-xs">FastShop AI</span>
          </button>
        )}
      </div>

      {/* Expandable Chat Window */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[92vw] sm:w-[400px] h-[580px] max-h-[85vh] rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-2xl flex flex-col overflow-hidden animate-slide-up transition-colors">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-ink-100 dark:border-ink-800 bg-ink-50 dark:bg-ink-850">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-xs">
                <Bot className="h-5 w-5" />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-ink-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-ink-900 dark:text-ink-50">FastShop AI</h3>
                  <span className="rounded-md bg-brand-50 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-800 px-1.5 py-0.2 text-[10px] font-bold text-brand-700 dark:text-brand-300">
                    Gemini
                  </span>
                </div>
                <p className="text-[11px] text-ink-500 dark:text-ink-400">Dhaka Superstore Support</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 dark:hover:bg-ink-800 dark:hover:text-ink-200 transition-colors"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 ${
                    m.role === 'user'
                      ? 'bg-brand-500 text-white font-medium rounded-br-xs shadow-2xs'
                      : 'bg-ink-50 dark:bg-ink-800 text-ink-800 dark:text-ink-100 rounded-bl-xs border border-ink-100 dark:border-ink-700/60 shadow-2xs'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>

                  {/* Embedded Order Tracking Status Card */}
                  {m.orderStatus && (
                    <div className="mt-3 p-3 rounded-xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-700 shadow-2xs">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-ink-900 dark:text-ink-50">
                          <Package className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                          <span>{m.orderStatus.orderNumber}</span>
                        </div>
                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          {m.orderStatus.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-ink-500 dark:text-ink-400 mb-2">
                        Total: <span className="font-bold text-brand-600 dark:text-brand-400">৳{m.orderStatus.total}</span> • {m.orderStatus.itemCount} items
                      </div>
                      <Link
                        href={`/orders/${m.orderStatus.orderNumber}`}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        View live tracking milestone timeline <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>
                  )}

                  {/* Embedded Product Recommendation Cards */}
                  {m.productCards && m.productCards.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {m.productCards.map((prod) => (
                        <div
                          key={prod.id}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-700 shadow-2xs"
                        >
                          <div className="min-w-0">
                            <h4 className="font-bold text-ink-900 dark:text-ink-50 truncate">{prod.name}</h4>
                            <p className="text-[10px] text-ink-500 dark:text-ink-400">
                              {prod.store} • {prod.unit}
                            </p>
                            <span className="font-extrabold text-brand-600 dark:text-brand-400">
                              ৳{prod.price}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(prod)}
                            className="flex items-center gap-1 rounded-lg bg-brand-500 hover:bg-brand-600 text-white px-2.5 py-1.5 text-[11px] font-bold shadow-xs transition-colors shrink-0"
                          >
                            <Plus className="h-3 w-3" />
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggested Action Pills */}
                  {m.suggestedActions && m.suggestedActions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {m.suggestedActions.map((action, idx) => (
                        <Link
                          key={idx}
                          href={action.payload || '/'}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ink-100 dark:bg-ink-700 text-ink-800 dark:text-ink-200 text-[10px] font-bold hover:bg-brand-500 hover:text-white transition-colors"
                        >
                          <span>{action.label}</span>
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-ink-400 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-ink-50 dark:bg-ink-800 border border-ink-100 dark:border-ink-700/60 max-w-[70%]">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-brand-500" />
                <span className="text-[11px] text-ink-500 dark:text-ink-400 font-medium">
                  FastShop AI is thinking...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2">
              <p className="text-[10px] font-bold text-ink-400 uppercase mb-1.5">Quick Questions</p>
              <div className="flex flex-wrap gap-1.5">
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="px-2.5 py-1 rounded-lg bg-ink-50 dark:bg-ink-800 hover:bg-brand-50 dark:hover:bg-brand-950/60 border border-ink-200/80 dark:border-ink-700 text-[11px] font-semibold text-ink-700 dark:text-ink-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-ink-100 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-850 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products, orders or prices..."
              className="flex-1 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-xs text-ink-900 dark:text-ink-50 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white transition-colors shrink-0 shadow-xs focus-ring"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
