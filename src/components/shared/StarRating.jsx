import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ rating = 0, maxStars = 5, size = 16, interactive = false, onChange }) {
  const [hovered, setHovered] = React.useState(0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1;
        const filled = interactive ? starValue <= (hovered || rating) : starValue <= rating;
        const halfFilled = !interactive && !filled && starValue - 0.5 <= rating;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            className={`transition-colors duration-150 ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
            onClick={() => interactive && onChange?.(starValue)}
            onMouseEnter={() => interactive && setHovered(starValue)}
            onMouseLeave={() => interactive && setHovered(0)}
          >
            <Star
              size={size}
              className={
                filled
                  ? 'fill-yellow-400 text-yellow-400'
                  : halfFilled
                  ? 'fill-yellow-400/50 text-yellow-400'
                  : 'text-muted-foreground/30'
              }
            />
          </button>
        );
      })}
    </div>
  );
}