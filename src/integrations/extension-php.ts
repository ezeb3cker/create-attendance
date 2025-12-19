import type { UserInfo, ContactInfo, CallHistory, ExtensionEvent } from '../types/extension';

/**
 * Wrapper para integração com extension-php / wlExtension
 */
class ExtensionService {
  private wlExtension = window.wlExtension;

  /**
   * Verifica se o wlExtension está disponível
   */
  isAvailable(): boolean {
    return typeof this.wlExtension !== 'undefined' && this.wlExtension !== null;
  }

  /**
   * Obtém informações do usuário atual
   */
  async getInfoUser(): Promise<UserInfo | null> {
    try {
      // Tentar usar window.WlExtension (com W maiúsculo) primeiro
      const WlExtension = (window as any).WlExtension;
      
      if (WlExtension && WlExtension.getInfoUser) {
        const result = WlExtension.getInfoUser();
        const data = result instanceof Promise ? await result : result;
        return data;
      }

      // Fallback para wlExtension (minúsculo)
      if (this.isAvailable() && this.wlExtension?.getInfoUser) {
        const result = this.wlExtension.getInfoUser();
        return result instanceof Promise ? await result : result;
      }return null;
    } catch (error) {return null;
    }
  }

  /**
   * Obtém canais disponíveis
   */
  async getInfoChannels(): Promise<any[]> {
    if (!this.isAvailable()) {return [];
    }

    try {
      // Tentar usar window.WlExtension (com W maiúsculo)
      const WlExtension = (window as any).WlExtension || this.wlExtension;
      
      if (WlExtension && WlExtension.getInfoChannels) {
        const result = WlExtension.getInfoChannels();
        return result instanceof Promise ? await result : result;
      }return [];
    } catch (error) {return [];
    }
  }

  /**
   * Obtém informações do contato atual
   */
  async getContactInfo(): Promise<ContactInfo | null> {
    if (!this.isAvailable()) {return null;
    }

    try {
      // Tentar obter via método direto
      if (this.wlExtension && this.wlExtension.getContactInfo) {
        const result = this.wlExtension.getContactInfo();
        return result instanceof Promise ? await result : result;
      }

      // Tentar obter via evento
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(null);
        }, 1000);

        const handler = (data: ContactInfo) => {
          clearTimeout(timeout);
          if (this.wlExtension && this.wlExtension.off) {
            this.wlExtension.off('contact:selected', handler);
          }
          resolve(data);
        };

        if (this.wlExtension && this.wlExtension.on) {
          this.wlExtension.on('contact:selected', handler);
        } else {
          clearTimeout(timeout);
          resolve(null);
        }
      });
    } catch (error) {return null;
    }
  }

  /**
   * Obtém histórico de ligações para um contato
   */
  async getCallHistory(contactId?: string): Promise<CallHistory[]> {
    if (!this.isAvailable() || !this.wlExtension?.getCallHistory) {return [];
    }

    try {
      const result = this.wlExtension.getCallHistory(contactId);
      return result instanceof Promise ? await result : result;
    } catch (error) {return [];
    }
  }

  /**
   * Registra um listener para eventos do extension
   */
  on(event: ExtensionEvent, callback: (data: any) => void): void {
    if (!this.isAvailable() || !this.wlExtension?.on) {return;
    }

    this.wlExtension.on(event, callback);
  }

  /**
   * Remove um listener de eventos
   */
  off(event: ExtensionEvent, callback: (data: any) => void): void {
    if (!this.isAvailable() || !this.wlExtension?.off) {
      return;
    }

    this.wlExtension.off(event, callback);
  }

  /**
   * Emite um evento
   */
  emit(event: ExtensionEvent, data?: any): void {
    if (!this.isAvailable() || !this.wlExtension?.emit) {return;
    }

    this.wlExtension.emit(event, data);
  }

  /**
   * Inicia uma ligação (chama n8n)
   */
  async startCall(contactId: string, number: string): Promise<boolean> {
    if (!this.isAvailable()) {return false;
    }

    try {
      // Emitir evento para iniciar ligação
      this.emit('call:start', { contactId, number });
      
      // Se houver método direto
      if (this.wlExtension && this.wlExtension.startCall) {
        const result = this.wlExtension.startCall(contactId, number);
        return result instanceof Promise ? await result : result;
      }

      return true;
    } catch (error) {return false;
    }
  }
}

// Exportar instância singleton
export const extensionService = new ExtensionService();
export default extensionService;

