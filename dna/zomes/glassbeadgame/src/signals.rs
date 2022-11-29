use holo_hash::{AgentPubKeyB64, EntryHashB64};
use glassbeadgame_core::{Player};
use crate::game::*;

// #[derive(Serialize, Deserialize, Debug)]
// #[serde(rename_all = "camelCase")]
// pub struct NewGameSignal {
//     // agent_key: String,
//     game: Game,
// }

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CommentSignal {
    player: Player,
    text: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NewTopicSignal {
    agent_key: AgentPubKeyB64,
    topic: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NewTopicImageSignal {
    agent_key: AgentPubKeyB64,
    topic_image_url: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NewBackgroundSignal {
    agent_key: AgentPubKeyB64,
    sub_type: String,
    url: String,
    start_time: usize
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct StartGameSignal {
    agent_key: AgentPubKeyB64,
    data: String
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct StopGameSignal {
    agent_key: AgentPubKeyB64
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LeaveGameSignal {
    agent_key: AgentPubKeyB64
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NewBeadSignal {
    agent_key: AgentPubKeyB64,
    #[serde(with = "serde_bytes")]
    audio: Vec<u8>,
    index: usize
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SignalRequest {
    agent_key: AgentPubKeyB64,
    signal: String
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SignalResponse {
    agent_key: AgentPubKeyB64,
    signal: String
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RefreshRequestSignal {
    agent_key: AgentPubKeyB64
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct StreamDisconnectedSignal {
    agent_key: AgentPubKeyB64
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(tag = "type", content = "content")]
pub enum Message {
    // NewGame(NewGameSignal),
    NewPlayer(Player),
    NewComment(CommentSignal),
    NewTopic(NewTopicSignal),
    NewTopicImage(NewTopicImageSignal),
    NewBackground(NewBackgroundSignal),
    StartGame(StartGameSignal),
    StopGame(StopGameSignal),
    LeaveGame(LeaveGameSignal),
    NewBead(NewBeadSignal),
    NewSignalRequest(SignalRequest),
    NewSignalResponse(SignalResponse),
    RefreshRequest(RefreshRequestSignal),
    StreamDisconnected(StreamDisconnectedSignal)
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SignalPayload {
    game_hash: EntryHashB64,
    message: Message,
}

impl SignalPayload {
    pub fn new(game_hash: EntryHashB64, message: Message) -> Self {
        SignalPayload {
            game_hash,
            message,
        }
    }
}

#[hdk_extern]
fn recv_remote_signal(signal: ExternIO) -> ExternResult<()> {
    let sig: SignalPayload = signal.decode().map_err(|e| wasm_error!(e.into()))?;
    Ok(emit_signal(&sig)?)
}

/// Input to the notify call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NotifyInput {
    pub folks: Vec<AgentPubKeyB64>,
    pub signal: SignalPayload,
}

#[hdk_extern]
fn notify(input: NotifyInput) -> ExternResult<()> {
    let mut folks: Vec<AgentPubKey> = vec![];
    for a in input.folks.clone() {
        folks.push(a.into())
    }
    remote_signal(ExternIO::encode(input.signal).map_err(|e| wasm_error!(e.into()))?,folks)?;
    Ok(())
}
