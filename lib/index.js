"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const oci_common_1 = require("oci-common");
const oci_objectstorage_1 = require("oci-objectstorage");
const uuid_1 = require("uuid");
;
class MulterOracleStorage {
    constructor(config) {
        this.getFilename = () => (0, uuid_1.v4)();
        if (config == null)
            throw new Error('config is empty');
        this.config = config;
        if (this.config.fileName == null) {
            this.config.fileName = this.getFilename;
        }
        this.initOracleSdk();
    }
    initOracleSdk() {
        const provider = new oci_common_1.ConfigFileAuthenticationDetailsProvider(this.config.configPath);
        this.clientOracleObjectStorage = new oci_objectstorage_1.ObjectStorageClient({ authenticationDetailsProvider: provider });
    }
    _handleFile(_req, file, cb) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const objectName = ((_a = this.config) === null || _a === void 0 ? void 0 : _a.fileName) && (yield ((_b = this.config) === null || _b === void 0 ? void 0 : _b.fileName())) || '';
            const putObjectRequest = {
                namespaceName: this.config.namespaceName,
                bucketName: this.config.bucketName,
                putObjectBody: file.stream,
                objectName: objectName
            };
            this.clientOracleObjectStorage.putObject(putObjectRequest)
                .then((uploadedObject) => cb(null, Object.assign({ objectName, eTag: uploadedObject.eTag }, file)))
                .catch((_error) => cb(new Error("Error put object")));
        });
    }
    _removeFile(_req, file, cb) {
        const deleteObjectRequest = {
            namespaceName: this.config.namespaceName,
            bucketName: this.config.bucketName,
            objectName: file.objectName
        };
        this.clientOracleObjectStorage.deleteObject(deleteObjectRequest)
            .then((_) => cb(null))
            .catch((_) => cb(new Error('delete object error')));
    }
}
exports.default = MulterOracleStorage;
;
