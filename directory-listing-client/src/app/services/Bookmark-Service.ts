import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, catchError, map, Observable, of, retry, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Bookmark } from '../models/Bookmark';
import { CacheUtils } from '../utils/CacheUtlis';

@Injectable({
    providedIn: 'root'
})
export class BookmarkService {
    private apiUrl = `${environment.apiUrl}/bookmarks`;
    private retryCount = 2;
    private cache: CacheUtils;
    private bookmarksSubject = new BehaviorSubject<Bookmark[]>([]);
    public bookmarks$ = this.bookmarksSubject.asObservable()

    constructor(private http: HttpClient) {
        this.cache = new CacheUtils();
    }

    getAllBookmarks(): Observable<Bookmark[]> {
        const cacheKey = 'all';
        const cached = this.cache.get(cacheKey);

        if (cached) {
            return of(cached);
        }

        return this.http.get<Bookmark[]>(this.apiUrl).pipe(
            map((bookmarks: Bookmark[]) => {
                this.cache.set(cacheKey, bookmarks);
                this.bookmarksSubject.next(bookmarks);
                return bookmarks
            }),
            retry(this.retryCount),
            catchError(error => {
                console.error('Failed to fetch bookmarks:', error);
                return throwError(() => error);
            })
        );
    }

    getBookmark(id: string): Observable<Bookmark[]> {
        return this.http.get<Bookmark[]>(`${this.apiUrl}/byId/${id}`).pipe(
            map((bookmarks: Bookmark[]) => {
                return bookmarks
            }),
            retry(this.retryCount),
            catchError(error => {
                console.error('Failed to fetch bookmarks:', error);
                return throwError(() => error);
            })
        );
    }

    createBookmark(name: string, path: string): Observable<Bookmark[]> {
        return this.http.post<Bookmark>(`${this.apiUrl}/add`, { name, path }).pipe(
            map((newBookmark: Bookmark) => {
                const currentBookmarks: Bookmark[] = this.cache.get('all') || [];
                const updatedBookmarks = [...currentBookmarks, newBookmark];
                this.cache.set('all', updatedBookmarks);
                this.bookmarksSubject.next(updatedBookmarks);
                return updatedBookmarks
            }),
            catchError(error => {
                console.error('Failed to create bookmark:', error);
                return throwError(() => error);
            })
        );;
    }

    updateBookmark(id: string, updates: Partial<Bookmark>): Observable<Bookmark[]> {
        return this.http.put<Bookmark>(`${this.apiUrl}/update/${id}`, updates).pipe(
            map((updatedBookmark: Bookmark) => {
                const currentBookmarks = this.cache.get('all') || [];
                const updatedBookmarks: Bookmark[] = currentBookmarks.map((bookmark: Bookmark) =>
                    bookmark.id === id ? { ...bookmark, ...updatedBookmark } : bookmark
                );
                this.cache.set('all', updatedBookmarks);
                this.bookmarksSubject.next(updatedBookmarks);
                return updatedBookmarks;
            }),
            catchError(error => {
                console.error('Failed to update bookmark:', error);
                return throwError(() => error);
            })
        );
    }

    deleteBookmark(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/delete/${id}`).pipe(
            tap(() => {
                const currentBookmarks = this.cache.get('all') || [];
                const updatedBookmarks = currentBookmarks.filter((bookmark: Bookmark) => bookmark.id !== id);
                this.cache.set('all', updatedBookmarks);
                this.bookmarksSubject.next(updatedBookmarks);
            }),
            catchError(error => {
                console.error('Failed to delete bookmark:', error);
                return throwError(() => error);
            })
        )
    }

    updateBookmarkAccess(id: string): Observable<Bookmark[]> {
        return this.http.patch<Bookmark>(`${this.apiUrl}/update/${id}/access`, {}).pipe(
            map((updatedBookmark: Bookmark) => {
                const currentBookmarks: Bookmark[] = this.cache.get('all') || [];
                const updatedBookmarks = currentBookmarks.map((bookmark: Bookmark) =>
                    bookmark.id === id ? { ...bookmark, ...updatedBookmark } : bookmark
                );
                this.cache.set('all', updatedBookmarks);
                return updatedBookmarks;
            }),
            catchError(error => {
                console.error('Failed to update bookmark:', error);
                return throwError(() => error);
            })
        );;
    }

    getBookmarkByPath(path: string): Observable<Bookmark | undefined> {
        return this.bookmarks$.pipe(
            map(bookmarks => bookmarks.find(bookmark => bookmark.path === path))
        );
    }

    isPathBookmarked(path: string): Observable<boolean> {
        return this.bookmarks$.pipe(
            map(bookmarks => bookmarks.some(bookmark => bookmark.path === path))
        );
    }

    refreshBookmarks(): void {
        this.clearBookmarks()
        this.getAllBookmarks().subscribe();
    }

    private clearBookmarks(): void {
        this.cache.clear();
        this.bookmarksSubject.next([]);
    }
}
