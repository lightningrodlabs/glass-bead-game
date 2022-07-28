import { ActionHash, DnaSource } from "@holochain/client";
import { pause, runScenario, Scenario  } from "@holochain/tryorama";
import path from "path";
import { Base64 } from "js-base64";
import test from "tape-promise/tape.js";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dnaPath = path.join(__dirname, "../../dna/workdir/dna/glassbeadgame.dna");

function serializeHash(hash: Uint8Array): string {
  return `u${Base64.fromUint8Array(hash, true)}`;
}

test("attestations basic tests", async (t) => {
  await runScenario(async (scenario: Scenario) => {

    const dnas: DnaSource[] = [{ path: dnaPath }];
    const [alice, bobbo] = await scenario.addPlayersWithHapps([dnas, dnas]);
    await scenario.shareAllAgents();

    const [alice_gbg] = alice.cells;
    const [bobbo_gbg] = bobbo.cells;
    const boboAgentKey = serializeHash(bobbo.agentPubKey);
    const aliceAgentKey = serializeHash(alice.agentPubKey);

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

    let create_game_output: any = await alice_gbg.callZome({
      zome_name: "glassbeadgame",
      fn_name: "create_game",
      payload: game1,
    }
    );
    console.log(create_game_output);
    t.ok(create_game_output);
    let game_output: any = await alice_gbg.callZome({
      zome_name: "glassbeadgame",
      fn_name: "get_game",
      payload: create_game_output.entryHash
    }
    );
    t.ok(game_output);
    t.deepEquals(game_output.game, game1)
    t.equals(game_output.entryHash, create_game_output.entryHash)
    t.equals(game_output.headerHash, create_game_output.headerHash)

    let games :Array<any>  = await alice_gbg.callZome({
      zome_name: "glassbeadgame",
      fn_name:"get_games",
    }
    );
    t.ok(games);
    t.deepEquals(games[0].game, game1)
    t.equals(games[0].entryHash, game_output.entryHash)
    t.equals(games[0].headerHash, game_output.headerHash)

    let players : Array<any> = await alice_gbg.callZome({
      zome_name: "glassbeadgame",
      fn_name: "get_players",
      payload: game_output.entryHash
    }
    );
    t.deepEquals(players, [])
    
    let join_headerHash = await alice_gbg.callZome({
      zome_name: "glassbeadgame",
      fn_name:"join_game",
      payload: {
        entryHash: game_output.entryHash,
        agent: aliceAgentKey
      }}
    );
    t.ok(join_headerHash)

    players = await alice_gbg.callZome({
      zome_name: "glassbeadgame",
      fn_name: "get_players",
      payload: game_output.entryHash
    }
    );
    t.equals(players[0][0], aliceAgentKey)
    t.equals(players[0][1], join_headerHash)
    await alice_gbg.callZome({
      zome_name: "glassbeadgame",
      fn_name: "leave_game",
      payload: join_headerHash
    }
    );

    players = await alice_gbg.callZome({
      zome_name: "glassbeadgame",
      fn_name: "get_players",
      payload: game_output.entryHash
    }
    );
    t.deepEquals(players, [])

    let comment1:any = await alice_gbg.callZome({
      zome_name: "glassbeadgame",
      fn_name:"create_comment",
      payload: { 
        entryHash: game_output.entryHash,
        comment: "comment1"
      }}
    );
    let comments:any = await alice_gbg.callZome({
      zome_name: "glassbeadgame",
      fn_name: "get_comments",
      payload: game_output.entryHash
    }
    );
    console.log("comments", comments)
    t.equals(comments[0].entryHash,comment1.entryHash)
    t.equals(comments[0].headerHash,comment1.headerHash)
    t.equals(comments[0].comment,"comment1")

    let bead1 = {content: "bead", index: 1}
    let create_bead1:any = await alice_gbg.callZome({
      zome_name: "glassbeadgame",
      fn_name:"create_bead",
      payload: { 
        entryHash: game_output.entryHash,
        bead: bead1
      }}
    );
    let beads: Array<any> = await alice_gbg.callZome({
      zome_name: "glassbeadgame",
      fn_name: "get_beads",
      payload: game_output.entryHash
    }
    );
    console.log("beads", beads)
    t.equals(beads[0].entryHash,create_bead1.entryHash)
    t.equals(beads[0].headerHash,create_bead1.headerHash)
    t.deepEquals(beads[0].bead, bead1)

  })
})
