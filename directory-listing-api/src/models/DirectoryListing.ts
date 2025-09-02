import { FileItem } from "./FileItem";

export interface DirectoryListing {
  path: String;
  items: Array<FileItem>;
  totalCount: Number;
  error?: String;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}
