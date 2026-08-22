import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PlacesModule } from './places/places.module';
import { ReservationsModule } from './reservations/reservations.module';
import { ArtistsModule } from './artists/artists.module';
import { FollowsModule } from './follows/follows.module';
import { OrganizationsController } from './organizations/organizations.controller';
import { EventsController } from './events/events.controller';
import { EventArtistsController } from './event-artists/event-artists.controller';
import { TicketPhasesController } from './ticket-phases/ticket-phases.controller';
import { TicketsController } from './tickets/tickets.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    AuthModule,
    PlacesModule,
    ReservationsModule,
    ArtistsModule,
    FollowsModule,
  ],
  controllers: [
    AppController,
    OrganizationsController,
    EventsController,
    EventArtistsController,
    TicketPhasesController,
    TicketsController,
  ],
  providers: [AppService],
})
export class AppModule {}