import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="w-full text-center py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Welcome to AI Kitchen</h1>
      <p className="text-xl text-gray-600 mb-8">Choose an option to get started:</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto px-4">
        <Link
          to="/chat"
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Chat with AI</h2>
          <p className="text-gray-600">Have a conversation with our AI assistant</p>
        </Link>
        
        <Link
          to="/pdf-chat"
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-2">PDF Chat</h2>
          <p className="text-gray-600">Upload and chat with your PDF documents</p>
        </Link>
      </div>
    </div>
  );
}

export default Home;
