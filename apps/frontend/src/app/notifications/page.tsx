import { ResourceListPage } from '@/components/resource-list-page';

export default function NotificationsPage() {
  return (
    <ResourceListPage
      title="Notifications"
      description="Review recent notifications from the backend."
      endpoint="/api/notifications"
      entityLabel="notification"
    />
  );
}
