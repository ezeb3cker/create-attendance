---
name: Transformação em Extensão Vertical - Iniciar Atendimento
overview: ""
todos:
  - id: 101a8840-a777-4cf4-bc6e-60be768b9562
    content: Configurar projeto React + TypeScript + Tailwind CSS (package.json, tsconfig.json, tailwind.config.js, vite.config.ts)
    status: pending
  - id: 0ee3e097-92e6-4c7b-9c3f-cffd0bb7089f
    content: Criar arquivo de tipos TypeScript (Channel, Sector, Template, StartAttendanceData)
    status: pending
  - id: 0bb67cb3-11b3-403d-a6e3-4313295fd38e
    content: Criar serviço de API com funções fetchChannels, fetchSectors, fetchTemplates e tratamento de erros
    status: pending
  - id: 03d5f21b-1282-488f-8709-295ac1eb3aa4
    content: Criar componente SelectWithSearch com busca, listagem customizada, ícones e suporte a itens desabilitados
    status: pending
  - id: 0acce8f7-68d4-4438-ac01-1db03cd74c67
    content: Criar componente PhoneInput com dropdown DDI e input numérico
    status: pending
  - id: 5b74cca9-3eeb-4b40-84db-a2ace29965b4
    content: Criar componente StartAttendanceModal com todos os campos (Canal, Setor, Telefone, Switch, Mensagem)
    status: pending
  - id: b9efd2e5-4e4b-4408-b461-3df57fb4e947
    content: "Implementar lógica completa: seleção de canal → buscar setores, switch → buscar templates, template → preencher mensagem"
    status: pending
  - id: 81937ea0-8176-4ba6-8796-55054c56bc78
    content: Aplicar estilos Tailwind para corresponder exatamente ao layout das imagens (cores, espaçamentos, tipografia)
    status: pending
  - id: aeb605cc-952a-4bd0-8b31-5a031f558fa3
    content: Adicionar estados de loading em todas as requisições e indicadores visuais
    status: pending
  - id: 036972b0-c017-42a3-9081-06e80ba8e5ea
    content: Implementar tratamento de erros com mensagens simples e visíveis
    status: pending
  - id: 2f34c13a-0b92-43b9-b783-b3c97fa56f8d
    content: Criar App.tsx para demonstração do modal funcionando
    status: pending
---

# Transformação em Extensão Vertical - Iniciar Atendimento

## Objetivo

Transformar o modal "Iniciar Atendimento" em uma extensão vertical integrada ao extension-php do ChatLabel, com dimensões fixas de 850px (altura) × 350px (largura) e paleta de cores #192D3E.

## Mudanças Principais

### 1. Dimensões e Layout

- Alterar de modal centralizado para componente de extensão fixo
- Dimensões: 850px altura × 350px largura
- Layout vertical otimizado para espaço reduzido
- Scroll interno quando necessário

### 2. Integração extension-php

- Instalar e configurar dependências do extension-php
- Criar wrapper para integração com wlExtension
- Tipos TypeScript para eventos e métodos do extension-php

### 3. Paleta de Cores

- Cor primária: #192D3E (substituir azul-900 atual)
- Background: Branco (#FFFFFF)
- Texto: Cinza escuro (#333333)
- Bordas: Cinza claro (#D1D5DB)
- Ajustar todos os componentes para usar nova paleta

### 4. Estrutura de Arquivos

- `src/components/ExtensionPanel.tsx` - Componente principal da extensão
- `src/integrations/extension-php.ts` - Wrapper para extension-php
- `src/types/extension.ts` - Tipos para extension-php
- Atualizar `src/App.tsx` para renderizar extensão ao invés de modal

## Implementação Detalhada

### Arquivos a Criar/Modificar

1. **package.json**

- Adicionar dependência do extension-php (ou script CDN)
- Verificar se precisa de @types para extension-php

2. **src/integrations/extension-php.ts**

- Wrapper para métodos do wlExtension
- getInfoUser() - obter informações do usuário
- Event listeners para eventos do extension-php
- Funções auxiliares para comunicação

3. **src/types/extension.ts**

- Interface para dados do usuário
- Tipos para eventos do wlExtension
- Tipos para configuração da extensão

4. **src/components/ExtensionPanel.tsx**

- Componente principal da extensão
- Dimensões fixas: 850px × 350px
- Layout vertical otimizado
- Integração com StartAttendanceModal (adaptado)
- Usar paleta #192D3E

5. **src/components/StartAttendanceModal.tsx** (adaptar)

- Remover backdrop e centralização
- Ajustar para funcionar dentro do painel
- Otimizar espaçamentos para layout vertical
- Aplicar nova paleta de cores

6. **tailwind.config.js**

- Adicionar cor customizada #192D3E
- Configurar tema com nova paleta

7. **src/App.tsx**

- Renderizar ExtensionPanel ao invés de modal
- Configurar dimensões do container

## Paleta de Cores

- **Primária**: #192D3E (azul escuro)
- **Background**: #FFFFFF (branco)
- **Texto Principal**: #333333 (cinza escuro)
- **Texto Secundário**: #6B7280 (cinza médio)
- **Bordas**: #D1D5DB (cinza claro)
- **Hover**: #0F1A26 (azul mais escuro)
- **Texto sobre primária**: #FFFFFF (branco)

## Layout Vertical

- Header fixo com título e ações (altura ~60px)
- Área de conteúdo scrollável (altura ~790px)
- Campos organizados verticalmente com espaçamento otimizado
- Botões fixos no rodapé (altura ~50px)

## Ordem de Implementação

1. Instalar/configurar extension-php
2. Criar tipos e integração extension-php
3. Atualizar tailwind.config com nova paleta
4. Criar ExtensionPanel com dimensões fixas
5. Adaptar StartAttendanceModal para layout vertical
6. Aplicar nova paleta de cores em todos componentes
7. Otimizar espaçamentos e layout para 350px de largura
8. Testar integração com extension-php
9. Ajustes finais de UI/UX