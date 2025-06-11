import { BrowserRouter } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { AppProvider } from '@/contexts/AppContext';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import MainApp from '@/components/MainApp';
import apolloClient from '@/lib/apollo';
import './App.css';

// Initialize i18n
import '@/lib/i18n';

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <AppProvider>
          <BrowserRouter>
            <MainApp />
            <Toaster />
          </BrowserRouter>
        </AppProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
}

export default App;