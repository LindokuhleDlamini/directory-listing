import { FileType } from "./enums/FileType";

export interface FileItem {
    name: String;
    path: String;
    size: Number;
    extension: String;
    type: FileType;
    created: Date;
    permissions: String;
    attributes?: Array<String>;
}
