"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Send, MessageCircle, Bot } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { useChatbotStore } from "@/lib/store/chatbot-store";
import { useProfileStore } from "@/lib/store/profile-store";
import Image from "next/image";

export function AIChatbot() {
  const { isOpen, close, messages, isLoading, sendMessage } = useChatbotStore();
  const profile = useProfileStore((state) => state.data);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus textarea when chatbot opens
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const content = input;
    setInput("");
    await sendMessage(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none sm:p-6">
      <div className="flex flex-col w-full max-w-md h-[600px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl pointer-events-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">AI Support</h3>
              <p className="text-xs text-slate-400">Need Help & Ask</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={close}
            className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-800 [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-slate-500">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="h-12 w-12 rounded-full bg-blue-600/20 flex items-center justify-center mb-3">
                <MessageCircle className="h-6 w-6 text-blue-400" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">
                How can I help you?
              </h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Ask me anything about the platform, features, or get support.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {/* Assistant avatar - on the left */}
                {message.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                
                {/* Message bubble */}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-slate-800 text-slate-100 rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <span
                    className={`text-[10px] mt-1 block ${
                      message.role === "user"
                        ? "text-blue-100"
                        : "text-slate-400"
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* User avatar - on the right */}
                {message.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden border border-slate-600">
                    {profile?.photo ? (
                      <Image
                        src={profile.photo}
                        alt={profile?.name || "User"}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-slate-300 font-semibold">
                        {((profile?.name || "U")[0] || "U").toUpperCase()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-slate-800 text-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center">
                  <span 
                    className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" 
                    style={{ animationDelay: "0ms", animationDuration: "1.4s" }} 
                  />
                  <span 
                    className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" 
                    style={{ animationDelay: "200ms", animationDuration: "1.4s" }} 
                  />
                  <span 
                    className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" 
                    style={{ animationDelay: "400ms", animationDuration: "1.4s" }} 
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={isLoading}
              rows={1}
              className="flex-1 min-h-[40px] max-h-[120px] resize-none bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-800 [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-slate-500"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 h-10 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
