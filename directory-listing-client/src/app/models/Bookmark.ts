export interface Bookmark {
  id: string;
  name: string;
  path: string;
  createdAt: Date;
  lastAccessed?: Date;
}
