import dotenv from 'dotenv'
dotenv.config()

const command = process.argv[2]
const args = process.argv.slice(3)

console.log('ACE (compatibility mode)')
console.log('Command:', command, args || [])

function printHelp() {
  console.log('')
  console.log('Available commands:')
  console.log('  dev              - Start development server (alias: npm run dev)')
  console.log('  start            - Start production server (alias: npm start)')
  console.log('  migration:run    - Run pending migrations')
  console.log('  migration:fresh  - Drop all tables and re-run migrations')
  console.log('  db:seed          - Run database seeders')
  console.log('')
}

switch (command) {
  case 'serve':
  case 'dev':
  case 'start': {
    import('./start/httpServer.js')
    break
  }
  case 'migration:run':
  case 'migration:fresh':
  case 'db:seed': {
    console.log('')
    console.log('⚠️  Adonis Ace commands are not available in Express compatibility mode.')
    console.log('👉 To run migrations/seeders, use the src/db/seed.js or create custom scripts.')
    console.log('')
    break
  }
  case 'help':
  case '--help':
  case '-h':
  default:
    printHelp()
    process.exit(0)
}
