
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FileUpload from './components/FileUpload';
import ChatWithFile from './components/ChatWithFile';
import ChatAI from './components/ChatAI';

const queryClient = new QueryClient();

function App() {
  const [uploadedFile, setUploadedFile] = useState(null);

  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ maxWidth: 600, margin: '2rem auto', padding: 20 }}>
        <h1>AI-Kitchen Demo</h1>
        <FileUpload onUpload={setUploadedFile} />
        {uploadedFile && <ChatWithFile filename={uploadedFile} />}
        <hr style={{ margin: '2rem 0' }} />
        <ChatAI />
      </div>
    </QueryClientProvider>
  );
}

export default App;
