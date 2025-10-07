import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Upload, Send, FileText } from 'lucide-react';
import { uploadAndProcessPDF, chatWithPDFStream, type PDFSource } from '@/lib/api';

type Message = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
};

export function PDFChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      const result = await uploadAndProcessPDF(file);
      return {
        name: result.filename,
        size: file.size,
        lastModified: file.lastModified,
        id: result.id
      };
    },
    onSuccess: (fileInfo) => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          content: `I've uploaded the file: ${fileInfo.name} (${(fileInfo.size / 1024).toFixed(2)} KB)`,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
      setIsUploading(false);
    },
    onError: () => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          content: 'Failed to upload file. Please try again.',
          isUser: false,
          timestamp: new Date(),
        },
      ]);
      setIsUploading(false);
    },
  });

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      if (!file) {
        return { text: 'Please upload a PDF file first before asking questions about it.', sources: [] as PDFSource[] };
      }

      // Create user and assistant placeholders
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

      let finalSources: PDFSource[] = [];
      try {
        for await (const ev of chatWithPDFStream(message)) {
          if (ev.error) throw new Error(ev.error);
          if (ev.content) {
            setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + ev.content } : m));
          }
          if (ev.done) {
            finalSources = ev.sources ?? [];
          }
        }
      } finally {
        setIsStreaming(false);
      }

      return { text: 'OK', sources: finalSources };
    },
    onSuccess: (result) => {
      // Append sources as a separate assistant message (if any)
      if (result?.sources && result.sources.length > 0) {
        const sourcesText = result.sources
          .map((s, i) => `• Source ${i + 1} (${s.filename}):\n${s.text}`)
          .join('\n\n');
        setMessages(prev => [
          ...prev,
          {
            id: `${Date.now()}-sources`,
            content: `References:\n\n${sourcesText}`,
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      }
    },
    onError: (err: unknown) => {
      setIsStreaming(false);
      setMessages(prev => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          content: `Sorry, something went wrong: ${err instanceof Error ? err.message : 'Unknown error'}`,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      uploadFile.mutate(selectedFile);
    } else if (selectedFile) {
      alert('Please upload a PDF file');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !sendMessage.isPending && !isStreaming) {
      sendMessage.mutate(input);
    }
  };

  return (
    <div className="relative min-h-screen max-w-7xl mx-auto bg-card rounded-xl shadow-xl overflow-hidden border border-border">
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <h2 className="text-xl font-semibold">PDF Chat</h2>
        <p className="text-sm text-muted-foreground">Upload a PDF and ask questions about it</p>
      </div>

      <div className="flex flex-1">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50" style={{ paddingBottom: '80px' }}>
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground p-8 bg-card rounded-xl shadow-lg max-w-md mx-auto border border-border">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Upload a PDF and start asking questions about it</p>
                <p className="text-sm opacity-70">Supported formats: .pdf</p>
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
                    className={`max-w-[80%] rounded-2xl p-4 ${
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
          
          {(sendMessage.isPending || uploadFile.isPending || isStreaming) && (
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
        </div>

        <div className="w-80 p-4 bg-background/50 border-l border-border" style={{ paddingBottom: '80px' }}>
          <label className={`flex flex-col items-center px-6 py-8 rounded-xl border-2 border-dashed ${isUploading ? 'border-border' : 'border-primary/50 hover:border-primary cursor-pointer'} bg-card transition-all hover:shadow-lg`}>
            <Upload className={`w-12 h-12 mb-3 ${isUploading ? 'text-muted-foreground' : 'text-primary'}`} />
            <span className={`text-sm font-medium ${isUploading ? 'text-muted-foreground' : ''}`}>
              {isUploading ? 'Uploading...' : (file ? 'Change PDF file' : 'Click to upload a PDF')}
            </span>
            <input 
              type="file" 
              className="hidden" 
              accept=".pdf" 
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
          
          {file && (
            <div className="mt-4 flex items-center text-sm bg-card p-4 rounded-xl border border-border shadow-md">
              <FileText className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(file.size / 1024).toFixed(2)} KB • {file.lastModified ? new Date(file.lastModified).toLocaleDateString() : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="absolute bottom-0 left-0 p-4 border-t border-border bg-card/50 backdrop-blur-sm" style={{ right: '320px' }}>
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the PDF..."
            className="flex-1 p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground"
            disabled={!file || isUploading || sendMessage.isPending || isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || !file || isUploading || sendMessage.isPending || isStreaming}
            className="px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-md hover:shadow-lg"
          >
            <Send className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default PDFChat;
