import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Coffee, Utensils, Beer, Sparkles, MoreHorizontal, Trees, ArrowUpDown, MapPin, List, Map, X, ScrollText, FileText, RotateCcw, Search } from "lucide-react";
import type { Spot } from "@/lib/supabase/types";
import { spotsTable } from "@/lib/supabase/config";
import { SpotCard } from '@/components/SpotCard';
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import { Badge } from "@/components/ui/badge";
import { FilterBar } from "@/components/FilterBar";
import { AboutDialog } from "@/components/AboutDialog";
import { TermsDialog } from "@/components/TermsDialog";
import { type Filters } from '@/lib/types';

// Custom icons for different categories
const categoryIcons = {
  'בית קפה': new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  'מסעדה': new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  'בר': new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  'אטרקציה': new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  'טבע': new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  'אחר': new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
} as const;

const categoryIcons2 = {
  'בית קפה': Coffee,
  'מסעדה': Utensils,
  'בר': Beer,
  'אטרקציה': Sparkles,
  'טבע': Trees,
  'אחר': MoreHorizontal
} as const;

// Component to handle map bounds
function MapBoundsHandler({ spots, resetMap }: { spots: Spot[], resetMap: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (spots.length === 0) return;

    const bounds = L.latLngBounds(spots.map(spot => [spot.latitude, spot.longitude]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [spots, map, resetMap]);

  return null;
}

export default function HomePage() {
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<Filters>(() => {
    // טעינת הפילטרים מ-localStorage בעת טעינת הדף
    const savedFilters = localStorage.getItem('spotFilters');
    if (savedFilters) {
      return JSON.parse(savedFilters);
    }
    return {
      search: "",
      categories: [],
      regions: [],
      kosherTypes: [],
      priceRanges: [],
      suitableForFirstDate: false,
      parkingAvailable: false,
      publicTransport: false,
      radius: null,
      sortByDistance: false
    };
  });

  // שמירת הפילטרים ב-localStorage בכל פעם שהם משתנים
  useEffect(() => {
    localStorage.setItem('spotFilters', JSON.stringify(filters));
  }, [filters]);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>(() => {
    return window.innerWidth <= 768 ? 'map' : 'list';
  });
  const [resetMap, setResetMap] = useState(false);

  useEffect(() => {
    const loadSpots = async () => {
      try {
        const allSpots = await spotsTable.getAll();
        setSpots(allSpots);
      } catch (error) {
        console.error("Error loading spots:", error);
        setError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSpots();
  }, []);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  // הוספת מעקב אחר שינויי גודל מסך
  useEffect(() => {
    let lastWidth = window.innerWidth;
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      // בדיקה האם המעבר הוא בין מובייל לדסקטופ או להיפך
      const wasMobile = lastWidth <= 768;
      const isMobile = currentWidth <= 768;
      
      // עדכון התצוגה רק אם יש מעבר בין מובייל לדסקטופ
      if (wasMobile !== isMobile) {
        setViewMode(isMobile ? 'map' : 'list');
      }
      
      lastWidth = currentWidth;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const calculateDistance = (spot: Spot): number | null => {
    if (!userLocation) return null;
    
    const R = 6371; // Earth's radius in km
    const lat1 = userLocation[0] * Math.PI / 180;
    const lat2 = spot.latitude * Math.PI / 180;
    const dLat = (spot.latitude - userLocation[0]) * Math.PI / 180;
    const dLon = (spot.longitude - userLocation[1]) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const formatDistance = (distance: number | null): string | null => {
    if (distance === null) return null;
    if (distance < 1) return "פחות מקילומטר";
    return `${Math.round(distance)} ק"מ`;
  };

  const filteredSpots = spots.filter(spot => {
    const matchesSearch = !filters.search || 
      spot.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      spot.address.toLowerCase().includes(filters.search.toLowerCase());

    const matchesCategory = filters.categories.length === 0 || filters.categories.includes(spot.category);
    const matchesRegion = filters.regions.length === 0 || filters.regions.includes(spot.region);
    const matchesKosherType = filters.kosherTypes.length === 0 || filters.kosherTypes.includes(spot.kosher_type);
    const matchesPriceRange = filters.priceRanges.length === 0 || filters.priceRanges.includes(spot.price_range);
    const matchesSuitableForFirstDate = !filters.suitableForFirstDate || spot.suitable_for_first_date;
    
    // Check if spot is within radius
    let matchesRadius = true;
    if (filters.radius && userLocation) {
    const distance = calculateDistance(spot);
      matchesRadius = distance !== null && distance <= filters.radius;
    }

    return matchesSearch && matchesCategory && matchesRegion && 
           matchesKosherType && matchesPriceRange && matchesSuitableForFirstDate &&
           matchesRadius;
  }).sort((a, b) => {
    if (filters.sortByDistance && userLocation) {
      const distanceA = calculateDistance(a) || 0;
      const distanceB = calculateDistance(b) || 0;
      return distanceA - distanceB;
    }
    return 0;
  });

  const handleSpotClick = (spot: Spot) => {
    setSelectedSpot(spot.id);
    
    // Center the map on the spot with animation
    if (mapRef.current) {
      // First close any open popups
      mapRef.current.closePopup();
      
      // Center the map with offset to account for the popup
      mapRef.current.setView(
        [spot.latitude + 0.003, spot.longitude],
        16,
        {
          animate: true,
          duration: 0.8,
          easeLinearity: 0.25
        }
      );

      // Open the popup for the selected marker after a short delay
      setTimeout(() => {
        const marker = markerRefs.current[spot.id];
        if (marker) {
          marker.openPopup();
        }
      }, 850);
    }

    // במובייל נגלול לכרטיסייה
    if (window.innerWidth <= 768) {
      const spotElement = document.getElementById(`spot-${spot.id}`);
      if (spotElement) {
        // נביא את הכרטיסייה למרכז התצוגה האופקית
        spotElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });

        // נוסיף אפקט הדגשה
        setTimeout(() => {
          spotElement.classList.add('spot-highlight');
          setTimeout(() => {
            spotElement.classList.remove('spot-highlight');
          }, 2000);
        }, 800);
      }
    }
    // בדסקטופ נגלול לכרטיסיה
    else if (window.innerWidth > 768) {
      const spotElement = document.getElementById(`spot-${spot.id}`);
      if (spotElement) {
        spotElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

        setTimeout(() => {
          spotElement.focus({ preventScroll: true });
          spotElement.classList.add('spot-highlight');
          setTimeout(() => {
            spotElement.classList.remove('spot-highlight');
          }, 2000);
        }, 800);
      }
    }
  };

  // Add effect to update map when selectedSpot changes
  useEffect(() => {
    if (selectedSpot && mapRef.current) {
      const spot = spots.find(s => s.id === selectedSpot);
      if (spot) {
        mapRef.current.setView(
          [spot.latitude, spot.longitude],
          16,
          {
            animate: true,
            duration: 0.8,
            easeLinearity: 0.25
          }
        );
      }
    }
  }, [selectedSpot, spots]);

  const handleReset = () => {
    setResetMap(prev => !prev);
    setSelectedSpot(null);
    if (mapRef.current) {
      mapRef.current.closePopup();
    }
  };

  const hasActiveFilters = filters.categories.length > 0 ||
    filters.regions.length > 0 ||
    filters.kosherTypes.length > 0 ||
    filters.priceRanges.length > 0 ||
    filters.suitableForFirstDate ||
    !!filters.search ||
    filters.parkingAvailable ||
    filters.publicTransport ||
    filters.radius !== null ||
    filters.sortByDistance;

  const headerButtonClass = `bg-white/10 hover:bg-white/20 text-white hover:text-white transition-all rounded-full border-white/30
    w-9 h-9 sm:w-auto sm:h-9 sm:px-4 hover:scale-105 active:scale-95 duration-200`;

  const distanceControls = userLocation && (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <Select
        value={filters.radius?.toString() || "all"}
        onValueChange={(value) => setFilters({
          ...filters,
          radius: value === "all" ? null : Number(value)
        })}
      >
        <SelectTrigger className="h-10 text-xs sm:text-sm flex-1 sm:flex-none sm:w-[170px] bg-gray-100/80 border-0 rounded-full">
          <MapPin className="w-4 h-4 ml-1.5 text-gray-400" />
          <SelectValue placeholder="הגבל רדיוס" />
        </SelectTrigger>
        <SelectContent className="z-[9999] bg-white">
          <SelectItem value="all">הכל</SelectItem>
          <SelectItem value="1">עד 1 ק"מ</SelectItem>
          <SelectItem value="5">עד 5 ק"מ</SelectItem>
          <SelectItem value="10">עד 10 ק"מ</SelectItem>
          <SelectItem value="20">עד 20 ק"מ</SelectItem>
          <SelectItem value="50">עד 50 ק"מ</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant={filters.sortByDistance ? "default" : "outline"}
        onClick={() => setFilters({ ...filters, sortByDistance: !filters.sortByDistance })}
        size="sm"
        className={`h-10 rounded-full text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200
          ${filters.sortByDistance ? 'bg-primary text-white' : 'bg-gray-100/80 border-0 text-gray-600'}`}
      >
        <ArrowUpDown className="w-4 h-4" />
        <span className="hidden sm:inline">סדר לפי מרחק</span>
        <span className="sm:hidden">מרחק</span>
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="h-[100dvh] flex flex-col bg-gray-50" aria-busy="true" aria-label="טוען מקומות">
        <div className="bg-gradient-to-r from-primary/90 to-primary text-white text-center py-4 sm:py-5 shadow-md">
          <h1 className="text-2xl sm:text-4xl font-bold">
            Date<span className="text-pink-200">Spots</span>
          </h1>
          <p className="text-xs sm:text-base text-white/90 mt-1">מחפשים עבורכם מקומות...</p>
        </div>
        <div className="w-full max-w-md mx-auto sm:mx-0 sm:max-w-[400px] p-3 sm:p-4 grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white border border-gray-100 p-4 flex gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-gray-100 animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-gray-100 animate-pulse" />
                <div className="h-4 w-1/3 rounded-full bg-gray-100 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70dvh] flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-lg font-semibold text-gray-900">שגיאה בטעינת המקומות</p>
          <p className="text-sm text-gray-500 mt-1">כנראה בעיית תקשורת רגעית. נסו לטעון שוב.</p>
          <Button className="mt-4 rounded-full" onClick={() => window.location.reload()}>
            <RotateCcw className="h-4 w-4 ml-2" />
            טעינה מחדש
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-gray-50">
      {/* Hero */}
      <header className="relative bg-gradient-to-r from-primary/90 to-primary text-white shadow-md">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-6 py-3 sm:py-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex justify-start">
            <Button
              onClick={() => navigate('/add-spot')}
              className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-full
              bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700
              text-white border-[3px] border-white/30
              w-11 h-11 p-0 sm:w-auto sm:h-11 sm:px-5
              flex items-center justify-center
              hover:scale-105 active:scale-95"
              title="הוסף מקום"
              aria-label="הוסף מקום"
            >
              <Plus className="h-6 w-6 sm:h-5 sm:w-5 sm:ml-2 drop-shadow-md" strokeWidth={2.5} />
              <span className="hidden sm:inline text-base font-medium">הוסף מקום</span>
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-2xl sm:text-4xl font-bold leading-tight">
              Date<span className="text-pink-200">Spots</span>
            </h1>
            <p className="text-xs sm:text-base text-white/90 mt-0.5 sm:mt-1">
              מצאו את המקום המושלם לדייט הבא שלכם
            </p>
          </div>
          <div className="flex justify-end items-center gap-1.5 sm:gap-2">
            <TermsDialog
              trigger={
                <Button variant="outline" size="icon" className={headerButtonClass} title="תנאי שימוש" aria-label="תנאי שימוש">
                  <FileText className="h-4 w-4 sm:ml-2" />
                  <span className="hidden md:inline">תנאי שימוש</span>
                </Button>
              }
            />
            <AboutDialog
              trigger={
                <Button variant="outline" size="icon" className={headerButtonClass} title="אודות" aria-label="אודות">
                  <ScrollText className="h-4 w-4 sm:ml-2" />
                  <span className="hidden md:inline">אודות</span>
                </Button>
              }
            />
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="relative bg-white border-b border-gray-100 shadow-sm">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col gap-2 sm:gap-3">
          {/* Search, filters and view toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0 bg-gray-100/80 rounded-full px-3.5 h-10 sm:h-11 focus-within:ring-2 focus-within:ring-primary/40 focus-within:bg-white transition-all">
              <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <Input
                type="search"
                inputMode="search"
                placeholder="חיפוש מקומות..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 placeholder:text-gray-400 text-sm h-full shadow-none"
                aria-label="חיפוש מקומות"
              />
            </div>

            <FilterBar filters={filters} setFilters={setFilters} />

            {userLocation && <div className="hidden sm:flex">{distanceControls}</div>}

            <div className="sm:hidden flex flex-shrink-0 bg-gray-100/80 p-1 rounded-full" role="tablist" aria-label="מצב תצוגה">
              <Button
                variant="ghost"
                role="tab"
                aria-selected={viewMode === 'list'}
                onClick={() => setViewMode('list')}
                className={`flex items-center justify-center gap-1 rounded-full h-8 px-2.5 text-xs transition-all duration-200
                  ${viewMode === 'list' ? 'bg-white text-primary shadow-sm hover:bg-white' : 'text-gray-500 hover:text-primary hover:bg-transparent'}`}
                title="תצוגת רשימה"
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden min-[380px]:inline">רשימה</span>
              </Button>
              <Button
                variant="ghost"
                role="tab"
                aria-selected={viewMode === 'map'}
                onClick={() => setViewMode('map')}
                className={`flex items-center justify-center gap-1 rounded-full h-8 px-2.5 text-xs transition-all duration-200
                  ${viewMode === 'map' ? 'bg-white text-primary shadow-sm hover:bg-white' : 'text-gray-500 hover:text-primary hover:bg-transparent'}`}
                title="תצוגת מפה"
              >
                <Map className="h-3.5 w-3.5" />
                <span className="hidden min-[380px]:inline">מפה</span>
              </Button>
            </div>
          </div>

          {/* בטלפון בקרי המרחק יורדים לשורה משלהם */}
          {userLocation && <div className="flex sm:hidden">{distanceControls}</div>}

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="overflow-x-auto no-scrollbar -mx-3 px-3 sm:overflow-visible sm:mx-0 sm:px-0">
              <div className="flex flex-nowrap items-center gap-2 min-w-max sm:flex-wrap sm:min-w-0">
                {filters.categories.map(category => (
                  <Badge
                    key={category}
                    variant="outline"
                    className="gap-1 h-7 cursor-pointer bg-white hover:bg-secondary whitespace-nowrap"
                    onClick={() => {
                      setFilters({
                        ...filters,
                        categories: filters.categories.filter(c => c !== category)
                      });
                    }}
                  >
                    {category}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
                {filters.regions.map(region => (
                  <Badge
                    key={region}
                    variant="outline"
                    className="gap-1 h-7 cursor-pointer bg-white hover:bg-secondary whitespace-nowrap"
                    onClick={() => {
                      setFilters({
                        ...filters,
                        regions: filters.regions.filter(r => r !== region)
                      });
                    }}
                  >
                    {region}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
                {filters.kosherTypes.map(type => (
                  <Badge
                    key={type}
                    variant="outline"
                    className={`
                      gap-1 h-7 cursor-pointer whitespace-nowrap
                      ${type === 'מהדרין' ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' :
                        type === 'רבנות' ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' :
                        'bg-red-600 hover:bg-red-700 text-white border-red-600'}
                    `}
                    onClick={() => {
                      setFilters({
                        ...filters,
                        kosherTypes: filters.kosherTypes.filter(k => k !== type)
                      });
                    }}
                  >
                    {type === '?' ? 'רמת כשרות: ?' : type}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
                {filters.priceRanges.map(price => (
                  <Badge
                    key={price}
                    variant="outline"
                    className="gap-1 h-7 cursor-pointer bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200 whitespace-nowrap"
                    onClick={() => {
                      setFilters({
                        ...filters,
                        priceRanges: filters.priceRanges.filter(p => p !== price)
                      });
                    }}
                  >
                    {price === 'זול' ? '₪ זול' :
                     price === 'בינוני' ? '₪₪ בינוני' : '₪₪₪ יקר'}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
                {filters.suitableForFirstDate && (
                  <Badge
                    variant="outline"
                    className="gap-1 h-7 cursor-pointer bg-white hover:bg-secondary whitespace-nowrap"
                    onClick={() => {
                      setFilters({
                        ...filters,
                        suitableForFirstDate: false
                      });
                    }}
                  >
                    מתאים לדייט ראשון
                    <X className="h-3 w-3" />
                  </Badge>
                )}

                {/* כפתור נקה סינון */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({
                    search: "",
                    categories: [],
                    regions: [],
                    kosherTypes: [],
                    priceRanges: [],
                    suitableForFirstDate: false,
                    parkingAvailable: false,
                    publicTransport: false,
                    radius: null,
                    sortByDistance: false
                  })}
                  className="gap-1.5 h-7 text-xs bg-red-50 hover:bg-red-100 text-red-600 border-red-200
                    hover:border-red-300 transition-all duration-200 font-medium
                    rounded-full px-2.5 whitespace-nowrap"
                >
                  נקה סינון
                  <X className="h-3 w-3 text-red-500" />
                </Button>

                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {filteredSpots.length} מקומות
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="relative isolate flex-1 min-h-0 flex">
        {/* List View */}
        <aside
          className={`
            ${viewMode === 'map'
              ? 'absolute inset-x-0 bottom-0 z-[900] pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none'
              : 'w-full h-full overflow-y-auto'}
            sm:pointer-events-auto sm:static sm:pb-0 sm:h-full sm:overflow-y-auto
            sm:w-[320px] lg:w-[400px] sm:flex-none sm:border-l sm:border-gray-100 sm:bg-white
          `}
          aria-label="רשימת מקומות"
        >
          {filteredSpots.length === 0 ? (
            <div className={`${viewMode === 'map' ? 'hidden sm:block' : ''} p-8 text-center`}>
              <p className="font-medium text-gray-700">לא נמצאו מקומות</p>
              <p className="text-sm text-gray-500 mt-1">נסו לשנות את החיפוש או לנקות את הסינון</p>
            </div>
          ) : (
            <div className={`
              ${viewMode === 'map'
                ? 'flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4 py-2 pointer-events-auto'
                : 'grid gap-3 p-3 max-w-2xl mx-auto'}
              sm:grid sm:gap-3 sm:p-4 sm:overflow-visible sm:snap-none sm:max-w-none
            `}>
              {filteredSpots.map((spot) => (
                <div key={spot.id} className="relative flex-shrink-0 snap-center sm:flex-shrink">
                  <SpotCard
                    spot={spot}
                    onClick={() => {
                      if (viewMode === 'list' && window.innerWidth < 640) {
                        navigate(`/spot/${spot.id}`);
                      } else {
                        handleSpotClick(spot);
                      }
                    }}
                    isSelected={selectedSpot === spot.id}
                    distance={userLocation ? formatDistance(calculateDistance(spot)) : null}
                    compact={viewMode === 'map'}
                  />
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Map View */}
        <div className={`flex-1 min-w-0 relative ${viewMode === 'list' ? 'hidden' : 'block'} sm:block`}>
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            className="absolute top-3 right-3 z-[999] bg-white/95 hover:bg-white shadow-md rounded-full h-9 px-3.5 text-xs flex items-center gap-1.5 border-gray-200"
            onClick={handleReset}
            title="רענן מפה בהתאם לחיפוש"
          >
            <RotateCcw className="h-3.5 w-3.5 text-gray-500" />
            <span>רענן מפה</span>
          </Button>

          <MapContainer
            ref={mapRef}
            center={[31.7683, 35.2137]}
            zoom={13}
            className="h-full w-full"
            minZoom={6}
            maxZoom={18}
            zoomControl={false}
            attributionControl={false}
            scrollWheelZoom={true}
            doubleClickZoom={true}
            dragging={true}
            preferCanvas={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxNativeZoom={18}
              maxZoom={18}
              tileSize={256}
              keepBuffer={2}
            />
            <MapBoundsHandler spots={filteredSpots} resetMap={resetMap} />
            {filteredSpots.map(spot => {
              const isSelected = selectedSpot === spot.id;
              const distance = calculateDistance(spot);
              const Icon = categoryIcons2[spot.category];
              return (
                <Marker
                  key={spot.id}
                  position={[spot.latitude, spot.longitude]}
                  icon={categoryIcons[spot.category]}
                  eventHandlers={{
                    click: () => handleSpotClick(spot),
                    mouseover: (e) => {
                      e.target.openPopup();
                    }
                  }}
                  opacity={isSelected ? 1 : 0.7}
                  zIndexOffset={isSelected ? 1000 : 0}
                  ref={(ref) => {
                    if (ref) {
                      markerRefs.current[spot.id] = ref;
                    }
                  }}
                >
                  <Popup
                    className="leaflet-popup-custom"
                    offset={[0, -20]}
                  >
                    <div dir="rtl" className="bg-white rounded-lg p-2.5 sm:p-3 min-w-[180px] sm:min-w-[220px] font-sans">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 leading-snug">{spot.name}</h3>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {spot.address}
                        {distance !== null && (
                          <span className="mr-1 whitespace-nowrap">• {formatDistance(distance)}</span>
                        )}
                      </p>
                      <div className="flex justify-end mt-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="h-8 rounded-full px-3 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/spot/${spot.id}`);
                          }}
                        >
                          לפרטים נוספים
                        </Button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </main>
    </div>
  );
}
