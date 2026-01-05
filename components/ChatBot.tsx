
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2, Sparkles, Brain, ImageIcon, Trash2, Mic, StopCircle } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { Report } from '../types';

interface ChatBotProps {
  activeReport: Report | null;
}

const ChatBot: React.FC<ChatBotProps> = ({ activeReport }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string; image?: string; isThinking?: boolean }[]>([
    { role: 'bot', text: 'Hello! I am your InsightStream AI assistant. How can I help you analyze your data today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setSelectedImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMessage = input;
    const imageToSubmit = selectedImage;
    setInput('');
    setSelectedImage(null);
    setMessages(prev => [...prev, { role: 'user', text: userMessage, image: imageToSubmit || undefined }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = activeReport 
        ? `The user is currently looking at a report named "${activeReport.name}". 
           Summary: ${activeReport.analysis.summary}. 
           Insights: ${activeReport.analysis.insights.join(', ')}. 
           The dataset has ${activeReport.data.length} rows.`
        : "No specific report is currently active.";

      let promptParts: any[] = [{ text: `${context}\n\nUser Question: ${userMessage}` }];
      if (imageToSubmit) {
        promptParts.push({
          inlineData: {
            mimeType: 'image/png',
            data: imageToSubmit.split(',')[1]
          }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: promptParts },
        config: {
          systemInstruction: "You are an expert data scientist. Answer questions about the data report or uploaded images accurately. Use reasoning if enabled.",
          thinkingConfig: useThinking ? { thinkingBudget: 32768 } : undefined
        }
      });

      setMessages(prev => [...prev, { role: 'bot', text: response.text || "I'm sorry, I couldn't process that.", isThinking: useThinking }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'bot', text: "Sorry, I encountered an error. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white w-[420px] h-[600px] rounded-[2.5rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="bg-indigo-600 p-6 flex items-center justify-between text-white relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                 <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-black tracking-tight">InsightStream AI</span>
                <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">Powered by Gemini 3 Pro</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <button 
                 onClick={() => setUseThinking(!useThinking)} 
                 className={`p-2 rounded-xl transition-all flex items-center gap-1.5 ${useThinking ? 'bg-indigo-400 text-white shadow-inner' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                 title="Thinking Mode (High Reasoning)"
               >
                 <Brain className={`w-4 h-4 ${useThinking ? 'animate-pulse' : ''}`} />
                 <span className="text-[10px] font-black uppercase">Deep Think</span>
               </button>
               <button onClick={() => setIsOpen(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${m.role === 'user' ? 'bg-indigo-100' : 'bg-white'}`}>
                    {m.role === 'user' ? <User className="w-5 h-5 text-indigo-600" /> : <Bot className="w-5 h-5 text-purple-600" />}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {m.isThinking && m.role === 'bot' && (
                       <div className="flex items-center gap-1 text-[9px] font-black text-indigo-500 uppercase bg-indigo-50 px-2 py-0.5 rounded-full w-fit">
                         <Brain className="w-2.5 h-2.5" /> High Precision Analysis
                       </div>
                    )}
                    <div className={`p-4 rounded-3xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 shadow-sm rounded-tl-none border border-slate-100'}`}>
                      {m.image && <img src={m.image} className="mb-3 rounded-xl max-w-full h-auto border border-white/20" alt="Uploaded Context" />}
                      {m.text}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-3 text-slate-400">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest">{useThinking ? 'Deep Reasoning Active...' : 'Gemini is processing...'}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 bg-white border-t border-slate-100 space-y-4">
            {selectedImage && (
               <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom-2">
                 <img src={selectedImage} className="w-12 h-12 rounded-lg object-cover" />
                 <div className="flex-1 text-[10px] font-bold text-slate-400">Context Image Attached</div>
                 <button onClick={() => setSelectedImage(null)} className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
               </div>
            )}
            <div className="flex gap-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-colors"
                title="Attach Image"
              >
                <ImageIcon className="w-5 h-5" />
                <input type="file" ref={fileInputRef} onChange={handleImageSelect} className="hidden" accept="image/*" />
              </button>
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about your data..."
                  className="w-full bg-slate-100 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 pr-12 outline-none transition-all"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading}
                  className="absolute right-2 top-2 bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-100"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 text-white w-16 h-16 rounded-[2rem] shadow-2xl shadow-indigo-200 flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group relative"
        >
          <Sparkles className="w-7 h-7" />
          <span className="absolute -top-12 right-0 bg-white text-slate-900 px-4 py-2 rounded-xl shadow-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity border border-slate-100 whitespace-nowrap">
            Launch AI Lab
          </span>
        </button>
      )}
    </div>
  );
};

export default ChatBot;
