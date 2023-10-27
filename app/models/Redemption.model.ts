import Database from "../../lib/Database";
import Channel from "./Channel.model";
import User from "./User.model";

class Redemption {
  id?: number;
  eventId?: string;
  rewardId: string;
  rewardName: string;
  rewardCost: number;
  rewardIcon: string | null;
  redemptionDate: Date;
  message?: string | null;
  user: User | null;
  channel: Channel;

  constructor(
    eventId: string,
    rewardId: string,
    rewardName: string,
    rewardCost: number,
    redemptionDate: Date,
    user: User | null,
    channel: Channel,
    rewardIcon: string | null = null,
    message: string | null = null
  ) {
    this.eventId = eventId;
    this.rewardId = rewardId;
    this.rewardName = rewardName;
    this.rewardCost = rewardCost;
    this.rewardIcon = rewardIcon;
    this.redemptionDate = redemptionDate;
    this.message = message;
    this.user = user;
    this.channel = channel;
  }

  static async create(data: Redemption): Promise<Redemption> {
    try {
      const query = `
        INSERT INTO redemption_history (event_id, reward_id, reward_name, reward_cost, reward_icon, redemption_date, message, user_id, channel_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
      `;

      if (!data.user) throw new Error('User is required');

      const values = [
        data.eventId,
        data.rewardId,
        data.rewardName,
        data.rewardCost,
        data.rewardIcon,
        data.redemptionDate,
        data.message,
        data.user.twitchId,
        data.channel.twitchId,
      ];

      const result = await Database.query(query, values);

      const redemptionData = result.rows[0];

      return new Redemption(
        redemptionData.event_id,
        redemptionData.reward_id,
        redemptionData.reward_name,
        redemptionData.reward_cost,
        redemptionData.redemption_date,
        data.user,
        data.channel,
        redemptionData.reward_icon,
        redemptionData.message
      );
    } catch (error) {
      throw new Error((error as Error).message);
    }

  }

  static async getHistory(channel: Channel): Promise<Redemption[]> {
    try {
      const query = `
        SELECT * FROM redemption_history
        WHERE channel_id = $1
        ORDER BY redemption_date DESC;
      `;

      const values = [channel.twitchId];

      const result = await Database.query(query, values);

      const redemptions: Redemption[] = [];

      for (const redemptionData of result.rows) {
        const user = await User.findByTwitchId(redemptionData.user_id);
        if (!user) {
          console.error(`User with Twitch ID ${redemptionData.user_id} not found`);
          continue;
        }
        redemptions.push(new Redemption(
          redemptionData.event_id,
          redemptionData.reward_id,
          redemptionData.reward_name,
          redemptionData.reward_cost,
          redemptionData.redemption_date,
          user,
          channel,
          redemptionData.reward_icon,
          redemptionData.message
        ));
      }

      return redemptions;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  static async findByChannelAndRewardId(channel: Channel, rewardId: string): Promise<any[]> {
    try {
      const query = `
      SELECT
      u.twitch_id AS user_id,
      u.username AS user_username,
      u.display_name AS user_display_name,
      u.avatar AS user_avatar,
      COUNT(*) AS redemption_count
  FROM
      redemption_history AS rh
  LEFT JOIN
      users AS u ON rh.user_id = u.twitch_id
  WHERE
      rh.channel_id = $1
      AND rh.reward_id = $2
  GROUP BY
      u.twitch_id
  ORDER BY
      redemption_count DESC;
  
  
  
      `;

      const values = [channel.twitchId, rewardId];

      const result = await Database.query(query, values);

      return result.rows;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }


}

export default Redemption;