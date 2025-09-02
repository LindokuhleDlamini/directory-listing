import { FileType } from "./enums/FileType";

export interface FileItem {
    name: string;
    path: string;
    size: number;
    extension: string;
    type: FileType;
    created: Date;
    permissions: string;
    attributes?: Array<string>;
}
