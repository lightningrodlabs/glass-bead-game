import { defineConfig } from '@theweave/cli'

export default defineConfig({
    toolCurations: [
        {
            url: 'https://raw.githubusercontent.com/lightningrodlabs/weave-tool-curation/refs/heads/test-0.14/0.14/lists/curations-0.14.json',
            useLists: ['default'],
        },
    ],
    groups: [
        {
            name: 'Lightning Rod Labs',
            networkSeed: 'glassbeadgame-dev-seed-001',
            icon: { type: 'filesystem', path: './we_dev/lrl-icon.png' },
            creatingAgent: {
                agentIdx: 1,
                agentProfile: {
                    nickname: 'Zippy',
                    avatar: { type: 'filesystem', path: './we_dev/zippy.jpg' },
                },
            },
            joiningAgents: [
                {
                    agentIdx: 2,
                    agentProfile: {
                        nickname: 'Zerbina',
                        avatar: { type: 'filesystem', path: './we_dev/zerbina.jpg' },
                    },
                },
            ],
            applets: [
                {
                    name: 'Glass Bead Game Hot Reload',
                    instanceName: 'Glass Bead Game Hot Reload',
                    registeringAgent: 1,
                    joiningAgents: [2],
                },
            ],
        },
    ],
    applets: [
        {
            name: 'Glass Bead Game Hot Reload',
            subtitle: 'play and grow',
            description: 'Holochain Glass Bead Game',
            icon: { type: 'filesystem', path: './we_dev/game.png' },
            source: { type: 'localhost', happPath: './workdir/glassbeadgame.happ', uiPort: 1420 },
        },
    ],
})
