import { useEffect } from 'react';
import ExtensionPanel from './components/ExtensionPanel';
import type { StartAttendanceData } from './types';

function App() {
  const handleSubmit = (data: StartAttendanceData) => {
    // Aqui você pode enviar para n8n ou fazer o que precisar
    if (window.wlExtension?.emit) {
      window.wlExtension.emit('attendance:started', data);
    }
  };

  useEffect(() => {
    // Prevenir recarregamento acidental da página
    const handleBeforeUnload = () => {
      // Não bloquear, apenas logar para debug
      console.log('BeforeUnload event detected - dados preservados no sessionStorage');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <ExtensionPanel onSubmit={handleSubmit} />
    </div>
  );
}

export default App;

