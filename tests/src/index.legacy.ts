import { ActionHash, AppBundleSource, DnaSource, encodeHashToBase64 } from "@holochain/client";
import { AppOptions, pause, runScenario, Scenario  } from "@holochain/tryorama";
import path from "path";
import { Base64 } from "js-base64";
import test from "tape-promise/tape.js";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dnaPath = path.join(__dirname, "../../dna/workdir/dna/glassbeadgame.dna");

test("gbg basic tests", async (t) => {
  await runScenario(async (scenario: Scenario) => {
    console.log("FISH1")
    const dnas: DnaSource[] = [{ path: dnaPath }];
    let bundleList: Array<{
      appBundleSource: AppBundleSource;
      options?: AppOptions;
    }> = []
    bundleList.push({appBundleSource: { path: dnaPath }, options: {installedAppId:'glassbeadgame'}})
    try {

    const [alice, bobbo] = await scenario.addPlayersWithApps(bundleList);
    console.log("FISH2")
    await scenario.shareAllAgents();
    console.log("FISH3")

    const [alice_gbg] = alice.cells;
    const [bobbo_gbg] = bobbo.cells;
    const boboAgentKey = encodeHashToBase64(bobbo.agentPubKey);
    const aliceAgentKey = encodeHashToBase64(alice.agentPubKey);

    let game1 = {
      topic: "testing",
      topicGroup: "testing",
      description: "",
      topicImageUrl: "",
      backgroundImage: "",
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
    t.equals(game_output.actionHash, create_game_output.actionHash)

    let games :Array<any>  = await alice_gbg.callZome({
      zome_name: "glassbeadgame",
      fn_name:"get_games",
    }
    );
    t.ok(games);
    t.deepEquals(games[0].game, game1)
    t.equals(games[0].entryHash, game_output.entryHash)
    t.equals(games[0].actionHash, game_output.actionHash)

    let players : Array<any> = await alice_gbg.callZome({
      zome_name: "glassbeadgame",
      fn_name: "get_players",
      payload: game_output.entryHash
    }
    );
    t.deepEquals(players, [])
    
    let join_actionHash = await alice_gbg.callZome({
      zome_name: "glassbeadgame",
      fn_name:"join_game",
      payload: {
        entryHash: game_output.entryHash,
        agentKey: aliceAgentKey
      }}
    );
    t.ok(join_actionHash)

    players = await alice_gbg.callZome({
      zome_name: "glassbeadgame",
      fn_name: "get_players",
      payload: game_output.entryHash
    }
    );
    t.equals(players[0][0], aliceAgentKey)
    t.equals(players[0][1], join_actionHash)
    await alice_gbg.callZome({
      zome_name: "glassbeadgame",
      fn_name: "leave_game",
      payload: join_actionHash
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
    t.equals(comments[0].actionHash,comment1.actionHash)
    t.equals(comments[0].comment,"comment1")

    let bead1 = {content: "bead", agentKey:aliceAgentKey, audio: [], index: 1}
    let create_bead1:any 
    try {
      create_bead1 = await alice_gbg.callZome({
        zome_name: "glassbeadgame",
        fn_name:"create_bead",
        payload: { 
          entryHash: game_output.entryHash,
          bead: bead1
        }}
      );
    } catch (e) {
      console.log("error", e)
    }

    let beads: Array<any> = await alice_gbg.callZome({
      zome_name: "glassbeadgame",
      fn_name: "get_beads",
      payload: game_output.entryHash
    }
    );
    console.log("beads", beads)
    t.equals(beads[0].entryHash,create_bead1.entryHash)
    t.equals(beads[0].actionHash,create_bead1.actionHash)

    t.deepEquals(beads[0].bead.agentKey, aliceAgentKey)
    t.deepEquals(beads[0].bead.index, 1)

    const updatedGame = {...game1,
      topic: "fish"
    }

    let update_game_output: any= await alice_gbg.callZome({
      zome_name: "glassbeadgame",
      fn_name: "update_game",
      payload: {gameEntryHash: create_game_output.entryHash, game: updatedGame}
    }
    );

    let updatedGames: Array<any>  = await alice_gbg.callZome({
      zome_name: "glassbeadgame",
      fn_name:"get_games",
    }
    );
    t.ok(updatedGames);
    t.deepEquals(updatedGames[0].game, game1)
    t.equals(updatedGames[0].entryHash, update_game_output.entryHash)
    t.equals(updatedGames[0].actionHash, update_game_output.actionHash)

    }catch(e) {
      console.log("ERROR",e)
    }
  })


})
