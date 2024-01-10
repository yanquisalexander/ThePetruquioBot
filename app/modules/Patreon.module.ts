import chalk from 'chalk';
import ExternalAccount, { ExternalAccountProvider } from '../models/ExternalAccount.model';
import User from '../models/User.model';
import axios, { AxiosError } from 'axios';

class Patreon {
    public static campaignId: string = '11539775';

    constructor() {
        throw new Error('This class cannot be instantiated');
    }

    public static async isUserSubscribed(user: User): Promise<boolean> {
        try {
            // Fetch user details from Patreon API
            const patreonAccount = await ExternalAccount.findByProviderAndUser(
                ExternalAccountProvider.PATREON,
                user
            );

            if (!patreonAccount) {
                console.log(
                    chalk.bgCyan.bold('[PATREON]'),
                    chalk.white(`User ${user.username} does not have a Patreon account linked.`)
                );
                return false;
            }

            const params = new URLSearchParams();
            params.append('include', 'memberships.currently_entitled_tiers,memberships.campaign');
            params.append('fields[user]', 'email,first_name,full_name,image_url,last_name,thumb_url,url,vanity,is_email_verified');
            params.append('fields[member]', 'currently_entitled_amount_cents,lifetime_support_cents,campaign_lifetime_support_cents,last_charge_status,patron_status,last_charge_date,pledge_relationship_start,pledge_cadence');

            const response = await axios.get('https://www.patreon.com/api/oauth2/v2/identity', {
                params: params,
                headers: { 
                    Authorization: `Bearer ${patreonAccount.accessToken}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });

            console.log(response.data);

            const included = response.data.included || [];
            let membership: any = null;

            included.forEach((item: any) => {
                if (item.type === 'member' && item.relationships.campaign.data.id === Patreon.campaignId) {
                    membership = item;
                }
            });

            if (membership && membership.attributes && membership.attributes.patron_status === 'active_patron') {
                console.log(
                    chalk.bgGreen.bold('[PATREON]'),
                    chalk.white(`User ${user.username} is an active Patreon subscriber for campaign ${Patreon.campaignId}.`)
                );
                return true;
            } else {
                console.log(
                    chalk.bgCyan.bold('[PATREON]'),
                    chalk.white(`User ${user.username} is not an active Patreon subscriber for campaign ${Patreon.campaignId}.`)
                );
                return false;
            }
        } catch (error) {
            console.log((error as AxiosError).response);
            console.error(
                chalk.bgRed.bold('[PATREON]'),
                chalk.white(`Error checking Patreon subscription for user ${user.username}:`, (error as Error).message)
            );
            return false;
        }
    }
}

export default Patreon;
