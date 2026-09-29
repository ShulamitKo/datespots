import { useEffect } from 'react';

const SITE_TITLE = 'DateSpots - מקומות לדייטים';

// כותרת ייחודית לכל דף (WCAG 2.4.2) - קוראי מסך מכריזים עליה במעבר בין דפים
export function usePageTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} | DateSpots` : SITE_TITLE;
  }, [title]);
}
