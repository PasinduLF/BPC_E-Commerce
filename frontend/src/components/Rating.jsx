import { Star } from 'lucide-react';

const Rating = ({ value, text, size = 16, className = "" }) => {
    const filled = Math.round(Number(value || 0));
    
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="flex items-center gap-1 text-gold">
                {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                        key={idx}
                        size={size}
                        fill={idx < filled ? 'currentColor' : 'none'}
                        className={idx < filled ? 'text-gold' : 'text-muted/40'}
                    />
                ))}
            </div>
            {text && <span className="text-xs font-semibold text-secondary">{text}</span>}
        </div>
    );
};

export default Rating;
