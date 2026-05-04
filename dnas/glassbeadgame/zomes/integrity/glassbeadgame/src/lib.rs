use hdi::prelude::*;

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
    pub topic: String,
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
pub struct Comment {
    pub text: String,
}

#[hdk_entry_helper]
#[derive(Clone)]
#[serde(rename_all = "camelCase")]
pub struct Bead {
    #[serde(with = "serde_bytes")]
    pub audio: Vec<u8>,
    pub index: usize,
}

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
#[hdk_entry_types]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    Game(Game),
    GameSettings(GameSettings),
    Comment(Comment),
    Bead(Bead),
}

#[derive(Serialize, Deserialize)]
#[hdk_link_types]
pub enum LinkTypes {
    Game,
    Settings,
    Player,
    Comment,
    Bead,
}

#[hdk_extern]
pub fn validate(_op: Op) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
