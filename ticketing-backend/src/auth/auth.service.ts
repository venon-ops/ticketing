import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createClient } from '@supabase/supabase-js';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../users/entities/user.entity';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async register(dto: RegisterDto) {
    const {
      email,
      password,
      role = UserRole.USER,
      stage_name,
      bio,
      organization_name,
      organization_description,
    } = dto;

    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingError) {
      throw new BadRequestException(existingError.message);
    }

    if (existing) {
      throw new ConflictException('Un compte avec cet email existe déjà');
    }

    if (role === UserRole.ARTIST && !stage_name?.trim()) {
      throw new BadRequestException(
        'Le champ stage_name est requis pour un compte artiste',
      );
    }

    if (role === UserRole.ORGANIZER && !organization_name?.trim()) {
      throw new BadRequestException(
        'Le nom de l’organisation est requis pour un compte organisateur',
      );
    }

    const bcrypt = require('bcrypt');
    const password_hash = await bcrypt.hash(password, 10);

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash,
        role,
      })
      .select()
      .single();

    if (userError || !user) {
      throw new BadRequestException(
        userError?.message || 'Impossible de créer le compte',
      );
    }

    if (role === UserRole.ARTIST) {
      const { error: profileError } = await supabase
        .from('artist_profiles')
        .insert({
          user_id: user.id,
          stage_name: stage_name!.trim(),
          bio: bio?.trim() || null,
        });

      if (profileError) {
        await supabase.from('users').delete().eq('id', user.id);

        throw new BadRequestException(profileError.message);
      }
    }

    if (role === UserRole.ORGANIZER) {
      const { error: organizationError } = await supabase
        .from('organizations')
        .insert({
          user_id: user.id,
          name: organization_name!.trim(),
          description: organization_description?.trim() || null,
        });

      if (organizationError) {
        await supabase.from('users').delete().eq('id', user.id);

        throw new BadRequestException(organizationError.message);
      }
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      access_token,
    };
  }

  async login(email: string, password: string) {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new BadRequestException('Identifiants invalides');
    }

    const bcrypt = require('bcrypt');
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      throw new BadRequestException('Identifiants invalides');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      access_token,
    };
  }
}