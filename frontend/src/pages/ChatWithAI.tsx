import { useEffect, useRef, useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { chatWithAIStream } from '@/lib/api';

type Message = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
};

export function ChatWithAI() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    endRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    // Auto-scroll when messages change or streaming state updates
    scrollToBottom(isStreaming ? 'auto' : 'smooth');
  }, [messages, isStreaming]);

  const handleStream = async (message: string) => {
    const userMessage: Message = {
      id: `${Date.now()}`,
      content: message,
      isUser: true,
      timestamp: new Date(),
    };

    const assistantId = `${Date.now()}-assistant`;
    const assistantMessage: Message = {
      id: assistantId,
      content: '',
      isUser: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);
    setInput('');

    try {
      for await (const token of chatWithAIStream(message)) {
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: m.content + token } : m
        ));
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: 'Sorry, something went wrong.' } : m
      ));
      console.error('Streaming error:', err);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    await handleStream(input.trim());
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] w-full bg-card rounded-xl shadow-xl overflow-hidden border border-border">
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <h2 className="text-xl font-semibold">AI Assistant</h2>
        <p className="text-sm text-muted-foreground">Ask me anything!</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Start a conversation with the AI assistant</p>
              <p className="text-sm mt-2 opacity-70">Type a message below to begin</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-4 ${
                    message.isUser
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-card text-card-foreground rounded-tl-sm border border-border'
                  } shadow-md`}
                >
                  <div className="break-words">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-2 ${message.isUser ? 'opacity-80' : 'text-muted-foreground'}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-card text-card-foreground rounded-2xl p-4 rounded-tl-sm shadow-md border border-border">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}

        {/* Auto-scroll sentinel */}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-md hover:shadow-lg"
          >
            <Send className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatWithAI;
