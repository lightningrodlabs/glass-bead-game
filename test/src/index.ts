import { Orchestrator, Config, InstallAgentsHapps } from "@holochain/tryorama";
import path from "path";
import { Base64 } from "js-base64";

const conductorConfig = Config.gen();

// Construct proper paths for your DNAs
const glassbeadgameTest = path.join(__dirname, "../../dna/workdir/dna/glassbeadgame.dna");

// create an InstallAgentsHapps array with your DNAs to tell tryorama what
// to install into the conductor.
const installation: InstallAgentsHapps = [
  // agent 0
  [
    // happ 0
    [glassbeadgameTest],
  ],
];

function serializeHash(hash: Uint8Array): string {
  return `u${Base64.fromUint8Array(hash, true)}`;
}
const sleep = (ms) =>
  new Promise((resolve) => setTimeout(() => resolve(null), ms));

const orchestrator = new Orchestrator();

orchestrator.registerScenario(
  "glassbeadgame test app",
  async (s, t) => {
    const [alice, bob] = await s.players([conductorConfig, conductorConfig]);

    // install your happs into the coductors and destructuring the returned happ data using the same
    // array structure as you created in your installation array.
    const [[alice_common]] = await alice.installAgentsHapps(installation);
    const [[bob_common]] = await alice.installAgentsHapps(installation);
    const aliceAgentKey = serializeHash(alice_common.cells[0].cellId[1]);

    await s.shareAllNodes([alice, bob])

    let game1 = {
      topic: "testing",
      locked: false,
      intro_duration: 30,
      number_of_turns: 3,
      move_duration: 60,
      interval_duration: 0,
    }

    let create_game_output = await alice_common.cells[0].call(
      "glassbeadgame",
      "create_game",
      game1,
    );
    console.log(create_game_output);
    t.ok(create_game_output);
    
    let game_output = await alice_common.cells[0].call(
      "glassbeadgame",
      "get_game",
      create_game_output.entry_hash
    );
    t.ok(game_output);
    t.deepEquals(game_output.game, game1)
    t.equals(game_output.entry_hash, create_game_output.entry_hash)
    t.equals(game_output.header_hash, create_game_output.header_hash)

    let games = await alice_common.cells[0].call(
      "glassbeadgame",
      "get_games",
    );
    t.ok(games);
    t.deepEquals(games[0].game, game1)
    t.equals(games[0].entry_hash, game_output.entry_hash)
    t.equals(games[0].header_hash, game_output.header_hash)

    let players = await alice_common.cells[0].call(
      "glassbeadgame",
      "get_players",
      game_output.entry_hash
    );
    t.deepEquals(players, [])
    
    let join_header_hash = await alice_common.cells[0].call(
      "glassbeadgame",
      "join_game",
      {
        entry_hash: game_output.entry_hash,
        agent: aliceAgentKey
      }
    );
    t.ok(join_header_hash)

    players = await alice_common.cells[0].call(
      "glassbeadgame",
      "get_players",
      game_output.entry_hash
    );
    t.equals(players[0][0], aliceAgentKey)
    t.equals(players[0][1], join_header_hash)
    await alice_common.cells[0].call(
      "glassbeadgame",
      "leave_game",
      join_header_hash
    );

    players = await alice_common.cells[0].call(
      "glassbeadgame",
      "get_players",
      game_output.entry_hash
    );
    t.deepEquals(players, [])
  }
);
orchestrator.run();

