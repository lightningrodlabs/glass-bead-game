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
      topicGroup: "testing",
      description: "",
      topicImageUrl: "",
      backgroundVideoUrl: "",
      backgroundVideoStartTime: 0,
      locked: false,
      introDuration: 30,
      outroDuration: 0,
      numberOfTurns: 3,
      moveDuration: 60,
      intervalDuration: 0,
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
      create_game_output.entryHash
    );
    t.ok(game_output);
    t.deepEquals(game_output.game, game1)
    t.equals(game_output.entryHash, create_game_output.entryHash)
    t.equals(game_output.headerHash, create_game_output.headerHash)

    let games = await alice_common.cells[0].call(
      "glassbeadgame",
      "get_games",
    );
    t.ok(games);
    t.deepEquals(games[0].game, game1)
    t.equals(games[0].entryHash, game_output.entryHash)
    t.equals(games[0].headerHash, game_output.headerHash)

    let players = await alice_common.cells[0].call(
      "glassbeadgame",
      "get_players",
      game_output.entryHash
    );
    t.deepEquals(players, [])
    
    let join_headerHash = await alice_common.cells[0].call(
      "glassbeadgame",
      "join_game",
      {
        entryHash: game_output.entryHash,
        agent: aliceAgentKey
      }
    );
    t.ok(join_headerHash)

    players = await alice_common.cells[0].call(
      "glassbeadgame",
      "get_players",
      game_output.entryHash
    );
    t.equals(players[0][0], aliceAgentKey)
    t.equals(players[0][1], join_headerHash)
    await alice_common.cells[0].call(
      "glassbeadgame",
      "leave_game",
      join_headerHash
    );

    players = await alice_common.cells[0].call(
      "glassbeadgame",
      "get_players",
      game_output.entryHash
    );
    t.deepEquals(players, [])

    let comment1 = await alice_common.cells[0].call(
      "glassbeadgame",
      "create_comment",
      { 
        entryHash: game_output.entryHash,
        comment: "comment1"
      }
    );
    let comments = await alice_common.cells[0].call(
      "glassbeadgame",
      "get_comments",
      game_output.entryHash
    );
    console.log("comments", comments)
    t.equals(comments[0].entryHash,comment1.entryHash)
    t.equals(comments[0].headerHash,comment1.headerHash)
    t.equals(comments[0].comment,"comment1")

    let bead1 = {content: "bead", index: 1}
    let create_bead1 = await alice_common.cells[0].call(
      "glassbeadgame",
      "create_bead",
      { 
        entryHash: game_output.entryHash,
        bead: bead1
      }
    );
    let beads = await alice_common.cells[0].call(
      "glassbeadgame",
      "get_beads",
      game_output.entryHash
    );
    console.log("beads", beads)
    t.equals(beads[0].entryHash,create_bead1.entryHash)
    t.equals(beads[0].headerHash,create_bead1.headerHash)
    t.deepEquals(beads[0].bead, bead1)

  }
);
orchestrator.run();

