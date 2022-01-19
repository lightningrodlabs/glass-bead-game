import { Orchestrator, Config, InstallAgentsHapps } from "@holochain/tryorama";
import path from "path";

const conductorConfig = Config.gen();

// Construct proper paths for your DNAs
const wecoTest = path.join(__dirname, "../../dna/workdir/dna/weco.dna");

// create an InstallAgentsHapps array with your DNAs to tell tryorama what
// to install into the conductor.
const installation: InstallAgentsHapps = [
  // agent 0
  [
    // happ 0
    [wecoTest],
  ],
];

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(() => resolve(null), ms));

const orchestrator = new Orchestrator();

orchestrator.registerScenario(
  "weco test app",
  async (s, t) => {
    const [alice, bob] = await s.players([conductorConfig, conductorConfig]);

    // install your happs into the coductors and destructuring the returned happ data using the same
    // array structure as you created in your installation array.
    const [[alice_common]] = await alice.installAgentsHapps(installation);
    const [[bob_common]] = await alice.installAgentsHapps(installation);

    await s.shareAllNodes([alice, bob])

    let alice_message = await alice_common.cells[0].call(
        "weco",
        "create_room",
        {
            room_name : "test"
        }
    );
    console.log(alice_message);
    t.ok(alice_message);

    alice_message = await alice_common.cells[0].call(
        "weco",
        "get_rooms",
        null
    );
    console.log(alice_message);
    t.ok(alice_message);

    alice_message = await alice_common.cells[0].call(
        "weco",
        "join_room",
        {
            room_name : "test",
            room_user : {
                name : "testuser",
                agent : alice_common.agent
            }
        }
    );
    console.log(alice_message);
    t.ok(alice_message);

    let bob_message = await bob_common.cells[0].call(
        "weco",
        "join_room",
        {
            room_name : "test",
            room_user : {
                name : "testuser1",
                agent : bob_common.agent
            }
        }
    );
    console.log(bob_message);
    t.ok(bob_message);

    bob_message = await bob_common.cells[0].call(
        "weco",
        "get_users",
        {
            room_name : "test",
            room_user : {
                name : "testuser1",
                agent : bob_common.agent
            }
        }
    );
    console.log(bob_message);
    t.ok(bob_message);

    alice_message = await alice_common.cells[0].call(
        "weco",
        "get_rooms",
        null
    );
    console.log(alice_message);
    t.ok(alice_message);

    alice_message = await alice_common.cells[0].call(
        "weco",
        "leave_room",
        {
            room_name : "test",
            room_user : {
                name : "testuser",
                agent : alice_common.agent
            }
        }
    );
    console.log(alice_message);
    t.ok(alice_message);

    alice_message = await alice_common.cells[0].call(
        "weco",
        "get_rooms",
        null
    );
    console.log(alice_message);
    t.ok(alice_message);

    bob_message = await bob_common.cells[0].call(
        "weco",
        "get_rooms",
        null
    );
    console.log(bob_message);
    t.ok(bob_message);

    alice_message = await alice_common.cells[0].call(
        "weco",
        "send_notification",
        {
            room_name : "test",
            room_user : {
                name: "testuser",
                agent: alice_common.agent,
            },
            message: "test message"
        }
    );
    console.log(alice_message);
    t.ok(alice_message);
  }
);
orchestrator.run();

