import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { SearchResult } from '../models/Search-Result';

@Injectable({
    providedIn: 'root'
})
export class SearchService {
    private apiUrl = environment.apiUrl;
    private retryCount = 2;
    constructor(private http: HttpClient) { }

    searchDirectory(path: string, searchTerm: string, limit: number = 100): Observable<SearchResult> {
        return this.search(path, searchTerm, limit, 'directory');
    }

    quickSearch(path: string, searchTerm: string, limit: number = 50): Observable<SearchResult> {
        return this.search(path, searchTerm, limit, 'quick');
    }

    private search(path: string, searchTerm: string, limit: number, searchType: string): Observable<SearchResult> {
        let url = `${this.apiUrl}/search`;

        if (searchType == 'quick') {
            url = `${url}/quick`
        } else (
            url = `${url}/directory`
        )
        const params = new HttpParams()
            .set('path', path)
            .set('searchTerm', searchTerm)
            .set('limit', limit);

        return this.http.get<SearchResult>(url, { params }).pipe(
            retry(this.retryCount),
            catchError(this.handleError.bind(this))
        );
    }

    private handleError(error: HttpErrorResponse) {
        let errorMessage = 'An unknown error occurred';

        if (error.error instanceof ErrorEvent) {
            errorMessage = `Client error: ${error.error.message}`;
        } else {
            errorMessage = this.getServerErrorMessage(error);
        }

        console.error('FileSystemService error:', error);
        return throwError(() => new Error(errorMessage));
    }

    private getServerErrorMessage(error: HttpErrorResponse): string {
        switch (error.status) {
            case 0:
                return 'Network error: Unable to connect to server';
            case 400:
                return error.error?.details || 'Invalid request';
            case 403:
                return 'Access denied: You do not have permission to access this directory';
            case 404:
                return 'Directory not found';
            case 500:
                return 'Server error: Please try again later';
            default:
                return error.error?.details || `Server returned ${error.status}: ${error.statusText}`;
        }
    }
}