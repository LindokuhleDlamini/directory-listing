import fs from 'fs';
import path from 'path';
import { RecentDirectory } from '../models/RecentDirectory';

export class RecentDirectoriesService {
    private recentDirsFile: string;
    private recentDirectories: RecentDirectory[] = [];
    private maxRecentDirs: number = 20;

    constructor(dataDir: string = './data') {
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        this.recentDirsFile = path.join(dataDir, 'recent-directories.json');

        this.loadRecentDirectories();
    }


    private loadRecentDirectories(): void {
        try {
            if (fs.existsSync(this.recentDirsFile)) {
                const data = fs.readFileSync(this.recentDirsFile, 'utf8');
                this.recentDirectories = JSON.parse(data);
            }
        } catch (error) {
            console.error('Failed to load recent directories:', error);
        }
    }

    private saveRecentDirectories(): void {
        try {
            fs.writeFileSync(this.recentDirsFile, JSON.stringify(this.recentDirectories, null, 2));
        } catch (error) {
            console.error('Failed to save recent directories:', error);
        }
    }


    addRecentDirectory(path: string, name: string = ''): void {

        this.recentDirectories = this.recentDirectories.filter(dir => dir.path !== path);

        this.recentDirectories.unshift({
            path,
            name: name || path.split('/').pop() || path,
            lastAccessed: new Date(),
            accessCount: 1
        });

        if (this.recentDirectories.length > this.maxRecentDirs) {
            this.recentDirectories = this.recentDirectories.slice(0, this.maxRecentDirs);
        }

        this.saveRecentDirectories();
    }

    getRecentDirectories(limit: number = 10): RecentDirectory[] {
        return this.recentDirectories
            .sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime())
            .slice(0, limit);
    }

    clearRecentDirectories(): void {
        this.recentDirectories = [];
        this.saveRecentDirectories();
    }

    incrementAccessCount(path: string): void {
        const dir = this.recentDirectories.find(d => d.path === path);
        if (dir) {
            dir.accessCount = (dir.accessCount || 0) + 1;
            dir.lastAccessed = new Date();
            this.saveRecentDirectories();
        }

    }
}
