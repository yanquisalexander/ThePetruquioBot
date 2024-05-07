import { type Request, type Response } from 'express'
import { remoteStorageService } from "@/app/services/RemoteStorage";
import CurrentUser from "@/lib/CurrentUser";
import { ExpressUser } from "../interfaces/ExpressUser.interface";


export class UploadsController {
    async uploadFile(req: Request, res: Response): Promise<Response> {
        const currentUser = new CurrentUser(req.user as ExpressUser)

        const user = await currentUser.getCurrentUser()

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        console.log(req.files)

        if (!Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({ error: 'No files were uploaded' });
        }

        const file = req.files[0]

        // Max 20MB

        if (file.size > 20 * 1024 * 1024) {
            return res.status(400).json({ error: 'The file that you are trying to upload is too big (max 20MB)' });
        }

        try {
            const upload = await remoteStorageService.uploadFile(file, `uploads/${user.twitchId}`, user)
            console.log(upload)

            return res.json({
                data: {
                    upload
                }
            })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: 'An error occurred while uploading the file' });
        }
    }

    async getUploads(req: Request, res: Response): Promise<Response> {
        const currentUser = new CurrentUser(req.user as ExpressUser)

        const user = await currentUser.getCurrentUser()

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const uploads = await user.getUploads()

        return res.json({
            data: {
                uploads
            }
        })


    }
}