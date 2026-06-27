import { ResourceListPage } from '@/components/resource-list-page';

export default function GradesPage() {
  return (
    <ResourceListPage
      title="Grades"
      description="Review grade records from the backend API."
      endpoint="/api/grades"
      entityLabel="grade"
    />
  );
}
