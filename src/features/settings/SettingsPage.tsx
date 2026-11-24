import { Settings } from 'lucide-react';
import { PlaceholderPage } from '../../components/ui/PlaceholderPage';
import { AppearanceSettings } from './AppearanceSettings';
import { DataSettings } from '../importExport/DataSettings';
import { DemoDataSettings } from './DemoDataSettings';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <AppearanceSettings />
      <DataSettings />
      <DemoDataSettings />
      <PlaceholderPage
        icon={Settings}
        heading="More settings"
        description="Options to reset your data will live here."
      />
    </div>
  );
}
