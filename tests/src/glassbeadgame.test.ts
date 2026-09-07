import { assert, test } from 'vitest'
import { runScenario, dhtSync } from '@holochain-open-dev/tryorama'
import {
    sampleSettings,
    ZOME,
    type CreateGameOutput,
    type CreateOutput,
    type GameOutput,
    type CommentOutput,
    type BeadOutput,
} from './common'

const testAppPath = process.cwd() + '/../workdir/glassbeadgame.happ'
const appSource = { appBundleSource: { type: 'path' as const, value: testAppPath } }

test('hApp installs and two agents reach the same DHT', async () => {
    await runScenario(async (scenario) => {
        const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource])
        await scenario.shareAllAgents()

        await dhtSync([alice, bob], alice.cells[0].cell_id[0])

        assert.ok(alice.cells[0])
        assert.ok(bob.cells[0])
    })
})

test('create a game, then join / comment / bead / update it across two agents', async () => {
    await runScenario(async (scenario) => {
        const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource])
        await scenario.shareAllAgents()
        const [aliceCell] = alice.cells
        const [bobCell] = bob.cells

        // --- create_game: two entries (GameSettings, Game) plus two links ---
        const created: CreateGameOutput = await aliceCell.callZome({
            zome_name: ZOME,
            fn_name: 'create_game',
            payload: sampleSettings(),
        })
        assert.ok(created.entryHash, 'create_game returned an entry hash')
        assert.ok(created.actionHash)
        assert.ok(created.settingsActionHash)

        await dhtSync([alice, bob], aliceCell.cell_id[0])

        // --- Bob sees it: get_games walks the "games" path anchor link ---
        const games: GameOutput[] = await bobCell.callZome({
            zome_name: ZOME,
            fn_name: 'get_games',
            payload: null,
        })
        assert.equal(games.length, 1, 'bob sees exactly one game')
        assert.equal(games[0].settings.topic, 'The nature of play')
        assert.deepEqual(
            Array.from(games[0].creator),
            Array.from(alice.agentPubKey),
            'the creator is read off the Game action author'
        )
        assert.ok(games[0].created > 0, 'created timestamp is populated')

        // --- get_game on the other agent ---
        const game: GameOutput = await bobCell.callZome({
            zome_name: ZOME,
            fn_name: 'get_game',
            payload: created.entryHash,
        })
        assert.equal(game.settings.numberOfTurns, 3)

        // --- join_game / get_players / leave_game (create_link + delete_link) ---
        const joinHash = await bobCell.callZome({
            zome_name: ZOME,
            fn_name: 'join_game',
            payload: { agentKey: bob.agentPubKey, entryHash: created.entryHash },
        })
        assert.ok(joinHash)
        await dhtSync([alice, bob], aliceCell.cell_id[0])

        const players: Uint8Array[] = await aliceCell.callZome({
            zome_name: ZOME,
            fn_name: 'get_players',
            payload: created.entryHash,
        })
        assert.equal(players.length, 1)
        assert.deepEqual(Array.from(players[0]), Array.from(bob.agentPubKey))

        // --- create_comment / get_comments ---
        const comment: CreateOutput = await bobCell.callZome({
            zome_name: ZOME,
            fn_name: 'create_comment',
            payload: { entryHash: created.entryHash, text: 'first move' },
        })
        assert.ok(comment.entryHash)
        await dhtSync([alice, bob], aliceCell.cell_id[0])

        const comments: CommentOutput[] = await aliceCell.callZome({
            zome_name: ZOME,
            fn_name: 'get_comments',
            payload: created.entryHash,
        })
        assert.equal(comments.length, 1)
        assert.equal(comments[0].text, 'first move')
        assert.deepEqual(
            Array.from(comments[0].agentKey),
            Array.from(bob.agentPubKey),
            'comment author read off Action::author()'
        )
        assert.ok(comments[0].timestamp > 0, 'comment timestamp read off Action::timestamp()')

        // --- create_bead / get_beads (serde_bytes Vec<u8> round trip) ---
        const audio = new Uint8Array([1, 2, 3, 4, 5])
        const bead: CreateOutput = await aliceCell.callZome({
            zome_name: ZOME,
            fn_name: 'create_bead',
            payload: { entryHash: created.entryHash, bead: { audio, index: 0 } },
        })
        assert.ok(bead.entryHash)
        await dhtSync([alice, bob], aliceCell.cell_id[0])

        const beads: BeadOutput[] = await bobCell.callZome({
            zome_name: ZOME,
            fn_name: 'get_beads',
            payload: created.entryHash,
        })
        assert.equal(beads.length, 1)
        assert.deepEqual(Array.from(beads[0].bead.audio), [1, 2, 3, 4, 5])
        assert.equal(beads[0].bead.index, 0)

        // a game with beads reports itself locked
        const locked: GameOutput = await bobCell.callZome({
            zome_name: ZOME,
            fn_name: 'get_game',
            payload: created.entryHash,
        })
        assert.equal(locked.settings.locked, true)

        // --- update_game: a new GameSettings entry + a newer Settings link wins ---
        await aliceCell.callZome({
            zome_name: ZOME,
            fn_name: 'update_game',
            payload: {
                entryHash: created.entryHash,
                newSettings: sampleSettings({ topic: 'A second topic', numberOfTurns: 7 }),
            },
        })
        await dhtSync([alice, bob], aliceCell.cell_id[0])

        const updated: GameOutput = await bobCell.callZome({
            zome_name: ZOME,
            fn_name: 'get_game',
            payload: created.entryHash,
        })
        assert.equal(updated.settings.topic, 'A second topic')
        assert.equal(updated.settings.numberOfTurns, 7)

        // --- leave_game deletes the player link ---
        await bobCell.callZome({ zome_name: ZOME, fn_name: 'leave_game', payload: joinHash })
        await dhtSync([alice, bob], aliceCell.cell_id[0])

        const playersAfter: Uint8Array[] = await aliceCell.callZome({
            zome_name: ZOME,
            fn_name: 'get_players',
            payload: created.entryHash,
        })
        assert.equal(playersAfter.length, 0, 'leave_game removed the player link')
    })
})
