import { Request } from 'express';
import { StorageEngine } from 'multer';
import { ConfigFileAuthenticationDetailsProvider } from 'oci-common';
import { ObjectStorageClient} from 'oci-objectstorage';
import { DeleteObjectResponse, PutObjectResponse } from 'oci-objectstorage/lib/response';
import { PutObjectRequest, DeleteObjectRequest} from 'oci-objectstorage/lib/request';
import { streamToBuffer } from '@jorgeferrero/stream-to-buffer';
import { v4 as uuidv4 } from 'uuid';

export interface OracleStorageConfig {
  configPath: string,
  namespaceName: string,
  bucketName: string,
  fileName?: () => string;
};

export interface OracleFile extends Express.Multer.File {
  memory: Buffer,
  objectName: string,
  eTag: string
}

export default class MulterOracleStorage implements StorageEngine {

  private config!: OracleStorageConfig;
  private clientOracleObjectStorage!: ObjectStorageClient;

  private getFilename = () => uuidv4();

  constructor(config: OracleStorageConfig) {
    if (config == null)
      throw new Error('config is empty');

    this.config = config;

    if (this.config.fileName == null) {
      this.config.fileName = this.getFilename;
    }

    this.initOracleSdk();
  }

  private initOracleSdk() {
    const provider = new ConfigFileAuthenticationDetailsProvider(this.config.configPath);
    this.clientOracleObjectStorage = new ObjectStorageClient({ authenticationDetailsProvider: provider });
  }

  async uploadBuffer(objectName: string, buffer: Buffer | null): Promise<string | null> {
    if (buffer === null)
      throw new Error('buffer is null');

    const putObjectRequest: PutObjectRequest = {
      namespaceName: this.config.namespaceName,
      bucketName: this.config.bucketName,
      putObjectBody: buffer,
      objectName:  objectName
    };

    let uploadEtag: string | null = null;

    try {
      const uploadedObject: PutObjectResponse = await this.clientOracleObjectStorage.putObject(putObjectRequest);
      uploadEtag = uploadedObject.eTag;
    } catch (e) {}

    return uploadEtag;
  }

  async _handleFile(_req: Request, file: Express.Multer.File, cb: (error?: Error | null, file?: OracleFile) => void) {

    const objectName = this.config?.fileName  && await this.config?.fileName() || '';

    const buffer = await streamToBuffer(file.stream);

    const putObjectRequest: PutObjectRequest = {
      namespaceName: this.config.namespaceName,
      bucketName: this.config.bucketName,
      putObjectBody: buffer,
      objectName:  objectName
    };

    this.clientOracleObjectStorage.putObject(putObjectRequest)
      .then( (uploadedObject: PutObjectResponse) => cb(null, {
        objectName,
        memory: buffer,
        eTag: uploadedObject.eTag,
        ...file
      }) )
      .catch((_error: any) => cb(new Error("Error put object")))
  }

  _removeFile(_req: Request, file: OracleFile, cb: (error: Error| null) => void) {
    const deleteObjectRequest: DeleteObjectRequest = {
      namespaceName: this.config.namespaceName,
      bucketName: this.config.bucketName,
      objectName: file.objectName
    };

    this.clientOracleObjectStorage.deleteObject(deleteObjectRequest)
      .then((_: DeleteObjectResponse) => cb(null))
      .catch((_: any) => cb(new Error('delete object error')))
  }
};
