import { Injectable } from '@nestjs/common';
import { AIProvider, AIOptions, AIResponse, LessonPlanInput, LessonPlan, HomeworkInput, Homework, QuizInput, Quiz, StudentAnalysis } from './ai-provider.interface';

@Injectable()
export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  async generateText(prompt: string, options?: AIOptions): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 2000,
      }),
    });

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      model: data.model,
      finishReason: data.choices[0].finish_reason,
    };
  }

  async analyzeStudent(studentData: any): Promise<StudentAnalysis> {
    const prompt = `Analyze the following student data and provide insights:
    ${JSON.stringify(studentData, null, 2)}
    
    Provide analysis in JSON format with:
    - riskScore (0-100)
    - riskLevel (low/medium/high)
    - insights (array of strings)
    - recommendations (array of strings)
    - learningProfile with strengths, weaknesses, learningStyle, preferredPace, engagementLevel`;

    const response = await this.generateText(prompt, { temperature: 0.3 });
    
    try {
      const analysis = JSON.parse(response.content);
      return analysis;
    } catch {
      return {
        studentId: studentData.studentId,
        studentName: studentData.studentName,
        performance: {
          attendanceRate: studentData.attendanceRate || 0,
          averageGrade: studentData.averageGrade || 0,
          gradeTrend: 'stable',
          attendanceTrend: 'stable',
        },
        riskScore: 50,
        riskLevel: 'medium',
        insights: ['Unable to generate AI insights'],
        recommendations: ['Review student data manually'],
        learningProfile: {
          strengths: [],
          weaknesses: [],
          learningStyle: 'mixed',
          preferredPace: 'normal',
          engagementLevel: 50,
        },
      };
    }
  }

  async generateLessonPlan(input: LessonPlanInput): Promise<LessonPlan> {
    const prompt = `Generate a detailed lesson plan for:
    Subject: ${input.subject}
    Grade: ${input.grade}
    Topic: ${input.topic}
    Duration: ${input.duration} minutes
    Language: ${input.language || 'English'}
    
    Provide a structured lesson plan with:
    - title
    - objectives (array)
    - materials (array)
    - activities (array of {time, activity, description})
    - homework
    - assessment`;

    const response = await this.generateText(prompt, { temperature: 0.7 });
    
    try {
      return JSON.parse(response.content);
    } catch {
      return {
        title: input.topic,
        subject: input.subject,
        grade: input.grade,
        duration: input.duration,
        objectives: input.objectives || ['Understand key concepts'],
        materials: ['Textbook', 'Worksheets'],
        activities: [
          { time: '10 min', activity: 'Introduction' },
          { time: '20 min', activity: 'Main lesson' },
          { time: '10 min', activity: 'Practice' },
        ],
        homework: 'Complete exercises',
        assessment: 'Quiz',
      };
    }
  }

  async generateHomework(input: HomeworkInput): Promise<Homework> {
    const prompt = `Generate ${input.count} ${input.difficulty} homework questions for:
    Subject: ${input.subject}
    Grade: ${input.grade}
    Topic: ${input.topic}
    Language: ${input.language || 'English'}
    
    Provide questions in JSON format with:
    - questions (array of {id, question, type, options?, correctAnswer, explanation, points})`;

    const response = await this.generateText(prompt, { temperature: 0.7 });
    
    try {
      const data = JSON.parse(response.content);
      return {
        title: `${input.subject} - ${input.topic}`,
        questions: data.questions,
        totalPoints: data.questions.reduce((sum: number, q: any) => sum + q.points, 0),
        estimatedTime: `${input.count * 2} minutes`,
      };
    } catch {
      return {
        title: `${input.subject} - ${input.topic}`,
        questions: Array.from({ length: input.count }, (_, i) => ({
          id: i + 1,
          question: `Question ${i + 1}: Solve the problem related to ${input.topic}`,
          type: 'short_answer' as const,
          correctAnswer: `Answer ${i + 1}`,
          explanation: `Explanation for question ${i + 1}`,
          points: 5,
        })),
        totalPoints: input.count * 5,
        estimatedTime: `${input.count * 2} minutes`,
      };
    }
  }

  async generateQuiz(input: QuizInput): Promise<Quiz> {
    const prompt = `Generate a ${input.questionCount} question quiz for:
    Subject: ${input.subject}
    Grade: ${input.grade}
    Topic: ${input.topic}
    Question Type: ${input.questionType}
    Language: ${input.language || 'English'}
    
    Provide quiz in JSON format with:
    - title
    - questions (array of {id, question, options, correctAnswer, explanation, points})
    - timeLimit (in minutes)
    - instructions`;

    const response = await this.generateText(prompt, { temperature: 0.7 });
    
    try {
      const data = JSON.parse(response.content);
      return {
        title: data.title || `${input.subject} Quiz - ${input.topic}`,
        questions: data.questions,
        totalPoints: data.questions.reduce((sum: number, q: any) => sum + q.points, 0),
        timeLimit: data.timeLimit || input.questionCount * 2,
        instructions: data.instructions || 'Read each question carefully and select the best answer.',
      };
    } catch {
      return {
        title: `${input.subject} Quiz - ${input.topic}`,
        questions: Array.from({ length: input.questionCount }, (_, i) => ({
          id: i + 1,
          question: `Question ${i + 1}: What is the main concept of ${input.topic}?`,
          type: 'multiple_choice',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 'Option A',
          explanation: `Explanation for question ${i + 1}`,
          points: 5,
        })),
        totalPoints: input.questionCount * 5,
        timeLimit: input.questionCount * 2,
        instructions: 'Read each question carefully and select the best answer.',
      };
    }
  }

  async analyzeSentiment(text: string): Promise<any> {
    const prompt = `Analyze the sentiment of the following text and provide:
    - sentiment (positive/neutral/negative)
    - confidence (0-100)
    - emotions (joy, sadness, anger, fear, surprise - each 0-100)
    - keyPhrases (array of important phrases)
    
    Text: "${text}"
    
    Respond in JSON format.`;

    const response = await this.generateText(prompt, { temperature: 0.3 });
    
    try {
      return JSON.parse(response.content);
    } catch {
      return {
        sentiment: 'neutral',
        confidence: 50,
        emotions: {
          joy: 25,
          sadness: 25,
          anger: 25,
          fear: 25,
          surprise: 25,
        },
        keyPhrases: [],
      };
    }
  }
}