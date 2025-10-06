import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { chatWithFile } from '../api';

export default function ChatWithFile({ filename }) {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const mutation = useMutation({
    mutationFn: chatWithFile,
    onSuccess: (data) => setAnswer(data.answer),
    onError: () => setAnswer('Error retrieving answer'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ filename, query });
  };

  return (
    <div>
      <h3>Chat with File: {filename}</h3>
      <form onSubmit={handleSubmit}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ask something about the file..."
        />
        <button type="submit" disabled={mutation.isLoading}>Ask</button>
      </form>
      {answer && <div><b>Answer:</b> {answer}</div>}
    </div>
  );
}
