import { ResourceListPage } from '@/components/resource-list-page';

export default function HomeworkPage() {
  return (
    <ResourceListPage
      title="Homework"
      description="Browse homework assignments and details."
      endpoint="/api/homework"
      entityLabel="homework item"
    />
  );
}
