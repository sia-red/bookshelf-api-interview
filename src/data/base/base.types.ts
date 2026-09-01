export interface BaseModel {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
