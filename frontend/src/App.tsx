import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { Home } from './pages/Home';
import { ChatWithAI } from './pages/ChatWithAI';
import { PDFChat } from './pages/PDFChat';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50 w-full max-w-none">
          <nav className="bg-white shadow-sm w-full">
            <div className="w-full max-w-none px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <h1 className="text-xl font-bold text-gray-900">AI Kitchen</h1>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <Link
                      to="/"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Home
                    </Link>
                    <Link
                      to="/chat"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Chat with AI
                    </Link>
                    <Link
                      to="/pdf-chat"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      PDF Chat
                    </Link>
                  </div>
                </div>
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
