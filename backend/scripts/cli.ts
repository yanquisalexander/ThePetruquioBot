import * as readlineSync from 'readline-sync'
import Database from '../lib/DatabaseManager'
import User from '../app/models/User.model'
import Twitch from '../app/modules/Twitch.module'
import TwitchAuthenticator from '../app/modules/TwitchAuthenticator.module'
import chalk from 'chalk'
import EmailManager from '../app/modules/EmailManager.module'

Database.connect()
TwitchAuthenticator.initialize().catch((error) => {
  console.error(chalk.red('[ERROR]'), `Error initializing TwitchAuthenticator: ${error}`)
  process.exit(1)
})

Twitch.initialize().catch((error) => {
  console.error(chalk.red('[ERROR]'), `Error initializing Twitch API: ${error}`)
  process.exit(1)
})
EmailManager.initialize()

const showMenu = (): string => {
  console.log('=== PetruquioLIVE Console ===')
  console.log('1. Update user')
  console.log('2. Test Email')
  console.log('3. Exit')
  const option = readlineSync.question('Choose an option: ')
  return option
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const main = async () => {
  let option = showMenu()
  while (option !== '3') {
    switch (option) {
      case '1':
        // eslint-disable-next-line no-case-declarations
        const username = readlineSync.question('Username: ')
        await updateUser(username)
        break
      case '2':
        await testEmail()
        break
      default:
        console.log('Invalid option')
        break
    }
    option = showMenu()
  }

  console.log('Thanks for using Petruquio.LIVE Console')
  process.exit(0)
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const updateUser = async (username: string) => {
  const user = await User.findByUsername(username)
  if (!user) {
    console.log(chalk.red(`User ${chalk.bold.yellow(username)} not found`))
    return
  }

  const twitchUser = await Twitch.getUser(username)
  if (!twitchUser) {
    console.log('Twitch user not found')
    return
  }

  user.username = twitchUser.name
  user.displayName = twitchUser.displayName
  user.avatar = twitchUser.profilePictureUrl
  await user.save()
  console.log(chalk.green(`User ${chalk.bold.yellow(user.username)} updated successfully`))
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const testEmail = async () => {
  try {
    const email = readlineSync.question('Email: ')
    const username = readlineSync.question('Username: ')
    console.log('Sending email...')
    await EmailManager.getInstance().sendEmail({
      to: [{ email, name: 'Test' }],
      params: {
        TWITCH_USERNAME: username || 'Test'
      },
      templateId: 1,
      subject: 'Test'
    })
  } catch (error) {
    console.error(chalk.red('[ERROR]'), `Error sending email: ${(error as Error).message}`)
  }
}

main().catch((error) => {
  console.error(chalk.red('[ERROR]'), error)
  process.exit(1)
})
