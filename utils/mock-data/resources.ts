export interface PastQuestion {
  id: string
  title: string
  course: string
  uploadedBy: string
  uploadDate: string
  downloadCount: number
  fileSize: string
}

export interface Course {
  code: string
  title: string
}

export const courses: Course[] = [
  { code: 'CSC 486.1', title: 'Algorithm Design' },
  { code: 'CSC 301.1', title: 'Data Structures' },
  { code: 'MTH 201.1', title: 'Calculus II' },
  { code: 'CSC 205.1', title: 'Computer Architecture' },
]

export const pastQuestions: PastQuestion[] = [
  {
    id: '1',
    title: '2023 Final Exam Questions',
    course: 'CSC 486.1',
    uploadedBy: 'John Doe',
    uploadDate: '2024-12-10',
    downloadCount: 45,
    fileSize: '2.3 MB',
  },
  {
    id: '2',
    title: '2022 Mid-Semester Questions',
    course: 'CSC 486.1',
    uploadedBy: 'Jane Smith',
    uploadDate: '2024-12-08',
    downloadCount: 32,
    fileSize: '1.8 MB',
  },
  {
    id: '3',
    title: '2023 Final Exam - Data Structures',
    course: 'CSC 301.1',
    uploadedBy: 'Mike Wilson',
    uploadDate: '2024-12-05',
    downloadCount: 78,
    fileSize: '5.1 MB',
  },
  {
    id: '4',
    title: '2022 Final Exam Questions',
    course: 'CSC 301.1',
    uploadedBy: 'Sarah Lee',
    uploadDate: '2024-12-03',
    downloadCount: 56,
    fileSize: '3.2 MB',
  },
  {
    id: '5',
    title: '2023 Mid-Semester - Calculus',
    course: 'MTH 201.1',
    uploadedBy: 'Tom Brown',
    uploadDate: '2024-12-01',
    downloadCount: 41,
    fileSize: '2.7 MB',
  },
  {
    id: '6',
    title: '2022 Final Exam - Architecture',
    course: 'CSC 205.1',
    uploadedBy: 'Lisa Wang',
    uploadDate: '2024-11-28',
    downloadCount: 67,
    fileSize: '4.1 MB',
  },
]
