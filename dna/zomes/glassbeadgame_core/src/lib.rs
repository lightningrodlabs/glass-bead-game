use hdi::prelude::*;

/// entry definition
/// 
#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
#[derive(Clone)]
pub struct Game {
    pub topic : String,
    pub topic_group: String,
    pub topic_image_url: String,
    pub description: String,
    pub background_video_url: String,
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
pub struct Bead {
    pub content : String,
    pub index: usize,
}

#[hdk_entry_helper]
#[derive(Clone)]
#[serde(rename_all = "camelCase")]
pub struct Comment {
    pub comment : String,
}

#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    #[entry_def(required_validations = 5)]
    Game(Game),
    #[entry_def(required_validations = 5)]
    Bead(Bead), 
    #[entry_def(required_validations = 5)]
    Comment(Comment), 
}

#[hdk_link_types]
pub enum LinkTypes {
    Comment,
    Game,
    Player,
    Bead,
}
