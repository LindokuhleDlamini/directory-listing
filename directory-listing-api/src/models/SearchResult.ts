import { FileItem } from "./FileItem";

export interface SearchResult {
  term: string;
  directory: string;
  results: FileItem[];
  totalCount: number;
  hasMore: boolean;
}
