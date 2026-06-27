import { ResourceListPage } from '@/components/resource-list-page';

export default function AttendancePage() {
  return (
    <ResourceListPage
      title="Attendance"
      description="Inspect attendance records by student and date."
      endpoint="/api/attendance"
      entityLabel="attendance record"
    />
  );
}
