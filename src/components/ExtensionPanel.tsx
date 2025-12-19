import { useState } from 'react';
import StartAttendanceContent from './StartAttendanceContent';

interface ExtensionPanelProps {
  onSubmit?: (data: any) => void;
}

export default function ExtensionPanel({ onSubmit }: ExtensionPanelProps) {
  const [hasTemplate, setHasTemplate] = useState(false);

  return (
    <div className="min-w-[350px] min-h-[850px] w-full h-full bg-white flex flex-col overflow-hidden">
      {/* Content - Scrollable apenas quando template é selecionado */}
      <div className={`flex-1 ${hasTemplate ? 'overflow-y-auto' : 'overflow-hidden'} ${!hasTemplate ? 'overflow-y-hidden' : ''}`}>
        <StartAttendanceContent onSubmit={onSubmit} onTemplateChange={setHasTemplate} />
      </div>
    </div>
  );
}

