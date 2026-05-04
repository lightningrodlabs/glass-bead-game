import { assert, test } from 'vitest'
import { runScenario, dhtSync } from '@holochain/tryorama'

test('hApp installs and two agents reach the same DHT', async () => {
    await runScenario(async (scenario) => {
        const testAppPath = process.cwd() + '/../workdir/glassbeadgame.happ'
        const appSource = { appBundleSource: { type: 'path' as const, value: testAppPath } }

        const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource])
        await scenario.shareAllAgents()

        await dhtSync([alice, bob], alice.cells[0].cell_id[0])

        assert.ok(alice.cells[0])
        assert.ok(bob.cells[0])
    })
})
