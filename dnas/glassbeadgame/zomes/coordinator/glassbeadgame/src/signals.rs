use hdk::prelude::*;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CommentSignal {
    pub agent_key: AgentPubKey,
    pub text: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct NewTopicSignal {
    pub agent_key: AgentPubKey,
    pub topic: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct NewTopicImageSignal {
    pub agent_key: AgentPubKey,
    pub topic_image_url: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct NewBackgroundSignal {
    pub agent_key: AgentPubKey,
    pub sub_type: String,
    pub url: String,
    pub start_time: usize,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StartGameSignal {
    pub agent_key: AgentPubKey,
    pub data: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StopGameSignal {
    pub agent_key: AgentPubKey,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LeaveGameSignal {
    pub agent_key: AgentPubKey,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct NewBeadSignal {
    pub agent_key: AgentPubKey,
    #[serde(with = "serde_bytes")]
    pub audio: Vec<u8>,
    pub index: usize,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SignalRequest {
    pub agent_key: AgentPubKey,
    pub signal: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SignalResponse {
    pub agent_key: AgentPubKey,
    pub signal: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RefreshRequestSignal {
    pub agent_key: AgentPubKey,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StreamDisconnectedSignal {
    pub agent_key: AgentPubKey,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
#[serde(tag = "type", content = "content")]
pub enum Message {
    NewPlayer(AgentPubKey),
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
    StreamDisconnected(StreamDisconnectedSignal),
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SignalPayload {
    pub game_hash: EntryHash,
    pub message: Message,
}

impl SignalPayload {
    pub fn new(game_hash: EntryHash, message: Message) -> Self {
        SignalPayload { game_hash, message }
    }
}

#[hdk_extern]
fn recv_remote_signal(payload: SignalPayload) -> ExternResult<()> {
    emit_signal(&payload)
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NotifyInput {
    pub folks: Vec<AgentPubKey>,
    pub signal: SignalPayload,
}

#[hdk_extern]
fn notify(input: NotifyInput) -> ExternResult<()> {
    send_remote_signal(input.signal, input.folks)?;
    Ok(())
}
