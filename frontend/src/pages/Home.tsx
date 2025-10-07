import { Link } from 'react-router-dom';
import { MessageSquare, FileText, Sparkles } from 'lucide-react';

export function Home() {
  return (
    <div className="w-full text-center py-12">
      <div className="mb-8">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="w-12 h-12 text-primary mr-3" />
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
          Welcome to AI Kitchen
        </h1>
        <p className="text-xl text-muted-foreground mb-2">Choose an option to get started:</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto px-4">
        <Link
          to="/chat"
          className="group p-8 bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-border hover:border-primary/50 hover:scale-105"
        >
          <div className="flex flex-col items-center">
            <div className="p-4 bg-primary/10 rounded-full mb-4 group-hover:bg-primary/20 transition-colors">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2 group-hover:text-primary transition-colors">Chat with AI</h2>
            <p className="text-muted-foreground">Have a conversation with our AI assistant</p>
          </div>
        </Link>
        
        <Link
          to="/pdf-chat"
          className="group p-8 bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-border hover:border-primary/50 hover:scale-105"
        >
          <div className="flex flex-col items-center">
            <div className="p-4 bg-secondary/10 rounded-full mb-4 group-hover:bg-secondary/20 transition-colors">
              <FileText className="w-8 h-8 text-secondary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2 group-hover:text-secondary transition-colors">PDF Chat</h2>
            <p className="text-muted-foreground">Upload and chat with your PDF documents</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default Home;
