import React, { useState } from 'react';

const StarRating = ({ value, onChange, readOnly, size = 'md' }) => {
  const [hoverValue, setHoverValue] = useState(0);
  const sizePx = size === 'sm' ? 14 : 18;
  const gapSize = size === 'sm' ? 'gap-1' : 'gap-1';

  const stars = [1, 2, 3, 4, 5];

  const getStarIcon = (starValue) => {
    const isFilled = (hoverValue || value) >= starValue;
    return (
      <svg
        key={starValue}
        width={sizePx}
        height={sizePx}
        viewBox="0 0 24 24"
        fill={isFilled ? '#EF9F27' : '#3a3d4a'}
        stroke={isFilled ? '#EF9F27' : '#3a3d4a'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={!readOnly ? 'cursor-pointer transition-colors' : ''}
        onMouseEnter={() => !readOnly && setHoverValue(starValue)}
        onMouseLeave={() => !readOnly && setHoverValue(0)}
        onClick={() => !readOnly && onChange && onChange(starValue)}
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  };

  return (
    <div className={`flex items-center ${gapSize}`}>
      {stars.map(getStarIcon)}
    </div>
  );
};

export default StarRating;
