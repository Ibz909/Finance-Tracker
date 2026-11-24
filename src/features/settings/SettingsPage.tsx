import { DataSettings } from '../importExport/DataSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { DemoDataSettings } from './DemoDataSettings';
import { ResetDataSettings } from './ResetDataSettings';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <AppearanceSettings />
      <DataSettings />
      <DemoDataSettings />
      <ResetDataSettings />
    </div>
  );
}
