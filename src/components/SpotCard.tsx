import { Coffee, Utensils, Beer, Sparkles, MoreHorizontal, Trees, MapPin } from "lucide-react";
import type { Spot } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const categoryIcons = {
  'בית קפה': Coffee,
  'מסעדה': Utensils,
  'בר': Beer,
  'אטרקציה': Sparkles,
  'טבע': Trees,
  'אחר': MoreHorizontal
};

interface SpotCardProps {
  spot: Spot;
  onClick?: () => void;
  isSelected?: boolean;
  distance?: string | null;
  compact?: boolean;
}

export function SpotCard({ spot, onClick, isSelected, distance, compact }: SpotCardProps) {
  const CategoryIcon = categoryIcons[spot.category];

  return (
    <div
      id={`spot-${spot.id}`}
      tabIndex={0}
      role={onClick ? 'button' : undefined}
      aria-pressed={onClick ? !!isSelected : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      className={cn(
        'group relative flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:border-primary/30 sm:hover:-translate-y-0.5',
        isSelected && 'ring-2 ring-primary ring-offset-2 border-transparent',
        // במצב מפה בטלפון הכרטיס הוא חלק מקרוסלה אופקית; מ-sm ומעלה הוא בתוך הרשימה הצדדית
        compact ? 'p-3 w-[74vw] max-w-[280px] sm:w-auto sm:max-w-none sm:p-4' : 'p-4',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
      )}
      onClick={onClick}
    >
      {spot.status === 'under_review' && (
        <Badge
          variant="outline"
          className={cn(
            'absolute top-2 left-2 text-[10px] py-0 px-1.5 bg-yellow-50 text-yellow-800 border-yellow-200 z-10',
            compact && 'hidden sm:inline-flex'
          )}
        >
          בבדיקת מנהלים
        </Badge>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className={cn(
            'flex flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white',
            compact ? 'h-7 w-7 sm:h-8 sm:w-8' : 'h-8 w-8'
          )}>
            <CategoryIcon className={compact ? 'h-3.5 w-3.5 sm:h-4 sm:w-4' : 'h-4 w-4'} />
          </span>
          <div className="min-w-0">
            <h3 className={cn('font-semibold text-gray-900 leading-snug line-clamp-2', compact ? 'text-sm sm:text-base' : 'text-base')}>
              {spot.name}
            </h3>
            <p className={cn('text-gray-500 mt-0.5', compact ? 'text-xs line-clamp-1 sm:text-sm sm:line-clamp-2' : 'text-sm line-clamp-2')}>
              {spot.address}
            </p>
          </div>
        </div>
        {distance && (
          <span className={cn(
            'flex flex-shrink-0 items-center gap-0.5 rounded-full bg-gray-50 px-2 py-0.5 text-gray-500 whitespace-nowrap',
            compact ? 'text-[11px] sm:text-xs' : 'text-xs'
          )}>
            <MapPin className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">מרחק: </span>
            {distance}
          </span>
        )}
      </div>

      <div className={cn('flex flex-wrap gap-1.5 mt-3 mr-[42px]', compact && 'hidden sm:flex')}>
        {spot.kosher_type && ['מהדרין', 'רבנות'].includes(spot.kosher_type) && (
          <span className={cn(
            'px-2 py-0.5 rounded-full text-white text-xs font-medium',
            spot.kosher_type === 'מהדרין' ? 'bg-emerald-600' : 'bg-blue-600'
          )}>
            {spot.kosher_type}
          </span>
        )}
        {spot.suitable_for_first_date && (
          <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-800 rounded-full">
            מתאים לדייט ראשון
          </span>
        )}
        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
          {spot.price_range === 'חינם' ? <><span aria-hidden="true">🆓 </span>חינם</> : (
            <>
              <span aria-hidden="true">{'₪'.repeat(spot.price_range === 'זול' ? 1 : spot.price_range === 'בינוני' ? 2 : 3)}</span>
              <span className="sr-only">מחיר: {spot.price_range}</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
