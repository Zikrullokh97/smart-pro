export interface WidgetData {
  id: string;
  title: string;
  data: any;
  isLoading: boolean;
  error: string | null;
}

export const widgetFetchers = {
  'kpi': async () => {
    const [studentsRes, teachersRes, attendanceRes] = await Promise.all([
      fetch('/api/students', { credentials: 'include' }),
      fetch('/api/teachers', { credentials: 'include' }),
      fetch('/api/attendance', { credentials: 'include' }),
    ]);
    
    const students = await studentsRes.json();
    const teachers = await teachersRes.json();
    const attendance = await attendanceRes.json();
    
    return {
      studentCount: students.length || 0,
      teacherCount: teachers.length || 0,
      attendanceRate: attendance.length > 0 
        ? Math.round((attendance.filter((a: any) => a.status === 'present').length / attendance.length) * 100)
        : 0,
    };
  },

  'analytics': async () => {
    const [gradesRes, reportsRes] = await Promise.all([
      fetch('/api/grades', { credentials: 'include' }),
      fetch('/api/reports/grades', { credentials: 'include' }),
    ]);
    
    const grades = await gradesRes.json();
    const reports = await reportsRes.json();
    
    return {
      averageGrade: grades.length > 0 
        ? (grades.reduce((sum: number, g: any) => sum + g.value, 0) / grades.length).toFixed(2)
        : 0,
      totalGrades: grades.length,
      reportData: reports,
    };
  },

  'schedule': async () => {
    const response = await fetch('/api/schedule', { credentials: 'include' });
    return response.json();
  },

  'teacher-load': async () => {
    const response = await fetch('/api/teachers', { credentials: 'include' });
    return response.json();
  },

  'attendance-alerts': async () => {
    const response = await fetch('/api/attendance', { credentials: 'include' });
    const data = await response.json();
    return data.filter((a: any) => a.status === 'absent' || a.status === 'late');
  },

  'classes': async () => {
    const response = await fetch('/api/classes', { credentials: 'include' });
    return response.json();
  },

  'journal': async () => {
    const response = await fetch('/api/grades', { credentials: 'include' });
    return response.json();
  },

  'homework': async () => {
    const response = await fetch('/api/homework', { credentials: 'include' });
    return response.json();
  },

  'class-monitoring': async () => {
    const [studentsRes, attendanceRes] = await Promise.all([
      fetch('/api/students', { credentials: 'include' }),
      fetch('/api/attendance', { credentials: 'include' }),
    ]);
    
    const students = await studentsRes.json();
    const attendance = await attendanceRes.json();
    
    return {
      students,
      attendance,
      totalStudents: students.length || 0,
      presentToday: attendance.filter((a: any) => a.status === 'present').length || 0,
    };
  },

  'parent-communication': async () => {
    const response = await fetch('/api/notifications', { credentials: 'include' });
    return response.json();
  },

  'child-progress': async () => {
    const response = await fetch('/api/parent-portal/children', { credentials: 'include' });
    const children = await response.json();
    return { children };
  },

  'my-homework': async () => {
    const response = await fetch('/api/student-portal/homework', { credentials: 'include' });
    return response.json();
  },

  'my-grades': async () => {
    const response = await fetch('/api/student-portal/grades', { credentials: 'include' });
    return response.json();
  },

  'my-schedule': async () => {
    const response = await fetch('/api/student-portal/schedule', { credentials: 'include' });
    return response.json();
  },
};