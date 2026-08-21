import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

@Injectable()
export class UsersService {
  async create(dto: CreateUserDto) {
    const { email, password, role } = dto;

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      throw new ConflictException('Un compte avec cet email existe déjà');
    }

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: hashedPassword,
        role: role ?? 'user',
      })
      .select()
      .single();

    if (error) {
      throw new ConflictException(error.message);
    }

    return user as unknown as User;
  }

  async findAll() {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      throw new Error(error.message);
    }
    return data as unknown as User[];
  }

  async findOne(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('User not found');
    }
    return data as unknown as User;
  }

  async update(id: string, dto: UpdateUserDto) {
    const updateData: Record<string, unknown> = {};

    if (dto.password) {
      const bcrypt = require('bcrypt');
      updateData.password_hash = await bcrypt.hash(dto.password, 10);
    }
    if (dto.email) updateData.email = dto.email;
    if (dto.role) updateData.role = dto.role;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException('User not found');
    }

    return data as unknown as User;
  }

  async remove(id: string) {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
      throw new Error(error.message);
    }
    return { id };
  }
}