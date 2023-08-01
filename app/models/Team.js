import { db } from "../../lib/database.js";


class Team {
    constructor(id, name, displayName) {
        this.id = id;
        this.name = name;
        this.displayName = displayName;
    }

    async getMembers() {
        const query = {
            text: 'SELECT * FROM channels WHERE team_id = $1',
            values: [this.id],
        };

        try {
            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener los miembros del equipo:', error);
            throw error;
        }
    }

    static async getByName(name) {
    // Hacer que la query sea indiferente a mayúsculas y minúsculas
        name = name.toLowerCase();

        const query = {
            text: 'SELECT * FROM teams WHERE LOWER(name) = $1',
            values: [name],
        };

        try {
            const result = await db.query(query);
            if(result.rows.length === 0) {
                return null;
            }
            const team = result.rows[0];
            
            if (team) {
                return new Team(team.id, team.name, team.display_name);
            }
            
        } catch (error) {
            console.error('Error al obtener el equipo por nombre:', error);
            throw error;
        }
    }
}

export default Team;