import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  RotateCcw,
  RotateCw,
  Sparkles,
  ChevronRight,
  ChevronDown,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { CandidateProfile } from '../types';
import { api } from '../services/api';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  operations?: any[];
  timestamp: string;
  quickReplies?: string[];
}

interface AiResumeChatbotPanelProps {
  profile: CandidateProfile;
  onUpdateProfile: (updated: CandidateProfile, opDescription?: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const AiResumeChatbotPanel: React.FC<AiResumeChatbotPanelProps> = ({
  profile,
  onUpdateProfile,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isOpen,
  onToggleOpen
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I'm your AI Resume Editor. You can edit the form directly, or tell me in plain English what you want to change.\n\nTry:\n• \"Remove Java from my programming languages\"\n• \"Add Docker under Tools & Development\"\n• \"Move Certifications above Projects\"\n• \"Rename Technical Skills to Core Competencies\"\n• \"Make the CV compact (one page)\"\n• \"Rewrite my professional summary\"",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickReplies: [
        'Rewrite professional summary',
        'Make CV compact (one page)',
        'Add Docker under Tools & Development'
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (userText: string) => {
    const textToSend = userText.trim();
    if (!textToSend || isTyping) return;

    // Check client-side undo/redo triggers first
    if (/^undo$/i.test(textToSend)) {
      if (canUndo) {
        onUndo();
        setMessages(prev => [
          ...prev,
          {
            id: `msg_${Date.now()}`,
            sender: 'user',
            text: textToSend,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          {
            id: `reply_${Date.now()}`,
            sender: 'assistant',
            text: 'Reverted previous change.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setInputText('');
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `msg_${Date.now()}`,
            sender: 'user',
            text: textToSend,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          {
            id: `reply_${Date.now()}`,
            sender: 'assistant',
            text: 'Nothing to undo.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setInputText('');
      }
      return;
    }

    if (/^redo$/i.test(textToSend)) {
      if (canRedo) {
        onRedo();
        setMessages(prev => [
          ...prev,
          {
            id: `msg_${Date.now()}`,
            sender: 'user',
            text: textToSend,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          {
            id: `reply_${Date.now()}`,
            sender: 'assistant',
            text: 'Restored previous change.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setInputText('');
      }
      return;
    }

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await api.editResumeWithAi(textToSend, profile, messages);
      if (res.updatedProfile) {
        const desc = res.operations?.map(op => op.description).join('; ') || 'AI resume update';
        onUpdateProfile(res.updatedProfile, desc);
      }

      setMessages(prev => [
        ...prev,
        {
          id: `asst_${Date.now()}`,
          sender: 'assistant',
          text: res.reply,
          operations: res.operations,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickReplies: res.suggestedQuickReplies
        }
      ]);
    } catch (err: any) {
      console.error('AI chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `asst_err_${Date.now()}`,
          sender: 'assistant',
          text: "I encountered an issue processing that edit. You can also make this change directly in the form sections on the left.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <aside
      className={`ai-resume-chatbot-panel bg-[#FFFFFF] border border-[#D5D5CC] rounded-[3px] shadow-sm flex flex-col transition-all duration-200 ${
        isOpen ? 'h-[620px] lg:h-full w-full' : 'h-14 overflow-hidden'
      }`}
    >
      {/* Header */}
      <div
        className="p-3.5 bg-[#F5F3EE] border-b border-[#D5D5CC] flex items-center justify-between cursor-pointer select-none"
        onClick={onToggleOpen}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#D9534F] text-[#F5F3EE] flex items-center justify-center shadow-xs">
            <Bot size={15} />
          </div>
          <div>
            <div className="font-serif text-base font-bold text-[#20251F] leading-tight flex items-center gap-1.5">
              <span>AI Resume Editor</span>
              <span className="text-[10px] font-mono uppercase bg-[#20251F] text-[#F5F3EE] px-1.5 py-0.2 rounded-xs font-semibold">
                Live
              </span>
            </div>
            <p className="text-[11px] text-[#686C63] font-mono leading-none">
              Direct form synchronization
            </p>
          </div>
        </div>

        {/* Undo/Redo & Minimize Toolbar */}
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo last change"
            className={`p-1.5 rounded-[2px] border transition-colors ${
              canUndo
                ? 'border-[#D5D5CC] bg-[#FFFFFF] text-[#20251F] hover:bg-[#E8E7DF]'
                : 'border-transparent text-[#686C63]/40 cursor-not-allowed'
            }`}
          >
            <RotateCcw size={13} strokeWidth={1.75} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo change"
            className={`p-1.5 rounded-[2px] border transition-colors ${
              canRedo
                ? 'border-[#D5D5CC] bg-[#FFFFFF] text-[#20251F] hover:bg-[#E8E7DF]'
                : 'border-transparent text-[#686C63]/40 cursor-not-allowed'
            }`}
          >
            <RotateCw size={13} strokeWidth={1.75} />
          </button>
          <button
            onClick={onToggleOpen}
            className="p-1.5 text-[#686C63] hover:text-[#20251F] transition-colors"
          >
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>

      {/* Chat Messages Body */}
      {isOpen && (
        <>
          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto font-sans text-xs bg-[#FAF9F5]">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-[3px] shadow-xs leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-[#20251F] text-[#F5F3EE]'
                      : 'bg-[#FFFFFF] border border-[#D5D5CC] text-[#20251F]'
                  }`}
                >
                  {msg.text}

                  {/* Operations Badges */}
                  {msg.operations && msg.operations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#D5D5CC]/60 space-y-1">
                      {msg.operations.map((op, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 text-[10.5px] font-mono text-[#D9534F] bg-[#D9534F]/10 px-2 py-0.5 rounded-[2px]"
                        >
                          <CheckCircle2 size={11} className="shrink-0" />
                          <span>{op.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <span className="text-[10px] font-mono text-[#686C63] mt-0.5 px-1">
                  {msg.timestamp}
                </span>

                {/* Quick Replies */}
                {msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.quickReplies.map((qr, qIdx) => (
                      <button
                        key={qIdx}
                        onClick={() => handleSendMessage(qr)}
                        className="text-[11px] font-mono bg-[#FFFFFF] hover:bg-[#E8E7DF] text-[#20251F] border border-[#D5D5CC] px-2 py-1 rounded-[2px] transition-colors text-left flex items-center gap-1"
                      >
                        <Sparkles size={10} className="text-[#D9534F]" />
                        <span>{qr}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs font-mono text-[#686C63] p-2 bg-[#FFFFFF] border border-[#D5D5CC] rounded-[2px] w-fit">
                <Bot size={13} className="animate-spin text-[#D9534F]" />
                <span>AI analyzing instruction & mutating schema...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="p-3 border-t border-[#D5D5CC] bg-[#FFFFFF] flex items-center gap-2"
          >
            <input
              type="text"
              className="input-editorial text-xs py-2 flex-1"
              placeholder='e.g. "Remove Java from programming languages"'
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="btn-editorial btn-editorial-primary text-xs px-3.5 py-2 shrink-0 disabled:opacity-40"
            >
              <Send size={13} strokeWidth={2} />
              <span className="hidden sm:inline">Apply</span>
            </button>
          </form>
        </>
      )}
    </aside>
  );
};
