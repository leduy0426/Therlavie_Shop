/*
    SE1990_NJ
    V1.0-11/09/2026
    Lê Duy - HE194188
*/

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  id: number;
  email: string;
  role: string;
  fullName: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserData;
    return data ? user?.[data] : user;
  },
);

