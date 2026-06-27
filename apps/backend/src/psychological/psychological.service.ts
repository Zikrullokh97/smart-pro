import { Injectable } from '@nestjs/common';

@Injectable()
export class PsychologicalService {
  async findAll(user: any) {
    return [];
  }

  async findOne(id: string, user: any) {
    return null;
  }

  async create(data: any, userId: string) {
    return data;
  }

  async update(id: string, data: any, user: any) {
    return data;
  }

  async remove(id: string, user: any) {
    return { id };
  }
}
