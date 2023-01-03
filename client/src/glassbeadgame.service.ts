/* eslint-disable camelcase */
/* eslint-disable no-useless-constructor */
import {
    AppAgentClient,
    EntryHashB64,
    AgentPubKeyB64,
    ActionHashB64,
    AppAgentCallZomeRequest,
} from '@holochain/client'
import { serializeHash } from '@holochain-open-dev/utils'
import {
    Player,
    GameOutput,
    GameSettingsData,
    Signal,
    JoinGameInput,
    CreateOutput,
    Bead,
    CommentOutput,
    BeadOutput,
    IComment,
    CreateGameOutput,
    UpdateGameInput,
} from '@src/GameTypes'

export default class GlassBeadGameService {
    constructor(
        public client: AppAgentClient,
        public roleName,
        protected zomeName = 'glassbeadgame'
    ) {}

    get myAgentPubKey(): AgentPubKeyB64 {
        return serializeHash(this.client.myPubKey)
    }

    async savePlayerDetails(player: Player): Promise<ActionHashB64> {
        return this.callZome('save_player_details', player)
    }

    async getPlayerDetails(agentKey: string): Promise<Player> {
        return this.callZome('get_player_details', agentKey)
    }

    async createGame(game: GameSettingsData): Promise<CreateGameOutput> {
        return this.callZome('create_game', game)
    }

    async getGames(): Promise<Array<GameOutput>> {
        return this.callZome('get_games', null)
    }

    async getGame(input: EntryHashB64): Promise<GameOutput> {
        return this.callZome('get_game', input)
    }

    async joinGame(input: JoinGameInput): Promise<ActionHashB64> {
        return this.callZome('join_game', input)
    }

    async getPlayers(input: EntryHashB64): Promise<Array<Player>> {
        return this.callZome('get_players', input)
    }

    async leaveGame(input: ActionHashB64): Promise<ActionHashB64> {
        return this.callZome('leave_game', input)
    }

    async updateGame(input: UpdateGameInput): Promise<ActionHashB64> {
        return this.callZome('update_game', input)
    }

    async createComment(input: IComment): Promise<CreateOutput> {
        return this.callZome('create_comment', input)
    }

    async getComments(input: EntryHashB64): Promise<CommentOutput[]> {
        return this.callZome('get_comments', input)
    }

    async createBead(input: Bead): Promise<CreateOutput> {
        return this.callZome('create_bead', input)
    }

    async getBeads(input: EntryHashB64): Promise<BeadOutput> {
        return this.callZome('get_beads', input)
    }

    async notify(signal: Signal, folks: Array<AgentPubKeyB64>): Promise<void> {
        return this.callZome('notify', { signal, folks })
    }

    private callZome(fnName: string, payload: any) {
        const req: AppAgentCallZomeRequest = {
            role_name: this.roleName,
            zome_name: this.zomeName,
            fn_name: fnName,
            payload,
        }
        return this.client.callZome(req)
    }
}
