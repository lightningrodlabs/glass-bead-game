use hdi::prelude::*;
use hdk::prelude::{holo_hash::{AgentPubKeyB64}};
/// entry definition
/// 
#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
#[derive(Clone)]
pub struct Game {
    pub id: ActionHash,
}

#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
#[derive(Clone)]
pub struct GameSettings {
    pub topic : String,
    pub topic_group: String,
    pub topic_image_url: String,
    pub description: String,
    pub background_image: String,
    pub background_video: String,
    pub background_video_start_time: usize,
    pub locked: bool,
    pub intro_duration: usize,
    pub outro_duration: usize,
    pub number_of_turns: usize,
    pub move_duration: usize,
    pub interval_duration: usize,
}

#[hdk_entry_helper]
#[derive(Clone)]
#[serde(rename_all = "camelCase")]
pub struct Player {
    pub agent_key: AgentPubKeyB64,
    pub name: String,
    pub image: String,
}

#[hdk_entry_helper]
#[derive(Clone)]
#[serde(rename_all = "camelCase")]
pub struct Comment {
    pub text : String,
}

#[hdk_entry_helper]
#[derive(Clone)]
#[serde(rename_all = "camelCase")]
pub struct Bead {
    pub agent_key: String,
    #[serde(with = "serde_bytes")]
    pub audio: Vec<u8>,
    pub index: usize
}

#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    #[entry_def(required_validations = 5)]
    Game(Game),
    #[entry_def(required_validations = 5)]
    GameSettings(GameSettings),
    #[entry_def(required_validations = 5)]
    Player(Player),
    #[entry_def(required_validations = 5)]
    Comment(Comment),
    #[entry_def(required_validations = 5)]
    Bead(Bead), 
}

#[hdk_link_types]
pub enum LinkTypes {
    Game,
    Settings,
    Player,
    Comment,
    Bead,
}
