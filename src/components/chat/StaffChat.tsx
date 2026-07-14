"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { Send, MessageSquare, Loader2 } from "lucide-react";

interface Message {
  id: string;
  sender_name: string;
  sender_role: "admin" | "teacher";
  content: string;
  created_at: string;
  pending?: boolean; // optimistic flag
}

interface StaffChatProps {
  senderName: string;
  senderRole: "admin" | "teacher";
}

export default function StaffChat({ senderName, senderRole }: StaffChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && data) {
      // Replace all messages (removes pending ones that were confirmed)
      setMessages(data as Message[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMessages();

    // Primary: postgres_changes real-time (works once publication is enabled)
    const channel = supabase
      .channel("staff-chat-v3")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => {
            // Replace a pending optimistic message from THIS user
            const hasPending = prev.some(
              (m) =>
                m.pending &&
                m.sender_name === incoming.sender_name &&
                m.content === incoming.content
            );
            if (hasPending) {
              return prev.map((m) =>
                m.pending &&
                m.sender_name === incoming.sender_name &&
                m.content === incoming.content
                  ? incoming
                  : m
              );
            }
            // Append if it doesn't already exist (message from someone else)
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        }
      )
      .subscribe();

    // Fallback: poll every 3 seconds to catch any missed real-time events
    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (data) {
        setMessages((prev) => {
          // Keep pending (optimistic) messages, merge in confirmed ones
          const pendingMsgs = prev.filter((m) => m.pending);
          const confirmedIds = new Set(data.map((m: Message) => m.id));
          // Only update if there are genuinely new messages
          const prevConfirmedCount = prev.filter((m) => !m.pending).length;
          if (data.length === prevConfirmedCount) return prev; // no change
          return [...data, ...pendingMsgs];
        });
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content) return;

    // ── Optimistic update: show the message immediately ──
    const tempId = `pending-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      sender_name: senderName,
      sender_role: senderRole,
      content,
      created_at: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // Clear input and refocus INSTANTLY — don't wait for server
    setNewMessage("");
    inputRef.current?.focus();

    // ── Insert into Supabase in the background (fire-and-forget) ──
    supabase
      .from("messages")
      .insert({ sender_name: senderName, sender_role: senderRole, content })
      .then(({ error }) => {
        if (error) {
          // Rollback optimistic message on failure
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          setNewMessage(content); // restore text so user can retry
          console.error("Send failed:", error.message);
        } else {
          // Mark message as confirmed (removes "Sending..." spinner)
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, pending: false } : m))
          );
        }
      });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "long", day: "numeric" });
  };

  // Group messages by date
  const grouped: { date: string; msgs: Message[] }[] = [];
  messages.forEach((msg) => {
    const dateLabel = formatDate(msg.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.date === dateLabel) {
      last.msgs.push(msg);
    } else {
      grouped.push({ date: dateLabel, msgs: [msg] });
    }
  });

  const isMe = (msg: Message) =>
    msg.sender_name === senderName && msg.sender_role === senderRole;

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-brand-600 to-brand-800">
        <div className="p-2 bg-white/20 rounded-xl">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-white text-lg leading-tight">Staff Room Chat</h2>
          <p className="text-brand-200 text-xs">Messages visible to all teachers and admin</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
          <span className="text-white/70 text-xs">Live</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-slate-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">No messages yet</p>
            <p className="text-sm">Be the first to start the conversation!</p>
          </div>
        ) : (
          grouped.map(({ date, msgs }) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  {date}
                </span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>

              {msgs.map((msg) => {
                const mine = isMe(msg);
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 mb-2 ${mine ? "flex-row-reverse" : "flex-row"} ${
                      msg.pending ? "opacity-70" : "opacity-100"
                    } transition-opacity duration-200`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow ${
                        msg.sender_role === "admin"
                          ? "bg-gradient-to-br from-brand-600 to-brand-800"
                          : "bg-gradient-to-br from-purple-500 to-purple-700"
                      }`}
                    >
                      {msg.sender_name.charAt(0).toUpperCase()}
                    </div>

                    <div className={`max-w-[70%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                      {/* Sender name & role */}
                      <div className={`flex items-center gap-2 mb-1 ${mine ? "flex-row-reverse" : ""}`}>
                        <span className="text-xs font-semibold text-slate-700">
                          {mine ? "You" : msg.sender_name}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            msg.sender_role === "admin"
                              ? "bg-brand-100 text-brand-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {msg.sender_role === "admin" ? "Admin" : "Teacher"}
                        </span>
                      </div>

                      {/* Bubble */}
                      <div
                        className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                          mine
                            ? "bg-brand-600 text-white rounded-br-sm"
                            : "bg-white text-slate-800 border border-slate-100 rounded-bl-sm"
                        }`}
                      >
                        {msg.content}
                      </div>

                      {/* Timestamp / Sending indicator */}
                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {msg.pending ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" /> Sending...
                          </span>
                        ) : (
                          formatTime(msg.created_at)
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-3 px-4 py-3 border-t border-slate-200 bg-white"
      >
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message as ${senderName}... (Enter to send)`}
            className="w-full pl-4 pr-4 py-2.5 bg-slate-100 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="p-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
