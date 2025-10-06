import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { uploadFile } from '../api';

export default function FileUpload({ onUpload }) {
  const fileInput = useRef();
  const [message, setMessage] = useState('');
  const mutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: (data) => {
      setMessage(data.message);
      onUpload && onUpload(data.filename);
    },
    onError: (e) => setMessage('Upload failed'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (fileInput.current.files.length === 0) return;
    mutation.mutate(fileInput.current.files[0]);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" ref={fileInput} accept=".pdf,.txt" />
      <button type="submit" disabled={mutation.isLoading}>Upload</button>
      {message && <div>{message}</div>}
    </form>
  );
}
