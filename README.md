# Modal Iniciar Atendimento

Modal completo para iniciar atendimento com suporte a templates dinâmicos, desenvolvido com React + TypeScript + Tailwind CSS.

## Funcionalidades

- ✅ Seleção de canal com busca e listagem customizada
- ✅ Seleção de setor dinâmica baseada no canal selecionado
- ✅ Campo de telefone com DDI e formatação automática
- ✅ Switch para enviar resposta rápida (somente para canais type = 4)
- ✅ Seleção de templates de mensagem
- ✅ Suporte a templates dinâmicos:
  - HEADER com upload de imagem
  - BODY com variáveis `{{n}}` que podem ser preenchidas inline
- ✅ Preview em tempo real da mensagem com variáveis substituídas
- ✅ Estados de loading e tratamento de erros

## Instalação

```bash
npm install
```

## Executar em desenvolvimento

```bash
npm run dev
```

## Build para produção

```bash
npm run build
```

## Deploy na Vercel

O projeto está configurado para deploy automático na Vercel:

1. Conecte seu repositório GitHub à Vercel
2. A Vercel detectará automaticamente o framework Vite
3. O build será executado automaticamente usando `npm run build`
4. Os arquivos estáticos serão servidos da pasta `dist`

### Configuração

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Framework Preset**: Vite

## Estrutura do Projeto

```
src/
├── components/
│   ├── StartAttendanceModal.tsx    # Componente principal do modal
│   └── ui/
│       ├── SelectWithSearch.tsx    # Select com busca customizado
│       ├── PhoneInput.tsx           # Input de telefone com DDI
│       └── TemplatePreview.tsx     # Preview de templates dinâmicos
├── services/
│   └── api.ts                       # Funções de chamadas à API
├── types/
│   └── index.ts                     # Definições de tipos TypeScript
├── App.tsx                          # Componente raiz
└── main.tsx                         # Entry point
```

## Uso

```tsx
import StartAttendanceModal from './components/StartAttendanceModal';
import type { StartAttendanceData } from './types';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (data: StartAttendanceData) => {
    console.log('Dados:', data);
    // {
    //   channelId: string,
    //   sectorId: string,
    //   phone: string,
    //   sendQuickMessage: boolean,
    //   templateId: string | null,
    //   templateImageFile: File | null,
    //   templateVariables: Record<string, string>,
    //   message: string
    // }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Abrir Modal</button>
      <StartAttendanceModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}
```

## APIs Utilizadas

- `GET /core/v2/api/channels` - Lista de canais
- `GET /core/v2/api/users/{canalId}` - Setores do canal (header: `access-token: {canalId}`)
- `GET /core/v2/api/action-cards/templates` - Templates de mensagem (header: `access-token: {canalId}`)

## Tecnologias

- React 18
- TypeScript
- Tailwind CSS
- Vite

