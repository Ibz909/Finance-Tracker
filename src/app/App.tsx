import { RouterProvider } from 'react-router';
import { AppDataProvider } from '../context/AppDataProvider';
import { ThemeProvider } from '../context/ThemeProvider';
import { ToastProvider } from '../context/ToastProvider';
import { TransactionDialogProvider } from '../context/TransactionDialogProvider';
import { router } from './router';

export function App() {
  return (
    <ThemeProvider>
      <AppDataProvider>
        <ToastProvider>
          <TransactionDialogProvider>
            <RouterProvider router={router} />
          </TransactionDialogProvider>
        </ToastProvider>
      </AppDataProvider>
    </ThemeProvider>
  );
}
