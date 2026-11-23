import { RouterProvider } from 'react-router';
import { AppDataProvider } from '../context/AppDataProvider';
import { ThemeProvider } from '../context/ThemeProvider';
import { router } from './router';

export function App() {
  return (
    <ThemeProvider>
      <AppDataProvider>
        <RouterProvider router={router} />
      </AppDataProvider>
    </ThemeProvider>
  );
}
