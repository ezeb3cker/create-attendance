export interface Channel {
  descricao: string;
  status: string;
  canalId: string;
  identificador: string;
  number: string;
  ddi: string;
  organizacao: string;
  type: number;
  organizacaoId: string; // Campo correto da API (sem 'n')
  needsUpdate: boolean;
  curVersion?: string;
  curOrlastServerInfo?: string;
  lastUpdate?: string;
}

export interface Sector {
  id: string;
  name: string;
  organizationId: string;
}

export interface DynamicComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER';
  format?: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'COPY_CODE';
    text?: string;
    url?: string;
    example?: string;
  }>;
}

export interface StaticComponent {
  type: 'BUTTONS';
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'COPY_CODE';
    text?: string;
    url?: string;
    example?: string;
  }>;
}

export interface Template {
  id: string;
  description: string;
  messages?: Array<{
    text: string;
  }>;
  dynamicComponents?: DynamicComponent[];
  staticComponents?: StaticComponent[];
}

export interface StartAttendanceData {
  channelId: string;
  sectorId: string;
  phone: string; // formato: "+{ddi}{number}" ou lista de números ou "csv_file"
  sendQuickMessage: boolean;
  templateId: string | null;
  templateImageFile: File | null; // quando template tem HEADER IMAGE
  templateVideoFile: File | null; // quando template tem HEADER VIDEO
  templateDocumentFile: File | null; // quando template tem HEADER DOCUMENT
  templateImageUrl?: string | null; // URL da imagem após upload
  templateVideoUrl?: string | null; // URL do vídeo após upload
  templateDocumentUrl?: string | null; // URL do documento após upload
  templateVariables: Record<string, string>; // valores das variáveis {{1}}, {{2}}, {{nome_cliente}}, etc.
  templateButtonValues?: Record<string, string>; // valores dos botões COPY_CODE
  message: string; // mensagem final com variáveis substituídas
  typeSelect: 'numero' | 'lista' | 'csv'; // tipo de entrada de telefone
  phoneList?: string; // lista de números (um por linha) - apenas quando typeSelect = 'lista'
  csvFile?: File | null; // arquivo CSV com contatos - apenas quando typeSelect = 'csv'
  typeChannel?: 'cloud' | 'web'; // tipo do canal: cloud (type 4) ou web (type 1)
}

