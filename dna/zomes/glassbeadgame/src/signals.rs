use holo_hash::{AgentPubKeyB64, EntryHashB64};

use crate::game::*;

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(tag = "type", content = "content")]
pub enum Message {
    NewPlayer(AgentPubKeyB64),
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
    let sig: SignalPayload = signal.decode()?;
    debug!("Received signal {:?}", sig);
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
    debug!("Sending signal {:?} to {:?}", input.signal, input.folks);
    remote_signal(ExternIO::encode(input.signal)?, folks)?;
    Ok(())
}
