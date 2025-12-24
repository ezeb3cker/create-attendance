import { useState, useEffect, useRef } from 'react';

/**
 * Hook para persistir estado no sessionStorage
 * Mantém os dados mesmo quando o componente é remontado
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Usar ref para evitar loops infinitos
  const isInitialMount = useRef(true);

  // Função para ler do sessionStorage
  const readValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.sessionStorage.getItem(key);
      if (item) {
        return JSON.parse(item);
      }
      return initialValue;
    } catch (error) {
      console.warn(`Erro ao ler sessionStorage key "${key}":`, error);
      return initialValue;
    }
  };

  // Estado inicializado com valor do sessionStorage
  const [storedValue, setStoredValue] = useState<T>(() => {
    // Só ler do sessionStorage na inicialização
    return readValue();
  });

  // Função para atualizar o estado e o sessionStorage
  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      // Permite que value seja uma função para manter compatibilidade com useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Salva no estado
      setStoredValue(valueToStore);
      
      // Salva no sessionStorage de forma síncrona
      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (e) {
          // Se sessionStorage estiver cheio, tentar limpar e tentar novamente
          if (e instanceof DOMException && e.code === 22) {
            console.warn('sessionStorage cheio, limpando dados antigos');
            // Limpar apenas as chaves relacionadas a attendance
            Object.keys(window.sessionStorage).forEach(k => {
              if (k.startsWith('attendance_') && k !== key) {
                window.sessionStorage.removeItem(k);
              }
            });
            // Tentar novamente
            window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
          }
        }
      }
    } catch (error) {
      console.warn(`Erro ao salvar sessionStorage key "${key}":`, error);
    }
  };

  // Sincronizar com sessionStorage quando a key mudar (mas não na montagem inicial)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const value = readValue();
    // Só atualizar se o valor for diferente
    if (JSON.stringify(value) !== JSON.stringify(storedValue)) {
      setStoredValue(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [storedValue, setValue];
}

