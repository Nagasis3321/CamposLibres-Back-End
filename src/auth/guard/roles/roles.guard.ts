import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../decorators/roles/roles.decorator';
import { UserRole } from '../../../groups/entities/group-member.entity';
import { User } from '../../../users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; // Si no se especifican roles, se permite el acceso
    }

    const { user } = context.switchToHttp().getRequest<{ user: User }>();
    
    // Aquí es donde la lógica se vuelve compleja.
    // Un guard genérico no sabe en qué *grupo* verificar el rol.
    // Por eso, la validación de roles contextual (ej. "es admin en ESTE grupo")
    // se debe hacer en el servicio, como ya lo implementamos.
    // Este guard serviría para roles globales (ej. "SuperAdmin"), que no tenemos.
    
    // Por ahora, lo dejamos como una estructura base. La validación real
    // seguirá en los servicios de Groups y Animals.
    return true; 
  }
}
