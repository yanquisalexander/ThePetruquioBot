import { Router } from 'express';
import passport from "../../lib/passport.js";
import jwt from 'jsonwebtoken';
import User from '../../app/models/User.js';
import { Bot } from '../../bot.js';
import Session from '../../app/models/Session.js';
import psList from 'ps-list';

const AdminRouter = Router();

AdminRouter.get("/users", passport.authenticate('jwt', { session: false }), async (req, res) => {
    const currentUser = req.user;

    // Verifica si el usuario actual tiene el privilegio de administrador
    if (currentUser.admin) {
        try {
            // Busca todos los usuarios en la base de datos
            const users = await User.findAll();
            res.json({
                data: { 
                    users
                }
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: 'Failed to get users' });
        }
    } else {
        return res.status(403).json({ message: 'Unauthorized to get users' });
    }
});

AdminRouter.delete("/users/:userId", passport.authenticate('jwt', { session: false }), async (req, res) => {
    const currentUser = req.user;
    const userIdToDelete = req.params.userId;

    // Verifica si el usuario actual tiene el privilegio de administrador
    if (currentUser.admin) {
        try {
            // Busca el usuario que se desea eliminar en la base de datos
            const userToDelete = await User.findById(userIdToDelete);

            if (!userToDelete) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Elimina el usuario de la base de datos
            await userToDelete.delete();

            // Part from the user channel
            await Bot.part(userToDelete.username);  
            

            res.json({ message: 'User deleted' });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: 'Failed to delete user' });
        }
    } else {
        return res.status(403).json({ message: 'Unauthorized to delete user' });
    }
});

AdminRouter.post("/users/:userId/impersonate", passport.authenticate('jwt', { session: false }), async (req, res) => {
    const currentUser = req.user;
    const userIdToImpersonate = req.params.userId;

    // Verifica si el usuario actual tiene el privilegio de impersonar (por ejemplo, es un administrador)
    if (currentUser.admin) {
        try {
            // Busca el usuario que se desea impersonar en la base de datos
            const userToImpersonate = await User.findById(userIdToImpersonate);
            console.log(`LOG: Impersonating user ${userToImpersonate.username} (${userToImpersonate.id})`);

            if (!userToImpersonate) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Altera la sesión del usuario actual para que se impersonen las acciones del usuario deseado
            const session = await Session.findBySessionId(currentUser.session_id);
            console.log(session)
            await session.setImpersonate(userToImpersonate.id);
            res.json({ status: 'ok' });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: 'Failed to impersonate user' });
        }
    } else {
        return res.status(403).json({ message: 'Unauthorized to impersonate' });
    }
});

AdminRouter.get("/processes", passport.authenticate('jwt', { session: false }), async (req, res) => {
    const currentUser = req.user;

    // Verifica si el usuario actual tiene el privilegio de administrador
    if (currentUser.admin) {
        try {
            let processes = [];
            processes = await psList()
            res.json({
                data: {
                    processes
                }
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: 'Failed to get processes' });
        }
    } else {
        return res.status(403).json({ message: 'Unauthorized to get processes' });
    }
});



export default AdminRouter;