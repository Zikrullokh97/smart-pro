import { ResourceListPage } from '@/components/resource-list-page';

export default function ClassesPage() {
  return (
    <ResourceListPage
      title="Classes"
      description="View school classes and their details."
      endpoint="/api/classes"
      entityLabel="class"
    />
  );
}
