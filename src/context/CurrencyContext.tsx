import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { localDB } from '../services/storage';

export interface CurrencyItem {
  code: string;
  symbol: string;
  name: string;
  flag?: string;
}

export const PRESET_CURRENCIES: CurrencyItem[] = [
  { code: 'HNL', symbol: 'L.', name: 'Lempira Hondureño', flag: '🇭🇳' },
  { code: 'USD', symbol: '$', name: 'Dólar Estadounidense', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro (Unión Europea)', flag: '🇪🇺' },
  { code: 'MXN', symbol: 'Mex$', name: 'Peso Mexicano', flag: '🇲🇽' },
  { code: 'GTQ', symbol: 'Q', name: 'Quetzal Guatemalteco', flag: '🇬🇹' },
  { code: 'CRC', symbol: '₡', name: 'Colón Costarricense', flag: '🇨🇷' },
  { code: 'NIO', symbol: 'C$', name: 'Córdoba Nicaragüense', flag: '🇳🇮' },
  { code: 'COP', symbol: 'Col$', name: 'Peso Colombiano', flag: '🇨🇴' },
  { code: 'PEN', symbol: 'S/', name: 'Sol Peruano', flag: '🇵🇪' },
  { code: 'ARS', symbol: 'AR$', name: 'Peso Argentino', flag: '🇦🇷' },
  { code: 'CLP', symbol: 'CLP$', name: 'Peso Chileno', flag: '🇨🇱' },
  { code: 'BOB', symbol: 'Bs', name: 'Boliviano', flag: '🇧🇴' },
  { code: 'DOP', symbol: 'RD$', name: 'Peso Dominicano', flag: '🇩🇴' },
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileño', flag: '🇧🇷' },
  { code: 'GBP', symbol: '£', name: 'Libra Esterlina', flag: '🇬🇧' },
  { code: 'CAD', symbol: 'C$', name: 'Dólar Canadiense', flag: '🇨🇦' },
];

interface CurrencyContextType {
  currency: string;
  currencySymbol: string;
  currencyName: string;
  setCurrency: (code: string, customSymbol?: string, customName?: string) => void;
  formatAmount: (amount: number, options?: { showCode?: boolean; decimals?: number }) => string;
  availableCurrencies: CurrencyItem[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentSpace } = useAuth();

  // Inicializar desde localStorage o espacio actual
  const [currency, setCurrencyState] = useState<string>(() => {
    return localStorage.getItem('finanzaspro_user_currency') || currentSpace?.currency || 'HNL';
  });

  const [currencySymbol, setCurrencySymbolState] = useState<string>(() => {
    const savedSymbol = localStorage.getItem('finanzaspro_user_currency_symbol');
    if (savedSymbol) return savedSymbol;
    const match = PRESET_CURRENCIES.find((c) => c.code === (currentSpace?.currency || 'HNL'));
    return match ? match.symbol : 'L.';
  });

  const [currencyName, setCurrencyNameState] = useState<string>(() => {
    const savedName = localStorage.getItem('finanzaspro_user_currency_name');
    if (savedName) return savedName;
    const match = PRESET_CURRENCIES.find((c) => c.code === (currentSpace?.currency || 'HNL'));
    return match ? match.name : 'Lempira Hondureño';
  });

  // Si cambia el espacio y no hay moneda forzada en localStorage, sincronizar con el espacio
  useEffect(() => {
    if (currentSpace?.currency) {
      const saved = localStorage.getItem('finanzaspro_user_currency');
      if (!saved) {
        const match = PRESET_CURRENCIES.find((c) => c.code === currentSpace.currency);
        setCurrencyState(currentSpace.currency);
        setCurrencySymbolState(match ? match.symbol : '$');
        setCurrencyNameState(match ? match.name : currentSpace.currency);
      }
    }
  }, [currentSpace]);

  const setCurrency = (code: string, customSymbol?: string, customName?: string) => {
    const cleanCode = code.toUpperCase().trim();
    const preset = PRESET_CURRENCIES.find((c) => c.code === cleanCode);
    const resolvedSymbol = customSymbol || preset?.symbol || '$';
    const resolvedName = customName || preset?.name || cleanCode;

    setCurrencyState(cleanCode);
    setCurrencySymbolState(resolvedSymbol);
    setCurrencyNameState(resolvedName);

    localStorage.setItem('finanzaspro_user_currency', cleanCode);
    localStorage.setItem('finanzaspro_user_currency_symbol', resolvedSymbol);
    localStorage.setItem('finanzaspro_user_currency_name', resolvedName);

    // Actualizar también en el espacio actual en base de datos local
    if (currentSpace) {
      currentSpace.currency = cleanCode;
      localDB.updateSpaceCurrency(currentSpace.id, cleanCode);
    }
  };

  const formatAmount = (
    amount: number,
    options?: { showCode?: boolean; decimals?: number }
  ): string => {
    const decimals = options?.decimals ?? 2;
    const formattedNum = Number(amount || 0).toLocaleString('es-HN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    if (options?.showCode) {
      return `${currencySymbol} ${formattedNum} ${currency}`;
    }
    return `${currencySymbol} ${formattedNum}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencySymbol,
        currencyName,
        setCurrency,
        formatAmount,
        availableCurrencies: PRESET_CURRENCIES,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
