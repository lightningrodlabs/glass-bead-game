import {
    AppClient,
    AgentPubKey,
    ActionHash,
    EntryHash,
    RoleNameCallZomeRequest,
} from '@holochain/client'
import {
    GameOutput,
    GameSettingsData,
    Signal,
    JoinGameInput,
    CreateOutput,
    BeadInput,
    CommentInput,
    CommentOutput,
    BeadOutput,
    CreateGameOutput,
    UpdateGameInput,
} from '@src/GameTypes'

export default class GlassBeadGameService {
    constructor(
        public client: AppClient,
        public roleName: string,
        protected zomeName = 'glassbeadgame'
    ) {}

    get myAgentPubKey(): AgentPubKey {
        return this.client.myPubKey
    }

    async createGame(game: GameSettingsData): Promise<CreateGameOutput> {
        return this.callZome('create_game', game)
    }

    async getGames(): Promise<Array<GameOutput>> {
        return this.callZome('get_games', null)
    }

    async getGame(input: EntryHash): Promise<GameOutput> {
        return this.callZome('get_game', input)
    }

    async joinGame(input: JoinGameInput): Promise<ActionHash> {
        return this.callZome('join_game', input)
    }

    async getPlayers(input: EntryHash): Promise<Array<AgentPubKey>> {
        return this.callZome('get_players', input)
    }

    async leaveGame(input: ActionHash): Promise<ActionHash> {
        return this.callZome('leave_game', input)
    }

    async updateGame(input: UpdateGameInput): Promise<ActionHash> {
        return this.callZome('update_game', input)
    }

    async createComment(input: CommentInput): Promise<CreateOutput> {
        return this.callZome('create_comment', input)
    }

    async getComments(input: EntryHash): Promise<CommentOutput[]> {
        return this.callZome('get_comments', input)
    }

    async createBead(input: BeadInput): Promise<CreateOutput> {
        return this.callZome('create_bead', input)
    }

    async getBeads(input: EntryHash): Promise<BeadOutput[]> {
        return this.callZome('get_beads', input)
    }

    async notify(signal: Signal, folks: Array<AgentPubKey>): Promise<void> {
        return this.callZome('notify', { signal, folks })
    }

    private callZome(fnName: string, payload: any) {
        const req: RoleNameCallZomeRequest = {
            role_name: this.roleName,
            zome_name: this.zomeName,
            fn_name: fnName,
            payload,
        }
        return this.client.callZome(req)
    }
}
