/** Country → currency mapping for sign-up localization */

export interface CurrencyInfo {
  code: string;    // ISO 4217 currency code
  symbol: string;  // Display symbol
  name: string;    // Full currency name
  locale: string;  // BCP 47 locale for Intl.NumberFormat
}

export interface CountryOption {
  code: string;    // ISO 3166-1 alpha-2
  name: string;
  currency: CurrencyInfo;
}

const CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$',  name: 'US Dollar',         locale: 'en-US' },
  GBP: { code: 'GBP', symbol: '£',  name: 'British Pound',     locale: 'en-GB' },
  EUR: { code: 'EUR', symbol: '€',  name: 'Euro',              locale: 'de-DE' },
  INR: { code: 'INR', symbol: '₹',  name: 'Indian Rupee',      locale: 'en-IN' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar',   locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  JPY: { code: 'JPY', symbol: '¥',  name: 'Japanese Yen',      locale: 'ja-JP' },
  CNY: { code: 'CNY', symbol: '¥',  name: 'Chinese Yuan',      locale: 'zh-CN' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real',    locale: 'pt-BR' },
  MXN: { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso',     locale: 'es-MX' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar',  locale: 'en-SG' },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham',       locale: 'ar-AE' },
  CHF: { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc',       locale: 'de-CH' },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona',     locale: 'sv-SE' },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone',   locale: 'nb-NO' },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', locale: 'en-NZ' },
  ZAR: { code: 'ZAR', symbol: 'R',  name: 'South African Rand', locale: 'en-ZA' },
  KRW: { code: 'KRW', symbol: '₩',  name: 'South Korean Won',  locale: 'ko-KR' },
  PHP: { code: 'PHP', symbol: '₱',  name: 'Philippine Peso',   locale: 'en-PH' },
  NGN: { code: 'NGN', symbol: '₦',  name: 'Nigerian Naira',    locale: 'en-NG' },
};

export const COUNTRIES: CountryOption[] = [
  { code: 'US', name: 'United States',      currency: CURRENCIES.USD },
  { code: 'GB', name: 'United Kingdom',     currency: CURRENCIES.GBP },
  { code: 'IN', name: 'India',              currency: CURRENCIES.INR },
  { code: 'CA', name: 'Canada',             currency: CURRENCIES.CAD },
  { code: 'AU', name: 'Australia',          currency: CURRENCIES.AUD },
  { code: 'DE', name: 'Germany',            currency: CURRENCIES.EUR },
  { code: 'FR', name: 'France',             currency: CURRENCIES.EUR },
  { code: 'IT', name: 'Italy',              currency: CURRENCIES.EUR },
  { code: 'ES', name: 'Spain',              currency: CURRENCIES.EUR },
  { code: 'NL', name: 'Netherlands',        currency: CURRENCIES.EUR },
  { code: 'JP', name: 'Japan',              currency: CURRENCIES.JPY },
  { code: 'CN', name: 'China',              currency: CURRENCIES.CNY },
  { code: 'BR', name: 'Brazil',             currency: CURRENCIES.BRL },
  { code: 'MX', name: 'Mexico',             currency: CURRENCIES.MXN },
  { code: 'SG', name: 'Singapore',          currency: CURRENCIES.SGD },
  { code: 'AE', name: 'United Arab Emirates', currency: CURRENCIES.AED },
  { code: 'CH', name: 'Switzerland',        currency: CURRENCIES.CHF },
  { code: 'SE', name: 'Sweden',             currency: CURRENCIES.SEK },
  { code: 'NO', name: 'Norway',             currency: CURRENCIES.NOK },
  { code: 'NZ', name: 'New Zealand',        currency: CURRENCIES.NZD },
  { code: 'ZA', name: 'South Africa',       currency: CURRENCIES.ZAR },
  { code: 'KR', name: 'South Korea',        currency: CURRENCIES.KRW },
  { code: 'PH', name: 'Philippines',        currency: CURRENCIES.PHP },
  { code: 'NG', name: 'Nigeria',            currency: CURRENCIES.NGN },
];

export function getCurrencyForCountry(countryCode: string): CurrencyInfo {
  const country = COUNTRIES.find(c => c.code === countryCode);
  return country?.currency ?? CURRENCIES.USD;
}
