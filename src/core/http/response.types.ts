export interface PaginatedMeta {
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginatedMeta;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function successResponse<T>(data: T, meta?: PaginatedMeta): ApiSuccessResponse<T> {
  return { success: true, data, ...(meta ? { meta } : {}) };
}
