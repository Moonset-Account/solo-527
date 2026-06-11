export class CreateUserDto {
  name: string;
  phone: string;
  avatar?: string;
  level?: 'normal' | 'vip';
}

export class UpdateUserDto {
  name?: string;
  phone?: string;
  avatar?: string;
  level?: 'normal' | 'vip';
}

export class QueryUserDto {
  page?: number;
  limit?: number;
  pageSize?: number;
  keyword?: string;
}

export type UserQueryDto = QueryUserDto;
