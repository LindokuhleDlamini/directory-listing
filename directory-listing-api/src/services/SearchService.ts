import fs from 'fs';
import path from 'path';
import { DirectoryListingUtils } from '../utils/DirectoryListingUtils';
import { FileItem } from '../models/FileItem';
import { SearchResult } from '../models/SearchResult';

export class SearchService {

    static async search(directoryPath: string, searchTerm: string, limit: number = 100): Promise<SearchResult> {
        const results: FileItem[] = [];
        const searchTermLower = searchTerm.toLowerCase();

        try {
            const dir = await fs.promises.opendir(directoryPath);

            for await (const dirent of dir) {
                if (results.length >= limit) {
                    break;
                }
                try {
                    if (dirent.name.toLowerCase().includes(searchTermLower)) {
                        const itemPath = path.join(directoryPath, dirent.name);
                        const FileItem = await DirectoryListingUtils.getFileItem(itemPath, dirent.name);
                        results.push(FileItem);
                    }
                } catch (error) {
                    console.warn(`Error processing file ${dirent.name}:`, error);
                }
            }

            return {
                term: searchTerm,
                directory: directoryPath,
                results,
                totalCount: results.length,
                hasMore: results.length === limit
            } as SearchResult;
        } catch (error: any) {
            throw new Error(`Search failed: ${error.message}`);
        }
    }
}