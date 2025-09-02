import path from "path";
import { DirectoryListing } from "../models/DirectoryListing";
import { DirectoryListingUtils } from "../utils/DirectoryListingUtils";
import { FileItem } from "../models/FileItem";
import { Readable } from "stream";
import fs from 'fs';
import { CacheUtils } from "../utils/CacheUtlis";
import { promisify } from "util";

const readdir = promisify(fs.readdir);

export class DirectoryListingService {
    private cache: CacheUtils;
    private activeStreams: Map<string, boolean>;

    constructor() {
        this.cache = new CacheUtils();
        this.activeStreams = new Map();
    }

    async getDirectoryListing(directoryPath: string, page: number = 1, pageSize: number = 1000): Promise<DirectoryListing> {
        try {
            const cacheKey = `dir:${directoryPath}:${page}:${pageSize}`;
            const cached = this.cache.get(cacheKey);

            if (cached) {
                return cached;
            }

            this.validateDirectoryPath(directoryPath);
            this.validatePaginationParams(page, pageSize);

            const directorySize = await this.getDirectorySize(directoryPath);
            let results: DirectoryListing;
            if (directorySize > 10000) {
                results = await this.processFilesWithOpendir(directoryPath, page, pageSize);
            } else {
                results = await this.processFilesWithConcurrency(directoryPath, page, pageSize);
            }

            this.cache.set(cacheKey, results, 60000);
            return results;
        } catch (error: any) {
            throw this.handleError(error);
        }
    }

    private async processFilesWithConcurrency(directoryPath: string, page: number, pageSize: number) {
        const directoryContent = await DirectoryListingUtils.readDirectory(directoryPath);
        const batchSize = 500;
        let directoryListing;
        const fileItems: FileItem[] = [];
        for (let itemIndex = 0; itemIndex < directoryContent.length; itemIndex += batchSize) {
            const batch = directoryContent.slice(itemIndex, itemIndex + batchSize);
            const batchPromises = batch.map(async (item: any) => {

                const itemPath = path.join(directoryPath, item);
                try {
                    return await DirectoryListingUtils.getFileItem(itemPath, item);
                } catch (error) {
                    console.error(`Error processing item ${itemPath}:`, error);
                    return null;
                }
            });
            const resolvedBatch = (await Promise.all(batchPromises)).filter((item: FileItem | null) => item !== null);
            fileItems.push(...resolvedBatch);
        }
        directoryListing = {
            path: directoryPath,
            items: fileItems,
            totalCount: fileItems.length
        };
        return directoryListing as DirectoryListing;
    }

    async processFilesWithOpendir(directoryPath: string, page: number, pageSize: number): Promise<DirectoryListing> {
        return new Promise((resolve, reject) => {

            if (this.activeStreams.get(directoryPath)) {
                reject(new Error('Directory is already being read'));
                return;
            }

            this.activeStreams.set(directoryPath, true);

            const items: FileItem[] = [];
            let totalCount = 0;
            let processedCount = 0;
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;

            const stream = this.createDirectoryStream(directoryPath);

            stream.on('data', async (file: string) => {
                totalCount++;
                processedCount++;

                if (this.shouldSkipFile(file)) {
                    stream.destroy();
                }

                if (totalCount > startIndex && totalCount <= endIndex) {
                    stream.pause();

                    try {
                        const itemPath = path.join(directoryPath, file);
                        const fileItem = await DirectoryListingUtils.getFileItem(itemPath, file);
                        items.push(fileItem);
                    } catch (error) {
                        console.warn(`Error processing file ${file}:`, error);
                    }

                    if (items.length < pageSize) {
                        stream.resume();
                    }
                }

                if (totalCount > endIndex + 1000) {
                    stream.destroy();
                }
            });

            stream.on('end', () => {
                this.activeStreams.delete(directoryPath);
                resolve({
                    path: directoryPath,
                    items,
                    totalCount,
                    page,
                    pageSize,
                    totalPages: Math.ceil(totalCount / pageSize)
                });
            });

            stream.on('error', (error) => {
                this.activeStreams.delete(directoryPath);
                reject(new Error(`Failed to read directory: ${error.message}`));
            });

            setTimeout(() => {
                if (this.activeStreams.has(directoryPath)) {
                    stream.destroy();
                    this.activeStreams.delete(directoryPath);
                    resolve({
                        path: directoryPath,
                        items,
                        totalCount: processedCount,
                        page,
                        pageSize,
                        totalPages: Math.ceil(processedCount / pageSize)
                    });
                }
            }, 60000);
        });
    }

    private createDirectoryStream(directoryPath: string): Readable {
        const dir = fs.opendirSync(directoryPath);
        const stream = new Readable({
            objectMode: true,
            read() {
                const entry = dir.readSync();
                if (entry) {
                    this.push(entry.name);
                } else {
                    dir.closeSync();
                    this.push(null);
                }
            }
        });

        return stream;
    }

    private shouldSkipFile(filename: string): boolean {
        if (filename.startsWith('.')) {
            return true;
        }

        const systemFiles = ['Thumbs.db', '.DS_Store', 'desktop.ini'];
        if (systemFiles.includes(filename)) {
            return true;
        }

        const systemExtensions = ['.sys', '.dll', '.exe', '.ini'];
        const ext = path.extname(filename).toLowerCase();
        if (systemExtensions.includes(ext)) {
            return true;
        }

        return false;
    }

    async getDirectorySize(directoryPath: string): Promise<number> {
        try {
            const files = await DirectoryListingUtils.readDirectory(directoryPath);
            return files.length;
        } catch (error) {
            return 0;
        }
    }

    // private async getDirectoryItemsWithOpendir(directoryPath: string, page: number, pageSize: number): Promise<any> {
    //     const items: FileItem[] = [];
    //     let totalCount = 0;
    //     const startIndex = (page - 1) * pageSize;
    //     const endIndex = startIndex + pageSize;

    //     try {
    //         await fs.promises.access(directoryPath, fs.constants.R_OK);
    //         const dir = await fs.promises.opendir(directoryPath);

    //         for await (const dirent of dir) {
    //             totalCount++;

    //             if (this.shouldSkipFile(dirent.name)) {
    //                 continue;
    //             }


    //             if (totalCount > startIndex && totalCount <= endIndex) {
    //                 try {
    //                     const fullPath = path.join(directoryPath, dirent.name);
    //                     const fileItem = await DirectoryListingUtils.getFileItem(fullPath, dirent.name);
    //                     items.push(fileItem);
    //                 } catch (error) {
    //                     console.warn(`Error processing ${dirent.name}:`, error);
    //                 }
    //             }

    //             if (totalCount > endIndex) {
    //                 break;
    //             }
    //         }

    //         return {
    //             items,
    //             totalCount
    //         };

    //     } catch (error: any) {
    //         throw new Error(`Failed to read directory: ${error.message}`);
    //     }
    // }

    private validateDirectoryPath(directoryPath: string): void {
        if (!directoryPath || typeof directoryPath !== 'string') {
            throw new Error('Directory path is required and must be a string');
        }

        if (!path.isAbsolute(directoryPath)) {
            throw new Error('Directory path must be absolute');
        }

        if (!fs.existsSync(directoryPath)) {
            throw new Error('Directory does not exist');
        }

        const stats = fs.statSync(directoryPath);
        if (!stats.isDirectory()) {
            throw new Error('Path is not a directory');
        }
    }

    private validatePaginationParams(page: number, pageSize: number): void {
        if (page < 1) {
            throw new Error('Page must be greater than 0');
        }

        if (pageSize < 1 || pageSize > 5000) {
            throw new Error('Page size must be between 1 and 5000');
        }
    }

    private handleError(error: unknown): Error {
        if (error instanceof Error) {
            if (error.message.includes('ENOENT')) {
                return new Error('Directory not found');
            }
            if (error.message.includes('EACCES')) {
                return new Error('Permission denied');
            }
            if (error.message.includes('ENOTDIR')) {
                return new Error('Path is not a directory');
            }
            return error;
        }
        return new Error(`Unknown error occurred: ${error}`);
    }
}