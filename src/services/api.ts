import type { Channel, Sector, Template, StartAttendanceData } from '../types';
import extensionService from '../integrations/extension-php';

const getApiUrl = () => {
  const API_URL = window.location.ancestorOrigins?.[0]
    ? window.location.ancestorOrigins[0].replace("app", "api")
    : "https://api.inovstar.com";
  return `${API_URL}/core/v2/api`;
};

async function getUserId(): Promise<string> {
  try {
    const userInfo = await extensionService.getInfoUser();
    return userInfo?.userId || userInfo?.id || '';
  } catch (error) {
    return '';
  }
}

async function getSystemKey(): Promise<string> {
  try {
    const userInfo = await extensionService.getInfoUser();
    return userInfo?.systemKey || '';
  } catch (error) {
    return '';
  }
}

export async function uploadFile(file: File): Promise<any> {
  try {
    const systemKey = await getSystemKey();
    
    if (!systemKey) {
      throw new Error('systemKey não encontrado');
    }

    const formData = new FormData();
    formData.append('data', file);
    formData.append('systemKey', systemKey);

    const response = await fetch('https://dev.gruponfa.com/webhook/upload-arquivo', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Erro ao fazer upload: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

function formatTemplateComponents(
  template: Template | null,
  data: StartAttendanceData
): any[] {
  if (!template || !data.sendQuickMessage) {
    return [];
  }

  const components: any[] = [];
  const dynamicComponents = template.dynamicComponents || [];
  const staticComponents = template.staticComponents || [];

  const headerComponent = dynamicComponents.find((c) => c.type === 'HEADER');
  if (headerComponent && headerComponent.format) {
    const headerParams: any[] = [];
    
    if (headerComponent.format === 'IMAGE' && data.templateImageUrl) {
      headerParams.push({
        parameter_name: 'header_image',
        type: 'image',
        image: {
          link: data.templateImageUrl,
        },
      });
    } else if (headerComponent.format === 'VIDEO' && data.templateVideoUrl) {
      headerParams.push({
        parameter_name: 'header_video',
        type: 'video',
        video: {
          link: data.templateVideoUrl,
        },
      });
    } else if (headerComponent.format === 'DOCUMENT' && data.templateDocumentUrl) {
      const filename = data.templateDocumentFile?.name || 'documento';
      headerParams.push({
        parameter_name: 'header_document',
        type: 'document',
        document: {
          link: data.templateDocumentUrl,
          filename: filename,
        },
      });
    }

    if (headerParams.length > 0) {
      components.push({
        type: 'HEADER',
        sub_type: headerComponent.format,
        parameters: headerParams,
        index: 0,
      });
    }
  }

  const dynamicBodyComponent = dynamicComponents.find((c) => c.type === 'BODY');
  const staticBodyComponent = staticComponents.find((c: any) => c.type === 'BODY');
  const bodyComponent = dynamicBodyComponent || staticBodyComponent;
  if (bodyComponent?.text) {
    const bodyText = (bodyComponent as any).text;
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variableMatches = Array.from(bodyText.matchAll(variableRegex));
    
    const orderedVariables = Array.from(
      new Set(variableMatches.map((match) => match[1].trim()))
    );

    const bodyParams: any[] = [];
    orderedVariables.forEach((varKey) => {
      const value = data.templateVariables[varKey] || '';
      bodyParams.push({
        parameter_name: varKey,
        type: 'text',
        text: value,
      });
    });

    if (bodyParams.length > 0) {
      components.push({
        type: 'BODY',
        parameters: bodyParams,
        index: components.length,
      });
    }
  }

  const staticButtonsComponent = staticComponents.find((c) => c.type === 'BUTTONS');
  const dynamicButtonsComponent = dynamicComponents.find((c) => c.buttons && c.buttons.length > 0);
  const footerComponent = dynamicComponents.find((c) => c.type === 'FOOTER');
  
  const allButtons = staticButtonsComponent?.buttons || dynamicButtonsComponent?.buttons || footerComponent?.buttons || [];

  allButtons.forEach((button, originalIndex) => {
    if (button.type === 'COPY_CODE') {
      const buttonValue = data.templateButtonValues?.[`button_${originalIndex}`];
      
      if (buttonValue) {
        const buttonComponent: any = {
          type: 'COPY_CODE',
          text: button.text || `Botão ${originalIndex + 1}`,
          parameters: [
            {
              parameter_name: `button_${originalIndex}`,
              type: 'coupon_code',
              coupon_code: buttonValue,
            },
          ],
          index: components.length,
        };
        components.push(buttonComponent);
      }
    }
  });

  return components;
}

const getEnderecoApi = (): string => {
  return window.location.ancestorOrigins?.[0]
    ? window.location.ancestorOrigins[0].replace("app", "api")
    : "https://api.inovstar.com";
};

export async function startAttendanceNumber(data: StartAttendanceData, template?: Template | null): Promise<any> {
  try {
    const systemKey = await getSystemKey();
    const userId = await getUserId();
    
    if (!systemKey) {
      throw new Error('systemKey não encontrado');
    }

    const templateComponents = template ? formatTemplateComponents(template, data) : [];

    const phoneWithoutPlus = data.phone?.startsWith('+') ? data.phone.substring(1) : data.phone;

    const payload: any = {
      channelId: data.channelId,
      sectorId: data.sectorId,
      phone: phoneWithoutPlus,
      systemKey,
      userId,
      typeSelect: data.typeSelect,
      typeChannel: data.typeChannel,
      enderecoApi: getEnderecoApi(),
    };

    if (data.sendQuickMessage && template) {
      payload.templateId = data.templateId;
      if (templateComponents.length > 0) {
        payload.templateComponents = templateComponents;
      }
      payload.message = data.message;
    } else if (data.message) {
      payload.message = data.message;
    }

    const response = await fetch('https://dev.gruponfa.com/webhook/extensao/numero/inicia-atendimento', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 400) {
      const errorText = await response.text();
      let errorMessage = 'Erro ao iniciar atendimento';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao iniciar atendimento: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function startAttendance(data: StartAttendanceData, template?: Template | null): Promise<any> {
  try {
    const systemKey = await getSystemKey();
    const userId = await getUserId();
    
    if (!systemKey) {
      throw new Error('systemKey não encontrado');
    }

    const templateComponents = template ? formatTemplateComponents(template, data) : [];

    const phoneWithoutPlus = data.phone?.startsWith('+') ? data.phone.substring(1) : data.phone;

    const payload: any = {
      channelId: data.channelId,
      sectorId: data.sectorId,
      phone: phoneWithoutPlus,
      systemKey,
      userId,
      typeSelect: data.typeSelect,
      typeChannel: data.typeChannel,
      enderecoApi: getEnderecoApi(),
    };

    if (data.typeSelect === 'lista' && data.phoneList) {
      payload.phoneList = data.phoneList;
    } else if (data.typeSelect === 'csv' && data.csvFile) {
      payload.csvFile = data.csvFile;
    }

    if (data.sendQuickMessage && template) {
      payload.templateId = data.templateId;
      if (templateComponents.length > 0) {
        payload.templateComponents = templateComponents;
      }
      payload.message = data.message;
    } else if (data.message) {
      payload.message = data.message;
    }

    const response = await fetch('https://dev.gruponfa.com/webhook/extensao/inicia-atendimento', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao iniciar atendimento: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

const MOCK_CHANNELS: Channel[] = [
  {
    descricao: 'WhatsApp (Cloud)',
    status: 'REGISTERED',
    canalId: '65a9c891631763c3725cf3f6',
    identificador: '525092970691476',
    number: '5092970691476',
    ddi: '52',
    organizacao: 'Grupo NFA',
    type: 4,
    organizacaoId: '65a9c7a8c03a819e147fd6b3',
    needsUpdate: false,
  },
  {
    descricao: 'InovStar (Web)',
    status: 'REGISTERED',
    canalId: '65a9c891631763c3725cf3f7',
    identificador: '5565933277776',
    number: '65933277776',
    ddi: '55',
    organizacao: 'InovStar',
    type: 1,
    organizacaoId: '65a9c7a8c03a819e147fd6b3',
    needsUpdate: false,
  },
  {
    descricao: 'FlowNow (Web)',
    status: 'REGISTERED',
    canalId: '65a9c891631763c3725cf3f8',
    identificador: '556599501534',
    number: '6599501534',
    ddi: '55',
    organizacao: 'FlowNow',
    type: 1,
    organizacaoId: '65a9c7a8c03a819e147fd6b4',
    needsUpdate: false,
  },
  {
    descricao: 'teste',
    status: 'PENDING',
    canalId: '65a9c891631763c3725cf3f9',
    identificador: 'test123',
    number: '',
    ddi: '',
    organizacao: 'InovStar',
    type: 1,
    organizacaoId: '65a9c7a8c03a819e147fd6b3',
    needsUpdate: false,
  },
];

const MOCK_SECTORS: Sector[] = [
  {
    id: 'sector-1',
    name: 'Suporte',
    organizationId: '65a9c7a8c03a819e147fd6b3',
  },
  {
    id: 'sector-2',
    name: 'Comercial',
    organizationId: '65a9c7a8c03a819e147fd6b3',
  },
  {
    id: 'sector-3',
    name: 'Flownow IA',
    organizationId: '65a9c7a8c03a819e147fd6b3',
  },
  {
    id: 'sector-4',
    name: 'CRM',
    organizationId: '65a9c7a8c03a819e147fd6b3',
  },
  {
    id: 'sector-5',
    name: 'Financeiro',
    organizationId: '65a9c7a8c03a819e147fd6b3',
  },
  {
    id: 'sector-6',
    name: 'Desenvolvimento 123',
    organizationId: '65a9c7a8c03a819e147fd6b3',
  },
];

const MOCK_TEMPLATES: Template[] = [
  {
    id: 'template-1',
    description: 'boas_vindas_',
    messages: [
      {
        text: 'Olá! Seja bem-vindo(a)',
      },
    ],
    dynamicComponents: [
      {
        type: 'BODY',
        text: 'Olá! Seja bem-vindo(a) {{1}} a nossa rede, deseja receber novidades no seu whatsapp?',
      },
    ],
  },
  {
    id: 'template-2',
    description: 'pesquisa_rapida.',
    messages: [
      {
        text: 'Opa! Tudo bem? 👋 A gente quer saber como foi sua experiência no',
      },
    ],
    dynamicComponents: [
      {
        type: 'HEADER',
        format: 'IMAGE',
      },
      {
        type: 'BODY',
        text: 'Opa! Tudo bem? 👋 A gente quer saber como foi sua experiência no {{1}}. São só 5 perguntas rápidas (leva menos de 3 minutinhos ⏱️) e você fica livre. Vamos lá? 🚀',
      },
    ],
  },
  {
    id: 'template-3',
    description: 'agendamento_sucesso_calendy',
    messages: [
      {
        text: 'Seu agendamento foi confirmado!',
      },
    ],
    dynamicComponents: [
      {
        type: 'BODY',
        text: 'Seu agendamento para {{1}} foi confirmado com sucesso!',
      },
    ],
  },
  {
    id: 'template-4',
    description: 'bom_dia',
    messages: [
      {
        text: 'Bom dia!',
      },
    ],
    dynamicComponents: [
      {
        type: 'BODY',
        text: 'Bom dia {{1}}! Como posso ajudá-lo hoje?',
      },
    ],
  },
];

export async function fetchChannels(): Promise<Channel[]> {
  try {
    const channels = await extensionService.getInfoChannels();
    if (channels && channels.length > 0) {
      return channels.map((channel: any) => ({
        ...channel,
        descricao: channel.descricao || channel.name || channel.description || '',
        status: channel.status || 'REGISTERED',
        canalId: channel.canalId || channel.id || channel._id || '',
        identificador: channel.identificador || channel.identifier || '',
        number: channel.number || channel.phone || '',
        ddi: channel.ddi || '55',
        organizacao: channel.organizacao || channel.organization || '',
        type: channel.type || 1,
        organizacaoId: channel.organizacaoId || channel.organizationId || channel.organization_id || '',
        needsUpdate: channel.needsUpdate !== undefined ? channel.needsUpdate : false,
      }));
    }

    const API_BASE_URL = getApiUrl();
    const response = await fetch(`${API_BASE_URL}/channels`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar canais: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    return MOCK_CHANNELS;
  }
}

export async function fetchSectors(canalId: string): Promise<Sector[]> {
  try {
    const userId = await getUserId();
    const API_BASE_URL = getApiUrl();
    const url = userId 
      ? `${API_BASE_URL}/users/${userId}`
      : `${API_BASE_URL}/users/${canalId}`;
    
    const response = await fetch(url, {
      headers: {
        'access-token': canalId,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar setores: ${response.statusText}`);
    }

    const data = await response.json();
    return data.sectors || [];
  } catch (error) {
    return MOCK_SECTORS;
  }
}

export async function fetchTemplates(canalId: string): Promise<Template[]> {
  try {
    const API_BASE_URL = getApiUrl();
    const response = await fetch(`${API_BASE_URL}/action-cards/templates`, {
      headers: {
        'access-token': canalId,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar templates: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    return MOCK_TEMPLATES;
  }
}
