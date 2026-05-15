import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Dot
} from 'recharts';

const REVIEWS_DATA = [
  { id: 1, user: 'Carlos M.', date: '2026-05-10', rating: 5, text: 'Excellent service! The detailing was perfect and my bike looks brand new. The specialist was very professional.', verified: true, helpful: 24 },
  { id: 2, user: 'Ana R.', date: '2026-05-08', rating: 4, text: 'Great work overall. The service was thorough but took a bit longer than expected.', verified: true, helpful: 15 },
  { id: 3, user: 'Diego F.', date: '2026-05-05', rating: 5, text: 'Best maintenance service I\'ve had for my motorcycle. Highly recommend!', verified: true, helpful: 31 },
  { id: 4, user: 'Sofia L.', date: '2026-04-28', rating: 3, text: 'Service was okay. Nothing extraordinary, but they did what was asked.', verified: false, helpful: 8 },
  { id: 5, user: 'Pedro V.', date: '2026-04-20', rating: 5, text: 'Outstanding experience! The team is very knowledgeable and friendly.', verified: true, helpful: 18 },
  { id: 6, user: 'María G.', date: '2026-04-15', rating: 2, text: 'Disappointed with the wait time, but the final result was decent.', verified: true, helpful: 5 }
];

const RATINGS_HISTORY = [
  { month: 'Sep', score: 4.1, reviews: 12 },
  { month: 'Oct', score: 4.0, reviews: 15 },
  { month: 'Nov', score: 4.2, reviews: 18 },
  { month: 'Dec', score: 4.3, reviews: 20 },
  { month: 'Jan', score: 4.4, reviews: 14 },
  { month: 'Feb', score: 4.3, reviews: 16 },
  { month: 'Mar', score: 4.5, reviews: 19 },
  { month: 'Apr', score: 4.7, reviews: 22 }
];

const getInitials = (name) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getColorForUser = (name) => {
  const colors = [
    '#2563eb', '#1D9E75', '#EF9F27', '#7C3AED', '#E24B4A',
    '#378ADD', '#10B981', '#F59E0B', '#8B5CF6', '#DC2626'
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const ReviewsAndRatings = () => {
  const [reviews, setReviews] = useState(REVIEWS_DATA);
  const [activeFilter, setActiveFilter] = useState('all');
  const [helpfulMap, setHelpfulMap] = useState(
    REVIEWS_DATA.reduce((acc, r) => ({ ...acc, [r.id]: false }), {})
  );

  const totalReviews = reviews.length;
  const averageScore = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
  const trend = 0.4;
  const recommendationPercent = 92;

  const starDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length
  }));

  const filteredReviews = reviews.filter(review => {
    if (activeFilter === 'all') return true;
    if (activeFilter === '5') return review.rating === 5;
    if (activeFilter === '4') return review.rating === 4;
    if (activeFilter === '3-less') return review.rating <= 3;
    if (activeFilter === 'verified') return review.verified;
    return true;
  });

  const handleHelpful = (id) => {
    setHelpfulMap(prev => ({ ...prev, [id]: !prev[id] }));
    setReviews(prev =>
      prev.map(r =>
        r.id === id ? { ...r, helpful: prev[id] ? r.helpful - 1 : r.helpful + 1 } : r
      )
    );
  };

  const StarRating = ({ rating, size = 'md', interactive = false }) => {
    const starSize = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <svg
            key={star}
            className={`${starSize} ${star <= rating ? 'text-[#EF9F27]' : 'text-[#3a3d4a]'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1117] py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Summary Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-[#111827] border border-[#2a2d3a] rounded-2xl p-6">
          {/* Large Score */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="text-5xl font-black text-[#EF9F27]">
              {averageScore.toFixed(1)}
            </div>
            <div className="text-sm text-[#94A3B8]">/ 5</div>
            <StarRating rating={Math.round(averageScore)} size="lg" />
            <div className="text-[#94A3B8] text-sm mt-2">
              {totalReviews} reviews
            </div>
          </div>

          {/* Distribution */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-slate-900 dark:text-[#F8FAFC]">
              Star Distribution
            </div>
            {starDistribution.map(({ star, count }) => {
              const percentage = (count / totalReviews) * 100;
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="w-8 text-right text-sm text-slate-600 dark:text-[#94A3B8]">
                    {star}★
                  </div>
                  <div className="flex-1 h-2 bg-[#1a1d27] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#EF9F27] rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-12 text-sm text-slate-600 dark:text-[#94A3B8]">
                    {count} ({percentage.toFixed(0)}%)
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trend & Recommendation */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-slate-900 dark:text-[#F8FAFC]">
              Overview
            </div>
            <div className="flex items-center gap-3">
              <svg
                className={`w-5 h-5 ${trend > 0 ? 'text-[#1D9E75]' : 'text-[#E24B4A]'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={trend > 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"}
                />
              </svg>
              <span className={`font-bold ${trend > 0 ? 'text-[#1D9E75]' : 'text-[#E24B4A]'}`}>
                {trend > 0 ? '+' : ''}{trend} vs last month
              </span>
            </div>
            <div className="pt-4 border-t border-[#2a2d3a]">
              <div className="text-3xl font-black text-[#1D9E75]">
                {recommendationPercent}%
              </div>
              <div className="text-sm text-[#94A3B8]">
                of users recommend
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {['all', '5', '4', '3-less', 'verified'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full border transition-all ${
                activeFilter === filter
                  ? 'bg-[#2563eb] border-[#2563eb] text-white'
                  : 'bg-transparent border-[#2a2d3a] text-[#94A3B8] hover:border-[#3a3d4a] hover:text-[#F8FAFC]'
              }`}
            >
              {filter === 'all' && 'All'}
              {filter === '5' && '5 stars'}
              {filter === '4' && '4 stars'}
              {filter === '3-less' && '3 or less'}
              {filter === 'verified' && 'Verified only'}
            </button>
          ))}
        </div>

        {/* Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map(review => (
            <div
              key={review.id}
              className="bg-white dark:bg-[#111827] border border-[#2a2d3a] rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: getColorForUser(review.user) }}
                  >
                    {getInitials(review.user)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-[#F8FAFC]">
                      {review.user}
                    </div>
                    <div className="text-xs text-[#94A3B8]">
                      {formatDate(review.date)}
                    </div>
                  </div>
                </div>
                <StarRating rating={review.rating} size="sm" />
              </div>

              <div className="text-sm text-slate-700 dark:text-[#F8FAFC] leading-relaxed">
                {review.text}
              </div>

              <div className="flex items-center justify-between">
                {review.verified && (
                  <span className="inline-flex items-center gap-1 text-[#1D9E75] text-xs font-bold uppercase tracking-wider">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Verified purchase
                  </span>
                )}
                <button
                  onClick={() => handleHelpful(review.id)}
                  className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                    helpfulMap[review.id]
                      ? 'text-[#2563eb]'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  Helpful ({review.helpful})
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Ratings History */}
        <div className="space-y-6 bg-white dark:bg-[#111827] border border-[#2a2d3a] rounded-2xl p-6">
          <div className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
            Ratings History
          </div>

          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={RATINGS_HISTORY}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#94A3B8"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94A3B8"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  domain={[3, 5]}
                  tickCount={3}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1117',
                    border: '1px solid #2a2d3a',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#94A3B8' }}
                  itemStyle={{ color: '#2563eb' }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fill="url(#colorScore)"
                  activeDot={{ r: 6 }}
                >
                  {RATINGS_HISTORY.map((entry, index) => (
                    <Dot key={`dot-${index}`} r={4} fill="#2563eb" />
                  ))}
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* History Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#2a2d3a]">
                  <th className="pb-3 text-xs font-bold text-[#94A3B8] uppercase tracking-widest">
                    Month
                  </th>
                  <th className="pb-3 text-xs font-bold text-[#94A3B8] uppercase tracking-widest text-center">
                    Star Rating
                  </th>
                  <th className="pb-3 text-xs font-bold text-[#94A3B8] uppercase tracking-widest text-center">
                    # of Reviews
                  </th>
                  <th className="pb-3 text-xs font-bold text-[#94A3B8] uppercase tracking-widest text-center">
                    Delta
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2d3a]">
                {RATINGS_HISTORY.map((item, index) => {
                  const prev = index > 0 ? RATINGS_HISTORY[index - 1] : null;
                  const delta = prev ? item.score - prev.score : 0;
                  const deltaColor = delta > 0 ? 'text-[#1D9E75]' : delta < 0 ? 'text-[#E24B4A]' : 'text-[#94A3B8]';
                  const deltaIcon = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';

                  return (
                    <tr key={item.month} className="hover:bg-[#1a1d27]/50 transition-colors">
                      <td className="py-3 text-sm text-slate-700 dark:text-[#F8FAFC]">
                        {item.month} 2026
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-sm font-bold text-[#EF9F27]">
                            {item.score.toFixed(1)}
                          </span>
                          <StarRating rating={Math.round(item.score)} size="sm" />
                        </div>
                      </td>
                      <td className="py-3 text-center text-sm text-slate-700 dark:text-[#F8FAFC]">
                        {item.reviews}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`text-sm font-bold ${deltaColor}`}>
                          {deltaIcon} {Math.abs(delta).toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsAndRatings;
