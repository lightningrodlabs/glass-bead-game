import { CellClient } from '@holochain-open-dev/cell-client';
import { serializeHash, EntryHashB64, AgentPubKeyB64, HeaderHashB64 } from '@holochain-open-dev/core-types';
import {GameOutput, Game, Signal, JoinGameInput, CreateOutput, Bead, CommentOutput, BeadOutput} from './types';

export class GlassBeadGameService {
  constructor(
    public cellClient: CellClient,
    protected zomeName = 'glassbeadgame'
  ) {}

  get myAgentPubKey() : AgentPubKeyB64 {
    return serializeHash(this.cellClient.cellId[1]);
  }

  async createGame(game: Game): Promise<CreateOutput> {
    return this.callZome('create_game', game);
  }

  async joinGame(input: JoinGameInput): Promise<HeaderHashB64> {
    return this.callZome('join_game', input);
  }

  async getPlayers(input: EntryHashB64): Promise<Array<[AgentPubKeyB64, HeaderHashB64]>> {
    return this.callZome('get_players', input);
  }

  async leaveGame(input: HeaderHashB64): Promise<HeaderHashB64> {
    return this.callZome('leave_game', input);
  }

  async getGames(): Promise<Array<GameOutput>> {
    return this.callZome('get_games', null);
  }

  async getGame(input: EntryHashB64): Promise<GameOutput> {
    return this.callZome('get_game', input);
  }

  async createComment(input: Comment): Promise<CreateOutput> {
    return this.callZome('create_comment', input);
  }

  async getComments(input: EntryHashB64): Promise<CommentOutput> {
    return this.callZome('get_comments', input);
  }

  async createBead(input: Bead): Promise<CreateOutput> {
    return this.callZome('create_bead', input);
  }

  async getBeads(input: EntryHashB64): Promise<BeadOutput> {
    return this.callZome('get_beads', input);
  }

  async notify(signal: Signal, folks: Array<AgentPubKeyB64>): Promise<void> {
    return this.callZome('notify', {signal, folks});
  }

  private callZome(fn_name: string, payload: any) {
    return this.cellClient.callZome(this.zomeName, fn_name, payload);
  }
}
