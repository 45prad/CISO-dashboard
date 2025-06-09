import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MediaPreview = ({ filepath }) => {
  const apiUrl = import.meta.env.VITE_BACKENDURL;
  const [blobUrl, setBlobUrl] = useState(null);

  const fetchProtectedMedia = async (filepath) => {
    try {
      const url = `${apiUrl}${filepath.startsWith('/') ? filepath : '/' + filepath}`;

      const response = await axios.get(url, {
        responseType: 'blob',
      });

      const blobUrl = URL.createObjectURL(response.data);
      return blobUrl;
    } catch (err) {
      console.error('Error fetching media:', err);
      return null;
    }
  };

  useEffect(() => {
    let currentUrl;

    const loadMedia = async () => {
      const url = await fetchProtectedMedia(filepath);
      setBlobUrl(url);
      currentUrl = url;
    };

    if (filepath) {
      loadMedia();
    }

    return () => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [filepath]);

  // Simple check based on file extension
  const isVideo = filepath?.match(/\.(mp4|webm|ogg)$/i);

  if (!blobUrl) return <p>Loading media...</p>;

  return isVideo ? (
    <video src={blobUrl} controls className="w-full max-w-md rounded-lg shadow mr-4 border border-1" />
  ) : (
    <img src={blobUrl} alt="Media Preview" className="w-full max-w-md rounded-lg shadow mr-4 border border-1" />
  );
};

export default MediaPreview;
