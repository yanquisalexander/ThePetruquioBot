import AWS from 'aws-sdk';
import { Configuration } from "../config";
import { Upload } from "../models/Upload.model";
import User from "../models/User.model";

class RemoteStorageService {
    private s3: AWS.S3;

    constructor() {
        this.s3 = new AWS.S3({
            accessKeyId: Configuration.AWS_ACCESS_KEY_ID,
            secretAccessKey: Configuration.AWS_SECRET_ACCESS_KEY,
            region: Configuration.AWS_REGION,
            endpoint: Configuration.AWS_ENDPOINT,
        });
    }

    async uploadFile(file: Express.Multer.File, folder: string, user: User): Promise<string> {
        const params = {
            Bucket: `${Configuration.AWS_BUCKET_NAME}/${folder}`,
            Key: file.originalname,
            Body: file.buffer,
        };

        const { Location, Key } = await this.s3.upload({
            ...params,

        }).promise();
        const uploadModel = new Upload({
            id: crypto.randomUUID().toString(),
            key: Key,
            mimetype: file.mimetype,
            filename: file.originalname,
            path: `https://cdn.petruquio.live/${folder}/${file.originalname}`,
            size: file.size,
            uploaded_at: new Date(),
            uploaded_by: user.twitchId
        });

        await uploadModel.save();

        return Location;
    }

    async deleteFile(key: string): Promise<void> {
        const params = {
            Bucket: Configuration.AWS_BUCKET_NAME,
            Key: key,
        };

        await this.s3.deleteObject(params).promise();
    }

}

export const remoteStorageService = new RemoteStorageService();