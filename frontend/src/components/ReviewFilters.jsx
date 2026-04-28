import { Star } from 'lucide-react';
import { useState } from 'react';

const ReviewFilters = ({ 
    reviews = [], 
    onFilterChange = () => {},
    onSortChange = () => {}
}) => {
    const [selectedRating, setSelectedRating] = useState(null);
    const [sortBy, setSortBy] = useState('recent');
    const handleRatingFilter = (rating) => {
        const newRating = selectedRating === rating ? null : rating;
        setSelectedRating(newRating);
        onFilterChange(newRating, sortBy);
    };

    const handleSortChange = (sort) => {
        setSortBy(sort);
        onFilterChange(selectedRating, sort);
        onSortChange(sort);
    };

    const ratingCounts = {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length,
    };

    return (
        <div className="space-y-6">
            {/* Rating Filter */}
            <div className="bg-surface border border-default rounded-xl p-4">
                <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                    <Star size={18} className="text-gold" />
                    Filter by Rating
                </h3>
                <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map(rating => (
                        <button
                            key={rating}
                            onClick={() => handleRatingFilter(rating)}
                            className={`w-full text-left p-2.5 rounded-lg border-2 transition-all flex items-center justify-between ${
                                selectedRating === rating
                                    ? 'border-brand bg-brand-subtle'
                                    : 'border-default hover:border-brand'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <div className="flex gap-0.5">
                                    {[...Array(rating)].map((_, i) => (
                                        <Star key={i} size={14} className="fill-gold text-gold" />
                                    ))}
                                    {[...Array(5 - rating)].map((_, i) => (
                                        <Star key={i + rating} size={14} className="text-muted" />
                                    ))}
                                </div>
                                <span className="text-sm font-medium text-secondary">{rating} Star</span>
                            </div>
                            <span className="text-xs font-bold bg-muted rounded px-2 py-1 text-tertiary">
                                {ratingCounts[rating]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Sort Options */}
            <div className="bg-surface border border-default rounded-xl p-4">
                <h3 className="font-bold text-primary mb-4">Sort Reviews</h3>
                <div className="space-y-2">
                    {[
                        { value: 'recent', label: 'Most Recent' },
                        { value: 'helpful', label: 'Most Helpful' },
                        { value: 'highest', label: 'Highest Rated' },
                        { value: 'lowest', label: 'Lowest Rated' }
                    ].map(option => (
                        <button
                            key={option.value}
                            onClick={() => handleSortChange(option.value)}
                            className={`w-full text-left p-2.5 rounded-lg border-2 transition-all ${
                                sortBy === option.value
                                    ? 'border-brand bg-brand-subtle text-brand'
                                    : 'border-default text-secondary hover:border-brand'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReviewFilters;
