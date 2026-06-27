import { Injectable } from '@nestjs/common';

@Injectable()
export class PermissionsService {
  async findAll() {
    return [];
  }

  async findOne(id: string) {
    return null;
  }

  async create(data: any) {
    return data;
  }

  async update(id: string, data: any) {
    return data;
  }

  async remove(id: string) {
    return { id };
  }
}
