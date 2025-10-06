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

type PDFFile = {
  name: string;
  size: number;
  lastModified: number;
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
    <div className="relative min-h-screen max-w-7xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h2 className="text-xl font-semibold text-gray-800">PDF Chat</h2>
        <p className="text-sm text-gray-500">Upload a PDF and ask questions about it</p>
      </div>

      <div className="flex flex-1">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" style={{ paddingBottom: '80px' }}>
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 p-6 bg-white rounded-lg shadow-sm max-w-md mx-auto">
                <FileText className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <p>Upload a PDF and start asking questions about it</p>
                <p className="text-sm text-gray-400 mt-1">Supported formats: .pdf</p>
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
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.isUser
                        ? 'bg-blue-500 text-white rounded-tr-none'
                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                    } shadow-sm`}
                  >
                    <div className="break-words">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
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
              <div className="bg-white text-gray-800 rounded-lg p-3 rounded-tl-none shadow-sm border border-gray-200">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-80 p-4 bg-gray-50 border-l" style={{ paddingBottom: '80px' }}>
          <label className={`flex flex-col items-center px-6 py-8 rounded-lg border-2 border-dashed ${isUploading ? 'border-gray-300' : 'border-blue-300 hover:border-blue-400 cursor-pointer'} bg-white transition-colors`}>
            <Upload className={`w-10 h-10 mb-3 ${isUploading ? 'text-gray-400' : 'text-blue-500'}`} />
            <span className={`text-sm ${isUploading ? 'text-gray-500' : 'text-gray-600'}`}>
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
            <div className="mt-3 flex items-center text-sm bg-white p-3 rounded-lg border border-gray-200">
              <FileText className="w-5 h-5 mr-2 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB • {file.lastModified ? new Date(file.lastModified).toLocaleDateString() : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="absolute bottom-0 left-0 p-4 border-t border-gray-200 bg-white" style={{ right: '320px' }}>
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the PDF..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!file || isUploading || sendMessage.isPending || isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || !file || isUploading || sendMessage.isPending || isStreaming}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default PDFChat;
