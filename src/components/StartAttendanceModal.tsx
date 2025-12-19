import { useState, useEffect, useRef } from 'react';
import { fetchChannels, fetchSectors, fetchTemplates, startAttendance } from '../services/api';
import type { Channel, Sector, Template, StartAttendanceData } from '../types';
import SelectWithSearch from './ui/SelectWithSearch';
import TemplatePreview from './ui/TemplatePreview';

// WlExtension type is declared in src/types/extension.ts

const DDI_OPTIONS = [
  { code: '52', flag: '🇲🇽', name: 'México' },
  { code: '55', flag: '🇧🇷', name: 'Brasil' },
  { code: '1',  flag: '🇺🇸', name: 'EUA/Canadá' },
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
  { code: '20', flag: '🇪🇬', name: 'Egito' }
];

interface StartAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StartAttendanceData) => void;
}

export default function StartAttendanceModal({
  isOpen,
  onClose,
  onSubmit,
}: StartAttendanceModalProps) {
  // Estados principais
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
  const [isDDIOpen, setIsDDIOpen] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);

  // Estados de loading e erro
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingSectors, setLoadingSectors] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && channels.length === 0) {
      loadChannels();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedChannel) {
      loadSectors(selectedChannel.canalId);
      setPhoneDDI('55');
    } else {
      setSectors([]);
      setSelectedSector(null);
    }
  }, [selectedChannel]);

  useEffect(() => {
    if (sendQuickMessage && selectedChannel && selectedChannel.type === 4) {
      loadTemplates(selectedChannel.canalId);
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
    }
  }, [sendQuickMessage, selectedChannel]);

  useEffect(() => {}, [selectedSector, selectedChannel]);

  useEffect(() => {}, [isDDIOpen, selectedChannel]);

  useEffect(() => {
    if (!isDDIOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target) return;

      const ddiButton = target.closest('[data-ddi-selector]');
      const ddiDropdown = target.closest('[data-ddi-dropdown]');
      const isSectorInput = target.closest('[data-sector-select]');
      const isTemplateInput = target.closest('[data-template-select]');
      const isAnyDropdown = target.closest('[data-dropdown]');
      if (!ddiButton && !ddiDropdown && !isSectorInput && !isTemplateInput && !isAnyDropdown) {
        setIsDDIOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isDDIOpen]);

  const loadChannels = async () => {
    setLoadingChannels(true);
    setError(null);
    try {
      const data = await fetchChannels();
      setChannels(data);
    } catch (err) {
      setError('Erro ao carregar canais. Tente novamente.');
    } finally {
      setLoadingChannels(false);
    }
  };

  const loadSectors = async (canalId: string) => {
    if (!selectedChannel) {
      return;
    }
    setLoadingSectors(true);
    setError(null);
    try {
      const data = await fetchSectors(canalId);
      const filtered = data.filter(
        (sector) => sector.organizationId === selectedChannel.organizacaoId
      );
      setSectors(filtered);
    } catch (err) {
      setError('Erro ao carregar setores. Tente novamente.');
    } finally {
      setLoadingSectors(false);
    }
  };

  const loadTemplates = async (canalId: string) => {
    setLoadingTemplates(true);
    setError(null);
    try {
      const data = await fetchTemplates(canalId);
      setTemplates(data);
    } catch (err) {
      setError('Erro ao carregar templates. Tente novamente.');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleChannelSelect = (channel: Channel | null) => {
    setSelectedChannel(channel);
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
    setTemplateButtonValues({});
    setMessage('');
  };

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

  const handleSubmit = async () => {
    if (!selectedChannel || !selectedSector) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    let phone = '';
    if (phoneType === 'numero') {
      phone = phoneDDI && phoneNumber ? `+${phoneDDI}${phoneNumber.replace(/\D/g, '')}` : '';
    } else if (phoneType === 'lista') {
      // Para lista, processar cada linha e combinar com variáveis se houver template
      const lines = phoneList.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        // Se houver template com variáveis, formatar como: numero,var1,var2
        const hasTemplate = selectedTemplate && Object.keys(templateVariables).length > 0;
        if (hasTemplate) {
          // Extrair variáveis na ordem em que aparecem no template
          // Buscar BODY tanto em dynamicComponents quanto em staticComponents
          const dynamicBodyComponent = selectedTemplate.dynamicComponents?.find(c => c.type === 'BODY');
          const staticBodyComponent = selectedTemplate.staticComponents?.find((c: any) => c.type === 'BODY');
          const bodyText = (dynamicBodyComponent?.text || (staticBodyComponent as any)?.text) || '';
          const variableRegex = /\{\{([^}]+)\}\}/g;
          const variableMatches = Array.from(bodyText.matchAll(variableRegex)) as RegExpMatchArray[];
          const orderedVariables = Array.from(
            new Set(variableMatches.map((match: RegExpMatchArray) => match[1].trim()))
          );
          
          const varValues = orderedVariables
            .map(key => templateVariables[key] || '')
            .join(',');
          phone = lines.map(line => {
            const cleanNumber = line.trim().replace(/\D/g, '');
            return cleanNumber ? `${phoneDDI}${cleanNumber},${varValues}` : '';
          }).filter(Boolean).join('\n');
        } else {
          phone = lines.map(line => {
            const cleanNumber = line.trim().replace(/\D/g, '');
            return cleanNumber ? `${phoneDDI}${cleanNumber}` : '';
          }).filter(Boolean).join('\n');
        }
      }
    } else if (phoneType === 'csv' && csvFile) {
      // Para CSV, o processamento será feito no backend ou em outro lugar
      // Por enquanto, apenas passar o arquivo
      phone = 'csv_file';
    }

    // Construir objeto baseado no typeSelect
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
      message: message || (selectedTemplate ? '' : ''),
      typeSelect: phoneType,
    };

    // Adicionar campos condicionais baseado no typeSelect
    if (phoneType === 'lista') {
      data.phoneList = phoneList;
    } else if (phoneType === 'csv') {
      data.csvFile = csvFile || undefined;
    }
    // Se for 'numero', não adicionar phoneList nem csvFile

    // Enviar dados para o endpoint
    try {
      setError(null);
      await startAttendance(data, selectedTemplate);
      onSubmit(data);
    } catch (error: any) {
      setError(error.message || 'Erro ao iniciar atendimento. Tente novamente.');
    }
  };

  const handleClose = () => {
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
    setTemplateButtonValues({});
    setPhoneDDI('55');
    setPhoneNumber('');
    setPhoneType('numero');
    setPhoneList('');
    setCsvFile(null);
    setMessage('');
    setError(null);
    onClose();
  };

  useEffect(() => {});

  if (!isOpen) return null;

  // Componente de select para setores (reutilizando SelectWithSearch)
  const SectorSelect = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredSectors = sectors.filter((sector) =>
      sector.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        const target = event.target as Node;
        const isInside = containerRef.current?.contains(target);
        if (containerRef.current && !isInside) {
          setIsOpen(false);
          if (!selectedSector) {
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
    }, [isOpen, selectedSector]);

    return (
      <div 
        ref={containerRef}
        data-sector-select
        className="relative w-full"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
        <div className="relative">
          <input
            type="text"
            value={selectedSector ? selectedSector.name : searchTerm}
            onChange={(e) => {
              e.stopPropagation();
              setSearchTerm(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={(e) => {e.stopPropagation();
              setIsOpen(true);
              setIsDDIOpen(false);
            }}
            onMouseDown={(e) => {e.stopPropagation();
            }}
            onClick={(e) => {e.stopPropagation();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            placeholder="Selecione o setor"
            disabled={!selectedChannel || loadingSectors}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!selectedChannel || loadingSectors) return;
              setIsOpen(!isOpen);
              setIsDDIOpen(false);
            }}
            disabled={!selectedChannel || loadingSectors}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
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
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {loadingSectors ? (
              <div className="p-4 text-center text-gray-500">Carregando...</div>
            ) : filteredSectors.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Nenhum setor encontrado</div>
            ) : (
              filteredSectors.map((sector) => (
                <div
                  key={sector.id}
                  onClick={(e) => {e.preventDefault();
                    e.stopPropagation();
                    setSelectedSector(sector);
                    setIsOpen(false);
                    setSearchTerm('');
                    setIsDDIOpen(false);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedSector?.id === sector.id ? 'bg-blue-50' : ''
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

  // Componente de select para templates
  const TemplateSelect = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredTemplates = templates.filter((template) =>
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          if (!selectedTemplate) {
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
    }, [isOpen, selectedTemplate]);

    return (
      <div 
        ref={containerRef}
        data-template-select
        className="relative w-full"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Modelo de mensagem
        </label>
        <div className="relative">
          <input
            type="text"
            value={selectedTemplate ? `${selectedTemplate.description} (pt_BR)` : searchTerm}
            onChange={(e) => {
              e.stopPropagation();
              setSearchTerm(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={(e) => {
              e.stopPropagation();
              setIsOpen(true);
              setIsDDIOpen(false);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            placeholder="Selecione o modelo"
            disabled={!sendQuickMessage || loadingTemplates}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!sendQuickMessage || loadingTemplates) return;
              setIsOpen(!isOpen);
              setIsDDIOpen(false);
            }}
            disabled={!sendQuickMessage || loadingTemplates}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
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
            data-dropdown
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {loadingTemplates ? (
              <div className="p-4 text-center text-gray-500">Carregando...</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Nenhum template encontrado</div>
            ) : (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTemplateSelect(template);
                    setIsOpen(false);
                    setSearchTerm('');
                    setIsDDIOpen(false);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                    selectedTemplate?.id === template.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>{template.description} (pt_BR)</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-900 text-white px-6 py-4 rounded-t-lg">
          <h2 className="text-lg font-semibold text-center">Iniciar Atendimento</h2>
        </div>

        {/* Content */}
        <div 
          className="p-6 space-y-5"
          onClick={(e) => {
            // Prevenir que cliques no conteúdo acionem comportamentos indesejados
            const target = e.target as HTMLElement;
            // Se o clique foi em um input, select ou dropdown, não fazer nada
            if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.closest('[data-dropdown]') || target.closest('[data-ddi-selector]') || target.closest('[data-ddi-dropdown]') || target.closest('[data-sector-select]') || target.closest('[data-template-select]')) {
              return;
            }
          }}
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
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
                  <div className="font-medium text-gray-900">{channel.descricao}</div>
                  <div className="text-sm text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span>{channel.type === 4 ? 'CLOUD' : 'WEB'}</span>
                    {channel.ddi && channel.number && (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        <span>{formatPhone(channel.number, channel.ddi)}</span>
                      </>
                    )}
                    {channel.organizacao && (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
                data-ddi-selector
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const target = e.target as HTMLElement;
                  const isDirectClick = target.closest('[data-ddi-selector]') === e.currentTarget;
                  if (selectedChannel && isDirectClick) {
                    setIsDDIOpen(!isDDIOpen);
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                disabled={!selectedChannel}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-between"
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
                <div 
                  data-ddi-dropdown
                  className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-md shadow-md max-h-48 overflow-auto"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {DDI_OPTIONS.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPhoneDDI(option.code);
                        setIsDDIOpen(false);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="w-full px-4 py-3 text-sm text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-900"
                    >
                      <span className="text-lg">{option.flag}</span>
                      <span>+{option.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Campo principal - transforma baseado no tipo */}
            <div className="relative flex-1">
              {phoneType === 'numero' && (
                <label
                  className={`absolute left-3 transition-all duration-200 pointer-events-none ${
                    isPhoneFocused || phoneNumber
                      ? '-top-2.5 bg-white px-1 text-xs text-gray-500'
                      : 'top-1/2 -translate-y-1/2 text-sm text-gray-500 z-10'
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
                  placeholder={isPhoneFocused || phoneNumber ? 'Telefone' : ''}
                  onFocus={() => {
                    setIsPhoneFocused(true);
                    setIsDDIOpen(false);
                  }}
                  onBlur={() => setIsPhoneFocused(false)}
                  disabled={!selectedChannel}
                  className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    (isPhoneFocused || phoneNumber) ? 'pt-5 pb-2' : ''
                  }`}
                />
              )}

              {/* Modo Lista */}
              {phoneType === 'lista' && (
                <textarea
                  value={phoneList}
                  onChange={(e) => setPhoneList(e.target.value)}
                  placeholder="Digite os números, um por linha"
                  rows={2}
                  disabled={!selectedChannel}
                  onFocus={() => setIsDDIOpen(false)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none disabled:bg-gray-100 disabled:cursor-not-allowed overflow-y-auto"
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="numero">Número</option>
                <option value="lista">Lista</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          </div>

          {/* Mensagem de ajuda para Lista com template */}
          {phoneType === 'lista' && selectedTemplate && Object.keys(templateVariables).length > 0 && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700">
              <div className="font-medium mb-1">Formato para templates:</div>
              <div className="font-mono">
                {phoneDDI}xx9xxxxxxxx,{(() => {
                  // Buscar BODY tanto em dynamicComponents quanto em staticComponents
                  const dynamicBodyComponent = selectedTemplate.dynamicComponents?.find(c => c.type === 'BODY');
                  const staticBodyComponent = selectedTemplate.staticComponents?.find((c: any) => c.type === 'BODY');
                  const bodyText = (dynamicBodyComponent?.text || (staticBodyComponent as any)?.text) || '';
                  const variableRegex = /\{\{([^}]+)\}\}/g;
                  const variableMatches = Array.from(bodyText.matchAll(variableRegex)) as RegExpMatchArray[];
                  const orderedVariables: string[] = Array.from(
                    new Set(variableMatches.map((match: RegExpMatchArray) => match[1].trim()))
                  );
                  return orderedVariables.map(key => templateVariables[key] || `variavel${key}`).join(',');
                })()}
              </div>
              <div className="mt-2 text-blue-600">
                As variáveis serão preenchidas automaticamente conforme definido no preview do template.
              </div>
            </div>
          )}

          {/* Mensagem de ajuda para CSV com template */}
          {phoneType === 'csv' && selectedTemplate && Object.keys(templateVariables).length > 0 && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700">
              <div className="font-medium mb-1">Formato esperado no CSV:</div>
              <div className="font-mono text-xs">
                número,{(() => {
                  // Buscar BODY tanto em dynamicComponents quanto em staticComponents
                  const dynamicBodyComponent = selectedTemplate.dynamicComponents?.find(c => c.type === 'BODY');
                  const staticBodyComponent = selectedTemplate.staticComponents?.find((c: any) => c.type === 'BODY');
                  const bodyText = (dynamicBodyComponent?.text || (staticBodyComponent as any)?.text) || '';
                  const variableRegex = /\{\{([^}]+)\}\}/g;
                  const variableMatches = Array.from(bodyText.matchAll(variableRegex)) as RegExpMatchArray[];
                  const orderedVariables = Array.from(
                    new Set(variableMatches.map((match: RegExpMatchArray) => match[1].trim()))
                  );
                  return orderedVariables.map(key => `variavel${key}`).join(',');
                })()}
              </div>
              <div className="mt-2 text-blue-600">
                O CSV deve conter a coluna do número e as colunas das variáveis do template.
              </div>
            </div>
          )}

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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
              <span className="text-sm font-medium text-gray-700">
                Enviar Template?
              </span>
            </div>
          )}

          {/* Select de Template (somente se switch ligado e type = 4) */}
          {selectedChannel && selectedChannel.type === 4 && sendQuickMessage && (
            <TemplateSelect />
          )}

          {/* Template Preview (campos dinâmicos) */}
          {selectedTemplate && (
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
          )}

          {/* Campo Mensagem - somente se não usar template ou se canal não for type 4 */}
          {(!selectedChannel || selectedChannel.type !== 4 || !sendQuickMessage || !selectedTemplate) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem
              </label>
              <div className="relative">
                <div className="absolute left-3 top-3">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem"
                  rows={4}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
          
          {/* Exibir mensagem final quando usar template */}
          {selectedChannel && selectedChannel.type === 4 && sendQuickMessage && selectedTemplate && message && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem
              </label>
              <div className="relative">
                <div className="absolute left-3 top-3">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <textarea
                  value={message}
                  readOnly
                  rows={4}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer com botões */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
          >
            CANCELAR
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-950 transition-colors font-medium"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

