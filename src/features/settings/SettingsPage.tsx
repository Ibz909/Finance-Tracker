import { Settings } from 'lucide-react';
import { PlaceholderPage } from '../../components/ui/PlaceholderPage';
import { AppearanceSettings } from './AppearanceSettings';
import { DemoDataSettings } from './DemoDataSettings';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <AppearanceSettings />
      <DemoDataSettings />
      <PlaceholderPage
        icon={Settings}
        heading="More settings"
        description="Import and export, and data reset options will live here."
      />
    </div>
  );
}
