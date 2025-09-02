import { FileItem } from "./File-Item";

export interface SearchResult {
  term: string;
  directory: string;
  results: FileItem[];
  totalCount: number;
  hasMore: boolean;
}
