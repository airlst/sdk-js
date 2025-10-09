import { Api, Guest, GuestManager } from './src'

Api.setBaseURL('https://core-github-pr-3789.airlst.app/api')
Api.setApiKey(
  '1f0a5034-b772-6294-87d6-fb7e9cd18dab|UjJDPVakvoKuHaM7LBsdgCRz0yYalgcmPgm0tNZW',
)

const eventId = '1f09541a-04ce-6c80-a6ad-060ecf3abdd3'
const existingGuestManagerCode = 'XKFMOBN1'
const existingGuestCode = '4FW0NL79'

async function main() {
  let response

  response = await new GuestManager(eventId).get(existingGuestManagerCode)
  console.log(response.data.guest.managed_guests.length > 0)

  response = await new Guest(eventId).get(existingGuestCode)
  console.log(typeof response.data.guest.managed_guests === 'undefined')
  console.log(response.data.guest.guest_managers.length > 0)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
