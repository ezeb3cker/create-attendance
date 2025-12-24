import { useState, useEffect } from 'react';

/**
 * Hook para persistir estado no sessionStorage
 * Mantém os dados mesmo quando o componente é remontado
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Função para ler do sessionStorage
  const readValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Erro ao ler sessionStorage key "${key}":`, error);
      return initialValue;
    }
  };

  // Estado inicializado com valor do sessionStorage
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Função para atualizar o estado e o sessionStorage
  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      // Permite que value seja uma função para manter compatibilidade com useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Salva no estado
      setStoredValue(valueToStore);
      
      // Salva no sessionStorage
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Erro ao salvar sessionStorage key "${key}":`, error);
    }
  };

  // Carrega o valor do sessionStorage quando o componente é montado ou quando a key muda
  useEffect(() => {
    const value = readValue();
    setStoredValue(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [storedValue, setValue];
}

