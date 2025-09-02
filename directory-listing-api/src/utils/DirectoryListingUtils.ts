import fs from 'fs';
import path from 'path';
import { FileItem } from '../models/FileItem';
import { FileType } from '../models/enums/FileType';

export class DirectoryListingUtils {

    static readDirectory(directoryPath: string): Promise<string[]> {
        try {
            return new Promise((resolve, reject) => {
            fs.readdir(directoryPath, (err, files) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(files);
                }
            });
        });
        } catch (error: any) {
            throw new Error(`Failed to read directory for ${directoryPath}: ${error}`);
        }
    }

    static getFileItemStats(filePath: string): Promise<fs.Stats> {
        try {
            return new Promise((resolve, reject) => {
                fs.stat(filePath, (err: any, stats: fs.Stats) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(stats);
                    }
                });
            });
        } catch (error: any) {
            throw new Error(`Failed to get file item stats for ${filePath}: ${error}`)
        }
    }

    static async getFileItem(itemPath: string, name: string): Promise<FileItem> {
        try {
            const stats = await this.getFileItemStats(itemPath);
            const isDirectory = stats.isDirectory();
            const extension = isDirectory && FileType.directory || path.extname(name).toLowerCase();
            const type = isDirectory && FileType.directory || FileType.file;
            const permissions = this.formatPermissions(stats.mode, isDirectory);
            const attributes = this.getFileAttributes(stats);

            return {
                name,
                path: itemPath,
                size: stats.size,
                created: stats.birthtime,
                extension,
                type,
                permissions,
                attributes
            };
        } catch (error: any) {
            throw new Error(`Failed to get file stats for ${itemPath}: ${error}`);
        }
    }

    private static getReadWritePermissions(mode: number) {
        return {
            ownerRead: (mode & fs.constants.S_IRUSR) ? 'r' : '-',
            ownerWrite: (mode & fs.constants.S_IWUSR) ? 'w' : '-',
            groupRead: (mode & fs.constants.S_IRGRP) ? 'r' : '-',
            groupWrite: (mode & fs.constants.S_IWGRP) ? 'w' : '-',
            othersRead: (mode & fs.constants.S_IROTH) ? 'r' : '-',
            othersWrite: (mode & fs.constants.S_IWOTH) ? 'w' : '-'
        }
    }

    private static getExecutePermissions(mode: number) {
        return {
            ownerExecute: (mode & fs.constants.S_IXUSR) ? 'x' : '-',
            groupExecute: (mode & fs.constants.S_IXGRP) ? 'x' : '-',
            othersExecute: (mode & fs.constants.S_IXOTH) ? 'x' : '-'
        }
    }

    private static formatPermissions(mode: number, isDirectory: boolean): string {
        const readWritePermissions = this.getReadWritePermissions(mode);
        const executePermissions = this.getExecutePermissions(mode);

        return `${isDirectory ? 'd' : '-'}${readWritePermissions.ownerRead}${readWritePermissions.ownerWrite}${executePermissions.ownerExecute}${readWritePermissions.groupRead}${readWritePermissions.groupWrite}${executePermissions.groupExecute}${readWritePermissions.othersRead}${readWritePermissions.othersWrite}${executePermissions.othersExecute}`;
    }

    private static getFileAttributes(stats: fs.Stats): string[] {
        const attributes: string[] = [];

        if (stats.isDirectory()) attributes.push('directory');
        if (stats.isFile()) attributes.push('file');
        if (stats.isSymbolicLink()) attributes.push('symlink');
        if (stats.isBlockDevice()) attributes.push('block-device');
        if (stats.isCharacterDevice()) attributes.push('character-device');
        if (stats.isFIFO()) attributes.push('fifo');
        if (stats.isSocket()) attributes.push('socket');

        return attributes;
    }

}