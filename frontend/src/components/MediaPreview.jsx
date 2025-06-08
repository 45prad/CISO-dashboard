import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MediaPreview = ({ filepath }) => {
  const apiUrl = import.meta.env.VITE_BACKENDURL;
  const [blobUrl, setBlobUrl] = useState(null);

  const fetchProtectedImage = async (filepath) => {
    try {
      const url = `${apiUrl}${filepath.startsWith('/') ? filepath : '/' + filepath}`;

      const response = await axios.get(url, {
        responseType: 'blob',
      });

      const blobUrl = URL.createObjectURL(response.data);
      return blobUrl;
    } catch (err) {
      console.error('Error fetching image:', err);
      return null;
    }
  };

  useEffect(() => {
    let currentUrl;

    const loadImage = async () => {
      const url = await fetchProtectedImage(filepath);
      setBlobUrl(url);
      currentUrl = url;
    };

    if (filepath) {
      loadImage();
    }

    return () => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [filepath]);

  return blobUrl ? (
    <img src={blobUrl} alt="Media Preview" className="w-full max-w-md" />
  ) : (
    <p>Loading image...</p>
  );
};

export default MediaPreview;
