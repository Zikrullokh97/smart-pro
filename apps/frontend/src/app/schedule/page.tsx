import { ResourceListPage } from '@/components/resource-list-page';

export default function SchedulePage() {
  return (
    <ResourceListPage
      title="Schedule"
      description="View scheduled lessons and events."
      endpoint="/api/schedule"
      entityLabel="schedule entry"
    />
  );
}
