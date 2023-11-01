export const greetings: Record<string, string[]> = {
    en: [
        "Hello there, @#username! #emote",
        "Welcome, @#username! #emote",
        "Greetings, @#username. How are you? #emote",
        "Hi @#username, good to see you around! #emote",
    ],
    es: [
        "Holaaaaa @#username! ^^",
        "Hola que tal, @#username? #emote",
        "¡Bienvenido/a, @#username! #emote",
        "Saludos, @#username. ¿Cómo estás? #emote",
        "Hola @#username, ¡qué bueno verte por aquí! #emote",
        "Bueeenas @#username! 🎉 ¡Bienvenido/a a la diversión! 🎈",
        "Como estaaaaas @#username? #emote",
        "como vas @#username? ;)",
    ],
    pt: [
        "Oiiii @#username! ^^",
        "Olá, @#username! #emote",
        "Bem-vindo, @#username! #emote",
        "Saudações, @#username. Como você está? #emote",
        "Oi @#username, bom te ver por aqui! #emote",
        "como vai @#username? ;)"
    ],
    fr: [
        "Bonjour, @#username! #emote",
        "Bienvenue, @#username! #emote",
        "Salutations, @#username. Comment allez-vous? #emote",
        "Salut @#username, content de te voir ici! #emote",
    ],
    de: [
        "Hallo, @#username! #emote",
        "Willkommen, @#username! #emote",
        "Grüße, @#username. Wie geht es dir? #emote",
        "Hallo @#username, schön dich hier zu sehen! #emote",
    ],
    it: [
        "Ciao, @#username! #emote",
        "Benvenuto, @#username! #emote",
        "Saluti, @#username. Come stai? #emote",
        "Ciao @#username, bello vederti qui! #emote",
    ],
    ru: [
        "Привет, @#username! #emote",
        "Добро пожаловать, @#username! #emote",
        "Приветствую, @#username. Как ты? #emote",
        "Привет @#username, рад тебя видеть! #emote",
    ]
};

export const sunlightGreetings: Record<string, Record<string, string[]>> = {
    en: {
        morning: [
            "Good morning, @#username! #emote",
            "Have a nice day, @#username! #emote",
            "Good morning, @#username. How are you? #emote",
        ],
        afternoon: [
            "Good afternoon, @#username! #emote",
            "Good afternoon, @#username. How are you? #emote",
        ],
        evening: [
            "Good evening, @#username! #emote",
            "Good evening, @#username. How are you? #emote",
        ],
        night: [
            "Good night, @#username! #emote",
            "Good night, @#username. Sleep well! #emote",
        ],
    },
    es: {
        morning: [
            "¡Buenos diaaaas @#username! ☀️ ¡Empieza el día con una sonrisa radiante!",
            "Buenos días, @#username! #emote",
            "Que tengas un buen día, @#username! #emote",
            "Buenos días, @#username. ¿Cómo estás? #emote",
        ],
        afternoon: [
            "Linda tarde @#username! 🌞 ¿Cómo va tu día?",
            "Buenas tardes, @#username! #emote",
            "Buenas tardes, @#username. ¿Cómo estás? #emote",
            "¡Holaaa @#username! 🌸 Espero que estés teniendo una tarde genial #emote",

        ],
        evening: [
            "Buenas noches, @#username! #emote",
            "Buenas noches, @#username. ¿Cómo estás? #emote",
        ],
        night: [
            "Buenas noches, @#username! #emote",
            "Buenas noches, @#username. Espero tenga lindos sueños! #emote",
        ],
    },
    pt: {
        morning: [
            "Bom dia, @#username! #emote",
            "Tenha um bom dia, @#username! #emote",
            "Bom dia, @#username. Como você está? #emote",
        ],
        afternoon: [
            "Boa tarde, @#username! #emote",
            "Boa tarde, @#username. Como você está? #emote",
        ],
        evening: [
            "Boa noite, @#username! #emote",
            "Boa noite, @#username. Como você está? #emote",
        ],
        night: [
            "Boa noite, @#username! #emote",
            "Boa noite, @#username. Tenha bons sonhos! #emote",
        ],
    },
    fr: {
        morning: [
            "Bonjour, @#username! #emote",
            "Passez une bonne journée, @#username! #emote",
            "Bonjour, @#username. Comment allez-vous? #emote",
        ],
        afternoon: [
            "Bon après-midi, @#username! #emote",
            "Bon après-midi, @#username. Comment allez-vous? #emote",
        ],
        evening: [
            "Bonsoir, @#username! #emote",
            "Bonsoir, @#username. Comment allez-vous? #emote",
        ],
        night: [
            "Bonne nuit, @#username! #emote",
            "Bonne nuit, @#username. Faites de beaux rêves! #emote",
        ],
    },
    de: {
        morning: [
            "Guten Morgen, @#username! #emote",
            "Haben Sie einen schönen Tag, @#username! #emote",
            "Guten Morgen, @#username. Wie geht es dir? #emote",
        ],
        afternoon: [
            "Guten Tag, @#username! #emote",
            "Guten Tag, @#username. Wie geht es dir? #emote",
        ],
        evening: [
            "Guten Abend, @#username! #emote",
            "Guten Abend, @#username. Wie geht es dir? #emote",
        ],
        night: [
            "Gute Nacht, @#username! #emote",
            "Gute Nacht, @#username. Schlaf gut! #emote",
        ],
    },
    it: {
        morning: [
            "Buongiorno, @#username! #emote",
            "Buona giornata, @#username! #emote",
            "Buongiorno, @#username. Come stai? #emote",
        ],
        afternoon: [
            "Buon pomeriggio, @#username! #emote",
            "Buon pomeriggio, @#username. Come stai? #emote",
        ],
        evening: [
            "Buona sera, @#username! #emote",
            "Buona sera, @#username. Come stai? #emote",
        ],
        night: [
            "Buona notte, @#username! #emote",
            "Buona notte, @#username. Dormi bene! #emote",
        ],
    }
};

export const defaultShoutoutMessages: string[] = [
    'drop a follow to #targetStreamer at https://twitch.tv/#targetStreamer <3 !',
    'go check out #targetStreamer at https://twitch.tv/#targetStreamer <3 !',
    'what are you waiting for? drop a follow to #targetStreamer at https://twitch.tv/#targetStreamer <3 !',
    'let\'s go show some love to #targetStreamer at https://twitch.tv/#targetStreamer <3 !',
    'support #targetStreamer at https://twitch.tv/#targetStreamer <3 !',
];


export const birthdayGreetings: Record<string, string[]> = {
    es: [
        "¡Feliz cumpleaños @#username! 🎉🥳",
        "Hoy es un día especial, ¡feliz cumpleaños @#username! 🎂🎈",
        "Feliz cumpleaños @#username, ¡que tengas un día maravilloso! 🎁🥂",
        "En este día especial, te deseamos un muy feliz cumpleaños @#username. ¡Celebremos juntos! 🎉🎂"
    ],
    en: [
        "Happy birthday @#username! 🎉🥳",
        "Today is a special day, happy birthday @#username! 🎂🎈",
        "Happy birthday @#username, have a wonderful day! 🎁🥂",
        "On this special day, we wish you a very happy birthday @#username. Let's celebrate together! 🎉🎂"
    ],
    pt: [
        "Feliz aniversário @#username! 🎉🥳",
        "Hoje é um dia especial, feliz aniversário @#username! 🎂🎈",
        "Feliz aniversário @#username, tenha um dia maravilhoso! 🎁🥂",
        "Neste dia especial, desejamos a você um feliz aniversário @#username. Vamos comemorar juntos! 🎉🎂"
    ],
    fr: [
        "Joyeux anniversaire @#username! 🎉🥳",
        "Aujourd'hui est un jour spécial, joyeux anniversaire @#username! 🎂🎈",
        "Joyeux anniversaire @#username, passez une merveilleuse journée! 🎁🥂",
        "En ce jour spécial, nous vous souhaitons un très joyeux anniversaire @#username. Célébrons ensemble! 🎉🎂"
    ],
    de: [
        "Alles Gute zum Geburtstag @#username! 🎉🥳",
        "Heute ist ein besonderer Tag, alles Gute zum Geburtstag @#username! 🎂🎈",
        "Alles Gute zum Geburtstag @#username, haben Sie einen wundervollen Tag! 🎁🥂",
        "An diesem besonderen Tag wünschen wir Ihnen einen sehr schönen Geburtstag @#username. Feiern wir zusammen! 🎉🎂"
    ],
    it: [
        "Buon compleanno @#username! 🎉🥳",
        "Oggi è un giorno speciale, buon compleanno @#username! 🎂🎈",
        "Buon compleanno @#username, buona giornata! 🎁🥂",
        "In questo giorno speciale ti auguriamo un buon compleanno @#username. Festeggiamo insieme! 🎉🎂"
    ],
    ru: [
        "С днем рождения @#username! 🎉🥳",
        "Сегодня особенный день, с днем рождения @#username! 🎂🎈",
        "С днем рождения @#username, хорошего дня! 🎁🥂",
        "В этот особенный день мы желаем вам счастливого дня рождения @#username. Давайте праздновать вместе! 🎉🎂"
    ]
};
