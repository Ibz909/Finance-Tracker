import { Settings } from 'lucide-react';
import { PlaceholderPage } from '../../components/ui/PlaceholderPage';
import { AppearanceSettings } from './AppearanceSettings';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <AppearanceSettings />
      <PlaceholderPage
        icon={Settings}
        heading="More settings"
        description="Demo data, import and export, and data reset options will live here."
      />
    </div>
  );
}
