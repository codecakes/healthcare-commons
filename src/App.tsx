import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '@/contexts/AppContext';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import MainApp from '@/components/MainApp';
import './App.css';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <AppProvider>
        <BrowserRouter>
          <MainApp />
          <Toaster />
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;