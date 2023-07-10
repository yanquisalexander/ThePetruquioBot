import { Router } from "express";
import axios from "axios";
import passport from "../../lib/passport.js";
import Channel from "../../app/models/Channel.js";

const DashboardRouter = Router();

DashboardRouter.get("/bot-settings", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const channel = await Channel.getChannelByName(req.user.username);
        res.json({
            data: channel.settings
        });
    } catch (error) {
        res.status(500).json({
            errors: [
                "Something went wrong while trying to get the bot settings."
            ],
            error_type: "internal_server_error"
        });
    }
    
        
})

DashboardRouter.post("/bot-settings", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
      const channel = await Channel.getChannelByName(req.user.username);
      const updatedSettings = req.body; // Supongamos que el cuerpo de la solicitud contiene un objeto con los ajustes modificados { key: value }
  
      // Iterar sobre cada ajuste modificado y actualizarlo en el objeto de ajustes del canal
      for (const key in updatedSettings) {
        if (channel.settings.hasOwnProperty(key) && typeof channel.settings[key] === 'object' && channel.settings[key].hasOwnProperty('value')) {
          channel.settings[key].value = updatedSettings[key];
        }
      }
  
      // Guardar los cambios en la base de datos
      await channel.updateSettings();
  
      res.json({
        success: true,
        message: "Bot settings updated successfully."
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        errors: [
          "Something went wrong while trying to update the bot settings."
        ],
        error_type: "internal_server_error"
      });
    }   
  });
  
  

export default DashboardRouter;
