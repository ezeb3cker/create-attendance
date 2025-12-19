import React, { useEffect, useState } from 'react';
import type { Template } from '../../types';
import { uploadFile } from '../../services/api';

interface TemplatePreviewProps {
  template: Template | null;
  imageFile: File | null;
  videoFile?: File | null;
  documentFile?: File | null;
  variables: Record<string, string>;
  onImageChange: (file: File | null, url?: string | null) => void;
  onVideoChange?: (file: File | null, url?: string | null) => void;
  onDocumentChange?: (file: File | null, url?: string | null) => void;
  onVariableChange: (key: string, value: string) => void;
  onMessageChange: (message: string) => void;
  buttonValues?: Record<string, string>;
  onButtonValueChange?: (buttonIndex: number, value: string) => void;
}

export default function TemplatePreview({
  template,
  imageFile,
  videoFile = null,
  documentFile = null,
  variables,
  onImageChange,
  onVideoChange,
  onDocumentChange,
  onVariableChange,
  onMessageChange,
  buttonValues = {},
  onButtonValueChange,
}: TemplatePreviewProps) {
  const headerComponent = template?.dynamicComponents?.find((c) => c.type === 'HEADER');
  // Buscar BODY tanto em dynamicComponents quanto em staticComponents
  const dynamicBodyComponent = template?.dynamicComponents?.find((c) => c.type === 'BODY');
  const staticBodyComponent = template?.staticComponents?.find((c: any) => c.type === 'BODY');
  const bodyComponent = dynamicBodyComponent || staticBodyComponent;
  const footerComponent = template?.dynamicComponents?.find((c) => c.type === 'FOOTER');
  
  // Buscar botões em staticComponents (type: "BUTTONS") ou em dynamicComponents
  const staticButtonsComponent = template?.staticComponents?.find((c) => c.type === 'BUTTONS');
  const dynamicButtonsComponent = template?.dynamicComponents?.find((c) => c.buttons && c.buttons.length > 0);
  const templateButtons = staticButtonsComponent?.buttons || dynamicButtonsComponent?.buttons || footerComponent?.buttons || [];

  const hasHeaderImage = headerComponent?.format === 'IMAGE';
  const hasHeaderVideo = headerComponent?.format === 'VIDEO';
  const hasHeaderDocument = headerComponent?.format === 'DOCUMENT';
  const bodyText = (bodyComponent as any)?.text || '';

  // Extrair variáveis do texto usando regex - captura qualquer conteúdo entre {{ }}
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const variableMatches = Array.from(bodyText.matchAll(variableRegex)) as RegExpMatchArray[];
  const uniqueVariables = Array.from(
    new Set(variableMatches.map((match: RegExpMatchArray) => match[1].trim()))
  );

  // Gerar mensagem final com variáveis substituídas
  useEffect(() => {
    if (!bodyText) {
      onMessageChange('');
      return;
    }

    let finalMessage = bodyText;
    uniqueVariables.forEach((varKey) => {
      const value = variables[varKey] || `{{${varKey}}}`;
      // Escapar caracteres especiais na chave para regex
      const escapedKey = varKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      finalMessage = finalMessage.replace(new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g'), value);
    });

    onMessageChange(finalMessage);
  }, [bodyText, variables, uniqueVariables, onMessageChange]);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setUploadingImage(true);
      setUploadError(null);
      try {
        const response = await uploadFile(file);
        const fileUrl = response?.fileUrl || null;
        onImageChange(file, fileUrl);
      } catch (error) {
        setUploadError('Erro ao fazer upload da imagem. Tente novamente.');
        onImageChange(null, null);
      } finally {
        setUploadingImage(false);
      }
    } else {
      onImageChange(null, null);
    }
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setUploadingVideo(true);
      setUploadError(null);
      try {
        const response = await uploadFile(file);
        const fileUrl = response?.fileUrl || null;
        onVideoChange?.(file, fileUrl);
      } catch (error) {
        setUploadError('Erro ao fazer upload do vídeo. Tente novamente.');
        onVideoChange?.(null, null);
      } finally {
        setUploadingVideo(false);
      }
    } else {
      onVideoChange?.(null, null);
    }
  };

  const handleDocumentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setUploadingDocument(true);
      setUploadError(null);
      try {
        const response = await uploadFile(file);
        const fileUrl = response?.fileUrl || null;
        onDocumentChange?.(file, fileUrl);
      } catch (error) {
        setUploadError('Erro ao fazer upload do documento. Tente novamente.');
        onDocumentChange?.(null, null);
      } finally {
        setUploadingDocument(false);
      }
    } else {
      onDocumentChange?.(null, null);
    }
  };

  // Função para renderizar texto com formatação markdown (negrito e itálico)
  const renderFormattedText = (text: string, keyPrefix: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    let partKey = 0;

    // Processar em ordem de prioridade:
    // 1. Negrito e itálico juntos: *_texto_* (deve vir antes para evitar conflitos)
    // 2. Negrito: *texto* (mas não os que já estão em *_texto_*)
    // 3. Itálico: _texto_ (mas não os que já estão em *_texto_*)
    
    // Criar array de tokens com posições
    const tokens: Array<{
      index: number;
      length: number;
      type: 'bold-italic' | 'bold' | 'italic' | 'text';
      content: string;
    }> = [];

    // Primeiro, marcar negrito e itálico combinados
    const combinedRegex = /\*_([^*_]+)_\*/g;
    let combinedMatch;
    const usedIndices = new Set<number>();
    
    while ((combinedMatch = combinedRegex.exec(text)) !== null) {
      const start = combinedMatch.index;
      const end = start + combinedMatch[0].length;
      // Marcar todos os índices como usados
      for (let i = start; i < end; i++) {
        usedIndices.add(i);
      }
      tokens.push({
        index: start,
        length: combinedMatch[0].length,
        type: 'bold-italic',
        content: combinedMatch[1],
      });
    }

    // Depois, processar negrito individual (mas apenas os não usados)
    const boldRegex = /\*([^*]+)\*/g;
    let boldMatch;
    while ((boldMatch = boldRegex.exec(text)) !== null) {
      const start = boldMatch.index;
      const end = start + boldMatch[0].length;
      // Verificar se algum índice já foi usado
      let isUsed = false;
      for (let i = start; i < end; i++) {
        if (usedIndices.has(i)) {
          isUsed = true;
          break;
        }
      }
      if (!isUsed) {
        tokens.push({
          index: start,
          length: boldMatch[0].length,
          type: 'bold',
          content: boldMatch[1],
        });
        for (let i = start; i < end; i++) {
          usedIndices.add(i);
        }
      }
    }

    // Por último, processar itálico individual (mas apenas os não usados)
    const italicRegex = /_([^_]+)_/g;
    let italicMatch;
    while ((italicMatch = italicRegex.exec(text)) !== null) {
      const start = italicMatch.index;
      const end = start + italicMatch[0].length;
      // Verificar se algum índice já foi usado
      let isUsed = false;
      for (let i = start; i < end; i++) {
        if (usedIndices.has(i)) {
          isUsed = true;
          break;
        }
      }
      if (!isUsed) {
        tokens.push({
          index: start,
          length: italicMatch[0].length,
          type: 'italic',
          content: italicMatch[1],
        });
        for (let i = start; i < end; i++) {
          usedIndices.add(i);
        }
      }
    }

    // Ordenar tokens por posição
    tokens.sort((a, b) => a.index - b.index);

    // Renderizar tokens
    tokens.forEach((token) => {
      // Adicionar texto antes do token
      if (token.index > currentIndex) {
        const textBefore = text.slice(currentIndex, token.index);
        if (textBefore) {
          parts.push(<span key={`${keyPrefix}-text-${partKey++}`}>{textBefore}</span>);
        }
      }

      // Adicionar token formatado
      if (token.type === 'bold-italic') {
        parts.push(
          <span key={`${keyPrefix}-bold-italic-${partKey++}`} className="font-bold italic">
            {token.content}
          </span>
        );
      } else if (token.type === 'bold') {
        parts.push(
          <span key={`${keyPrefix}-bold-${partKey++}`} className="font-bold">
            {token.content}
          </span>
        );
      } else if (token.type === 'italic') {
        parts.push(
          <span key={`${keyPrefix}-italic-${partKey++}`} className="italic">
            {token.content}
          </span>
        );
      }

      currentIndex = token.index + token.length;
    });

    // Adicionar texto restante
    if (currentIndex < text.length) {
      const textAfter = text.slice(currentIndex);
      if (textAfter) {
        parts.push(<span key={`${keyPrefix}-text-${partKey++}`}>{textAfter}</span>);
      }
    }

    return parts.length > 0 ? parts : [<span key={`${keyPrefix}-plain`}>{text}</span>];
  };

  const renderTextWithInputs = () => {
    if (!bodyText) return null;

    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;

    variableMatches.forEach((match: RegExpMatchArray) => {
      const matchIndex = match.index!;
      const varKey = match[1].trim(); // Remover espaços em branco

      // Adicionar texto antes da variável com formatação
      if (matchIndex > lastIndex) {
        const textBefore = bodyText.slice(lastIndex, matchIndex);
        if (textBefore) {
          const formattedParts = renderFormattedText(textBefore, `before-${matchIndex}`);
          parts.push(...formattedParts);
        }
      }

      // Adicionar input para a variável
      parts.push(
        <input
          key={`var-${varKey}-${matchIndex}`}
          type="text"
          value={variables[varKey] || ''}
          onChange={(e) => onVariableChange(varKey, e.target.value)}
          placeholder={`{{${varKey}}}`}
          className="inline-block min-w-[100px] px-3 py-1.5 mx-1 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all align-middle"
        />
      );

      lastIndex = matchIndex + match[0].length;
    });

    // Adicionar texto restante com formatação
    if (lastIndex < bodyText.length) {
      const textAfter = bodyText.slice(lastIndex);
      if (textAfter) {
        const formattedParts = renderFormattedText(textAfter, `after-${lastIndex}`);
        parts.push(...formattedParts);
      }
    }

    // Se não houver variáveis, retornar o texto completo com formatação
    if (parts.length === 0) {
      const formattedParts = renderFormattedText(bodyText, 'no-vars');
      return <div className="text-text-primary leading-relaxed text-sm">{formattedParts}</div>;
    }

    return <div className="text-text-primary leading-relaxed text-sm">{parts}</div>;
  };

  if (!template) return null;

  return (
    <div className="space-y-4">
      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {uploadError}
        </div>
      )}
      
      {hasHeaderImage && (
        <div>
          <label className="block text-sm font-normal text-text-primary mb-2">
            Cabeçalho (Imagem) <span className="text-red-500 text-xs italic">*Lim.: 5mb</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={uploadingImage}
            className="w-full px-4 py-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {uploadingImage && (
            <p className="mt-2 text-sm text-text-secondary">Fazendo upload...</p>
          )}
          {imageFile && !uploadingImage && (
            <p className="mt-2 text-sm text-text-secondary">Arquivo selecionado: {imageFile.name}</p>
          )}
        </div>
      )}

      {hasHeaderVideo && (
        <div>
          <label className="block text-sm font-normal text-text-primary mb-2">
            Cabeçalho (Vídeo) <span className="text-red-500 text-xs italic">*Lim.: 16mb</span>
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            disabled={uploadingVideo}
            className="w-full px-4 py-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {uploadingVideo && (
            <p className="mt-2 text-sm text-text-secondary">Fazendo upload...</p>
          )}
          {videoFile && !uploadingVideo && (
            <p className="mt-2 text-sm text-text-secondary">Arquivo selecionado: {videoFile.name}</p>
          )}
        </div>
      )}

      {hasHeaderDocument && (
        <div>
          <label className="block text-sm font-normal text-text-primary mb-2">
            Cabeçalho (Documento) <span className="text-red-500 text-xs italic">*Lim.: 100mb</span>
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            onChange={handleDocumentChange}
            disabled={uploadingDocument}
            className="w-full px-4 py-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {uploadingDocument && (
            <p className="mt-2 text-sm text-text-secondary">Fazendo upload...</p>
          )}
          {documentFile && !uploadingDocument && (
            <p className="mt-2 text-sm text-text-secondary">Arquivo selecionado: {documentFile.name}</p>
          )}
        </div>
      )}

      {bodyText && (
        <div>
          <div className="p-4 bg-white border border-border rounded-lg text-sm space-y-3">
            {renderTextWithInputs()}
            
            {/* Botões do template - dentro do preview */}
            {templateButtons.length > 0 && (
              <div className="pt-3 border-t border-border">
                <div className="flex flex-wrap gap-2 mb-3">
                  {templateButtons.map((button, index) => {
                    if (button.type === 'QUICK_REPLY' || button.type === 'URL' || button.type === 'COPY_CODE') {
                      const buttonText = button.text || `Botão ${index + 1}`;
                      return (
                        <span
                          key={index}
                          className="px-3 py-1.5 text-sm border border-border rounded-lg bg-gray-50 text-text-primary"
                        >
                          [ {buttonText} ]
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
                {/* Campos de input para botões COPY_CODE */}
                {templateButtons.some((btn) => btn.type === 'COPY_CODE') && (
                  <div className="space-y-2 mt-3">
                    {templateButtons.map((button, index) => {
                      if (button.type === 'COPY_CODE') {
                        return (
                          <div key={index} className="space-y-2">
                            <label className="block text-sm font-normal text-text-primary">
                              {button.text || `Botão ${index + 1} (Código)`}
                            </label>
                            <input
                              type="text"
                              value={buttonValues[`button_${index}`] || ''}
                              onChange={(e) => onButtonValueChange?.(index, e.target.value)}
                              placeholder={button.example || 'Digite o código'}
                              className="w-full px-4 py-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

