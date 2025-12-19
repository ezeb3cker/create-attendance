import React, { useState, useRef, useEffect } from 'react';
import type { Channel } from '../../types';

interface SelectWithSearchProps {
  options: Channel[];
  value: Channel | null;
  onChange: (channel: Channel | null) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  getOptionLabel: (option: Channel) => string;
  renderOption: (option: Channel) => React.ReactNode;
  isLoading?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export default function SelectWithSearch({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  label,
  disabled = false,
  getOptionLabel,
  renderOption,
  isLoading = false,
  onOpenChange,
}: SelectWithSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onOpenChange?.(false);
        if (!value) {
          setSearchTerm('');
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, value, onOpenChange]);

  const filteredOptions = options.filter((option) =>
    getOptionLabel(option).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option: Channel, e?: React.MouseEvent) => {
    // Permitir seleção apenas se status for REGISTERED ou CONNECTED
    if (option.status !== 'REGISTERED' && option.status !== 'CONNECTED') return;
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getChannelIcon = (type: number, status: string) => {
    const isActive = status === 'REGISTERED' || status === 'CONNECTED';
    
    // WhatsApp Cloud (type 4) - Azul
    if (type === 4) {
      return (
        <div className="relative">
          <svg className="w-5 h-5" fill="#0084FF" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.386 1.262.617 1.694.79.717.285 1.37.244 1.885.148.571-.108 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          {/* Bolinha de status */}
          <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
            isActive ? 'bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.6)]'
          }`} />
        </div>
      );
    }
    // WhatsApp Web (type 1) - Verde
    return (
      <div className="relative">
        <svg className="w-5 h-5" fill="#25D366" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.386 1.262.617 1.694.79.717.285 1.37.244 1.885.148.571-.108 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        {/* Bolinha de status */}
        <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
          isActive ? 'bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.6)]'
        }`} />
      </div>
    );
  };

  const hasValue = !!value;
  const isFocused = isOpen;

  return (
    <div 
      ref={containerRef} 
      className="relative w-full"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="relative">
        {label && (
          <label
            className={`absolute left-4 transition-all duration-200 pointer-events-none ${
              isFocused || hasValue
                ? '-top-2.5 bg-white px-1 text-xs text-text-secondary'
                : 'top-1/2 -translate-y-1/2 text-sm text-text-secondary z-10'
            }`}
          >
            {label}
          </label>
        )}
        <input
          ref={inputRef}
          type="text"
          value={value ? getOptionLabel(value) : searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) {
              setIsOpen(true);
              onOpenChange?.(true);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
          onFocus={() => {
            setIsOpen(true);
            onOpenChange?.(true);
          }}
          placeholder={isFocused || hasValue ? placeholder : ''}
          disabled={disabled}
          className={`w-full px-4 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50 disabled:cursor-not-allowed ${
            label && (isFocused || hasValue) ? 'pt-5 pb-2' : 'py-3'
          }`}
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled) {
              const newIsOpen = !isOpen;
              setIsOpen(newIsOpen);
              onOpenChange?.(newIsOpen);
              inputRef.current?.focus();
            }
          }}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary disabled:cursor-not-allowed transition-colors"
        >
          <svg
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div 
          className="absolute z-50 w-full mt-2 bg-white border border-border rounded-lg shadow-md max-h-60 overflow-auto"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {isLoading ? (
            <div className="p-4 text-center text-sm text-text-secondary">Carregando...</div>
          ) : filteredOptions.length === 0 ? (
            <div className="p-4 text-center text-sm text-text-secondary">Nenhum resultado encontrado</div>
          ) : (
            filteredOptions.map((option) => {
              // Desabilitar se status não for REGISTERED ou CONNECTED
              const isDisabled = option.status !== 'REGISTERED' && option.status !== 'CONNECTED';
              return (
                <div
                  key={option.canalId}
                  onClick={(e) => handleSelect(option, e)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 transition-colors ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                  } ${value?.canalId === option.canalId ? 'bg-primary/5 text-primary font-medium' : 'text-text-primary'}`}
                >
                  <div className="flex items-center gap-3">
                    {getChannelIcon(option.type, option.status)}
                    <div className="flex-1 min-w-0">
                      {renderOption(option)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

