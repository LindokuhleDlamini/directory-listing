import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NavigationHistory } from '../models/Navigation-History';

@Injectable({
    providedIn: 'root'
})
export class NavigationService {
    private navigationHistory: NavigationHistory[] = [];
    private historySubject = new BehaviorSubject<NavigationHistory[]>([]);
    private maxHistoryItems = 50;

    constructor() {
        this.loadHistory();
    }

    addToHistory(path: string): void {
        this.navigationHistory = this.navigationHistory.filter(item => item.path !== path);

        this.navigationHistory.unshift({
            path,
            timestamp: new Date()
        });

        if (this.navigationHistory.length > this.maxHistoryItems) {
            this.navigationHistory = this.navigationHistory.slice(0, this.maxHistoryItems);
        }

        this.saveHistory();
        this.historySubject.next([...this.navigationHistory]);
    }

    getHistory(): Observable<NavigationHistory[]> {
        return this.historySubject.asObservable();
    }

    clearHistory(): void {
        this.navigationHistory = [];
        this.saveHistory();
        this.historySubject.next([]);
    }

    goBack(): string | null {
        if (this.navigationHistory.length >= 1) {
            this.navigationHistory.shift();
            return this.navigationHistory[0].path;
        }
        return null;
    }

    private loadHistory(): void {
        const saved = localStorage.getItem('navigationHistory');
        if (saved) {
            try {
                this.navigationHistory = JSON.parse(saved);
                this.historySubject.next([...this.navigationHistory]);
            } catch (error) {
                console.error('Failed to load navigation history:', error);
            }
        }
    }

    private saveHistory(): void {
        localStorage.setItem('navigationHistory', JSON.stringify(this.navigationHistory));
    }
}