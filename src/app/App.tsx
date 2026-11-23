import { RouterProvider } from 'react-router';
import { AppDataProvider } from '../context/AppDataProvider';
import { ReportingMonthProvider } from '../context/ReportingMonthProvider';
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
            <ReportingMonthProvider>
              <RouterProvider router={router} />
            </ReportingMonthProvider>
          </TransactionDialogProvider>
        </ToastProvider>
      </AppDataProvider>
    </ThemeProvider>
  );
}
