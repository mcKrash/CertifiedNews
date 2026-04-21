'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, Image as ImageIcon, Link as LinkIcon, X } from 'lucide-react';

interface EnhancedPostFormProps {
  userType: 'REGULAR_USER' | 'JOURNALIST' | 'AGENCY';
  isVerified: boolean;
  onSubmit: (content: string, images: File[], links: string[]) => Promise<void>;
}

export default function EnhancedPostForm({ userType, isVerified, onSubmit }: EnhancedPostFormProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [currentLink, setCurrentLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      const maxImages = 4;
      
      if (images.length + newImages.length > maxImages) {
        setError(`Maximum ${maxImages} images allowed`);
        return;
      }

      setImages(prev => [...prev, ...newImages]);

      // Create previews
      newImages.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addLink = () => {
    if (currentLink.trim()) {
      try {
        new URL(currentLink);
        if (links.length < 3) {
          setLinks(prev => [...prev, currentLink]);
          setCurrentLink('');
        } else {
          setError('Maximum 3 links allowed');
        }
      } catch {
        setError('Invalid URL format');
      }
    }
  };

  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Please write something');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit(content, images, links);
      setContent('');
      setImages([]);
      setImagePreviews([]);
      setLinks([]);
    } catch (err: any) {
      setError(err.message || 'Failed to post');
    } finally {
      setLoading(false);
    }
  };

  const getVerificationBadge = () => {
    if (userType === 'REGULAR_USER') return null;
    
    if (isVerified) {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
          ✓ Verified {userType === 'JOURNALIST' ? 'Journalist' : 'Agency'}
        </div>
      );
    }

    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
        ⏳ Pending Verification
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border p-4" style={{ borderColor: '#E0E6ED' }}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">Create a Post</h3>
          {getVerificationBadge()}
        </div>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-md text-red-600 text-sm" style={{ backgroundColor: '#FFE5E5' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Content Textarea */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts, news, or insights..."
          rows={4}
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4A0] resize-none"
          style={{ borderColor: '#E0E6ED' }}
        />

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <Image
                  src={preview}
                  alt={`Preview ${index}`}
                  width={100}
                  height={100}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Links Section */}
        {links.length > 0 && (
          <div className="mt-4 space-y-2">
            {links.map((link, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg" style={{ backgroundColor: '#F5F7FA' }}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <LinkIcon size={16} className="text-gray-400 flex-shrink-0" />
                  <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-[#00B4A0] truncate hover:underline">
                    {link}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Link Input */}
        <div className="mt-4 flex gap-2">
          <input
            type="url"
            value={currentLink}
            onChange={(e) => setCurrentLink(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addLink()}
            placeholder="Add a link (optional)"
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4A0]"
            style={{ borderColor: '#E0E6ED' }}
          />
          <button
            type="button"
            onClick={addLink}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
          >
            Add Link
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                disabled={images.length >= 4}
              />
              <div className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium" style={{ backgroundColor: images.length >= 4 ? '#E0E6ED' : undefined }}>
                <ImageIcon size={18} />
                Images ({images.length}/4)
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="px-6 py-2 bg-[#00B4A0] text-white rounded-lg font-medium hover:bg-[#009985] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
        <p className="font-medium mb-1">💡 Tips for better engagement:</p>
        <ul className="text-xs space-y-1 ml-4">
          <li>• Include relevant links to source articles</li>
          <li>• Add images to increase visibility</li>
          <li>• Be factual and cite your sources</li>
          {userType !== 'REGULAR_USER' && <li>• Your posts will be labeled with your verification status</li>}
        </ul>
      </div>
    </div>
  );
}
