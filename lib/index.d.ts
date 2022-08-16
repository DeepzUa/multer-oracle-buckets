import { Request } from 'express';
import { StorageEngine } from 'multer';
export interface OracleStorageConfig {
    configPath: string;
    namespaceName: string;
    bucketName: string;
    fileName?: () => string;
}
export interface OracleFile extends Express.Multer.File {
    objectName: string;
    eTag: string;
}
export default class MulterOracleStorage implements StorageEngine {
    private config;
    private clientOracleObjectStorage;
    private getFilename;
    constructor(config: OracleStorageConfig);
    private initOracleSdk;
    _handleFile(_req: Request, file: Express.Multer.File, cb: (error?: Error | null, file?: OracleFile) => void): Promise<void>;
    _removeFile(_req: Request, file: OracleFile, cb: (error: Error | null) => void): void;
}
