import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { chatAI } from '../api';

export default function ChatAI() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const mutation = useMutation({
    mutationFn: chatAI,
    onSuccess: (data) => setAnswer(data.answer),
    onError: () => setAnswer('Error retrieving answer'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(query);
  };

  return (
    <div>
      <h3>Normal AI Chat</h3>
      <form onSubmit={handleSubmit}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ask anything..."
        />
        <button type="submit" disabled={mutation.isLoading}>Ask</button>
      </form>
      {answer && <div><b>Answer:</b> {answer}</div>}
    </div>
  );
}
