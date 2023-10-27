import * as fs from "fs";
// @ts-ignore
import spectatorLocations from "./spectator_locations.json";
// @ts-ignore
import worldMaps from "./worldmaps.json";
import User from "../app/models/User.model";
import Twitch from "../app/modules/Twitch.module";
import Database from "../lib/Database";
import TwitchAuthenticator from "../app/modules/TwitchAuthenticator.module";
import SpectatorLocation from "../app/models/SpectatorLocation.model";
import Geolocation from "../app/modules/Geolocation.module";
import WorldMap from "../app/models/WorldMap.model";
// @ts-ignore
import redeems from "./rewards.json";
import Redemption from "../app/models/Redemption.model";
import Channel from "../app/models/Channel.model";
Database.connect();

const main = async () => {

    // Ask for confirmation
    process.stdout.write("This process will import all spectator locations from the legacy PetruquioBot database to the new one. Are you sure? (y/n): ");
    const stdin = process.openStdin();
    stdin.addListener("data", async (d) => {
        const input = d.toString().trim();
        if (input === "y") {
            await TwitchAuthenticator.initialize();
            await Twitch.initialize();
            await executeImport();
        } else {
            console.log("Import process aborted.");
            process.exit(0);
        }
        stdin.end();
    });

}

const executeImport = async () => {
    console.log("*** PetruquioBot Legacy Data Importer ***");

    let current = 1;
    let total = spectatorLocations.length;
    let failed = 0;
    let skipped = 0;
    /*     console.log(`Importing ${total} spectator locations...`);
        console.log("Estimated time: " + (total * 15 / 60) + " minutes");
    
        console.log("Starting import...");
        console.log("=====================================");
        console.log("");
    
        for (const data of spectatorLocations) {
            let user = await User.findByUsername(data.username);
    
            if (!user) {
                console.log(`User ${data.username} not found. Trying to create...`);
                let twitchUser = await Twitch.getUser(data.username);
                await new Promise((resolve) => setTimeout(resolve, 5000));
                if (twitchUser) {
                    let newUser = new User(twitchUser.name, parseInt(twitchUser.id), undefined, twitchUser.displayName, twitchUser.profilePictureUrl);
                    await newUser.save();
    
                    user = newUser;
                    console.log(`User ${data.username} created. ${current++}/${spectatorLocations.length}`);
                } else {
                    console.log(`User ${data.username} not found on Twitch. Maybe was banned/deleted/changed name?`);
                    failed++;
                }
            } else {
                const uLocation = await SpectatorLocation.findByUserId(user.twitchId);
                if (uLocation) {
                    console.log(`User ${data.username} already has a location. Skipping...`);
                    skipped++;
                    continue; // Saltar a la siguiente iteración del bucle
                }
    
                const geocode = await Geolocation.getLocalization(data.location);
    
                const newLocation = new SpectatorLocation(user.twitchId, geocode?.latitude?.toString(), geocode?.longitude?.toString(), data.location, geocode?.countryCode);
                await newLocation.save();
    
                console.log(`User ${data.username} location saved. ${current++}/${spectatorLocations.length}`);
                // Esperar 15 segundos antes de continuar con la siguiente iteración, para evitar el rate limit de la API de Geolocation
                await new Promise((resolve) => setTimeout(resolve, 15000));
            }
        }
    
        console.log("");
        console.log("=====================================");
        console.log("Import finished for Spectator Locations. Results:");
        console.log(`Total: ${total}`);
        console.log(`Skipped: ${skipped}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success: ${total - skipped - failed}`);
        console.log("=====================================");
    
        console.log("");
        console.log("=====================================");
        console.log("Importing World Maps...");
        console.log("=====================================");
        console.log(""); */

    //await processWorldMaps(worldMaps);
    await legacyChannelPointRedeems(redeems);

}


async function legacyChannelPointRedeems(redeems: any[]) {
    for (const redeem of redeems) {
        console.log(redeem.twitch_id);
        const channel = await Channel.findByTwitchId(redeem.twitch_id);
        if(!channel) continue; // Saltar a la siguiente iteración del bucle
        const user = await User.findByUsername(redeem.username);
        if (user) {
            let rewardId = ''

            if(redeem.twitch_id !== '769457018') {
                console.log('no es el canal de fabi_guille');
                continue; // Saltar a la siguiente iteración del bucle
            }

            if(redeem.twitch_id === '769457018') {
                'b5187dbe-6e29-423d-b75c-8ef4e8409d8c'
            }

            const newRedeem = await Redemption.create({
                eventId: `legacy-${redeem.id}`,
                channel,
                user,
                rewardId: 'b5187dbe-6e29-423d-b75c-8ef4e8409d8c',
                rewardCost: 50,
                rewardName: 'Primero/a',
                rewardIcon: 'https://static-cdn.jtvnw.net/custom-reward-images/769457018/b5187dbe-6e29-423d-b75c-8ef4e8409d8c/8c629218-5a29-4634-ad14-fe3de6ccdb48/custom-2.png',
                redemptionDate: redeem.redeemed_at
            })

            console.log(`Redeem ${newRedeem.id} created. ${redeem.id}/${redeems.length}`);


        }
    }

}






main();