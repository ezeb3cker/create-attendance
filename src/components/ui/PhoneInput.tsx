import React from 'react';

interface PhoneInputProps {
  ddi: string;
  phoneNumber: string;
  onDDIChange: (ddi: string) => void;
  onPhoneChange: (phone: string) => void;
  disabled?: boolean;
  label?: string;
}

const DDI_OPTIONS = [
  { code: '52', flag: '🇲🇽', name: 'México' },
  { code: '55', flag: '🇧🇷', name: 'Brasil' },
  { code: '1', flag: '🇺🇸', name: 'EUA/Canadá' },
  { code: '54', flag: '🇦🇷', name: 'Argentina' },
];

export default function PhoneInput({
  ddi,
  phoneNumber,
  onDDIChange,
  onPhoneChange,
  disabled = false,
  label,
}: PhoneInputProps) {
  const [isDDIOpen, setIsDDIOpen] = React.useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = React.useState(false);

  // DDI padrão sempre será 55
  const selectedDDI = DDI_OPTIONS.find((opt) => opt.code === ddi) || DDI_OPTIONS.find((opt) => opt.code === '55') || DDI_OPTIONS[1];

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remover formatação automática - apenas permitir números e parênteses se digitados manualmente
    const value = e.target.value;
    onPhoneChange(value);
  };

  const hasValue = !!phoneNumber;

  return (
    <div className="w-full">
      <div className="flex gap-3">
        <div className="relative w-32">
          <button
            type="button"
            onClick={() => !disabled && setIsDDIOpen(!isDDIOpen)}
            disabled={disabled}
            className="w-full px-4 py-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50 disabled:cursor-not-allowed flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">{selectedDDI.flag}</span>
              <span className="text-sm">+{selectedDDI.code}</span>
            </span>
            <svg
              className={`w-5 h-5 transition-transform ${isDDIOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isDDIOpen && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-border rounded-lg shadow-md max-h-48 overflow-auto">
              {DDI_OPTIONS.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => {
                    onDDIChange(option.code);
                    setIsDDIOpen(false);
                  }}
                  className="w-full px-4 py-3 text-sm text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-text-primary"
                >
                  <span className="text-lg">{option.flag}</span>
                  <span>+{option.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative flex-1">
          {label && (
            <label
              className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                isPhoneFocused || hasValue
                  ? '-top-2.5 bg-white px-1 text-xs text-text-secondary'
                  : 'top-1/2 -translate-y-1/2 text-sm text-text-secondary z-10'
              }`}
            >
              {label}
            </label>
          )}
          <input
            type="text"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder={isPhoneFocused || hasValue ? 'Telefone' : ''}
            onFocus={() => {
              setIsPhoneFocused(true);
              setIsDDIOpen(false);
            }}
            onBlur={() => setIsPhoneFocused(false)}
            disabled={disabled}
            className={`flex-1 w-full px-4 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50 disabled:cursor-not-allowed ${
              label && (isPhoneFocused || hasValue) ? 'pt-5 pb-2' : 'py-3'
            }`}
          />
        </div>
      </div>
    </div>
  );
}

