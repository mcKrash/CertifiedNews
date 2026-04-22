'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CATEGORIES = [
  { id: 'world', label: 'World', icon: '🌍' },
  { id: 'politics', label: 'Politics', icon: '🏛️' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'technology', label: 'Technology', icon: '💻' },
  { id: 'science', label: 'Science', icon: '🔬' },
  { id: 'environment', label: 'Environment', icon: '🌱' },
  { id: 'sport', label: 'Sport', icon: '⚽' },
  { id: 'culture', label: 'Culture', icon: '🎭' },
  { id: 'opinion', label: 'Opinion', icon: '💭' },
  { id: 'health', label: 'Health', icon: '🏥' },
];

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  React.useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      container?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="relative flex items-center gap-2">
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1 shadow-md hover:shadow-lg transition-shadow"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide px-8"
          >
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? 'bg-teal-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{category.icon}</span>
                <span className="text-sm font-medium">{category.label}</span>
              </button>
            ))}
          </div>

          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1 shadow-md hover:shadow-lg transition-shadow"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
