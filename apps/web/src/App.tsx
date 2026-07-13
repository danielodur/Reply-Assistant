import React from 'react';

import AuthGate from './auth/AuthGate';
import { AuthProvider } from './auth/AuthProvider';
import DetachedMiniScreenHost from './components/DetachedMiniScreenHost';
import GeneratedReplyDetachedHost from './components/workbench/GeneratedReplyDetachedHost';
import FloatingAssistant from './components/FloatingAssistant';

function App() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('childWindow') === '1' && params.get('childScreen') === 'generated-reply') {
    return (
      <AuthProvider>
        <AuthGate>
          <GeneratedReplyDetachedHost />
        </AuthGate>
      </AuthProvider>
    );
  }
  if (params.get('childWindow') === '1' && params.get('childScreen')) {
    return (
      <AuthProvider>
        <AuthGate>
          <DetachedMiniScreenHost />
        </AuthGate>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <AuthGate>
        <FloatingAssistant />
      </AuthGate>
    </AuthProvider>
  );
}

export default App;
