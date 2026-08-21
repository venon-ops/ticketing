import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

@Controller('organizations')
@UseGuards(AuthGuard('jwt'))
export class OrganizationsController {
  @Get('me')
  async getMyOrganization(@Req() req: any) {
    const userId = req.user.sub;

    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !organization) {
      return {
        organization: null,
        events: [],
      };
    }

    const { data: events } = await supabase
      .from('events')
      .select('id, name, date, venue')
      .eq('organization_id', organization.id)
      .order('date', { ascending: true });

    return {
      organization,
      events: events || [],
    };
  }
}
