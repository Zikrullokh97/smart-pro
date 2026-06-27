import { ResourceListPage } from '@/components/resource-list-page';

export default function StudentsPage() {
  return (
    <ResourceListPage
      title="Students"
      description="Browse student records from the backend API."
      endpoint="/api/students"
      entityLabel="student"
    />
  );
}
