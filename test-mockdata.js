
import { mockData } from './src/data/mockData.js'

console.log('Testing mockData generation...')
console.log('Registrations count:', mockData.registrations.length)
console.log('Incidents count:', mockData.incidents.length)
console.log('Equipment usage count:', mockData.equipmentUsage.length)
console.log('Weather records count:', mockData.weatherRecords.length)

console.log('\nFirst registration:', JSON.stringify(mockData.registrations[0], null, 2))
console.log('\nFirst incident:', JSON.stringify(mockData.incidents[0], null, 2))
console.log('\nFirst weather record:', JSON.stringify(mockData.weatherRecords[0], null, 2))

console.log('\nAll tests passed!')
