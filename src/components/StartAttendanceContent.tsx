import React, { useState, useEffect, useRef } from 'react';
import { fetchChannels, fetchSectors, fetchTemplates, startAttendance, startAttendanceNumber } from '../services/api';
import type { Channel, Sector, Template, StartAttendanceData } from '../types';
import SelectWithSearch from './ui/SelectWithSearch';
import PhoneInput from './ui/PhoneInput';
import TemplatePreview from './ui/TemplatePreview';

declare global {
  interface Window {
    WlExtension?: {
      closeModal: (options?: {}) => void;
      alert: (options: { message: string; variant: 'success' | 'error' | 'warning' }) => void;
    };
  }
}

const DDI_OPTIONS = [
  { code: '52', flag: '🇲🇽', name: 'México' },
  { code: '55', flag: '🇧🇷', name: 'Brasil' },
  { code: '1', flag: '🇺🇸', name: 'EUA/Canadá' },
  { code: '54', flag: '🇦🇷', name: 'Argentina' },
  { code: '56', flag: '🇨🇱', name: 'Chile' },
  { code: '57', flag: '🇨🇴', name: 'Colômbia' },
  { code: '51', flag: '🇵🇪', name: 'Peru' },
  { code: '58', flag: '🇻🇪', name: 'Venezuela' },
  { code: '591', flag: '🇧🇴', name: 'Bolívia' },
  { code: '593', flag: '🇪🇨', name: 'Equador' },
  { code: '595', flag: '🇵🇾', name: 'Paraguai' },
  { code: '598', flag: '🇺🇾', name: 'Uruguai' },
  { code: '34', flag: '🇪🇸', name: 'Espanha' },
  { code: '351', flag: '🇵🇹', name: 'Portugal' },
  { code: '33', flag: '🇫🇷', name: 'França' },
  { code: '39', flag: '🇮🇹', name: 'Itália' },
  { code: '49', flag: '🇩🇪', name: 'Alemanha' },
  { code: '44', flag: '🇬🇧', name: 'Reino Unido' },
  { code: '81', flag: '🇯🇵', name: 'Japão' },
  { code: '82', flag: '🇰🇷', name: 'Coreia do Sul' },
  { code: '86', flag: '🇨🇳', name: 'China' },
  { code: '91', flag: '🇮🇳', name: 'Índia' },
  { code: '61', flag: '🇦🇺', name: 'Austrália' },
  { code: '64', flag: '🇳🇿', name: 'Nova Zelândia' },
  { code: '27', flag: '🇿🇦', name: 'África do Sul' },
  { code: '20', flag: '🇪🇬', name: 'Egito' },
];

interface StartAttendanceContentProps {
  onSubmit?: (data: StartAttendanceData) => void;
  onTemplateChange?: (hasTemplate: boolean) => void;
}

export default function StartAttendanceContent({
  onSubmit,
  onTemplateChange,
}: StartAttendanceContentProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [sendQuickMessage, setSendQuickMessage] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateImageFile, setTemplateImageFile] = useState<File | null>(null);
  const [templateVideoFile, setTemplateVideoFile] = useState<File | null>(null);
  const [templateDocumentFile, setTemplateDocumentFile] = useState<File | null>(null);
  const [templateImageUrl, setTemplateImageUrl] = useState<string | null>(null);
  const [templateVideoUrl, setTemplateVideoUrl] = useState<string | null>(null);
  const [templateDocumentUrl, setTemplateDocumentUrl] = useState<string | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [templateButtonValues, setTemplateButtonValues] = useState<Record<string, string>>({});
  const [phoneDDI, setPhoneDDI] = useState('55'); 
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneType, setPhoneType] = useState<'numero' | 'lista' | 'csv'>('numero');
  const [phoneList, setPhoneList] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [isMessageFocused, setIsMessageFocused] = useState(false);
  const [isDDIOpen, setIsDDIOpen] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);

  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingSectors, setLoadingSectors] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [phoneListError, setPhoneListError] = useState(false);

  const [openDropdown, setOpenDropdown] = useState<'channel' | 'sector' | 'template' | null>(null);

  const templatePreviewRef = useRef<HTMLDivElement>(null);

  const okButtonRef = useRef<HTMLButtonElement>(null);
  const isUserClickRef = useRef(false);
  const channelsLoadedRef = useRef(false);

  const sectorsCacheRef = useRef<Record<string, Sector[]>>({});
  const templatesCacheRef = useRef<Record<string, Template[]>>({});

  useEffect(() => {
    if (!channelsLoadedRef.current) {
      channelsLoadedRef.current = true;
      loadChannels();
    }

    if (!phoneDDI) {
      setPhoneDDI('55');
    }
    onTemplateChange?.(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' && target.getAttribute('type') !== 'button') {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    const handleSubmit = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' && (target.type === 'submit' || target.textContent?.trim() === 'OK')) {
        const isOkButton = target === okButtonRef.current || target.closest('button[ref]') === okButtonRef.current;

        if (isOkButton && !isUserClickRef.current) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        if (isOkButton && isUserClickRef.current) {
          setTimeout(() => {
            isUserClickRef.current = false;
          }, 100);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('submit', handleSubmit, { capture: true });
    document.addEventListener('click', handleClick, { capture: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('submit', handleSubmit, { capture: true });
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (!selectedChannel) {setSectors([]);
      setSelectedSector(null);
      setTemplates([]);
      setSelectedTemplate(null);
      onTemplateChange?.(false);
      if (isDDIOpen) {
        setIsDDIOpen(false);
      }
      return;
    }
    const sectorsCacheKey = `${selectedChannel.canalId}_${selectedChannel.organizacaoId}`;
    if (sectorsCacheRef.current[sectorsCacheKey]) {setSectors(sectorsCacheRef.current[sectorsCacheKey]);
    } else {
      loadSectors(selectedChannel.canalId);
    }
    
    if (selectedChannel.type === 4) {
      if (templatesCacheRef.current[selectedChannel.canalId]) {setTemplates(templatesCacheRef.current[selectedChannel.canalId]);
      } else {
        loadTemplates(selectedChannel.canalId);
      }
    } else {
      setTemplates([]);
      setSelectedTemplate(null);
      setTemplateImageFile(null);
      setTemplateVideoFile(null);
      setTemplateDocumentFile(null);
      setTemplateImageUrl(null);
      setTemplateVideoUrl(null);
      setTemplateDocumentUrl(null);
      setTemplateVariables({});
      setTemplateButtonValues({});
      onTemplateChange?.(false);
    }

    if (isDDIOpen) {setIsDDIOpen(false);
    }
  }, [selectedChannel?.canalId]);

  useEffect(() => {
    if (sendQuickMessage && selectedChannel && selectedChannel.type === 4 && templates.length === 0) {
      if (templatesCacheRef.current[selectedChannel.canalId]) {setTemplates(templatesCacheRef.current[selectedChannel.canalId]);
      } else {
        loadTemplates(selectedChannel.canalId);
      }
    } else if (!sendQuickMessage) {
      setSelectedTemplate(null);
      setTemplateImageFile(null);
      setTemplateVideoFile(null);
      setTemplateDocumentFile(null);
      setTemplateImageUrl(null);
      setTemplateVideoUrl(null);
      setTemplateDocumentUrl(null);
      setTemplateVariables({});
      setTemplateButtonValues({});
      setMessage(''); 
      onTemplateChange?.(false);
    }
  }, [sendQuickMessage, selectedChannel, templates.length, onTemplateChange]);

  useEffect(() => {}, [isDDIOpen, selectedChannel, selectedSector, phoneDDI, phoneNumber]);

  useEffect(() => {
    const hasTemplate = !!selectedTemplate;
    
    onTemplateChange?.(hasTemplate);
    
    if (hasTemplate && templatePreviewRef.current) {
      setTimeout(() => {
        templatePreviewRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [selectedTemplate, onTemplateChange]);

  const loadChannels = async () => {
    if (loadingChannels || channels.length > 0) {
      return;
    }
    
    setLoadingChannels(true);
    setError(null);
    try {
      const data = await fetchChannels();
      const filtered = data.filter((channel) => channel.type === 1 || channel.type === 4);
      
      const sorted = filtered.sort((a, b) => {
        const aIsActive = a.status === 'REGISTERED' || a.status === 'CONNECTED';
        const bIsActive = b.status === 'REGISTERED' || b.status === 'CONNECTED';
        
        if (aIsActive && !bIsActive) return -1;
        if (!aIsActive && bIsActive) return 1;
        return 0;
      });setChannels(sorted);
    } catch (err) {if (window.WlExtension?.alert) {
        window.WlExtension.alert({
          message: 'Erro ao carregar canais. Tente novamente.',
          variant: 'error'
        });
      }
    } finally {
      setLoadingChannels(false);
    }
  };

  const loadSectors = async (canalId: string) => {
    if (!selectedChannel) return;
    
    const cacheKey = `${canalId}_${selectedChannel.organizacaoId}`;
    if (sectorsCacheRef.current[cacheKey]) {setSectors(sectorsCacheRef.current[cacheKey]);
      return;
    }

    setLoadingSectors(true);
    setError(null);
    try {
      const data = await fetchSectors(canalId);

      const canalOrgId = selectedChannel.organizacaoId;

      const filtered = data.filter((sector) => {
        return String(sector.organizationId) === String(canalOrgId);
      });

      sectorsCacheRef.current[cacheKey] = filtered;
      setSectors(filtered);
    } catch (err) {if (window.WlExtension?.alert) {
        window.WlExtension.alert({
          message: 'Erro ao carregar setores. Tente novamente.',
          variant: 'error'
        });
      }
    } finally {
      setLoadingSectors(false);
    }
  };

  const loadTemplates = async (canalId: string) => {
    if (templatesCacheRef.current[canalId]) {setTemplates(templatesCacheRef.current[canalId]);
      return;
    }

    setLoadingTemplates(true);
    setError(null);
    try {
      const data = await fetchTemplates(canalId);
      templatesCacheRef.current[canalId] = data;
      setTemplates(data);
    } catch (err) {if (window.WlExtension?.alert) {
        window.WlExtension.alert({
          message: 'Erro ao carregar templates. Tente novamente.',
          variant: 'error'
        });
      }
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleChannelSelect = (channel: Channel | null) => {
    setSelectedChannel(channel);
    setSelectedSector(null);
    setSectors([]);
    setSendQuickMessage(channel?.type === 4);
    setSelectedTemplate(null);
    setTemplates([]);
    setTemplateImageFile(null);
    setTemplateVideoFile(null);
    setTemplateDocumentFile(null);
    setTemplateImageUrl(null);
    setTemplateVideoUrl(null);
    setTemplateDocumentUrl(null);
    setTemplateVariables({});
    setTemplateButtonValues({});
    setMessage('');
    onTemplateChange?.(false);};

  const handleTemplateSelect = (template: Template | null) => {
    setSelectedTemplate(template);
    setTemplateImageFile(null);
    setTemplateVideoFile(null);
    setTemplateDocumentFile(null);
    setTemplateImageUrl(null);
    setTemplateVideoUrl(null);
    setTemplateDocumentUrl(null);
    setTemplateVariables({});
    setTemplateButtonValues({});
    if (!template) {
      setMessage('');
    }
    if (template && selectedChannel && selectedChannel.type === 4) {
      setSendQuickMessage(true);
    }
  };

  const handleImageChange = (file: File | null, url?: string | null) => {
    setTemplateImageFile(file);
    setTemplateImageUrl(url || null);
  };

  const handleVideoChange = (file: File | null, url?: string | null) => {
    setTemplateVideoFile(file);
    setTemplateVideoUrl(url || null);
  };

  const handleDocumentChange = (file: File | null, url?: string | null) => {
    setTemplateDocumentFile(file);
    setTemplateDocumentUrl(url || null);
  };

  const handleVariableChange = (key: string, value: string) => {
    setTemplateVariables((prev) => ({ ...prev, [key]: value }));
  };

  const handleButtonValueChange = (buttonIndex: number, value: string) => {
    setTemplateButtonValues((prev) => ({ ...prev, [`button_${buttonIndex}`]: value }));
  };

  const processCsvFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          if (!text) {
            reject(new Error('Arquivo CSV vazio'));
            return;
          }

          const lines = text.split(/\r?\n/).filter(line => line.trim());
          if (lines.length === 0) {
            reject(new Error('Nenhuma linha encontrada no CSV'));
            return;
          }

          const firstLine = lines[0];
          let separator = ',';
          if (firstLine.includes(';')) {
            separator = ';';
          } else if (firstLine.includes('\t')) {
            separator = '\t';
          }

          const startIndex = lines[0].match(/\d/) ? 0 : 1;
          const dataLines = lines.slice(startIndex);

          if (dataLines.length > 0) {
            const firstDataLine = dataLines[0].trim();
            if (firstDataLine) {
              let firstLineSeparator = ',';
              if (firstDataLine.includes(';')) {
                firstLineSeparator = ';';
              } else if (firstDataLine.includes('\t')) {
                firstLineSeparator = '\t';
              }
              
              const firstLineParts = firstDataLine.split(firstLineSeparator).map(part => part.trim());
              const firstValue = firstLineParts[0] || '';
              const firstCleanNumber = firstValue.replace(/\D/g, '');
              
              if (!firstCleanNumber || firstCleanNumber.length === 0) {
                reject(new Error('O arquivo CSV deve começar com um número na primeira coluna.'));
                return;
              }
            }
          }

          const hasTemplate = selectedTemplate && Object.keys(templateVariables).length > 0;
          
          if (hasTemplate) {
            const dynamicBodyComponent = selectedTemplate.dynamicComponents?.find(c => c.type === 'BODY');
            const staticBodyComponent = selectedTemplate.staticComponents?.find((c: any) => c.type === 'BODY');
            const bodyText = (dynamicBodyComponent?.text || (staticBodyComponent as any)?.text) || '';
            const variableRegex = /\{\{([^}]+)\}\}/g;
            const variableMatches = Array.from(bodyText.matchAll(variableRegex)) as RegExpMatchArray[];
            const orderedVariables = Array.from(
              new Set(variableMatches.map((match) => match[1].trim()))
            );

            const varValues = orderedVariables
              .map(key => templateVariables[key] || '')
              .join(',');

            const processedLines = dataLines.map(line => {
              const trimmedLine = line.trim();
              if (!trimmedLine) return '';

              const parts = trimmedLine.split(separator).map(part => part.trim());
              const numberPart = parts[0] || '';
              const cleanNumber = numberPart.replace(/\D/g, '');

              if (!cleanNumber) return '';

              if (parts.length > 1) {
                const existingValues = parts.slice(1).join(',');
                return `${phoneDDI}${cleanNumber},${existingValues}`;
              } else {
                return `${phoneDDI}${cleanNumber},${varValues}`;
              }
            }).filter(Boolean);

            const limitedLines = processedLines.slice(0, 10);
            resolve(limitedLines.join('\n'));
          } else {
            const processedLines = dataLines.map(line => {
              const trimmedLine = line.trim();
              if (!trimmedLine) return '';

              const parts = trimmedLine.split(separator).map(part => part.trim());
              const numberPart = parts[0] || '';
              const cleanNumber = numberPart.replace(/\D/g, '');

              if (!cleanNumber) return '';

              if (parts.length > 1) {
                const existingValues = parts.slice(1).join(',');
                return `${phoneDDI}${cleanNumber},${existingValues}`;
              } else {
                return `${phoneDDI}${cleanNumber}`;
              }
            }).filter(Boolean);

            const limitedLines = processedLines.slice(0, 10);
            resolve(limitedLines.join('\n'));
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo CSV'));
      };

      reader.readAsText(file);
    });
  };

  const handleSubmit = async (e?: React.MouseEvent) => {
    if (!e || !e.currentTarget) {return;
    }

    if (!isUserClickRef.current) {return;
    }

    isUserClickRef.current = false;

    const button = e.currentTarget as HTMLButtonElement;
    if (button.textContent?.trim() !== 'OK' || button !== okButtonRef.current) {return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (!selectedChannel || !selectedSector) {
      if (window.WlExtension?.alert) {
        window.WlExtension.alert({
          message: 'Por favor, preencha todos os campos obrigatórios.',
          variant: 'error'
        });
      }
      return;
    }

    if (phoneType === 'csv' && !csvFile) {
      if (window.WlExtension?.alert) {
        window.WlExtension.alert({
          message: 'Por favor, selecione um arquivo CSV.',
          variant: 'error'
        });
      }
      return;
    }

    if (selectedTemplate && sendQuickMessage && selectedChannel?.type === 4) {
      const headerComponent = selectedTemplate.dynamicComponents?.find((c) => c.type === 'HEADER');
      if (headerComponent?.format) {
        const requiresImage = headerComponent.format === 'IMAGE' && !templateImageUrl;
        const requiresVideo = headerComponent.format === 'VIDEO' && !templateVideoUrl;
        const requiresDocument = headerComponent.format === 'DOCUMENT' && !templateDocumentUrl;
        
        if (requiresImage || requiresVideo || requiresDocument) {
          const mediaType = requiresImage ? 'imagem' : requiresVideo ? 'vídeo' : 'documento';
          if (window.WlExtension?.alert) {
            window.WlExtension.alert({
              message: `Por favor, faça o upload da ${mediaType} do template.`,
              variant: 'error'
            });
          }
          return;
        }
      }
    }

    let phone = '';
    if (phoneType === 'numero') {
      phone = phoneDDI && phoneNumber ? `+${phoneDDI}${phoneNumber.replace(/\D/g, '')}` : '';
    } else if (phoneType === 'lista') {
      const lines = phoneList.split('\n').filter(line => line.trim());
      
      if (lines.length > 10) {
        setPhoneListError(true);
        if (window.WlExtension?.alert) {
          window.WlExtension.alert({
            message: 'O limite é de 10 contatos.',
            variant: 'error'
          });
        }
        return;
      }
      
      if (lines.length > 0) {
        const hasTemplate = selectedTemplate && Object.keys(templateVariables).length > 0;
        if (hasTemplate) {
          const dynamicBodyComponent = selectedTemplate.dynamicComponents?.find(c => c.type === 'BODY');
          const staticBodyComponent = selectedTemplate.staticComponents?.find((c: any) => c.type === 'BODY');
          const bodyText = (dynamicBodyComponent?.text || (staticBodyComponent as any)?.text) || '';
          const variableRegex = /\{\{([^}]+)\}\}/g;
          const variableMatches = Array.from(bodyText.matchAll(variableRegex)) as RegExpMatchArray[];
          const orderedVariables = Array.from(
            new Set(variableMatches.map((match) => match[1].trim()))
          );

          const varValues = orderedVariables
            .map(key => templateVariables[key] || '')
            .join(',');
          
          phone = lines.map(line => {
            const trimmedLine = line.trim();
            const parts = trimmedLine.split(',');
            const numberPart = parts[0] || '';
            const cleanNumber = numberPart.replace(/\D/g, '');
            
            if (!cleanNumber) return '';
            
            if (parts.length > 1) {
              const existingValues = parts.slice(1).join(',');
              return `${phoneDDI}${cleanNumber},${existingValues}`;
            } else {
              return `${phoneDDI}${cleanNumber},${varValues}`;
            }
          }).filter(Boolean).join('\n');
        } else {
          phone = lines.map(line => {
            const trimmedLine = line.trim();
            const parts = trimmedLine.split(',');
            const numberPart = parts[0] || '';
            const cleanNumber = numberPart.replace(/\D/g, '');
            
            if (!cleanNumber) return '';
            
            if (parts.length > 1) {
              const existingValues = parts.slice(1).join(',');
              return `${phoneDDI}${cleanNumber},${existingValues}`;
            } else {
              return `${phoneDDI}${cleanNumber}`;
            }
          }).filter(Boolean).join('\n');
        }
      }
    } else if (phoneType === 'csv' && csvFile) {
      try {
        const fileText = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
          reader.readAsText(csvFile);
        });
        
        const allLines = fileText.split(/\r?\n/).filter(line => line.trim());
        const startIndex = allLines[0]?.match(/\d/) ? 0 : 1;
        const dataLinesCount = allLines.slice(startIndex).length;
        
        if (dataLinesCount > 10) {
          if (window.WlExtension?.alert) {
            window.WlExtension.alert({
              message: 'Serão iniciados apenas os 10 primeiros números do CSV.',
              variant: 'warning'
            });
          }
        }
        
        phone = await processCsvFile(csvFile);
        if (!phone) {
          if (window.WlExtension?.alert) {
            window.WlExtension.alert({
              message: 'O arquivo CSV não contém dados válidos.',
              variant: 'error'
            });
          }
          return;
        }
      } catch (error: any) {if (window.WlExtension?.alert) {
          window.WlExtension.alert({
            message: error.message || 'Erro ao processar arquivo CSV. Verifique o formato do arquivo.',
            variant: 'error'
          });
        }
        return;
      }
    }

    const data: StartAttendanceData = {
      channelId: selectedChannel.canalId,
      sectorId: selectedSector.id,
      phone,
      sendQuickMessage: sendQuickMessage && selectedChannel.type === 4,
      templateId: selectedTemplate?.id || null,
      templateImageFile,
      templateVideoFile,
      templateDocumentFile,
      templateImageUrl,
      templateVideoUrl,
      templateDocumentUrl,
      templateVariables,
      templateButtonValues: Object.keys(templateButtonValues).length > 0 ? templateButtonValues : undefined,
      message: message,
      typeSelect: phoneType,
      typeChannel: selectedChannel.type === 4 ? 'cloud' : 'web',
    };

    if (phoneType === 'lista') {
      data.phoneList = phoneList;
    } else if (phoneType === 'csv') {
      data.csvFile = csvFile || undefined;
    }

    try {
      setError(null);
      
      if (phoneType === 'lista' || phoneType === 'csv') {
        setLoadingAttendance(true);
      }
      
      let response;
      if (phoneType === 'numero') {
        response = await startAttendanceNumber(data, selectedTemplate);
      } else {
        response = await startAttendance(data, selectedTemplate);
      }
      const parseTotalAtendimentos = (totalAtendimentosString: string): { successCount: number; message: string } => {
        const match = totalAtendimentosString.match(/(\d+)\s+execuç(?:ões|ão)\s+com\s+sucesso/);
        const successCount = match ? parseInt(match[1], 10) : 0;
        return {
          successCount,
          message: totalAtendimentosString
        };
      };

      const formatMessage = (message: string, successCount: number): string => {
        let formatted = message.replace(/(\d+)\s+execução\s+com\s+sucesso/g, '$1 chat aberto com sucesso');
        formatted = formatted.replace(/(\d+)\s+execuções\s+com\s+sucesso/g, '$1 chats abertos com sucesso');
        
        if (successCount >= 1 && !formatted.match(/\d+\s+com\s+falhas?/i)) {
          const successMatch = formatted.match(/(\d+)\s+chat(s?)\s+aberto(s?)\s+com\s+sucesso/i);
          if (successMatch) {
            const count = successMatch[1];
            const plural = count !== '1';
            return `${count} chat${plural ? 's' : ''} aberto${plural ? 's' : ''} com sucesso`;
          }
        }
        
        formatted = formatted.replace(/0\s+chat\s+aberto\s+com\s+sucesso\s+e\s+/gi, '');
        formatted = formatted.replace(/0\s+chats\s+abertos\s+com\s+sucesso\s+e\s+/gi, '');
        formatted = formatted.replace(/\s+e\s+0\s+com\s+falhas?\s*/gi, '');
        formatted = formatted.replace(/\b1\s+com\s+falhas\b/g, '1 com falha');
        return formatted.trim();
      };

      if (window.WlExtension?.alert) {
        if (phoneType === 'numero') {
          window.WlExtension.alert({
            message: 'Atendimento iniciado com sucesso',
            variant: 'success'
          });
        } else {
          const totalAtendimentos = response?.totalAtendimentos || '';
          
          if (!totalAtendimentos) {
            window.WlExtension.alert({
              message: 'Atendimento iniciado com sucesso',
              variant: 'success'
            });
          } else {
            const parsed = parseTotalAtendimentos(totalAtendimentos);
            const formattedMessage = formatMessage(totalAtendimentos, parsed.successCount);
            
            if (parsed.successCount >= 1) {
              window.WlExtension.alert({
                message: formattedMessage,
                variant: 'success'
              });
            } else {
              window.WlExtension.alert({
                message: formattedMessage,
                variant: 'error'
              });
              return;
            }
          }
        }
      }

      if (window.WlExtension?.closeModal) {
        window.WlExtension.closeModal({});
      }

      if (onSubmit) {
        onSubmit(data);
      }
    } catch (error: any) {if (window.WlExtension?.alert) {
        window.WlExtension.alert({
          message: error.message || 'Erro ao iniciar atendimento. Tente novamente.',
          variant: 'error'
        });
      }
    } finally {
      setLoadingAttendance(false);
    }
  };

  const SectorSelect = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSectors = sectors.filter((sector) =>
      sector.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
      if (openDropdown && openDropdown !== 'sector') {
        setIsOpen(false);
      }
    }, [openDropdown]);


    const hasValue = !!selectedSector;
    const isFocused = isOpen;

    return (
      <div className="relative w-full" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <div className="relative">
          <label
            className={`absolute left-4 transition-all duration-200 pointer-events-none ${isFocused || hasValue
                ? '-top-2.5 bg-white px-1 text-xs text-text-secondary'
                : 'top-1/2 -translate-y-1/2 text-sm text-text-secondary z-10'
              }`}
          >
            Setor
          </label>
          <input
            type="text"
            value={selectedSector ? selectedSector.name : searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!isOpen) {
                setIsOpen(true);
                setOpenDropdown('sector');
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            onFocus={(e) => {e.preventDefault();
              setIsOpen(true);
              setOpenDropdown('sector');
              if (isDDIOpen) {setIsDDIOpen(false);
              }
            }}
            onClick={(e) => {e.preventDefault();
              e.stopPropagation();
            }}
            placeholder={isFocused || hasValue ? 'Selecione o setor' : ''}
            disabled={!selectedChannel || loadingSectors}
            className={`w-full px-4 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50 disabled:cursor-not-allowed ${isFocused || hasValue ? 'pt-5 pb-2' : 'py-3'
              }`}
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(!isOpen);
              setOpenDropdown(isOpen ? null : 'sector');
            }}
            disabled={!selectedChannel || loadingSectors}
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
          <div className="absolute z-50 w-full mt-2 bg-white border border-border rounded-lg shadow-md max-h-60 overflow-auto">
            {loadingSectors ? (
              <div className="p-4 text-center text-sm text-text-secondary">Carregando...</div>
            ) : filteredSectors.length === 0 && sectors.length === 0 ? (
              <div className="p-4 text-center text-sm text-text-secondary">Nenhum setor encontrado</div>
            ) : filteredSectors.length === 0 && sectors.length > 0 ? (
              <div className="p-4 text-center text-sm text-text-secondary">
                Nenhum setor encontrado para "{searchTerm}"
              </div>
            ) : (
              filteredSectors.map((sector) => (
                <div
                  key={sector.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedSector(sector);
                    setIsOpen(false);
                    setOpenDropdown(null);
                    setSearchTerm('');
                  }}
                  className={`px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 transition-colors ${selectedSector?.id === sector.id ? 'bg-primary/5 text-primary font-medium' : 'text-text-primary'
                    }`}
                >
                  {sector.name}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  const TemplateSelect = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTemplates = templates.filter((template) =>
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
      if (openDropdown && openDropdown !== 'template') {
        setIsOpen(false);
      }
    }, [openDropdown]);

    const hasValue = !!selectedTemplate;
    const isFocused = isOpen;

    return (
      <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <label
            className={`absolute left-4 transition-all duration-200 pointer-events-none ${isFocused || hasValue
                ? '-top-2.5 bg-white px-1 text-xs text-text-secondary'
                : 'top-1/2 -translate-y-1/2 text-sm text-text-secondary z-10'
              }`}
          >
            Modelo de mensagem
          </label>
          <input
            type="text"
            value={selectedTemplate ? `${selectedTemplate.description} (pt_BR)` : searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!isOpen) {
                setIsOpen(true);
                setOpenDropdown('template');
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            onFocus={(e) => {
              e.preventDefault();
              setIsOpen(true);
              setOpenDropdown('template');
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            placeholder={isFocused || hasValue ? 'Selecione o modelo' : ''}
            disabled={!sendQuickMessage || loadingTemplates}
            className={`w-full px-4 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50 disabled:cursor-not-allowed ${isFocused || hasValue ? 'pt-5 pb-2' : 'py-3'
              }`}
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(!isOpen);
              setOpenDropdown(isOpen ? null : 'template');
            }}
            disabled={!sendQuickMessage || loadingTemplates}
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
            className={`absolute z-50 w-full bg-white border border-border rounded-lg shadow-md max-h-60 overflow-auto ${
              templates.length >= 3 ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {loadingTemplates ? (
              <div className="p-4 text-center text-sm text-text-secondary">Carregando...</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="p-4 text-center text-sm text-text-secondary">Nenhum template encontrado</div>
            ) : (
              filteredTemplates.map((template) => {
                return (
                  <div
                    key={template.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTemplateSelect(template);
                      setIsOpen(false);
                      setOpenDropdown(null);
                      setSearchTerm('');
                    }}
                    className={`px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-2 ${selectedTemplate?.id === template.id ? 'bg-primary/5 text-primary font-medium' : 'text-text-primary'
                      }`}
                  >
                    <span className="flex-1">{template.description}</span>
                    <span className="text-text-secondary font-medium">$</span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-5 space-y-5">
      {/* Tela de loading para lista/CSV */}
      {loadingAttendance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-text-primary">Iniciando atendimentos</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Campo Canal */}
      <SelectWithSearch
        options={channels}
        value={selectedChannel}
        onChange={handleChannelSelect}
        placeholder="Selecione o canal"
        label="Canal"
        isLoading={loadingChannels}
        onOpenChange={(isOpen) => setOpenDropdown(isOpen ? 'channel' : null)}
        getOptionLabel={(channel) => channel.descricao}
        renderOption={(channel) => {
          const formatPhone = (number: string, ddi: string) => {
            if (!number) return '';
            const cleaned = number.replace(/\D/g, '');
            if (cleaned.length <= 2) return `+${ddi} ${cleaned}`;
            if (cleaned.length <= 7) return `+${ddi} (${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
            return `+${ddi} (${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
          };

          return (
            <div>
              <div className="font-medium text-sm text-text-primary">{channel.descricao}</div>
              <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>{channel.type === 4 ? 'CLOUD' : 'WEB'}</span>
                {channel.ddi && channel.number && (
                  <>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span>{formatPhone(channel.number, channel.ddi)}</span>
                  </>
                )}
                {channel.organizacao && (
                  <>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    <span>{channel.organizacao}</span>
                  </>
                )}
              </div>
            </div>
          );
        }}
      />

      {/* Campo Setor */}
      <SectorSelect />

      {/* Campo Telefone */}
      <div className="flex gap-3 items-start">
        {/* DDI Selector - sempre visível, tamanho fixo */}
        <div className="relative w-32 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {e.preventDefault();
              e.stopPropagation();
              if (selectedChannel) {setIsDDIOpen(!isDDIOpen);
              } else {}
            }}
            onMouseDown={(e) => {e.stopPropagation();
            }}
            disabled={!selectedChannel}
            className="w-full px-4 py-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50 disabled:cursor-not-allowed flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">
                {DDI_OPTIONS.find((opt) => opt.code === phoneDDI)?.flag || '🇧🇷'}
              </span>
              <span className="text-sm">+{phoneDDI}</span>
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
                    setPhoneDDI(option.code);
                    setIsDDIOpen(false);
                  }}
                  className="w-full px-4 py-3 text-sm text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-text-primary"
                >
                  <span className="text-lg">{option.flag}</span>
                  <span className="flex-1">+{option.code} - {option.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Campo principal - transforma baseado no tipo */}
        <div className="relative flex-1">
          {phoneType === 'numero' && (
            <label
              className={`absolute left-4 transition-all duration-200 pointer-events-none ${isPhoneFocused || phoneNumber
                  ? '-top-2.5 bg-white px-1 text-xs text-text-secondary'
                  : 'top-1/2 -translate-y-1/2 text-sm text-text-secondary z-10'
                }`}
            >
              Telefone
            </label>
          )}

          {/* Modo Número */}
          {phoneType === 'numero' && (
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
              placeholder={isPhoneFocused || phoneNumber ? 'Telefone' : ''}
              onFocus={() => {
                setIsPhoneFocused(true);
                setIsDDIOpen(false);
              }}
              onBlur={() => setIsPhoneFocused(false)}
              disabled={!selectedChannel}
              className={`w-full px-4 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50 disabled:cursor-not-allowed ${(isPhoneFocused || phoneNumber) ? 'pt-5 pb-2' : 'py-3'
                }`}
            />
          )}

          {/* Modo Lista */}
          {phoneType === 'lista' && (
            <textarea
              value={phoneList}
              onChange={(e) => {
                const value = e.target.value;
                const lines = value.split('\n').filter(line => line.trim());
                
                if (lines.length <= 10) {
                  setPhoneListError(false);
                }
                
                setPhoneList(value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const lines = phoneList.split('\n').filter(line => line.trim());
                  if (lines.length >= 10) {
                    e.preventDefault();
                    setPhoneListError(true);
                    if (window.WlExtension?.alert) {
                      window.WlExtension.alert({
                        message: 'O limite é de 10 contatos.',
                        variant: 'error'
                      });
                    }
                  }
                }
              }}
              placeholder="Digite os números, um por linha&#10;Ex.: 5511999999999,variavel1,variavel2"
              rows={2}
              disabled={!selectedChannel}
              onFocus={() => {
                setIsDDIOpen(false);
                setPhoneListError(false);
              }}
              className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all resize-none disabled:bg-gray-50 disabled:cursor-not-allowed overflow-y-auto ${
                phoneListError 
                  ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' 
                  : 'border-border focus:ring-primary/20 focus:border-primary'
              }`}
            />
          )}


          {/* Modo CSV */}
          {phoneType === 'csv' && (
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setCsvFile(file);
                }}
                disabled={!selectedChannel}
                onFocus={() => setIsDDIOpen(false)}
                className="w-full px-4 py-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50 disabled:cursor-not-allowed file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>
          )}
        </div>

        {/* Selector de tipo */}
        <div className="w-32 flex-shrink-0">
          <select
            value={phoneType}
            onChange={(e) => {
              setPhoneType(e.target.value as 'numero' | 'lista' | 'csv');
              setPhoneNumber('');
              setPhoneList('');
              setCsvFile(null);
            }}
            disabled={!selectedChannel}
            className="w-full px-4 py-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
          >
            <option value="numero">Número</option>
            <option value="lista">Lista</option>
            <option value="csv">CSV</option>
          </select>
        </div>
      </div>

      {/* Switch Enviar resposta rápida (somente se type = 4) */}
      {selectedChannel && selectedChannel.type === 4 && (
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={sendQuickMessage}
              onChange={(e) => setSendQuickMessage(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
          </label>
          <span className="text-sm font-normal text-text-primary">
            Enviar template?
          </span>
        </div>
      )}

      {/* Select de Template (somente se switch ligado e type = 4) */}
      {selectedChannel && selectedChannel.type === 4 && sendQuickMessage && (
        <TemplateSelect />
      )}

      {/* Template Preview (campos dinâmicos) */}
      {selectedTemplate && (
        <div ref={templatePreviewRef}>
          <TemplatePreview
            template={selectedTemplate}
            imageFile={templateImageFile}
            videoFile={templateVideoFile}
            documentFile={templateDocumentFile}
            variables={templateVariables}
            onImageChange={handleImageChange}
            onVideoChange={handleVideoChange}
            onDocumentChange={handleDocumentChange}
            onVariableChange={handleVariableChange}
            onMessageChange={setMessage}
            buttonValues={templateButtonValues}
            onButtonValueChange={handleButtonValueChange}
          />
        </div>
      )}

      {/* Campo Mensagem - somente se type !== 4 */}
      {(!selectedChannel || selectedChannel.type !== 4) && (
        <div className="relative">
          <label
            className={`absolute left-4 transition-all duration-200 pointer-events-none ${isMessageFocused || message
                ? '-top-2.5 bg-white px-1 text-xs text-text-secondary'
                : 'top-4 text-sm text-text-secondary z-10'
              }`}
          >
            Mensagem
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => setIsMessageFocused(true)}
            onBlur={() => setIsMessageFocused(false)}
            placeholder={isMessageFocused || message ? 'Digite sua mensagem' : ''}
            rows={4}
            className={`w-full text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none ${isMessageFocused || message ? 'pl-4 pr-4 pt-5 pb-3' : 'pl-4 pr-4 py-3'
              }`}
          />
        </div>
      )}

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const button = e.currentTarget as HTMLButtonElement;
            if (button.textContent?.trim() !== 'CANCELAR') {
              return;
            }
            setSelectedChannel(null);
            setSelectedSector(null);
            setSendQuickMessage(false);
            setSelectedTemplate(null);
            setTemplateImageFile(null);
            setTemplateVideoFile(null);
            setTemplateDocumentFile(null);
            setTemplateImageUrl(null);
            setTemplateVideoUrl(null);
            setTemplateDocumentUrl(null);
            setTemplateVariables({});
            setPhoneDDI('55');
            setPhoneNumber('');
            setPhoneType('numero');
            setPhoneList('');
            setCsvFile(null);
            setMessage('');
            setError(null);
            onTemplateChange?.(false);
          }}
          className="px-6 py-2.5 text-sm font-normal text-text-primary bg-transparent border border-border rounded-lg hover:bg-gray-50 transition-colors"
        >
          CANCELAR
        </button>
        <button
          ref={okButtonRef}
          type="button"
          onMouseDown={(e) => {
            isUserClickRef.current = true;
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isUserClickRef.current) {return;
            }
            handleSubmit(e);
          }}
          className="px-6 py-2.5 text-sm font-normal bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
        >
          OK
        </button>
      </div>
    </div>
  );
}

