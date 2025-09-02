import { FileItem } from "./File-Item";

export interface DirectoryListing {
  path: string;
  items: Array<FileItem>;
  totalCount: number;
  error?: string;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}
