import SibApiV3Sdk, { TransactionalEmailsApi, TransactionalEmailsApiApiKeys } from '@getbrevo/brevo';
import chalk from "chalk";

class EmailManager {
    private static _instance: EmailManager | null = null;
    private transactionalEmailsApi: SibApiV3Sdk.TransactionalEmailsApi | null = null;

    private constructor() {
        // Constructor privado
    }

    public static getInstance(): EmailManager {
        if (!EmailManager._instance) {
            throw new Error('EmailManager no ha sido inicializado. Utiliza el método initialize para configurar los parámetros.');
        }
        return EmailManager._instance;
    }

    public static initialize(): void {
        if (!process.env.BREVO_API_KEY) {
            console.error(chalk.red('[EMAIL MANAGER]') + ' ' + chalk.white('No se ha configurado la variable de entorno BREVO_API_KEY. No se podrán enviar correos electrónicos.'));
            return;
        }
        if (!EmailManager._instance) {
            EmailManager._instance = new EmailManager();
            EmailManager._instance.transactionalEmailsApi = new TransactionalEmailsApi();
            EmailManager._instance.transactionalEmailsApi.setApiKey(TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY as string);
            console.log(chalk.green('[EMAIL MANAGER]') + ' ' + chalk.white('EmailManager inicializado correctamente.'));
        }
    }

    public async sendEmail(params: {
        subject: string;
        htmlContent?: string;
        sender?: { name: string; email: string };
        to: { email: string; name: string }[];
        cc?: { email: string; name: string }[];
        bcc?: { email: string; name: string }[];
        replyTo?: { email: string; name: string };
        templateId?: number;
        headers?: Record<string, string>;
        params: Record<string, string>;
    }): Promise<void> {
        // Verificar que la instancia ha sido inicializada
        if (!EmailManager._instance || !EmailManager._instance.transactionalEmailsApi) {
            throw new Error('EmailManager no ha sido inicializado. Utiliza el método initialize para configurar los parámetros.');
        }

        try {
            // Enviar el correo electrónico
            const response = await EmailManager._instance.transactionalEmailsApi?.sendTransacEmail({
                subject: params.subject,
                htmlContent: params.htmlContent,
                sender: params.sender || { email: 'notificaciones@petruquio.live', name: 'Petruquio.LIVE' },
                to: params.to,
                cc: params.cc,
                bcc: params.bcc,
                replyTo: params.replyTo || { email: 'no-reply@petruquio.live', name: 'Petruquio.LIVE' },
                templateId: params.templateId,
                headers: params.headers,
                params: params.params,
            });
            console.log('Correo electrónico enviado:', response);
            console.log(chalk.green('[EMAIL MANAGER]') + ' ' + chalk.white('Correo electrónico enviado:', response));
        } catch (error) {
            console.error('Error al enviar el correo electrónico:', error);
            console.error(chalk.red('[EMAIL MANAGER]') + ' ' + chalk.white('Error al enviar el correo electrónico:', error));
        }
    }
}

export default EmailManager;