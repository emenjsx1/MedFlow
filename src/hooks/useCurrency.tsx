import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

export type Currency = 'BRL' | 'USD' | 'EUR' | 'MZN';

interface CurrencyConfig {
  code: Currency;
  symbol: string;
  locale: string;
  name: string;
  flag: string;
}

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  BRL: { code: 'BRL', symbol: 'R$', locale: 'pt-BR', name: 'Real Brasileiro', flag: '🇧🇷' },
  USD: { code: 'USD', symbol: '$', locale: 'en-US', name: 'US Dollar', flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE', name: 'Euro', flag: '🇪🇺' },
  MZN: { code: 'MZN', symbol: 'MT', locale: 'pt-MZ', name: 'Metical', flag: '🇲🇿' },
};

// Fallback exchange rates (will be updated from API)
const FALLBACK_RATES: Record<Currency, number> = {
  BRL: 1,
  USD: 0.16,      // 1 BRL ≈ 0.16 USD
  EUR: 0.15,      // 1 BRL ≈ 0.15 EUR
  MZN: 10.2,      // 1 BRL ≈ 10.2 MZN
};

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  rates: Record<Currency, number>;
  isLoading: boolean;
  convert: (amountBRL: number) => number;
  format: (amountBRL: number) => string;
  formatWithSymbol: (amountBRL: number) => string;
  config: CurrencyConfig;
  detectedCountry: string | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Map country codes to currencies
const COUNTRY_TO_CURRENCY: Record<string, Currency> = {
  // Brazil
  BR: 'BRL',
  // USA
  US: 'USD',
  // Europe (Eurozone)
  DE: 'EUR', AT: 'EUR', BE: 'EUR', CY: 'EUR', EE: 'EUR', ES: 'EUR',
  FI: 'EUR', FR: 'EUR', GR: 'EUR', IE: 'EUR', IT: 'EUR', LT: 'EUR',
  LU: 'EUR', LV: 'EUR', MT: 'EUR', NL: 'EUR', PT: 'EUR', SI: 'EUR',
  SK: 'EUR',
  // Mozambique
  MZ: 'MZN',
  // Other countries default to USD
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('BRL');
  const [rates, setRates] = useState<Record<Currency, number>>(FALLBACK_RATES);
  const [isLoading, setIsLoading] = useState(true);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);

  // Detect user's location and set currency
  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Try to get location from IP
        const response = await fetch('https://ipapi.co/json/', { 
          signal: AbortSignal.timeout(5000) 
        });
        
        if (response.ok) {
          const data = await response.json();
          const countryCode = data.country_code;
          setDetectedCountry(countryCode);
          
          // Check if we have a saved preference
          const saved = localStorage.getItem('preferredCurrency') as Currency;
          if (saved && CURRENCIES[saved]) {
            setCurrency(saved);
          } else {
            // Use detected country
            const detectedCurrency = COUNTRY_TO_CURRENCY[countryCode] || 'USD';
            setCurrency(detectedCurrency);
          }
        }
      } catch (error) {
        console.log('Could not detect location, using default currency');
        // Check saved preference
        const saved = localStorage.getItem('preferredCurrency') as Currency;
        if (saved && CURRENCIES[saved]) {
          setCurrency(saved);
        }
      }
    };

    detectLocation();
  }, []);

  // Fetch exchange rates
  useEffect(() => {
    const fetchRates = async () => {
      setIsLoading(true);
      try {
        // Using exchangerate-api.com free tier (1500 requests/month)
        const response = await fetch(
          'https://api.exchangerate-api.com/v4/latest/BRL',
          { signal: AbortSignal.timeout(5000) }
        );
        
        if (response.ok) {
          const data = await response.json();
          setRates({
            BRL: 1,
            USD: data.rates.USD || FALLBACK_RATES.USD,
            EUR: data.rates.EUR || FALLBACK_RATES.EUR,
            MZN: data.rates.MZN || FALLBACK_RATES.MZN,
          });
        }
      } catch (error) {
        console.log('Could not fetch exchange rates, using fallback');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
    
    // Refresh rates every hour
    const interval = setInterval(fetchRates, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Save currency preference
  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem('preferredCurrency', newCurrency);
  };

  // Convert from BRL to selected currency
  const convert = (amountBRL: number): number => {
    return Math.round(amountBRL * rates[currency] * 100) / 100;
  };

  // Format number in selected currency locale
  const format = (amountBRL: number): string => {
    const converted = convert(amountBRL);
    const config = CURRENCIES[currency];
    
    return new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(converted);
  };

  // Format with currency symbol
  const formatWithSymbol = (amountBRL: number): string => {
    const converted = convert(amountBRL);
    const config = CURRENCIES[currency];
    
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(converted);
  };

  const value: CurrencyContextType = {
    currency,
    setCurrency: handleSetCurrency,
    rates,
    isLoading,
    convert,
    format,
    formatWithSymbol,
    config: CURRENCIES[currency],
    detectedCountry,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
