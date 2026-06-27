import { ResourceListPage } from '@/components/resource-list-page';

export default function TeachersPage() {
  return (
    <ResourceListPage
      title="Teachers"
      description="Review teacher records and profiles."
      endpoint="/api/teachers"
      entityLabel="teacher"
    />
  );
}
