export interface AIProvider {
  generateText(prompt: string, options?: AIOptions): Promise<AIResponse>;
  analyzeStudent(studentData: any): Promise<StudentAnalysis>;
  generateLessonPlan(input: LessonPlanInput): Promise<LessonPlan>;
  generateHomework(input: HomeworkInput): Promise<Homework>;
  generateQuiz(input: QuizInput): Promise<Quiz>;
  analyzeSentiment(text: string): Promise<SentimentAnalysis>;
}

export interface AIOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  language?: string;
}

export interface AIResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}

export interface LessonPlanInput {
  subject: string;
  grade: number;
  topic: string;
  duration: number;
  objectives?: string[];
  language?: string;
}

export interface LessonPlan {
  title: string;
  subject: string;
  grade: number;
  duration: number;
  objectives: string[];
  materials: string[];
  activities: Activity[];
  homework: string;
  assessment: string;
}

export interface Activity {
  time: string;
  activity: string;
  description?: string;
}

export interface HomeworkInput {
  subject: string;
  grade: number;
  topic: string;
  difficulty: string;
  count: number;
  language?: string;
}

export interface Homework {
  title: string;
  questions: Question[];
  totalPoints: number;
  estimatedTime: string;
}

export interface Question {
  id: number;
  question: string;
  type: 'multiple_choice' | 'short_answer' | 'essay' | 'problem_solving';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

export interface QuizInput {
  subject: string;
  grade: number;
  topic: string;
  questionCount: number;
  questionType: string;
  language?: string;
}

export interface Quiz {
  title: string;
  questions: Question[];
  totalPoints: number;
  timeLimit: number;
  instructions: string;
}

export interface StudentAnalysis {
  studentId: string;
  studentName: string;
  performance: {
    attendanceRate: number;
    averageGrade: number;
    gradeTrend: 'improving' | 'stable' | 'declining';
    attendanceTrend: 'improving' | 'stable' | 'declining';
  };
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  insights: string[];
  recommendations: string[];
  learningProfile: LearningProfile;
}

export interface LearningProfile {
  strengths: string[];
  weaknesses: string[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  preferredPace: 'fast' | 'normal' | 'slow';
  engagementLevel: number;
}

export interface SentimentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
  };
  keyPhrases: string[];
}