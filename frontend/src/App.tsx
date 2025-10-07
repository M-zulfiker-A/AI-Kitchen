import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { Home } from './pages/Home';
import { ChatWithAI } from './pages/ChatWithAI';
import { PDFChat } from './pages/PDFChat';
import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

const queryClient = new QueryClient();

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Check for saved theme preference or use system preference
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply dark mode class to html element
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background text-foreground transition-colors duration-200 w-full max-w-none">
          <nav className="bg-card border-b border-border shadow-sm w-full">
            <div className="w-full max-w-none px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <h1 className="text-xl font-bold">AI Kitchen</h1>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <Link
                      to="/"
                      className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors hover:text-primary border-transparent text-muted-foreground hover:border-primary"
                    >
                      Home
                    </Link>
                    <Link
                      to="/chat"
                      className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors hover:text-primary border-transparent text-muted-foreground hover:border-primary"
                    >
                      Chat with AI
                    </Link>
                    <Link
                      to="/pdf-chat"
                      className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors hover:text-primary border-transparent text-muted-foreground hover:border-primary"
                    >
                      PDF Chat
                    </Link>
                  </div>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-full hover:bg-accent transition-colors border border-border bg-card"
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? (
                    <Sun className="h-5 w-5 text-yellow-400" />
                  ) : (
                    <Moon className="h-5 w-5 text-slate-700" />
                  )}
                </button>
              </div>
            </div>
          </nav>

          <main className="w-full max-w-none px-4 py-6 sm:px-6 lg:px-8">
            <div className="w-full max-w-none">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/chat" element={<ChatWithAI />} />
                <Route path="/pdf-chat" element={<PDFChat />} />
              </Routes>
            </div>
          </main>
        </div>
      </Router>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;
